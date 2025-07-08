/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { VistaPacienteComponent } from './vistaPaciente.component';

describe('VistaPacienteComponent', () => {
  let component: VistaPacienteComponent;
  let fixture: ComponentFixture<VistaPacienteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VistaPacienteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VistaPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
