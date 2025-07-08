import { Injectable } from '@angular/core'
import { QuickQuestion, ConsultorioInfo } from '../interfaces/message.interface'

@Injectable({
  providedIn: 'root'
})
export class DataService {

  getQuickQuestions(): QuickQuestion[] {
    return [
      { text: "¿Cuáles son sus horarios de atención?", icon: "🕐" },
      { text: "¿Qué servicios ofrecen?", icon: "🦷" },
      { text: "¿Cómo puedo agendar una cita?", icon: "📅" },
      { text: "¿Aceptan seguros médicos?", icon: "💳" },
      { text: "¿Cuánto cuesta una limpieza dental?", icon: "💰" },
      { text: "¿Atienden emergencias dentales?", icon: "🚨" },
    ]
  }

  getConsultorioInfo(): ConsultorioInfo {
    return {
      horarios: "Lun-Vie: 8AM-6PM",
      emergencias: "24/7 Disponible",
      citas: "Agenda fácil",
    }
  }

  getWelcomeMessage(): string {
    return "¡Hola! Soy DentalBot 🦷\n\nEstoy aquí para ayudarte con información sobre nuestros servicios dentales, horarios y responder tus consultas generales.\n\n¿En qué puedo ayudarte hoy?"
  }
} 