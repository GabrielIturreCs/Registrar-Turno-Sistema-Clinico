import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private apiUrl = 'https://custom-chatbot-api.p.rapidapi.com/chatbotapi';

  private headers = new HttpHeaders({
    'x-rapidapi-key': 'ac2a652554msh4f2128d5dd8734ep163035jsncfad2c1a750c',
    'x-rapidapi-host': 'custom-chatbot-api.p.rapidapi.com',
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<any> {
    const body = {
      bot_id: 'OEXJ8qFp5E5AwRwymfPts90vrHnmr8yZgNE171101852010w2S0bCtN3THp448W7kDSfyTf3OpW5TUVefz',
      messages: [{ role: 'user', content: message }],
      user_id: 'gabriel', // debe tener valor no vacío
      temperature: 0.9,
      top_k: 5,
      top_p: 0.9,
      max_tokens: 256,
      model: 'gpt 3.5'
    };

    return this.http.post(this.apiUrl, body, { headers: this.headers }).pipe(
      map((response: any) => {
        return {
          success: response?.status === true,
          message: response?.result || response?.message || 'Sin respuesta',
        };
      }),
      catchError(error => {
        return of({
          success: false,
          message: `Error de conexión: ${error.message}`,
          error
        });
      })
    );
  }
}