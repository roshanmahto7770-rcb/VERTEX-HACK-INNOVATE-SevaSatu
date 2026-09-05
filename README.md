# SevaSetu (सेवासेतु)
### AI-Powered Citizen Grievance Redressal, Triage & Clustering System

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange?style=flat&logo=google)](https://deepmind.google/technologies/gemini/)
[![PostGIS](https://img.shields.io/badge/Spatial-PostGIS%20%2B%20PostgreSQL-336791?style=flat&logo=postgresql)](https://postgis.net/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SevaSetu** is a next-generation civic grievance redressal and municipal triage management platform built for modern e-governance. It ingests citizen complaints across multimodal channels (text, mobile photos, voice audio notes), applies **Google Gemini 2.5 Flash** with rigid JSON schema validation for automated classification and severity scoring, and features an **AI-assisted Spatial/Temporal/Semantic Clustering Engine** with Human-in-the-Loop verification.

---

## 🌟 Key Capabilities

### 1. Multimodal AI Triage (Google Gemini 2.5 Flash)
- Zero-shot classification into municipal departments: **Public Works Department (PWD)**, **Drainage & Sewerage Board**, **Electricity & Street Lighting**, **Solid Waste Management**, and **Water Supply**.
- Rigorous structured JSON schema enforcement (`Type.OBJECT`) eliminating JSON parsing anomalies.
- Calculates clinical **Severity Rating (1–10)**, urgent SOP recommendations, and automatic regional language translation (Hindi, Marathi, Tamil, English).

### 2. Spatial, Temporal & Semantic Duplicate Clustering Engine
- **PostGIS Geodesic Radius Check**: Identifies grievances submitted within $\le 50\text{ meters}$.
- **Rolling Temporal Window**: Evaluates candidate tickets within the last $48\text{ to }72\text{ hours}$.
- **Gemini Semantic Similarity Deep-Match**: Compares visual markers and problem descriptions. If confidence match $\ge 80\%$, automatically links the submission to a **Master Complaint Ticket**.

### 3. Human-in-the-Loop (HITL) Officer Verification & Cascading Sync
- AI proposes clusters, but Department Officers verify or unlink false positives before dispatch.
- **Cascading State Synchronization**: Updating the Master Ticket status (e.g. *In Progress* $\to$ *Resolved*) automatically updates all linked child complaints and appends immutable audit logs.

### 4. Public Citizen Transparency & Real-Time Tracking
- Public ticket search (`#C-1248`) allows citizens to monitor field progress, assigned engineers, and official resolution comments.

---

## 📸 System Architecture & Visual Views

### Citizen Portal Landing Page (`/`)
- Brand Header with navigation, portal toggle, and quick actions.
- 3D realistic phone mockup with live audio waveform and floating **AI Analysis Card**.
- 4-Step **How It Works** timeline and **Impact at a Glance** analytics badges (25K+ Resolved, 120+ Departments, 98% Satisfaction, 24/7 Monitoring).
- Interactive **Submit Grievance Drawer** with photo upload, voice note recording, and GPS auto-detect.

### Department Officer Command Center (`/officer/dashboard`)
- Sidebar featuring Officer profile (Rohit Sharma - PWD) with live task counts.
- Top Stat Cards: Total Complaints (1,248), Critical/High (156), In Progress (320), Resolved (772).
- **Complaints Overview** smooth curved area chart with orange gradient fill.
- **Top Categories** donut chart and **Priority Distribution** breakdown.
- **AI Cluster Alert Banner**: *"⚠️ 3 related complaints detected at same location"* with one-click review and assignment.
- **Complaint Details Modal**: Slide-over drawer with photo evidence, status update controller, and officer comments.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS, Lucide Icons, Glassmorphism & Micro-animations |
| **AI Core** | Google Gemini 2.5 Flash (`@google/genai` SDK) |
| **Database** | Supabase (PostgreSQL with PostGIS Spatial Extension) |
| **Spatial Indexing** | PostGIS `GIST` indexes, `ST_DWithin` geodesic distance queries |

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/roshanmahto7770-rcb/VERTEX-HACK-INNOVATE-SevaSatu.git
cd VERTEX-HACK-INNOVATE-SevaSatu
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the project root:
```env
GEMINI_API_KEY=your_google_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*(Note: SevaSetu includes an intelligent reactive in-memory engine and heuristic fallback layer, allowing the platform to run for demonstrations even without active API keys).*

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or port displayed in terminal) to view the Citizen Portal, or navigate to [http://localhost:3000/officer/dashboard](http://localhost:3000/officer/dashboard) for the Officer View.

---

## 📡 API Endpoints

- `POST /api/grievances/submit` - Multimodal grievance ingestion, Gemini triage, and spatial-semantic clustering.
- `GET /api/officer/grievances` - Filtered grievances queue with priority sorting and metrics.
- `POST /api/officer/clusters/verify` - Human-in-the-loop cluster verification and department assignment.
- `PATCH /api/officer/master-tickets/:id/status` - Cascading status update from Master Ticket to all linked children.
- `GET /api/grievances/track/:ticket` - Public citizen complaint tracking endpoint.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
