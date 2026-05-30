import React, { useState } from "react";
import { 
  BookOpen, 
  FileCode, 
  Mail, 
  Lightbulb, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  Copy, 
  ClipboardCheck, 
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { WRITING_TEMPLATES } from "../data";
import { WritingTemplate } from "../types";

export default function TemplateWizard() {
  const [selectedTemplate, setSelectedTemplate] = useState<WritingTemplate | null>(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to map string to lucide icons
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "BookOpen": return <BookOpen className="w-5 h-5 text-indigo-400" />;
      case "FileCode": return <FileCode className="w-5 h-5 text-emerald-400" />;
      case "Mail": return <Mail className="w-5 h-5 text-amber-400" />;
      case "Lightbulb": return <Lightbulb className="w-5 h-5 text-pink-400" />;
      default: return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleProcessTemplate = async () => {
    if (!selectedTemplate || !inputText.trim() || isGenerating) return;

    setIsGenerating(true);
    setOutputText("");
    setErrorMsg(null);

    const consolidatedPrompt = `${selectedTemplate.presetPrompt}\n\nCONTENT FOR TASK:\n"""\n${inputText}\n"""`;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", text: consolidatedPrompt }],
          systemInstruction: "You are a senior executive and expert mentor. Output your responses in beautiful, clean markdown with detailed sections.",
          temperature: 0.6,
          enableSearchGrounding: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const rawData = line.slice(6).trim();
              if (rawData === "[DONE]") {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(rawData);
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.text) {
                  setOutputText(prev => prev + parsed.text);
                }
              } catch (e: any) {
                console.warn(e.message);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process writing template.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getPlaceholderText = (id: string) => {
    switch (id) {
      case "explain": return "Paste your lines of complex logic codes, legal contract blocks, or scientific abstracts here...";
      case "refactor": return "Paste your Javascript/Typescript or CSS codes here to clean up and audit...";
      case "email": return "Paste your simple messy outbound notes and primary goal here (e.g. Schedule a sync on Friday at 3 PM to align resource budgeting)...";
      case "brainstorm": return "Enter your raw business name ideas or simple concept words (e.g. A coffee shop that operates entirely on electric bikes)...";
      default: return "Paste your raw text materials here...";
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <AnimatePresence mode="wait">
        {!selectedTemplate ? (
          /* Template Catalog List */
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="flex-1 p-6 overflow-y-auto"
          >
            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 font-sans">
                Task Automation Wizard
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">Accelerate your workflow with expert prompt-engineered shortcuts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WRITING_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setInputText("");
                    setOutputText("");
                  }}
                  className="flex items-start text-left p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-950 transition-all outline-none group"
                >
                  <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-lg mr-4 shrink-0">
                    {renderIcon(template.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors font-sans flex items-center justify-between">
                      {template.name}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5" />
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">{template.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Template Active Playground Workspace (Split screen) */
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="flex-1 flex flex-col overflow-hidden h-full"
          >
            {/* Header with back navigation */}
            <div className="flex items-center space-x-4 px-6 py-4 bg-slate-950/70 border-b border-slate-800">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
                title="Back to Catalog"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2.5">
                {renderIcon(selectedTemplate.icon)}
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 font-sans">{selectedTemplate.name}</h4>
                  <p className="text-[10px] text-slate-500 font-sans">Active Sandbox Template</p>
                </div>
              </div>
            </div>

            {/* Main Interactive Dual Workspace Cards */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
              {/* Left Column: Draft Source Input Area */}
              <div className="flex flex-col border-r border-slate-800 p-5 bg-slate-900/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Source Content</span>
                  <span className="text-[10px] font-mono text-slate-500">{inputText.length} chars</span>
                </div>
                
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isGenerating}
                  placeholder={getPlaceholderText(selectedTemplate.id)}
                  className="flex-1 w-full p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono resize-none overflow-y-auto scrollbar-thin"
                />

                <button
                  onClick={handleProcessTemplate}
                  disabled={isGenerating || !inputText.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-100 rounded-xl font-sans font-medium text-xs mt-4 flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-indigo-600/10 disabled:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing instructions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Execute Workflow</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: AI Output Markdown Area */}
              <div className="flex flex-col p-5 bg-slate-950/40 relative">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800/40 z-10">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3 h-3 text-indigo-400 mr-1 animate-pulse" /> AI Synthesis response
                  </span>

                  {outputText && (
                    <button
                      onClick={handleCopy}
                      className="p-1 px-2 hover:bg-slate-800 border border-slate-800/60 rounded text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 transition-all"
                      title="Copy response"
                    >
                      {isCopied ? (
                        <>
                          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy output</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Markdown Viewer */}
                <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-900/30 rounded-xl whitespace-pre-wrap border border-slate-800/40 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {errorMsg && (
                    <div className="bg-rose-500/15 border border-rose-500/20 px-3.5 py-2.5 rounded-lg text-rose-200 text-xs mb-4">
                      {errorMsg}
                    </div>
                  )}

                  {!outputText && !isGenerating && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500">
                      <Sparkles className="w-8 h-8 opacity-25 mb-3 text-indigo-400" />
                      <p className="text-xs">Provide source draft contents & click workflow execute.</p>
                      <p className="text-[10px] opacity-75 mt-0.5">The structured analysis will stream live here.</p>
                    </div>
                  )}

                  <div className="markdown-body text-xs text-slate-200 leading-relaxed max-w-full space-y-3 font-sans prose prose-invert">
                    <Markdown>{outputText}</Markdown>
                  </div>

                  {isGenerating && !outputText && (
                    <div className="flex items-center space-x-2 py-4 justify-center text-slate-500 text-xs font-sans">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span className="animate-pulse">Gemini stream initiation...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
