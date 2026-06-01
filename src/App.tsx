import React, { useState } from "react";
import { 
  MessageSquare, 
  Paintbrush, 
  Zap, 
  SlidersHorizontal, 
  Bot, 
  Sparkles,
  Cpu,
  Layers,
  HelpCircle,
  Clock,
  User,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Components
import ChatPanel from "./components/ChatPanel";
import ArtworkCanvas from "./components/ArtworkCanvas";
import TemplateWizard from "./components/TemplateWizard";
import SettingsPanel from "./components/SettingsPanel";

// Types / Data
import { AssistantSettings } from "./types";
import { PERSONA_PRESETS } from "./data";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "vector" | "templates" | "tuning">("chat");

  const [settings, setSettings] = useState<AssistantSettings>({
    systemPreset: "helpful",
    customSystemInstruction: PERSONA_PRESETS[0].instruction,
    temperature: 0.7,
    enableSearchGrounding: false
  });

  const sidebarTabs = [
    { id: "chat", name: "Conversational Engine", icon: MessageSquare, desc: "Grounded analytical chatting" },
    { id: "vector", name: "Vector Design Studio", icon: Paintbrush, desc: "AI-procedural vector graphics" },
    { id: "templates", name: "Task Workflows", icon: Zap, desc: "Smarter writing wizard" },
    { id: "tuning", name: "Engine Tuning", icon: SlidersHorizontal, desc: "Tweak model parameters & prompt instructions" }
  ] as const;

  const renderActiveWorkspace = () => {
    switch (activeTab) {
      case "chat":
        return <ChatPanel settings={settings} systemPrompt={settings.customSystemInstruction} />;
      case "vector":
        return <ArtworkCanvas />;
      case "templates":
        return <TemplateWizard />;
      case "tuning":
        return <SettingsPanel settings={settings} setSettings={setSettings} />;
    }
  };

  return (
    <div id="app_root" className="flex h-screen w-screen bg-[#030712] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar Rail */}
      <aside className="w-80 bg-slate-950 border-r border-slate-900 flex flex-col justify-between shrink-0 h-full">
        {/* Core title branding */}
        <div className="px-6 py-6 border-b border-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-xl">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight font-sans">AI MindStudio</h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Workspace V1.4</p>
            </div>
          </div>
        </div>

        {/* Tab Selection area */}
        <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
          <p className="px-3 pb-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Functional Tools</p>
          {sidebarTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-start text-left px-3.5 py-3 rounded-xl border transition-all duration-200 outline-none group cursor-pointer ${
                  isSelected 
                    ? "bg-indigo-600/10 border-indigo-500/45 text-slate-100" 
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                }`}
              >
                <TabIcon className={`w-4 h-4 mr-3.5 mt-0.5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                  isSelected ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                }`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold font-sans">{tab.name}</div>
                  <div className="text-[10px] opacity-70 mt-0.5 leading-normal truncate font-sans">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Workspace Footer status lines */}
        <div className="p-4 px-6 border-t border-slate-900/80 bg-slate-950 text-slate-500 text-[10px] space-y-1 bg-slate-950/80">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Container Secure</span>
            </span>
            <span className="font-mono">Port 3000 Ingress</span>
          </div>
          <div className="text-[10px] opacity-80 leading-relaxed font-sans text-center pt-2 text-slate-500 border-t border-slate-900/40">
            Crafted securely with Gemini API
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main id="app_content_panel" className="flex-1 flex flex-col min-w-0 h-full relative p-6 bg-slate-950/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="w-full h-full"
          >
            {renderActiveWorkspace()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
