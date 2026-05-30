import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Copy, 
  Download, 
  Paintbrush, 
  Loader2, 
  Code2, 
  Eye, 
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  Brush
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SvgArtwork } from "../types";

export default function ArtworkCanvas() {
  const [prompt, setPrompt] = useState("");
  const [svgCode, setSvgCode] = useState<string>(() => {
    return localStorage.getItem("assistant_rendered_svg") || `
<svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="skyGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#030712" />
    </radialGradient>
    <linearGradient id="planetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8" />
      <stop offset="50%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f472b6" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#c084fc" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  
  <!-- Outer deep viewport grid -->
  <rect width="100%" height="100%" fill="url(#skyGrad)" rx="16"/>
  
  <!-- Abstract Grid Lines -->
  <path d="M 0,250 L 500,250 M 250,0 Q 250,250 250,500" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="8 6"/>
  <circle cx="250" cy="250" r="180" fill="none" stroke="#334155" stroke-dasharray="5 5" stroke-width="1"/>
  
  <!-- Star Clusters -->
  <g fill="#ffffff">
    <circle cx="100" cy="120" r="1.5" opacity="0.6"/>
    <circle cx="420" cy="180" r="2" opacity="0.8"/>
    <circle cx="350" cy="80" r="1" opacity="0.5"/>
    <circle cx="150" cy="380" r="2.5" opacity="0.9"/>
    <circle cx="280" cy="420" r="1.5" opacity="0.4"/>
  </g>
  
  <!-- Background Rings -->
  <ellipse cx="250" cy="250" rx="200" ry="40" fill="none" stroke="url(#ringGrad)" stroke-width="6" transform="rotate(-15 250 250)" />
  
  <!-- Sphere Body -->
  <circle cx="250" cy="250" r="80" fill="url(#planetGrad)" filter="drop-shadow(0 10px 20px rgba(79, 70, 229, 0.4))" />
  
  <!-- Fore ring overlay to cut behind/front vector layer -->
  <path d="M 100,290 A 200 40 0 0 0 400,210" fill="none" stroke="url(#ringGrad)" stroke-width="6" transform="rotate(-15 250 250)" />
  
  <!-- Glowing core flares -->
  <circle cx="220" cy="220" r="15" fill="#e0e7ff" opacity="0.15" filter="blur(4px)" />
</svg>
    `;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [viewMode, setViewMode] = useState<"render" | "code">("render");
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("assistant_rendered_svg", svgCode);
  }, [svgCode]);

  const vectorArtPresets = [
    { name: "Saturn Ring Space", prompt: "A glowing futuristic hollow planet with concentric rings, deep starry backdrop design, neon cyan and magenta gradient colors" },
    { name: "Abstract Analytic Card", prompt: "A modern technological grid dashboard diagram with rising curvy waves charts, mesh gradients, floating digital node coordinates" },
    { name: "Geometric Golden Ratio", prompt: "Sacred geometry pattern with intricate intersecting rings and circles forming a flower of life, gold lines on black backdrop" },
    { name: "Tech Badge Logo", prompt: "A sleek minimalist tech company circular emblem featuring a shield containing lightning arrows, cyber theme coloring" },
  ];

  const handleZoom = (type: "in" | "out" | "reset") => {
    if (type === "in") setScale(prev => Math.min(prev + 0.15, 3));
    else if (type === "out") setScale(prev => Math.max(prev - 0.15, 0.5));
    else setScale(1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(svgCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([svgCode], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vector-artwork-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  };

  const handleGenerateArtwork = async (selectedPrompt?: string) => {
    const targetPrompt = selectedPrompt || prompt;
    if (!targetPrompt.trim() || isLoading) return;

    if (!selectedPrompt) {
      setPrompt("");
    } else {
      setPrompt(targetPrompt);
    }
    
    setIsLoading(true);
    setErrorMsg(null);

    const userPrompt = `Generate a fully valid standalone SVG vector graphic based on: "${targetPrompt}".
Strict rules:
1. Make it extremely visual, polished, highly complex, with modern geometric patterns, gradients, shadows, and detailed nodes.
2. Return ONLY the raw XML SVG file enclosed inside a markdown code block starting with \`\`\`xml or \`\`\`svg. Absolute NO other descriptions, text, markdown paragraphs or explanations before/after the block.
3. Configure dimensions as Width: 500, Height: 500, viewBox: "0 0 500 500" for neat framing.
4. Ensure standard shapes like <defs>, <linearGradient>, <rect>, <g>, <circle>, <path>, <ellipse> are used nicely to make it looks super clean.`;

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", text: userPrompt }],
          systemInstruction: "You are a master vector graphic designers. You talk only in raw, beautiful XML SVG markup inside backticks.",
          temperature: 0.8,
          enableSearchGrounding: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedResponse = "";
      let sseBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          sseBuffer += decoder.decode(value, { stream: !done });
          const lines = sseBuffer.split("\n\n");
          sseBuffer = lines.pop() || "";

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
                  accumulatedResponse += parsed.text;
                }
              } catch (e: any) {
                console.warn(e.message);
              }
            }
          }
        }
      }

      // Extract the SVG out of code block
      let processedSvg = accumulatedResponse;
      const codeBlockRegex = /```(?:xml|svg|html)?([\s\S]*?)```/;
      const match = accumulatedResponse.match(codeBlockRegex);
      if (match) {
        processedSvg = match[1].trim();
      } else {
        // Strip out starting and trailing markdown blocks manually if regex missed
        processedSvg = processedSvg.replace(/```xml/g, "").replace(/```svg/g, "").replace(/```/g, "").trim();
      }

      // Check if it starts with valid SVG
      if (!processedSvg.includes("<svg")) {
        throw new Error("Unable to parse valid vector tag from the model output. Click regenerate.");
      }

      setSvgCode(processedSvg);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to render vector art stream.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Visual Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
            <Brush className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 font-sans">
              Vector Design Studio
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">XML-based procedural graphic synthesis</p>
          </div>
        </div>

        {/* View Toggle button */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode("render")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all outline-none ${
              viewMode === "render"
                ? "bg-indigo-600 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Render</span>
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all outline-none ${
              viewMode === "code"
                ? "bg-indigo-600 text-slate-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Show XML Source</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Board splits into Studio controls + Art Render viewport */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
        {/* Left Control Panel / Presets (4 columns) */}
        <div className="lg:col-span-4 bg-slate-950/40 border-r border-slate-800/50 p-5 flex flex-col space-y-5 overflow-y-auto">
          {/* Section: Guidelines */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2">Instructions</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Prompt Gemini to write complex XML vector art. The rendering engine will draw the vector properties directly below.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Inspiration Catalog</h4>
            <div className="grid grid-cols-1 gap-2">
              {vectorArtPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerateArtwork(preset.prompt)}
                  disabled={isLoading}
                  className="px-3.5 py-2.5 text-left rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/40 hover:bg-slate-800/40 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                >
                  <p className="text-xs font-medium text-slate-200 group-hover:text-pink-400 font-sans">{preset.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate font-sans">{preset.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section Prompt Input */}
          <div className="space-y-2.5 mt-auto">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Custom Prompt</h4>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              rows={3}
              placeholder="Desribe a vector masterpiece (e.g. A neon blue space cybernetic helmet)..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/50 transition-all resize-none"
            />
            <button
              onClick={() => handleGenerateArtwork()}
              disabled={isLoading || !prompt.trim()}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-slate-100 rounded-xl font-sans font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-pink-500/10 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Vector...</span>
                </>
              ) : (
                <>
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Render Custom Graphic</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Sandbox Viewport (8 columns) */}
        <div id="vector_sandbox" className="lg:col-span-8 flex flex-col bg-slate-950/10 overflow-hidden relative">
          {/* Sandbox action bar */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/40 border-b border-slate-800/40 z-10 font-mono">
            {/* View adjustments */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleZoom("out")}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400 min-w-[40px] text-center font-mono select-none">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => handleZoom("in")}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom("reset")}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-all"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Code tools */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs flex items-center space-x-1.5 transition-all"
                title="Copy XML"
              >
                {isCopied ? (
                  <>
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy XML</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-xs flex items-center space-x-1.5 transition-all"
                title="Download file"
              >
                {isDownloaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    <span className="text-indigo-400">Saved</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download SVG</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sandbox Main View Space */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <div className="relative mb-4">
                  <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-pink-500 animate-spin" />
                  <Paintbrush className="w-5 h-5 text-pink-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-sm font-medium text-slate-200 font-sans">Compiling Vector Graphics...</p>
                <p className="text-xs text-slate-500 font-sans mt-1">Gemini is structuring and rendering instructions</p>
              </div>
            )}

            {errorMsg && (
              <div className="absolute top-4 left-4 right-4 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl flex items-start gap-2.5 z-20">
                <Eye className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <div className="text-xs text-rose-200">
                  <p className="font-semibold">Generator Warning</p>
                  <p className="opacity-85 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Content Display Switch */}
            {viewMode === "render" ? (
              <motion.div
                style={{ scale }}
                className="w-full max-w-[420px] aspect-square rounded-2xl bg-slate-950/80 shadow-2xl overflow-hidden relative flex items-center justify-center transition-transform origin-center"
              >
                <div
                  className="w-full h-full p-6 flex items-center justify-center pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: svgCode }}
                />
              </motion.div>
            ) : (
              <div className="w-full h-full max-h-[460px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 select-all overflow-y-auto scrollbar-thin">
                <pre>{svgCode}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
