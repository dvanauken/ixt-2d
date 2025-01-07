// src/app/interfaces/types.ts

export interface Point {
    x: number;
    y: number;
  }
  
  export type CurveType = 'spline' | 'bspline' | 'nurbs';
  
  export interface CurveConfig {
    resolution?: number;  // how finely to subdivide the curve
    tension?: number;     // for spline tension control
    weights?: number[];   // for NURBS control point weights
  }