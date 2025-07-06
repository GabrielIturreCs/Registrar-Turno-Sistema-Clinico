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
    this.loadFromLocalStorage();
  }

  // --- LOCALSTORAGE METHODS ---
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('chatbot_history', JSON.stringify(this.conversationHistory));
      localStorage.setItem('chatbot_context', JSON.stringify(this.userContext));
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const savedHistory = localStorage.getItem('chatbot_history');
      const savedContext = localStorage.getItem('chatbot_context');
      
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
    
    // Dolor dental
    if (message.includes('me duele') || message.includes('dolor') || message.includes('molestia')) {
      currentTopic = 'dolor_dental';
      this.setLastTopic(currentTopic);
      
      if (message.includes('diente') || message.includes('muela')) {
        const step = this.getConversationStep();
        if (step === 1) {
          return `🦷 **Dolor dental**\n\n¿Desde cuándo tienes el dolor? ¿Es constante o intermitente?\n\n**Causas posibles:** caries, infección, fractura, sensibilidad.\n**Recomendaciones:**\n- Evita alimentos fríos/calientes\n- No mastiques del lado afectado\n- Analgésico si es necesario\n- Llama al ${this.clinicContext.phone}\n\n¿Puedes describir más el dolor?`;
        } else if (step === 2) {
          return `Entiendo. Basándome en lo que me cuentas, te recomiendo:\n\n**Acción inmediata:**\n- Toma un analgésico si el dolor es intenso\n- Aplica frío local (hielo envuelto en tela)\n- Evita masticar del lado afectado\n\n**Próximos pasos:**\n- Agenda una consulta urgente\n- Llama al ${this.clinicContext.phone}\n- Si el dolor es muy intenso, ve a emergencias\n\n¿Quieres que te ayude a agendar una consulta?`;
        }
      }
    }
    
    // Sensibilidad dental
    if (message.includes('sensibilidad') || message.includes('sensible')) {
      currentTopic = 'sensibilidad';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Sensibilidad dental**\n\nCausas: desgaste de esmalte, encías retraídas, caries pequeñas, cepillado fuerte.\n**Tratamiento:** pasta desensibilizante, barniz fluorado, resina, tratamiento de encías.\n**Consejos:** usa pasta para sensibles, cepilla suave, evita extremos de temperatura.\n\n¿Quieres una evaluación?`;
      } else if (step === 2) {
        return `Perfecto. Para la sensibilidad te recomiendo:\n\n**Tratamiento inmediato:**\n- Pasta dental para dientes sensibles\n- Cepillo de cerdas suaves\n- Enjuague bucal específico\n\n**En la clínica:**\n- Aplicación de barniz fluorado\n- Sellado de cuellos expuestos\n- Evaluación de la causa raíz\n\n¿Te gustaría agendar una consulta para evaluar la causa?`;
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
    
    // Implantes
    if (message.includes('implante') || message.includes('diente perdido')) {
      currentTopic = 'implantes';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `🦷 **Implantes dentales**\n\nReemplazan dientes perdidos con tornillos de titanio.\n**Ventajas:** durabilidad, naturalidad, función, estética.\n**Proceso:** evaluación, cirugía, integración, corona.\n\n¿Tienes dientes perdidos?`;
      } else if (step === 2) {
        return `Los implantes son la mejor opción para dientes perdidos:\n\n**Ventajas:**\n- Durabilidad de por vida\n- Función natural\n- Estética perfecta\n- No afecta dientes vecinos\n\n**Proceso:**\n- Evaluación con tomografía\n- Cirugía ambulatoria\n- Integración ósea (3-6 meses)\n- Colocación de corona\n\n¿Quieres una evaluación para implantes?`;
      }
    }
    
    // Respuesta por defecto con contexto
    const lastTopic = this.getLastTopic();
    if (lastTopic && this.getConversationStep() > 2) {
      return `Entiendo que sigues preguntando sobre ${this.getTopicName(lastTopic)}. ¿Te gustaría que te ayude a agendar una consulta para resolver todas tus dudas con un especialista?`;
    }
    
    return `🤔 **Entiendo tu consulta sobre "${message}"**\n\nPuedo ayudarte con:\n- Dolor dental\n- Sensibilidad\n- Encías\n- Mal aliento\n- Niños\n- Embarazo\n- Bruxismo\n- Manchas\n- Endodoncia\n- Periodoncia\n- Ortodoncia\n- Implantes\n\n¿Podrías ser más específico?`;
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
      'implantes': 'implantes dentales'
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
    
    // Agenda
    if (message.includes('agenda') || message.includes('ausentismo')) {
      currentTopic = 'gestion_agenda';
      this.setLastTopic(currentTopic);
      
      const step = this.getConversationStep();
      if (step === 1) {
        return `📅 **Gestión de agenda**\n\n- Confirmar turnos por WhatsApp\n- Recordatorios automáticos\n- Lista de espera\n- Flexibilidad horaria\n- Seguimiento de ausentistas\n\n¿Tienes problemas con ausentismo?`;
      } else if (step === 2) {
        return `Estrategias para reducir ausentismo:\n\n**Confirmación de turnos:**\n- WhatsApp 24h antes\n- Llamada telefónica\n- Email de recordatorio\n- SMS automático\n\n**Manejo de ausentistas:**\n- Lista de espera\n- Cargo por cancelación tardía\n- Política clara de reprogramación\n- Seguimiento personalizado\n\n¿Quieres implementar alguna estrategia?`;
      }
    }
    
    // Respuesta por defecto con contexto
    const lastTopic = this.getLastTopic();
    if (lastTopic && this.getConversationStep() > 2) {
      return `Veo que sigues consultando sobre ${this.getDentistTopicName(lastTopic)}. ¿Te gustaría que profundicemos en algún aspecto específico o necesitas ayuda práctica con algún caso?`;
    }
    
    return `👨‍⚕️ **Asistente DentalBot**\n\nPuedo ayudarte con:\n- Manejo de pacientes difíciles\n- Emergencias\n- Instrumentos rotos\n- Anestesia\n- Comunicación\n- Infecciones\n- Actualización profesional\n- Agenda\n\n¿Podrías ser más específico?`;
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
      'gestion_agenda': 'gestión de agenda'
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