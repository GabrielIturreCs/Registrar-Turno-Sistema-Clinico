import { ActionButton } from './message.interface';

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  actions?: ActionButton[];
}

export interface QuickQuestion {
  text: string;
  action: string;
}
