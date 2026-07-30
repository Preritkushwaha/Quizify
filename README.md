# Quizify - AI-Powered Quiz Application

A full-stack application for creating, hosting, and taking AI-generated quizzes with real-time features and cheating detection.

## Project Structure

```
quizify/
├── backend/          # Express.js server
│   ├── config/       # Configuration files
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── middleware/   # Custom middleware
│   ├── controllers/  # Route controllers
│   ├── socket/       # WebSocket handlers
│   ├── utils/        # Utility functions
│   ├── server.js     # Main server file
│   └── package.json
│
└── frontend/         # React.js client
    ├── public/       # Static assets
    ├── src/
    │   ├── components/  # React components
    │   ├── context/     # Context providers
    │   ├── hooks/       # Custom hooks
    │   ├── services/    # API & external services
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- AI-powered quiz generation using Gemini API
- Real-time quiz participation with Socket.io
- Custom quiz builder
- Cheating detection
- Leaderboard and scoring system
- User authentication with Firebase
- Live results and scoreboard

## Environment Variables

See `.env.example` files in both backend and frontend directories.
