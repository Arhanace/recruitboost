# RecruitBoost - Athletic Recruiting Platform

A comprehensive React application designed to help student-athletes connect with college coaches and manage their recruiting journey.

## Features

- **Beautiful Landing Page**: Modern, responsive splash page with compelling hero section
- **Interactive Dashboard**: Customizable dashboard showing recruiting statistics and activities
- **Real-time Statistics**: Track emails sent, responses received, coaches contacted, and follow-ups due
- **Activity Feed**: Monitor all recruiting activities in one place
- **Task Management**: Keep track of important recruiting tasks and deadlines
- **Coach Management**: Save and organize coaches from your target schools
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible component primitives
- **Wouter** for lightweight routing
- **TanStack Query** for data fetching and caching
- **Lucide React** for beautiful icons
- **Framer Motion** for smooth animations

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd recruitboost-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Base UI components (Button, Card, Dialog, etc.)
├── pages/              # Page components
│   ├── splash.tsx      # Landing/splash page
│   └── dashboard.tsx   # Main dashboard
├── lib/                # Utility functions and configurations
│   ├── utils.ts        # Common utility functions
│   ├── queryClient.ts  # TanStack Query configuration
│   └── mock-data.ts    # Mock data for demo purposes
├── types/              # TypeScript type definitions
│   └── index.ts        # Application data types
├── hooks/              # Custom React hooks
│   └── use-toast.ts    # Toast notification hook
└── App.tsx             # Main application component
```

## Features Overview

### Splash Page
- Compelling hero section with call-to-action
- Feature highlights (Find Coaches, Contact Coaches, Track Progress)
- Statistics showcase
- Authentication modal with demo access

### Dashboard
- Customizable widget system
- Real-time recruiting statistics
- Recent activity feed
- Upcoming tasks list
- Saved coaches overview
- Recent coach responses

### Mock Data
The application includes comprehensive mock data to demonstrate functionality:
- Sample coaches from top universities
- Email conversations and responses
- Recruiting tasks and activities
- User profile information

## Customization

The application uses a modern design system with:
- CSS custom properties for theming
- Tailwind CSS for utility-first styling
- Radix UI for accessible component patterns
- Responsive design principles

## Demo Access

The application includes demo functionality - click "Continue with Demo" or "Get Started with Demo" on the login screen to explore the full feature set.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with modern React best practices
- Inspired by leading athletic recruiting platforms
- Uses high-quality stock images from Unsplash
- Icons provided by Lucide React
