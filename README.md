# ytDownloader

`ytDl` is a fullstack YouTube downloader built with Node.js, Express, and TypeScript.

It supports:
- video download as `mp4` (up to 720p)
- audio download as `m4a`
- browser-based UI served by the same backend

## Project Structure

- `src/server/config` - environment and app configuration
- `src/server/routes` - API route registration
- `src/server/controllers` - request handlers
- `src/server/services` - YouTube download and metadata logic
- `src/server/utils` - utility helpers
- `src/client` - static frontend files

## Requirements

- Node.js 18+ (recommended 20+)
- `ffmpeg` installed on your machine

Install `ffmpeg` (Ubuntu/Debian):

```bash
sudo apt update && sudo apt install -y ffmpeg
```

## Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Available variables:

- `PORT` - backend port (default `4000`)
- `YTDLP_COOKIES` - absolute path to exported cookies file (optional)
- `YTDLP_COOKIES_FROM_BROWSER` - browser name for cookie extraction (optional, e.g. `chrome` or `firefox`)

## Run Locally

```bash
npm install
npm run dev
```

Open:

- `http://localhost:4000`

## Share With Friend (ngrok)

From the project root:

```bash
npx ngrok http 4000
```

Share the generated `https://...ngrok-free.dev` URL.

## Docker

This project supports Docker deployment.

The Docker container includes:

- Node.js runtime
- Python 3 runtime
- pytubefix
- Application dependencies

### Build Docker Image

From the project root:

```bash
docker build -t ytdownloader-api .
```

### Run Container

```bash
docker run -d \
  --name ytdownloader-api \
  --restart always \
  -p 4000:4000 \
  ytdownloader-api
```

### Check Container Status

```bash
docker ps
```

### View Container Logs

```bash
docker logs ytdownloader-api
```

### Test API Health

```bash
curl http://localhost:4000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Deployment

The backend API can be deployed separately from the frontend.

Recommended setup:

```
Frontend
   |
   | API requests
   ↓
Dockerized Express Backend
```

The frontend can be hosted on platforms like Vercel, while this backend runs on a server using Docker.


## Notes

- Some YouTube requests may trigger anti-bot checks depending on IP/session; cookies can help.
- Temporary download files are deleted from the server after transfer.
