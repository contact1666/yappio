from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import time, os
import sqlite3
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "yappio-bursa-gizli-anahtar-degistir")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

app = FastAPI(title="Yappio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ── Veritabanı ──────────────────────────────────────────

def get_db():
    conn = sqlite3.connect("/data/yappio.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            bio TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            ilce TEXT DEFAULT '',
            avatar TEXT DEFAULT '',
            created_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT DEFAULT '',
            price TEXT DEFAULT '',
            price_unit TEXT DEFAULT 'saat',
            ilce TEXT DEFAULT '',
            logo_url TEXT DEFAULT '',
            created_at INTEGER,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id INTEGER,
            reviewer_id INTEGER,
            rating INTEGER DEFAULT 5,
            comment TEXT DEFAULT '',
            created_at INTEGER,
            FOREIGN KEY (service_id) REFERENCES services(id),
            FOREIGN KEY (reviewer_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            is_offer INTEGER DEFAULT 0,
            offer_price TEXT DEFAULT '',
            offer_service TEXT DEFAULT '',
            created_at INTEGER,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_id INTEGER,
            user_id INTEGER,
            FOREIGN KEY (service_id) REFERENCES services(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    db.commit()

init_db()

# ── Modeller ────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "user"
    phone: Optional[str] = ""
    ilce: Optional[str] = ""

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ServiceCreate(BaseModel):
    title: str
    category: str
    description: Optional[str] = ""
    price: Optional[str] = ""
    price_unit: Optional[str] = "saat"
    ilce: Optional[str] = ""
    logo_url: Optional[str] = ""

class ReviewCreate(BaseModel):
    service_id: int
    rating: int
    comment: Optional[str] = ""

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    is_offer: Optional[bool] = False
    offer_price: Optional[str] = ""
    offer_service: Optional[str] = ""

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    ilce: Optional[str] = None

# ── Auth yardımcıları ────────────────────────────────────

def hash_password(p): return pwd_context.hash(p)
def verify_password(p, h): return pwd_context.verify(p, h)

def create_token(data):
    d = data.copy()
    d["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(d, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if not uid: raise HTTPException(status_code=401, detail="Geçersiz token")
        db = get_db()
        user = db.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
        if not user: raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return dict(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

def optional_user(token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False))):
    if not token: return None
    try: return get_current_user(token)
    except: return None

# ── Auth ─────────────────────────────────────────────────

@app.post("/auth/register", response_model=Token)
def register(u: UserCreate):
    db = get_db()
    if db.execute("SELECT id FROM users WHERE email=?", (u.email,)).fetchone():
        raise HTTPException(400, "Bu e-posta zaten kayıtlı")
    cur = db.execute(
        "INSERT INTO users (name,email,password,role,phone,ilce,created_at) VALUES (?,?,?,?,?,?,?)",
        (u.name, u.email, hash_password(u.password), u.role, u.phone, u.ilce, int(time.time()))
    )
    db.commit()
    token = create_token({"sub": str(cur.lastrowid)})
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": cur.lastrowid, "name": u.name, "email": u.email, "role": u.role, "ilce": u.ilce}}

@app.post("/auth/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=?", (form.username,)).fetchone()
    if not user or not verify_password(form.password, user["password"]):
        raise HTTPException(401, "E-posta veya şifre hatalı")
    token = create_token({"sub": str(user["id"])})
    return {"access_token": token, "token_type": "bearer",
            "user": {k: v for k, v in dict(user).items() if k != "password"}}

@app.get("/auth/me")
def me(u=Depends(get_current_user)):
    return {k: v for k, v in u.items() if k != "password"}

@app.put("/auth/me")
def update_profile(data: ProfileUpdate, u=Depends(get_current_user)):
    db = get_db()
    fields, vals = [], []
    for k, v in data.dict(exclude_none=True).items():
        fields.append(f"{k}=?"); vals.append(v)
    if fields:
        db.execute(f"UPDATE users SET {','.join(fields)} WHERE id=?", (*vals, u["id"]))
        db.commit()
    return {"message": "Profil güncellendi"}

# ── Hizmetler ────────────────────────────────────────────

@app.get("/services")
def list_services(search: str = "", category: str = "", ilce: str = ""):
    db = get_db()
    q = """SELECT s.*, u.name as owner_name, u.ilce as owner_ilce,
           (SELECT AVG(rating) FROM reviews WHERE service_id=s.id) as avg_rating,
           (SELECT COUNT(*) FROM reviews WHERE service_id=s.id) as review_count
           FROM services s JOIN users u ON s.owner_id=u.id WHERE 1=1"""
    params = []
    if search:
        q += " AND (s.title LIKE ? OR s.description LIKE ? OR u.name LIKE ?)"
        params += [f"%{search}%"]*3
    if category:
        q += " AND s.category=?"; params.append(category)
    if ilce:
        q += " AND (s.ilce=? OR u.ilce=?)"; params += [ilce, ilce]
    q += " ORDER BY s.created_at DESC"
    return [dict(r) for r in db.execute(q, params).fetchall()]

@app.get("/services/{sid}")
def get_service(sid: int):
    db = get_db()
    row = db.execute("""SELECT s.*, u.name as owner_name, u.bio as owner_bio,
        u.phone as owner_phone, u.ilce as owner_ilce,
        (SELECT AVG(rating) FROM reviews WHERE service_id=s.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE service_id=s.id) as review_count
        FROM services s JOIN users u ON s.owner_id=u.id WHERE s.id=?""", (sid,)).fetchone()
    if not row: raise HTTPException(404, "Hizmet bulunamadı")
    result = dict(row)
    result["reviews"] = [dict(r) for r in db.execute(
        "SELECT r.*, u.name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id=u.id WHERE r.service_id=? ORDER BY r.created_at DESC",
        (sid,)).fetchall()]
    return result

@app.post("/services", status_code=201)
def create_service(s: ServiceCreate, u=Depends(get_current_user)):
    db = get_db()
    cur = db.execute(
        "INSERT INTO services (owner_id,title,category,description,price,price_unit,ilce,logo_url,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
        (u["id"], s.title, s.category, s.description, s.price, s.price_unit, s.ilce, s.logo_url, int(time.time()))
    )
    db.commit()
    return {"id": cur.lastrowid, "message": "Hizmet oluşturuldu"}

@app.put("/services/{sid}")
def update_service(sid: int, s: ServiceCreate, u=Depends(get_current_user)):
    db = get_db()
    svc = db.execute("SELECT * FROM services WHERE id=?", (sid,)).fetchone()
    if not svc: raise HTTPException(404, "Bulunamadı")
    if svc["owner_id"] != u["id"]: raise HTTPException(403, "Yetkiniz yok")
    db.execute("UPDATE services SET title=?,category=?,description=?,price=?,price_unit=?,ilce=?,logo_url=? WHERE id=?",
               (s.title, s.category, s.description, s.price, s.price_unit, s.ilce, s.logo_url, sid))
    db.commit()
    return {"message": "Hizmet güncellendi"}

@app.delete("/services/{sid}")
def delete_service(sid: int, u=Depends(get_current_user)):
    db = get_db()
    svc = db.execute("SELECT * FROM services WHERE id=?", (sid,)).fetchone()
    if not svc: raise HTTPException(404, "Bulunamadı")
    if svc["owner_id"] != u["id"]: raise HTTPException(403, "Yetkiniz yok")
    db.execute("DELETE FROM services WHERE id=?", (sid,))
    db.commit()
    return {"message": "Hizmet silindi"}

@app.get("/users/{uid}/services")
def user_services(uid: int):
    db = get_db()
    rows = db.execute("""SELECT s.*,
        (SELECT AVG(rating) FROM reviews WHERE service_id=s.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE service_id=s.id) as review_count
        FROM services s WHERE s.owner_id=? ORDER BY s.created_at DESC""", (uid,)).fetchall()
    return [dict(r) for r in rows]

@app.get("/users/{uid}")
def get_user(uid: int):
    db = get_db()
    user = db.execute("SELECT id,name,bio,ilce,phone,created_at FROM users WHERE id=?", (uid,)).fetchone()
    if not user: raise HTTPException(404, "Kullanıcı bulunamadı")
    return dict(user)

# ── Yorumlar ─────────────────────────────────────────────

@app.post("/reviews")
def add_review(r: ReviewCreate, u=Depends(get_current_user)):
    db = get_db()
    db.execute("INSERT INTO reviews (service_id,reviewer_id,rating,comment,created_at) VALUES (?,?,?,?,?)",
               (r.service_id, u["id"], r.rating, r.comment, int(time.time())))
    db.commit()
    return {"message": "Yorum eklendi"}

# ── Mesajlar ─────────────────────────────────────────────

@app.get("/messages/conversations")
def conversations(u=Depends(get_current_user)):
    db = get_db()
    rows = db.execute("""
        SELECT
            CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END as other_id,
            u.name as other_name,
            m.content as last_message,
            m.created_at as last_time
        FROM messages m
        JOIN users u ON u.id = CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END
        WHERE m.sender_id=? OR m.receiver_id=?
        GROUP BY other_id
        ORDER BY last_time DESC
    """, (u["id"], u["id"], u["id"], u["id"])).fetchall()
    return [dict(r) for r in rows]
@app.get("/messages/{other_id}")
def get_messages(other_id: int, u=Depends(get_current_user)):
    db = get_db()
    rows = db.execute("""SELECT m.*, u.name as sender_name FROM messages m
        JOIN users u ON m.sender_id=u.id
        WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
        ORDER BY m.created_at ASC""",
        (u["id"], other_id, other_id, u["id"])).fetchall()
    return [dict(r) for r in rows]

@app.post("/messages")
def send_message(msg: MessageCreate, u=Depends(get_current_user)):
    db = get_db()
    db.execute("INSERT INTO messages (sender_id,receiver_id,content,is_offer,offer_price,offer_service,created_at) VALUES (?,?,?,?,?,?,?)",
               (u["id"], msg.receiver_id, msg.content, int(msg.is_offer), msg.offer_price, msg.offer_service, int(time.time())))
    db.commit()
    return {"message": "Mesaj gönderildi"}

# ── Favoriler ────────────────────────────────────────────

@app.post("/favorites/{sid}")
def toggle_favorite(sid: int, u=Depends(get_current_user)):
    db = get_db()
    existing = db.execute("SELECT id FROM favorites WHERE service_id=? AND user_id=?", (sid, u["id"])).fetchone()
    if existing:
        db.execute("DELETE FROM favorites WHERE service_id=? AND user_id=?", (sid, u["id"]))
        db.commit(); return {"favorited": False}
    db.execute("INSERT INTO favorites (service_id,user_id) VALUES (?,?)", (sid, u["id"]))
    db.commit(); return {"favorited": True}

@app.get("/favorites/my")
def my_favorites(u=Depends(get_current_user)):
    db = get_db()
    rows = db.execute("""SELECT s.* FROM favorites f JOIN services s ON f.service_id=s.id
        WHERE f.user_id=? ORDER BY f.id DESC""", (u["id"],)).fetchall()
    return [dict(r) for r in rows]

# ── Dashboard ────────────────────────────────────────────

@app.get("/dashboard/stats")
def dashboard_stats(u=Depends(get_current_user)):
    db = get_db()
    service_ids = [r["id"] for r in db.execute("SELECT id FROM services WHERE owner_id=?", (u["id"],)).fetchall()]
    total_reviews = 0
    avg_rating = 0
    if service_ids:
        placeholders = ",".join("?" * len(service_ids))
        total_reviews = db.execute(f"SELECT COUNT(*) as c FROM reviews WHERE service_id IN ({placeholders})", service_ids).fetchone()["c"]
        avg = db.execute(f"SELECT AVG(rating) as a FROM reviews WHERE service_id IN ({placeholders})", service_ids).fetchone()["a"]
        avg_rating = round(avg, 1) if avg else 0
    return {
        "total_services": len(service_ids),
        "total_reviews": total_reviews,
        "avg_rating": avg_rating,
        "member_since": u["created_at"],
    }

@app.get("/")
def root():
    return {"message": "Yappio API — Bursa'nın Hizmet Platformu", "docs": "/docs"}
