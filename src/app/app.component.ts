import { Component } from '@angular/core';
import { SplineComponent } from './spline/spline.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [SplineComponent],
  standalone: true
})
export class AppComponent {
  title = 'ixt-2d';
}