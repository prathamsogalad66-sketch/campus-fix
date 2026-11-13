# SDMCampusFix

A MERN issue reporting dashboard for campus communities.

## Run locally

1. Start the API:
   `cd server && npm run dev`
2. Start the client in a second terminal:
   `cd client && npm run dev`
3. Open `http://localhost:5173`.

The API uses local JSON storage when `MONGODB_URI` is absent or MongoDB cannot be reached. Reports submitted in this mode are saved to `server/data/issues.json` on this server and are not synced to Atlas. The dashboard displays a warning while local storage is active. Check `GET /api/health` for the current `storageMode`.

## Deploy the complete app on Render

The root `build` command builds the React client, and the Express server serves that build and the API from the same Render service. Use the repository root as the service root, `npm run build` as the build command, and `npm start` as the start command.

Set `MONGODB_URI` and `MONGODB_DATABASE` in the Render service environment. Set `PUBLIC_APP_URL` to the public HTTPS URL shown by Render (for example, `https://your-render-service.onrender.com`). Render also provides `RENDER_EXTERNAL_URL`, which is used as a fallback if `PUBLIC_APP_URL` is not set. For a separate Render Static Site frontend, set `PUBLIC_APP_URL` to that site's URL, `CLIENT_URL` to its origin, and the frontend build variable `VITE_API_URL` to the backend URL ending in `/api`.

When a worker is assigned a task, the WhatsApp dispatch includes a task-specific link. The worker can report that more time is needed or mark the task complete from that page. Completion is saved to MongoDB and sent to open dashboards in real time; earlier WhatsApp messages are not changed.

## Deploy the frontend to Vercel

The frontend is the Vite/React application in `client/`. The Express API, MongoDB connection, and server-side integrations remain on Render.

1. Import this repository into Vercel and set **Root Directory** to `client`.
2. Use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. Vercel will install the dependencies from `client/package-lock.json`.
3. Set the Vercel environment variable `VITE_API_URL` to the full Render API base URL, including `/api` and with no trailing slash, for example `https://your-render-service.onrender.com/api`. This value is public frontend configuration, not a secret.
4. Set the variable for Production and any Preview environments that should call the API, then deploy the frontend.

`client/vercel.json` provides the SPA fallback for direct page loads. The Vite development server continues to proxy `/api` to localhost when `VITE_API_URL` is unset, so local development does not require the Render URL.

The current Render API CORS configuration already allows Vercel `*.vercel.app` origins, including preview deployments. No backend code or Render setting needs to change for the default Vercel domain. If using a custom Vercel domain, configure Render's `CLIENT_URL` to that exact HTTPS origin. Before changing it, check whether the existing Render frontend uses a separate custom origin, because `CLIENT_URL` is a single exact origin; preserve any existing production access that still needs it. The API does not use cookie sessions, so cross-origin cookie settings are not required.

Keep `MONGODB_URI`, `MONGODB_DATABASE`, and any WhatsApp/provider credentials on Render only. Do not add them to Vercel; `VITE_*` values are included in browser-visible frontend code. The frontend sends API requests and base64-encoded photos directly to Render, where the existing API JSON body limit is 15 MB.

The existing admin passcodes are hardcoded in the frontend source and therefore visible to anyone who can load the app. This Vercel setup does not add or expose server credentials, but it also does not make the current admin check secure. Before relying on admin access for a public production app, move credential verification to the Render API and rotate the existing passcodes; that authentication change is intentionally outside this hosting-only update.

This setup does not change or redeploy the existing Render service. Its current static frontend fallback is left intact for compatibility; the separate Vercel frontend is built from `client/`.

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
- `POST /api/issues/:id/completion-action/preview`
- `POST /api/issues/:id/completion-action/progress`
- `POST /api/issues/:id/completion-action`
