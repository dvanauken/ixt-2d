// src/app/services/spline.service.ts

import { Point, CurveConfig } from "../intefaces/types";

export class SplineService {
  calculatePoints(controlPoints: Point[], config?: CurveConfig): Point[] {
    const resolution = config?.resolution || 0.1;
    const splinePoints: Point[] = [];
    const n = controlPoints.length;

    if (n < 2) return controlPoints;

    for (let i = 0; i < n - 1; i++) {
      const p0 = controlPoints[Math.max(i - 1, 0)];
      const p1 = controlPoints[i];
      const p2 = controlPoints[i + 1];
      const p3 = controlPoints[Math.min(i + 2, n - 1)];

      for (let t = 0; t <= 1; t += resolution) {
        const point = this.catmullRom(p0, p1, p2, p3, t);
        splinePoints.push(point);
      }
    }

    return splinePoints;
  }

  private catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
    const t2 = t * t;
    const t3 = t2 * t;

    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );

    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );

    return { x, y };
  }
}