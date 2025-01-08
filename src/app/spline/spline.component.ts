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
        (mouseleave)="onMouseLeave()"
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
        <div class="status">{{ statusMessage }}</div>
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
    .status {
      color: #666;
      font-size: 0.9em;
      margin-left: auto;
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
  private isHoveringStart = false;
  private isClosed = false;
  private previewPoint: Point | null = null;
  
  width = 800;
  height = 600;
  statusMessage = '';

  // Constants for interaction
  private readonly SNAP_DISTANCE = 15;
  private readonly CONTROL_POINT_SIZE = 5;
  private readonly START_POINT_SIZE = 8;

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
    
    // Check if clicking near start point to close the curve
    if (this.controlPoints.length > 2 && !this.isClosed) {
      const startPoint = this.controlPoints[0];
      if (this.isNearPoint(point, startPoint)) {
        this.isClosed = true;
        this.isHoveringStart = false;
        this.draw();
        return;
      }
    }

    // Check for existing point selection
    this.selectedPoint = this.controlPoints.findIndex(p => 
      this.isNearPoint(point, p)
    );

    // Add new point if not selecting existing one and not closed
    if (this.selectedPoint === -1 && !this.isClosed) {
      this.controlPoints.push(point);
      this.selectedPoint = this.controlPoints.length - 1;
    }
    
    this.isDragging = true;
    this.draw();
  }

  onMouseMove(event: MouseEvent) {
    const point = this.getCanvasPoint(event);
    
    if (this.isDragging && this.selectedPoint !== -1) {
      // Update selected point position
      this.controlPoints[this.selectedPoint] = point;
      this.draw();
      return;
    }

    // Handle hover effects and preview
    if (!this.isClosed && this.controlPoints.length > 2) {
      const startPoint = this.controlPoints[0];
      this.isHoveringStart = this.isNearPoint(point, startPoint);
      this.previewPoint = this.isHoveringStart ? startPoint : point;
      
      // Update status message
      this.statusMessage = this.isHoveringStart ? 'Click to close curve' : '';
      
      // Update cursor style
      this.canvasRef.nativeElement.style.cursor = this.isHoveringStart ? 'pointer' : 'crosshair';
    } else {
      this.isHoveringStart = false;
      this.previewPoint = point;
    }
    
    this.draw();
  }

  onMouseUp() {
    this.isDragging = false;
    this.selectedPoint = -1;
  }

  onMouseLeave() {
    this.isHoveringStart = false;
    this.previewPoint = null;
    this.draw();
  }

  clear() {
    this.controlPoints = [];
    this.isClosed = false;
    this.isHoveringStart = false;
    this.previewPoint = null;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.statusMessage = '';
  }

  removeLastPoint() {
    if (this.controlPoints.length > 0) {
      this.controlPoints.pop();
      this.isClosed = false;
      this.draw();
    }
  }

  private isNearPoint(p1: Point, p2: Point): boolean {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y) < this.SNAP_DISTANCE;
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
      const points = this.isClosed ? 
        [...this.controlPoints, this.controlPoints[0]] : 
        this.controlPoints;
      
      switch (this.curveType) {
        case 'bspline':
          curvePoints = this.bSplineService.calculatePoints(points);
          break;
        case 'nurbs':
          curvePoints = this.nurbsService.calculatePoints(points);
          break;
        default:
          curvePoints = this.splineService.calculatePoints(points);
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

      // Draw preview line to next point
      if (!this.isClosed && this.previewPoint && this.controlPoints.length > 0) {
        const lastPoint = this.controlPoints[this.controlPoints.length - 1];
        this.ctx.beginPath();
        this.ctx.moveTo(lastPoint.x, lastPoint.y);
        this.ctx.lineTo(this.previewPoint.x, this.previewPoint.y);
        this.ctx.strokeStyle = '#999';
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    }
    
    // Draw control points
    this.controlPoints.forEach((point, index) => {
      this.ctx.beginPath();
      
      // Special handling for start point
      if (index === 0) {
        this.ctx.arc(point.x, point.y, 
          this.isHoveringStart ? this.START_POINT_SIZE + 2 : this.START_POINT_SIZE, 
          0, Math.PI * 2);
        this.ctx.fillStyle = this.isHoveringStart ? '#4CAF50' : '#2196F3';
      } else {
        this.ctx.arc(point.x, point.y, this.CONTROL_POINT_SIZE, 0, Math.PI * 2);
        this.ctx.fillStyle = index === this.selectedPoint ? '#F44336' : '#2196F3';
      }
      
      this.ctx.fill();
    });
  }
}