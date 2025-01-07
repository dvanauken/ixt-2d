// src/app/services/nurbs.service.ts

import { Point, CurveConfig } from "../intefaces/types";

export class NurbsService {
    calculatePoints(controlPoints: Point[], weights?: number[], config?: CurveConfig): Point[] {
        const resolution = config?.resolution || 0.01;
        let degree = (config as { degree?: number })?.degree || 3;

        if (!weights || weights.length !== controlPoints.length) {
            weights = controlPoints.map(() => 1);
        }

        // Ensure valid degree
        degree = Math.min(degree, controlPoints.length - 1);
        if (degree < 1) {
            console.warn("Insufficient control points for a valid NURBS curve.");
            return controlPoints;
        }

        // Generate a corrected clamped knot vector
        const knots = this.generateCorrectedClampedKnots(controlPoints.length, degree);
        const splinePoints: Point[] = [];

        for (let t = knots[degree]; t <= knots[knots.length - degree - 1]; t += resolution) {
            const point = this.deBoor(controlPoints, weights, knots, degree, t);
            if (point) splinePoints.push(point);
        }

        // Ensure the last point is added
        const lastPoint = controlPoints[controlPoints.length - 1];
        if (splinePoints[splinePoints.length - 1]?.x !== lastPoint.x || splinePoints[splinePoints.length - 1]?.y !== lastPoint.y) {
            splinePoints.push(lastPoint);
        }

        return splinePoints;
    }

    private generateCorrectedClampedKnots(n: number, degree: number): number[] {
        const knots: number[] = [];
        // Properly clamped knots
        for (let i = 0; i <= degree; i++) knots.push(0); // Clamped start
        for (let i = 1; i < n - degree; i++) knots.push(i / (n - degree)); // Uniform section
        for (let i = 0; i <= degree; i++) knots.push(1); // Clamped end
        return knots;
    }

    private deBoor(controlPoints: Point[], weights: number[], knots: number[], degree: number, t: number): Point | null {
        // Locate the knot span containing 't'
        let k = -1;

        // Special handling for start point
        if (t <= knots[degree]) {
            return controlPoints[0];  // Return first control point for start
        }



        for (let i = degree; i < knots.length - degree - 1; i++) {
            if (t >= knots[i] && t < knots[i + 1]) {
                k = i;
                break;
            }
        }

        if (k === -1) {
            console.warn("Failed to locate the correct knot span for t =", t);
            return null;
        }

        // Initialize control points with weights applied
        const d = controlPoints.map((p, idx) => ({
            x: p.x * weights[idx],
            y: p.y * weights[idx],
            w: weights[idx]
        }));

        // Apply the De Boor recursion
        for (let r = 1; r <= degree; r++) {
            for (let j = k; j > k - r; j--) {
                const alpha = (t - knots[j]) / (knots[j + degree + 1 - r] - knots[j]);

                d[j].x = (1 - alpha) * d[j - 1].x + alpha * d[j].x;
                d[j].y = (1 - alpha) * d[j - 1].y + alpha * d[j].y;
                d[j].w = (1 - alpha) * d[j - 1].w + alpha * d[j].w;
            }
        }

        // Normalize the final point by its weight
        return {
            x: d[k].x / d[k].w,
            y: d[k].y / d[k].w
        };
    }
}
