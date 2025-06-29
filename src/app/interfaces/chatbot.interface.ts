export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface QuickQuestion {
  text: string;
  action: string;
}
