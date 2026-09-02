/**
 * Small shared bus so the forest can hand the particle layer things it drops
 * (leaves, blossom, acorns) without the two layers knowing about each other.
 */
export type SpawnKind = "leaf" | "petal" | "fruit" | "needle";

export type SpawnRequest = {
  x: number;
  y: number;
  kind: SpawnKind;
  /** 0–1 index into the season's foliage palette. */
  tone: number;
  size: number;
};

const queue: SpawnRequest[] = [];
const MAX_QUEUED = 240;

export function requestSpawn(request: SpawnRequest): void {
  if (queue.length < MAX_QUEUED) queue.push(request);
}

export function drainSpawns(): SpawnRequest[] {
  if (queue.length === 0) return [];
  return queue.splice(0, queue.length);
}
