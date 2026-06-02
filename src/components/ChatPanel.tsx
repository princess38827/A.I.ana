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
  Lock,
  Plus,
  Pencil,
  Check,
  X,
  History,
  MessageSquare,
  Download,
  FileText,
  FileJson,
  Mic,
  MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { ChatMessage, AssistantSettings, ChatSession } from "../types";

interface ChatPanelProps {
  settings: AssistantSettings;
  systemPrompt: string;
}

export default function ChatPanel({ settings, systemPrompt }: ChatPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("assistant_chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved sessions", e);
      }
    }

    // Try migration from older code
    const oldHistory = localStorage.getItem("assistant_chat_history");
    let defaultMessages: ChatMessage[] = [];
    if (oldHistory) {
      try {
        const parsed = JSON.parse(oldHistory);
        if (Array.isArray(parsed)) {
          defaultMessages = parsed;
        }
      } catch {}
    }

    if (defaultMessages.length === 0) {
      defaultMessages = [
        {
          id: "welcome",
          role: "model",
          text: "Hello! I am your AI assistant. How can I help you in your workspace today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ];
    }

    const initialSession: ChatSession = {
      id: "session-default",
      title: "Initial Conversation",
      messages: defaultMessages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedActive = localStorage.getItem("assistant_active_session_id");
    if (savedActive) return savedActive;
    return sessions[0]?.id || "session-default";
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const active = sessions.find((s) => s.id === activeSessionId) || sessions[0];
    return active ? active.messages : [];
  });
  
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleTemp, setEditingTitleTemp] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Save sessions to localStorage when they change
  useEffect(() => {
    localStorage.setItem("assistant_chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Save activeSessionId when it changes
  useEffect(() => {
    localStorage.setItem("assistant_active_session_id", activeSessionId);
  }, [activeSessionId]);

  // Sync messages update back into sessions state
  useEffect(() => {
    setSessions((prev) => {
      const active = prev.find((s) => s.id === activeSessionId);
      if (!active) return prev;

      const firstUserText = messages.find((m) => m.role === "user")?.text;
      let targetTitle = active.title;
      
      // Auto rename the title if it remains a default placeholder
      if (
        (targetTitle === "New Chat" ||
          targetTitle === "Initial Conversation" ||
          targetTitle === "Untitled Chat" ||
          targetTitle === "Initial Chat History") &&
        firstUserText
      ) {
        targetTitle =
          firstUserText.length > 25
            ? firstUserText.slice(0, 24) + "..."
            : firstUserText;
      }

      const hasChanged =
        active.messages !== messages || active.title !== targetTitle;

      if (!hasChanged) return prev;

      return prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages,
            title: targetTitle,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
    });
    
    scrollToBottom();
  }, [messages, activeSessionId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const createNewSession = (title = "Untitled Chat"): ChatSession => {
    return {
      id: crypto.randomUUID(),
      title,
      messages: [
        {
          id: "welcome",
          role: "model",
          text: "Hello! I am your AI assistant. How can I help you in your workspace today?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleCreateNewSession = () => {
    const newSess = createNewSession("New Chat");
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    setMessages(newSess.messages);
    setErrorMsg(null);
  };

  const handleSwitchSession = (sessionId: string) => {
    const targetSession = sessions.find(s => s.id === sessionId);
    if (targetSession) {
      setActiveSessionId(sessionId);
      setMessages(targetSession.messages);
      setErrorMsg(null);
    }
  };

  const handleDeleteSession = (sessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat session? This action cannot be undone.")) {
      const remaining = sessions.filter(s => s.id !== sessId);
      if (remaining.length === 0) {
        const freshSess = createNewSession("New Chat");
        setSessions([freshSess]);
        setActiveSessionId(freshSess.id);
        setMessages(freshSess.messages);
      } else {
        setSessions(remaining);
        if (activeSessionId === sessId) {
          const nextActive = remaining[0];
          setActiveSessionId(nextActive.id);
          setMessages(nextActive.messages);
        }
      }
    }
  };

  const handleStartRename = (sessId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(sessId);
    setEditingTitleTemp(currentTitle);
  };

  const handleSaveRename = (sessId: string) => {
    if (editingTitleTemp.trim()) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessId) {
            return {
              ...s,
              title: editingTitleTemp.trim(),
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        })
      );
    }
    setEditingSessionId(null);
    setEditingTitleTemp("");
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingTitleTemp("");
  };

  const toggleListening = () => {
    setSpeechError(null);
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput((prev) => {
              const trimmed = prev.trim();
              return trimmed ? `${trimmed} ${transcript}` : transcript;
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === "not-allowed") {
            setSpeechError("Microphone permission denied. Please allow microphone access.");
          } else {
            setSpeechError(`Speech error: ${event.error}`);
          }
          setIsListening(false);
          setTimeout(() => setSpeechError(null), 5000);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error("Failed to start speech recognition", err);
        setSpeechError("Failed to start speech recognition.");
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 5000);
      }
    }
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
    if (!activeSession) return;

    let md = `# Chat Session: ${activeSession.title}\n`;
    md += `*Exported on: ${new Date().toLocaleString()}*\n\n`;
    md += `*Session ID: ${activeSession.id}*\n`;
    md += `*Created: ${new Date(activeSession.createdAt).toLocaleString()}*\n`;
    md += `*Updated: ${new Date(activeSession.updatedAt).toLocaleString()}*\n\n`;
    md += `---\n\n`;

    activeSession.messages.forEach((msg) => {
      const roleName = msg.role === "user" ? "🧑 User" : "🤖 Assistant";
      md += `### ${roleName}\n`;
      md += `**Time**: ${msg.timestamp}\n\n`;
      md += `${msg.text}\n\n`;

      if (msg.groundingChunks && msg.groundingChunks.length > 0) {
        md += `#### Grounded Sources:\n`;
        msg.groundingChunks.forEach((chunk) => {
          md += `- [${chunk.title || 'Source'}](${chunk.uri})\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const safeTitle = activeSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadFile(md, `${safeTitle}_chat_export.md`, "text/markdown;charset=utf-8;");
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
    if (!activeSession) return;

    const dataStr = JSON.stringify(activeSession, null, 2);
    const safeTitle = activeSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadFile(dataStr, `${safeTitle}_chat_export.json`, "application/json;charset=utf-8;");
    setShowExportMenu(false);
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
    <div id="chat_panel_container" className="flex flex-row h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Sessions/History Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.22 }}
            className="h-full bg-slate-950/95 border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden relative z-10 font-sans"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-900/60 bg-slate-950 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 animate-pulse" />
                Saved Chats
              </span>
              <button
                onClick={handleCreateNewSession}
                className="p-1 px-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-400 rounded-lg transition-all flex items-center gap-1 text-[11px] font-sans font-medium hover:scale-[1.02] active:scale-95"
                title="Start a new distinct conversation"
              >
                <Plus className="w-3 h-3" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Sessions Scrollable List */}
            <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-xs font-sans">
                  No active session. Click "New Chat" to begin.
                </div>
              ) : (
                sessions.map((sess) => {
                  const isActive = sess.id === activeSessionId;
                  const isEditing = sess.id === editingSessionId;
                  const totalMsgs = sess.messages ? sess.messages.length : 0;
                  const userMsgsCount = sess.messages ? sess.messages.filter(m => m.id !== "welcome").length : 0;

                  return (
                    <div
                      key={sess.id}
                      onClick={() => !isEditing && handleSwitchSession(sess.id)}
                      className={`group relative flex flex-col p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isActive
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-100 shadow-sm"
                          : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center space-x-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitleTemp}
                            onChange={(e) => setEditingTitleTemp(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(sess.id);
                              if (e.key === "Escape") handleCancelRename();
                            }}
                            className="flex-1 min-w-0 bg-slate-950 border border-slate-700/80 text-xs px-2 py-1 rounded text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(sess.id)}
                            className="p-1 hover:bg-indigo-500/10 text-emerald-400 rounded"
                            title="Confirm"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 hover:bg-indigo-500/10 text-rose-400 rounded"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between w-full gap-2 relative pr-12">
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold truncate leading-tight font-sans">
                                {sess.title || "Untitled Conversation"}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {userMsgsCount > 0 ? `${userMsgsCount} interaction${userMsgsCount > 1 ? "s" : ""}` : "No queries yet"}
                              </p>
                            </div>
                          </div>

                          {/* Hover action tray */}
                          <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-0.5 bg-slate-950/70 p-0.5 rounded border border-slate-800/40 backdrop-blur" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleStartRename(sess.id, sess.title, e)}
                              className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-900 rounded transition-colors"
                              title="Rename Chat session"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSession(sess.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                              title="Delete Chat session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-slate-900 bg-slate-950 text-[10px] text-slate-500 text-center font-mono select-none uppercase tracking-wider shrink-0">
              Offline Storage Synced
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workstation Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
        {/* Header Panel */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800/60 backdrop-blur-md">
          <div className="flex items-center space-x-3.5">
            {/* Collapse/Expand Sidebar Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl border transition-all ${
                isSidebarOpen
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title={isSidebarOpen ? "Collapse sidebar history" : "Expand sidebar history"}
            >
              <History className="w-4 h-4" />
            </button>

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

            {/* Download Session Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 rounded-xl transition-all"
                title="Download Session Log"
              >
                <Download className="w-4 h-4" />
              </button>

              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-30">
                    <div className="px-3 py-1.5 border-b border-slate-900/60 mb-1">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Export Session
                      </p>
                    </div>
                    <button
                      onClick={handleExportMarkdown}
                      className="w-full text-left px-3 py-2 hover:bg-slate-900 text-slate-300 hover:text-indigo-400 text-xs flex items-center gap-2.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export as Markdown (.md)</span>
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-3 py-2 hover:bg-slate-900 text-slate-300 hover:text-emerald-400 text-xs flex items-center gap-2.5 transition-colors"
                    >
                      <FileJson className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export as JSON (.json)</span>
                    </button>
                  </div>
                </>
              )}
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
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 font-sans">
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
          <div className="px-6 py-1.5 bg-emerald-500/5 border-t border-b border-emerald-500/10 flex items-center space-x-2 text-[11px] font-mono text-slate-400 shadow-inner">
            <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Real-time web verification grounding active for query citations.</span>
          </div>
        )}

        {/* Input Tray */}
        <div className="px-6 py-4 bg-slate-950/65 border-t border-slate-800/60 h-auto">
          {speechError && (
            <div className="mb-3 px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span>{speechError}</span>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
              placeholder={
                isListening
                  ? "Listening... Speak now!"
                  : isGenerating
                  ? "Formulating responsive analysis..."
                  : settings.enableSearchGrounding
                  ? "Ask a question (Web searching active)..."
                  : "Ask anything..."
              }
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-ellipsis disabled:opacity-50"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                isListening
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse shadow-lg shadow-rose-500/10 scale-105"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 hover:bg-slate-800"
              }`}
              title={isListening ? "Stop voice listening" : "Transcribe voice speech to text"}
            >
              {isListening ? (
                <Mic className="w-4 h-4 text-rose-400" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
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
    </div>
  );
}
