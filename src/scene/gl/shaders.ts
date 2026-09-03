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
uniform float uMoonUp;       // 0…1 how far the moon is above the horizon
uniform float uMoonIllum;    // lit fraction of the disc
uniform float uMoonWaxing;   // 1 while waxing, 0 while waning
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
uniform vec3 uSeasonTint;    // the colour the year lends the landscape
uniform float uSeasonDry;    // how far the green has gone to straw
uniform float uBirds;
uniform float uRidgeSway;    // sway in each plate's own coordinates
uniform float uForestSway;

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
  // Atmospheric scintillation is small and quick, not a blinking light.
  float twinkle = 0.88 + 0.12 * sin(uTime * (2.7 + h * 5.0) + h * 90.0);
  // Extinction: fewer and dimmer stars close to the horizon.
  float extinction = smoothstep(uHorizonY, uHorizonY * 0.25, uv.y);
  return present * smoothstep(0.2, 0.0, d) * twinkle * extinction;
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
  // Cloud hides the disc long before it hides the light: under an overcast
  // you get a bright patch of sky, never a hard-edged sun.
  float clear = pow(1.0 - clamp(uCloudCover, 0.0, 1.0), 2.2);
  float core = smoothstep(0.011, 0.006, dist) * clear;
  float glow = exp(-dist * 46.0) * 0.5 * mix(0.25, 1.0, clear)
             + exp(-dist * 15.0) * 0.13;
  vec3 sun = (uSunColor / 255.0) * (core * 1.7 + glow) * uSunIntensity;

  vec2 dm = (uv - uMoonPos) * vec2(aspect, 1.0);
  float distMoon = length(dm);
  float radius = 0.017;
  float moonDisc = smoothstep(radius, radius * 0.86, distMoon);

  // The terminator is an ellipse across the disc whose width is the lit
  // fraction; everything on the sunward side of it is lit.
  float ny = clamp(dm.y / radius, -1.0, 1.0);
  float halfWidth = sqrt(max(0.0, 1.0 - ny * ny));
  float xt = -(2.0 * uMoonIllum - 1.0) * radius * halfWidth;
  float side = uMoonWaxing > 0.5 ? (dm.x - xt) : (xt - dm.x);
  float litMask = smoothstep(-0.0007, 0.0007, side);
  float face = moonDisc * mix(0.07, 1.0, litMask);

  // Visible whenever it is up, even as a thin crescent — but a daytime moon
  // is a pale ghost, and cloud swallows it entirely.
  float presence = uMoonUp * (0.16 + 0.84 * uNight) * clear;
  float moonGlow = exp(-distMoon * 26.0) * 0.45 * (0.3 + 0.7 * uMoonIllum);
  vec3 moon = (uMoonColor / 255.0) * (face * (0.5 + 0.7 * uMoonIllum) + moonGlow)
            * presence;

  return base + sun + moon;
}

/** Samples a plate, letting the wind move the vegetation inside it. */
vec4 plate(sampler2D tex, vec4 rect, vec2 uv, float windAmp, float sway, float bleed) {
  // windAmp arrives already expressed in this plate's own coordinates, so the
  // movement is the same handful of screen pixels however far the plate is
  // zoomed. Scaling it in plate units made the foreground churn like water.
  vec2 p = (uv - rect.xy) / rect.zw;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 + bleed) return vec4(0.0);
  // Below its last row the plate repeats that row, so its bottom edge is a
  // smear hidden behind the wood rather than a ruled line across the valley.
  p.y = min(p.y, 1.0);

  vec4 base = texture(tex, p);
  // Vegetation reads as green-dominant and mid-dark; rock, roofs and road do
  // not, so only the trees are allowed to move.
  float veg = smoothstep(0.015, 0.11, base.g - 0.5 * (base.r + base.b) + 0.055);
  veg *= smoothstep(0.85, 0.4, base.g);

  // Foliage swings back and forth; a drifting noise field only shimmers.
  // Two frequencies and a per-place phase keep neighbouring crowns out of step.
  // A high spatial frequency keeps neighbouring crowns independent; a low one
  // slides the whole hillside about as a single sheet.
  float phase = valueNoise(p * vec2(90.0, 210.0)) * 6.2831853;
  float gust = 0.5 + 0.5 * sin(uTime * 0.27 + p.x * 2.4 + phase * 0.2);
  float swing = sin(uTime * 1.7 + phase) * 0.62 + sin(uTime * 3.3 + phase * 1.7) * 0.38;
  float amount = windAmp * veg * gust;
  vec2 disp = vec2(swing * sway * amount, abs(swing) * amount * 0.2);

  return texture(tex, p + disp);
}

/** Grades the photograph with the light of the moment. */
vec3 gradePhoto(vec3 color, float distance) {
  // The year first: it is a property of the hillside, not of the light on it.
  color *= uSeasonTint;
  float green = smoothstep(0.02, 0.12, color.g - 0.5 * (color.r + color.b) + 0.05);
  vec3 straw = vec3(color.g * 1.18, color.g * 1.02, color.g * 0.6);
  color = mix(color, straw, green * uSeasonDry * 0.7);

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


/**
 * Rain crosses the frame in a fraction of a second. Cells are tall and thin so
 * each drop is a dash, and the whole field is sheared by the wind.
 */
float rainMask(vec2 uv, float scale, float speed, float shear, float density) {
  // Many cells across and few down, so a drop is a hair-thin dash rather than
  // a block. The width here is roughly one pixel on screen.
  vec2 p = vec2(uv.x * scale * 3.2 * uResolution.x / uResolution.y, uv.y * scale);
  p.x += p.y * shear;
  p.y -= uTime * speed;
  vec2 cell = floor(p);
  float h = hash21(cell);
  if (h < density) return 0.0;
  vec2 f = fract(p);
  float streak = smoothstep(0.055, 0.0, abs(f.x - 0.5));
  float len = 0.22 + 0.34 * hash21(cell + 7.3);
  streak *= smoothstep(0.0, 0.035, f.y) * smoothstep(len, len - 0.18, f.y);
  return streak * (0.5 + 0.5 * hash21(cell + 19.7));
}

/** Snow drifts down in a handful of seconds, wandering as it goes. */
float snowMask(vec2 uv, float scale, float speed, float drift) {
  vec2 p = uv * vec2(scale * uResolution.x / uResolution.y, scale);
  p.y -= uTime * speed;
  p.x += sin(uTime * 0.5 + p.y * 1.6) * drift * 6.0 + uTime * drift * 3.0;
  vec2 cell = floor(p);
  float h = hash21(cell);
  if (h < 0.962) return 0.0;
  vec2 f = fract(p) - 0.5;
  // A flake is a couple of pixels, not a snowball.
  return smoothstep(0.07, 0.005, length(f)) * (0.55 + 0.45 * hash21(cell + 4.2));
}

/** One small dark mark with a shallow V of wings. */
float birdMark(vec2 uv, vec2 pos, float size, float flap) {
  vec2 d = (uv - pos) * vec2(uResolution.x / uResolution.y, 1.0) / size;
  float bend = flap * 0.5;
  float y = d.y + bend * (0.4 - abs(d.x) * 0.4);
  float along = max(abs(d.x) - 1.0, 0.0);
  return smoothstep(0.4, 0.0, sqrt(along * along + y * y * 3.0));
}

vec3 birds(vec2 uv, vec3 base) {
  if (uBirds < 0.01) return base;
  // A flock crosses every three quarters of a minute or so.
  float cycle = 46.0;
  float t = fract(uTime / cycle);
  float flight = floor(uTime / cycle);
  float dir = mod(flight, 2.0) < 1.0 ? 1.0 : -1.0;
  float visible = smoothstep(0.0, 0.02, t) * (1.0 - smoothstep(0.66, 0.74, t));
  if (visible < 0.01) return base;

  float lead = mix(-0.2, 1.2, t / 0.74);
  float height = 0.16 + hash21(vec2(flight, 3.0)) * 0.22;
  float mark = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float jitterX = hash21(vec2(flight, fi));
    float jitterY = hash21(vec2(fi, flight + 5.0));
    float lag = fi * 0.03 + jitterX * 0.05;
    float x = dir > 0.0 ? lead - lag : 1.0 - lead + lag;
    float y = height + (jitterY - 0.5) * 0.075 + sin(uTime * 0.8 + fi * 1.7) * 0.006;
    // Each bird beats at its own rate, as a real flock does.
    float flap = sin(uTime * (6.2 + jitterX * 3.0) + fi * 1.3);
    mark += birdMark(uv, vec2(x, y), 0.0045 + jitterY * 0.0022, flap);
  }
  return mix(base, base * 0.2, clamp(mark, 0.0, 1.0) * visible * uBirds);
}

void main() {
  vec2 uv = vUv;
  vec3 color = skyGradient(uv);
  color = clouds(uv, color);
  color += vec3(0.85, 0.9, 1.0) * stars(uv) * uStarVisibility * 0.9;
  color = celestial(uv, color);
  color = birds(uv, color);

  float sway = sign(uWind + 0.0001);

  vec4 ridge = plate(uRidge, uRidgeRect, uv, uRidgeSway, sway, 0.6);
  if (ridge.a > 0.001) {
    color = mix(color, gradePhoto(ridge.rgb, 1.0), ridge.a);
  }

  vec4 forest = plate(uForest, uForestRect, uv, uForestSway, sway, 0.0);
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
    float drops = rainMask(uv, 15.0, 33.0, 0.32 * uWind, 0.86)
                + rainMask(uv, 24.0, 50.0, 0.28 * uWind, 0.90) * 0.7;
    color += vec3(0.68, 0.75, 0.86) * drops * uRain * (0.16 + 0.34 * uAmbientIntensity);
  }

  if (uSnow > 0.01) {
    float flakes = snowMask(uv, 22.0, 4.2, 0.05 * uWind)
                 + snowMask(uv, 34.0, 6.6, 0.08 * uWind) * 0.8
                 + snowMask(uv, 52.0, 9.5, 0.11 * uWind) * 0.6;
    color += vec3(0.95, 0.96, 1.0) * flakes * uSnow * (0.4 + 0.6 * uAmbientIntensity);
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
