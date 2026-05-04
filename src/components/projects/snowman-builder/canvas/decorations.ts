import type { Snowball } from "../types";

export function drawDecorations(
  ctx: CanvasRenderingContext2D,
  stack: Snowball[],
  alpha: number
): void {
  if (stack.length < 3) return;

  const [bottom, middle, top] = stack;

  ctx.save();
  ctx.globalAlpha = alpha;

  drawTopHat(ctx, top);
  drawEyes(ctx, top);
  drawCarrotNose(ctx, top);
  drawMouth(ctx, top);
  drawButtons(ctx, middle);
  drawArms(ctx, middle);
  drawScarf(ctx, top, middle);

  ctx.restore();
}

function drawTopHat(ctx: CanvasRenderingContext2D, head: Snowball): void {
  const hatWidth = head.radius * 1.2;
  const hatHeight = head.radius * 0.9;
  const brimWidth = head.radius * 1.7;
  const brimHeight = head.radius * 0.18;

  const topY = head.y - head.radius;

  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.roundRect(
    head.x - hatWidth / 2,
    topY - hatHeight,
    hatWidth,
    hatHeight,
    [4, 4, 0, 0]
  );
  ctx.fill();

  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.roundRect(
    head.x - brimWidth / 2,
    topY - brimHeight / 2,
    brimWidth,
    brimHeight,
    2
  );
  ctx.fill();

  ctx.fillStyle = "#c0392b";
  ctx.fillRect(
    head.x - hatWidth / 2,
    topY - hatHeight * 0.3,
    hatWidth,
    hatHeight * 0.12
  );
}

function drawEyes(ctx: CanvasRenderingContext2D, head: Snowball): void {
  const eyeY = head.y - head.radius * 0.25;
  const eyeSpacing = head.radius * 0.35;
  const eyeSize = Math.max(3, head.radius * 0.1);

  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(head.x - eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(head.x + eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawCarrotNose(ctx: CanvasRenderingContext2D, head: Snowball): void {
  const noseY = head.y + head.radius * 0.05;
  const noseLen = head.radius * 0.7;

  ctx.fillStyle = "#e67e22";
  ctx.beginPath();
  ctx.moveTo(head.x, noseY - head.radius * 0.08);
  ctx.lineTo(head.x + noseLen, noseY);
  ctx.lineTo(head.x, noseY + head.radius * 0.08);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#d35400";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawMouth(ctx: CanvasRenderingContext2D, head: Snowball): void {
  const mouthY = head.y + head.radius * 0.35;
  const dotCount = 5;
  const spread = head.radius * 0.5;
  const dotSize = Math.max(2, head.radius * 0.06);

  ctx.fillStyle = "#1a1a2e";
  for (let i = 0; i < dotCount; i++) {
    const t = (i / (dotCount - 1)) * 2 - 1;
    const x = head.x + t * spread;
    const y = mouthY + t * t * head.radius * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawButtons(ctx: CanvasRenderingContext2D, body: Snowball): void {
  const buttonCount = 3;
  const spacing = body.radius * 0.45;
  const startY = body.y - spacing;
  const btnSize = Math.max(3, body.radius * 0.09);

  ctx.fillStyle = "#1a1a2e";
  for (let i = 0; i < buttonCount; i++) {
    ctx.beginPath();
    ctx.arc(body.x, startY + i * spacing, btnSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArms(ctx: CanvasRenderingContext2D, body: Snowball): void {
  const armLen = body.radius * 1.4;

  ctx.strokeStyle = "#6B3A2E";
  ctx.lineWidth = Math.max(2, body.radius * 0.06);
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(body.x - body.radius * 0.8, body.y - body.radius * 0.2);
  ctx.lineTo(
    body.x - body.radius * 0.8 - armLen * 0.8,
    body.y - body.radius * 0.2 - armLen * 0.5
  );
  ctx.stroke();

  const leftEndX = body.x - body.radius * 0.8 - armLen * 0.8;
  const leftEndY = body.y - body.radius * 0.2 - armLen * 0.5;
  ctx.beginPath();
  ctx.moveTo(leftEndX, leftEndY);
  ctx.lineTo(leftEndX - armLen * 0.2, leftEndY - armLen * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(leftEndX, leftEndY);
  ctx.lineTo(leftEndX + armLen * 0.1, leftEndY - armLen * 0.25);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(body.x + body.radius * 0.8, body.y - body.radius * 0.2);
  ctx.lineTo(
    body.x + body.radius * 0.8 + armLen * 0.8,
    body.y - body.radius * 0.2 - armLen * 0.5
  );
  ctx.stroke();

  const rightEndX = body.x + body.radius * 0.8 + armLen * 0.8;
  const rightEndY = body.y - body.radius * 0.2 - armLen * 0.5;
  ctx.beginPath();
  ctx.moveTo(rightEndX, rightEndY);
  ctx.lineTo(rightEndX + armLen * 0.2, rightEndY - armLen * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rightEndX, rightEndY);
  ctx.lineTo(rightEndX - armLen * 0.1, rightEndY - armLen * 0.25);
  ctx.stroke();
}

function drawScarf(
  ctx: CanvasRenderingContext2D,
  head: Snowball,
  body: Snowball
): void {
  const junctionY = head.y + head.radius;
  const scarfWidth = head.radius * 1.6;
  const scarfHeight = head.radius * 0.3;

  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.ellipse(head.x, junctionY, scarfWidth / 2, scarfHeight / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#a93226";
  ctx.lineWidth = 1;
  ctx.stroke();

  const tailX = head.x + scarfWidth * 0.3;
  const tailWidth = head.radius * 0.3;
  const tailLen = body.radius * 0.7;

  ctx.fillStyle = "#c0392b";
  ctx.beginPath();
  ctx.moveTo(tailX - tailWidth / 2, junctionY);
  ctx.lineTo(tailX + tailWidth / 2, junctionY);
  ctx.lineTo(tailX + tailWidth / 2 + 3, junctionY + tailLen);
  ctx.lineTo(tailX - tailWidth / 2 + 3, junctionY + tailLen);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#a93226";
  ctx.lineWidth = 1;
  ctx.stroke();
}
