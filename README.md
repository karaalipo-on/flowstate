# FlowState 🪐 (Focus Workspace)

An immersive virtual focus environment designed to elevate productivity. FlowState blends widescreen aesthetic backgrounds, an organic procedural audio synthesizer, Pomodoro tracking, a distraction-free music player, and local scratchpad utilities into a single aesthetic control center.

---

## ✦ What It Does (Core Features)

1. **Aesthetic Focus Ambient Player**
   - High-definition widescreen backdrops dynamically adjust the atmosphere based on your mood (Warm, Cozy, Summer, Fall, Nightly, and Glass themes available).
2. **AI-Powered Aesthetic Backdrop Generator**
   - Incorporates a secure serverless AI route running the high-performance **Gemini 2.5 Flash Image Model**!
   - Enter any customizable focus prompt (e.g., *"rainy retro-cyberpunk tea shop"* or *"isolated starry cabin in the woods"*) inside the **Scene Switcher** to render custom landscape wallpapers instantly.
3. **Web Audio Synthesizer**
   - Features custom-engineered client-side sound generation. Runs real-time procedural audio (rain ripples, organic coffee shop chatter, woodfire crackles, rustling leaves) natively without eating up internet bandwidth.
4. **Distraction-Free Music Player Widget**
   - Standard Spotify embed block styled and sized to a highly compact **160px** distraction-free banner.
5. **Interactive Pomodoro Module**
   - Interval alerts, customized stage lengths, trackable counts, and real-time alarms.
6. **Zen Scratch Pad & Checklists**
   - Dedicated notepad with instant character counts and size adjustments to capture fleeting thoughts alongside quick tasks list checklists.

---

## 📌 Important Local-Storage Notes

FlowState utilizes the client's web browser cache (`localStorage`) as its primary storage mechanism for a privacy-first, zero-friction developer setup.

* **100% Privacy & Device Boundaries**: Your scratchpad writings, daily checklists, active ambient volume balances, theme selections, and custom generated background history are stored exclusively inside your own browser window. Absolutely zero notes or keystrokes are uploaded or tracked.
* **No Database Required**: You can test, upload, and deploy FlowState around the world immediately without setting up databases (like Firebase, PostgreSQL, or SQL Cloud databases).
* **Limitations (Cache Lifespan)**: 
  - Clearing your browser cache/cookies, using privacy cleaners, or running FlowState in an Incognito / Private browsing window will reset your workspaces back to default values.
  - Changes made on one device (e.g., your laptop) do *not* sync to other devices (e.g., your mobile phone) by default due to browser sandbox boundaries.

---

## 🚀 How to Deploy to Vercel

FlowState is fully optimized for continuous deployment through GitHub to **Vercel**!

### Step 1: Upload to GitHub
1. Create a new repository on your GitHub account.
2. Initialize, commit, and push your repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of FlowState Workspace"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 2: Import to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com) and click **Add New** > **Project**.
2. Connect your GitHub account and import the repository.
3. Vercel will automatically recognize the project structure. Under the **Framework Preset**, select **Vite** or **Create React App** (or let it auto-detect).
4. Click **Deploy**.

### Step 3: Configure Environment Variables (Required for AI Scene Generator)
To make sure your custom AI scenic backdrop generator works correctly on your deployed link:
1. In the Vercel dashboard, navigate to your project **Settings** > **Environment Variables**.
2. Add the following key:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `[Your Gemini API Key]` (obtainable for free from [Google AI Studio](https://aistudio.google.com))
3. Redeploy your project or trigger a new git push. The serverless function under `/api/background/generate` will start serving customizable AI-generated art wallpaper instantly!

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (Vite, TypeScript, Tailwind CSS, Framer/Motion, Lucide Icons)
- **Procedural Audio**: Web Audio Synthesizer API (dynamic oscillators and filtering)
- **Backend Servicing**: Express-ready Serverless APIs handled under `/api/` (fully standard for Vercel redirects specified in `vercel.json` rewrite directives)
- **AI Integration**: Official Google `@google/genai` TypeScript SDK
