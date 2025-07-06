import { Injectable } from '@angular/core'
import { Message } from '..//interfaces/message.interface'

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private conversationHistory: Message[] = [];
  private userContext: {
    userType: 'patient' | 'dentist';
    lastTopic: string;
    conversationStep: number;
    preferences: any;
  } = {
    userType: 'patient',
    lastTopic: '',
    conversationStep: 0,
    preferences: {}
  };

  private clinicContext = {
    name: "Clínica Dental Sonrisa Saludable",
    address: "Av. San Martín 1234, Ciudad Autónoma de Buenos Aires",
    phone: "(011) 4567-8901",
    whatsapp: "+54 9 11 4567-8901",
    email: "info@sonrisasaludable.com",
    website: "www.sonrisasaludable.com",
    specialties: [
      "Odontología General",
      "Ortodoncia",
      "Endodoncia", 
      "Periodoncia",
      "Implantología",
      "Odontopediatría",
      "Cirugía Oral",
      "Estética Dental"
    ],
    doctors: [
      "Dr. Carlos Mendoza - Odontólogo General",
      "Dra. Ana García - Ortodoncista",
      "Dr. Roberto Silva - Endodoncista",
      "Dra. María López - Periodoncista"
    ],
    equipment: [
      "Radiografía Digital",
      "Tomografía Computarizada",
      "Láser Dental",
      "Microscopio Operatorio",
      "Sistema de Imágenes Intraorales"
    ]
  };

  constructor() {
    // Cargar historial del usuario actual al inicializar
    this.loadFromLocalStorage();
  }

  // --- LOCALSTORAGE METHODS ---
  private getStorageKey(userId: string): string {
    return `chatbot_${userId}`;
  }

  private getContextKey(userId: string): string {
    return `chatbot_context_${userId}`;
  }

  private saveToLocalStorage(userId?: string): void {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        console.warn('No user ID available for saving chat');
        return;
      }

      const storageKey = this.getStorageKey(currentUserId);
      const contextKey = this.getContextKey(currentUserId);
      
      localStorage.setItem(storageKey, JSON.stringify(this.conversationHistory));
      localStorage.setItem(contextKey, JSON.stringify(this.userContext));
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
    }
  }

  private loadFromLocalStorage(userId?: string): void {
    try {
      const currentUserId = userId || this.getCurrentUserId();
      if (!currentUserId) {
        console.warn('No user ID available for loading chat');
        return;
      }

      const storageKey = this.getStorageKey(currentUserId);
      const contextKey = this.getContextKey(currentUserId);
      
      const savedHistory = localStorage.getItem(storageKey);
      const savedContext = localStorage.getItem(contextKey);
      
      if (savedHistory) {
        this.conversationHistory = JSON.parse(savedHistory);
        // Convertir timestamps de string a Date
        this.conversationHistory.forEach(msg => {
          if (typeof msg.timestamp === 'string') {
            msg.timestamp = new Date(msg.timestamp);
          }
        });
      }
      
      if (savedContext) {
        this.userContext = JSON.parse(savedContext);
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
      this.clearHistory();
    }
  }

  private getCurrentUserId(): string | null {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user._id || null;
      }
    } catch (error) {
      console.warn('Error getting current user ID:', error);
    }
    return null;
  }

  // --- CONTEXT MANAGEMENT ---
  setUserType(userType: 'patient' | 'dentist'): void {
    this.userContext.userType = userType;
    this.saveToLocalStorage();
  }

  getUserType(): 'patient' | 'dentist' {
    return this.userContext.userType;
  }

  setLastTopic(topic: string): void {
    this.userContext.lastTopic = topic;
    this.saveToLocalStorage();
  }

  getLastTopic(): string {
    return this.userContext.lastTopic;
  }

  incrementConversationStep(): void {
    this.userContext.conversationStep++;
    this.saveToLocalStorage();
  }

  getConversationStep(): number {
    return this.userContext.conversationStep;
  }

  setPreference(key: string, value: any): void {
    this.userContext.preferences[key] = value;
    this.saveToLocalStorage();
  }

  getPreference(key: string): any {
    return this.userContext.preferences[key];
  }

  // --- ENHANCED RESPONSE GENERATION ---
  generateResponse(userMessage: string, userType: 'patient' | 'dentist' = 'patient'): string {
    const message = userMessage.toLowerCase();
    this.addToHistory('user', userMessage);
    
    // Actualizar contexto
    this.setUserType(userType);
    this.incrementConversationStep();
    
    let response = '';
    if (userType === 'dentist') {
      response = this.generateDentistResponse(message);
    } else {
      response = this.generatePatientResponse(message);
    }
    
    this.addToHistory('assistant', response);
    this.saveToLocalStorage();
    return response;
  }

  // --- PACIENTES ---
  private generatePatientResponse(message: string): string {
    // Detectar tema de conversación
    let currentTopic = '';
    
    // DOLOR DENTAL - Expandido
    if (message.includes('me duele') || message.includes('dolor') || message.includes('molestia') || 
        message.includes('punzante') || message.includes('palpitante') || message.includes('agudo') ||
        message.includes('sordo') || message.includes('constante') || message.includes('intermitente')) {
      currentTopic = 'dolor_dental';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Dolor dental**\n\n¿Desde cuándo tienes el dolor? ¿Es constante o intermitente?\n\n**Causas posibles:** caries, infección, fractura, sensibilidad, absceso, sinusitis.\n**Recomendaciones:**\n- Evita alimentos fríos/calientes\n- No mastiques del lado afectado\n- Analgésico si es necesario\n- Llama al ${this.clinicContext.phone}\n\n¿Puedes describir más el dolor?`;
      } else if (step === 2) {
        return `Entiendo. Basándome en lo que me cuentas, te recomiendo:\n\n**Acción inmediata:**\n- Toma un analgésico si el dolor es intenso\n- Aplica frío local (hielo envuelto en tela)\n- Evita masticar del lado afectado\n\n**Próximos pasos:**\n- Agenda una consulta urgente\n- Llama al ${this.clinicContext.phone}\n- Si el dolor es muy intenso, ve a emergencias\n\n¿Quieres que te ayude a agendar una consulta?`;
      }
    }
    
    // SENSIBILIDAD DENTAL - Expandido
    if (message.includes('sensibilidad') || message.includes('sensible') || message.includes('frío') || 
        message.includes('caliente') || message.includes('dulce') || message.includes('ácido') ||
        message.includes('encía retraída') || message.includes('cuello expuesto')) {
      currentTopic = 'sensibilidad';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Sensibilidad dental**\n\nCausas: desgaste de esmalte, encías retraídas, caries pequeñas, cepillado fuerte, rechinamiento.\n**Tratamiento:** pasta desensibilizante, barniz fluorado, resina, tratamiento de encías, sellantes.\n**Consejos:** usa pasta para sensibles, cepilla suave, evita extremos de temperatura.\n\n¿A qué estímulos eres sensible?`;
      } else if (step === 2) {
        return `Perfecto. Para la sensibilidad te recomiendo:\n\n**Tratamiento inmediato:**\n- Pasta dental para dientes sensibles\n- Cepillo de cerdas suaves\n- Enjuague bucal específico\n- Evita alimentos ácidos\n\n**En la clínica:**\n- Aplicación de barniz fluorado\n- Sellado de cuellos expuestos\n- Evaluación de la causa raíz\n- Tratamiento de encías si es necesario\n\n¿Te gustaría agendar una consulta para evaluar la causa?`;
      }
    }
    
    // Sangrado de encías
    if (message.includes('sangrado') || message.includes('sangra') || message.includes('encía')) {
      currentTopic = 'sangrado_encias';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🩸 **Sangrado de encías**\n\nCausas: placa bacteriana, cepillado fuerte, cambios hormonales, enfermedad periodontal.\n**Tratamiento:** limpieza profesional, enjuague antiséptico, técnica de cepillado.\n**Prevención:** cepilla 3 veces/día, hilo dental, limpieza cada 6 meses.\n\n¿Tienes sangrado frecuente?`;
      } else if (step === 2) {
        return `El sangrado frecuente puede indicar gingivitis o periodontitis. Te recomiendo:\n\n**Acción inmediata:**\n- Mejora tu técnica de cepillado\n- Usa hilo dental suavemente\n- Enjuague antiséptico\n\n**Consulta profesional:**\n- Limpieza profunda (detartraje)\n- Evaluación periodontal\n- Plan de tratamiento\n\n¿Quieres agendar una limpieza profesional?`;
      }
    }
    
    // Mal aliento
    if (message.includes('mal aliento') || message.includes('halitosis')) {
      currentTopic = 'mal_aliento';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `😷 **Mal aliento**\n\nCausas: mala higiene, caries, enfermedad periodontal, boca seca, tabaco.\n**Tratamiento:** limpieza profunda, tratar caries, enjuagues especiales, hidratación.\n**Consejos:** cepilla lengua, usa hilo dental, enjuague sin alcohol, bebe agua.\n\n¿Te preocupa el mal aliento?`;
      } else if (step === 2) {
        return `Para combatir el mal aliento:\n\n**Higiene mejorada:**\n- Cepilla lengua suavemente\n- Usa hilo dental diariamente\n- Enjuague bucal sin alcohol\n- Hidratación constante\n\n**Tratamiento profesional:**\n- Limpieza profunda\n- Tratamiento de caries\n- Evaluación de encías\n- Enjuagues especializados\n\n¿Quieres una evaluación completa?`;
      }
    }
    
    // Cuidado infantil
    if (message.includes('niño') || message.includes('bebé') || message.includes('hijo')) {
      currentTopic = 'cuidado_infantil';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `👶 **Odontopediatría**\n\nPrimera visita: 1 año. Revisiones: cada 6 meses.\n**Cuidados:** limpiar encías con gasa, cepillado supervisado, sellantes, flúor.\n**Consejos:** hacer del cepillado un juego, limitar dulces, dar ejemplo.\n\n¿Quieres agendar la primera visita?`;
      } else if (step === 2) {
        return `Excelente decisión. Para la primera visita:\n\n**Preparación:**\n- Explícale que será divertido\n- Lee cuentos sobre el dentista\n- No uses palabras como "dolor" o "inyección"\n- Llega 10 minutos antes\n\n**En la consulta:**\n- Evaluación completa\n- Limpieza suave\n- Aplicación de flúor\n- Consejos para padres\n\n¿Quieres agendar la cita?`;
      }
    }
    
    // Embarazo
    if (message.includes('embarazo') || message.includes('embarazada')) {
      currentTopic = 'embarazo';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🤰 **Salud dental en el embarazo**\n\n¡Sí, puedes ir al dentista!\n**Cambios hormonales:** encías sensibles, más riesgo de caries.\n**Tratamientos seguros:** limpieza, empastes, radiografías con protección.\n**Cuidados:** cepilla más frecuente, dieta rica en calcio.\n\n¿Estás embarazada?`;
      } else if (step === 2) {
        return `Durante el embarazo es muy importante el cuidado dental:\n\n**Tratamientos seguros:**\n- Limpieza profesional\n- Empastes urgentes\n- Radiografías con protección\n- Tratamiento de encías\n\n**Cuidados especiales:**\n- Cepillado más frecuente\n- Hilo dental diario\n- Dieta rica en calcio\n- Evitar tabaco y alcohol\n\n¿Quieres agendar tu consulta prenatal?`;
      }
    }
    
    // Bruxismo
    if (message.includes('bruxismo') || message.includes('aprieto') || message.includes('rechino')) {
      currentTopic = 'bruxismo';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `😬 **Bruxismo**\n\nApretar/rechinar dientes, sobre todo de noche.\n**Síntomas:** dolor mandíbula, desgaste, dolor cabeza.\n**Tratamiento:** placa de descarga, relajación muscular, control de estrés.\n\n¿Aprietas los dientes?`;
      } else if (step === 2) {
        return `El bruxismo puede causar problemas serios. Te recomiendo:\n\n**Tratamiento inmediato:**\n- Placa de descarga nocturna\n- Ejercicios de relajación\n- Control del estrés\n- Evitar cafeína por la noche\n\n**Evaluación profesional:**\n- Análisis de la mordida\n- Evaluación muscular\n- Plan de tratamiento\n- Seguimiento\n\n¿Quieres una evaluación para la placa de descarga?`;
      }
    }
    
    // Manchas en dientes
    if (message.includes('mancha') || message.includes('color') || message.includes('café') || message.includes('tabaco')) {
      currentTopic = 'manchas';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `☕ **Manchas en los dientes**\n\nCausas: café, té, tabaco, medicamentos.\n**Tratamientos:** limpieza profesional, blanqueamiento, carillas.\n**Prevención:** cepilla después de café/té, usa pajilla, limpieza regular.\n\n¿Quieres eliminar manchas?`;
      } else if (step === 2) {
        return `Para eliminar manchas tenemos varias opciones:\n\n**Tratamientos disponibles:**\n- Limpieza profesional profunda\n- Blanqueamiento dental\n- Carillas de porcelana\n- Microabrasión\n\n**Prevención:**\n- Cepilla después de café/té\n- Usa pajilla para bebidas\n- Limpieza cada 6 meses\n- Evita tabaco\n\n¿Quieres una evaluación para ver qué tratamiento te conviene?`;
      }
    }
    
    // Endodoncia
    if (message.includes('endodoncia') || message.includes('conducto') || message.includes('nervio')) {
      currentTopic = 'endodoncia';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Endodoncia**\n\nElimina la pulpa infectada para salvar el diente.\n**Cuándo:** dolor intenso, sensibilidad, infección, caries profunda.\n**Proceso:** anestesia, limpieza, relleno, restauración.\n\n¿Tienes dolor intenso?`;
      } else if (step === 2) {
        return `La endodoncia es un procedimiento seguro y efectivo:\n\n**Proceso:**\n- Anestesia local\n- Apertura del diente\n- Limpieza de conductos\n- Relleno y sellado\n- Restauración final\n\n**Después del tratamiento:**\n- Puede haber molestia leve\n- Evita masticar fuerte\n- Mantén buena higiene\n- Seguimiento necesario\n\n¿Quieres agendar tu endodoncia?`;
      }
    }
    
    // Periodoncia
    if (message.includes('periodoncia') || message.includes('piorrea') || message.includes('hueso')) {
      currentTopic = 'periodoncia';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Periodoncia**\n\nEnfermedad de encías y hueso.\n**Síntomas:** encías inflamadas, sangrado, dientes flojos.\n**Tratamientos:** limpieza profunda, cirugía, mantenimiento.\n\n¿Tus encías sangran?`;
      } else if (step === 2) {
        return `La enfermedad periodontal es tratable:\n\n**Tratamientos:**\n- Limpieza profunda (raspado)\n- Cirugía periodontal si es necesario\n- Mantenimiento cada 3-4 meses\n- Control de factores de riesgo\n\n**Prevención:**\n- Higiene excelente\n- Control de diabetes\n- Evitar tabaco\n- Revisiones regulares\n\n¿Quieres una evaluación periodontal completa?`;
      }
    }
    
    // Ortodoncia
    if (message.includes('brackets') || message.includes('ortodoncia') || message.includes('alinear')) {
      currentTopic = 'ortodoncia';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Ortodoncia**\n\nTipos: brackets metálicos, cerámicos, alineadores.\n**Proceso:** evaluación, plan, colocación, seguimiento, retención.\n**Duración:** 18-24 meses.\n\n¿Quieres una evaluación gratuita?`;
      } else if (step === 2) {
        return `La ortodoncia puede transformar tu sonrisa:\n\n**Opciones disponibles:**\n- Brackets metálicos (más económicos)\n- Brackets cerámicos (más estéticos)\n- Alineadores transparentes\n- Ortodoncia lingual\n\n**Proceso:**\n- Evaluación completa\n- Plan personalizado\n- Colocación gradual\n- Seguimiento mensual\n- Retención permanente\n\n¿Quieres agendar tu evaluación gratuita?`;
      }
    }
    
    // IMPLANTES - Expandido
    if (message.includes('implante') || message.includes('diente perdido') || message.includes('extracción') ||
        message.includes('diente faltante') || message.includes('reemplazo') || message.includes('prótesis') ||
        message.includes('corona') || message.includes('puente')) {
      currentTopic = 'implantes';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Implantes dentales**\n\nReemplazan dientes perdidos con tornillos de titanio.\n**Ventajas:** durabilidad, naturalidad, función, estética.\n**Proceso:** evaluación, cirugía, integración, corona.\n**Alternativas:** puentes, prótesis removibles.\n\n¿Tienes dientes perdidos o te falta alguno?`;
      } else if (step === 2) {
        return `Los implantes son la mejor opción para dientes perdidos:\n\n**Ventajas:**\n- Durabilidad de por vida\n- Función natural\n- Estética perfecta\n- No afecta dientes vecinos\n- Mantiene hueso\n\n**Proceso:**\n- Evaluación con tomografía\n- Cirugía ambulatoria\n- Integración ósea (3-6 meses)\n- Colocación de corona\n\n¿Quieres una evaluación para implantes?`;
      }
    }

    // HIGIENE BUCAL - Nuevo tema
    if (message.includes('cepillado') || message.includes('hilo dental') || message.includes('enjuague') ||
        message.includes('limpieza') || message.includes('higiene') || message.includes('técnica') ||
        message.includes('cepillo') || message.includes('pasta') || message.includes('bacterias')) {
      currentTopic = 'higiene_bucal';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Higiene bucal**\n\n**Técnica correcta:**\n- Cepilla 2-3 veces/día\n- Usa hilo dental diariamente\n- Enjuague bucal sin alcohol\n- Cepilla lengua suavemente\n\n**Herramientas:**\n- Cepillo de cerdas suaves\n- Pasta con flúor\n- Hilo dental o cepillos interdentales\n- Enjuague antiséptico\n\n¿Tienes dudas sobre tu técnica de cepillado?`;
      } else if (step === 2) {
        return `Para mejorar tu higiene bucal:\n\n**Técnica mejorada:**\n- Cepilla en círculos pequeños\n- Inclina el cepillo 45°\n- No olvides las caras internas\n- Cambia cepillo cada 3 meses\n\n**Productos recomendados:**\n- Pasta con flúor 1450ppm\n- Cepillo eléctrico (opcional)\n- Irrigador bucal\n- Sellantes dentales\n\n¿Quieres una demostración de técnica?`;
      }
    }

    // CARIES - Nuevo tema
    if (message.includes('caries') || message.includes('cavidad') || message.includes('agujero') ||
        message.includes('empaste') || message.includes('obturación') || message.includes('azúcar') ||
        message.includes('dulces') || message.includes('bebidas') || message.includes('chocolate')) {
      currentTopic = 'caries';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Caries dental**\n\n**Causas:** bacterias + azúcares + tiempo.\n**Síntomas:** mancha blanca, dolor, sensibilidad.\n**Prevención:**\n- Reduce azúcares\n- Cepilla después de comer\n- Usa hilo dental\n- Visitas regulares\n\n¿Tienes alguna mancha o dolor?`;
      } else if (step === 2) {
        return `Para tratar las caries:\n\n**Tratamientos:**\n- Empaste (caries pequeñas)\n- Endodoncia (caries profundas)\n- Corona (diente muy dañado)\n- Extracción (último recurso)\n\n**Prevención futura:**\n- Dieta baja en azúcares\n- Higiene excelente\n- Sellantes dentales\n- Flúor profesional\n\n¿Quieres una evaluación para detectar caries?`;
      }
    }

    // BLANQUEAMIENTO - Nuevo tema
    if (message.includes('blanqueamiento') || message.includes('blanco') || message.includes('color') ||
        message.includes('manchas') || message.includes('amarillo') || message.includes('oscuro') ||
        message.includes('brillo') || message.includes('estética') || message.includes('sonrisa')) {
      currentTopic = 'blanqueamiento';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Blanqueamiento dental**\n\n**Tipos:**\n- Blanqueamiento profesional (consultorio)\n- Blanqueamiento casero (moldes)\n- Pasta blanqueadora\n- Carillas de porcelana\n\n**Duración:** 1-2 años\n**Efectos secundarios:** sensibilidad temporal\n\n¿Qué tipo de blanqueamiento te interesa?`;
      } else if (step === 2) {
        return `Para el blanqueamiento te recomiendo:\n\n**Profesional:**\n- Resultados inmediatos\n- Seguro y controlado\n- Duración 1-2 años\n- Sensibilidad mínima\n\n**Casero:**\n- Más económico\n- Resultados graduales\n- Requiere constancia\n- Moldes personalizados\n\n¿Quieres una evaluación para blanqueamiento?`;
      }
    }

    // EMERGENCIAS DENTALES - Nuevo tema
    if (message.includes('emergencia') || message.includes('urgencia') || message.includes('accidente') ||
        message.includes('golpe') || message.includes('fractura') || message.includes('sangrado') ||
        message.includes('trauma') || message.includes('diente roto') || message.includes('luxación')) {
      currentTopic = 'emergencias';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🚨 **Emergencia dental**\n\n**Tipos de emergencias:**\n- Dolor intenso\n- Diente roto/fracturado\n- Diente salido (luxación)\n- Sangrado profuso\n- Infección con fiebre\n\n**Qué hacer:**\n- Mantén la calma\n- Preserva fragmentos\n- Llama al ${this.clinicContext.phone}\n- Ve a emergencias si es grave\n\n¿Qué tipo de emergencia tienes?`;
      } else if (step === 2) {
        return `Para tu emergencia específica:\n\n**Acción inmediata:**\n- Aplica frío si hay inflamación\n- Preserva fragmentos en leche\n- No toques la raíz del diente\n- Toma analgésico si es necesario\n\n**Próximos pasos:**\n- Consulta urgente\n- Radiografía\n- Tratamiento inmediato\n- Seguimiento\n\n¿Necesitas atención urgente?`;
      }
    }

    // DIABETES Y SALUD DENTAL - Nuevo tema
    if (message.includes('diabetes') || message.includes('diabético') || message.includes('glucosa') ||
        message.includes('azúcar en sangre') || message.includes('insulina') || message.includes('medicación')) {
      currentTopic = 'diabetes';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Diabetes y salud dental**\n\n**Riesgos:**\n- Mayor riesgo de caries\n- Enfermedad periodontal\n- Infecciones\n- Cicatrización lenta\n\n**Cuidados especiales:**\n- Control de glucosa\n- Higiene excelente\n- Visitas frecuentes\n- Comunicación con médico\n\n¿Tienes diabetes controlada?`;
      } else if (step === 2) {
        return `Para pacientes diabéticos:\n\n**Recomendaciones:**\n- Cepilla 3 veces/día\n- Usa hilo dental diario\n- Controla glucosa antes de tratamientos\n- Informa a tu dentista\n\n**Tratamientos seguros:**\n- Limpieza profesional\n- Empastes\n- Endodoncia\n- Cirugía con precauciones\n\n¿Quieres una evaluación especializada?`;
      }
    }

    // ANSIEDAD DENTAL - Nuevo tema
    if (message.includes('miedo') || message.includes('ansiedad') || message.includes('nervios') ||
        message.includes('pánico') || message.includes('fobia') || message.includes('tranquilo') ||
        message.includes('calma') || message.includes('relajación') || message.includes('sedación')) {
      currentTopic = 'ansiedad_dental';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `😰 **Ansiedad dental**\n\n**Es muy común** - 60% de las personas sienten ansiedad.\n\n**Opciones para ayudarte:**\n- Sedación consciente\n- Técnicas de relajación\n- Explicación detallada\n- Ambiente tranquilo\n- Música relajante\n\n¿Qué te causa más ansiedad?`;
      } else if (step === 2) {
        return `Para manejar tu ansiedad:\n\n**En la consulta:**\n- Señal de parada\n- Explicación paso a paso\n- Pausas cuando necesites\n- Ambiente relajante\n\n**Opciones de sedación:**\n- Óxido nitroso (gas de la risa)\n- Sedación oral\n- Anestesia general (casos extremos)\n\n¿Quieres conocer más sobre sedación?`;
      }
    }

    // COSTOS Y FINANCIAMIENTO - Nuevo tema
    if (message.includes('costo') || message.includes('precio') || message.includes('cuánto') ||
        message.includes('pago') || message.includes('financiamiento') || message.includes('obra social') ||
        message.includes('prepaga') || message.includes('cuotas') || message.includes('económico')) {
      currentTopic = 'costos';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `💰 **Costos y financiamiento**\n\n**Aceptamos:**\n- Obras sociales\n- Prepagas\n- Pago en efectivo\n- Tarjetas de crédito/débito\n- Cuotas sin interés\n\n**Consultas:**\n- Primera consulta: $X\n- Limpieza: $X\n- Empaste: $X\n\n¿Qué tratamiento te interesa?`;
      } else if (step === 2) {
        return `Para tu tratamiento específico:\n\n**Opciones de pago:**\n- Pago contado (descuento)\n- Cuotas sin interés\n- Financiamiento bancario\n- Obra social\n\n**Presupuesto:**\n- Evaluación gratuita\n- Presupuesto detallado\n- Sin compromiso\n- Transparencia total\n\n¿Quieres un presupuesto personalizado?`;
      }
    }

    // HORARIOS Y UBICACIÓN - Nuevo tema
    if (message.includes('horario') || message.includes('día') || message.includes('hora') ||
        message.includes('cuándo') || message.includes('disponible') || message.includes('dirección') ||
        message.includes('ubicación') || message.includes('cómo llegar') || message.includes('estacionamiento')) {
      currentTopic = 'horarios_ubicacion';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🕒 **Horarios y ubicación**\n\n**Horarios de atención:**\n- Lunes a Viernes: 8:00 - 20:00\n- Sábados: 8:00 - 14:00\n- Emergencias: 24/7\n\n**Ubicación:**\n${this.clinicContext.address}\n\n**Contacto:**\n📞 ${this.clinicContext.phone}\n📱 ${this.clinicContext.whatsapp}\n\n¿Qué día te conviene?`;
      } else if (step === 2) {
        return `Para tu visita:\n\n**Cómo llegar:**\n- Colectivos: líneas X, Y, Z\n- Subte: línea X, estación X\n- Auto: estacionamiento gratuito\n\n**Preparación:**\n- Llega 10 min antes\n- Trae DNI y obra social\n- No comas 2 horas antes\n- Ven acompañado si es necesario\n\n¿Necesitas indicaciones específicas?`;
      }
    }

    // NUTRICIÓN Y SALUD DENTAL - Nuevo tema
    if (message.includes('nutrición') || message.includes('dieta') || message.includes('alimentación') ||
        message.includes('vitaminas') || message.includes('calcio') || message.includes('frutas') ||
        message.includes('verduras') || message.includes('proteínas') || message.includes('minerales')) {
      currentTopic = 'nutricion_dental';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🥗 **Nutrición y salud dental**\n\n**Alimentos beneficiosos:**\n- Lácteos (calcio)\n- Verduras verdes (vitamina K)\n- Frutas cítricas (vitamina C)\n- Pescado (vitamina D)\n- Frutos secos (fósforo)\n\n**Alimentos a evitar:**\n- Azúcares refinados\n- Bebidas carbonatadas\n- Alimentos pegajosos\n- Snacks entre comidas\n\n¿Quieres una guía nutricional personalizada?`;
      } else if (step === 2) {
        return `Para una dieta dental saludable:\n\n**Plan nutricional:**\n- 3 comidas principales\n- 2 colaciones saludables\n- Hidratación constante\n- Masticación lenta\n\n**Suplementos recomendados:**\n- Calcio si es necesario\n- Vitamina D\n- Probióticos\n- Omega 3\n\n**Consejos prácticos:**\n- Come frutas enteras\n- Incluye proteínas magras\n- Evita picar constantemente\n- Cepilla después de comer\n\n¿Quieres una evaluación nutricional?`;
      }
    }

    // MEDICAMENTOS Y SALUD DENTAL - Nuevo tema
    if (message.includes('medicamento') || message.includes('antibiótico') || message.includes('analgésico') ||
        message.includes('antiinflamatorio') || message.includes('pastilla') || message.includes('tableta') ||
        message.includes('jarabe') || message.includes('gotas') || message.includes('inyección')) {
      currentTopic = 'medicamentos_dental';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `💊 **Medicamentos y salud dental**\n\n**Medicamentos comunes:**\n- Analgésicos (paracetamol, ibuprofeno)\n- Antibióticos (amoxicilina, clindamicina)\n- Antiinflamatorios\n- Enjuagues antisépticos\n- Pasta desensibilizante\n\n**Precauciones:**\n- Tomar con agua\n- Respetar horarios\n- Completar tratamiento\n- Informar efectos secundarios\n\n¿Qué medicamento te recetaron?`;
      } else if (step === 2) {
        return `Para el uso correcto de medicamentos:\n\n**Analgésicos:**\n- Tomar cada 6-8 horas\n- No exceder dosis\n- Tomar con alimentos\n- Evitar alcohol\n\n**Antibióticos:**\n- Completar todo el tratamiento\n- Tomar a la misma hora\n- No saltar dosis\n- Informar reacciones\n\n**Interacciones:**\n- Evitar alcohol\n- Consultar otros medicamentos\n- Informar al dentista\n- Seguir indicaciones\n\n¿Tienes dudas sobre algún medicamento?`;
      }
    }

    // CUIDADO POST-TRATAMIENTO - Nuevo tema
    if (message.includes('después') || message.includes('post') || message.includes('cuidado') ||
        message.includes('recuperación') || message.includes('cicatrización') || message.includes('seguimiento') ||
        message.includes('control') || message.includes('revisión') || message.includes('mantenimiento')) {
      currentTopic = 'cuidado_post_tratamiento';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🩹 **Cuidado post-tratamiento**\n\n**Cuidados generales:**\n- Mantener higiene\n- Seguir dieta blanda\n- Evitar esfuerzos\n- Tomar medicamentos\n- Asistir a controles\n\n**Señales de alarma:**\n- Dolor intenso\n- Sangrado excesivo\n- Fiebre\n- Inflamación\n\n¿Qué tratamiento te realizaron?`;
      } else if (step === 2) {
        return `Para tu recuperación específica:\n\n**Primeras 24 horas:**\n- Aplicar hielo\n- Dieta líquida\n- Descanso\n- No enjuagar fuerte\n\n**Primera semana:**\n- Dieta blanda\n- Higiene suave\n- Evitar tabaco/alcohol\n- Control de síntomas\n\n**Seguimiento:**\n- Controles programados\n- Radiografías de control\n- Ajustes si es necesario\n- Mantenimiento\n\n¿Necesitas instrucciones específicas?`;
      }
    }

    // PREVENCIÓN Y MANTENIMIENTO - Nuevo tema
    if (message.includes('prevención') || message.includes('mantenimiento') || message.includes('revisión') ||
        message.includes('control') || message.includes('limpieza') || message.includes('profilaxis') ||
        message.includes('flúor') || message.includes('sellantes') || message.includes('chequeo')) {
      currentTopic = 'prevencion_mantenimiento';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🛡️ **Prevención y mantenimiento**\n\n**Visitas regulares:**\n- Cada 6 meses\n- Limpieza profesional\n- Aplicación de flúor\n- Sellantes dentales\n- Evaluación de riesgo\n\n**Prevención en casa:**\n- Cepillado correcto\n- Hilo dental\n- Enjuague bucal\n- Dieta saludable\n\n¿Cuándo fue tu última revisión?`;
      } else if (step === 2) {
        return `Para mantener tu salud dental:\n\n**Programa de mantenimiento:**\n- Limpieza cada 6 meses\n- Aplicación de flúor\n- Sellantes si es necesario\n- Evaluación de encías\n- Radiografías anuales\n\n**Prevención personalizada:**\n- Técnica de cepillado\n- Productos específicos\n- Dieta individualizada\n- Control de factores de riesgo\n\n¿Quieres agendar tu próxima limpieza?`;
      }
    }
    
    // Respuesta por defecto con contexto
    const lastTopic = this.getLastTopic();
    if (lastTopic && this.getConversationStep() > 2) {
      return `Entiendo que sigues preguntando sobre ${this.getTopicName(lastTopic)}. ¿Te gustaría que te ayude a agendar una consulta para resolver todas tus dudas con un especialista?`;
    }
    
    return `🤔 **Entiendo tu consulta sobre "${message}"**\n\nPuedo ayudarte con:\n- Dolor dental\n- Sensibilidad\n- Encías y sangrado\n- Mal aliento\n- Cuidado infantil\n- Embarazo\n- Bruxismo\n- Manchas y blanqueamiento\n- Caries y empastes\n- Endodoncia\n- Periodoncia\n- Ortodoncia\n- Implantes\n- Higiene bucal\n- Emergencias\n- Diabetes\n- Ansiedad dental\n- Costos y financiamiento\n- Horarios y ubicación\n- Nutrición dental\n- Medicamentos\n- Cuidado post-tratamiento\n- Prevención y mantenimiento\n\n¿Podrías ser más específico?`;
  }

  private getTopicName(topic: string): string {
    const topicNames: { [key: string]: string } = {
      'dolor_dental': 'dolor dental',
      'sensibilidad': 'sensibilidad dental',
      'sangrado_encias': 'sangrado de encías',
      'mal_aliento': 'mal aliento',
      'cuidado_infantil': 'cuidado dental infantil',
      'embarazo': 'salud dental en el embarazo',
      'bruxismo': 'bruxismo',
      'manchas': 'manchas en los dientes',
      'endodoncia': 'endodoncia',
      'periodoncia': 'enfermedad periodontal',
      'ortodoncia': 'ortodoncia',
      'implantes': 'implantes dentales',
      'higiene_bucal': 'higiene bucal',
      'caries': 'caries dental',
      'blanqueamiento': 'blanqueamiento dental',
      'emergencias': 'emergencias dentales',
      'diabetes': 'diabetes y salud dental',
      'ansiedad_dental': 'ansiedad dental',
      'costos': 'costos y financiamiento',
      'horarios_ubicacion': 'horarios y ubicación',
      'nutricion_dental': 'nutrición y salud dental',
      'medicamentos_dental': 'medicamentos y salud dental',
      'cuidado_post_tratamiento': 'cuidado post-tratamiento',
      'prevencion_mantenimiento': 'prevención y mantenimiento'
    };
    return topicNames[topic] || topic;
  }

  // --- DENTISTAS ---
  private generateDentistResponse(message: string): string {
    // Detectar tema de conversación
    let currentTopic = '';
    
    // Pacientes difíciles
    if (message.includes('paciente difícil') || message.includes('paciente ansioso') || message.includes('manejo')) {
      currentTopic = 'pacientes_dificiles';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `👨‍⚕️ **Manejo de pacientes difíciles**\n\n- Escucha activa\n- Valida preocupaciones\n- Lenguaje no técnico\n- Técnicas de relajación\n- Explica cada paso\n- Sedación si es necesario\n- Notas clínicas detalladas\n\n¿Necesitas ayuda con un caso específico?`;
      } else if (step === 2) {
        return `Para pacientes ansiosos específicamente:\n\n**Técnicas efectivas:**\n- Técnica "Tell-Show-Do"\n- Distracción con música\n- Respiración guiada\n- Sedación consciente\n- Ambiente relajante\n\n**Comunicación:**\n- Explica antes de hacer\n- Usa analogías simples\n- Valida sus miedos\n- Ofrece control\n\n¿Quieres que profundicemos en alguna técnica?`;
      }
    }
    
    // Emergencias
    if (message.includes('emergencia') || message.includes('urgencia')) {
      currentTopic = 'emergencias';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🚨 **Protocolo de emergencias dentales**\n\n- Dolor severo: evaluación inmediata\n- Fractura: preservar fragmento\n- Luxación: reposición rápida\n- Hemorragia: control inmediato\n- Infección: antibióticos y drenaje\n\n¿Tienes una emergencia que atender?`;
      } else if (step === 2) {
        return `Para emergencias específicas:\n\n**Dolor severo:**\n- Evaluar causa (caries, fractura, infección)\n- Analgésicos apropiados\n- Antibióticos si hay infección\n- Derivación si es necesario\n\n**Fractura dental:**\n- Preservar fragmento en leche\n- Evaluar extensión\n- Restauración inmediata o temporal\n- Seguimiento\n\n¿Qué tipo de emergencia estás atendiendo?`;
      }
    }
    
    // Instrumentos rotos
    if (message.includes('instrumento roto') || message.includes('fresa rota') || message.includes('se rompió')) {
      currentTopic = 'instrumentos_rotos';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🛠️ **Instrumento roto**\n\n- Mantén la calma\n- Detén el procedimiento\n- Localiza el fragmento\n- Informa al paciente\n- Documenta en la historia clínica\n- Seguimiento y prevención futura\n\n¿Qué instrumento se rompió?`;
      } else if (step === 2) {
        return `Protocolo específico para instrumentos rotos:\n\n**Acción inmediata:**\n- Detener procedimiento\n- Localizar fragmento con radiografía\n- Informar al paciente\n- Documentar en historia clínica\n\n**Prevención:**\n- Revisar instrumental antes de usar\n- No forzar instrumentos\n- Mantenimiento regular\n- Reemplazo preventivo\n\n¿Pudiste localizar el fragmento?`;
      }
    }
    
    // Anestesia
    if (message.includes('anestesia') || message.includes('anestésico')) {
      currentTopic = 'anestesia';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `💉 **Guía de anestesia dental**\n\n- Tópica, local, troncular, sedación\n- Técnica de la mariposa\n- Aplicación lenta\n- Temperatura adecuada\n- Distracción\n- Precaución en embarazadas, niños, ancianos\n\n¿Qué tipo de anestesia necesitas aplicar?`;
      } else if (step === 2) {
        return `Técnicas específicas de anestesia:\n\n**Anestesia local:**\n- Técnica de la mariposa\n- Aplicación lenta y suave\n- Distracción del paciente\n- Temperatura corporal\n\n**Consideraciones especiales:**\n- Embarazadas: evitar primer trimestre\n- Niños: dosis ajustada\n- Ancianos: precaución cardiovascular\n- Ansiosos: sedación previa\n\n¿Necesitas ayuda con alguna técnica específica?`;
      }
    }
    
    // Comunicación
    if (message.includes('comunicación') || message.includes('explicar')) {
      currentTopic = 'comunicacion';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🗣️ **Comunicación con pacientes**\n\n- Explica con claridad\n- Usa ejemplos visuales\n- Sé empático\n- Informa sobre costos y alternativas\n- Refuerza la confianza\n\n¿Tienes dificultades con algún tipo de paciente?`;
      } else if (step === 2) {
        return `Estrategias de comunicación efectiva:\n\n**Explicación de tratamientos:**\n- Usa analogías simples\n- Muestra modelos o imágenes\n- Explica beneficios y riesgos\n- Ofrece alternativas\n\n**Manejo de costos:**\n- Transparencia total\n- Planes de pago\n- Priorizar tratamientos\n- Documentar todo\n\n¿Quieres que profundicemos en algún aspecto?`;
      }
    }
    
    // Control de infecciones
    if (message.includes('infección') || message.includes('esterilización')) {
      currentTopic = 'control_infecciones';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦠 **Control de infecciones**\n\n- Esteriliza instrumental\n- Usa barreras de protección\n- Desinfecta superficies\n- Lavado de manos frecuente\n- Control de residuos\n\n¿Tienes dudas sobre algún protocolo?`;
      } else if (step === 2) {
        return `Protocolos específicos de control de infecciones:\n\n**Esterilización:**\n- Autoclave a 121°C por 20 min\n- Indicadores químicos y biológicos\n- Almacenamiento estéril\n- Rotación de instrumental\n\n**Protección personal:**\n- Guantes, mascarilla, gafas\n- Cambio entre pacientes\n- Lavado de manos\n- Desinfección de superficies\n\n¿Necesitas actualizar algún protocolo?`;
      }
    }
    
    // Actualización profesional
    if (message.includes('curso') || message.includes('actualización')) {
      currentTopic = 'actualizacion_profesional';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📚 **Actualización profesional**\n\n- Cursos online: Círculo Odontológico, AOA, FOUBA\n- Congresos: CICAO, FDI\n- Revistas: Journal of Dental Research, Acta Odontológica\n\n¿Qué área te interesa actualizar?`;
      } else if (step === 2) {
        return `Opciones específicas de actualización:\n\n**Cursos online:**\n- Círculo Odontológico Argentino\n- Asociación Odontológica Argentina\n- FOUBA (Federación Odontológica)\n- Plataformas internacionales\n\n**Congresos 2024:**\n- CICAO (Buenos Aires)\n- FDI World Dental Congress\n- Jornadas regionales\n\n¿Te interesa algún área específica?`;
      }
    }
    
    // GESTIÓN DE AGENDA - Expandido
    if (message.includes('agenda') || message.includes('ausentismo') || message.includes('turnos') ||
        message.includes('confirmación') || message.includes('recordatorio') || message.includes('lista de espera') ||
        message.includes('cancelación') || message.includes('reprogramación')) {
      currentTopic = 'gestion_agenda';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📅 **Gestión de agenda**\n\n- Confirmar turnos por WhatsApp\n- Recordatorios automáticos\n- Lista de espera\n- Flexibilidad horaria\n- Seguimiento de ausentistas\n- Política de cancelaciones\n\n¿Tienes problemas con ausentismo?`;
      } else if (step === 2) {
        return `Estrategias para reducir ausentismo:\n\n**Confirmación de turnos:**\n- WhatsApp 24h antes\n- Llamada telefónica\n- Email de recordatorio\n- SMS automático\n\n**Manejo de ausentistas:**\n- Lista de espera\n- Cargo por cancelación tardía\n- Política clara de reprogramación\n- Seguimiento personalizado\n\n¿Quieres implementar alguna estrategia?`;
      }
    }

    // DIAGNÓSTICO DIFERENCIAL - Nuevo tema
    if (message.includes('diagnóstico') || message.includes('diferencial') || message.includes('síntomas') ||
        message.includes('evaluación') || message.includes('examen') || message.includes('pruebas') ||
        message.includes('radiografía') || message.includes('tomografía') || message.includes('biopsia')) {
      currentTopic = 'diagnostico_diferencial';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🔍 **Diagnóstico diferencial dental**\n\n**Herramientas diagnósticas:**\n- Examen clínico completo\n- Radiografías periapicales\n- Panorámica\n- Tomografía computada\n- Pruebas de vitalidad\n- Biopsia si es necesario\n\n¿Qué tipo de caso estás evaluando?`;
      } else if (step === 2) {
        return `Para casos complejos:\n\n**Protocolo de diagnóstico:**\n- Historia clínica detallada\n- Examen extraoral e intraoral\n- Radiografías específicas\n- Pruebas complementarias\n- Consulta interdisciplinaria\n\n**Diagnósticos diferenciales comunes:**\n- Dolor: caries, pulpitis, periodontitis, sinusitis\n- Lesiones: caries, fracturas, desgaste, hipoplasia\n- Inflamación: gingivitis, periodontitis, absceso\n\n¿Necesitas ayuda con algún diagnóstico específico?`;
      }
    }

    // TRATAMIENTOS ESPECIALIZADOS - Nuevo tema
    if (message.includes('tratamiento') || message.includes('especializado') || message.includes('técnica') ||
        message.includes('procedimiento') || message.includes('cirugía') || message.includes('microscopio') ||
        message.includes('láser') || message.includes('implante') || message.includes('ortodoncia')) {
      currentTopic = 'tratamientos_especializados';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Tratamientos especializados**\n\n**Técnicas avanzadas:**\n- Microendodoncia con microscopio\n- Cirugía guiada por computadora\n- Láser dental\n- Implantes inmediatos\n- Ortodoncia invisible\n- Cirugía periodontal\n\n¿Qué tratamiento te interesa?`;
      } else if (step === 2) {
        return `Para tratamientos específicos:\n\n**Microendodoncia:**\n- Microscopio operatorio\n- Instrumentación ultrasónica\n- Obturación termoplástica\n- Seguimiento radiográfico\n\n**Cirugía guiada:**\n- Planificación digital\n- Guías quirúrgicas\n- Implantes precisos\n- Menor traumatismo\n\n¿Quieres información sobre algún tratamiento específico?`;
      }
    }

    // GESTIÓN DE RIESGOS - Nuevo tema
    if (message.includes('riesgo') || message.includes('malpractice') || message.includes('seguro') ||
        message.includes('responsabilidad') || message.includes('consentimiento') || message.includes('documentación') ||
        message.includes('historia clínica') || message.includes('legal') || message.includes('protección')) {
      currentTopic = 'gestion_riesgos';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `⚖️ **Gestión de riesgos odontológicos**\n\n**Protección legal:**\n- Consentimiento informado\n- Historia clínica completa\n- Documentación fotográfica\n- Seguro de responsabilidad civil\n- Protocolos estandarizados\n\n¿Tienes dudas sobre protección legal?`;
      } else if (step === 2) {
        return `Para minimizar riesgos:\n\n**Documentación esencial:**\n- Consentimiento informado detallado\n- Historia clínica completa\n- Fotografías antes/durante/después\n- Radiografías de control\n- Notas de progreso\n\n**Seguros recomendados:**\n- Responsabilidad civil profesional\n- Cobertura por mala praxis\n- Protección patrimonial\n- Seguro de consultorio\n\n¿Necesitas ayuda con documentación específica?`;
      }
    }

    // MARKETING DENTAL - Nuevo tema
    if (message.includes('marketing') || message.includes('pacientes') || message.includes('publicidad') ||
        message.includes('redes sociales') || message.includes('web') || message.includes('promoción') ||
        message.includes('fidelización') || message.includes('referidos') || message.includes('crecimiento')) {
      currentTopic = 'marketing_dental';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📈 **Marketing dental**\n\n**Estrategias efectivas:**\n- Redes sociales (Instagram, Facebook)\n- Página web profesional\n- Marketing de contenidos\n- Programa de referidos\n- Fidelización de pacientes\n- Google My Business\n\n¿Quieres mejorar tu presencia digital?`;
      } else if (step === 2) {
        return `Para el marketing dental:\n\n**Redes sociales:**\n- Contenido educativo\n- Antes y después\n- Tips de salud bucal\n- Historias de pacientes\n- Lives informativos\n\n**Fidelización:**\n- Programa de puntos\n- Descuentos por referidos\n- Recordatorios personalizados\n- Seguimiento post-tratamiento\n- Encuestas de satisfacción\n\n¿Te interesa alguna estrategia específica?`;
      }
    }

    // GESTIÓN FINANCIERA - Nuevo tema
    if (message.includes('financiero') || message.includes('costo') || message.includes('precio') ||
        message.includes('presupuesto') || message.includes('facturación') || message.includes('cobro') ||
        message.includes('cuotas') || message.includes('financiamiento') || message.includes('rentabilidad')) {
      currentTopic = 'gestion_financiera';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `💰 **Gestión financiera dental**\n\n**Aspectos clave:**\n- Estructura de costos\n- Fijación de precios\n- Control de gastos\n- Facturación eficiente\n- Cobro de honorarios\n- Financiamiento a pacientes\n\n¿Tienes dudas sobre gestión financiera?`;
      } else if (step === 2) {
        return `Para optimizar las finanzas:\n\n**Estructura de precios:**\n- Análisis de costos por tratamiento\n- Precios competitivos del mercado\n- Diferentes opciones de pago\n- Descuentos por volumen\n\n**Control financiero:**\n- Software de facturación\n- Seguimiento de cobros\n- Control de inventario\n- Análisis de rentabilidad\n\n¿Quieres optimizar algún aspecto financiero?`;
      }
    }

    // TECNOLOGÍA DENTAL - Nuevo tema
    if (message.includes('tecnología') || message.includes('digital') || message.includes('software') ||
        message.includes('CAD/CAM') || message.includes('escáner') || message.includes('impresora 3D') ||
        message.includes('intraoral') || message.includes('planificación') || message.includes('innovación')) {
      currentTopic = 'tecnologia_dental';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🖥️ **Tecnología dental**\n\n**Tecnologías disponibles:**\n- Escáner intraoral\n- CAD/CAM para coronas\n- Impresión 3D\n- Planificación digital\n- Software de gestión\n- Radiografía digital\n\n¿Qué tecnología te interesa implementar?`;
      } else if (step === 2) {
        return `Para implementar tecnología:\n\n**Escáner intraoral:**\n- Mejor experiencia del paciente\n- Precisión en restauraciones\n- Menos tiempo de tratamiento\n- Archivos digitales\n\n**CAD/CAM:**\n- Coronas en una sola visita\n- Materiales de alta calidad\n- Personalización completa\n- Menor costo operativo\n\n¿Quieres información sobre alguna tecnología específica?`;
      }
    }

    // SALUD LABORAL - Nuevo tema
    if (message.includes('ergonomía') || message.includes('postura') || message.includes('dolor') ||
        message.includes('espalda') || message.includes('cuello') || message.includes('muñeca') ||
        message.includes('fatiga') || message.includes('prevención') || message.includes('bienestar')) {
      currentTopic = 'salud_laboral';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `💪 **Salud laboral del odontólogo**\n\n**Riesgos comunes:**\n- Dolor de espalda y cuello\n- Síndrome del túnel carpiano\n- Fatiga visual\n- Estrés laboral\n- Posturas forzadas\n\n¿Tienes problemas de salud laboral?`;
      } else if (step === 2) {
        return `Para prevenir problemas laborales:\n\n**Ergonomía:**\n- Silla ergonómica\n- Posición correcta del paciente\n- Instrumentos ergonómicos\n- Pausas regulares\n- Ejercicios de estiramiento\n\n**Prevención:**\n- Evaluación ergonómica\n- Ejercicios específicos\n- Control oftalmológico\n- Manejo del estrés\n- Descanso adecuado\n\n¿Quieres una evaluación ergonómica?`;
      }
    }
    
    // Respuesta por defecto con contexto
    const lastTopic = this.getLastTopic();
    if (lastTopic && this.getConversationStep() > 2) {
      return `Veo que sigues consultando sobre ${this.getDentistTopicName(lastTopic)}. ¿Te gustaría que profundicemos en algún aspecto específico o necesitas ayuda práctica con algún caso?`;
    }
    
    return `👨‍⚕️ **Asistente DentalBot**\n\nPuedo ayudarte con:\n- Manejo de pacientes difíciles\n- Emergencias y protocolos\n- Instrumentos rotos\n- Técnicas de anestesia\n- Comunicación efectiva\n- Control de infecciones\n- Actualización profesional\n- Gestión de agenda\n- Diagnóstico diferencial\n- Tratamientos especializados\n- Gestión de riesgos\n- Marketing dental\n- Gestión financiera\n- Tecnología dental\n- Salud laboral\n\n¿Podrías ser más específico?`;
  }

  private getDentistTopicName(topic: string): string {
    const topicNames: { [key: string]: string } = {
      'pacientes_dificiles': 'manejo de pacientes difíciles',
      'emergencias': 'protocolos de emergencia',
      'instrumentos_rotos': 'instrumentos rotos',
      'anestesia': 'técnicas de anestesia',
      'comunicacion': 'comunicación con pacientes',
      'control_infecciones': 'control de infecciones',
      'actualizacion_profesional': 'actualización profesional',
      'gestion_agenda': 'gestión de agenda',
      'diagnostico_diferencial': 'diagnóstico diferencial',
      'tratamientos_especializados': 'tratamientos especializados',
      'gestion_riesgos': 'gestión de riesgos',
      'marketing_dental': 'marketing dental',
      'gestion_financiera': 'gestión financiera',
      'tecnologia_dental': 'tecnología dental',
      'salud_laboral': 'salud laboral'
    };
    return topicNames[topic] || topic;
  }

  createMessage(role: "user" | "assistant", content: string): Message {
    return {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date()
    }
  }

  addToHistory(role: "user" | "assistant", content: string): void {
    const message = this.createMessage(role, content);
    this.conversationHistory.push(message);
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
    this.saveToLocalStorage();
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  getConversationContext(): string {
    if (this.conversationHistory.length === 0) {
      return '';
    }
    const recentMessages = this.conversationHistory.slice(-5);
    return recentMessages.map(msg => 
      `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
    ).join('\n');
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.userContext.conversationStep = 0;
    this.userContext.lastTopic = '';
    this.saveToLocalStorage();
  }

  clearHistoryForUser(userId: string): void {
    try {
      const storageKey = this.getStorageKey(userId);
      const contextKey = this.getContextKey(userId);
      localStorage.removeItem(storageKey);
      localStorage.removeItem(contextKey);
    } catch (error) {
      console.warn('Error clearing history for user:', error);
    }
  }

  // Método para reiniciar solo el contexto (mantener historial)
  resetContext(): void {
    this.userContext.conversationStep = 0;
    this.userContext.lastTopic = '';
    this.saveToLocalStorage();
  }

  // Método para obtener estadísticas de la conversación
  getConversationStats(): { totalMessages: number; userMessages: number; assistantMessages: number; currentTopic: string; step: number } {
    const userMessages = this.conversationHistory.filter(msg => msg.role === 'user').length;
    const assistantMessages = this.conversationHistory.filter(msg => msg.role === 'assistant').length;
    
    return {
      totalMessages: this.conversationHistory.length,
      userMessages,
      assistantMessages,
      currentTopic: this.getLastTopic(),
      step: this.getConversationStep()
    };
  }

  // --- NEW METHODS FOR CONTEXT AWARENESS ---
  getConversationSummary(): string {
    const lastTopic = this.getLastTopic();
    const step = this.getConversationStep();
    const userType = this.getUserType();
    
    if (lastTopic && step > 0) {
      const topicName = userType === 'dentist' ? this.getDentistTopicName(lastTopic) : this.getTopicName(lastTopic);
      return `Conversación sobre ${topicName} (paso ${step}) - Usuario: ${userType}`;
    }
    return 'Nueva conversación';
  }

  isContinuingConversation(): boolean {
    return this.getConversationStep() > 1;
  }

  getSuggestedNextStep(): string {
    const lastTopic = this.getLastTopic();
    const step = this.getConversationStep();
    
    if (lastTopic && step >= 2) {
      const topicName = this.getUserType() === 'dentist' ? this.getDentistTopicName(lastTopic) : this.getTopicName(lastTopic);
      return `¿Te gustaría agendar una consulta para resolver todas tus dudas sobre ${topicName}?`;
    }
    return '';
  }

  // Método para detectar cambio de tema
  hasTopicChanged(newTopic: string): boolean {
    const currentTopic = this.getLastTopic();
    return currentTopic !== '' && currentTopic !== newTopic;
  }

  // Método para obtener sugerencias basadas en el contexto actual
  getContextualSuggestions(): string[] {
    const lastTopic = this.getLastTopic();
    const step = this.getConversationStep();
    const userType = this.getUserType();
    
    if (!lastTopic) return [];
    
    const suggestions: string[] = [];
    
    if (userType === 'patient') {
      if (lastTopic === 'dolor_dental' && step >= 2) {
        suggestions.push('¿Quieres agendar una consulta urgente?');
        suggestions.push('¿Necesitas información sobre analgésicos?');
      } else if (lastTopic === 'ortodoncia' && step >= 2) {
        suggestions.push('¿Te gustaría una evaluación gratuita?');
        suggestions.push('¿Quieres conocer los diferentes tipos de brackets?');
      }
    } else if (userType === 'dentist') {
      if (lastTopic === 'emergencias' && step >= 2) {
        suggestions.push('¿Necesitas el protocolo completo de emergencias?');
        suggestions.push('¿Quieres información sobre derivaciones?');
      } else if (lastTopic === 'pacientes_dificiles' && step >= 2) {
        suggestions.push('¿Te interesa un curso sobre manejo de pacientes ansiosos?');
        suggestions.push('¿Quieres técnicas específicas de sedación?');
      }
    }
    
    return suggestions;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}