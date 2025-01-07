// src/app/services/bspline.service.ts

import { Point, CurveConfig } from "../intefaces/types";

export class BSplineService {
    calculatePoints(controlPoints: Point[], config?: CurveConfig): Point[] {
        const resolution = config?.resolution || 0.01;
        const degree = (config as any)?.degree || 3;

        if (controlPoints.length < degree + 1) return controlPoints;

        const knots = this.generateClampedKnots(controlPoints.length, degree);
        const splinePoints: Point[] = [];

        for (let t = 0; t <= 1; t += resolution) {
            const point = this.deBoor(controlPoints, knots, degree, t);
            if (point) splinePoints.push(point);
        }

        // Ensure the last point is included
        const lastPoint = controlPoints[controlPoints.length - 1];
        if (splinePoints[splinePoints.length - 1]?.x !== lastPoint.x || splinePoints[splinePoints.length - 1]?.y !== lastPoint.y) {
            splinePoints.push(lastPoint);
        }

        return splinePoints;
    }

    private generateClampedKnots(n: number, degree: number): number[] {
        const knots: number[] = [];
        for (let i = 0; i <= degree; i++) knots.push(0);
        for (let i = 1; i < n - degree; i++) knots.push(i / (n - degree));
        for (let i = 0; i <= degree; i++) knots.push(1);
        return knots;
    }

    private deBoor(controlPoints: Point[], knots: number[], degree: number, t: number): Point | null {
        let k = 0;
        for (let i = degree; i < knots.length - degree - 1; i++) {
            if (knots[i] <= t && t < knots[i + 1]) {
                k = i;
                break;
            }
        }

        if (k === 0) return null;

        const d = controlPoints.map(p => ({ ...p }));

        for (let r = 1; r <= degree; r++) {
            for (let j = k; j > k - degree + r - 1; j--) {
                const alpha = (t - knots[j]) / (knots[j + degree + 1 - r] - knots[j]);
                d[j].x = (1 - alpha) * d[j - 1].x + alpha * d[j].x;
                d[j].y = (1 - alpha) * d[j - 1].y + alpha * d[j].y;
            }
        }

        return d[k] ?? null;
    }
}
