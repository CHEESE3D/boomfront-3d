const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const path=require("path");
const crypto=require("crypto");
const app=express(),server=http.createServer(app);
const ORIGIN=process.env.CLIENT_ORIGIN||"*";
const io=new Server(server,{cors:{origin:ORIGIN,methods:["GET","POST"]}});
const PORT=process.env.PORT||3000;
app.use(express.static(path.join(__dirname,"../client")));
app.get("/health",(q,r)=>r.json({ok:true,game:"BOOMFRONT 3D",rooms:rooms.size}));
const MAPS=[{id:"crater",name:"CRATER"},{id:"dockyard",name:"DOCKYARD"},{id:"dustbowl",name:"DUSTBOWL"},{id:"ruins",name:"RUINS"},{id:"icebase",name:"ICEBASE"}];
const WEAPONS={1:{damage:18,speed:90,life:1,radius:0},2:{damage:11,speed:95,life:.8,radius:0},3:{damage:12,speed:70,life:.7,radius:0},4:{damage:90,speed:150,life:1.5,radius:0},5:{damage:115,speed:34,life:3.5,radius:8},6:{damage:35,speed:62,life:2,radius:2.5}};
const rooms=new Map();
const code=()=>crypto.randomBytes(3).toString("hex").toUpperCase();
function room(){let c=code();while(rooms.has(c))c=code();let r={code:c,name:"Lobby "+c,public:true,max:12,mode:"Team Deathmatch",map:"crater",players:new Map(),bullets:new Map(),grenades:new Map(),voting:false,votes:{},voteOptions:[]};rooms.set(c,r);return r}
function list(){return [...rooms.values()].filter(r=>r.public&&r.players.size<r.max).map(r=>({code:r.code,name:r.name,players:r.players.size,max:r.max,mode:r.mode,map:r.map}))}
function pack(p){return {id:p.id,name:p.name,x:p.x,z:p.z,rot:p.rot,hp:p.hp,score:p.score,team:p.team,vehicle:p.vehicle}}
function snap(r){io.to(r.code).emit("snapshot",{players:[...r.players.values()].map(pack)})}
function spawn(p){p.x=(Math.random()-.5)*90;p.z=(Math.random()-.5)*90;p.hp=100;p.vehicle=false}
function kill(r,v,kid){let k=r.players.get(kid);if(k&&k.team!==v.team){k.score++;k.streak++;if(k.streak===3)io.to(r.code).emit("kill",{killer:k.name,victim:v.name,streak:3});else io.to(r.code).emit("kill",{killer:k?.name||"WORLD",victim:v.name})}else io.to(r.code).emit("kill",{killer:"WORLD",victim:v.name});v.streak=0;setTimeout(()=>{spawn(v);io.to(r.code).emit("respawn",{name:v.name});snap(r)},1200)}
function damage(r,v,d,kid){v.hp-=d;if(v.hp<=0)kill(r,v,kid)}
function boom(r,b){io.to(r.code).emit("explosion",{x:b.x,y:b.y,z:b.z,radius:b.radius});for(const p of r.players.values()){if(p.id===b.owner)continue;let d=Math.hypot(p.x-b.x,p.z-b.z);if(d<=b.radius)damage(r,p,Math.max(15,Math.round(b.damage*(1-d/b.radius))),b.owner)}}
function startVote(r){if(r.voting||r.players.size<2)return;r.voting=true;r.votes={};r.voteOptions=[...MAPS].sort(()=>Math.random()-.5).slice(0,3);io.to(r.code).emit("voteStart",{options:r.voteOptions,votes:r.votes});setTimeout(()=>finishVote(r),12000)}
function finishVote(r){if(!r.voting)return;r.voting=false;let winner=r.voteOptions[0],best=-1;for(let m of r.voteOptions){let n=Object.values(r.votes).filter(x=>x===m.id).length;if(n>best){best=n;winner=m}}r.map=winner.id;io.to(r.code).emit("roundStart",{map:r.map})}
function join(s,r,name){if(!r)return s.emit("errorMsg","Lobby not found.");if(r.players.size>=r.max)return s.emit("errorMsg","Lobby full.");let p={id:s.id,name:String(name||"Ranger").slice(0,16),x:0,z:0,rot:0,hp:100,score:0,streak:0,team:r.players.size%2?"blue":"red",vehicle:false};spawn(p);r.players.set(s.id,p);s.data.room=r.code;s.join(r.code);s.emit("joined",{code:r.code,player:p,map:r.map});snap(r);io.emit("lobbies",list());if(r.players.size>=2)startVote(r)}
io.on("connection",s=>{
s.on("listLobbies",()=>s.emit("lobbies",list()));
s.on("create",d=>{let r=room();r.public=false;r.name=(d.name||"Host")+"'s Lobby";join(s,r,d.name)});
s.on("quick",d=>{let rs=[...rooms.values()].filter(r=>r.public&&r.players.size<r.max);let r=rs[Math.floor(Math.random()*rs.length)]||room();join(s,r,d.name)});
s.on("join",d=>join(s,rooms.get(String(d.code||"").toUpperCase()),d.name));
s.on("move",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||typeof d.x!=="number")return;p.x=Math.max(-82,Math.min(82,d.x));p.z=Math.max(-82,Math.min(82,d.z));p.rot=Number(d.rot)||0;p.vehicle=!!d.vehicle});
s.on("fire",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id),w=WEAPONS[d.weapon];if(!r||!p||!w)return;let b={id:d.id||crypto.randomUUID(),owner:p.id,x:p.x,y:1.45,z:p.z,dx:Number(d.dx)||0,dy:Number(d.dy)||0,dz:Number(d.dz)||-1,weapon:d.weapon,damage:w.damage,speed:w.speed,life:w.life,radius:w.radius,t:0,color:d.weapon===5?0xff5533:d.weapon===6?0x4de7ff:d.weapon===2?0x7fffd4:0xffd166};r.bullets.set(b.id,b);io.to(r.code).emit("fire",b)});
s.on("throwGrenade",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!r||!p)return;let g={id:crypto.randomUUID(),owner:p.id,x:p.x,y:1.3,z:p.z,dx:d.dx,dz:d.dz,speed:18,t:0};r.grenades.set(g.id,g);io.to(r.code).emit("grenade",g)});
s.on("vehicleToggle",()=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(p)p.vehicle=!p.vehicle});
s.on("vote",d=>{let r=rooms.get(s.data.room);if(r?.voting&&r.voteOptions.some(m=>m.id===d.map)){r.votes[s.id]=d.map;io.to(r.code).emit("voteUpdate",{options:r.voteOptions,votes:r.votes})}});
s.on("disconnect",()=>{let r=rooms.get(s.data.room);if(!r)return;r.players.delete(s.id);if(!r.players.size)rooms.delete(r.code);else snap(r);io.emit("lobbies",list())});
});
setInterval(()=>{
for(const r of rooms.values()){
 for(const [id,b] of r.bullets){b.t+=.05;b.x+=b.dx*b.speed*.05;b.y+=b.dy*b.speed*.05;b.z+=b.dz*b.speed*.05;let hit=null;for(const p of r.players.values()){if(p.id!==b.owner&&Math.hypot(p.x-b.x,p.z-b.z)<1.2){hit=p;break}}if(hit){if(b.radius)boom(r,b);else damage(r,hit,b.damage,b.owner);r.bullets.delete(id)}else if(b.t>b.life||Math.abs(b.x)>85||Math.abs(b.z)>85){if(b.radius)boom(r,b);r.bullets.delete(id)}}
 for(const [id,g] of r.grenades){g.t+=.05;g.x+=g.dx*g.speed*.05;g.z+=g.dz*g.speed*.05;if(g.t>2.3){boom(r,{...g,damage:80,radius:9});r.grenades.delete(id)}}
 snap(r)
}},50);
server.listen(PORT,()=>console.log("BOOMFRONT 3D server on "+PORT));
