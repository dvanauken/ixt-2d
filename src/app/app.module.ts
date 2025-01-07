import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { SplineComponent } from './spline/spline.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SplineComponent  // Add the standalone component here
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }