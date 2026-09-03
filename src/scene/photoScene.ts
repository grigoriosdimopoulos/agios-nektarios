/**
 * Geometry of the photographic backdrop.
 *
 * The plates are cut from the association's own panorama of the settlement
 * (mountain and village in `ridge.webp`, the pine wood in front in
 * `forest.webp`), with the sky removed so the live sky, sun, moon and weather
 * show through behind them.
 *
 * HOUSE_LIGHTS are the houses found in the photograph, in coordinates
 * normalised to the ridge plate, so their windows can light up after dark in
 * exactly the places where houses actually stand.
 */
export const PHOTO_PLATES = {
  ridge: { src: "/scene/ridge.webp", aspect: 3000 / 766 },
  forest: { src: "/scene/forest.webp", aspect: 3000 / 278 },
  lights: { src: "/scene/lights.webp", aspect: 3000 / 766 },
} as const;

export type PhotoLight = { x: number; y: number };

export type PlateBox = {
  left: number;
  top: number;
  drawWidth: number;
  drawHeight: number;
};

/**
 * Places both plates so that they always cover the ground, at any window
 * shape. Sizing them from the window width alone leaves a strip of bare sky
 * between the ridge and the wood on tall or narrow screens.
 */
export function plateLayout(
  width: number,
  height: number,
  groundY: number,
): { ridge: PlateBox; forest: PlateBox } {
  const ridgeBottom = groundY + height * 0.17;

  // The ridge keeps its natural size: blowing it up on a tall screen would
  // swallow the sky. The wood below is what grows to close any gap.
  const ridgeWidth = width * 1.06;
  const ridgeHeight = ridgeWidth / PHOTO_PLATES.ridge.aspect;

  // The wood starts a little above where the ridge plate ends and runs past
  // the bottom edge, so the two always overlap.
  const overlap = height * 0.05;
  const forestTop = ridgeBottom - overlap;
  let forestHeight = height * 1.04 - forestTop;
  let forestWidth = forestHeight * PHOTO_PLATES.forest.aspect;
  if (forestWidth < width * 1.3) {
    forestWidth = width * 1.3;
    forestHeight = forestWidth / PHOTO_PLATES.forest.aspect;
  }

  return {
    ridge: {
      left: (width - ridgeWidth) / 2,
      top: ridgeBottom - ridgeHeight,
      drawWidth: ridgeWidth,
      drawHeight: ridgeHeight,
    },
    forest: {
      left: (width - forestWidth) / 2,
      top: forestTop,
      drawWidth: forestWidth,
      drawHeight: forestHeight,
    },
  };
}

export function ridgeBox(width: number, height: number, groundY: number) {
  return plateLayout(width, height, groundY).ridge;
}

export function forestBox(width: number, height: number, groundY: number) {
  return plateLayout(width, height, groundY).forest;
}

/** The photographed houses, in screen coordinates. */
export function houseAnchors(width: number, height: number, groundY: number) {
  const box = ridgeBox(width, height, groundY);
  return HOUSE_LIGHTS.map((light) => ({
    x: box.left + light.x * box.drawWidth,
    y: box.top + light.y * box.drawHeight,
  }));
}

export const HOUSE_LIGHTS: PhotoLight[] = [
  { x: 0.029, y: 0.7955 },
  { x: 0.0487, y: 0.8 },
  { x: 0.0719, y: 0.8318 },
  { x: 0.0777, y: 0.7773 },
  { x: 0.0928, y: 0.8045 },
  { x: 0.1218, y: 0.8409 },
  { x: 0.1427, y: 0.8273 },
  { x: 0.145, y: 0.7318 },
  { x: 0.1601, y: 0.8136 },
  { x: 0.181, y: 0.8045 },
  { x: 0.2007, y: 0.8364 },
  { x: 0.2262, y: 0.8091 },
  { x: 0.2378, y: 0.7318 },
  { x: 0.2448, y: 0.8 },
  { x: 0.2564, y: 0.7409 },
  { x: 0.2599, y: 0.8 },
  { x: 0.2761, y: 0.7364 },
  { x: 0.2807, y: 0.8227 },
  { x: 0.2923, y: 0.7636 },
  { x: 0.3074, y: 0.8364 },
  { x: 0.3318, y: 0.6455 },
  { x: 0.3318, y: 0.7409 },
  { x: 0.3434, y: 0.7955 },
  { x: 0.3457, y: 0.8636 },
  { x: 0.3596, y: 0.8045 },
  { x: 0.3631, y: 0.7455 },
  { x: 0.3735, y: 0.8364 },
  { x: 0.384, y: 0.7318 },
  { x: 0.4049, y: 0.7318 },
  { x: 0.4211, y: 0.7545 },
  { x: 0.4548, y: 0.8409 },
  { x: 0.4606, y: 0.6682 },
  { x: 0.4698, y: 0.8318 },
  { x: 0.4803, y: 0.7409 },
  { x: 0.5023, y: 0.8318 },
  { x: 0.5232, y: 0.85 },
  { x: 0.5394, y: 0.8455 },
  { x: 0.5441, y: 0.7318 },
  { x: 0.5568, y: 0.8273 },
  { x: 0.5592, y: 0.7409 },
  { x: 0.5731, y: 0.8182 },
  { x: 0.5905, y: 0.7545 },
  { x: 0.5951, y: 0.65 },
  { x: 0.5963, y: 0.8091 },
  { x: 0.6056, y: 0.8818 },
  { x: 0.6102, y: 0.7864 },
  { x: 0.6206, y: 0.8773 },
  { x: 0.6253, y: 0.7682 },
  { x: 0.6276, y: 0.6682 },
  { x: 0.6427, y: 0.85 },
  { x: 0.6462, y: 0.9091 },
  { x: 0.6578, y: 0.7773 },
  { x: 0.6589, y: 0.8682 },
  { x: 0.6694, y: 0.8227 },
  { x: 0.681, y: 0.8909 },
  { x: 0.6856, y: 0.7909 },
  { x: 0.7042, y: 0.8773 },
  { x: 0.71, y: 0.7591 },
  { x: 0.7262, y: 0.8864 },
  { x: 0.7274, y: 0.7773 },
  { x: 0.7401, y: 0.85 },
  { x: 0.7773, y: 0.8182 },
  { x: 0.79, y: 0.9045 },
  { x: 0.8074, y: 0.8818 },
  { x: 0.8225, y: 0.85 },
  { x: 0.8283, y: 0.9045 },
  { x: 0.8376, y: 0.8545 },
  { x: 0.848, y: 0.9 },
  { x: 0.8596, y: 0.8545 },
  { x: 0.8805, y: 0.8273 },
  { x: 0.884, y: 0.8955 },
  { x: 0.8968, y: 0.8591 },
  { x: 0.9443, y: 0.8818 },
  { x: 0.9617, y: 0.9091 },
];
