import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const db = new Database(path.join(root, 'rmgtube.db'));
const uploads = path.join(root, 'uploads');
fs.mkdirSync(uploads, { recursive: true });
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'marcelinotgilbert@gmail.com').trim().toLowerCase();
const isAdmin = (email) => String(email).trim().toLowerCase() === ADMIN_EMAIL;

db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS media(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,type TEXT NOT NULL,filename TEXT NOT NULL,mime TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);

try { db.exec("ALTER TABLE users ADD COLUMN admin INTEGER NOT NULL DEFAULT 0"); } catch {} db.prepare("UPDATE users SET admin=1 WHERE email=?").run(ADMIN_EMAIL);
if (process.env.ADMIN_PASSWORD) { const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12); const existing = db.prepare("SELECT id FROM users WHERE email=?").get(ADMIN_EMAIL); if (existing) db.prepare("UPDATE users SET password_hash=?, admin=1 WHERE email=?").run(hash, ADMIN_EMAIL); else db.prepare("INSERT INTO users(email,password_hash,admin) VALUES(?,?,1)").run(ADMIN_EMAIL, hash); }
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploads));
const upload = multer({ dest: uploads, limits: { fileSize: 500 * 1024 * 1024 } });

function requireAdmin(req,res,next){ if(!isAdmin(req.user.email)) return res.status(403).json({error:"Admin only"}); next(); }
function auth(req,res,next){
  const h=req.headers.authorization||''; const token=h.startsWith('Bearer ')?h.slice(7):null;
  if(!token) return res.status(401).json({error:'Authentication required'});
  try { req.user=jwt.verify(token,JWT_SECRET); next(); } catch { res.status(401).json({error:'Invalid token'}); }
}

app.get('/api/health',(req,res)=>res.json({ok:true,name:'RMGTUBE'}));
app.post('/api/auth/register', async (req,res)=>{
  const email=String(req.body.email||'').trim().toLowerCase(); const password=String(req.body.password||'');
  if(!/^\S+@\S+\.\S+$/.test(email)||password.length<6) return res.status(400).json({error:'Valid email and password (6+ characters) required'});
  try { const hash=await bcrypt.hash(password,12); const r=db.prepare('INSERT INTO users(email,password_hash) VALUES(?,?)').run(email,hash); const token=jwt.sign({id:r.lastInsertRowid,email},JWT_SECRET,{expiresIn:'7d'}); res.json({token,user:{id:r.lastInsertRowid,email}}); }
  catch { res.status(409).json({error:'Email already registered'}); }
});
app.post('/api/auth/login', async (req,res)=>{
  const email=String(req.body.email||'').trim().toLowerCase(); const password=String(req.body.password||'');
  const u=db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if(!u || !(await bcrypt.compare(password,u.password_hash))) return res.status(401).json({error:'Email or password incorrect'});
  const token=jwt.sign({id:u.id,email:u.email},JWT_SECRET,{expiresIn:'7d'}); res.json({token,user:{id:u.id,email:u.email,admin:(email === ADMIN_EMAIL || Boolean(u.admin))}});
});
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));
app.get('/api/media',(req,res)=>res.json(db.prepare('SELECT id,title,type,filename,mime,created_at FROM media ORDER BY id DESC').all()));
app.post('/api/media',auth,requireAdmin,upload.single('file'),(req,res)=>{
  if(!req.file||!req.body.title||!['audio','video'].includes(req.body.type)) return res.status(400).json({error:'title, type and file required'});
  const r=db.prepare('INSERT INTO media(title,type,filename,mime) VALUES(?,?,?,?)').run(req.body.title,req.body.type,req.file.filename,req.file.mimetype);
  res.json({id:r.lastInsertRowid,title:req.body.title,type:req.body.type,filename:req.file.filename});
});
app.get('/api/media/:id/download',auth,(req,res)=>{
  const m=db.prepare('SELECT * FROM media WHERE id=?').get(req.params.id); if(!m) return res.sendStatus(404);
  res.download(path.join(uploads,m.filename),m.title.replace(/[^a-z0-9._-]/gi,'_'));
});
app.listen(process.env.PORT||4000,()=>console.log('RMGTUBE API running on http://localhost:4000'));
