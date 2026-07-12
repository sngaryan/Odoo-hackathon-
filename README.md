# EcoSphere 🌱

EcoSphere is a comprehensive, modern web application built for the **Odoo Hackathon**, designed to help organizations track, manage, and reduce their environmental footprint while fostering employee engagement through Corporate Social Responsibility (CSR) initiatives.

## 🚀 Key Features

### 🌍 Environmental Tracking
- **Emission Factors Management**: Define and manage conversion metrics for different categories (Fuel, Energy, Travel, Waste) to accurately calculate CO₂e emissions.
- **Carbon Transactions**: Log and track daily carbon emissions across various departments with automated CO₂e calculations based on active emission factors.
- **Environmental Goals**: Set department-specific reduction targets. Goals automatically update and flag as `AT_RISK` when carbon transactions exceed 80% of the target.
- **Dynamic Analytics**: A real-time Executive Dashboard featuring rich, interactive stacked/grouped bar charts (powered by Recharts) to visualize emission trends over custom timeframes (e.g., Last 3 Months, Last 6 Months, All Time).

### 🏆 Employee Engagement & Gamification
- **CSR Participation**: Employees can log their participation in social and environmental activities.
- **Gamification**: Includes a robust challenge and submission system to incentivize sustainable practices through evidence-based rewards (Proof of Evidence).

### 🔐 Role-Based Access Control
- Tailored views and permissions for different user roles (Admin, ESG Manager, Auditor, Employee), ensuring data integrity and customized dashboard experiences.

## 🛠️ Technology Stack

EcoSphere is built as a Monorepo containing separate apps for the frontend client and backend API.

**Frontend (`apps/web`):**
- [Next.js](https://nextjs.org/) (React Framework)
- [Tailwind CSS](https://tailwindcss.com/) (Styling)
- [Recharts](https://recharts.org/) (Data Visualization)

**Backend (`apps/api`):**
- [Express.js](https://expressjs.com/) (Node.js API Framework)
- [Prisma ORM](https://www.prisma.io/) (Database Management & Type-Safe Queries)
- [Zod](https://zod.dev/) (Rigid Schema Validation)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- PostgreSQL (or your preferred SQL database compatible with Prisma)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sngaryan/Odoo-hackathon-.git
   cd Odoo-hackathon-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the Database:**
   - Configure your `.env` file in the `apps/api` directory with your `DATABASE_URL`.
   - Run Prisma migrations and seed the database:
     ```bash
     cd apps/api
     npx prisma migrate dev
     npx prisma db seed
     ```

4. **Run the Development Servers:**
   Open two terminal windows to run both the API and Web apps simultaneously:
   
   *Terminal 1 (Backend API):*
   ```bash
   cd apps/api
   npm run dev
   ```
   
   *Terminal 2 (Frontend Web):*
   ```bash
   cd apps/web
   npm run dev
   ```

5. **Access the application:**
   Navigate to `http://localhost:3000` in your browser.

## 🤝 Contribution (Developer B)
Significant contributions were made to the **Environmental Module**, including:
- End-to-end implementation of Carbon Transactions, Emission Factors, and Environmental Goals.
- Development of the `/api/v1/environmental/summary` aggregation endpoint for dashboard consumption.
- Creation of the responsive `EmissionsChart` with custom glassmorphism tooltips, vibrant gradients, and dynamic timeframe filters.
- Strict Zod validation formatting and resilient UI state management for "Transaction → Goal" flows.

---
