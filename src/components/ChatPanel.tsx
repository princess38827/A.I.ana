import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Search, 
  Globe, 
  Sparkles, 
  AlertCircle, 
  ExternalLink,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { ChatMessage, AssistantSettings } from "../types";

interface ChatPanelProps {
  settings: AssistantSettings;
  systemPrompt: string;
}

export default function ChatPanel({ settings, systemPrompt }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("assistant_chat_history");
    return saved ? JSON.parse(saved) : [
      {
        id: "welcome",
        role: "model",
        text: "Hello! I am your AI assistant. How can I help you in your workspace today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });
  
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("assistant_chat_history", JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear this entire chat history?")) {
      setMessages([
        {
          id: "welcome",
          role: "model",
          text: "History cleared. Workspace initialized. Ask me anything!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setErrorMsg(null);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userText = input.trim();
    setInput("");
    setErrorMsg(null);
    setIsGenerating(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const streamMsgId = crypto.randomUUID();
    const streamMsgPlaceholder: ChatMessage = {
      id: streamMsgId,
      role: "model",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, streamMsgPlaceholder]);

    // Format all previous messages and the current input for the server API content parameter
    const allMessagesToSend = [
      ...messages.filter(m => m.id !== "welcome").map(m => ({
        role: m.role,
        text: m.text
      })),
      { role: "user", text: userText }
    ];

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessagesToSend,
          systemInstruction: systemPrompt,
          temperature: settings.temperature,
          enableSearchGrounding: settings.enableSearchGrounding,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response streaming body found");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let streamedText = "";
      let groundingSources: Array<{ title?: string; uri?: string }> = [];
      let streamBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          streamBuffer += decoder.decode(value, { stream: !done });
          const lines = streamBuffer.split("\n\n");
          streamBuffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const rawData = line.slice(6).trim();
              if (rawData === "[DONE]") {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(rawData);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.text) {
                  streamedText += parsed.text;
                }

                if (parsed.groundingMetadata?.groundingChunks) {
                  const chunks = parsed.groundingMetadata.groundingChunks;
                  const sources = chunks
                    .map((chunk: any) => {
                      if (chunk.web) {
                        return {
                          title: chunk.web.title || chunk.web.uri,
                          uri: chunk.web.uri,
                        };
                      }
                      return null;
                    })
                    .filter(Boolean);

                  if (sources.length > 0) {
                    groundingSources = [...groundingSources, ...sources];
                    // Keep unique entries
                    groundingSources = Array.from(
                      new Map(groundingSources.map(item => [item.uri, item])).values()
                    );
                  }
                }

                // Incremental update of the model state message
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamMsgId
                      ? {
                          ...m,
                          text: streamedText,
                          groundingChunks: groundingSources.length > 0 ? groundingSources : undefined,
                        }
                      : m
                  )
                );
              } catch (e: any) {
                console.error("Data parse alert:", e.message);
              }
            }
          }
        }
      }

      // Mark streaming completion
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMsgId ? { ...m, isStreaming: false } : m
        )
      );

    } catch (err: any) {
      console.error("AI Generation issue:", err);
      setErrorMsg(err.message || "Failed to communicate with the workspace server.");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamMsgId
            ? {
                ...m,
                text: "⚠️ **An error occurred while communicating with Gemini.** Please ensure the API is fully configured. " + (err.message ? `\n\n*Details: ${err.message}*` : ""),
                isStreaming: false,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="chat_panel_container" className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Panel */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/15 rounded-lg border border-indigo-500/20">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 font-sans">
              Conversational Engine
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">Powered by gemini-3.5-flash</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Active Settings Badges */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/50 text-[11px] font-mono text-slate-300">
            <Globe className={`w-3.5 h-3.5 ${settings.enableSearchGrounding ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <span>Search: {settings.enableSearchGrounding ? "ON" : "OFF"}</span>
          </div>

          <button
            onClick={handleClearHistory}
            disabled={messages.length <= 1 || isGenerating}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
            title="Wipe Session History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Messages Room */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.15) }}
              className={`flex items-start ${isUser ? "justify-end" : "justify-start"} gap-3`}
            >
              {/* Bot Icon avatar */}
              {!isUser && (
                <div className={`p-2 rounded-xl mt-1 shrink-0 ${msg.isError ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"}`}>
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Bubble */}
              <div className="flex flex-col max-w-[85%] space-y-1.5">
                <div
                  className={`px-4 py-3 rounded-2xl border text-sm leading-relaxed font-sans ${
                    isUser
                      ? "bg-indigo-600 border-indigo-500 text-slate-100 rounded-tr-none shadow-lg shadow-indigo-600/10"
                      : msg.isError
                      ? "bg-rose-950/20 border-rose-500/30 text-rose-200 rounded-tl-none"
                      : "bg-slate-950/50 border-slate-800/80 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {isUser ? (
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                  ) : (
                    <div className="markdown-body space-y-2 prose prose-invert prose-xs max-w-full">
                      {msg.text ? (
                        <Markdown>{msg.text}</Markdown>
                      ) : (
                        <span className="inline-flex space-x-1.5 items-center py-0.5 text-slate-500">
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-225"></span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Grounding Attribution List */}
                {!isUser && msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center mr-1">
                      <Search className="w-3 h-3 mr-1 text-emerald-400" /> Grounded Search Sources:
                    </span>
                    {msg.groundingChunks.map((chunk, cIdx) => (
                      <a
                        key={cIdx}
                        href={chunk.uri}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all font-mono"
                      >
                        <span className="max-w-[150px] truncate">{chunk.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Time indicators */}
                <span className={`text-[10px] font-mono text-slate-500 px-1 ${isUser ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </span>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="p-2 rounded-xl mt-1 bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Warning/Grounding Info banner if active */}
      {settings.enableSearchGrounding && (
        <div className="px-6 py-1.5 bg-emerald-500/5 border-t border-b border-emerald-500/10 flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Real-time web verification grounding active for query citations.</span>
        </div>
      )}

      {/* Input Tray */}
      <div className="px-6 py-4 bg-slate-950/65 border-t border-slate-800/60">
        <form onSubmit={handleSend} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isGenerating}
            placeholder={
              isGenerating
                ? "Formulating responsive analysis..."
                : settings.enableSearchGrounding
                ? "Ask a question (Web searching active)..."
                : "Ask anything..."
            }
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-ellipsis disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-100 rounded-xl transition-all shadow-lg flex items-center justify-center font-sans font-medium text-sm gap-2 shrink-0 disabled:shadow-none"
          >
            <span>Analyze</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* API Config safe guard warning */}
      <p className="px-6 pb-3 text-center text-[10px] font-sans text-slate-500 bg-slate-950/65">
        All API requests proxy securely server-side keeping your workspace environment private.
      </p>
    </div>
  );
}
