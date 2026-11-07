# SDMCampusFix

A MERN issue reporting dashboard for campus communities.

## Run locally

1. Start the API:
   `cd server && npm run dev`
2. Start the client in a second terminal:
   `cd client && npm run dev`
3. Open `http://localhost:5173`.

The API uses local JSON storage when `MONGODB_URI` is absent or MongoDB cannot be reached. Reports submitted in this mode are saved to `server/data/issues.json` on this server and are not synced to Atlas. The dashboard displays a warning while local storage is active. Check `GET /api/health` for the current `storageMode`.

To enable MongoDB Atlas persistence:

1. Copy `server/.env.example` to `server/.env`.
2. Set `MONGODB_URI` to the connection string for your Atlas cluster, replacing the username and password placeholders. URL-encode special characters in the username or password.
3. Ensure the Atlas database user has read/write access and the server's IP is allowed in Atlas Network Access.
4. Set `MONGODB_DATABASE=campusfix` and start the API. Campus Fix uses its own `campusfix` database and `issues` collection, separate from Atlas sample databases such as `sample_mflix`. Check the API log for a successful MongoDB connection.

When an admin assigns a worker, the API records a WhatsApp dispatch entry in the `whatsappdispatches` collection. The entry records the issue, worker, dispatch status, and provider message ID when available; it does not store the full message text or API credentials. Set `GREEN_API_INSTANCE_ID` and `GREEN_API_TOKEN` in `server/.env` to send through Green API. An `accepted` status means the provider accepted the request, not that delivery was confirmed. Without those credentials, the dispatch record is marked `link_generated`; this only means a pre-filled WhatsApp link was prepared, not that a message was opened or sent.

## API

- `GET /api/health`
- `GET /api/issues`
- `POST /api/issues`
- `PATCH /api/issues/:id/status`
