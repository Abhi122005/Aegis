# Project Aegis 🛡️

Aegis is an autonomous edge AI threat detection and mitigation platform. It constantly correlates local server logs to catch threats, securely delegates mitigation strategies to a local **Ollama** LLM (zero-data-leak), and reports high-level metrics to the administration team through **Google Gemini**.

This project consists of two core components:
1. **Frontend (Next.js)**: An interactive threat-dashboard to visualize live attacks.
2. **Backend (FastAPI)**: Routes logs, communicates with LLMs, and stores history via Firebase.

---

## 🚀 Priority Prerequisites

Before jumping into the codebase, you need to set up the necessary tools on your machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Python 3.9+](https://www.python.org/downloads/)
- [Ollama](https://ollama.ai/download) installed globally to run local AI models.

Once Ollama is installed, pull and start the Qwen model required by Aegis:
```bash
ollama run qwen2.5:3b
```
*(Leave Ollama running in the background while operating Aegis)*

---

## 🛠️ Step 1: Backend Setup (FastAPI & Python)

The intelligent routing core lives in the `ckned` folder.

1. **Navigate to the backend directory:**
   ```bash
   cd ckned
   ```

2. **Set up a Virtual Environment (Recommended):**
   ```bash
   python -m venv venv
   # Activate it (Windows):
   .\venv\Scripts\activate
   # Activate it (Mac/Linux):
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Constraints:**
   - In the `ckned` folder, verify `firebase-credentials.json` is properly configured for your Firestore connection.
   - You must have a `GEMINI_API_KEY` set as an environment variable (or within an `.env` file) for the CISO reporting feature to execute correctly.

5. **Start the API Server:**
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   *The backend should now rapidly serve traffic at http://127.0.0.1:8000*

---

## ⚙️ Step 2: Frontend Setup (Next.js Dashboard)

Open a new terminal window to configure the React/Next.js dashboard.

1. **Navigate to the frontend directory:**
   ```bash
   # From the root of the project:
   cd Aegis
   ```

2. **Install Node Packages:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Ensure a `.env.local` file is created at the root level specifying the API gateway if different than default:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

4. **Boot the Dashboard Server:**
   ```bash
   npm run dev
   ```

5. **Access the Interface:**
   Open [http://localhost:3000](http://localhost:3000) in your native browser. 
   
   If both servers and Ollama are properly running, the platform should register as `SYSTEM ONLINE` and you should be capable of hitting the `Simulate Attack` functionality!

---

## ☁️ Deployment Notes

If you are planning to containerize or deploy this (e.g., Google Cloud Run):
Next.js will statically build or run standalone out of the box. 
**However**, if your backend transitions to standard cloud computing, it will lose access to `localhost:11434` (Ollama). You must use an active secure proxy like Ngrok or Cloudflare Tunnels mapped to your desktop in order to resolve LLM calls remotely.

---

## 🔒 Security: Removing & Hiding API Keys

If you have hardcoded your `GEMINI_API_KEY` or accidentally added `firebase-credentials.json` to your `git` tracking, follow these steps to secure your project before pushing to GitHub:

### 1. Remove Tracked Secret Files from Git (Without Deleting Locally)
If you already ran `git add .` or committed the files, you need to untrack them:
```bash
# Untrack the Firebase credentials file
git rm --cached ckned/firebase-credentials.json

# If you hardcoded keys in a file (like gemini_client.py), change them back to os.getenv("...") 
# and create a .env file locally. Make sure .env is ignored.
```

### 2. Move Keys to `.env`
Ensure your backend reads secrets from an environment file rather than the source code itself:
1. Create a `ckned/.env` file.
2. Add your keys:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
3. Your Git ignores `.env` by default, so it stays safe on your local machine.

### 3. What if I already pushed an API Key to GitHub?
- **IMMEDIATE ACTION**: Go to [Google AI Studio / Google Cloud Console] and **DELETE/REVOKE** the compromised API key. 
- A pushed key is instantly scrapped by bots. Deleting it from Git history is hard and error-prone; revoking the key from the provider is the only 100% safe method. Generate a new key and put it securely in your `.env` file.
