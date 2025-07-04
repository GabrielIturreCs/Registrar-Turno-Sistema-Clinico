import { Injectable } from '@angular/core'
import { Message } from '..//interfaces/message.interface'

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  generateResponse(userMessage: string, userType: 'patient' | 'dentist' = 'patient'): string {
    const message = userMessage.toLowerCase()
    
    if (userType === 'dentist') {
      return this.generateDentistResponse(message)
    }
    
    if (message.includes('horario') || message.includes('hora')) {
      return "Nuestros horarios de atención son:\n\n🕐 Lunes a Viernes: 8:00 AM - 6:00 PM\n🕐 Sábados: 9:00 AM - 2:00 PM\n🕐 Domingos: Cerrado\n\nPara emergencias dentales, contamos con atención 24/7."
    }
    
    if (message.includes('servicio') || message.includes('ofrecen')) {
      return "Ofrecemos los siguientes servicios dentales:\n\n🦷 Limpieza dental y profilaxis\n🦷 Tratamientos de caries\n🦷 Endodoncia (tratamiento de conducto)\n🦷 Ortodoncia (brackets y alineadores)\n🦷 Implantes dentales\n🦷 Blanqueamiento dental\n🦷 Cirugía oral menor\n🦷 Odontopediatría\n\n¿Te gustaría más información sobre algún servicio específico?"
    }
    
    if (message.includes('cita') || message.includes('agendar')) {
      return "Para agendar una cita puedes:\n\n📞 Llamarnos al (555) 123-4567\n📱 Enviarnos un WhatsApp al +1 555-123-4567\n🌐 Visitar nuestra página web\n📧 Enviarnos un email a citas@consultorio.com\n\n¿En qué horario te resulta más conveniente?"
    }
    
    if (message.includes('seguro') || message.includes('seguros')) {
      return "Sí, aceptamos la mayoría de seguros médicos dentales. Algunos de los principales incluyen:\n\n💳 MetLife\n💳 Delta Dental\n💳 Aetna\n💳 Cigna\n💳 Blue Cross Blue Shield\n\nTe recomendamos verificar tu cobertura específica antes de tu cita."
    }
    
    if (message.includes('costo') || message.includes('precio') || message.includes('cuánto')) {
      return "Los precios varían según el tratamiento. Aquí tienes una guía aproximada:\n\n💰 Limpieza dental: $80-120\n💰 Consulta general: $60-100\n💰 Tratamiento de caries: $150-300\n💰 Blanqueamiento: $200-400\n\nLos precios exactos se determinan después de una evaluación personalizada."
    }
    
    if (message.includes('emergencia') || message.includes('urgencia')) {
      return "¡Sí! Atendemos emergencias dentales 24/7. Si tienes una emergencia:\n\n🚨 Llama inmediatamente al (555) 123-4567\n🚨 Para emergencias graves, ve a la sala de emergencias más cercana\n🚨 Estamos preparados para atender fracturas, dolor severo, sangrado, etc.\n\n¿Estás experimentando una emergencia dental ahora?"
    }
    
    return "Gracias por tu consulta. Soy DentalBot y estoy aquí para ayudarte con información general sobre nuestros servicios dentales. Para diagnósticos específicos o tratamientos, te recomiendo agendar una cita con nuestros profesionales. ¿Hay algo más en lo que pueda ayudarte?"
  }

  private generateDentistResponse(message: string): string {
    if (message.includes('cita') || message.includes('agenda') || message.includes('horario')) {
      return "Gestión de citas:\n\n📅 Puedes revisar tu agenda diaria en el panel principal\n📅 Modificar citas desde 'Gestionar Citas'\n📅 Ver disponibilidad en tiempo real\n📅 Configurar recordatorios automáticos\n\n¿Necesitas ayuda con alguna cita específica?"
    }
    
    if (message.includes('paciente') || message.includes('historial') || message.includes('expediente')) {
      return "Gestión de pacientes:\n\n👤 Accede a historiales médicos completos\n👤 Actualiza tratamientos y diagnósticos\n👤 Revisa el historial de pagos\n👤 Programa seguimientos\n👤 Genera reportes personalizados\n\n¿Qué información específica necesitas de un paciente?"
    }
    
    if (message.includes('tratamiento') || message.includes('procedimiento')) {
      return "Gestión de tratamientos:\n\n🦷 Registra procedimientos realizados\n🦷 Actualiza estados de tratamiento\n🦷 Programa sesiones de seguimiento\n🦷 Genera presupuestos detallados\n🦷 Documenta con imágenes\n\n¿Necesitas actualizar algún tratamiento?"
    }
    
    if (message.includes('reporte') || message.includes('estadística') || message.includes('informe')) {
      return "Reportes y estadísticas:\n\n📊 Genera reportes mensuales de ingresos\n📊 Analiza tratamientos más frecuentes\n📊 Revisa satisfacción de pacientes\n📊 Exporta datos a Excel/PDF\n📊 Visualiza gráficos de rendimiento\n\n¿Qué tipo de reporte necesitas?"
    }
    
    if (message.includes('inventario') || message.includes('material') || message.includes('suministro')) {
      return "Gestión de inventario:\n\n📦 Controla stock de materiales dentales\n📦 Genera alertas de bajo inventario\n📦 Registra nuevas compras\n📦 Programa pedidos automáticos\n📦 Gestiona proveedores\n\n¿Necesitas revisar algún material específico?"
    }
    
    if (message.includes('configuración') || message.includes('ajuste') || message.includes('personalizar')) {
      return "Configuración del sistema:\n\n⚙️ Personaliza horarios de trabajo\n⚙️ Configura tipos de tratamiento\n⚙️ Establece tarifas y precios\n⚙️ Gestiona usuarios y permisos\n⚙️ Configura recordatorios\n\n¿Qué configuración necesitas ajustar?"
    }
    
    return "Hola Doctor/a. Soy DentalBot, tu asistente para la gestión de la clínica. Puedo ayudarte con:\n\n🔹 Gestión de citas y agenda\n🔹 Información de pacientes\n🔹 Seguimiento de tratamientos\n🔹 Reportes y estadísticas\n🔹 Control de inventario\n🔹 Configuración del sistema\n\n¿En qué puedo asistirte hoy?"
  }

  createMessage(role: "user" | "assistant", content: string): Message {
    return {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date()
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}