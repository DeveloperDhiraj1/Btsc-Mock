# Deploy Guide — Render (backend) + Vercel (frontend)

Step-by-step deployment. Do these in order.

---

## 0. Pre-flight (do BEFORE pushing to GitHub)

### 0.1 Rotate secrets you've shared in screenshots / chat
Anything that ever appeared in a screenshot, chat, or log is compromised — rotate them all:

- **MongoDB Atlas** → Database Access → edit user `dhirajsingh26206_db_user` → "Edit Password" → autogenerate → save the new password somewhere safe.
- **Cloudinary** → Settings → Security → "Regenerate API Secret".
- **Razorpay** → Settings → API Keys → generate fresh test/live keys.
- **Gmail App Password** → https://myaccount.google.com/apppasswords → revoke `tabsnrflmujbgtbq`, create new.
- **Gemini key** → https://aistudio.google.com/ → delete old, create new.
- **OpenAI key** → https://platform.openai.com/api-keys → revoke and create new.
- **Firebase Web API key** → not really a secret (it's restricted by domain), but verify Authorized Domains list in Firebase Console.

### 0.2 Generate fresh JWT and encryption secrets
```bash
cd backend
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log('SETTINGS_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```
Save these — you'll paste them into Render in step 2.4. **Do not reuse the values committed to `.env.production` in this repo** (they were generated once and are treated as compromised the moment they hit git).

### 0.3 Verify `.gitignore` is working
```bash
git status
git ls-files | grep -i "\.env"   # should print nothing except .env.example
```
If `.env.development` or `.env.production` show up, **stop** — fix `.gitignore` and `git rm --cached <file>` before pushing.

---

## 1. MongoDB Atlas

1. https://cloud.mongodb.com → your cluster → **Network Access**
2. Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`)
   *(Render uses dynamic egress IPs; whitelisting all is the normal pattern. Mongo auth still protects the data.)*
3. Database Access → ensure the rotated user has `readWrite` on `btsc_mock`.

---

## 2. Render — Backend deploy

### 2.1 Push code to GitHub
```bash
git add -A
git commit -m "production-ready config"
git push origin main
```

### 2.2 Create the service
- https://dashboard.render.com → "New +" → **"Blueprint"**
- Connect your GitHub repo → Render finds `render.yaml` automatically.
- Confirm the service name → **Apply**.

### 2.3 (Or, if not using Blueprint) Manual setup
- "New +" → "Web Service" → connect repo.
- Name: `btsc-mock-backend`
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Health Check Path: `/health`

### 2.4 Add environment variables (Dashboard → Environment)
Paste the rotated/generated values from step 0:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | (leave blank for now — fill after step 3) |
| `MONGODB_URI` | new connection string with rotated password and DB name `btsc_mock` |
| `JWT_SECRET` | fresh hex from 0.2 |
| `JWT_REFRESH_SECRET` | fresh hex from 0.2 |
| `SETTINGS_ENCRYPTION_KEY` | fresh hex from 0.2 |
| `FIREBASE_WEB_API_KEY` | from Firebase Console → Project Settings → Web API Key |
| `GEMINI_API_KEY` | new key |
| `USE_GEMINI_MOCK` | `false` |
| `USE_REDIS_MOCK` | `true` (Render free has no Redis) |
| `CLOUDINARY_CLOUD_NAME` | rotated |
| `CLOUDINARY_API_KEY` | rotated |
| `CLOUDINARY_API_SECRET` | rotated |
| `USE_CLOUDINARY_MOCK` | `false` (**important — disk is ephemeral**) |
| `EMAIL_USER` | rotated |
| `EMAIL_PASS` | rotated app password |
| `EMAIL_FROM` | same as EMAIL_USER |
| `USE_EMAIL_MOCK` | `false` |
| `RAZORPAY_KEY_ID` | rotated |
| `RAZORPAY_KEY_SECRET` | rotated |
| `USE_RAZORPAY_MOCK` | `false` for live, `true` for test mode |

### 2.5 Deploy
- Hit "Manual Deploy" → "Deploy latest commit".
- Watch the log. On success you'll see: `Server started in production mode on port 10000`.
- Visit `https://<your-service>.onrender.com/health` → should return `{"status":"healthy","env":"production"}`.

**Note the backend URL** — you'll need it in step 3.

---

## 3. Vercel — Frontend deploy

### 3.1 Create project
- https://vercel.com/new → import the same GitHub repo.
- Root Directory: `frontend`
- Framework Preset: **Vite** (auto-detected).
- Build Command: `npm run build` (default)
- Output Directory: `dist` (default)

### 3.2 Environment variables
| Key | Value |
|---|---|
| `VITE_API_URL` | `https://<your-render-service>.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://<your-render-service>.onrender.com` |
| `VITE_APP_TITLE` | `BTSC Mock` |
| `VITE_FIREBASE_API_KEY` | from Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | from Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | from Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from Firebase |
| `VITE_FIREBASE_APP_ID` | from Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | from Firebase (optional) |

### 3.3 Deploy
- Click "Deploy". After ~1 min, note the URL — e.g. `https://btsc-mock.vercel.app`.

---

## 4. Connect the two

### 4.1 Update Render `FRONTEND_URL`
- Render dashboard → backend service → Environment → set `FRONTEND_URL` to your Vercel URL (e.g. `https://btsc-mock.vercel.app`). Multiple origins allowed: `https://btsc-mock.vercel.app,https://btsc-mock-git-main-you.vercel.app` if you want preview deploys to work.
- Render auto-redeploys on env-var change.

### 4.2 Firebase Authorized Domains
- Firebase Console → Authentication → Settings → **Authorized domains**
- Add your Vercel domain (e.g. `btsc-mock.vercel.app`). Google sign-in popup fails silently if missing.

---

## 5. Create the admin user (production DB)

SSH into Render's "Shell" tab (paid plans) **or** run locally against the production DB:
```bash
cd backend
NODE_ENV=production MONGODB_URI="<prod-uri>" \
  node scripts/setAdmin.js admin@yourdomain.com 'StrongPasswordHere!1' "Admin Name"
```

Login at the Vercel URL with those creds.

---

## 6. Verification checklist

- [ ] `GET https://backend.onrender.com/health` → 200
- [ ] Frontend loads at Vercel URL
- [ ] Register a new student → OTP arrives in email (or check logs if `USE_EMAIL_MOCK=true`)
- [ ] Login → access token issued, refresh cookie set, sticks across reload
- [ ] Google sign-in popup completes successfully
- [ ] Admin login → admin panel routes load
- [ ] Profile-image upload → Cloudinary URL returned (not `localhost:5000/uploads/...`)
- [ ] No `PROD WARNING:` lines in Render logs

---

## Known limitations on Render free tier

1. **Cold starts** — service sleeps after 15 min idle. First request takes ~30s to wake. Upgrade plan or use a cron-pinger if this hurts UX.
2. **Ephemeral filesystem** — `backend/uploads/` is wiped on every redeploy. That's why `USE_CLOUDINARY_MOCK=false` is required.
3. **No Redis** — keep `USE_REDIS_MOCK=true` or provision Upstash separately.
4. **Same-browser multi-account** — known limitation, see app architecture notes. Use separate browsers / profiles for admin + student during testing.

---

## Rollback

If a deploy breaks:
- Render → service → "Manual Deploy" → pick a previous successful commit → deploy.
- Vercel auto-keeps the last 100 deploys — promote one from the Deployments tab.
