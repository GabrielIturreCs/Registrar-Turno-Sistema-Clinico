import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RegisterForm } from '../interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {


  hostBase: string;
  constructor(private _http: HttpClient) { 
    this.hostBase = "http://localhost:3000/api/usuario/";
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


}
