import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // CORS headers middleware
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  // Serve 'public' assets directly to guarantee robust media streaming / Range requests
  app.use(express.static(path.join(process.cwd(), "public")));

  // 1. API: Custom AI background image generator powered by Gemini 2.5 Flash Image Model!
  app.post("/api/background/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not defined. Using curated fallback assets.");
        const fallbackUrl = getCuratedFallback(prompt);
        return res.json({
          url: fallbackUrl,
          isAiGenerated: false,
          isFallback: true,
          credit: "Aesthetic Source (No API Key)"
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Enhance prompt to match lofi/study background aesthetics (cozy detail, widescreen, cinematic lighting, digital art style)
      const enhancedPrompt = `${prompt}, cozy lo-fi style digital art workspace ambient wallpaper, relaxing focus atmosphere, soft warm interior lighting, aesthetic landscape, highly detailed 16:9 presentation`;

      console.log(`Instructing gemini-2.5-flash-image to generate backdrop for: "${enhancedPrompt}"`);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Image) {
        throw new Error("No inline image data found in candidate parts.");
      }

      return res.json({
        url: `data:image/png;base64,${base64Image}`,
        isAiGenerated: true,
        credit: "Gemini Realtime AI Visualizer"
      });

    } catch (err: any) {
      console.error("Gemini Background Visualizer Error:", err);
      const fallbackUrl = getCuratedFallback(req.body?.prompt || "");
      return res.json({
        url: fallbackUrl,
        isAiGenerated: false,
        error: err.message || String(err),
        credit: "Aesthetic backup visual"
      });
    }
  });

  // Curated fallbacks matching focus themes
  function getCuratedFallback(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes("cafe") || p.includes("coffee") || p.includes("latte") || p.includes("espresso") || p.includes("brewing")) {
      return "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&q=80";
    }
    if (p.includes("rain") || p.includes("glass") || p.includes("drop") || p.includes("cabin") || p.includes("storm")) {
      return "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?auto=format&fit=crop&w=1920&q=80";
    }
    if (p.includes("tokyo") || p.includes("cyber") || p.includes("neon") || p.includes("night") || p.includes("street")) {
      return "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=80";
    }
    if (p.includes("stream") || p.includes("forest") || p.includes("wood") || p.includes("nature") || p.includes("river") || p.includes("waterfall")) {
      return "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80";
    }
    if (p.includes("space") || p.includes("nebula") || p.includes("star") || p.includes("cosmic") || p.includes("galaxy") || p.includes("astronaut")) {
      return "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1920&q=80";
    }
    if (p.includes("laptop") || p.includes("desk") || p.includes("study") || p.includes("write") || p.includes("library") || p.includes("classroom")) {
      return "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=1920&q=80";
    }
    return "https://images.unsplash.com/photo-1488998427799-e3362cec87c3?auto=format&fit=crop&w=1920&q=80";
  }

  // 2. Client files configuration
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
    console.log(`Server successfully booted on port ${PORT}`);
  });
}

startServer();
