import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Streaming Chat & Text Generations
app.post("/api/chat/stream", async (req, res) => {
  const { messages, systemInstruction, temperature, enableSearchGrounding } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // Format messages for the standard @google/genai format
  const formattedContents = messages.map((msg: any) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  // Set up Server-Sent Events headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const config: any = {
      systemInstruction: systemInstruction || "You are a professional and versatile AI assistant.",
      temperature: typeof temperature === "number" ? temperature : 0.7,
    };

    if (enableSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config,
    });

    for await (const chunk of responseStream) {
      const data = {
        text: chunk.text || "",
        groundingMetadata: chunk.candidates?.[0]?.groundingMetadata || null,
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Gemini stream error:", err);
    const errData = {
      error: err.message || "An exception occurred with Gemini API",
    };
    res.write(`data: ${JSON.stringify(errData)}\n\n`);
    res.end();
  }
});

// Start server containing Vite middleware
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

start();
