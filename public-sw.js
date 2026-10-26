const CACHE_NAME='clearchat-shell-v2';
const APP_SHELL=['/','/index.html','/manifest.webmanifest','/clearchat-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request).then(c=>c||caches.match('/index.html'))));
});
self.addEventListener('notificationclick',e=>{
 const action=e.action,data=e.notification.data||{};e.notification.close();
 if(action==='snooze'){
   e.waitUntil(self.registration.showNotification('ClearChat reminder snoozed',{body:'We will remind you again in 10 minutes.',tag:'clearchat-snooze-confirmation',data:{...data,snoozed:true}}));
   return;
 }
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
   for(const c of list){c.postMessage({type:action==='ack'?'CLEARCHAT_ACK':'CLEARCHAT_OPEN',data});if('focus'in c)return c.focus();}
   return clients.openWindow('/');
 }));
});
