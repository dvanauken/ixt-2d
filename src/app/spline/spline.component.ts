// src/app/components/spline/spline.component.ts
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Point, CurveType } from '../intefaces/types';
import { BSplineService } from '../services/bspline.service';
import { NurbsService } from '../services/nurbs.service';
import { SplineService } from '../services/spline.service';

@Component({
  selector: 'app-spline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <canvas #canvas
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="onMouseUp()"
        [width]="width"
        [height]="height">
      </canvas>
      <div class="controls">
        <select (change)="setCurveType($event)">
          <option value="spline">Spline (Point to Point)</option>
          <option value="bspline">B-Spline (Magnetic)</option>
          <option value="nurbs">NURBS (Weighted Magnetic)</option>
        </select>
        <button (click)="clear()">Clear</button>
        <button (click)="removeLastPoint()">Remove Last Point</button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      height: 50vh;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      box-sizing: border-box;
    }
    canvas {
      border: 1px solid #ccc;
      cursor: crosshair;
      flex: 1;
      width: 100%;
    }
    .controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  `],
  providers: [SplineService, BSplineService, NurbsService]
})
export class SplineComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private controlPoints: Point[] = [];
  private selectedPoint: number = -1;
  private isDragging = false;
  private curveType: CurveType = 'spline';
  
  width = 800;
  height = 600;

  constructor(
    private splineService: SplineService,
    private bSplineService: BSplineService,
    private nurbsService: NurbsService
  ) {}

  ngOnInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas() {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.width = rect.width;
    this.height = rect.height;
    
    this.canvasRef.nativeElement.width = this.width * dpr;
    this.canvasRef.nativeElement.height = this.height * dpr;
    
    this.ctx.scale(dpr, dpr);
  }

  setCurveType(event: Event) {
    this.curveType = (event.target as HTMLSelectElement).value as CurveType;
    this.draw();
  }

  onMouseDown(event: MouseEvent) {
    const point = this.getCanvasPoint(event);
    
    this.selectedPoint = this.controlPoints.findIndex(p => 
      Math.hypot(p.x - point.x, p.y - point.y) < 10
    );

    if (this.selectedPoint === -1) {
      this.controlPoints.push(point);
      this.selectedPoint = this.controlPoints.length - 1;
    }
    
    this.isDragging = true;
    this.draw();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging || this.selectedPoint === -1) return;
    
    this.controlPoints[this.selectedPoint] = this.getCanvasPoint(event);
    this.draw();
  }

  onMouseUp() {
    this.isDragging = false;
    this.selectedPoint = -1;
  }

  clear() {
    this.controlPoints = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  removeLastPoint() {
    if (this.controlPoints.length > 0) {
      this.controlPoints.pop();
      this.draw();
    }
  }

  private getCanvasPoint(event: MouseEvent): Point {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    if (this.controlPoints.length >= 2) {
      let curvePoints: Point[];
      
      switch (this.curveType) {
        case 'bspline':
          curvePoints = this.bSplineService.calculatePoints(this.controlPoints);
          break;
        case 'nurbs':
          curvePoints = this.nurbsService.calculatePoints(this.controlPoints);
          break;
        default:
          curvePoints = this.splineService.calculatePoints(this.controlPoints);
      }

      // Draw the curve
      this.ctx.beginPath();
      this.ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
      for (let i = 1; i < curvePoints.length; i++) {
        this.ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
      }
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    // Draw control points
    this.controlPoints.forEach((point, index) => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = index === this.selectedPoint ? 'red' : 'blue';
      this.ctx.fill();
    });
  }
}