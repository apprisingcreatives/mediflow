# Booking System Landing Page

A modern, feature-rich landing page for a booking system built with Next.js, React, and TypeScript. This project showcases a professional booking platform with authentication, dashboard features, and a comprehensive UI component library.

## Features

- **🎨 Modern UI Design** - Built with Tailwind CSS and Radix UI components
- **🌓 Dark Mode Support** - Seamless theme switching with next-themes
- **🔐 Authentication** - User registration and login with Supabase
- **📊 Admin Dashboard** - Dashboard pages for both admin and patient roles
- **🎯 Landing Page** - Comprehensive sections including hero, features, pricing, testimonials, and more
- **✨ Smooth Animations** - GSAP-powered animations and scroll triggers
- **📱 Responsive Design** - Mobile-first approach with Tailwind CSS
- **🧩 Extensive UI Components** - Pre-built components for forms, dialogs, charts, tables, and more
- **📈 Form Handling** - React Hook Form with Zod validation
- **🎪 Booking Integration** - TempoBook integration for storyboard management

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom animations
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **State Management & Forms**: [React Hook Form](https://react-hook-form.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Animations**: [GSAP](https://greensock.com/gsap/) with ScrollTrigger
- **Icons**: [Lucide React](https://lucide.dev/) & [Radix Icons](https://radix-ui.com/icons)
- **Carousel**: [Embla Carousel](https://www.embla-carousel.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Payments**: [Stripe](https://stripe.com/)

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Dashboard pages (admin, patient)
│   ├── book/                # Booking page
│   ├── demo/                # Demo page
│   ├── tempobook/           # TempoBook integration
│   ├── page.tsx             # Home page
│   └── layout.tsx           # Root layout
├── components/
│   ├── home/                # Landing page sections
│   ├── layout/              # Header and footer
│   ├── ui/                  # Reusable UI components
│   ├── theme-provider.tsx   # Theme configuration
│   └── theme-switcher.tsx   # Dark mode toggle
├── hooks/
│   ├── use-gsap.tsx         # GSAP animation hook
│   └── use-mobile.tsx       # Mobile detection hook
└── lib/
    └── utils.ts             # Utility functions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account for backend services

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd booking-system-landing
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the landing page.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start the production server

## Key Components

### Landing Page Sections
- **Hero Section** - Eye-catching hero with animations
- **Trust Bar** - Social proof and company logos
- **Features Section** - Key features and benefits
- **How It Works** - Step-by-step process explanation
- **Practitioners Section** - Team or service providers
- **Testimonials** - Customer reviews and feedback
- **Pricing Section** - Service pricing tiers
- **CTA Section** - Call-to-action for conversion

### Dashboard Features
- Admin panel for managing bookings and users
- Patient portal for viewing and managing appointments
- User authentication and authorization

### UI Component Library
The project includes a comprehensive set of reusable UI components:
- Form components (input, textarea, select, checkbox, radio, etc.)
- Dialog and modal components
- Navigation components (menu, breadcrumb, pagination, etc.)
- Data display (table, chart, calendar, carousel, etc.)
- Feedback components (alert, badge, toast, spinner, etc.)
- And many more...

## Customization

### Theme Configuration
Customize the theme in [tailwind.config.ts](tailwind.config.ts) and [next.config.js](next.config.js).

### Dark Mode
The project uses `next-themes` for dark mode support. Configure theme switching in [theme-provider.tsx](src/components/theme-provider.tsx).

### Styling
All components use Tailwind CSS with custom utilities. Modify styles in component files or the Tailwind config.

## Deployment

The project is optimized for deployment on [Vercel](https://vercel.com/), but can be deployed to any Node.js-compatible hosting:

1. Push your code to a Git repository
2. Connect to Vercel or your hosting platform
3. Set environment variables
4. Deploy!

## Development Tips

- Components are located in `src/components/` and organized by functionality
- Use the custom hooks in `src/hooks/` for common functionality
- Leverage the extensive UI component library for consistent design
- GSAP animations are wrapped in the `use-gsap` hook for clean integration
- Responsive design helpers available via `use-mobile` hook

## License

Private project. All rights reserved.

## Support

For questions or issues, please contact the development team or create an issue in the repository.
