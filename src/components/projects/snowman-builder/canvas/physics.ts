import type { Snowball, GameState } from "../types";
import { clearSnowAt, getGroundY, getPercentCleared } from "./snow-layer";
import {
  GRAVITY,
  FRICTION,
  CLEAR_RATE,
  MIN_SNOWBALL_RADIUS,
  MAX_SNOWBALL_RADIUS_FRACTION,
  STACK_TOLERANCE,
  STACK_BALANCE_THRESHOLD,
  COMPLETION_CLEAR_THRESHOLD,
} from "./constants";

export function createSnowball(state: GameState): Snowball {
  const id = state.nextId++;
  return {
    id,
    x: state.canvasWidth / 2,
    y: 60,
    radius: MIN_SNOWBALL_RADIUS,
    vx: 0,
    vy: 0,
    rotation: 0,
    isDragging: false,
    stackedOn: null,
  };
}

function findBallById(balls: Snowball[], id: number): Snowball | undefined {
  return balls.find((b) => b.id === id);
}

function getBallsStackedOn(balls: Snowball[], id: number): Snowball[] {
  return balls.filter((b) => b.stackedOn === id);
}

function cascadeUnstack(balls: Snowball[], id: number): void {
  const above = getBallsStackedOn(balls, id);
  for (const b of above) {
    b.stackedOn = null;
    cascadeUnstack(balls, b.id);
  }
}

function findStackChain(balls: Snowball[]): Snowball[] | null {
  for (const bottom of balls) {
    if (bottom.stackedOn !== null) continue;

    const mid = balls.find((b) => b.stackedOn === bottom.id);
    if (!mid) continue;

    const top = balls.find((b) => b.stackedOn === mid.id);
    if (!top) continue;

    return [bottom, mid, top];
  }
  return null;
}

export function checkCompletion(state: GameState): boolean {
  if (state.isComplete) return true;
  if (!state.snowLayer) return false;

  const chain = findStackChain(state.snowballs);
  if (!chain) return false;

  const cleared = getPercentCleared(state.snowLayer);
  return cleared >= COMPLETION_CLEAR_THRESHOLD;
}

export function getStackChain(state: GameState): Snowball[] | null {
  return findStackChain(state.snowballs);
}

export function updatePhysics(state: GameState): void {
  const maxRadius = state.canvasWidth * MAX_SNOWBALL_RADIUS_FRACTION;

  for (const ball of state.snowballs) {
    if (ball.isDragging) {
      let targetX = Math.max(ball.radius, Math.min(state.canvasWidth - ball.radius, state.mouseX));
      let targetY = Math.max(ball.radius, Math.min(state.canvasHeight - ball.radius, state.mouseY));

      if (state.snowLayer) {
        const groundY = getGroundY(state.snowLayer, targetX, state.canvasHeight);
        targetY = Math.min(targetY, groundY - ball.radius);
      }

      const dx = targetX - ball.x;
      const dy = targetY - ball.y;
      ball.x = targetX;
      ball.y = targetY;

      if (ball.radius > 0) {
        ball.rotation += dx / ball.radius;
      }

      if (state.snowLayer && ball.y + ball.radius >= getGroundY(state.snowLayer, ball.x, state.canvasHeight) - 2) {
        const collected = clearSnowAt(
          state.snowLayer,
          ball.x,
          ball.radius,
          CLEAR_RATE
        );
        if (collected > 0 && ball.radius < maxRadius) {
          const growth = collected / (2 * Math.PI * ball.radius);
          ball.radius = Math.min(ball.radius + growth, maxRadius);
        }
      }

      ball.vx = dx;
      ball.vy = dy;
      continue;
    }

    if (ball.stackedOn !== null) {
      const support = findBallById(state.snowballs, ball.stackedOn);
      if (support) {
        const offset = Math.abs(ball.x - support.x);
        if (offset > support.radius * STACK_BALANCE_THRESHOLD) {
          ball.stackedOn = null;
          cascadeUnstack(state.snowballs, ball.id);
        } else {
          ball.y = support.y - support.radius - ball.radius;
          ball.vx = 0;
          ball.vy = 0;
          continue;
        }
      } else {
        ball.stackedOn = null;
      }
    }

    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;

    ball.x = Math.max(ball.radius, Math.min(state.canvasWidth - ball.radius, ball.x));

    if (state.snowLayer) {
      const groundY = getGroundY(state.snowLayer, ball.x, state.canvasHeight);

      let landed = false;
      for (const other of state.snowballs) {
        if (other.id === ball.id) continue;
        if (other.isDragging) continue;

        const dx = ball.x - other.x;
        const dy = ball.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.radius + other.radius;

        if (dist < minDist && ball.y < other.y) {
          const horizontalOffset = Math.abs(dx);
          if (horizontalOffset <= other.radius * STACK_BALANCE_THRESHOLD) {
            ball.stackedOn = other.id;
            ball.y = other.y - other.radius - ball.radius;
            ball.vy = 0;
            ball.vx = 0;
            landed = true;
            break;
          } else {
            const angle = Math.atan2(dy, dx);
            ball.x = other.x + Math.cos(angle) * minDist;
            ball.y = other.y + Math.sin(angle) * minDist;
            ball.vx = Math.cos(angle) * 2;
            ball.vy = -1;
          }
        }
      }

      if (!landed && ball.y + ball.radius >= groundY) {
        ball.y = groundY - ball.radius;
        ball.vy = 0;
        ball.vx *= FRICTION;

        if (Math.abs(ball.vx) > 0.5 && ball.radius > 0) {
          ball.rotation += ball.vx / ball.radius;
        }

        if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
      }
    }
  }
}

export function hitTest(
  state: GameState,
  x: number,
  y: number
): Snowball | null {
  for (let i = state.snowballs.length - 1; i >= 0; i--) {
    const ball = state.snowballs[i];
    const dx = x - ball.x;
    const dy = y - ball.y;
    if (dx * dx + dy * dy <= ball.radius * ball.radius) {
      return ball;
    }
  }
  return null;
}
