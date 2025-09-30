# MedReminder Pro

A comprehensive medication management and reminder application built with React, TypeScript, and Supabase.

## Features

- **Secure Authentication**: User registration and login with JWT tokens
- **Prescription Management**: Add, edit, and manage multiple prescriptions
- **Flexible Scheduling**: Set custom dose times and days of the week
- **Medication Tracking**: Mark doses as taken, missed, or skipped
- **Time Correction**: Adjust actual taken times for accurate records
- **Comprehensive History**: View detailed medication history with timing analysis
- **Daily View**: See all scheduled doses by date range
- **Admin Panel**: User management for administrators
- **Export Data**: Download medication history as CSV
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Mobile**: Capacitor (for native iOS/Android apps)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key

4. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

The application uses Supabase with the following tables:
- `users` - User profiles and authentication
- `prescriptions` - Medication prescriptions
- `dose_schedules` - Flexible dosing schedules
- `medication_logs` - Dose tracking logs
- `medication_history` - Complete medication history

All tables have Row Level Security (RLS) enabled for data protection.

## Usage

1. **Register/Login**: Create an account or sign in
2. **Add Prescriptions**: Click "Add Prescription" to add medications
3. **Set Schedules**: Configure dose times and days of the week
4. **Track Doses**: Mark doses as taken, missed, or skipped
5. **View History**: Access detailed medication history and analytics
6. **Export Data**: Download your medication data as CSV

## Mobile Apps

This project includes Capacitor configuration for native mobile apps. See `README-MOBILE.md` for mobile development setup instructions.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For support or questions, please contact the development team.