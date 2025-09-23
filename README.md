# 📚 Learning Digest

Automated **daily learning notes** for full-stack engineering — powered by Gemini/Groq LLMs, saved to **Notion**, and delivered via **email (Resend)**.
The project runs automatically every day with **GitHub Actions**.

---

## 🚀 Features
- Picks one modern web development concept per day:
  - JavaScript / TypeScript fundamentals
  - React / Next.js features
  - Node.js backend techniques
  - API design and integration
  - DevOps (CI/CD, GitHub Actions, Docker, Kubernetes)
  - Cloud services (AWS, Azure, GCP)
  - Software architecture (monolith, microservices, event-driven, serverless)
  - Design patterns (Factory, Observer, Singleton, etc.)
  - Modern front-end architecture (atomic design, state management, hooks)
  - New & emerging features (Edge functions, Bun, Vite, server components)
- Digest format:
  - **TL;DR (1–2 sentences)** – quick takeaway
  - **Explanation (3–6 sentences)** – practical understanding
  - **Code Example** – short snippet for real-world usage
- Saves the note into your **Notion database**.
- Sends the note to your **email inbox**.
- Logs the **TL;DR summary** directly in GitHub Actions.

---

## 📦 Setup

### 1. Clone the Repo
```bash
git clone https://github.com/<your-username>/learning-digest.git
cd learning-digest
2. Install Dependencies
bash
Copy code
npm install
3. Create .env
env
Copy code
GOOGLE_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
NOTION_TOKEN=your-notion-token
NOTION_DB_ID=your-notion-db-id
RESEND_API_KEY=your-resend-key
EMAIL_TO=your@email.com
4. Run Locally
bash
Copy code
node scripts/learning.js
5. GitHub Actions
Secrets must be added in your repo → Settings > Secrets and variables > Actions.

Workflow file: .github/workflows/learning.yml.

Runs daily (or manually from the Actions tab).
# learning-digest
# learning-digest
