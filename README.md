# SDMCampusFix

A MERN issue reporting dashboard for campus communities.

## Run locally

1. Start the API:
   `cd server && npm run dev`
2. Start the client in a second terminal:
   `cd client && npm run dev`
3. Open `http://localhost:5173`.

The API runs with demo issues when `MONGODB_URI` is absent. To enable MongoDB persistence, copy `server/.env.example` to `server/.env` and add your connection string.

## API

- `GET /api/health`
- `GET /api/issues`
- `POST /api/issues`
- `PATCH /api/issues/:id/status`
