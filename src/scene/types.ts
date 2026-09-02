import type { MoonInfo, SkyBody } from "./astronomy";
import type { Holiday, Season } from "./calendar";
import type { Lighting } from "./palette";
import type { WeatherSnapshot } from "./weather";

export type Quality = "low" | "medium" | "high";

export type SceneOptions = {
  intensity: number;
  quality: Quality | "auto";
  wildlife: boolean;
  village: boolean;
  holidayThemes: boolean;
  latitude: number;
  longitude: number;
  plates: { sky: string; far: string; mid: string; near: string };
};

export type Wind = {
  /** Signed horizontal speed in m/s — positive blows to the right. */
  speed: number;
  /** Instantaneous gust component, already included in `speed`. */
  gust: number;
  /** −1…1 drive signal for anything that sways. */
  force: number;
};

export type Frame = {
  /** Seconds since the scene started. */
  time: number;
  /** Seconds since the previous frame, clamped. */
  dt: number;
  width: number;
  height: number;
  horizonY: number;
  groundY: number;
  lighting: Lighting;
  wind: Wind;
  weather: WeatherSnapshot;
  season: Season;
  /** 0 at the start of the season, 1 at its end. */
  seasonT: number;
  holiday: Holiday;
  resurrectionNight: boolean;
  sun: SkyBody;
  moon: MoonInfo;
  sunScreen: { x: number; y: number };
  moonScreen: { x: number; y: number };
  quality: Quality;
  intensity: number;
  /** Fraction of the ground covered by lying snow, 0–1. */
  snowCover: number;
  /** 0–1 lightning flash, drives a scene-wide brightening. */
  flash: number;
  now: Date;
};

export type Layer = {
  name: string;
  /** Called on resize and whenever the layer must rebuild cached geometry. */
  resize?: (frame: Frame) => void;
  update?: (frame: Frame) => void;
  draw: (ctx: CanvasRenderingContext2D, frame: Frame) => void;
};
