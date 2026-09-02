import { clamp, fbm1, mulberry32 } from "../noise";
import { css, mix, scale, type RGB } from "../palette";
import { broadleafFoliage, coniferFoliage, type Foliage } from "../foliage";
import { requestSpawn } from "../particles";
import type { Frame, Layer } from "../types";

type LeafCluster = { dx: number; dy: number; r: number; phase: number; tone: number };

type Branch = {
  length: number;
  width: number;
  /** Rest angle relative to the parent branch, in radians. */
  restAngle: number;
  children: Branch[];
  clusters: LeafCluster[];
  /** Sway state — a damped spring driven by the wind. */
  theta: number;
  omega: number;
  stiffness: number;
  damping: number;
  /** How strongly the wind pushes this branch (thin twigs move most). */
  drag: number;
  phase: number;
};

type Band = "near" | "mid" | "canopy";

type Tree = {
  x: number;
  baseY: number;
  scale: number;
  band: Band;
  /** 0 = hazy distance, 1 = right in front of the camera. */
  depth: number;
  conifer: boolean;
  root: Branch;
  /** Seconds until this tree may drop something again. */
  dropCooldown: number;
};

const FOREST_SEED = 384;

function buildBranch(
  random: () => number,
  depth: number,
  maxDepth: number,
  length: number,
  width: number,
  restAngle: number,
  conifer: boolean,
): Branch {
  const children: Branch[] = [];
  const clusters: LeafCluster[] = [];
  const leafy = depth >= maxDepth - 1;

  if (depth < maxDepth) {
    const count = depth === 0 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const spread = conifer ? 0.95 : 0.66;
      const side = (i / (count - 1)) * 2 - 1;
      const angle = side * spread + (random() - 0.5) * 0.38;
      children.push(
        buildBranch(
          random,
          depth + 1,
          maxDepth,
          length * (conifer ? 0.66 : 0.74) * (0.82 + random() * 0.34),
          width * 0.62,
          angle,
          conifer,
        ),
      );
    }
  }

  // Foliage hangs off the outer two levels so the canopy reads as a mass
  // rather than as a few blobs stuck on the tips.
  if (leafy) {
    const clusterCount = conifer ? 6 : 8;
    for (let i = 0; i < clusterCount; i++) {
      clusters.push({
        dx: (random() - 0.5) * length * 0.85,
        dy: -length * (0.05 + random() * 0.75),
        r: length * (conifer ? 0.3 : 0.4) * (0.6 + random() * 0.7),
        phase: random() * Math.PI * 2,
        tone: random(),
      });
    }
  }

  // Thin, long branches are springy and easily pushed; the trunk barely moves.
  const slenderness = clamp(length / (width * 26), 0, 1);
  return {
    length,
    width,
    restAngle,
    children,
    clusters,
    theta: 0,
    omega: 0,
    stiffness: 26 - 18 * slenderness,
    damping: 3.4 - 1.6 * slenderness,
    drag: 0.06 + 0.5 * slenderness,
    phase: random() * Math.PI * 2,
  };
}

function updateBranch(branch: Branch, wind: number, dt: number, time: number) {
  // Damped harmonic oscillator driven by the wind, with a per-branch phase so
  // neighbouring twigs never move in lockstep.
  const flutter = Math.sin(time * 2.4 + branch.phase) * 0.18 + 1;
  const force = wind * branch.drag * flutter;
  const acceleration =
    -branch.stiffness * branch.theta - branch.damping * branch.omega + force;
  branch.omega += acceleration * dt;
  branch.theta += branch.omega * dt;
  // Keep the spring stable if a tab was backgrounded and dt spiked.
  branch.theta = clamp(branch.theta, -0.9, 0.9);
  for (const child of branch.children) updateBranch(child, wind, dt, time);
}

type CanopyPaint = {
  shadow: string;
  base: string;
  lit: string;
  blossom: string;
};

function drawBranch(
  ctx: CanvasRenderingContext2D,
  branch: Branch,
  bark: string,
  foliage: Foliage,
  canopy: CanopyPaint,
  snow: string | null,
  detail: boolean,
) {
  ctx.save();
  ctx.rotate(branch.restAngle + branch.theta);

  // Tapered limb: wider at the joint than at the tip.
  const half = branch.width / 2;
  ctx.fillStyle = bark;
  ctx.beginPath();
  ctx.moveTo(-half, 0);
  ctx.lineTo(-half * 0.42, -branch.length);
  ctx.lineTo(half * 0.42, -branch.length);
  ctx.lineTo(half, 0);
  ctx.closePath();
  ctx.fill();

  if (snow && branch.width > 1.4) {
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(-half, 0);
    ctx.lineTo(-half * 0.42, -branch.length);
    ctx.lineTo(-half * 0.1, -branch.length);
    ctx.lineTo(-half * 0.3, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.translate(0, -branch.length);

  if (foliage.density > 0.04) {
    for (const cluster of branch.clusters) {
      const radius = cluster.r * (0.45 + 0.55 * foliage.density);
      if (radius < 0.7) continue;

      ctx.fillStyle = cluster.tone < 0.45 ? canopy.shadow : canopy.base;
      ctx.beginPath();
      ctx.ellipse(cluster.dx, cluster.dy, radius * 1.2, radius * 0.86, cluster.phase, 0, Math.PI * 2);
      ctx.fill();

      if (detail && cluster.tone > 0.6) {
        ctx.fillStyle = canopy.lit;
        ctx.beginPath();
        ctx.ellipse(
          cluster.dx + radius * 0.22, cluster.dy - radius * 0.3,
          radius * 0.66, radius * 0.46, cluster.phase, 0, Math.PI * 2,
        );
        ctx.fill();
      }

      if (detail && foliage.blossom > 0.05) {
        ctx.globalAlpha = foliage.blossom * 0.7;
        ctx.fillStyle = canopy.blossom;
        ctx.beginPath();
        ctx.ellipse(
          cluster.dx - radius * 0.2, cluster.dy - radius * 0.15,
          radius * 0.5, radius * 0.36, cluster.phase, 0, Math.PI * 2,
        );
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  for (const child of branch.children) {
    drawBranch(ctx, child, bark, foliage, canopy, snow, detail);
  }

  ctx.restore();
}

/**
 * The forest: a dark treeline along the ridge, scattered firs and oaks on the
 * slope, and two or three big trees framing the edges of the frame. Every
 * branch is a damped spring, so the whole wood leans and settles with the wind.
 */
export function createForestLayer(
  {
    treeline: drawTreelineBand = true,
    slope: drawSlopeTrees = true,
    silhouette = false,
    /** Hang the framing trees from the top edge instead of standing them up. */
    overhead = false,
  } = {},
): Layer {
  let trees: Tree[] = [];
  let treeline: { x: number; y: number; h: number; w: number }[] = [];
  let width = 0;
  let height = 0;

  function build(frame: Frame) {
    const random = mulberry32(FOREST_SEED);
    const sizeFactor = clamp(frame.height / 900, 0.6, 1.5);

    const make = (band: Band, x: number, depth: number, rootAngle = 0): Tree => {
      const conifer = random() < (band === "near" ? 0.4 : 0.62);
      const framing = band !== "mid";
      const treeScale =
        (framing ? 0.85 + random() * 0.45 : 0.3 + random() * 0.4) * sizeFactor;
      const maxDepth = framing ? (frame.quality === "high" ? 5 : 4) : 3;
      const trunkLength =
        frame.height * (band === "canopy" ? 0.075 : framing ? 0.1 : 0.05) * treeScale;
      const trunkWidth = Math.max(1.3, trunkLength * (conifer ? 0.05 : 0.07));

      return {
        x,
        baseY:
          band === "canopy"
            ? -frame.height * 0.03
            : band === "near"
              ? frame.groundY + frame.height * (0.09 + random() * 0.08)
              : frame.groundY + frame.height * (random() * 0.05 - 0.012),
        scale: treeScale,
        band,
        depth,
        conifer,
        root: buildBranch(random, 0, maxDepth, trunkLength, trunkWidth, rootAngle, conifer),
        dropCooldown: random() * 6,
      };
    };

    // Slope forest — clumped, never evenly spaced.
    const midCount = frame.quality === "low" ? 9 : frame.quality === "medium" ? 15 : 22;
    const mid: Tree[] = [];
    for (let i = 0; i < midCount; i++) {
      const clump = Math.floor(random() * 5) / 5;
      const x = frame.width * clamp(clump + (random() - 0.5) * 0.34, -0.05, 1.05);
      mid.push(make("mid", x, 0.3 + random() * 0.3));
    }

    // Framing trees: kept to the right edge and the far left so the title and
    // the village stay readable between them.
    // Over a photograph the framing trees become branches reaching in from the
    // top corners, the way a real foreground branch frames a view.
    const near: Tree[] = overhead
      ? [
          make("canopy", frame.width * (0.06 + random() * 0.06), 0.95, 2.5),
          make("canopy", frame.width * (0.9 + random() * 0.06), 0.9, -2.5),
        ]
      : [
          make("near", frame.width * (0.97 + random() * 0.1), 0.95),
          make("near", frame.width * (-0.05 + random() * 0.06), 0.9),
          ...(frame.quality !== "low"
            ? [make("near", frame.width * (0.85 + random() * 0.05), 0.8)]
            : []),
        ];

    trees = [...(drawSlopeTrees ? mid : []), ...near].sort((a, b) => a.baseY - b.baseY);

    // Distant treeline hugging the ridge: silhouettes only.
    const lineCount = frame.quality === "low" ? 40 : 110;
    treeline = Array.from({ length: lineCount }, (_, i) => {
      const x = (i / lineCount) * frame.width * 1.05 - frame.width * 0.025;
      const crest = fbm1(x * 0.004 + 5, 3) - 0.5;
      return {
        x,
        y: frame.horizonY - frame.height * 0.012 - crest * frame.height * 0.05,
        h: frame.height * (0.014 + random() * 0.022),
        w: frame.height * (0.006 + random() * 0.006),
      };
    });
  }

  function drawTreeline(ctx: CanvasRenderingContext2D, frame: Frame) {
    const { lighting } = frame;
    const color = mix(
      mix(scale([34, 46, 38], 0.3 + 0.85 * lighting.ambientIntensity), lighting.sunColor, 0.12 * lighting.sunIntensity),
      lighting.hazeColor,
      clamp(0.4 + lighting.hazeDensity * 0.4),
    );
    ctx.fillStyle = css(color, 0.92);
    const sway = frame.wind.force * frame.height * 0.004;

    ctx.beginPath();
    for (const tree of treeline) {
      const lean = Math.sin(frame.time * 1.1 + tree.x * 0.02) * sway;
      ctx.moveTo(tree.x - tree.w, tree.y);
      ctx.lineTo(tree.x + lean, tree.y - tree.h);
      ctx.lineTo(tree.x + tree.w, tree.y);
      ctx.closePath();
    }
    ctx.fill();
  }

  return {
    name: "forest",
    resize(frame) {
      width = frame.width;
      height = frame.height;
      build(frame);
    },
    update(frame) {
      if (width !== frame.width || height !== frame.height) {
        width = frame.width;
        height = frame.height;
        build(frame);
      }

      const wind = frame.wind.force * 2.4;
      for (const tree of trees) {
        updateBranch(tree.root, wind * (0.6 + tree.depth * 0.7), frame.dt, frame.time);

        // Shedding: autumn drops constantly, and a gust shakes leaves loose in
        // any season. Fruit falls when it is ripe.
        if (tree.band === "mid") continue;
        tree.dropCooldown -= frame.dt;
        if (tree.dropCooldown > 0) continue;

        const foliage = tree.conifer
          ? coniferFoliage(frame.season)
          : broadleafFoliage(frame.season, frame.seasonT);
        const gust = Math.abs(frame.wind.force);
        const autumnFall = frame.season === "autumn" ? 0.8 : 0;
        const shedRate = (autumnFall + gust * 0.9) * foliage.density;
        if (shedRate <= 0.05) {
          tree.dropCooldown = 1.5;
          continue;
        }

        tree.dropCooldown = 0.35 / shedRate;
        const canopyY = tree.baseY - tree.root.length * 2.4;
        const spread = tree.root.length * 1.8;
        const ripe = foliage.fruit > 0.25 && Math.random() < 0.14;
        requestSpawn({
          x: tree.x + (Math.random() - 0.5) * spread,
          y: canopyY + (Math.random() - 0.5) * spread * 0.7,
          kind: ripe ? "fruit" : tree.conifer ? "needle" : foliage.blossom > 0.2 ? "petal" : "leaf",
          tone: Math.random(),
          size: (ripe ? 3.4 : 4.6) * tree.scale,
        });
      }
    },
    draw(ctx, frame) {
      const { lighting } = frame;
      const litFactor = 0.22 + 0.95 * lighting.ambientIntensity;

      if (drawTreelineBand) drawTreeline(ctx, frame);

      for (const tree of trees) {
        const foliage = tree.conifer
          ? coniferFoliage(frame.season)
          : broadleafFoliage(frame.season, frame.seasonT);

        // Distance fades everything toward the haze; near trees stay saturated.
        const haze = clamp((1 - tree.depth) * (0.5 + lighting.hazeDensity * 0.5));
        // In front of a photograph a stylised green canopy reads as a cartoon,
        // so the framing trees are rendered as near-black shapes instead —
        // which is what a close, backlit tree actually looks like.
        const bark: RGB = silhouette
          ? mix([14, 16, 15], lighting.ambient, 0.12 * lighting.ambientIntensity)
          : mix(scale([52, 40, 33], litFactor), lighting.hazeColor, haze);
        const canopyBase: RGB = silhouette
          ? mix([18, 22, 18], lighting.ambient, 0.16 * lighting.ambientIntensity)
          : mix(
              mix(scale(foliage.canopy, litFactor), lighting.sunColor, 0.18 * lighting.sunIntensity),
              lighting.hazeColor,
              haze,
            );
        const paint: CanopyPaint = {
          shadow: css(scale(canopyBase, 0.68), silhouette ? 0.99 : 0.95),
          base: css(canopyBase, silhouette ? 0.99 : 0.95),
          lit: css(
            silhouette
              ? scale(canopyBase, 1.35)
              : mix(scale(canopyBase, 1.28), lighting.sunColor, 0.28 * lighting.sunIntensity),
            silhouette ? 0.6 : 0.85,
          ),
          blossom: css(mix([246, 232, 238], lighting.sunColor, 0.3 * lighting.sunIntensity)),
        };
        const snow =
          frame.snowCover > 0.15
            ? css(mix([238, 242, 250], lighting.hazeColor, haze), clamp(frame.snowCover * 0.85))
            : null;

        // Ground shadow first, so the trunk sits on top of it.
        if (lighting.sunIntensity > 0.06 && tree.band === "near") {
          const direction = frame.sunScreen.x < frame.width / 2 ? 1 : -1;
          const lengthFactor = 1 + 3.4 * lighting.goldenFactor;
          ctx.save();
          ctx.globalAlpha = 0.16 * lighting.sunIntensity;
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.ellipse(
            tree.x + direction * tree.root.length * 0.5 * lengthFactor,
            tree.baseY + 3,
            tree.root.length * 0.75 * lengthFactor,
            tree.root.length * 0.12,
            0, 0, Math.PI * 2,
          );
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        ctx.translate(tree.x, tree.baseY);
        drawBranch(
          ctx,
          tree.root,
          css(bark),
          foliage,
          paint,
          snow,
          frame.quality !== "low" && tree.band !== "mid",
        );
        ctx.restore();
      }
    },
  };
}
