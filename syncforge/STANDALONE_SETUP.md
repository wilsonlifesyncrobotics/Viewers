# SyncForge - Standalone Setup

## Overview

SyncForge can now run as a **completely independent Node.js application** without the parent OHIF repository.

---

## Quick Start (Standalone)

### 1. Copy the `syncforge` folder to any location

```bash
# Copy syncforge to a new location
cp -r syncforge /path/to/new/location/
cd /path/to/new/location/syncforge
```

### 2. Install dependencies

```bash
npm install
```

This will install:
- `express` - Web server framework
- `nodemon` (dev) - Auto-restart on file changes

### 3. Run the server

**Production:**
```bash
npm start
```

**Development (with auto-reload):**
```bash
npm run dev
```

**With custom settings:**
```bash
PORT=8080 node api/server.js
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `OHIF_WORKSPACE_ROOT` | `syncforge/../..` | Workspace root directory |

**Example:**
```bash
export PORT=8080
export OHIF_WORKSPACE_ROOT=/var/medical-data
npm start
```

---

## Directory Structure

```
syncforge/
├── package.json              # Node.js dependencies
├── .gitignore               # Git ignore rules
├── README.md                # Full documentation
├── STANDALONE_SETUP.md      # This file
├── api/
│   ├── server.js           # Express server
│   └── saveMeasurementCSV.js # CSV/JSON handlers
└── studies/                # Data storage
    └── {StudyInstanceUID}/
        └── {SeriesInstanceUID}/
            ├── measurements-*.csv
            └── measurements-*.json
```

---

## API Endpoints

Once running, the server provides:

### Health Check
```bash
GET http://localhost:3001/api/health
```

### Save CSV
```bash
POST http://localhost:3001/api/syncforge/save-csv
Content-Type: application/json

{
  "studyInstanceUID": "1.2.3.4.5",
  "seriesInstanceUID": "1.2.3.4.5.6",
  "filename": "measurements-2025-11-07T22-00-00.csv",
  "csvContent": "Label,X,Y,Z\nF1,100,200,50"
}
```

### Save JSON
```bash
POST http://localhost:3001/api/syncforge/save-json
Content-Type: application/json

{
  "studyInstanceUID": "1.2.3.4.5",
  "seriesInstanceUID": "1.2.3.4.5.6",
  "filename": "measurements-2025-11-07T22-00-00.json",
  "jsonContent": { "measurements": [...] }
}
```

### List CSV Files
```bash
GET http://localhost:3001/api/syncforge/list-csv?studyInstanceUID=1.2.3.4.5&seriesInstanceUID=1.2.3.4.5.6
```

### Get CSV File
```bash
GET http://localhost:3001/api/syncforge/get-csv?studyInstanceUID=1.2.3.4.5&seriesInstanceUID=1.2.3.4.5.6&filename=measurements.csv
```

### List JSON Files
```bash
GET http://localhost:3001/api/syncforge/list-json?studyInstanceUID=1.2.3.4.5&seriesInstanceUID=1.2.3.4.5.6
```

### Get JSON File
```bash
GET http://localhost:3001/api/syncforge/get-json?studyInstanceUID=1.2.3.4.5&seriesInstanceUID=1.2.3.4.5.6&filename=measurements.json
```

---

## Deployment

### Option 1: PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
pm2 start api/server.js --name syncforge

# View logs
pm2 logs syncforge

# Restart
pm2 restart syncforge

# Stop
pm2 stop syncforge
```

### Option 2: Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t syncforge .
docker run -p 3001:3001 -v $(pwd)/studies:/app/studies syncforge
```

### Option 3: systemd Service (Linux)

Create `/etc/systemd/system/syncforge.service`:
```ini
[Unit]
Description=SyncForge Storage Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/syncforge
ExecStart=/usr/bin/node api/server.js
Restart=on-failure
Environment=PORT=3001
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable syncforge
sudo systemctl start syncforge
sudo systemctl status syncforge
```

---

## Integration with OHIF

To use SyncForge with OHIF Viewer:

1. **Ensure SyncForge is running** (on port 3001 by default)
2. **OHIF will automatically send** measurement data to SyncForge
3. **Files are saved** to `syncforge/studies/{StudyInstanceUID}/{SeriesInstanceUID}/`

No additional OHIF configuration needed - it's plug-and-play!

---

## Security Considerations

For production deployments:

1. **Add authentication:**
   - JWT tokens
   - API keys
   - OAuth2

2. **Enable HTTPS:**
   - Use a reverse proxy (nginx, Apache)
   - SSL/TLS certificates

3. **Limit CORS:**
   - Update `server.js` to restrict allowed origins
   - Change `'*'` to specific domain

4. **File validation:**
   - Already sanitizes filenames
   - Validates file extensions
   - Consider adding file size limits

5. **Rate limiting:**
   - Add express-rate-limit middleware

---

## Troubleshooting

### Port already in use
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different port
PORT=8080 npm start
```

### Permission denied (writing files)
```bash
# Ensure write permissions
chmod -R 755 syncforge/studies/
```

### Cannot find module 'express'
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Monitoring

Check server status:
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "workspaceRoot": "/path/to/syncforge/../..",
  "syncforgeDir": "/path/to/syncforge"
}
```

---

## License

MIT License - See LICENSE file

---

## Support

For issues or questions:
- GitHub Issues: [lifesync-robotics/Viewers](https://github.com/lifesync-robotics/Viewers)
- Email: support@example.com

