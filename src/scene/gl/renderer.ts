import { clamp, smoothstep } from "../noise";
import {
  PHOTO_PLATES,
  forestBox,
  ridgeBox,
} from "../photoScene";
import type { Frame } from "../types";
import { POST_FRAGMENT, SCENE_FRAGMENT, VERTEX } from "./shaders";

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader failed to compile: ${log}`);
  }
  return shader;
}

function link(gl: WebGL2RenderingContext, fragment: string, names: string[]): Program {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program failed to link: ${gl.getProgramInfoLog(program)}`);
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
}

const SCENE_UNIFORMS = [
  "uResolution", "uTime", "uRidge", "uForest", "uLights",
  "uRidgeRect", "uForestRect",
  "uZenith", "uHorizon", "uSunColor", "uMoonColor", "uHazeColor", "uAmbient",
  "uSunPos", "uMoonPos", "uSunIntensity", "uMoonIntensity", "uMoonPhase",
  "uAmbientIntensity", "uGolden", "uHazeDensity", "uStarVisibility", "uNight",
  "uWind", "uCloudCover", "uRain", "uSnow", "uSnowCover", "uFlash", "uHorizonY",
  "uLightSchedule", "uLightTintA", "uLightTintB", "uLightTintC",
];

const POST_UNIFORMS = [
  "uScene", "uResolution", "uTime", "uSunPos", "uSunColor", "uSunIntensity",
  "uNight", "uGrain", "uRays",
];

/** Windows are three groups of houses, each keeping its own hours. */
function lightSchedule(frame: Frame): [number, number, number] {
  const hour = frame.now.getHours() + frame.now.getMinutes() / 60;
  const groups: [number, number, number] = [0, 0, 0];
  const offsets = [0.1, 0.7, 1.4];
  const stamina = [0.4, 1.6, 2.8];
  for (let i = 0; i < 3; i++) {
    const evening = smoothstep(16.6 + offsets[i], 19.2 + offsets[i], hour);
    const late = hour >= 22 ? 1 - smoothstep(22 + stamina[i], 25 + stamina[i], hour) : 1;
    const morning = hour < 8 ? smoothstep(5.3 + offsets[i], 7, hour) * 0.75 : 0;
    groups[i] = clamp(Math.max(evening * late, morning));
  }
  return groups;
}

type Tint = [number, number, number];
const WARM: Tint = [1, 0.72, 0.42];

/** Holidays are expressed only as the colour of the village's lamps. */
function lightTints(frame: Frame): [Tint, Tint, Tint] {
  switch (frame.holiday) {
    // Kept close to warm white: a village at night is lamps with a hint of
    // colour, not a string of poster paint.
    case "christmas":
    case "newyear":
      return [[1, 0.6, 0.5], [0.72, 0.95, 0.72], WARM];
    case "independence":
    case "ohi":
      return [[0.6, 0.75, 1], [0.98, 0.98, 1], [0.6, 0.75, 1]];
    case "easter":
    case "patron":
      return [WARM, [1, 0.86, 0.6], WARM];
    default:
      return [WARM, WARM, WARM];
  }
}

export type GLRenderer = {
  resize: (width: number, height: number, dpr: number) => void;
  render: (frame: Frame) => void;
  dispose: () => void;
};

/**
 * Renders the scene on the GPU in two passes: the photograph, its light and
 * the weather, then a lens pass for rays, bloom, aberration and grain.
 *
 * The point of doing it here rather than on a 2D canvas is that the wind can
 * move the photograph's own pixels. The pines really sway; nothing is drawn
 * over them.
 */
export function createGLRenderer(canvas: HTMLCanvasElement): GLRenderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  let scene: Program;
  let post: Program;
  try {
    scene = link(gl, SCENE_FRAGMENT, SCENE_UNIFORMS);
    post = link(gl, POST_FRAGMENT, POST_UNIFORMS);
  } catch (error) {
    console.warn("[scene] WebGL unavailable:", error);
    return null;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function loadTexture(src: string): WebGLTexture {
    const texture = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    // One transparent pixel until the file arrives.
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, 1, 1, 0, gl!.RGBA, gl!.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]));
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, image);
      gl!.generateMipmap(gl!.TEXTURE_2D);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR_MIPMAP_LINEAR);
    };
    image.src = src;
    return texture;
  }

  const ridgeTex = loadTexture(PHOTO_PLATES.ridge.src);
  const forestTex = loadTexture(PHOTO_PLATES.forest.src);
  const lightsTex = loadTexture(PHOTO_PLATES.lights.src);

  // Offscreen target for the scene pass, mipmapped so the lens pass gets its
  // blur for free.
  const sceneTex = gl.createTexture()!;
  const fbo = gl.createFramebuffer()!;
  let bufferWidth = 0;
  let bufferHeight = 0;

  function resizeBuffer(width: number, height: number) {
    bufferWidth = Math.max(1, width);
    bufferHeight = Math.max(1, height);
    gl!.bindTexture(gl!.TEXTURE_2D, sceneTex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, bufferWidth, bufferHeight, 0,
      gl!.RGBA, gl!.UNSIGNED_BYTE, null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR_MIPMAP_LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, sceneTex, 0);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
  }

  return {
    resize(width, height, dpr) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      resizeBuffer(canvas.width, canvas.height);
    },

    render(frame) {
      if (bufferWidth !== canvas.width || bufferHeight !== canvas.height) {
        resizeBuffer(canvas.width, canvas.height);
      }

      const { lighting } = frame;
      const ridge = ridgeBox(frame.width, frame.height, frame.groundY);
      const forest = forestBox(frame.width, frame.height, frame.groundY);
      // A one percent push-in over ninety seconds: motion you feel, not see.
      const breath = 1 + 0.012 * (0.5 - 0.5 * Math.cos((frame.time / 90) * Math.PI * 2));

      const rect = (box: typeof ridge, grow: number) => {
        const w = (box.drawWidth / frame.width) * grow;
        const h = (box.drawHeight / frame.height) * grow;
        return [
          box.left / frame.width - (w - box.drawWidth / frame.width) / 2,
          box.top / frame.height - (h - box.drawHeight / frame.height) / 2,
          w,
          h,
        ] as const;
      };

      const schedule = lightSchedule(frame);
      const [tintA, tintB, tintC] = lightTints(frame);
      const u = scene.uniforms;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(scene.program);
      gl.bindVertexArray(vao);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, ridgeTex);
      gl.uniform1i(u.uRidge, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, forestTex);
      gl.uniform1i(u.uForest, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, lightsTex);
      gl.uniform1i(u.uLights, 2);

      gl.uniform2f(u.uResolution, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, frame.time);
      gl.uniform4f(u.uRidgeRect, ...rect(ridge, breath));
      gl.uniform4f(u.uForestRect, ...rect(forest, breath * 1.004));

      gl.uniform3fv(u.uZenith, lighting.zenith.map((c) => c / 255));
      gl.uniform3fv(u.uHorizon, lighting.horizon.map((c) => c / 255));
      gl.uniform3fv(u.uSunColor, lighting.sunColor);
      gl.uniform3fv(u.uMoonColor, lighting.moonColor);
      gl.uniform3fv(u.uHazeColor, lighting.hazeColor);
      gl.uniform3fv(u.uAmbient, lighting.ambient);

      gl.uniform2f(u.uSunPos, frame.sunScreen.x / frame.width, frame.sunScreen.y / frame.height);
      gl.uniform2f(u.uMoonPos, frame.moonScreen.x / frame.width, frame.moonScreen.y / frame.height);
      gl.uniform1f(u.uSunIntensity, lighting.sunIntensity);
      gl.uniform1f(u.uMoonIntensity, lighting.moonIntensity);
      gl.uniform1f(u.uMoonPhase, frame.moon.phase);
      gl.uniform1f(u.uAmbientIntensity, lighting.ambientIntensity);
      gl.uniform1f(u.uGolden, lighting.goldenFactor);
      gl.uniform1f(u.uHazeDensity, lighting.hazeDensity);
      gl.uniform1f(u.uStarVisibility, lighting.starVisibility);
      gl.uniform1f(u.uNight, lighting.artificialLight);
      gl.uniform1f(u.uHorizonY, frame.horizonY / frame.height);

      gl.uniform1f(u.uWind, frame.wind.force);
      gl.uniform1f(u.uCloudCover, frame.weather.cloudCover);
      gl.uniform1f(u.uRain,
        frame.weather.condition === "rain" ? frame.intensity
          : frame.weather.condition === "storm" ? frame.intensity * 1.3 : 0);
      gl.uniform1f(u.uSnow, frame.weather.condition === "snow" ? frame.intensity : 0);
      gl.uniform1f(u.uSnowCover, frame.snowCover);
      gl.uniform1f(u.uFlash, frame.flash);
      gl.uniform3f(u.uLightSchedule, schedule[0], schedule[1], schedule[2]);
      gl.uniform3fv(u.uLightTintA, tintA);
      gl.uniform3fv(u.uLightTintB, tintB);
      gl.uniform3fv(u.uLightTintC, tintC);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // ── Lens pass ─────────────────────────────────────────────────────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(post.program);
      const p = post.uniforms;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.uniform1i(p.uScene, 0);
      gl.uniform2f(p.uResolution, canvas.width, canvas.height);
      gl.uniform1f(p.uTime, frame.time);
      gl.uniform2f(p.uSunPos, frame.sunScreen.x / frame.width, frame.sunScreen.y / frame.height);
      gl.uniform3fv(p.uSunColor, lighting.sunColor);
      gl.uniform1f(p.uSunIntensity, lighting.sunIntensity);
      gl.uniform1f(p.uNight, lighting.artificialLight);
      gl.uniform1f(p.uGrain, frame.quality === "low" ? 0.03 : 0.055);
      gl.uniform1f(p.uRays, frame.quality === "low" ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },

    dispose() {
      gl.deleteProgram(scene.program);
      gl.deleteProgram(post.program);
      gl.deleteBuffer(quad);
      gl.deleteVertexArray(vao);
      gl.deleteTexture(ridgeTex);
      gl.deleteTexture(forestTex);
      gl.deleteTexture(lightsTex);
      gl.deleteTexture(sceneTex);
      gl.deleteFramebuffer(fbo);
    },
  };
}
