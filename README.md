# Yappio — Bursa'nın Hizmet Platformu

React + FastAPI ile tam çalışan hizmet platformu.

## Proje Yapısı

```
yappio/
├── backend/
│   ├── main.py          ← FastAPI uygulaması
│   ├── requirements.txt
│   ├── Procfile         ← Railway deploy
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   ├── index.css
    │   ├── components/  ← Navbar, ServiceCard
    │   ├── hooks/       ← useAuth
    │   └── pages/       ← Home, Auth, ServiceDetail, CreateService, Profile, Messages, Dashboard
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── vercel.json
```

## Özellikler

- Hizmet listeleme, arama, kategoriye ve ilçeye göre filtreleme
- Kullanıcı kaydı (hizmet alan / hizmet veren)
- JWT ile güvenli giriş
- Hizmet ilanı oluşturma, düzenleme, silme
- Hizmet detay sayfası + yorum sistemi
- Gerçek zamanlı mesajlaşma + teklif kartı
- Kullanıcı profil sayfası
- Dashboard (ilanlarım, favorilerim, profil düzenle)
- Bursa ilçelerine göre filtreleme

## Kurulum

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env         # .env içindeki SECRET_KEY'i değiştir
uvicorn main:app --reload
# → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
# → http://localhost:5173
```

## Deploy

### Backend → Railway (ücretsiz)
1. railway.app → GitHub repo ile bağlantı
2. Environment Variables ekle: SECRET_KEY, FRONTEND_URL
3. Otomatik deploy

### Frontend → Vercel (ücretsiz)
```bash
npm run build
npx vercel
# Environment Variable: VITE_API_URL=https://your-backend.railway.app
```
