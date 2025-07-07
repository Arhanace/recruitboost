# Architecture Overview

## Overview

This application is a college athletic recruitment platform that helps high school athletes connect with college coaches. The system allows students to manage their athletic profiles, search for coaches by various criteria, send personalized outreach emails, and track their interactions with coaches.

The application is built as a full-stack web application with a clear separation between the client-side frontend and server-side backend. It follows modern web development practices with a responsive React frontend and a Node.js Express backend.

## System Architecture

The system follows a client-server architecture with the following high-level components:

1. **Frontend**: React-based single-page application with UI components from Shadcn UI
2. **Backend**: Node.js Express server providing RESTful API endpoints
3. **Database**: PostgreSQL database (via Neon Serverless) with Drizzle ORM
4. **Authentication**: Firebase Authentication for user management
5. **Email Service**: SendGrid for email delivery
6. **AI Integration**: Anthropic's Claude API for generating personalized email content

### Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Neon Serverless), Drizzle ORM
- **Authentication**: Firebase Authentication
- **Build Tools**: Vite, ESBuild
- **Deployment**: Configured for deployment to Replit

## Key Components

### Frontend Components

1. **Authentication Module**
   - Handles user registration and login via Firebase Auth
   - Supports social login with Google and Apple
   - Manages user session state through React contexts

2. **Dashboard**
   - Provides overview of user activities, tasks, and saved coaches
   - Contains customizable widgets for different user data views

3. **Coach Search & Management**
   - Allows searching, filtering, and saving coaches
   - Displays detailed coach information and contact details

4. **Email Outreach System**
   - Provides interface for composing personalized emails to coaches
   - Supports template management and AI-assisted email generation
   - Tracks email status and history

5. **Task Management**
   - Allows creating and tracking follow-up tasks
   - Provides reminders for pending recruitment activities

### Backend Components

1. **API Server**
   - Express-based REST API handling client requests
   - Organized around resource-based endpoints

2. **Database Access Layer**
   - Uses Drizzle ORM for database interactions
   - Provides storage interfaces for all application entities

3. **Authentication Service**
   - Integrates with Firebase Admin SDK to verify user tokens
   - Handles user session management

4. **AI Integration Service**
   - Connects to Anthropic's Claude API
   - Generates personalized email content based on athlete and coach profiles

5. **Email Service**
   - Integrates with SendGrid for sending emails
   - Handles email formatting and delivery

### Database Schema

The main database entities include:

1. **Users**: Stores user profile information including athletic stats and academic information
2. **Coaches**: Stores coach contact information and institutional details
3. **SavedCoaches**: Relationship table tracking user-saved coaches
4. **EmailTemplates**: Stores reusable email templates
5. **Emails**: Tracks sent emails and their status
6. **Tasks**: Stores follow-up tasks and reminders
7. **Activities**: Logs user activities for the activity feed

## Data Flow

### Authentication Flow

1. User authenticates via Firebase Authentication (Google/Apple Sign-In)
2. Frontend receives Firebase ID token
3. Token is sent with requests to backend APIs
4. Backend verifies token with Firebase Admin SDK
5. User profile is retrieved from database based on Firebase UID

### Coach Search Flow

1. User inputs search criteria
2. Frontend sends search request to backend API
3. Backend queries database with filters
4. Results are returned to frontend for display
5. User can save coaches to their profile

### Email Outreach Flow

1. User selects one or more coaches to contact
2. User composes email or selects template
3. If using AI assistance, request is sent to Anthropic API
4. Completed email is sent to coach(es) via SendGrid
5. Email record is stored in database
6. Activity is logged for tracking

## External Dependencies

1. **Firebase Authentication**
   - Handles user authentication with social login providers
   - Provides secure user identity management

2. **Neon Serverless PostgreSQL**
   - Cloud-based PostgreSQL database
   - Provides WebSocket connections for serverless environments

3. **SendGrid**
   - Email delivery service for coach communications
   - Handles email sending infrastructure

4. **Anthropic Claude API**
   - AI service for generating personalized email content
   - Improves quality of student-coach communications

## Deployment Strategy

The application is configured for deployment on Replit, with configuration for both development and production environments:

1. **Development Mode**
   - Uses Vite development server with hot module replacement
   - Connects to development database
   - Simplifies authentication flow for local testing

2. **Production Mode**
   - Builds optimized frontend bundle with Vite
   - Packages server code with ESBuild
   - Uses production environment variables for external services
   - Configures proper security settings for production

### Build Pipeline

1. Frontend is built using Vite
2. Backend is bundled using ESBuild
3. Environment-specific configuration is applied based on NODE_ENV
4. Static assets are served by the Express server

### Database Migrations

The project uses Drizzle Kit for database schema management:

1. Schema is defined in TypeScript (`shared/schema.ts`)
2. Migrations are generated using Drizzle Kit
3. Schema changes can be pushed to the database with `npm run db:push`