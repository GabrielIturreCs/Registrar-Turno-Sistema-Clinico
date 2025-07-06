import { Injectable } from '@angular/core'
import { Message, ActionButton } from '..//interfaces/message.interface'

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

      // Verificar si ya estamos cargando el usuario correcto
      const lastLoadedUserId = this.getLastLoadedUserId();
      if (lastLoadedUserId === currentUserId) {
        console.log('Ya cargado el historial del usuario:', currentUserId);
        return;
      }

      // Limpiar contexto actual antes de cargar el nuevo
      this.clearCurrentContext();
      
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
      } else {
        // Si no hay historial, inicializar array vacío
        this.conversationHistory = [];
      }
      
      if (savedContext) {
        this.userContext = JSON.parse(savedContext);
      } else {
        // Si no hay contexto, inicializar con valores por defecto
        this.userContext = {
          userType: 'patient',
          lastTopic: '',
          conversationStep: 0,
          preferences: {}
        };
      }
      
      // Guardar el ID del usuario cargado
      this.setLastLoadedUserId(currentUserId);
      
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

  private clearCurrentContext(): void {
    this.conversationHistory = [];
    this.userContext = {
      userType: 'patient',
      lastTopic: '',
      conversationStep: 0,
      preferences: {}
    };
  }

  private getLastLoadedUserId(): string | null {
    try {
      return localStorage.getItem('lastLoadedUserId');
    } catch (error) {
      return null;
    }
  }

  private setLastLoadedUserId(userId: string): void {
    try {
      localStorage.setItem('lastLoadedUserId', userId);
    } catch (error) {
      console.warn('Error setting last loaded user ID:', error);
    }
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
  generateResponse(userMessage: string, userType: 'patient' | 'dentist' = 'patient'): { content: string, actions?: ActionButton[] } {
    const message = userMessage.toLowerCase();
    this.addToHistory('user', userMessage);
    
    // Actualizar contexto
    this.setUserType(userType);
    this.incrementConversationStep();
    
    let responseData: { content: string, actions?: ActionButton[] };
    if (userType === 'dentist') {
      responseData = { content: this.generateDentistResponse(message) };
    } else {
      responseData = this.generatePatientResponseWithActions(message);
    }
    
    this.addToHistory('assistant', responseData.content, responseData.actions);
    this.saveToLocalStorage();
    return responseData;
  }

  // --- DENTISTAS ---
  private generateDentistResponse(message: string): string {
    // Respuesta básica para dentistas (se puede expandir en el futuro)
    return `👨‍⚕️ **Asistente para Dentistas**\n\nEsta función está en desarrollo. Por ahora, puedes usar el chat como paciente para todas las consultas sobre el sistema.\n\n**Funciones disponibles:**\n- Gestión de agenda\n- Revisión de turnos\n- Información de pacientes\n- Herramientas administrativas\n\n¿Necesitas ayuda con alguna función específica del sistema?`;
  }

  // --- PACIENTES ---
  private generatePatientResponseWithActions(message: string): { content: string, actions?: ActionButton[] } {
    // Detectar tema de conversación
    let currentTopic = '';
    
    // NAVEGACIÓN Y ACCIONES DEL SISTEMA
    if (message.includes('cancelar turno') || message.includes('cancelar mi turno') || message.includes('cancelar cita') ||
        message.includes('anular turno') || message.includes('eliminar turno') || message.includes('no puedo ir') ||
        message.includes('no podré asistir') || message.includes('tengo que cancelar')) {
      currentTopic = 'cancelar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        const actions: ActionButton[] = [
          {
            text: 'Ver Mis Turnos',
            action: 'navigate:/misTurnos',
            icon: 'calendar',
            variant: 'primary'
          },
          {
            text: 'Llamar a la Clínica',
            action: 'call:' + this.clinicContext.phone,
            icon: 'phone',
            variant: 'secondary'
          }
        ];
        
        return {
          content: `❌ **Cancelar turno**\n\n**Pasos para cancelar tu turno:**\n1. Haz clic en "Ver Mis Turnos" aquí abajo\n2. Busca el turno que deseas cancelar\n3. Haz clic en el botón rojo con ❌\n4. Confirma la cancelación\n\n**Política de cancelación:**\n- Cancela hasta 24 horas antes\n- Reembolso automático si pagaste\n- Sin penalización por cancelación\n\n¿Necesitas ayuda para encontrar tu turno?`,
          actions
        };
      } else if (step === 2) {
        const actions: ActionButton[] = [
          {
            text: 'Ir a Mis Turnos',
            action: 'navigate:/misTurnos',
            icon: 'calendar',
            variant: 'success'
          }
        ];
        
        return {
          content: `Para cancelar tu turno específico:\n\n**Si ya encontraste tu turno:**\n- Haz clic en el botón rojo ❌\n- Confirma la cancelación\n- Recibirás confirmación por email\n\n**Si no puedes encontrarlo:**\n- Verifica la fecha del turno\n- Actualiza la página\n- Contacta al ${this.clinicContext.phone}\n\n**Después de cancelar:**\n- Reembolso procesado en 24-48 horas\n- Turno disponible para otros pacientes\n- Puedes reservar uno nuevo cuando quieras`,
          actions
        };
      }
    }

    // REPROGRAMAR TURNO
    if (message.includes('reprogramar') || message.includes('cambiar turno') || message.includes('cambiar fecha') ||
        message.includes('cambiar hora') || message.includes('mover turno') || message.includes('reagendar') ||
        message.includes('cambiar cita') || message.includes('nueva fecha') || message.includes('otro día')) {
      currentTopic = 'reprogramar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        const actions: ActionButton[] = [
          {
            text: 'Ver Mis Turnos',
            action: 'navigate:/misTurnos',
            icon: 'calendar',
            variant: 'primary'
          },
          {
            text: 'Reservar Nuevo Turno',
            action: 'navigate:/reservarTurno',
            icon: 'plus',
            variant: 'success'
          }
        ];
        
        return {
          content: `🔄 **Reprogramar turno**\n\n**Cómo reprogramar tu turno:**\n1. Haz clic en "Ver Mis Turnos" aquí abajo\n2. Encuentra tu turno actual\n3. Haz clic en "Reprogramar" (icono de calendario)\n4. Selecciona nueva fecha y hora\n5. Confirma el cambio\n\n**Importante:**\n- Reprograma hasta 24 horas antes\n- Sujeto a disponibilidad\n- Sin costo adicional\n- Mantiene el mismo tratamiento\n\n¿Qué fecha te gustaría cambiar?`,
          actions
        };
      }
    }

    // RESERVAR TURNO PASO A PASO
    if (message.includes('reservar turno') || message.includes('agendar') || message.includes('nuevo turno') ||
        message.includes('sacar turno') || message.includes('cita') || message.includes('como reservar') ||
        message.includes('hacer reserva') || message.includes('solicitar turno') || message.includes('pedir turno')) {
      currentTopic = 'reservar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        const actions: ActionButton[] = [
          {
            text: 'Reservar Turno Ahora',
            action: 'navigate:/reservarTurno',
            icon: 'calendar-plus',
            variant: 'success'
          },
          {
            text: 'Ver Horarios',
            action: 'show-schedule',
            icon: 'clock',
            variant: 'info'
          }
        ];
        
        return {
          content: `📅 **Reservar nuevo turno**\n\n**Proceso simple y rápido:**\n1. Haz clic en "Reservar Turno Ahora"\n2. Selecciona fecha en el calendario\n3. Elige horario disponible\n4. Confirma tratamiento\n5. Realiza el pago\n\n**Disponibilidad:**\n- Lunes a Viernes: 8:00 - 20:00\n- Sábados: 8:00 - 14:00\n- Turnos cada 30 minutos\n\n¿Qué tratamiento necesitas?`,
          actions
        };
      }
    }

    // HISTORIAL DE TURNOS
    if (message.includes('historial') || message.includes('mis turnos') || message.includes('turnos anteriores') ||
        message.includes('ver turnos') || message.includes('lista de turnos')) {
      currentTopic = 'historial_turnos';
      this.setLastTopic(currentTopic);
      
      const actions: ActionButton[] = [
        {
          text: 'Ver Mis Turnos',
          action: 'navigate:/misTurnos',
          icon: 'list',
          variant: 'primary'
        },
        {
          text: 'Panel Principal',
          action: 'navigate:/vistaPaciente',
          icon: 'home',
          variant: 'secondary'
        }
      ];
      
      return {
        content: `📋 **Historial de turnos**\n\n**En tu historial puedes ver:**\n- Turnos realizados y pendientes\n- Turnos cancelados\n- Tratamientos recibidos\n- Pagos realizados\n- Fechas y horarios\n- Dentista que te atendió\n\n**Funciones disponibles:**\n- Ver detalles completos\n- Descargar comprobantes\n- Solicitar certificados\n- Revisar tratamientos\n\n¿Buscas algo específico en tu historial?`,
        actions
      };
    }

    // PAGOS Y ESTADO DEL PAGO
    if (message.includes('pagar') || message.includes('pago') || message.includes('cuánto cuesta') ||
        message.includes('precio') || message.includes('estado del pago') || message.includes('factura')) {
      currentTopic = 'pagos_sistema';
      this.setLastTopic(currentTopic);
      
      const actions: ActionButton[] = [
        {
          text: 'Ver Estado de Pagos',
          action: 'navigate:/misTurnos',
          icon: 'credit-card',
          variant: 'primary'
        },
        {
          text: 'Contactar Soporte',
          action: 'call:' + this.clinicContext.phone,
          icon: 'help-circle',
          variant: 'warning'
        }
      ];
      
      return {
        content: `💳 **Pagos y facturación**\n\n**Métodos de pago disponibles:**\n- MercadoPago (tarjetas, efectivo)\n- Pago en clínica (efectivo, tarjeta)\n- Transferencia bancaria\n- Obras sociales\n\n**Estados de pago:**\n- ✅ Pagado\n- ⏳ Pendiente\n- ❌ Fallido\n- 💰 Reembolsado\n\n**Para ver el estado de tus pagos, haz clic en el botón de abajo.**\n\n¿Necesitas ayuda con algún pago específico?`,
        actions
      };
    }

    // CONTACTO CON LA CLÍNICA
    if (message.includes('contactar') || message.includes('llamar') || message.includes('teléfono') ||
        message.includes('whatsapp') || message.includes('email') || message.includes('contacto') ||
        message.includes('ubicación') || message.includes('dirección')) {
      currentTopic = 'contacto_clinica';
      this.setLastTopic(currentTopic);
      
      const actions: ActionButton[] = [
        {
          text: 'Llamar Ahora',
          action: 'call:' + this.clinicContext.phone,
          icon: 'phone',
          variant: 'success'
        },
        {
          text: 'WhatsApp',
          action: 'whatsapp:' + this.clinicContext.whatsapp,
          icon: 'message-circle',
          variant: 'success'
        },
        {
          text: 'Cómo Llegar',
          action: 'map:' + this.clinicContext.address,
          icon: 'map-pin',
          variant: 'info'
        }
      ];
      
      return {
        content: `📞 **Contacto con la clínica**\n\n**Medios de contacto disponibles:**\n📞 **Teléfono:** ${this.clinicContext.phone}\n📱 **WhatsApp:** ${this.clinicContext.whatsapp}\n📧 **Email:** ${this.clinicContext.email}\n\n**Dirección:**\n📍 ${this.clinicContext.address}\n\n**Horarios de atención:**\n- Lunes a Viernes: 8:00 - 20:00\n- Sábados: 8:00 - 14:00\n- Emergencias: 24/7\n\nUsa los botones de abajo para contactarte rápidamente:`,
        actions
      };
    }

    // DATOS PERSONALES Y PERFIL
    if (message.includes('datos personales') || message.includes('perfil') || message.includes('cambiar datos') ||
        message.includes('actualizar') || message.includes('obra social')) {
      currentTopic = 'datos_personales';
      this.setLastTopic(currentTopic);
      
      const actions: ActionButton[] = [
        {
          text: 'Editar Mi Perfil',
          action: 'navigate:/vistaPaciente',
          icon: 'user',
          variant: 'primary'
        }
      ];
      
      return {
        content: `👤 **Datos personales y perfil**\n\n**Datos que puedes actualizar:**\n- Nombre y apellido\n- Teléfono de contacto\n- Email\n- Dirección\n- Obra social\n- Fecha de nacimiento\n- Información médica relevante\n\n**Importante:**\n- Mantén tus datos actualizados\n- Verifica tu email para notificaciones\n- Obra social actualizada para coberturas\n\nHaz clic en "Editar Mi Perfil" para actualizar tu información:`,
        actions
      };
    }

    // Si no hay tema específico, usar el método original
    return { content: this.generatePatientResponse(message) };
  }

  // Método original para compatibilidad
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
    
    // NAVEGACIÓN Y ACCIONES DEL SISTEMA - Nuevo tema
    if (message.includes('cancelar turno') || message.includes('cancelar mi turno') || message.includes('cancelar cita') ||
        message.includes('anular turno') || message.includes('eliminar turno') || message.includes('no puedo ir') ||
        message.includes('no podré asistir') || message.includes('tengo que cancelar')) {
      currentTopic = 'cancelar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `❌ **Cancelar turno**\n\n**Pasos para cancelar tu turno:**\n1. Ve a 'Mis Turnos' desde tu panel\n2. Busca el turno que deseas cancelar\n3. Haz clic en el botón rojo con ❌\n4. Confirma la cancelación\n\n**Enlace directo:** 👉 **[Ir a Mis Turnos](/misTurnos)**\n\n**Política de cancelación:**\n- Cancela hasta 24 horas antes\n- Reembolso automático si pagaste\n- Sin penalización por cancelación\n\n¿Necesitas ayuda para encontrar tu turno?`;
      } else if (step === 2) {
        return `Para cancelar tu turno específico:\n\n**Si ya encontraste tu turno:**\n- Haz clic en el botón rojo ❌\n- Confirma la cancelación\n- Recibirás confirmación por email\n\n**Si no puedes encontrarlo:**\n- Verifica la fecha del turno\n- Actualiza la página\n- Contacta al ${this.clinicContext.phone}\n\n**Después de cancelar:**\n- Reembolso procesado en 24-48 horas\n- Turno disponible para otros pacientes\n- Puedes reservar uno nuevo cuando quieras\n\n¿Necesitas ayuda con algo más?`;
      }
    }

    // REPROGRAMAR TURNO
    if (message.includes('reprogramar') || message.includes('cambiar turno') || message.includes('cambiar fecha') ||
        message.includes('cambiar hora') || message.includes('mover turno') || message.includes('reagendar') ||
        message.includes('cambiar cita') || message.includes('nueva fecha') || message.includes('otro día')) {
      currentTopic = 'reprogramar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🔄 **Reprogramar turno**\n\n**Cómo reprogramar tu turno:**\n1. Ve a 'Mis Turnos' 👉 **[Ir a Mis Turnos](/misTurnos)**\n2. Encuentra tu turno actual\n3. Haz clic en "Reprogramar" (icono de calendario)\n4. Selecciona nueva fecha y hora\n5. Confirma el cambio\n\n**Importante:**\n- Reprograma hasta 24 horas antes\n- Sujeto a disponibilidad\n- Sin costo adicional\n- Mantiene el mismo tratamiento\n\n¿Qué fecha te gustaría cambiar?`;
      } else if (step === 2) {
        return `Para reprogramar exitosamente:\n\n**Pasos detallados:**\n1. **Accede a tus turnos:** [Mis Turnos](/misTurnos)\n2. **Busca tu turno:** por fecha o tratamiento\n3. **Haz clic en reprogramar:** icono 🔄\n4. **Selecciona nueva fecha:** calendario disponible\n5. **Confirma:** nueva fecha y hora\n\n**Alternativa rápida:**\n- Cancela el turno actual\n- Reserva uno nuevo inmediatamente\n- Mantén el mismo tratamiento\n\n¿Prefieres que te ayude a reservar uno nuevo?`;
      }
    }

    // PAGOS Y ESTADO DEL PAGO
    if (message.includes('pagar') || message.includes('pago') || message.includes('cuánto cuesta') ||
        message.includes('precio') || message.includes('cobro') || message.includes('factura') ||
        message.includes('mercadopago') || message.includes('tarjeta') || message.includes('efectivo') ||
        message.includes('estado del pago') || message.includes('pagué') || message.includes('cobrar')) {
      currentTopic = 'pagos_sistema';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `💳 **Pagos y facturación**\n\n**Métodos de pago disponibles:**\n- MercadoPago (tarjetas, efectivo)\n- Pago en clínica (efectivo, tarjeta)\n- Transferencia bancaria\n- Obras sociales\n\n**Para ver tus pagos:**\n👉 **[Ir a Mis Turnos](/misTurnos)** - verás el estado de cada pago\n\n**Estados de pago:**\n- ✅ Pagado\n- ⏳ Pendiente\n- ❌ Fallido\n- 💰 Reembolsado\n\n¿Necesitas ayuda con algún pago específico?`;
      } else if (step === 2) {
        return `Para gestionar tus pagos:\n\n**Ver estado de pagos:**\n- Ve a [Mis Turnos](/misTurnos)\n- Cada turno muestra su estado de pago\n- Haz clic en "Ver detalles" para más info\n\n**Problemas con pagos:**\n- Pago fallido: intenta nuevamente\n- Pago pendiente: espera 24-48 horas\n- Doble cobro: contacta al ${this.clinicContext.phone}\n\n**Reembolsos:**\n- Procesados automáticamente al cancelar\n- Tiempo: 3-5 días hábiles\n- Mismo método de pago original\n\n¿Tienes algún problema específico con un pago?`;
      }
    }

    // HISTORIAL DE TURNOS
    if (message.includes('historial') || message.includes('mis turnos') || message.includes('turnos anteriores') ||
        message.includes('citas pasadas') || message.includes('consultas anteriores') || message.includes('ver turnos') ||
        message.includes('lista de turnos') || message.includes('turnos realizados') || message.includes('historial médico')) {
      currentTopic = 'historial_turnos';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📋 **Historial de turnos**\n\n**Accede a tu historial completo:**\n👉 **[Ver Mis Turnos](/misTurnos)**\n\n**En tu historial puedes ver:**\n- Turnos realizados\n- Turnos pendientes\n- Turnos cancelados\n- Tratamientos recibidos\n- Pagos realizados\n- Fechas y horarios\n- Dentista que te atendió\n\n**Filtros disponibles:**\n- Por fecha\n- Por tratamiento\n- Por estado\n\n¿Buscas algo específico en tu historial?`;
      } else if (step === 2) {
        return `Para navegar tu historial:\n\n**Funciones disponibles:**\n- **Ver detalles:** información completa del turno\n- **Descargar comprobante:** para reembolsos\n- **Solicitar certificado:** de atención médica\n- **Revisar tratamientos:** historial clínico\n\n**Accesos rápidos:**\n- [Mis Turnos](/misTurnos) - historial completo\n- [Vista Paciente](/vistaPaciente) - resumen\n- [Reservar Turno](/reservarTurno) - nuevo turno\n\n**Dudas frecuentes:**\n- Certificados médicos disponibles\n- Historial completo desde el primer turno\n- Exportar datos bajo solicitud\n\n¿Necesitas un certificado o comprobante específico?`;
      }
    }

    // CONTACTO CON LA CLÍNICA
    if (message.includes('contactar') || message.includes('llamar') || message.includes('teléfono') ||
        message.includes('whatsapp') || message.includes('email') || message.includes('contacto') ||
        message.includes('hablar') || message.includes('comunicar') || message.includes('consultar') ||
        message.includes('dirección') || message.includes('ubicación') || message.includes('dónde están')) {
      currentTopic = 'contacto_clinica';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📞 **Contacto con la clínica**\n\n**Medios de contacto:**\n📞 **Teléfono:** ${this.clinicContext.phone}\n📱 **WhatsApp:** ${this.clinicContext.whatsapp}\n📧 **Email:** ${this.clinicContext.email}\n🌐 **Web:** ${this.clinicContext.website}\n\n**Dirección:**\n📍 ${this.clinicContext.address}\n\n**Horarios de atención:**\n- Lunes a Viernes: 8:00 - 20:00\n- Sábados: 8:00 - 14:00\n- Emergencias: 24/7\n\n¿Qué medio prefieres para contactarte?`;
      } else if (step === 2) {
        return `Para contactarte efectivamente:\n\n**Por teléfono:**\n- Llama al ${this.clinicContext.phone}\n- Mejor horario: 9:00 - 11:00 y 14:00 - 17:00\n- Ten a mano tu número de turno\n\n**Por WhatsApp:**\n- Envía mensaje a ${this.clinicContext.whatsapp}\n- Respuesta en máximo 2 horas\n- Adjunta fotos si es necesario\n\n**Por email:**\n- Escribe a ${this.clinicContext.email}\n- Respuesta en 24 horas\n- Ideal para consultas no urgentes\n\n**Visita presencial:**\n- ${this.clinicContext.address}\n- Estacionamiento gratuito\n- Acceso para personas con movilidad reducida\n\n¿Necesitas indicaciones para llegar?`;
      }
    }

    // DATOS PERSONALES Y PERFIL
    if (message.includes('datos personales') || message.includes('perfil') || message.includes('información personal') ||
        message.includes('cambiar datos') || message.includes('actualizar') || message.includes('editar perfil') ||
        message.includes('obra social') || message.includes('teléfono') || message.includes('dirección') ||
        message.includes('email') || message.includes('nombre') || message.includes('modificar datos')) {
      currentTopic = 'datos_personales';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `👤 **Datos personales y perfil**\n\n**Para ver/editar tu perfil:**\n👉 **[Ir a Vista Paciente](/vistaPaciente)**\n\n**Datos que puedes actualizar:**\n- Nombre y apellido\n- Teléfono de contacto\n- Email\n- Dirección\n- Obra social\n- Fecha de nacimiento\n- Información médica relevante\n\n**Importante:**\n- Mantén tus datos actualizados\n- Verifica tu email para notificaciones\n- Obra social actualizada para coberturas\n\n¿Qué datos necesitas cambiar?`;
      } else if (step === 2) {
        return `Para actualizar tus datos:\n\n**Pasos para editar:**\n1. Ve a [Vista Paciente](/vistaPaciente)\n2. Busca la sección "Mi Perfil"\n3. Haz clic en "Editar datos"\n4. Actualiza la información\n5. Guarda los cambios\n\n**Datos críticos:**\n- **Teléfono:** para confirmaciones\n- **Email:** para notificaciones\n- **Obra social:** para coberturas\n- **Alergias:** información médica\n\n**Seguridad:**\n- Tus datos están protegidos\n- Solo tú puedes editarlos\n- Cambios registrados para auditoría\n\n¿Necesitas ayuda con algún dato específico?`;
      }
    }

    // PROBLEMAS CON PAGOS
    if (message.includes('problema pago') || message.includes('error pago') || message.includes('no puedo pagar') ||
        message.includes('pago fallido') || message.includes('rechazado') || message.includes('cobro duplicado') ||
        message.includes('reembolso') || message.includes('devolver dinero') || message.includes('doble cobro') ||
        message.includes('tarjeta rechazada') || message.includes('fallo en el pago')) {
      currentTopic = 'problemas_pago';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `💳 **Problemas con pagos**\n\n**Problemas comunes:**\n- Pago rechazado por tarjeta\n- Pago duplicado\n- Pago pendiente mucho tiempo\n- Reembolso no procesado\n\n**Soluciones inmediatas:**\n1. Verifica el estado en [Mis Turnos](/misTurnos)\n2. Intenta con otra tarjeta\n3. Contacta a tu banco\n4. Llama al ${this.clinicContext.phone}\n\n**Estados de pago:**\n- ❌ Fallido: intenta nuevamente\n- ⏳ Pendiente: espera 24-48 horas\n- ✅ Aprobado: confirmación por email\n\n¿Qué problema específico tienes?`;
      } else if (step === 2) {
        return `Para resolver tu problema de pago:\n\n**Pago rechazado:**\n- Verifica datos de tarjeta\n- Confirma límites disponibles\n- Intenta con otro método\n- Contacta a tu banco\n\n**Doble cobro:**\n- Ve a [Mis Turnos](/misTurnos)\n- Toma captura de ambos cobros\n- Llama al ${this.clinicContext.phone}\n- Reembolso en 3-5 días\n\n**Reembolso tardío:**\n- Espera 3-5 días hábiles\n- Verifica con tu banco\n- Contacta si pasa del plazo\n\n**Emergencia:**\n- Llama al ${this.clinicContext.phone}\n- Pago en clínica disponible\n- Transferencia bancaria\n\n¿Necesitas ayuda urgente?`;
      }
    }

    // NOTIFICACIONES Y RECORDATORIOS
    if (message.includes('notificaciones') || message.includes('recordatorios') || message.includes('avisos') ||
        message.includes('alertas') || message.includes('email') || message.includes('sms') ||
        message.includes('mensaje') || message.includes('confirmación') || message.includes('aviso turno') ||
        message.includes('recordar turno') || message.includes('no recibo') || message.includes('confirmar')) {
      currentTopic = 'notificaciones';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🔔 **Notificaciones y recordatorios**\n\n**Tipos de notificaciones:**\n- Confirmación de turno\n- Recordatorio 24 horas antes\n- Confirmación de pago\n- Cambios en el turno\n- Resultados de estudios\n\n**Cómo recibirlas:**\n- Email (principal)\n- SMS (opcional)\n- Notificaciones push (app)\n- WhatsApp (emergencias)\n\n**Configuración:**\n- Ve a [Vista Paciente](/vistaPaciente)\n- Verifica tu email y teléfono\n- Activa las notificaciones\n\n¿No estás recibiendo notificaciones?`;
      } else if (step === 2) {
        return `Para recibir notificaciones correctamente:\n\n**Verifica tu configuración:**\n1. Ve a [Vista Paciente](/vistaPaciente)\n2. Confirma tu email actual\n3. Verifica tu número de teléfono\n4. Activa notificaciones\n\n**Si no recibes emails:**\n- Revisa spam/correo no deseado\n- Agrega ${this.clinicContext.email} a contactos\n- Verifica filtros de email\n\n**Problemas con SMS:**\n- Confirma número con código de país\n- Verifica operadora\n- Contacta soporte técnico\n\n**Recordatorios manuales:**\n- Anota fechas importantes\n- Configura alarmas personales\n- Llama para confirmar\n\n¿Necesitas que verifiquemos tu configuración?`;
      }
    }

    // NO PUEDO ASISTIR
    if (message.includes('no puedo ir') || message.includes('no podré asistir') || message.includes('impedimento') ||
        message.includes('surgió algo') || message.includes('emergencia') || message.includes('problema') ||
        message.includes('no voy a poder') || message.includes('tengo que faltar') || message.includes('ausente') ||
        message.includes('falta') || message.includes('inasistencia') || message.includes('no asistiré')) {
      currentTopic = 'no_puedo_asistir';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `⚠️ **No puedes asistir a tu turno**\n\n**Opciones disponibles:**\n1. **Reprogramar:** nueva fecha y hora\n2. **Cancelar:** reembolso completo\n3. **Transferir:** a familiar (si es posible)\n\n**Acciones rápidas:**\n- 🔄 [Reprogramar turno](/misTurnos)\n- ❌ [Cancelar turno](/misTurnos)\n- 📞 Llamar al ${this.clinicContext.phone}\n\n**Tiempo límite:**\n- Hasta 24 horas antes: sin penalización\n- Menos de 24 horas: posible carga\n- Emergencias: siempre justificadas\n\n¿Qué prefieres hacer con tu turno?`;
      } else if (step === 2) {
        return `Para resolver tu situación:\n\n**Si es una emergencia:**\n- Llama inmediatamente al ${this.clinicContext.phone}\n- Explica la situación\n- Sin penalización por emergencia\n- Reprogramación prioritaria\n\n**Si puedes planificar:**\n- Ve a [Mis Turnos](/misTurnos)\n- Selecciona reprogramar o cancelar\n- Elige nueva fecha si reprogramas\n- Confirma la acción\n\n**Política de cancelación:**\n- +24 horas: reembolso completo\n- -24 horas: posible cargo del 50%\n- Emergencias médicas: siempre justificadas\n\n**Alternativas:**\n- Telemedicina (consultas simples)\n- Reprogramación urgente\n- Transferencia a familiar\n\n¿Es una emergencia o puedes reprogramar?`;
      }
    }

    // RESERVAR TURNO PASO A PASO
    if (message.includes('reservar turno') || message.includes('agendar') || message.includes('nuevo turno') ||
        message.includes('sacar turno') || message.includes('cita') || message.includes('como reservar') ||
        message.includes('hacer reserva') || message.includes('solicitar turno') || message.includes('pedir turno') ||
        message.includes('turno nuevo') || message.includes('agenda') || message.includes('programar')) {
      currentTopic = 'reservar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📅 **Reservar nuevo turno**\n\n**Paso a paso:**\n1. **Ve a reservar:** 👉 **[Reservar Turno](/reservarTurno)**\n2. **Selecciona fecha:** calendario disponible\n3. **Elige horario:** turnos libres\n4. **Confirma tratamiento:** tipo de consulta\n5. **Realiza el pago:** MercadoPago o en clínica\n\n**Información necesaria:**\n- Fecha deseada\n- Horario preferido\n- Tipo de tratamiento\n- Datos actualizados\n\n**Disponibilidad:**\n- Lunes a Viernes: 8:00 - 20:00\n- Sábados: 8:00 - 14:00\n- Turnos cada 30 minutos\n\n¿Qué tratamiento necesitas?`;
      } else if (step === 2) {
        return `Para completar tu reserva:\n\n**Pasos detallados:**\n1. **Accede:** [Reservar Turno](/reservarTurno)\n2. **Calendario:** haz clic en día disponible\n3. **Horarios:** selecciona hora libre\n4. **Tratamiento:** elige de la lista\n5. **Confirma:** revisa datos\n6. **Pago:** MercadoPago o presencial\n\n**Tratamientos disponibles:**\n- Consulta general\n- Limpieza dental\n- Empastes\n- Endodoncia\n- Ortodoncia\n- Implantes\n- Emergencias\n\n**Después de reservar:**\n- Confirmación por email\n- Recordatorio 24 horas antes\n- Comprobante de pago\n\n¿Necesitas ayuda con algún paso específico?`;
      }
    }

    // TRATAMIENTOS Y PRECIOS
    if (message.includes('tratamientos') || message.includes('qué ofrecen') || message.includes('servicios') ||
        message.includes('precios') || message.includes('costos') || message.includes('cuánto cuesta') ||
        message.includes('especialidades') || message.includes('procedimientos') || message.includes('que hacen') ||
        message.includes('lista') || message.includes('opciones') || message.includes('tipos')) {
      currentTopic = 'tratamientos_precios';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Tratamientos y precios**\n\n**Especialidades disponibles:**\n${this.clinicContext.specialties.map(spec => `- ${spec}`).join('\n')}\n\n**Tratamientos comunes:**\n- Consulta general: $3,000\n- Limpieza dental: $4,500\n- Empaste: $5,000-$8,000\n- Endodoncia: $15,000-$25,000\n- Ortodoncia: $80,000-$150,000\n- Implantes: $45,000-$80,000\n\n**Métodos de pago:**\n- Efectivo (10% descuento)\n- Tarjetas de crédito\n- Cuotas sin interés\n- Obra social\n\n**Para cotizar:** 👉 **[Reservar Consulta](/reservarTurno)**\n\n¿Qué tratamiento específico te interesa?`;
      } else if (step === 2) {
        return `Para tu tratamiento específico:\n\n**Evaluación personalizada:**\n- Reserva una consulta\n- Diagnóstico completo\n- Presupuesto detallado\n- Plan de tratamiento\n\n**Profesionales disponibles:**\n${this.clinicContext.doctors.map(doc => `- ${doc}`).join('\n')}\n\n**Tecnología avanzada:**\n${this.clinicContext.equipment.map(eq => `- ${eq}`).join('\n')}\n\n**Financiamiento:**\n- Hasta 12 cuotas sin interés\n- Descuento por pago contado\n- Convenios con obras sociales\n- Planes de tratamiento\n\n**Reserva tu consulta:** [Reservar Turno](/reservarTurno)\n\n¿Quieres un presupuesto personalizado?`;
      }
    }

    // ESTADO DE TURNOS
    if (message.includes('estado turno') || message.includes('mi turno') || message.includes('consultar turno') ||
        message.includes('información turno') || message.includes('detalles turno') || message.includes('cuando es') ||
        message.includes('que dia') || message.includes('que hora') || message.includes('proximo turno') ||
        message.includes('ver turno') || message.includes('turno actual') || message.includes('confirmado')) {
      currentTopic = 'estado_turnos';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📋 **Estado de tus turnos**\n\n**Ver tus turnos:**\n👉 **[Mis Turnos](/misTurnos)** - información completa\n👉 **[Vista Paciente](/vistaPaciente)** - resumen\n\n**Estados posibles:**\n- ✅ **Confirmado:** turno asegurado\n- ⏳ **Pendiente:** esperando confirmación\n- 💳 **Pendiente pago:** falta pagar\n- ❌ **Cancelado:** turno cancelado\n- ✅ **Completado:** turno realizado\n\n**Información disponible:**\n- Fecha y hora exacta\n- Tratamiento programado\n- Dentista asignado\n- Estado del pago\n- Ubicación del consultorio\n\n¿Buscas información de algún turno específico?`;
      } else if (step === 2) {
        return `Para consultar tu turno específico:\n\n**Información detallada:**\n- **Fecha y hora:** exacta del turno\n- **Tratamiento:** tipo de consulta\n- **Profesional:** dentista asignado\n- **Consultorio:** ubicación específica\n- **Preparación:** instrucciones especiales\n\n**Acciones disponibles:**\n- 📱 Confirmar asistencia\n- 🔄 Reprogramar si es necesario\n- ❌ Cancelar con reembolso\n- 📞 Contactar al profesional\n\n**Recordatorios:**\n- Llega 10 minutos antes\n- Trae DNI y obra social\n- Confirma 24 horas antes\n- Sigue instrucciones previas\n\n¿Necesitas confirmar tu próximo turno?`;
      }
    }

    // NO VEO MIS TURNOS
    if (message.includes('no veo turnos') || message.includes('no aparecen') || message.includes('no encuentro') ||
        message.includes('perdí turno') || message.includes('donde están') || message.includes('no aparece') ||
        message.includes('no sale') || message.includes('vacío') || message.includes('problema ver') ||
        message.includes('no muestra') || message.includes('error turnos') || message.includes('no cargan')) {
      currentTopic = 'no_veo_turnos';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🔍 **No ves tus turnos**\n\n**Soluciones rápidas:**\n1. **Actualiza la página:** F5 o Ctrl+R\n2. **Verifica tu sesión:** inicia sesión nuevamente\n3. **Prueba otro navegador:** Chrome, Firefox, Safari\n4. **Limpia caché:** navegador\n\n**Accesos alternativos:**\n- 👉 [Mis Turnos](/misTurnos)\n- 👉 [Vista Paciente](/vistaPaciente)\n- 📱 Versión móvil\n\n**Posibles causas:**\n- Problemas de conexión\n- Sesión expirada\n- Caché del navegador\n- Datos desactualizados\n\n¿Qué navegador estás usando?`;
      } else if (step === 2) {
        return `Para resolver el problema:\n\n**Pasos detallados:**\n1. **Cierra sesión:** botón salir\n2. **Inicia sesión nuevamente:** usuario y contraseña\n3. **Ve a:** [Mis Turnos](/misTurnos)\n4. **Espera:** carga completa de la página\n\n**Si persiste el problema:**\n- Borra caché del navegador\n- Intenta en modo incógnito\n- Usa otro dispositivo\n- Contacta soporte\n\n**Contacto urgente:**\n- Llama al ${this.clinicContext.phone}\n- WhatsApp: ${this.clinicContext.whatsapp}\n- Email: ${this.clinicContext.email}\n\n**Información necesaria:**\n- Número de turno\n- Fecha aproximada\n- Tratamiento reservado\n\n¿Necesitas ayuda técnica inmediata?`;
      }
    }

    // ACCESO MÓVIL
    if (message.includes('celular') || message.includes('móvil') || message.includes('teléfono') ||
        message.includes('smartphone') || message.includes('tablet') || message.includes('app') ||
        message.includes('aplicación') || message.includes('desde el celular') || message.includes('versión móvil') ||
        message.includes('android') || message.includes('iphone') || message.includes('responsive')) {
      currentTopic = 'acceso_movil';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📱 **Acceso móvil**\n\n**Cómo usar desde tu celular:**\n- Abre el navegador (Chrome, Safari, Firefox)\n- Ingresa a la web: ${this.clinicContext.website}\n- Inicia sesión normalmente\n- Navega con diseño adaptado\n\n**Funciones disponibles:**\n- Reservar turnos\n- Ver mis turnos\n- Cancelar/reprogramar\n- Realizar pagos\n- Contactar clínica\n- Chat de ayuda\n\n**Ventajas móviles:**\n- Notificaciones push\n- Cámara para documentos\n- Ubicación GPS\n- Llamadas directas\n\n¿Tienes problemas para acceder desde tu celular?`;
      } else if (step === 2) {
        return `Para optimizar tu experiencia móvil:\n\n**Configuración recomendada:**\n- Agrega a pantalla principal\n- Activa notificaciones\n- Permite ubicación\n- Guarda contraseña\n\n**Navegadores compatibles:**\n- Chrome (recomendado)\n- Safari (iOS)\n- Firefox\n- Edge\n\n**Funciones móviles:**\n- **Llamada directa:** toca ${this.clinicContext.phone}\n- **WhatsApp:** toca ${this.clinicContext.whatsapp}\n- **Ubicación:** GPS a la clínica\n- **Fotos:** adjuntar documentos\n\n**Problemas comunes:**\n- Pantalla pequeña: usa zoom\n- Carga lenta: verifica conexión\n- Formularios: gira horizontal\n\n¿Necesitas ayuda con alguna función específica?`;
      }
    }

    // CERRAR SESIÓN
    if (message.includes('cerrar sesión') || message.includes('salir') || message.includes('logout') ||
        message.includes('desconectar') || message.includes('terminar sesión') || message.includes('log out') ||
        message.includes('desloguear') || message.includes('finalizar') || message.includes('acabar sesión') ||
        message.includes('sign out') || message.includes('como salir') || message.includes('desactivar')) {
      currentTopic = 'cerrar_sesion';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🚪 **Cerrar sesión**\n\n**Cómo cerrar sesión:**\n1. Busca tu nombre en la parte superior\n2. Haz clic en el menú desplegable\n3. Selecciona "Cerrar sesión" o "Salir"\n4. Confirma la acción\n\n**Ubicación del botón:**\n- Esquina superior derecha\n- Menú principal\n- Icono de usuario\n- Panel de navegación\n\n**Importante:**\n- Guarda cambios antes de salir\n- Confirma turnos pendientes\n- Anota información importante\n\n¿No encuentras el botón para salir?`;
      } else if (step === 2) {
        return `Para cerrar sesión correctamente:\n\n**Pasos detallados:**\n1. **Busca:** tu nombre o icono de usuario\n2. **Haz clic:** en el menú desplegable\n3. **Selecciona:** "Cerrar sesión"\n4. **Confirma:** si se solicita\n\n**Alternativas:**\n- Cierra la pestaña del navegador\n- Cierra todo el navegador\n- Reinicia el dispositivo\n\n**Recomendaciones:**\n- Siempre cierra sesión en equipos públicos\n- Guarda información importante\n- Anota números de turno\n- Confirma acciones pendientes\n\n**Próximo acceso:**\n- Usa las mismas credenciales\n- Recupera contraseña si es necesario\n- Contacta soporte si hay problemas\n\n¿Necesitas ayuda con algo más antes de salir?`;
      }
    }

    // SEGURIDAD Y PRIVACIDAD
    if (message.includes('seguridad') || message.includes('privacidad') || message.includes('datos seguros') ||
        message.includes('protección') || message.includes('confidencial') || message.includes('hackear') ||
        message.includes('robar datos') || message.includes('información personal') || message.includes('contraseña') ||
        message.includes('cuenta segura') || message.includes('virus') || message.includes('malware')) {
      currentTopic = 'seguridad_privacidad';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🔒 **Seguridad y privacidad**\n\n**Tus datos están protegidos:**\n- Conexión SSL encriptada\n- Servidor seguro\n- Cumplimiento GDPR\n- Auditorías regulares\n\n**Medidas de seguridad:**\n- Contraseñas encriptadas\n- Sesiones temporales\n- Acceso limitado\n- Backup automático\n\n**Tu información médica:**\n- Confidencialidad absoluta\n- Acceso solo autorizado\n- Historial protegido\n- Ley de secreto profesional\n\n**Recomendaciones:**\n- Usa contraseñas seguras\n- Cierra sesión en equipos públicos\n- No compartas credenciales\n- Reporta actividad sospechosa\n\n¿Tienes alguna preocupación específica?`;
      } else if (step === 2) {
        return `Para mantener tu cuenta segura:\n\n**Contraseña segura:**\n- Mínimo 8 caracteres\n- Incluye números y símbolos\n- Evita datos personales\n- Cambia regularmente\n\n**Buenas prácticas:**\n- No guardes contraseñas en navegadores públicos\n- Verifica la URL antes de ingresar datos\n- Usa conexiones seguras (WiFi confiable)\n- Mantén actualizado tu navegador\n\n**En caso de problemas:**\n- Cambia contraseña inmediatamente\n- Contacta al ${this.clinicContext.phone}\n- Reporta actividad sospechosa\n- Verifica tu historial de accesos\n\n**Protección de datos:**\n- Tus datos no se comparten\n- Uso exclusivo para atención médica\n- Eliminación segura cuando solicites\n- Derechos de acceso y rectificación\n\n¿Necesitas cambiar tu contraseña?`;
      }
    }

    // NAVEGACIÓN Y ACCIONES DEL SISTEMA
    if (message.includes('cancelar turno') || message.includes('cancelar mi turno') || message.includes('cancelar cita') ||
        message.includes('anular turno') || message.includes('eliminar turno') || message.includes('no puedo ir') ||
        message.includes('no podré asistir') || message.includes('tengo que cancelar')) {
      currentTopic = 'cancelar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `❌ **Cancelar turno**\n\n**Pasos para cancelar tu turno:**\n1. Ve a 'Mis Turnos' desde tu panel\n2. Busca el turno que deseas cancelar\n3. Haz clic en el botón rojo con ❌\n4. Confirma la cancelación\n\n**Enlace directo:** 👉 **[Ir a Mis Turnos](/misTurnos)**\n\n**Política de cancelación:**\n- Cancela hasta 24 horas antes\n- Reembolso automático si pagaste\n- Sin penalización por cancelación\n\n¿Necesitas ayuda para encontrar tu turno?`;
      } else if (step === 2) {
        return `Para cancelar tu turno específico:\n\n**Si ya encontraste tu turno:**\n- Haz clic en el botón rojo ❌\n- Confirma la cancelación\n- Recibirás confirmación por email\n\n**Si no puedes encontrarlo:**\n- Verifica la fecha del turno\n- Actualiza la página\n- Contacta al ${this.clinicContext.phone}\n\n**Después de cancelar:**\n- Reembolso procesado en 24-48 horas\n- Turno disponible para otros pacientes\n- Puedes reservar uno nuevo cuando quieras\n\n¿Necesitas ayuda con algo más?`;
      }
    }

    // REPROGRAMAR TURNO
    if (message.includes('reprogramar') || message.includes('cambiar turno') || message.includes('cambiar fecha') ||
        message.includes('cambiar hora') || message.includes('mover turno') || message.includes('reagendar') ||
        message.includes('cambiar cita') || message.includes('nueva fecha') || message.includes('otro día')) {
      currentTopic = 'reprogramar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🔄 **Reprogramar turno**\n\n**Cómo reprogramar tu turno:**\n1. Ve a 'Mis Turnos' 👉 **[Ir a Mis Turnos](/misTurnos)**\n2. Encuentra tu turno actual\n3. Haz clic en "Reprogramar" (icono de calendario)\n4. Selecciona nueva fecha y hora\n5. Confirma el cambio\n\n**Importante:**\n- Reprograma hasta 24 horas antes\n- Sujeto a disponibilidad\n- Sin costo adicional\n- Mantiene el mismo tratamiento\n\n¿Qué fecha te gustaría cambiar?`;
      } else if (step === 2) {
        return `Para reprogramar exitosamente:\n\n**Pasos detallados:**\n1. **Accede a tus turnos:** [Mis Turnos](/misTurnos)\n2. **Busca tu turno:** por fecha o tratamiento\n3. **Haz clic en reprogramar:** icono 🔄\n4. **Selecciona nueva fecha:** calendario disponible\n5. **Confirma:** nueva fecha y hora\n\n**Alternativa rápida:**\n- Cancela el turno actual\n- Reserva uno nuevo inmediatamente\n- Mantén el mismo tratamiento\n\n¿Prefieres que te ayude a reservar uno nuevo?`;
      }
    }

    // RESERVAR TURNO PASO A PASO
    if (message.includes('reservar turno') || message.includes('agendar') || message.includes('nuevo turno') ||
        message.includes('sacar turno') || message.includes('cita') || message.includes('como reservar') ||
        message.includes('hacer reserva') || message.includes('solicitar turno') || message.includes('pedir turno') ||
        message.includes('turno nuevo') || message.includes('agenda') || message.includes('programar')) {
      currentTopic = 'reservar_turno';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📅 **Reservar nuevo turno**\n\n**Paso a paso:**\n1. **Ve a reservar:** 👉 **[Reservar Turno](/reservarTurno)**\n2. **Selecciona fecha:** calendario disponible\n3. **Elige horario:** turnos libres\n4. **Confirma tratamiento:** tipo de consulta\n5. **Realiza el pago:** MercadoPago o en clínica\n\n**Información necesaria:**\n- Fecha deseada\n- Horario preferido\n- Tipo de tratamiento\n- Datos actualizados\n\n**Disponibilidad:**\n- Lunes a Viernes: 8:00 - 20:00\n- Sábados: 8:00 - 14:00\n- Turnos cada 30 minutos\n\n¿Qué tratamiento necesitas?`;
      } else if (step === 2) {
        return `Para completar tu reserva:\n\n**Pasos detallados:**\n1. **Accede:** [Reservar Turno](/reservarTurno)\n2. **Calendario:** haz clic en día disponible\n3. **Horarios:** selecciona hora libre\n4. **Tratamiento:** elige de la lista\n5. **Confirma:** revisa datos\n6. **Pago:** MercadoPago o presencial\n\n**Tratamientos disponibles:**\n- Consulta general\n- Limpieza dental\n- Empastes\n- Endodoncia\n- Ortodoncia\n- Implantes\n- Emergencias\n\n**Después de reservar:**\n- Confirmación por email\n- Recordatorio 24 horas antes\n- Comprobante de pago\n\n¿Necesitas ayuda con algún paso específico?`;
      }
    }

    // HISTORIAL DE TURNOS
    if (message.includes('historial') || message.includes('mis turnos') || message.includes('turnos anteriores') ||
        message.includes('citas pasadas') || message.includes('consultas anteriores') || message.includes('ver turnos') ||
        message.includes('lista de turnos') || message.includes('turnos realizados') || message.includes('historial médico')) {
      currentTopic = 'historial_turnos';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📋 **Historial de turnos**\n\n**Accede a tu historial completo:**\n👉 **[Ver Mis Turnos](/misTurnos)**\n\n**En tu historial puedes ver:**\n- Turnos realizados\n- Turnos pendientes\n- Turnos cancelados\n- Tratamientos recibidos\n- Pagos realizados\n- Fechas y horarios\n- Dentista que te atendió\n\n**Filtros disponibles:**\n- Por fecha\n- Por tratamiento\n- Por estado\n\n¿Buscas algo específico en tu historial?`;
      } else if (step === 2) {
        return `Para navegar tu historial:\n\n**Funciones disponibles:**\n- **Ver detalles:** información completa del turno\n- **Descargar comprobante:** para reembolsos\n- **Solicitar certificado:** de atención médica\n- **Revisar tratamientos:** historial clínico\n\n**Accesos rápidos:**\n- [Mis Turnos](/misTurnos) - historial completo\n- [Vista Paciente](/vistaPaciente) - resumen\n- [Reservar Turno](/reservarTurno) - nuevo turno\n\n**Dudas frecuentes:**\n- Certificados médicos disponibles\n- Historial completo desde el primer turno\n- Exportar datos bajo solicitud\n\n¿Necesitas un certificado o comprobante específico?`;
      }
    }

    // PAGOS Y ESTADO DEL PAGO
    if (message.includes('pagar') || message.includes('pago') || message.includes('cuánto cuesta') ||
        message.includes('precio') || message.includes('cobro') || message.includes('factura') ||
        message.includes('mercadopago') || message.includes('tarjeta') || message.includes('efectivo') ||
        message.includes('estado del pago') || message.includes('pagué') || message.includes('cobrar')) {
      currentTopic = 'pagos_sistema';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `💳 **Pagos y facturación**\n\n**Métodos de pago disponibles:**\n- MercadoPago (tarjetas, efectivo)\n- Pago en clínica (efectivo, tarjeta)\n- Transferencia bancaria\n- Obras sociales\n\n**Para ver tus pagos:**\n👉 **[Ir a Mis Turnos](/misTurnos)** - verás el estado de cada pago\n\n**Estados de pago:**\n- ✅ Pagado\n- ⏳ Pendiente\n- ❌ Fallido\n- 💰 Reembolsado\n\n¿Necesitas ayuda con algún pago específico?`;
      } else if (step === 2) {
        return `Para gestionar tus pagos:\n\n**Ver estado de pagos:**\n- Ve a [Mis Turnos](/misTurnos)\n- Cada turno muestra su estado de pago\n- Haz clic en "Ver detalles" para más info\n\n**Problemas con pagos:**\n- Pago fallido: intenta nuevamente\n- Pago pendiente: espera 24-48 horas\n- Doble cobro: contacta al ${this.clinicContext.phone}\n\n**Reembolsos:**\n- Procesados automáticamente al cancelar\n- Tiempo: 3-5 días hábiles\n- Mismo método de pago original\n\n¿Tienes algún problema específico con un pago?`;
      }
    }

    // CONTACTO CON LA CLÍNICA
    if (message.includes('contactar') || message.includes('llamar') || message.includes('teléfono') ||
        message.includes('whatsapp') || message.includes('email') || message.includes('contacto') ||
        message.includes('hablar') || message.includes('comunicar') || message.includes('consultar') ||
        message.includes('dirección') || message.includes('ubicación') || message.includes('dónde están')) {
      currentTopic = 'contacto_clinica';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📞 **Contacto con la clínica**\n\n**Medios de contacto:**\n📞 **Teléfono:** ${this.clinicContext.phone}\n📱 **WhatsApp:** ${this.clinicContext.whatsapp}\n📧 **Email:** ${this.clinicContext.email}\n🌐 **Web:** ${this.clinicContext.website}\n\n**Dirección:**\n📍 ${this.clinicContext.address}\n\n**Horarios de atención:**\n- Lunes a Viernes: 8:00 - 20:00\n- Sábados: 8:00 - 14:00\n- Emergencias: 24/7\n\n¿Qué medio prefieres para contactarte?`;
      } else if (step === 2) {
        return `Para contactarte efectivamente:\n\n**Por teléfono:**\n- Llama al ${this.clinicContext.phone}\n- Mejor horario: 9:00 - 11:00 y 14:00 - 17:00\n- Ten a mano tu número de turno\n\n**Por WhatsApp:**\n- Envía mensaje a ${this.clinicContext.whatsapp}\n- Respuesta en máximo 2 horas\n- Adjunta fotos si es necesario\n\n**Por email:**\n- Escribe a ${this.clinicContext.email}\n- Respuesta en 24 horas\n- Ideal para consultas no urgentes\n\n**Visita presencial:**\n- ${this.clinicContext.address}\n- Estacionamiento gratuito\n- Acceso para personas con movilidad reducida\n\n¿Necesitas indicaciones para llegar?`;
      }
    }

    // DATOS PERSONALES Y PERFIL
    if (message.includes('datos personales') || message.includes('perfil') || message.includes('información personal') ||
        message.includes('cambiar datos') || message.includes('actualizar') || message.includes('editar perfil') ||
        message.includes('obra social') || message.includes('teléfono') || message.includes('dirección') ||
        message.includes('email') || message.includes('nombre') || message.includes('modificar datos')) {
      currentTopic = 'datos_personales';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `👤 **Datos personales y perfil**\n\n**Para ver/editar tu perfil:**\n👉 **[Ir a Vista Paciente](/vistaPaciente)**\n\n**Datos que puedes actualizar:**\n- Nombre y apellido\n- Teléfono de contacto\n- Email\n- Dirección\n- Obra social\n- Fecha de nacimiento\n- Información médica relevante\n\n**Importante:**\n- Mantén tus datos actualizados\n- Verifica tu email para notificaciones\n- Obra social actualizada para coberturas\n\n¿Qué datos necesitas cambiar?`;
      } else if (step === 2) {
        return `Para actualizar tus datos:\n\n**Pasos para editar:**\n1. Ve a [Vista Paciente](/vistaPaciente)\n2. Busca la sección "Mi Perfil"\n3. Haz clic en "Editar datos"\n4. Actualiza la información\n5. Guarda los cambios\n\n**Datos críticos:**\n- **Teléfono:** para confirmaciones\n- **Email:** para notificaciones\n- **Obra social:** para coberturas\n- **Alergias:** información médica\n\n**Seguridad:**\n- Tus datos están protegidos\n- Solo tú puedes editarlos\n- Cambios registrados para auditoría\n\n¿Necesitas ayuda con algún dato específico?`;
      }
    }

    // Respuesta por defecto con contexto
    const lastTopic = this.getLastTopic();
    if (lastTopic && this.getConversationStep() > 2) {
      return `Entiendo que sigues preguntando sobre ${this.getTopicName(lastTopic)}. ¿Te gustaría que te ayude a agendar una consulta para resolver todas tus dudas con un especialista?`;
    }
    
    return `🤔 **Entiendo tu consulta sobre "${message}"**\n\nPuedo ayudarte con:\n\n**💊 Temas médicos:**\n- Dolor dental, sensibilidad, encías\n- Caries, empastes, endodoncia\n- Ortodoncia, implantes\n- Emergencias dentales\n\n**🏥 Navegación del sistema:**\n- Cancelar turno\n- Reprogramar turno\n- Reservar nuevo turno\n- Ver historial de turnos\n- Gestionar pagos\n- Contactar la clínica\n\n**ℹ️ Información:**\n- Tratamientos y precios\n- Horarios y ubicación\n- Datos personales\n- Acceso móvil\n\n¿Podrías ser más específico sobre lo que necesitas?`;
  }

  private getTopicName(topic: string): string {
    const topicNames: { [key: string]: string } = {
      'dolor_dental': 'dolor dental',
      'sensibilidad': 'sensibilidad dental',
      'sangrado_encias': 'sangrado de encías',
      'mal_aliento': 'mal aliento',
      'cuidado_infantil': 'cuidado infantil',
      'embarazo': 'embarazo',
      'bruxismo': 'bruxismo',
      'manchas': 'manchas en dientes',
      'endodoncia': 'endodoncia',
      'periodoncia': 'periodoncia',
      'ortodoncia': 'ortodoncia',
      'implantes': 'implantes',
      'higiene_bucal': 'higiene bucal',
      'caries': 'caries',
      'blanqueamiento': 'blanqueamiento',
      'emergencias': 'emergencias',
      'diabetes': 'diabetes',
      'ansiedad_dental': 'ansiedad dental',
      'costos': 'costos',
      'horarios_ubicacion': 'horarios y ubicación',
      'nutricion_dental': 'nutrición dental',
      'medicamentos_dental': 'medicamentos',
      'cuidado_post_tratamiento': 'cuidado post-tratamiento',
      'prevencion_mantenimiento': 'prevención y mantenimiento',
      'cancelar_turno': 'cancelar turno',
      'reprogramar_turno': 'reprogramar turno',
      'reservar_turno': 'reservar turno',
      'historial_turnos': 'historial de turnos',
      'pagos_sistema': 'pagos y facturación',
      'contacto_clinica': 'contacto con la clínica',
      'datos_personales': 'datos personales'
    };
    return topicNames[topic] || topic;
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

  createMessage(role: "user" | "assistant", content: string, actions?: ActionButton[]): Message {
    return {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date(),
      actions: actions || []
    }
  }

  createMessageWithActions(role: "user" | "assistant", content: string, actions: ActionButton[]): Message {
    return this.createMessage(role, content, actions);
  }

  addToHistory(role: "user" | "assistant", content: string, actions?: ActionButton[]): void {
    const message = this.createMessage(role, content, actions);
    this.conversationHistory.push(message);
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
    this.saveToLocalStorage();
  }

  addToHistoryWithActions(role: "user" | "assistant", content: string, actions: ActionButton[]): void {
    this.addToHistory(role, content, actions);
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

  // Método para cambiar de usuario y cargar su historial
  switchUser(userId?: string): void {
    const newUserId = userId || this.getCurrentUserId();
    if (newUserId) {
      console.log('Cambiando a usuario:', newUserId);
      
      // Limpiar el contexto actual antes de cargar el nuevo usuario
      this.clearCurrentContext();
      
      // Cargar el historial del nuevo usuario
      this.loadFromLocalStorage(newUserId);
      
      console.log('Historial cargado para usuario:', newUserId, 'Mensajes:', this.conversationHistory.length);
    }
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