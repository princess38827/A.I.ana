export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  isError?: boolean;
  groundingChunks?: Array<{
    title?: string;
    uri?: string;
  }>;
}

export interface AssistantSettings {
  systemPreset: string;
  customSystemInstruction: string;
  temperature: number;
  enableSearchGrounding: boolean;
}

export interface SvgArtwork {
  id: string;
  prompt: string;
  code: string;
  timestamp: string;
}

export interface WritingTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  presetPrompt: string;
}
