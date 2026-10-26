import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Bell, CalendarDays, Check, ChevronDown, CircleHelp, Hash, LogOut, MapPin, Menu, MessageCircle, Mic, Paperclip, Plus, Send, Settings, ShieldCheck, Sparkles, Users, Volume2, X } from 'lucide-react';
import './styles.css';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const initials = (s='You') => s.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join('');
const time = (v) => new Date(v).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
const dateTime = (v) => new Date(v).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const prettyAlarmDate = (v) => new Date(v).toLocaleDateString([], {weekday:'long',year:'numeric',month:'long',day:'numeric'});
const sampleRooms = [{id:'demo-1', name:'Weekend Crew', code:'672536', description:'Plans, updates and random stuff', members:8}, {id:'demo-2', name:'School Project', code:'481205', description:'Keep the team in sync', members:5}];
const sampleMessages = {'demo-1':[{id:'m1',user_name:'Maya',content:'Hey everyone! Are we still meeting this weekend?',created_at:new Date(Date.now()-3600000).toISOString()},{id:'m2',user_name:'You',content:'Yep! I’ll post the details here 🙌',created_at:new Date(Date.now()-3000000).toISOString()}]};
const sampleEvents = {'demo-1':[{id:'e1',title:'Weekend meetup',details:'Bring anything you want to share.',venue:'Community centre',starts_at:new Date(Date.now()+86400000).toISOString(),room_id:'demo-1'}]};


function Offline2048({onBack}){
  const spawn=b=>{const e=b.map((v,i)=>v===0?i:-1).filter(i=>i>=0);if(e.length)b[e[Math.floor(Math.random()*e.length)]]=Math.random()<.9?2:4;return b;};
  const fresh=()=>spawn(spawn(Array(16).fill(0)));
  const [board,setBoard]=useState(fresh),[score,setScore]=useState(0),[best,setBest]=useState(()=>Number(localStorage.getItem('cc-best')||0)),[over,setOver]=useState(false);
  const shift=dir=>{if(over)return;let next=board.slice(),gained=0;
    for(let line=0;line<4;line++){let ids=[];
      for(let p=0;p<4;p++){let r=dir==='up'?p:dir==='down'?3-p:line,c=dir==='left'?p:dir==='right'?3-p:line;ids.push(dir==='left'||dir==='right'?line*4+c:r*4+line);}
      let vals=ids.map(i=>next[i]).filter(Boolean);
      for(let i=0;i<vals.length-1;i++)if(vals[i]===vals[i+1]){vals[i]*=2;gained+=vals[i];vals.splice(i+1,1);}
      while(vals.length<4)vals.push(0);ids.forEach((id,i)=>next[id]=vals[i]);
    }
    if(next.every((v,i)=>v===board[i]))return;
    next=spawn(next);const ns=score+gained,nb=Math.max(best,ns);setScore(ns);setBest(nb);localStorage.setItem('cc-best',String(nb));setBoard(next);
    const movable=next.some(v=>!v)||next.some((v,i)=>i%4<3&&v===next[i+1])||next.some((v,i)=>i<12&&v===next[i+4]);if(!movable)setOver(true);
  };
  useEffect(()=>{const fn=e=>{const m={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'};if(m[e.key]){e.preventDefault();shift(m[e.key]);}};let start=null;
    const ts=e=>{start=[e.touches[0].clientX,e.touches[0].clientY];};const te=e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start[0],dy=e.changedTouches[0].clientY-start[1];if(Math.max(Math.abs(dx),Math.abs(dy))>25)shift(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));start=null;};
    window.addEventListener('keydown',fn);window.addEventListener('touchstart',ts,{passive:true});window.addEventListener('touchend',te,{passive:true});return()=>{window.removeEventListener('keydown',fn);window.removeEventListener('touchstart',ts);window.removeEventListener('touchend',te);};});
  return <section className="offline-game"><div className="game-top"><button className="outline-btn" onClick={onBack}>← Back to ClearChat</button><span className="offline-pill">● Offline game</span></div><div className="game-title"><div><span className="eyebrow">NO INTERNET? NO PROBLEM.</span><h2>2048</h2><p>Slide tiles, combine matching numbers, and reach 2048.</p></div><div className="scores"><div><span>SCORE</span><b>{score}</b></div><div><span>BEST</span><b>{best}</b></div></div></div><div className="board-2048">{board.map((v,i)=><div className={'tile '+(v?'tile-'+Math.min(v,2048):'')} key={i}>{v||''}</div>)}</div><div className="game-controls"><button onClick={()=>shift('up')}>↑</button><div><button onClick={()=>shift('left')}>←</button><button onClick={()=>shift('down')}>↓</button><button onClick={()=>shift('right')}>→</button></div></div><p className="game-help">Use arrow keys or WASD, or swipe on a touchscreen. Matching tiles merge when they touch.</p>{over&&<div className="game-over"><h3>Game over!</h3><p>Your score: {score}</p><button className="primary-btn" onClick={()=>{setBoard(fresh());setScore(0);setOver(false);}}>Play again</button></div>}<button className="text-btn" onClick={()=>{setBoard(fresh());setScore(0);setOver(false);}}>New game ↻</button></section>;
}

function App(){
  const [profile,setProfile]=useState(()=>({name:localStorage.getItem('cc-name')||'',email:localStorage.getItem('cc-email')||''}));
  const [user,setUser]=useState(null);
  const [rooms,setRooms]=useState(sampleRooms);
  const [active,setActive]=useState('demo-1');
  const [messages,setMessages]=useState(sampleMessages);
  const [events,setEvents]=useState(sampleEvents);
  const [draft,setDraft]=useState('');
  const [roomModal,setRoomModal]=useState(false);
  const [eventModal,setEventModal]=useState(false);
  const [joinMode,setJoinMode]=useState(false);
  const [roomName,setRoomName]=useState('');
  const [roomCode,setRoomCode]=useState('');
  const [eventForm,setEventForm]=useState({title:'',details:'',venue:'',starts_at:''});
  const [tab,setTab]=useState('chat');
  const [isOffline,setIsOffline]=useState(!navigator.onLine);
  const [showGame,setShowGame]=useState(false);
  const [alarmEvent,setAlarmEvent]=useState(null);
  const [notice,setNotice]=useState('');
  const [mobileMenu,setMobileMenu]=useState(false);
  const [recording,setRecording]=useState(false);
  const [audioUrl,setAudioUrl]=useState('');
  const [isConfigured]=useState(Boolean(supabase));
  const bottomRef=useRef(null);
  const mediaRef=useRef(null);
  const chunksRef=useRef([]);
  const currentRoom=rooms.find(r=>r.id===active)||rooms[0];
  const roomMessages=messages[active]||[];
  const roomEvents=events[active]||[];


  useEffect(()=>{
    const online=()=>setIsOffline(false),offline=()=>{setIsOffline(true);setShowGame(true);};
    window.addEventListener('online',online);window.addEventListener('offline',offline);
    if('serviceWorker' in navigator)navigator.serviceWorker.register('/public-sw.js').catch(()=>{});
    const onMessage=e=>{if(e.data?.type==='CLEARCHAT_ACK')setAlarmEvent(null);else if(e.data?.type==='CLEARCHAT_OPEN')setAlarmEvent(e.data.data||null);};
    navigator.serviceWorker?.addEventListener('message',onMessage);
    return()=>{window.removeEventListener('online',online);window.removeEventListener('offline',offline);navigator.serviceWorker?.removeEventListener('message',onMessage);};
  },[]);
  useEffect(()=>{
    if(!alarmEvent)return;let ctx,osc,gain;
    try{ctx=new(window.AudioContext||window.webkitAudioContext)();osc=ctx.createOscillator();gain=ctx.createGain();osc.type='square';osc.frequency.value=880;gain.gain.value=.025;osc.connect(gain);gain.connect(ctx.destination);osc.start();}catch{}
    const id=setInterval(()=>{try{osc?.frequency.setValueAtTime(osc.frequency.value===880?660:880,ctx.currentTime);}catch{}},350);
    return()=>{clearInterval(id);try{osc?.stop();ctx?.close();}catch{}};
  },[alarmEvent]);

  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>{if(data.session){setUser(data.session.user);setProfile(p=>({...p,email:data.session.user.email||p.email}));}});
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  // Electron returns from the email link through the clearchat:// deep link.
  useEffect(()=>{
    if(!supabase || !window.clearchatDesktop?.isDesktop) return;
    const handleAuthUrl=async(rawUrl)=>{
      try {
        const url=new URL(rawUrl);
        const errorDescription=url.searchParams.get('error_description');
        if(errorDescription){setNotice(decodeURIComponent(errorDescription.replace(/\+/g,' ')));return;}
        const code=url.searchParams.get('code');
        if(code){
          const {error}=await supabase.auth.exchangeCodeForSession(code);
          setNotice(error?`Desktop sign-in failed: ${error.message}`:'Signed in to ClearChat desktop!');
          return;
        }
        const hash=new URLSearchParams(url.hash.replace(/^#/,' '));
        const access_token=hash.get('access_token'),refresh_token=hash.get('refresh_token');
        if(access_token&&refresh_token){
          const {error}=await supabase.auth.setSession({access_token,refresh_token});
          setNotice(error?`Desktop sign-in failed: ${error.message}`:'Signed in to ClearChat desktop!');
        } else setNotice('The sign-in link did not contain a session code. Request a fresh link.');
      } catch(e){setNotice('Could not complete desktop sign-in. Request a fresh email link.');}
    };
    const unsubscribe=window.clearchatDesktop.onAuthCallback(handleAuthUrl);
    return unsubscribe;
  },[]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[roomMessages.length,active]);
  useEffect(()=>{
    if(!supabase||!user) return;
    let alive=true;
    (async()=>{
      const {data:memberships}=await supabase.from('room_members').select('room_id, rooms(id,name,code,description)').eq('user_id',user.id);
      if(!alive||!memberships) return;
      const loaded=memberships.map(x=>({...x.rooms,members:0}));
      if(loaded.length){setRooms(loaded);setActive(loaded[0].id);}
      const ids=loaded.map(r=>r.id);
      if(ids.length){
        const {data:msgs}=await supabase.from('messages').select('*').in('room_id',ids).order('created_at');
        if(msgs){const grouped={};msgs.forEach(m=>(grouped[m.room_id]??=[]).push(m));setMessages(grouped);}
        const {data:evs}=await supabase.from('events').select('*').in('room_id',ids).order('starts_at');
        if(evs){const grouped={};evs.forEach(e=>(grouped[e.room_id]??=[]).push(e));setEvents(grouped);}
      }
    })();
    return ()=>{alive=false;};
  },[user]);
  useEffect(()=>{
    if(!supabase||!user||!active) return;
    const channel=supabase.channel('room-'+active)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'room_id=eq.'+active},payload=>{
        setMessages(prev=>({...prev,[active]:[...(prev[active]||[]).filter(m=>m.id!==payload.new.id),payload.new]}));
      })
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'events',filter:'room_id=eq.'+active},payload=>{
        setEvents(prev=>({...prev,[active]:[...(prev[active]||[]).filter(e=>e.id!==payload.new.id),payload.new]}));
      }).subscribe();
    return ()=>{supabase.removeChannel(channel);};
  },[active,user]);

  useEffect(()=>{
    // Browser reminders only run while this tab/app is open. Push notifications need server-side scheduling.
    const check=()=>{
      const now=Date.now();
      Object.values(events).flat().forEach(e=>{
        const starts=new Date(e.starts_at).getTime();
        const key='cc-reminded-'+e.id;
        if(starts-now<=30*60*1000 && starts-now>29*60*1000 && !sessionStorage.getItem(key)){
          sessionStorage.setItem(key,'1');
          const msg=`${e.title} starts in about 30 minutes${e.venue?' at '+e.venue:''}.`;
          setNotice(msg);
          setAlarmEvent({eventId:e.id,title:e.title,venue:e.venue,startsAt:dateTime(e.starts_at),date:prettyAlarmDate(e.starts_at)});
          if('Notification' in window && Notification.permission==='granted') {
            navigator.serviceWorker?.ready.then(reg=>reg.showNotification('ClearChat event reminder',{body:`Venue: ${e.venue} · Time It Starts: ${dateTime(e.starts_at)} · Date: ${prettyAlarmDate(e.starts_at)}`,tag:`clearchat-event-${e.id}`,requireInteraction:true,actions:[{action:'ack',title:'Got The Message'},{action:'snooze',title:'Do It Later'}],data:{eventId:e.id,title:e.title,venue:e.venue,startsAt:dateTime(e.starts_at)}})).catch(()=>{});
          }
        }
      });
    };
    check(); const id=setInterval(check,60000); return ()=>clearInterval(id);
  },[events]);

  const askNotifications=async()=>{if(!('Notification' in window)){setNotice('This browser does not support notifications.');return;} const p=await Notification.requestPermission();setNotice(p==='granted'?'Notifications enabled for this browser.':'Notifications were not enabled.');};
  const signIn=async()=>{
    if(!supabase){setNotice('Add your Supabase URL and key in .env to enable online accounts. Demo mode is active.');return;}
    if(!profile.email.includes('@')){setNotice('Enter a valid email address first.');return;}
    const redirectTo=window.clearchatDesktop?.isDesktop?'clearchat://auth/callback':window.location.origin;
    const {error}=await supabase.auth.signInWithOtp({email:profile.email,options:{emailRedirectTo:redirectTo}});
    setNotice(error?error.message:'Magic sign-in link sent! Check your email.');
  };
  const signOut=async()=>{if(supabase) await supabase.auth.signOut();setUser(null);setNotice('Signed out.');};
  const createRoom=async()=>{
    if(!roomName.trim())return;
    const code=String(Math.floor(100000+Math.random()*900000));
    if(supabase&&user){
      const {data,error}=await supabase.from('rooms').insert({name:roomName.trim(),code,created_by:user.id}).select().single();
      if(error){setNotice(error.message);return;}
      const {error:memberError}=await supabase.from('room_members').insert({room_id:data.id,user_id:user.id});
      if(memberError){setNotice(memberError.message);return;}
      setRooms(r=>[...r,{...data,members:1}]);setActive(data.id);
    }else{
      const room={id:'local-'+Date.now(),name:roomName.trim(),code,description:'Your new room',members:1};
      setRooms(r=>[room,...r]);setMessages(m=>({...m,[room.id]:[]}));setEvents(e=>({...e,[room.id]:[]}));setActive(room.id);
    }
    setRoomModal(false);setRoomName('');setNotice('Room created! Share code '+code+' with your group.');
  };
  const joinRoom=async()=>{
    const code=roomCode.trim();
    if(!/^\\d{6}$/.test(code)){setNotice('Enter a six-digit room code.');return;}
    if(supabase&&user){
      const {data:room,error}=await supabase.from('rooms').select('*').eq('code',code).single();
      if(error||!room){setNotice('Room not found. Check the code and try again.');return;}
      const {error:joinError}=await supabase.from('room_members').upsert({room_id:room.id,user_id:user.id});
      if(joinError){setNotice(joinError.message);return;}
      setRooms(r=>r.some(x=>x.id===room.id)?r:[room,...r]);setActive(room.id);
    }else{
      const room=sampleRooms.find(r=>r.code===code)||rooms.find(r=>r.code===code);
      if(!room){setNotice('Demo mode can join the sample code 672536 or rooms created in this browser. Connect Supabase for shared online rooms.');return;}
      setActive(room.id);
    }
    setRoomModal(false);setJoinMode(false);setRoomCode('');setNotice('You joined the room!');
  };
  const sendMessage=async()=>{
    if(!draft.trim())return;
    const row={room_id:active,user_id:user?.id||null,user_name:profile.name||user?.email?.split('@')[0]||'You',content:draft.trim()};
    if(supabase&&user&&!active.startsWith('demo-')&&!active.startsWith('local-')){
      const {data,error}=await supabase.from('messages').insert(row).select().single();
      if(error){setNotice(error.message);return;}
      setMessages(m=>({...m,[active]:[...(m[active]||[]),data]}));
    }else setMessages(m=>({...m,[active]:[...(m[active]||[]),{...row,id:'m-'+Date.now(),created_at:new Date().toISOString()}]}));
    setDraft('');
  };
  const createEvent=async()=>{
    if(!eventForm.title.trim()||!eventForm.starts_at||!eventForm.venue.trim()){setNotice('Add an event title, date/time and venue.');return;}
    const starts=new Date(eventForm.starts_at);
    if(Number.isNaN(starts.getTime())||starts.getTime()<=Date.now()){setNotice('Choose a future date and time.');return;}
    const row={room_id:active,title:eventForm.title.trim(),details:eventForm.details.trim(),venue:eventForm.venue.trim(),starts_at:starts.toISOString(),created_by:user?.id||null};
    if(supabase&&user&&!active.startsWith('demo-')&&!active.startsWith('local-')){
      const {data,error}=await supabase.from('events').insert(row).select().single();
      if(error){setNotice(error.message);return;}
      setEvents(e=>({...e,[active]:[...(e[active]||[]),data]}));
    }else setEvents(e=>({...e,[active]:[...(e[active]||[]),{...row,id:'e-'+Date.now()}]}));
    setEventModal(false);setEventForm({title:'',details:'',venue:'',starts_at:''});setTab('events');setNotice('Event posted to the room. Reminder is scheduled in this open app.');
  };
  const startRecording=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const rec=new MediaRecorder(stream);chunksRef.current=[];
      rec.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data);};
      rec.onstop=()=>{const blob=new Blob(chunksRef.current,{type:rec.mimeType||'audio/webm'});setAudioUrl(URL.createObjectURL(blob));stream.getTracks().forEach(t=>t.stop());setRecording(false);setNotice('Voice recording ready. In this starter it is a local preview, not uploaded to the group.');};
      mediaRef.current=rec;rec.start();setRecording(true);
    }catch{setNotice('Microphone access was blocked or is unavailable.');}
  };
  const stopRecording=()=>{if(mediaRef.current?.state==='recording')mediaRef.current.stop();};
  const sendAudioDemo=()=>{if(!audioUrl)return;setMessages(m=>({...m,[active]:[...(m[active]||[]),{id:'audio-'+Date.now(),user_name:profile.name||'You',content:'🎙️ Voice message (local preview)',audioUrl,created_at:new Date().toISOString()}]}));setAudioUrl('');setNotice('Voice preview added to this local chat. Connect storage/upload support to share audio online.');};
  const prettyDate=(v)=>new Date(v).toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'});
  if(showGame && isOffline) return <div className="offline-shell"><Offline2048 onBack={()=>setShowGame(false)}/></div>;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?'mobile-open':''}`}>
      <div className="brand"><div className="brand-mark"><MessageCircle size={23}/><span className="brand-dot"/></div><div><strong>ClearChat</strong><small>Talk clearly. Plan together.</small></div><button className="icon-btn mobile-close" onClick={()=>setMobileMenu(false)}><X size={18}/></button></div>
      <button className="workspace"><div className="workspace-icon">C</div><div><b>My workspace</b><small>{user?'Online account':'Demo workspace'}</small></div><ChevronDown size={16}/></button>
      <div className="side-label"><span>YOUR ROOMS</span><button title="Create room" onClick={()=>{setJoinMode(false);setRoomModal(true)}}><Plus size={17}/></button></div>
      <div className="room-list">{rooms.map(r=><button key={r.id} className={'room-item '+(active===r.id?'selected':'')} onClick={()=>{setActive(r.id);setTab('chat');setMobileMenu(false)}}><span className="room-hash"><Hash size={16}/></span><span className="room-name">{r.name}</span>{active===r.id&&<span className="active-dot"/>}</button>)}</div>
      <button className="join-room" onClick={()=>{setJoinMode(true);setRoomModal(true)}}><Users size={17}/> Join with a room code</button>
      <div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={17}/><div><b>Your space, your people</b><span>Rooms are made for your group.</span></div></div><div className="profile"><div className="avatar avatar-green">{initials(profile.name||user?.email||'You')}</div><div className="profile-copy"><b>{profile.name||user?.email?.split('@')[0]||'Guest user'}</b><small>{user?'Signed in':'Local demo'}</small></div><button className="icon-btn" onClick={user?signOut:()=>setNotice('Enter your email in the profile panel to receive a sign-in link.')} title={user?'Sign out':'Account'}>{user?<LogOut size={17}/>:<Settings size={17}/>}</button></div></div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobileMenu(true)}><Menu size={20}/></button><div className="crumb"><span>Rooms</span><span className="crumb-slash">/</span><b>{currentRoom?.name||'Your room'}</b></div><div className="top-actions">{isOffline&&<button className="offline-pill" onClick={()=>setShowGame(true)}>● Offline · Play 2048</button>}<span className={'connection '+(isConfigured?'connected':'demo')}><i/>{isConfigured?'Supabase ready':'Demo mode'}</span><button className="icon-btn" title="Enable reminders" onClick={askNotifications}><Bell size={18}/></button><button className="help-btn" onClick={()=>setNotice('Tip: create a room, share its six-digit code, then use Events to post a date, time and venue.') }><CircleHelp size={17}/><span>Help</span></button></div></header>
      <section className="room-header"><div className="room-hero-icon"><Hash size={24}/></div><div className="room-heading"><div className="room-title-row"><h1>{currentRoom?.name||'Welcome to ClearChat'}</h1><span className="private-pill"><ShieldCheck size={13}/> Private group</span></div><p>{currentRoom?.description||'A place to talk and plan together.'}</p><div className="room-meta"><span><Users size={14}/>{currentRoom?.members||'Group'} members</span><span className="meta-sep">·</span><span><Hash size={14}/> Code: <b>{currentRoom?.code||'------'}</b></span></div></div><button className="outline-btn share-btn" onClick={()=>{navigator.clipboard?.writeText(currentRoom?.code||'');setNotice('Room code copied (if clipboard access is available).')}}>Copy room code</button></section>
      <div className="tabs"><button className={tab==='chat'?'active':''} onClick={()=>setTab('chat')}><MessageCircle size={16}/> Chat <span>{roomMessages.length}</span></button><button className={tab==='announcements'?'active':''} onClick={()=>setTab('announcements')}><Volume2 size={16}/> Announcements</button><button className={tab==='events'?'active':''} onClick={()=>setTab('events')}><CalendarDays size={16}/> Events <span>{roomEvents.length}</span></button><button className={tab==='games'?'active':''} onClick={()=>setTab('games')}><Sparkles size={16}/> Games</button></div>
      {tab==='chat'?<section className="chat-area">
        <div className="day-divider"><span>YOUR CONVERSATION</span></div>
        {roomMessages.length===0&&<div className="empty-state"><div className="empty-icon"><MessageCircle size={28}/></div><h3>Start the conversation</h3><p>Say hi, share an update, or plan your next event.</p><button className="text-btn" onClick={()=>setDraft('Hey everyone! 👋')}>Send a friendly hello</button></div>}
        {roomMessages.map((m,i)=><div className={'message-row '+((m.user_name==='You'||m.user_name===(profile.name||'Guest user'))?'mine':'')} key={m.id||i}><div className={'avatar '+(m.user_name==='You'?'avatar-green':'avatar-lilac')}>{initials(m.user_name)}</div><div className="message-content"><div className="message-meta"><b>{m.user_name||'Member'}</b><span>{time(m.created_at||new Date())}</span></div><div className="bubble">{m.content}{m.audioUrl&&<audio controls src={m.audioUrl}/>}</div></div></div>)}
        {audioUrl&&<div className="audio-draft"><div><Mic size={18}/><span>Voice message preview</span></div><audio controls src={audioUrl}/><button className="outline-btn" onClick={sendAudioDemo}>Add to chat</button><button className="icon-btn" onClick={()=>setAudioUrl('')}><X size={16}/></button></div>}
        <div ref={bottomRef}/>
      </section>:tab==='events'?<section className="content-page"><div className="page-title"><div><span className="eyebrow">PLAN TOGETHER</span><h2>Upcoming events</h2><p>Dates, times and places everyone can find.</p></div><button className="primary-btn" onClick={()=>setEventModal(true)}><Plus size={17}/> Add event</button></div>
        {roomEvents.length===0?<div className="empty-card"><div className="empty-icon"><CalendarDays size={26}/></div><h3>No events yet</h3><p>Create an event with a venue and a 30-minute reminder.</p><button className="primary-btn" onClick={()=>setEventModal(true)}><Plus size={16}/> Create an event</button></div>:<div className="event-list">{[...roomEvents].sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at)).map(e=><article className="event-card" key={e.id}><div className="event-date"><b>{new Date(e.starts_at).toLocaleDateString([],{day:'2-digit'})}</b><span>{new Date(e.starts_at).toLocaleDateString([],{month:'short'}).toUpperCase()}</span></div><div className="event-info"><h3>{e.title}</h3>{e.details&&<p>{e.details}</p>}<div className="event-details"><span><CalendarDays size={15}/>{dateTime(e.starts_at)}</span><span><MapPin size={15}/>{e.venue}</span></div><div className="reminder-line"><Bell size={14}/> Reminder: 30 minutes before</div></div></article>)}</div>}
      </section>:<section className="content-page"><div className="page-title"><div><span className="eyebrow">ROOM UPDATES</span><h2>Announcements</h2><p>Important messages for everyone in the group.</p></div><button className="primary-btn" onClick={()=>{setDraft('📣 ANNOUNCEMENT: ');setTab('chat')}}><Plus size={17}/> New announcement</button></div><div className="announcement-tip"><Sparkles size={20}/><div><b>Make important updates easy to find</b><p>Post an announcement in chat starting with 📣 ANNOUNCEMENT. Dedicated pinned announcements can be added as a next step.</p></div></div>{roomMessages.filter(m=>(m.content||'').startsWith('📣 ANNOUNCEMENT')).length===0?<div className="empty-card"><div className="empty-icon"><Volume2 size={25}/></div><h3>No announcements yet</h3><p>Share an important update with your group.</p><button className="primary-btn" onClick={()=>{setDraft('📣 ANNOUNCEMENT: ');setTab('chat')}}><Plus size={16}/> Write announcement</button></div>:roomMessages.filter(m=>(m.content||'').startsWith('📣 ANNOUNCEMENT')).map(m=><article className="announcement-card" key={m.id}><div className="announcement-symbol"><Volume2 size={19}/></div><div><div className="message-meta"><b>{m.user_name}</b><span>{dateTime(m.created_at)}</span></div><p>{m.content.replace('📣 ANNOUNCEMENT: ','')}</p></div></article>)}</section>}
      {tab==='games'&&<section className="content-page"><div className="page-title"><div><span className="eyebrow">TAKE A BREAK</span><h2>Mini games</h2><p>Play a quick game while you wait for your group.</p></div></div><div className="game-launch-card"><div className="game-2048-icon">2048</div><div><h3>2048 Sliding Puzzle</h3><p>Combine matching tiles and try to reach 2048. The game is playable offline after the app has loaded.</p><button className="primary-btn" onClick={()=>setShowGame(true)}>Play 2048 →</button></div></div></section>}
      {tab==='chat'&&<footer className="composer-wrap"><div className="composer"><button className="composer-icon" title="Attachment (coming soon)" onClick={()=>setNotice('File attachments are planned for a later version.')}><Paperclip size={19}/></button><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={`Message ${currentRoom?.name||'your group'}...`} aria-label="Message input"/><button className={'composer-icon '+(recording?'recording':'')} title={recording?'Stop recording':'Record voice message'} onClick={recording?stopRecording:startRecording}><Mic size={19}/></button><button className="send-btn" onClick={sendMessage} disabled={!draft.trim()}><Send size={17}/></button></div><div className="composer-hint"><span><ShieldCheck size={12}/> Keep it kind and clear</span><span>Press <kbd>Enter</kbd> to send</span></div></footer>}
    </main>
    <aside className="right-panel"><div className="right-heading"><h3>Room overview</h3><button className="icon-btn" onClick={()=>setNotice('Room settings will be available in a future version.')}><Settings size={17}/></button></div><div className="overview-card"><div className="overview-top"><div className="overview-icon"><Users size={20}/></div><span className="online-label"><i/> Group space</span></div><h3>{currentRoom?.name}</h3><p>{currentRoom?.description||'Your shared space'}</p><div className="code-box"><span>ROOM CODE</span><strong>{currentRoom?.code}</strong><button onClick={()=>{navigator.clipboard?.writeText(currentRoom?.code||'');setNotice('Room code copied.')}}>Copy</button></div><div className="overview-foot"><ShieldCheck size={14}/> Share the code only with people you trust.</div></div>
      <div className="side-section-title"><h3>Coming up</h3><button onClick={()=>setTab('events')}>See all</button></div>{roomEvents.length===0?<div className="mini-empty"><CalendarDays size={21}/><p>No upcoming events</p><button onClick={()=>setEventModal(true)}>+ Add an event</button></div>:roomEvents.slice(0,3).map(e=><button className="mini-event" key={e.id} onClick={()=>setTab('events')}><div className="mini-date"><b>{new Date(e.starts_at).getDate()}</b><span>{new Date(e.starts_at).toLocaleDateString([],{month:'short'}).toUpperCase()}</span></div><div><b>{e.title}</b><span>{time(e.starts_at)} · {e.venue}</span><small><Bell size={12}/> 30-min reminder</small></div></button>)}
      <div className="reminder-card"><div className="reminder-art"><Bell size={22}/><span/></div><div><b>Never miss the plan</b><p>Enable browser notifications to hear about reminders while ClearChat is open.</p><button onClick={askNotifications}>Enable notifications <span>→</span></button></div></div>
      <div className="account-card"><label htmlFor="display-name">Your display name</label><input id="display-name" value={profile.name} onChange={e=>{setProfile(p=>({...p,name:e.target.value}));localStorage.setItem('cc-name',e.target.value)}} placeholder="e.g. Alex"/><label htmlFor="email">Email sign-in</label><input id="email" type="email" value={profile.email} onChange={e=>{setProfile(p=>({...p,email:e.target.value}));localStorage.setItem('cc-email',e.target.value)}} placeholder="you@example.com"/><button className="outline-btn full-btn" onClick={signIn}>{user?'Signed in ✓':'Send sign-in link'}</button><small>{isConfigured?'Passwordless sign-in via Supabase.':'Demo mode: connect Supabase to enable accounts and shared rooms.'}</small></div>
    </aside>
    {notice&&<div className="toast" role="status"><Check size={17}/><span>{notice}</span><button onClick={()=>setNotice('')}><X size={15}/></button></div>}
    {alarmEvent&&<div className="alarm-backdrop"><div className="alarm-card"><div className="alarm-bell"><Bell size={30}/></div><span className="eyebrow">CLEARCHAT EVENT REMINDER</span><h2>{alarmEvent.title||'Your event is starting soon!'}</h2><div className="alarm-detail"><span>Venue:</span><b>{alarmEvent.venue||'Not specified'}</b></div><div className="alarm-detail"><span>Time It Starts:</span><b>{alarmEvent.startsAt||'See event details'}</b></div><div className="alarm-detail"><span>Date:</span><b>{alarmEvent.date||'See event details'}</b></div><p>This alarm rings while this page is active. Snoozing will remind you again in 10 minutes while the page remains open.</p><button className="primary-btn alarm-ack" onClick={()=>{setAlarmEvent(null);setNotice('Got the message! Reminder acknowledged.')}}>✓ Got The Message</button><button className="outline-btn alarm-later" onClick={()=>{const ev=alarmEvent;setAlarmEvent(null);setNotice('Snoozed for 10 minutes. Keep ClearChat open.');setTimeout(()=>setAlarmEvent(ev),600000);}}>Do It Later · 10 min</button></div></div>}\n    {roomModal&&<div className="modal-backdrop" onClick={()=>setRoomModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">{joinMode?'JOIN YOUR PEOPLE':'START A GROUP'}</span><h2>{joinMode?'Join a room':'Create a room'}</h2><p>{joinMode?'Enter the six-digit code shared by a friend.':'Create a space for your friends, class or team.'}</p></div><button className="icon-btn" onClick={()=>setRoomModal(false)}><X size={19}/></button></div>{joinMode?<form onSubmit={e=>{e.preventDefault();joinRoom()}}><label>Six-digit room code</label><input autoFocus inputMode="numeric" maxLength={6} value={roomCode} onChange={e=>setRoomCode(e.target.value.replace(/\\D/g,''))} placeholder="e.g. 672536"/><button className="primary-btn modal-submit" type="submit">Join room <span>→</span></button><button type="button" className="switch-mode" onClick={()=>setJoinMode(false)}>Want to create a room instead?</button></form>:<form onSubmit={e=>{e.preventDefault();createRoom()}}><label>Room name</label><input autoFocus maxLength={45} value={roomName} onChange={e=>setRoomName(e.target.value)} placeholder="e.g. Weekend Crew"/><div className="modal-note"><ShieldCheck size={17}/><span>A unique six-digit code will be created for you to share.</span></div><button className="primary-btn modal-submit" type="submit">Create room <span>→</span></button><button type="button" className="switch-mode" onClick={()=>setJoinMode(true)}>Have a room code? Join instead.</button></form>}</div></div>}
    {eventModal&&<div className="modal-backdrop" onClick={()=>setEventModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">MAKE A PLAN</span><h2>Create an event</h2><p>Everyone in this room can see the details.</p></div><button className="icon-btn" onClick={()=>setEventModal(false)}><X size={19}/></button></div><form onSubmit={e=>{e.preventDefault();createEvent()}}><label>Event title</label><input autoFocus value={eventForm.title} onChange={e=>setEventForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Team meeting"/><label>Venue</label><input value={eventForm.venue} onChange={e=>setEventForm(f=>({...f,venue:e.target.value}))} placeholder="e.g. Library, Level 2"/><label>Date and time</label><input type="datetime-local" value={eventForm.starts_at} min={new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)} onChange={e=>setEventForm(f=>({...f,starts_at:e.target.value}))}/><label>Extra details <span className="optional">(optional)</span></label><textarea rows="3" value={eventForm.details} onChange={e=>setEventForm(f=>({...f,details:e.target.value}))} placeholder="What should people bring? Any other details?"/><div className="modal-note"><Bell size={17}/><span>A reminder is planned for <b>30 minutes before</b>. In this starter, it requires the app tab to stay open.</span></div><button className="primary-btn modal-submit" type="submit">Post event <span>→</span></button></form></div></div>}
  </div>
}
createRoot(document.getElementById('root')).render(<App/>);
