

## Vehicle Health Tracker — MVP Plan

### Design System
- **Dark automotive theme**: Dark background (#0F172A), with accent colors — vibrant blue (#3B82F6) for primary actions, amber/yellow for warnings, green for healthy status, red for overdue items
- Clean dashboard-style layout with cards, stat widgets, and data tables

### Authentication
- Email/password signup & login via Supabase Auth
- User profiles table (name, avatar)
- All data scoped per user with RLS

### Database Schema
- **vehicles** — name, type (bike/motorcycle), make, model, year, registration number, current mileage, photo URL
- **fuel_logs** — vehicle_id, date, odometer reading, fuel quantity (L), cost, fuel station (optional)
- **service_records** — vehicle_id, date, odometer, service type, description, cost, next service due date/mileage
- **documents** — vehicle_id, type (insurance/RC/PUC/license/other), document number, issue date, expiry date, file URL (Supabase Storage)
- **user_roles** — standard role table for future extensibility

### Pages & Features

**1. Dashboard (Home)**
- Vehicle cards showing health summary at a glance
- Upcoming service reminders (color-coded: green/yellow/red by urgency)
- Expiring documents alert banner
- Quick stats: total fuel spend this month, avg fuel economy

**2. Vehicle Detail Page**
- Vehicle info card with photo, make/model, current mileage
- Tabs: Fuel Log | Service History | Documents | Analytics

**3. Fuel Tracking**
- Log fuel fill-ups (date, odometer, quantity, cost)
- Auto-calculate fuel economy (km/L) between fill-ups
- Monthly fuel spend summary

**4. Fuel Analytics**
- Charts: fuel economy trend over time, monthly cost breakdown
- Average km/L, cost per km stats

**5. Service & Maintenance**
- Log service records with type, cost, notes
- Set next service due (by date or mileage)
- Visual timeline of maintenance history

**6. Documents**
- Upload photos/PDFs of insurance, RC, PUC, license
- Track expiry dates with color-coded status badges
- File storage via Supabase Storage with secure access

**7. Add Vehicle Flow**
- Form to add a new vehicle with all details
- Support for multiple vehicles per user

### Tech Stack
- React + TypeScript + Tailwind (dark theme)
- Supabase: Auth, Database (Postgres + RLS), Storage
- Recharts for fuel analytics charts
- Shadcn UI components throughout

