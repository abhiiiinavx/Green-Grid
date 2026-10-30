# Green Grid — System Architecture & Design Philosophy

## Executive Overview

**GREEN GRID** is a production-quality Smart Energy Management Platform engineered for residential households, hostels, commercial offices, campuses, and small businesses.

Green Grid implements a closed-loop intelligence paradigm:
```
COLLECT ➔ ANALYZE ➔ PREDICT ➔ ALERT ➔ RECOMMEND ➔ OPTIMIZE
```

---

## 1. High-Level System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  USER / CLIENTS                                   |
|   +--------------------------+           +------------------------------------+   |
|   | Desktop Web (Responsive) |           | Mobile PWA / Tablet Browser        |   |
|   +--------------------------+           +------------------------------------+   |
+----------------------------------------+------------------------------------------+
                                         |  HTTPS / REST / SSE
                                         v
+-----------------------------------------------------------------------------------+
|                        FRONTEND APPLICATION (React + Vite)                        |
|  - React 18 + TypeScript + Tailwind CSS                                           |
|  - TanStack Query (Optimistic UI & Cache invalidation)                            |
|  - Recharts (Time-of-Use & Power curve visualizations)                            |
|  - Real-Time Simulation State Controller                                           |
+----------------------------------------+------------------------------------------+
                                         |  JSON API (v1) / JWT Bearer
                                         v
+-----------------------------------------------------------------------------------+
|                          BACKEND API (Node.js + Express)                          |
|  - TypeScript REST API Server                                                     |
|  - Authentication & RBAC (USER / ADMIN)                                           |
|  - Slab & Time-of-Use Billing Calculation Engine                                  |
|  - Instantaneous Telemetry Ingestion Gateway                                      |
|  - Zod Request Validators & Centralized Error Handler                             |
+-------------------+---------------------------------------+-----------------------+
                    |                                       |
                    | Prisma ORM                            | HTTP RPC
                    v                                       v
+-----------------------------------+   +-------------------------------------------+
|      RELATIONAL DATABASE          |   |          AI / ML MICROSERVICE             |
|  - PostgreSQL / SQLite (Prisma)   |   |  - Python + FastAPI + Pandas + Sklearn    |
|  - Time-series Telemetry Tables   |   |  - 24h & 7d Autoregressive Demand Model   |
|  - Relational Models & Indexes    |   |  - Anomaly Detection (Z-Score & Variance) |
|  - Enums, UUIDs, Foreign Keys     |   |  - Month-End Bill Regressor               |
+-----------------------------------+   +-------------------------------------------+
```

---

## 2. Key Architectural Tenets

### A. Zero-Hardware Barrier with Hardware-Ready Ingestion
To allow instant evaluation and demonstration without requiring immediate IoT hardware installation, the platform features an in-memory high-fidelity **Simulation Engine**. When an appliance is toggled ON/OFF in the UI, the active power draw immediately shifts by the appliance's rated wattage. Real smart meters (e.g. ESP32 + PZEM-004T) push telemetry to `/api/v1/energy/ingest` with zero changes required in business logic.

### B. Tiered Slab & Time-of-Use Tariff Engine
Unlike simple flat-rate calculators, Green Grid supports progressive multi-tier slab tariffs (e.g. 0-100 kWh @ ₹4.75, 101-300 kWh @ ₹6.50, 301+ @ ₹8.25), fixed monthly charges, and Time-of-Use peak surge rates (6:00 PM – 10:00 PM).

### C. Grounded AI & Recommendations
Recommendations are not arbitrary strings; they are calculated mathematically using the user's actual appliance inventory, duty cycles, and active tariff rates.
