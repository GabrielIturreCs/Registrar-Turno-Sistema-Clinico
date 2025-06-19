import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { NavbarComponent } from "./components/layouts/navbar/navbar.component";
import { FooterComponent } from "./components/layouts/footer/footer.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'clinicaDentalFront';
  showFooter = false;

  constructor() {
    const role = localStorage.getItem('rol');
    this.showFooter = role === 'paciente' || role === 'dentista';
  }
}
