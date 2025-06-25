export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
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