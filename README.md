# Universal FitLog

A comprehensive dual-platform fitness management application for trainers and trainees.

## Overview

Universal FitLog is a web-based platform designed to streamline workout planning, execution tracking, and progress monitoring for both personal trainers and their clients (trainees).

### Key Features

#### For Trainees (Mobile-First Interface)
- **Daily Dashboard**: View today's scheduled workout, log body weight, track daily nutrition
- **Live Workout Execution**:
  - Real-time workout logging with RIR (Reps in Reserve) tracking
  - Historical comparison showing previous performance for each exercise
  - Built-in rest timer with customizable durations
  - Plate calculator for quick weight calculations
  - Exercise-specific instructions and notes
- **Nutrition Calculator**: Smart food swap calculator with macro comparisons
- **Progress Tracking**: Historical workout data and performance trends

#### For Trainers (Desktop Dashboard) - Coming Soon
- **Plan Builder**: Create customized workout programs for trainees
- **Command Center**: Monitor trainee compliance and workout completion
- **Automated Reports**: Bi-weekly progress reports with weight and strength metrics
- **Trainee Management**: Track multiple clients from a single dashboard

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (recommended)

## Project Structure

```
trainer/
├── app/                      # Next.js app directory
│   ├── trainee/             # Trainee-facing pages
│   │   ├── dashboard/       # Main trainee dashboard
│   │   ├── workout/         # Live workout execution
│   │   └── nutrition/       # Nutrition calculator
│   ├── trainer/             # Trainer dashboard (coming soon)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home/login page
│   └── globals.css          # Global styles
├── components/              # Reusable React components
│   └── ui/                  # Shadcn/ui components
├── lib/                     # Utility functions and configs
│   ├── supabase.ts         # Supabase client
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Utility functions
├── supabase-schema.sql     # Database schema
└── package.json            # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd trainer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   a. Create a new project at [https://app.supabase.com](https://app.supabase.com)

   b. Go to Project Settings → API to get your credentials

   c. Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

   d. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Initialize the database**

   In your Supabase project dashboard:
   - Go to the SQL Editor
   - Copy the contents of `supabase-schema.sql`
   - Paste and run the SQL script

   This will create all necessary tables and seed initial data.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses 9 main tables:

1. **users** - User accounts (trainers and trainees)
2. **exercise_library** - Master list of exercises with instructions
3. **workout_plans** - Training programs assigned to trainees
4. **routines** - Individual workout sessions (A, B, C, etc.)
5. **routine_exercises** - Exercises within each routine with targets
6. **workout_logs** - Completed workout sessions
7. **set_logs** - Individual set performance data
8. **nutrition_swaps** - Food conversion factors for nutrition calculator
9. **daily_nutrition_logs** - Daily nutrition tracking

See `supabase-schema.sql` for the complete schema with relationships and indexes.

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New UI Components

This project uses Shadcn/ui. To add new components, you can manually create them in `components/ui/` following the existing patterns, or use the Shadcn CLI if configured.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project to Vercel
3. Add your environment variables in Vercel project settings
4. Deploy!

### Environment Variables for Production

Make sure to set these in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Roadmap

### Completed
- ✅ Project setup (Next.js + TypeScript + Tailwind)
- ✅ UI component library (Shadcn/ui)
- ✅ Database schema design
- ✅ Supabase integration
- ✅ Trainee dashboard
- ✅ Live workout execution with RIR tracking
- ✅ Nutrition calculator/swapper

### In Progress
- 🚧 Trainer dashboard
- 🚧 Plan builder interface
- 🚧 Trainee management
- 🚧 Authentication flow

### Planned
- ⏳ Automated bi-weekly reports
- ⏳ Progress graphs and charts
- ⏳ Exercise video/image uploads
- ⏳ Mobile app (PWA)
- ⏳ Notification system
- ⏳ Export workout history to PDF

## Contributing

This is a private project. For questions or suggestions, please contact the development team.

## License

Proprietary - All rights reserved
