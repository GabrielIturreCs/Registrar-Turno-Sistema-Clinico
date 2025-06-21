import { Component,OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false; //se cambia si el usuario está logueado 
  role = ''; //para el rol usuario y paciente

  ngOnInit(): void {
    const token = localStorage.getItem('token'); //se obtiene el token del localStorage
    const userRole = localStorage.getItem('rol'); // se obtiene el rol del usuario

    if (token) {
      this.isLoggedIn = true;
      this.role = userRole || ''; 
    }
  }
  logout(): void {
    localStorage.clear();
    window.location.href = '/login'; // redirige al usuario a la página de inicio de sesión
    this.isLoggedIn = false; // se actualiza el estado
    this.role = ''; // se limpia el rol del usuario
  }
}
