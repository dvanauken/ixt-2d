import { Injectable } from '@angular/core';
import { Point, CurveConfig } from '../intefaces/types';

@Injectable({
    providedIn: 'root'
})
export class NurbsService {
    private defaultConfig = {
        degree: 3,
        resolution: 100
    };

    calculatePoints(controlPoints: Point[], weights?: number[], config?: CurveConfig): Point[] {
        if (controlPoints.length < 2) return controlPoints;
        
        const cfg = { ...this.defaultConfig, ...config };
        const n = controlPoints.length - 1;
        const p = Math.min(cfg.degree, n);  // degree can't be higher than n
        
        // Generate uniform knot vector
        const knots = this.generateKnots(n, p);
        
        // Use uniform weights if none provided
        const w = weights || Array(controlPoints.length).fill(1.0);
        
        const points: Point[] = [];
        const step = 1.0 / (cfg.resolution - 1);

        // Generate points along the curve
        for (let t = 0; t <= 1; t += step) {
            const u = this.mapParameterToKnotDomain(t, knots);
            const point = this.evaluatePoint(u, controlPoints, w, knots, p);
            points.push(point);
        }

        // Ensure the last point is included
        if (points.length > 0 && points[points.length - 1] !== controlPoints[n]) {
            const point = this.evaluatePoint(1.0, controlPoints, w, knots, p);
            points.push(point);
        }

        return points;
    }

    private generateKnots(n: number, p: number): number[] {
        const knots: number[] = [];
        const m = n + p + 1;

        // Generate clamped knot vector
        for (let i = 0; i <= m; i++) {
            if (i <= p) knots[i] = 0;  // First p+1 knots are 0
            else if (i >= m - p) knots[i] = 1;  // Last p+1 knots are 1
            else knots[i] = (i - p) / (n - p + 1);
        }

        return knots;
    }

    private mapParameterToKnotDomain(t: number, knots: number[]): number {
        const min = knots[0];
        const max = knots[knots.length - 1];
        return min + t * (max - min);
    }

    private evaluatePoint(u: number, points: Point[], weights: number[], knots: number[], p: number): Point {
        const n = points.length - 1;
        const span = this.findSpan(u, p, knots);
        const N = this.basisFunctions(span, u, p, knots);
        
        let x = 0, y = 0, w = 0;
        
        for (let i = 0; i <= p; i++) {
            const idx = span - p + i;
            const weight = weights[idx] * N[i];
            x += points[idx].x * weight;
            y += points[idx].y * weight;
            w += weight;
        }

        // Return the weighted point
        return {
            x: x / w,
            y: y / w
        };
    }

    private findSpan(u: number, p: number, knots: number[]): number {
        const m = knots.length - 1;
        const n = m - p - 1;

        if (u >= knots[n + 1]) return n;
        if (u <= knots[p]) return p;

        let low = p;
        let high = n + 1;
        let mid = Math.floor((low + high) / 2);

        while (u < knots[mid] || u >= knots[mid + 1]) {
            if (u < knots[mid]) high = mid;
            else low = mid;
            mid = Math.floor((low + high) / 2);
        }

        return mid;
    }

    private basisFunctions(span: number, u: number, p: number, knots: number[]): number[] {
        const N: number[] = Array(p + 1).fill(0);
        const left: number[] = Array(p + 1).fill(0);
        const right: number[] = Array(p + 1).fill(0);
        
        N[0] = 1.0;

        for (let j = 1; j <= p; j++) {
            left[j] = u - knots[span + 1 - j];
            right[j] = knots[span + j] - u;
            let saved = 0.0;

            for (let r = 0; r < j; r++) {
                const temp = N[r] / (right[r + 1] + left[j - r]);
                N[r] = saved + right[r + 1] * temp;
                saved = left[j - r] * temp;
            }

            N[j] = saved;
        }

        return N;
    }
}