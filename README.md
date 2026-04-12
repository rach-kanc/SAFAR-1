# SAFAR

SAFAR is a comprehensive Flask-based web application that combines two main components:

Safar: Travel group management, destination planning, and real-time group chat
Garuda Safety: Tourist registration, live safety tracking, geo-fencing, anomaly detection, and emergency alerts
The app includes optional IoT integration for device tracking and supports SMS notifications via Twilio.

Key Features
User Authentication: Registration/login with OTP verification (Twilio SMS or console fallback)
Travel Groups: Create and join groups, manage destinations, real-time chat
Safety Tracking: Tourist registration, GPS tracking, safety zones, anomaly alerts
Admin Dashboard: Administrative controls and monitoring
Blockchain Integration: Optional blockchain features for data integrity
IoT Support: Integration with Blynk for device connectivity (Arduino-based tracker included)
Technology Stack
Backend: Python Flask with SocketIO for real-time features
Database: PostgreSQL (Supabase) with SQLite fallback
Frontend: HTML templates with CSS/JS, real-time chat via WebSockets
External Services: Twilio (SMS), Blynk (IoT), Supabase (database)
Deployment: Configured for Render with Gunicorn
## Project Structure

```text
c:\Users\kanch\OneDrive\Desktop\SAFAR-1
├── .agent/
├── .dockerignore
├── .git/
├── .gitattributes
├── .gitignore
├── .playwright-cli/
├── 2e7c0547-1738-4061-bbe7-97344a6dd05a.json
├── app.py
├── cloudflared_config.yml
├── database.py
├── Dockerfile
├── iot_device/
│   └── safar_tracker.ino
├── output/
│   ├── app-5051.stderr.log
│   ├── app-5051.stdout.log
│   ├── app.stderr.log
│   ├── app.stdout.log
│   └── debug-app.log
├── Procfile
├── README.md
├── render.yaml
├── render_build.sh
├── requirements.txt
├── static/
│   ├── admin_dashboard.css
│   ├── auth.css
│   ├── blockchain.css
│   ├── dictionary-agent.js
│   ├── groups.css
│   ├── groups.js
│   ├── group_chat.css
│   ├── group_chat.js
│   ├── i18n.js
│   ├── images/
│   │   ├── airavat-system.svg
│   │   ├── airavat_bg.png
│   │   ├── dest_goa.png
│   │   ├── dest_jaipur.png
│   │   ├── dest_kerala.png
│   │   ├── dest_manali.png
│   │   ├── dest_varanasi.png
│   │   ├── garuda-system.svg
│   │   ├── garuda.png
│   │   ├── hero_bg.png
│   │   ├── mayurya-system.svg
│   │   └── mayurya.png
│   ├── index.css
│   ├── index.js
│   ├── mayurya-bubble.js
│   ├── profile.css
│   ├── profile.js
│   ├── script.js
│   ├── style.css
│   ├── translator-core.js
│   ├── translators/
│   │   ├── admin_dashboard.translator.js
│   │   ├── auth.translator.js
│   │   ├── blockchain.translator.js
│   │   ├── groups.translator.js
│   │   ├── group_chat.translator.js
│   │   ├── index.translator.js
│   │   ├── profile.translator.js
│   │   ├── travel.translator.js
│   │   └── user_dashboard.translator.js
│   ├── travel.css
│   ├── travel.js
│   └── user_dashboard.css
├── templates/
│   ├── admin_dashboard.html
│   ├── auth.html
│   ├── blockchain.html
│   ├── groups.html
│   ├── group_chat.html
│   ├── index.html
│   ├── profile.html
│   ├── travel.html
│   └── user_dashboard.html
├── test_n8n.py
├── test_supabase.py
└── tools/
    └── dictionary_agent.py
```

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure `.env`

```env
SECRET_KEY=your_flask_secret_key
ALLOW_UNSAFE_WERKZEUG=1
HOST=127.0.0.1
PORT=5050
REQUIRE_REMOTE_DB=1
ALLOW_SQLITE_FALLBACK=0

DATABASE_URL=postgresql+pg8000://postgres.<project-ref>:your_password@aws-<region>.pooler.supabase.com:5432/postgres
DB_CONNECT_TIMEOUT=20

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

BLYNK_AUTH_TOKEN=your_blynk_token
```

Twilio is optional. If it is not configured, OTPs are printed to the console.

Blynk is optional. The IoT polling loop only works when a token is configured for the user or in `BLYNK_AUTH_TOKEN`.

### 3. Run

```bash
python app.py
```

The local default is `http://127.0.0.1:5050`.

## Deployment

### Render start command

```bash
gunicorn --worker-class gthread --threads 100 --bind 0.0.0.0:$PORT app:app
```

### Required deployment env vars

- `SECRET_KEY`
- `DATABASE_URL`

## Main API Areas

- Auth: `/api/auth/...`
- OTP: `/api/otp/...`
- Travel groups: `/api/tt/...`
- Safety: `/api/safety/...`
- Admin: `/api/admin/...`

## Notes

- Special characters in the database password are supported.
- SQLite fallback is available only when `ALLOW_SQLITE_FALLBACK=1`.
