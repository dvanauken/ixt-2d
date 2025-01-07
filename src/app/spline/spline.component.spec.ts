import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplineComponent } from './spline.component';

describe('SplineComponent', () => {
  let component: SplineComponent;
  let fixture: ComponentFixture<SplineComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SplineComponent]
    });
    fixture = TestBed.createComponent(SplineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
