# EcoSphere 🌱

EcoSphere is a comprehensive, modern web application built for the **Odoo Hackathon**, designed to help organizations track, manage, and reduce their environmental footprint while fostering employee engagement through Corporate Social Responsibility (CSR) initiatives.

## 🚀 Key Features

### ⚖️ Corporate Governance & Compliance
- **Policy Management**: Centralized hub for publishing and tracking corporate ESG policies.
- **Digital Acknowledgements**: Ensure company-wide compliance with tracked employee policy agreements.
- **Audit Tracking**: Log internal ESG audits and track high-priority compliance issues to resolution.

### 🌍 Environmental Tracking
- **Emission Factors Management**: Maintain a single source of truth for carbon conversion metrics (Fuel, Energy, Travel, Waste).
- **Carbon Transactions**: Log daily carbon emissions across departments with automated CO₂e calculations.
- **Smart Environmental Goals**: Set department-specific reduction targets. The system automatically monitors progress and flags goals as `AT_RISK` if emissions exceed 80% of the target.
- **Dynamic Executive Analytics**: Real-time dashboard featuring rich, interactive visualizations to analyze emission trends over custom timeframes.

### 🏆 CSR & Employee Gamification
- **CSR Volunteering**: Employees can browse and sign up for company-sponsored environmental and social activities.
- **Eco-Challenges**: Incentivize sustainable practices (like Car-Free Commutes) through a gamified challenge submission system.
- **Badges & Leaderboards**: Employees earn XP and unlock badges for their verifiable contributions, building a vibrant culture of sustainability.

### 🔐 Role-Based Access Control
- Tailored views and permissions for different user roles (Admin, ESG Manager, Auditor, Employee), ensuring data integrity and customized dashboard experiences.

## 🛠️ Technology Stack

EcoSphere is built as a highly scalable Monorepo.

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
   - Run Prisma migrations and seed the database with our rich demo data:
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


