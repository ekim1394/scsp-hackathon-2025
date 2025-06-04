# 🛸 OpenUAV

**OpenUAV** is a Reddit-style, AI-enhanced platform built to help UAV operators, engineers, and analysts collaborate on drone tactics, share 3D models, and learn from field-tested experience — all in one place.

> 🏆 Built for the SCSP Hackathon 2025 in under 48 hours.

---

## 🚀 Features

- 🧵 **Threaded Posts & Comments** – Discuss tactics, maneuvers, and field hacks
- 📎 **Rich Media Support** – Upload images, videos, PDFs, and `.glb` 3D models
- 🎮 **3D Viewer** – Preview drone models directly in the browser using Three.js
- 🧠 **AI Agents** – Summarize articles, digest threads, and enhance 3D model visualization
- 🛡️ **User Management** – Secure login, role-based moderation, and protected routes

---

## 🧠 AI Capabilities

| Agent                   | Function                                        |
| ----------------------- | ----------------------------------------------- |
| 📄 **Summarizer Agent** | Auto-summarizes linked articles and documents   |
| 🧱 **Render Agent**     | Enhances `.glb` models for realistic preview    |
| 🧠 **Thread Digestor**  | Condenses discussions into mission-ready briefs |

---

## 🛠️ Tech Stack

| Layer         | Technology                      |
| ------------- | ------------------------------- |
| **Frontend**  | React + TailwindCSS + ShadCN UI |
| **Backend**   | FastAPI + SQLModel              |
| **Database**  | PostgreSQL                      |
| **3D Viewer** | Three.js (`.glb` model support) |
| **Auth**      | JWT-based authentication        |
| **AI API**    | OpenAI (GPT-4 / vision)         |

---

## 🧪 Demo

- 🔗 Live Demo: _Coming Soon_
- 📽️ Presentation: [`OpenUAV_Hackathon_Pitch_Styled.pptx`](./OpenUAV_Hackathon_Pitch_Styled.pptx)

---

## 📂 Project Structure

```bash
.
├── backend/               # FastAPI backend
│   ├── models/            # SQLModel definitions
│   ├── auth.py            # Auth logic
│   └── main.py            # FastAPI app entry
├── frontend/              # React + TanStack Router + ShadCN UI
│   ├── components/        # Reusable UI
│   ├── routes/            # Protected and public pages
│   └── utils/             # Auth helpers
├── public/                # Static assets (e.g. logo)
├── README.md
└── OpenUAV_Hackathon_Pitch_Styled.pptx
```

---

## 🧑‍💻 Getting Started

### DB

```bash
docker compose up -d
```

### Backend

```bash
cd backend
pip install uv
uv sync
fastapi run app/main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🤝 Team & Acknowledgments

Built by Eugene Kim.

Special thanks to:

- [OpenAI](https://openai.com/) for API access
- [SCSP Hackathon 2025](https://scsp.ai) for the opportunity
- [CraniumAI] for supporting my ventures
