export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  actions?: ActionButton[]
}

export interface ActionButton {
  text: string
  action: string
  icon?: string
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
}

export interface QuickQuestion {
  text: string
  icon: string
}

export interface ConsultorioInfo {
  horarios: string
  emergencias: string
  citas: string
} 