import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentistaComponent } from './dentista.component';

describe('DentistaComponent', () => {
  let component: DentistaComponent;
  let fixture: ComponentFixture<DentistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DentistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
