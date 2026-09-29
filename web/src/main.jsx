import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const API=import.meta.env.VITE_API_URL||'https://rmgtube-1.onrender.com';
const LOGO='/rmgtube-logo.png';

function App(){
 const[token,setToken]=useState(localStorage.getItem('rmgtube_token')||'');
 const[isAdmin,setIsAdmin]=useState(localStorage.getItem('rmgtube_admin')==='1');
 const[adminMode,setAdminMode]=useState(false);
 const[mode,setMode]=useState('login');
 const[email,setEmail]=useState('');
 const[pw,setPw]=useState('');
 const[media,setMedia]=useState([]); const[search,setSearch]=useState('');
 const[err,setErr]=useState('');
 const[message,setMessage]=useState('');
 const[title,setTitle]=useState('');
 const[type,setType]=useState('video');
 const[file,setFile]=useState(null);
 const[uploading,setUploading]=useState(false);

 async function auth(e){
  e.preventDefault();
  setErr('');
  try{
   const r=await fetch(`${API}/api/auth/${mode}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email,password:pw})
   });
   const d=await r.json();

   if(!r.ok)return setErr(d.error||'Erreur');

   localStorage.setItem('rmgtube_token',d.token);
   localStorage.setItem('rmgtube_admin',d.user?.admin?'1':'0');

   setToken(d.token);
   setIsAdmin(Boolean(d.user?.admin));
  }catch{
   setErr('Serveur indisponible.');
  }
 }

 async function load(){
  try{
   const r=await fetch(`${API}/api/media`);
   setMedia(await r.json());
  }catch{
   setMedia([]);
  }
 }

 useEffect(()=>{
  load();
 },[]);

 function logout(){
  localStorage.removeItem('rmgtube_token');
  localStorage.removeItem('rmgtube_admin');
  setToken('');
  setIsAdmin(false);
  setAdminMode(false);
 }

 async function uploadMedia(e){
  e.preventDefault();
  setErr('');
  setMessage('');

  if(!title||!file){
   return setErr('Ampidiro ny titre sy ny fichier.');
  }

  setUploading(true);

  try{
   const form=new FormData();
   form.append('title',title);
   form.append('type',type);
   form.append('file',file);

   const r=await fetch(`${API}/api/media`,{
    method:'POST',
    headers:{
     Authorization:`Bearer ${token}`
    },
    body:form
   });

   const d=await r.json();

   if(!r.ok){
    throw new Error(d.error||'Upload impossible');
   }

   setMessage('✅ Fichier nampidirina soa aman-tsara.');
   setTitle('');
   setFile(null);
   e.target.reset();
   await load();
  }catch(error){
   setErr(error.message||'Upload impossible.');
  }finally{
   setUploading(false);
  }
 }

 if(!token)return <main className="auth">
  <div className="card">
   <img className="auth-logo" src={LOGO} alt="RMGTUBE"/>
   <p className="tagline">Clips • Musiques • Divertissement</p>

   <form onSubmit={auth}>
    <input
     type="email"
     placeholder="Adresse email"
     value={email}
     onChange={e=>setEmail(e.target.value)}
     required
    />

    <input
     type="password"
     placeholder="Mot de passe"
     value={pw}
     onChange={e=>setPw(e.target.value)}
     required
    />

    <button type="submit">
     {mode==='login'?'Connexion':'Créer un compte'}
    </button>
   </form>

   {err&&<b>{err}</b>}

   <a onClick={()=>setMode(mode==='login'?'register':'login')}>
    {mode==='login'
     ?'Créer un compte'
     :'Efa manana kaonty? Hiditra'}
   </a>
  </div>
 </main>;

 return <>
  <header>
   <div className="brand">
    <img src={LOGO} alt="RMGTUBE"/>
    <strong>RMGTUBE</strong>
   </div>

   <div>
    {isAdmin&&(
     <button onClick={()=>setAdminMode(!adminMode)}>
      ⚙ Admin
     </button>
    )}

    <button onClick={logout}>
     Déconnexion
    </button>
   </div>
  </header>

  {isAdmin&&adminMode&&(
   <main>
    <div className="card">
     <h2>⚙ Administration RMGTUBE</h2>

     <form onSubmit={uploadMedia}>
      <input
       type="text"
       placeholder="Titre du fichier"
       value={title}
       onChange={e=>setTitle(e.target.value)}
       required
      />

      <select
       value={type}
       onChange={e=>setType(e.target.value)}
      >
       <option value="video">🎬 Vidéo</option>
       <option value="audio">🎵 Musique / Audio</option>
      </select>

      <input
       type="file"
       accept={type==='video'?'video/*':'audio/*'}
       onChange={e=>setFile(e.target.files?.[0]||null)}
       required
      />

      <button type="submit" disabled={uploading}>
       {uploading?'⏳ Upload en cours...':'⬆️ Publier'}
      </button>
     </form>

     {message&&<p>{message}</p>}
     {err&&<b>{err}</b>}
    </div>
   </main>
  )}

  <main>
   <h2>Hira sy Vidéo</h2><input type="search" placeholder="🔍 Mitadiava hira na vidéo..." value={search} onChange={e=>setSearch(e.target.value)} />

   <div className="grid">
    {media.filter(m=>m.title.toLowerCase().includes(search.toLowerCase())).map(m=>
     <article key={m.id}>
      <h3>{m.title}</h3>

      {m.type==='video'
       ?<video controls src={`${API}/uploads/${m.filename}`}/>
       :<audio controls src={`${API}/uploads/${m.filename}`}/>
      }

      <a
       className="download"
       href={`${API}/api/media/${m.id}/download`}
       onClick={e=>{
        e.preventDefault();

        fetch(e.currentTarget.href,{
         headers:{
          Authorization:`Bearer ${token}`
         }
        })
        .then(r=>{
         if(!r.ok)throw new Error();
         return r.blob();
        })
        .then(b=>{
         const u=URL.createObjectURL(b);
         const a=document.createElement('a');
         a.href=u;
         a.download=m.title;
         a.click();
         URL.revokeObjectURL(u);
        })
        .catch(()=>setErr('Téléchargement impossible.'));
       }}
      >
       ⬇ Télécharger
      </a>
     </article>
    )}
   </div>
  </main>
 </>;
}

createRoot(document.getElementById('root')).render(<App/>);
