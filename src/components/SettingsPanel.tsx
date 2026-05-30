import React from "react";
import { 
  SlidersHorizontal, 
  Sparkles, 
  Globe, 
  HelpCircle, 
  Bot, 
  Code2, 
  PenTool, 
  GraduationCap 
} from "lucide-react";
import { AssistantSettings } from "../types";
import { PERSONA_PRESETS } from "../data";

interface SettingsPanelProps {
  settings: AssistantSettings;
  setSettings: React.Dispatch<React.SetStateAction<AssistantSettings>>;
}

export default function SettingsPanel({ settings, setSettings }: SettingsPanelProps) {
  const handleSelectPreset = (id: string, instruction: string) => {
    setSettings((prev) => ({
      ...prev,
      systemPreset: id,
      customSystemInstruction: instruction,
    }));
  };

  const handleUpdateSlider = (val: number) => {
    setSettings((prev) => ({ ...prev, temperature: val }));
  };

  const handleToggleSearch = () => {
    setSettings((prev) => ({ ...prev, enableSearchGrounding: !prev.enableSearchGrounding }));
  };

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSettings((prev) => ({
      ...prev,
      systemPreset: "custom",
      customSystemInstruction: e.target.value,
    }));
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case "Code2": return <Code2 className="w-4 h-4 text-emerald-400" />;
      case "PenTool": return <PenTool className="w-4 h-4 text-pink-400" />;
      case "GraduationCap": return <GraduationCap className="w-4 h-4 text-amber-400" />;
      default: return <Bot className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 overflow-y-auto">
      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 font-sans">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          Engine Parameters
        </h3>
        <p className="text-xs text-slate-400 mt-1">Refine and tune your workspace agent tuning properties.</p>
      </div>

      {/* Selector Grid of Presets */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Expert Persona Presets</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PERSONA_PRESETS.map((preset) => {
            const isSelected = settings.systemPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id, preset.instruction)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer outline-none ${
                  isSelected 
                    ? "bg-indigo-500/10 border-indigo-500 shadow-md shadow-indigo-500/5 text-slate-100" 
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-slate-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? "bg-indigo-500/20" : "bg-slate-900"}`}>
                    {getPresetIcon(preset.icon)}
                  </div>
                  <span className="text-xs font-semibold font-sans">{preset.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-sans">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* System prompt box */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Current Agent Directives</label>
          {settings.systemPreset === "custom" && (
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono">Customized</span>
          )}
        </div>
        <textarea
          value={settings.customSystemInstruction}
          onChange={handleInstructionChange}
          placeholder="Enter your system prompts or personalized instructions..."
          rows={4}
          className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none font-mono leading-relaxed"
        />
        <p className="text-[10px] text-slate-500 font-sans">
          This system prompt dictates how the AI behaves, answers, and styles its output (the model knows nothing else).
        </p>
      </div>

      {/* Temperature scale with Slider */}
      <div className="space-y-3.5 bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-slate-200 font-sans">Model Temperature</label>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">Determines outcome variance (creativity limit).</p>
          </div>
          <span className="text-xs font-mono bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded bg-slate-900 font-bold min-w-[35px] text-center">
            {settings.temperature.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-mono text-slate-500 font-semibold">PRECISE</span>
          <input
            type="range"
            min="0.2"
            max="1.2"
            step="0.05"
            value={settings.temperature}
            onChange={(e) => handleUpdateSlider(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[10px] font-mono text-slate-500 font-semibold">CREATIVE</span>
        </div>
      </div>

      {/* Search Grounding Toggle */}
      <div className="flex items-start justify-between bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h4 className="text-xs font-semibold text-slate-200 font-sans">Google Search Grounding</h4>
          </div>
          <p className="text-[10px] text-slate-400 font-sans leading-relaxed pr-6 mt-1">
            Validates fact checks in real-time by routing queries through Google Search indexing and returning citing URLs.
          </p>
        </div>
        <button
          onClick={handleToggleSearch}
          className={`shrink-0 w-12 h-6.5 rounded-full p-1 transition-colors relative outline-none cursor-pointer ${
            settings.enableSearchGrounding ? "bg-emerald-600" : "bg-slate-850 border border-slate-700/60"
          }`}
        >
          <div
            className={`w-4.5 h-4.5 bg-slate-100 rounded-full shadow-md transition-transform transform ${
              settings.enableSearchGrounding ? "translate-x-5.5 bg-white" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
