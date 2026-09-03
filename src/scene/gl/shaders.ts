/** GLSL for the photographic renderer. WebGL2 / GLSL ES 3.00. */

export const VERTEX = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  // y runs downward, matching the rest of the scene code.
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const COMMON = `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float total = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    total += amp * valueNoise(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return total;
}

/** Two octaves are plenty for a wind flow field. */
float flowNoise(vec2 p) {
  return valueNoise(p) * 0.65 + valueNoise(p * 2.03) * 0.35;
}
`;

/**
 * Scene pass. The photograph is the subject; everything here either lights it,
 * moves its own pixels, or is weather in the air in front of it.
 */
export const SCENE_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;

uniform sampler2D uRidge;
uniform sampler2D uForest;
uniform sampler2D uLights;

uniform vec4 uRidgeRect;    // x, y, w, h in screen UV
uniform vec4 uForestRect;

uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uMoonColor;
uniform vec3 uHazeColor;
uniform vec3 uAmbient;

uniform vec2 uSunPos;       // screen UV
uniform vec2 uMoonPos;
uniform float uSunIntensity;
uniform float uMoonIntensity;
uniform float uMoonPhase;
uniform float uAmbientIntensity;
uniform float uGolden;
uniform float uHazeDensity;
uniform float uStarVisibility;
uniform float uNight;        // artificial light factor, 0 day … 1 night

uniform float uWind;         // signed, roughly -1 … 1
uniform float uCloudCover;
uniform float uRain;
uniform float uSnow;
uniform float uSnowCover;
uniform float uFlash;
uniform float uHorizonY;     // screen UV
uniform vec3 uLightSchedule; // how lit each of the three house groups is
uniform vec3 uLightTintA;    // colour of each group's windows
uniform vec3 uLightTintB;
uniform vec3 uLightTintC;

${COMMON}

vec3 skyGradient(vec2 uv) {
  float t = clamp(uv.y / max(uHorizonY, 0.001), 0.0, 1.0);
  return mix(uZenith, uHorizon, pow(t, 1.35));
}

float stars(vec2 uv) {
  if (uStarVisibility <= 0.01) return 0.0;
  vec2 p = uv * vec2(uResolution.x / uResolution.y, 1.0) * 210.0;
  vec2 cell = floor(p);
  float h = hash21(cell);
  float present = step(0.9955, h);
  vec2 f = fract(p) - 0.5;
  float d = length(f);
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + h * 2.6) + h * 90.0);
  // Extinction: fewer and dimmer stars close to the horizon.
  float extinction = smoothstep(uHorizonY, uHorizonY * 0.25, uv.y);
  return present * smoothstep(0.34, 0.0, d) * twinkle * extinction;
}

vec3 clouds(vec2 uv, vec3 base) {
  if (uCloudCover <= 0.02) return base;
  vec2 p = uv * vec2(1.6, 4.2);
  p.x += uTime * 0.004 * uWind * 6.0;
  float bank = fbm(p * 1.4);
  bank = smoothstep(0.42 - uCloudCover * 0.3, 0.9, bank);
  // Soft, wide and low contrast — cloud at this distance has no hard edge.
  float mask = bank * smoothstep(uHorizonY, uHorizonY * 0.1, uv.y) * uCloudCover;
  vec3 lit = mix(vec3(0.42), vec3(0.92), uAmbientIntensity);
  lit = mix(lit, uSunColor / 255.0, 0.35 * uSunIntensity);
  return mix(base, lit, clamp(mask * 0.75, 0.0, 0.85));
}

vec3 celestial(vec2 uv, vec3 base) {
  float aspect = uResolution.x / uResolution.y;
  vec2 d = (uv - uSunPos) * vec2(aspect, 1.0);
  float dist = length(d);

  // Sun: a small blown-out core with a tight glow. The wide veiling glare is
  // the lens pass's job, not a giant blob painted into the sky.
  float core = smoothstep(0.011, 0.006, dist);
  float glow = exp(-dist * 46.0) * 0.5 + exp(-dist * 15.0) * 0.13;
  vec3 sun = (uSunColor / 255.0) * (core * 1.7 + glow) * uSunIntensity;

  vec2 dm = (uv - uMoonPos) * vec2(aspect, 1.0);
  float distMoon = length(dm);
  float moonDisc = smoothstep(0.013, 0.010, distMoon);
  // Phase: the terminator is an offset disc cutting into the lit face.
  float shift = cos(uMoonPhase * 6.2831853) * 0.013;
  float lit = smoothstep(0.013, 0.010, length(dm - vec2(shift, 0.0)));
  float face = uMoonPhase < 0.5 ? moonDisc * (1.0 - lit * step(shift, 0.0))
                                : moonDisc * (1.0 - lit * step(0.0, shift));
  face = mix(moonDisc, face, 0.85);
  float moonGlow = exp(-distMoon * 16.0) * 0.5;
  vec3 moon = (uMoonColor / 255.0) * (face * 0.9 + moonGlow * 0.6)
            * uMoonIntensity * (1.0 - uSunIntensity * 0.8);

  return base + sun + moon;
}

/** Samples a plate, letting the wind move the vegetation inside it. */
vec4 plate(sampler2D tex, vec4 rect, vec2 uv, float windAmp, float sway) {
  vec2 p = (uv - rect.xy) / rect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0);

  vec4 base = texture(tex, p);
  // Vegetation reads as green-dominant and mid-dark; rock, roofs and road do
  // not, so only the trees are allowed to move.
  float veg = smoothstep(0.015, 0.11, base.g - 0.5 * (base.r + base.b) + 0.055);
  veg *= smoothstep(0.85, 0.4, base.g);

  float gust = 0.55 + 0.45 * sin(uTime * 0.7 + p.x * 3.0);
  vec2 flow = vec2(
    flowNoise(p * vec2(38.0, 96.0) + vec2(uTime * 0.55 * sway, uTime * 0.12)),
    flowNoise(p * vec2(44.0, 112.0) + 21.0 + vec2(uTime * 0.47 * sway, uTime * 0.1))
  );
  vec2 disp = (flow - 0.5) * windAmp * veg * gust;
  // Foliage swings along the wind far more than across it.
  disp.y *= 0.35;

  return texture(tex, p + disp);
}

/** Grades the photograph with the light of the moment. */
vec3 gradePhoto(vec3 color, float distance) {
  vec3 veil = mix(uAmbient / 255.0 * 0.30, uMoonColor / 255.0, 0.30 * uMoonIntensity);
  float darkness = clamp(1.0 - uAmbientIntensity, 0.0, 1.0);
  color = mix(color, veil, min(0.86, darkness * 0.92));
  color = mix(color, uSunColor / 255.0,
              0.08 * uSunIntensity + 0.24 * uGolden);
  color = mix(color, vec3(0.91, 0.93, 0.97), uSnowCover * 0.42);
  color = mix(color, uHazeColor / 255.0, uHazeDensity * 0.3 * distance);
  // A gentle photographic curve: a little contrast, a little colour.
  color = (color - 0.5) * 1.07 + 0.5;
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(luma), color, 1.1);
  return color;
}

vec3 houseLights(vec2 uv, vec3 base) {
  vec2 p = (uv - uRidgeRect.xy) / uRidgeRect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return base;
  vec3 lamps = texture(uLights, p).rgb;
  vec3 add = uLightTintA * lamps.r * uLightSchedule.r
           + uLightTintB * lamps.g * uLightSchedule.g
           + uLightTintC * lamps.b * uLightSchedule.b;
  return base + add * uNight * 0.5;
}

float rainMask(vec2 uv, float scale, float speed, float shear) {
  vec2 p = uv * vec2(scale * uResolution.x / uResolution.y, scale);
  p.x += p.y * shear;
  p.y -= uTime * speed;
  vec2 cell = floor(p);
  float h = hash21(cell);
  if (h < 0.972) return 0.0;
  vec2 f = fract(p);
  float streak = smoothstep(0.5, 0.0, abs(f.x - 0.5) * 12.0);
  streak *= smoothstep(0.0, 0.25, f.y) * smoothstep(1.0, 0.55, f.y);
  return streak;
}

float snowMask(vec2 uv, float scale, float speed, float drift) {
  vec2 p = uv * vec2(scale * uResolution.x / uResolution.y, scale);
  p.y -= uTime * speed;
  p.x += sin(uTime * 0.6 + p.y * 2.0) * drift + uTime * drift * 2.0;
  vec2 cell = floor(p);
  float h = hash21(cell);
  if (h < 0.986) return 0.0;
  vec2 f = fract(p) - 0.5;
  return smoothstep(0.34, 0.0, length(f));
}

void main() {
  vec2 uv = vUv;
  vec3 color = skyGradient(uv);
  color = clouds(uv, color);
  color += vec3(0.85, 0.9, 1.0) * stars(uv) * uStarVisibility * 0.9;
  color = celestial(uv, color);

  float windAmp = 0.0022 + 0.006 * abs(uWind);
  float sway = sign(uWind + 0.0001);

  vec4 ridge = plate(uRidge, uRidgeRect, uv, windAmp * 0.55, sway);
  if (ridge.a > 0.001) {
    color = mix(color, gradePhoto(ridge.rgb, 1.0), ridge.a);
  }
  color = houseLights(uv, color);

  vec4 forest = plate(uForest, uForestRect, uv, windAmp, sway);
  if (forest.a > 0.001) {
    color = mix(color, gradePhoto(forest.rgb, 0.35), forest.a);
  }

  // Valley fog, thickest just above the ground.
  float fog = clamp((uHazeDensity - 0.22) * 1.6, 0.0, 1.0);
  if (fog > 0.0) {
    float band = smoothstep(uHorizonY - 0.05, 1.0, uv.y);
    color = mix(color, uHazeColor / 255.0, band * fog * 0.75);
  }

  if (uRain > 0.01) {
    float drops = rainMask(uv, 26.0, 1.9, 0.35 * uWind)
                + rainMask(uv, 44.0, 2.9, 0.3 * uWind) * 0.7;
    color += vec3(0.62, 0.7, 0.82) * drops * uRain * (0.18 + 0.5 * uAmbientIntensity);
  }

  if (uSnow > 0.01) {
    float flakes = snowMask(uv, 30.0, 0.16, 0.05 * uWind)
                 + snowMask(uv, 52.0, 0.26, 0.08 * uWind) * 0.8;
    color += vec3(0.95, 0.96, 1.0) * flakes * uSnow * (0.3 + 0.6 * uAmbientIntensity);
  }

  color += vec3(0.72, 0.78, 1.0) * uFlash * 0.5;

  outColor = vec4(color, 1.0);
}`;

/** Lens pass: god rays, bloom, aberration, grain, vignette. */
export const POST_FRAGMENT = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uSunPos;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uNight;
uniform float uGrain;
uniform float uRays;   // 0 disables the crepuscular pass

${COMMON}

void main() {
  vec2 uv = vUv;
  vec2 centred = uv - 0.5;
  float radius = length(centred);

  // The scene was rendered with y running downward; the framebuffer stores it
  // the other way up, so every lookup into it is flipped back here.
  vec2 suv = vec2(uv.x, 1.0 - uv.y);
  vec2 sunUv = vec2(uSunPos.x, 1.0 - uSunPos.y);

  // Chromatic aberration grows toward the corners, as in a real lens.
  float ca = 0.0016 * radius * radius;
  vec3 color = vec3(
    texture(uScene, suv + centred * ca).r,
    texture(uScene, suv).g,
    texture(uScene, suv - centred * ca).b
  );

  // Bloom from the mip chain: cheap, wide, and shaped like real veiling glare.
  vec3 wide = textureLod(uScene, suv, 5.0).rgb;
  vec3 tight = textureLod(uScene, suv, 3.0).rgb;
  vec3 blurred = mix(tight, wide, 0.6);
  // Threshold on brightness, not per channel: a per-channel cut turns a blue
  // sky's glow cyan.
  float bl = dot(blurred, vec3(0.2126, 0.7152, 0.0722));
  vec3 bloom = blurred * smoothstep(0.62, 0.98, bl);
  color += bloom * 0.28;

  // Crepuscular rays: march toward the sun through the blurred scene.
  if (uRays > 0.5 && uSunIntensity > 0.02) {
    vec2 delta = (suv - sunUv) / 16.0;
    vec2 p = suv;
    float weight = 1.0;
    vec3 rays = vec3(0.0);
    for (int i = 0; i < 16; i++) {
      p -= delta;
      vec3 s = textureLod(uScene, p, 4.0).rgb;
      float sl = dot(s, vec3(0.2126, 0.7152, 0.0722));
      rays += s * smoothstep(0.62, 0.95, sl) * weight;
      weight *= 0.94;
    }
    color += rays / 16.0 * (uSunColor / 255.0) * uSunIntensity * 0.9;
  }

  // Vignette.
  color *= 1.0 - smoothstep(0.35, 0.95, radius) * (0.22 + 0.24 * uNight);

  // Film grain, stronger in the shadows exactly as it is at high ISO.
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float grain = hash21(uv * uResolution + fract(uTime) * 431.0) - 0.5;
  color += grain * uGrain * (0.6 + 0.9 * (1.0 - luma));

  outColor = vec4(color, 1.0);
}`;
