# Highlander Serie A - Replit.md

## Overview

Highlander Serie A is a multiplayer elimination game based on Serie A 2025/26 football results. Players create teams of 20 players and must survive weekly elimination rounds by making correct predictions. It's built as a modern web application with PWA (Progressive Web App) capabilities for mobile installation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/ui components
- **State Management**: TanStack Query for server state
- **PWA Features**: Service worker, manifest.json, offline capabilities
- **Build Tool**: Vite with custom configuration for multi-platform deployment

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy
- **Session Management**: Express-session with memory store
- **Password Hashing**: Dual support for scrypt (legacy) and bcrypt

### Database Architecture
- **Primary**: PostgreSQL with Drizzle ORM
- **Cloud Support**: Neon Database compatibility
- **Schema**: Comprehensive relational design with users, games, teams, matches, tickets
- **Connection**: Automatic detection between local PostgreSQL and Neon cloud

## Key Components

### Authentication System
- Dual password hashing support (scrypt/bcrypt compatibility)
- Email verification workflow
- Password reset functionality
- Username recovery feature
- Session-based authentication with secure cookies

### Game Logic Engine
- Round-based elimination system
- Automatic deadline management
- Real-time game state updates
- Timer service for automatic game progression
- Comprehensive scoring and elimination rules

### Email Service
- Unified email service supporting multiple providers
- SMTP integration (One.com primary)
- Email templates for verification, password reset, username recovery
- Automatic provider detection and fallback

### PWA Implementation
- Complete manifest.json with icons and shortcuts
- Service worker with intelligent caching
- Offline functionality
- Mobile installation prompts
- Push notification infrastructure

## Data Flow

### User Registration Flow
1. User submits registration form
2. Server validates input and creates user record
3. Email verification token generated and sent
4. User clicks verification link
5. Account activated and user redirected to dashboard

### Game Creation Flow
1. Admin user creates new game with parameters
2. Game participants register within deadline
3. Timer service manages selection deadlines
4. Players make team selections each round
5. Results calculated based on real Serie A outcomes

### Email Processing Flow
1. Email trigger event occurs (registration, password reset, etc.)
2. Unified email service determines provider (SMTP vs development)
3. Email template rendered with dynamic content
4. Message sent via configured provider
5. Success/failure logged for debugging

## External Dependencies

### Email Services
- **Primary**: One.com SMTP (send.one.com:587)
- **Alternative**: SendGrid API support
- **Development**: Console logging fallback

### Database Services
- **Production**: Local PostgreSQL with user authentication
- **Development**: Neon Database cloud support
- **ORM**: Drizzle with automatic migrations

### Infrastructure
- **Deployment**: PM2 process manager
- **Web Server**: Nginx reverse proxy
- **SSL**: Let's Encrypt automatic certificates
- **Monitoring**: PM2 built-in monitoring and logging

## Deployment Strategy

### Production Environment
- **Server**: Hetzner Cloud VPS
- **Domain**: highlandergame.it with SSL
- **Process Management**: PM2 with ecosystem configuration
- **Database**: Local PostgreSQL with dedicated user
- **Email**: One.com SMTP with support@highlandergame.it

### Development Environment
- **Platform**: Replit with live preview
- **Database**: Neon Database cloud instance
- **Email**: Console logging for testing
- **Hot Reload**: Vite development server

### Deployment Process
1. Code changes pushed to GitHub repository
2. Server pulls latest changes via Git
3. Dependencies installed and application built
4. PM2 restarts application with zero downtime
5. Health checks verify successful deployment

## Changelog

- June 24, 2025: Created complete production database synchronization with authentic Serie A 2025/26 calendar (380 matches), implemented dual bcrypt/scrypt authentication support, resolved production deployment issues
- June 23, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.