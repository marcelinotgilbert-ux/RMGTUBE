import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const API=import.meta.env.VITE_API_URL||'https://rmgtube-1.onrender.com';
const LOGO='/rmgtube-logo.png';

function App(){
 const[token,setToken]=useState(localStorage.getItem('rmgtube_token')||'');
 const[mode,setMode]=useState('login');
 const[email,setEmail]=useState('');
 const[pw,setPw]=useState('');
 const[media,setMedia]=useState([]);
 const[err,setErr]=useState('');
 async function auth(e){
  e.preventDefault();setErr('');
  try{
   const r=await fetch(`${API}/api/auth/${mode}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})});
   const d=await r.json();
   if(!r.ok)return setErr(d.error||'Erreur');
   localStorage.setItem('rmgtube_token',d.token);setToken(d.token);
  }catch{setErr('Serveur indisponible.');}
 }
 async function load(){
  try{const r=await fetch(`${API}/api/media`);setMedia(await r.json())}catch{setMedia([])}
 }
 useEffect(()=>{load()},[]);
 if(!token)return <main className="auth">
  <div className="card">
   <img className="auth-logo" src={LOGO} alt="RMGTUBE"/>
   <p className="tagline">Clips • Musiques • Divertissement</p>
   <form onSubmit={auth}>
    <input type="email" placeholder="Adresse email" value={email} onChange={e=>setEmail(e.target.value)} required/>
    <input type="password" placeholder="Mot de passe" value={pw} onChange={e=>setPw(e.target.value)} required/>
    <button>{mode==='login'?'Connexion':'Créer un compte'}</button>
   </form>
   {err&&<b>{err}</b>}
   <a onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Créer un compte':'Efa manana kaonty? Hiditra'}</a>
  </div>
 </main>;
 return <>
  <header>
   <div className="brand"><img src={LOGO} alt="RMGTUBE"/><strong>RMGTUBE</strong></div>
   <button onClick={()=>{localStorage.removeItem('rmgtube_token');setToken('')}}>Déconnexion</button>
  </header>
  <main><h2>Hira sy Vidéo</h2><div className="grid">
   {media.map(m=><article key={m.id}>
    <h3>{m.title}</h3>
    {m.type==='video'?<video controls src={`${API}/uploads/${m.filename}`}/>:<audio controls src={`${API}/uploads/${m.filename}`}/>} 
    <a className="download" href={`${API}/api/media/${m.id}/download`} onClick={e=>{e.preventDefault();fetch(e.currentTarget.href,{headers:{Authorization:`Bearer ${token}`}}).then(r=>{if(!r.ok)throw new Error();return r.blob()}).then(b=>{const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=m.title;a.click();URL.revokeObjectURL(u)}).catch(()=>setErr('Téléchargement impossible.'))}}>⬇ Télécharger</a>
   </article>)}
  </div></main>
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
