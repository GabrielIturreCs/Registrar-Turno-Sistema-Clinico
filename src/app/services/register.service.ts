import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegisterForm } from '../interfaces';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  hostBase: string;
  constructor(private _http: HttpClient) { 
    this.hostBase = `${environment.apiUrl}/usuario/`;
  }

  //crearUsuario
  addUsuario(usuario:RegisterForm):Observable<any>{
    let httpOptions={
      headers: new HttpHeaders({
        'Content-Type':'application/json'
      })
    }
    let body:any = JSON.stringify(usuario)
    return this._http.post(this.hostBase,body,httpOptions);
  }

  getUsuarios(): Observable<any[]> {
    return this._http.get<any[]>(this.hostBase);
  }

}
