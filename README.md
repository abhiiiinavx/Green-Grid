# 🌱 GreenGrid - Smart Energy Management & Microgrid Platform

> An intelligent, human-centric household and commercial microgrid energy management system with real-time telemetry, predictive solar/battery analytics, dynamic time-of-use tariff optimization, and one-touch smart scene automation.

---

## ⚡ Key Capabilities

- **Real-Time Telemetry & Disaggregation**: Sub-second load monitoring, active circuit disaggregation, and running burn rate (₹/hour).
- **Human-Centric Design**:
  - Contextual ambient weather and live utility slab alerts (BESCOM Bangalore time-of-use tariffs).
  - Everyday relatable equivalencies (cups of artisanal coffee saved, trees planted, EV kilometers driven).
  - One-Touch Smart Household Scenes (`Eco-Saver`, `Good Night`, `Peak Shield`, `Away Mode`, `Movie Time`, `All Off`, `All On`).
- **AI Energy Recommendations**: Machine-learning driven efficiency insights with one-click appliance auto-tuning and festive celebratory feedback.
- **Rooftop Solar & Battery Storage Management**:
  - 4.5 kW rooftop photovoltaic array tracking and live coverage analytics (78% solar self-sufficiency).
  - Lithium battery storage control with 3 dispatch strategies: *Peak Shaving*, *Solar Priority*, and *Storm Backup Reserve*.
- **Incident Drill Simulator & Safety Guard**: Test grid spike protection, AC overrun containment, and solar drop notifications on demand.
- **Automated Billing & PDF Statements**: Instant client-side generation and download of formatted energy audit reports and invoices.
- **Goals, Carbon Budgets & Badges**: Pacing monitors against monthly targets with earned eco-achievement badges.

---

## 🏗️ Architecture & Tech Stack

```text
GREEN GRID/
├── frontend/          # React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide, jsPDF
├── backend/           # Node.js, Express, TypeScript, Prisma ORM, JWT, Helmet
├── prisma/            # SQLite schema, migrations, and seed scripts (60-day telemetry)
└── ai-service/        # Python FastAPI forecasting and anomaly detection service
```

- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, Recharts, Canvas-Confetti, jsPDF
- **Backend**: Node.js, Express, TypeScript, Prisma ORM (SQLite / PostgreSQL ready), JSON Web Tokens (JWT), Winston/Morgan
- **Database**: Prisma SQLite (`dev.db`) with relational telemetry, appliance states, tariffs, and alerts

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Python 3.9+ (optional, for standalone AI microservice)

### 1. Installation

Clone the repository and install root and workspace dependencies:

```bash
git clone <your-repository-url>
cd "GREEN GRID"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Copy the sample environment file in `backend/`:

```bash
cd ../backend
cp .env.example .env
```

### 3. Database Initialization & Seeding

```bash
cd backend
npx prisma db push
npm run prisma:seed
```

### 4. Running the Platform

In two separate terminal sessions:

```bash
# Terminal 1 - Start Backend API (Port 5000)
cd backend
npm run dev

# Terminal 2 - Start Frontend Application (Port 5180)
cd frontend
npm run dev
```

Visit [`http://localhost:5180`](http://localhost:5180) in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Homeowner (Full Access)** | `demo@greengrid.io` | `Password123!` |
| **Grid Administrator** | `admin@greengrid.io` | `AdminPass123!` |

---

## 📄 License

MIT © [Abhinav Pratap Singh](mailto:abhinavaps285@gmail.com)
