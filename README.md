# Judestone USA Official Website

A modern, responsive website for Judestone USA, featuring premium quartz designs and sink products with advanced filtering and search capabilities.

## Project Structure

```
judestoneusa/
├── src/
│   ├── pages/              # HTML pages
│   ├── assets/             # CSS, JS, and other assets
│   └── config/             # Frontend configuration
├── backend/
│   ├── config/             # Environment configuration
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── server.js           # Express server
├── assets/
│   └── brand/              # Logo and branding files
├── images/                 # Image assets
└── docs/                   # Documentation
```

## Quick Start

### Prerequisites
- Node.js 14+ 
- Python 3+ (for development server)
- Postmark account for email functionality (optional)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables (if using backend):**
   ```bash
   cp backend/config/env.example backend/config/.env
   # Edit backend/config/.env with your actual values
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```
   This starts both frontend (port 8000) and backend (port 3000) servers.

### Production

```bash
npm start
```

## Features

### Frontend
- Responsive design with modern CSS
- Dark navy premium theme
- Dynamic product galleries with filtering
- Advanced search and sort functionality
- Product image optimization and lazy loading
- SEO optimized

### Backend
- Express.js server with security middleware
- Postmark email integration (optional)
- Input validation and rate limiting
- CORS configuration
- Health check endpoints

## Development

### Available Scripts
- `npm run dev` - Start development servers
- `npm start` - Start production server
- `npm run build` - Build for production

### Adding New Pages
1. Create HTML file in `src/pages/`
2. Update navigation in existing pages
3. Add route in `backend/server.js` if needed

### API Development
- Routes go in `backend/routes/`
- Middleware in `backend/middleware/`
- Configuration in `backend/config/`

## Security

- Helmet.js for security headers
- Rate limiting on API endpoints
- Input validation with express-validator
- CORS configuration
- Environment variable protection
