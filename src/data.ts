import { WritingTemplate } from "./types";

export interface PersonaPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  instruction: string;
}

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: "helpful",
    name: "General Assistant",
    description: "Balanced, polite, helpful, and highly versatile across any domain.",
    icon: "Sparkles",
    instruction: "You are a professional, helpful, polite, and versatile AI assistant. Answer the user's queries concisely but thoroughly, using structured formats and markdown where relevant.",
  },
  {
    id: "coder",
    name: "Software Architect",
    description: "An expert developer focused on clean, modular, and type-safe solutions.",
    icon: "Code2",
    instruction: "You are an expert Principal Software Architect. When asked for code, write clean, robust, modern, and production-ready code blocks in TypeScript/React or Tailwind CSS. Include helpful comments but skip irrelevant chat fluff. Always define types and follow industry best practices.",
  },
  {
    id: "creative",
    name: "Creative Scribe",
    description: "A highly imaginative novelist, copywriter, and branding strategist.",
    icon: "PenTool",
    instruction: "You are an elite creative writer and branding master. When responding, use expressive vocabulary, vivid descriptions, elegant metaphors, and powerful storytelling techniques, adapting seamlessly to the user's creative focus.",
  },
  {
    id: "educator",
    name: "Socratic Mentor",
    description: "A patient guide who explains complex topics elegantly with intuitive analogies.",
    icon: "GraduationCap",
    instruction: "You are a patient Socratic tutor. Break down complex technical, scientific, or historical subjects using clear analogies, step-by-step logic, and encouraging questions. Guide the user to deep understanding rather than just vomiting answers.",
  }
];

export const WRITING_TEMPLATES: WritingTemplate[] = [
  {
    id: "explain",
    name: "Elucidate & Demystify",
    description: "Break complex code, formulas, or concepts down into digestible summaries.",
    icon: "BookOpen",
    presetPrompt: "Break down the following piece of content. Explain each major component, logic flows, or structural concepts in an intuitive 'ELI5' (Explain Like I'm 5) fashion first, followed by a deeper technical table detailing the specifics:\n\n",
  },
  {
    id: "refactor",
    name: "Enhance & Optimize Code",
    description: "Revamp algorithms, add types, streamline styling, and suggest dry comments.",
    icon: "FileCode",
    presetPrompt: "Analyze the following code. Write a refactored version that enhances performance, type safety, modular design, and Tailwind utility practices. Then, explain the key performance and design optimizations you made point-by-point:\n\n",
  },
  {
    id: "email",
    name: "Professional Outbound Email",
    description: "Convert rough talking points into a highly polished, persuasive professional draft.",
    icon: "Mail",
    presetPrompt: "Draft an elegant and impactful business email based on the following rough notes. Keep it respectful, clear, call-to-action oriented, and structured with a powerful subject line:\n\n",
  },
  {
    id: "brainstorm",
    name: "Creative Brainstorming Pitch",
    description: "Flesh out rough raw thoughts into structured conceptual ideas or viral marketing pitches.",
    icon: "Lightbulb",
    presetPrompt: "Expand the following concept into five fully fledged conceptual ideas. For each idea, supply: a catchy title, a target audience, a primary value proposition, and two potential execution hooks:\n\n",
  }
];
