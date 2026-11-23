/* Battle of the Crowns: a small medieval RTS for phones. All original code and art (drawn in code). */
'use strict';
(function(){
const T=32,W=72,H=72,N=W*H,DT=0.05;
const $=s=>document.querySelector(s);
const cv=$('#game'),ctx=cv.getContext('2d');
let DPR=1,VW=1,VH=1;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const R4=['food','wood','gold','stone'];
const AGE=['Dark Age','Feudal Age','Castle Age','Imperial Age'];
const PCOL=['#2f6fe0','#d6392b'];
const PDARK=['#1b4596','#8c2116'];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rnd=Math.random;
const ri=n=>Math.floor(rnd()*n);
const DX=[1,-1,0,0,1,1,-1,-1],DY=[0,0,1,-1,1,-1,1,-1];

/* ---------- data ---------- */
const STYLES={
 west:{n:'Western',wall:'#bdb5a6',wallD:'#8e8676',roof:'#b24a32',roofD:'#843322',stone:'#aaa395',kind:'gable'},
 east:{n:'East Asian',wall:'#ece5d2',wallD:'#beb49b',roof:'#46565c',roofD:'#2d393e',stone:'#b8b3a5',kind:'pagoda',pillar:'#a8322a'},
 mid:{n:'Middle Eastern',wall:'#dfc391',wallD:'#b49764',roof:'#ead6a8',roofD:'#c8ab76',stone:'#d0b98c',kind:'dome',dome:'#3f8f93'},
 norse:{n:'Northern',wall:'#8d6745',wallD:'#654730',roof:'#76813f',roofD:'#535d2b',stone:'#9b968a',kind:'steep'}
};
const SKEYS=Object.keys(STYLES);
const U={
 villager:{n:'Villager',hp:25,atk:3,at:'m',rng:0,arm:[0,0],spd:1.35,los:4,cost:{food:50},tm:18,age:0,tag:'vil',rate:1.6},
 militia:{n:'Swordsman',hp:45,atk:6,at:'m',rng:0,arm:[1,1],spd:1.3,los:4,cost:{food:60,gold:20},tm:16,age:0,tag:'inf',rate:1.8},
 spear:{n:'Spearman',hp:45,atk:3,at:'m',rng:0,arm:[0,0],spd:1.35,los:4,cost:{food:35,wood:25},tm:14,age:1,tag:'inf',rate:2,bon:{cav:15}},
 champ:{n:'Champion',hp:70,atk:13,at:'m',rng:0,arm:[1,1],spd:1.35,los:5,cost:{food:60,gold:30},tm:16,age:3,tag:'inf',rate:1.8},
 archer:{n:'Archer',hp:30,atk:4,at:'p',rng:4,arm:[0,0],spd:1.3,los:6,cost:{wood:25,gold:45},tm:18,age:1,tag:'arc',rate:2,bon:{inf:2,vil:1}},
 xbow:{n:'Crossbowman',hp:35,atk:5,at:'p',rng:5,arm:[0,0],spd:1.3,los:7,cost:{wood:25,gold:45},tm:18,age:2,tag:'arc',rate:2,bon:{inf:3,vil:1}},
 scout:{n:'Scout Rider',hp:45,atk:3,at:'m',rng:0,arm:[0,2],spd:2.1,los:7,cost:{food:80},tm:18,age:1,tag:'cav',rate:2,bon:{arc:4,vil:2}},
 knight:{n:'Knight',hp:100,atk:10,at:'m',rng:0,arm:[2,2],spd:1.85,los:5,cost:{food:60,gold:75},tm:22,age:2,tag:'cav',rate:1.8},
 ram:{n:'Battering Ram',hp:175,atk:2,at:'m',rng:0,arm:[-3,150],spd:.75,los:3,cost:{wood:160,gold:75},tm:30,age:2,tag:'sie',rate:4,bon:{bld:110},sie:1},
 treb:{n:'Trebuchet',hp:150,atk:2,at:'p',rng:11,arm:[1,150],spd:.7,los:12,cost:{wood:200,gold:200},tm:40,age:3,tag:'sie',rate:8,bon:{bld:240},sie:1}
};
const RAD={vil:.26,inf:.28,arc:.27,cav:.4,sie:.5};
const B={
 tc:{n:'Town Center',w:4,h:4,hp:2400,cost:{wood:275,stone:100},tm:90,age:2,pop:5,drop:['food','wood','gold','stone'],los:8,arr:{n:1,r:6,a:5},train:['villager'],tech:['loom','wheel','masonry','feudal','castle','imperial'],gar:15,ht:40},
 house:{n:'House',w:2,h:2,hp:550,cost:{wood:25},tm:14,age:0,pop:5,los:3,ht:20},
 mill:{n:'Mill',w:2,h:2,hp:600,cost:{wood:100},tm:18,age:0,drop:['food'],los:5,tech:['collar','plow'],ht:22},
 lumber:{n:'Lumber Camp',w:2,h:2,hp:600,cost:{wood:100},tm:18,age:0,drop:['wood'],los:5,tech:['axe','saw'],ht:18},
 mine:{n:'Mining Camp',w:2,h:2,hp:600,cost:{wood:100},tm:18,age:0,drop:['gold','stone'],los:5,tech:['goldm','stonem'],ht:18},
 farm:{n:'Farm',w:3,h:3,hp:300,cost:{wood:60},tm:10,age:0,los:1,flat:1,ht:0},
 barracks:{n:'Barracks',w:3,h:3,hp:1200,cost:{wood:175},tm:30,age:0,los:5,train:['militia','spear','champ'],ht:28},
 range:{n:'Archery Range',w:3,h:3,hp:1200,cost:{wood:175},tm:30,age:1,los:5,train:['archer','xbow'],ht:26},
 stable:{n:'Stable',w:3,h:3,hp:1200,cost:{wood:175},tm:30,age:1,los:5,train:['scout','knight'],ht:26},
 smith:{n:'Blacksmith',w:3,h:3,hp:1200,cost:{wood:150},tm:30,age:1,los:5,tech:['forge','iron','blast','fletch','bodkin','bracer','scale','chain','plate'],ht:26},
 workshop:{n:'Siege Workshop',w:3,h:3,hp:1200,cost:{wood:200},tm:30,age:2,los:5,train:['ram'],ht:26},
 palisade:{n:'Palisade',w:1,h:1,hp:250,cost:{wood:2},tm:4,age:0,los:2,wall:1,ht:16},
 wall:{n:'Stone Wall',w:1,h:1,hp:1800,cost:{stone:5},tm:6,age:1,los:2,wall:1,ht:20},
 gate:{n:'Gate',w:1,h:1,hp:1800,cost:{stone:30},tm:12,age:1,los:3,wall:1,gate:1,ht:22},
 tower:{n:'Watch Tower',w:1,h:1,hp:1020,cost:{wood:25,stone:125},tm:30,age:1,los:9,arr:{n:1,r:7,a:6},ht:50},
 castle:{n:'Castle',w:4,h:4,hp:4800,cost:{stone:650},tm:120,age:2,pop:20,los:10,arr:{n:4,r:8,a:9},train:['treb'],ht:44}
};
const BUILD_TABS={eco:['house','mill','lumber','mine','farm','tc'],mil:['barracks','range','stable','smith','workshop','castle'],def:['palisade','wall','gate','tower']};
const TECH={
 feudal:{n:'Feudal Age',age:0,cost:{food:500},tm:60,up:1,d:'Walls, towers, archers, cavalry'},
 castle:{n:'Castle Age',age:1,cost:{food:800,gold:200},tm:80,up:2,d:'Castles, knights, crossbows, rams'},
 imperial:{n:'Imperial Age',age:2,cost:{food:1000,gold:800},tm:100,up:3,d:'Champions, trebuchets'},
 loom:{n:'Loom',age:0,cost:{gold:50},tm:20,ic:'shield',d:'Villagers +15 HP, +1/+2 armor',fx:m=>{m.vhp+=15;m.varm[0]+=1;m.varm[1]+=2}},
 wheel:{n:'Wheelbarrow',age:1,cost:{food:175,wood:50},tm:40,ic:'wheel',d:'Villagers faster, carry +3',fx:m=>{m.vspd+=.1;m.carry+=3}},
 masonry:{n:'Masonry',age:2,cost:{wood:175,stone:150},tm:40,ic:'brick',d:'Buildings +20% HP',fx:m=>{m.bhp+=.2}},
 collar:{n:'Horse Collar',age:1,cost:{food:75,wood:75},tm:20,ic:'wheat',d:'Farms +75 food',fx:m=>{m.farm+=75}},
 plow:{n:'Heavy Plow',age:2,cost:{food:125,wood:125},tm:30,ic:'wheat',req:'collar',d:'Farms +125 food, faster farming',fx:m=>{m.farm+=125;m.rate.farm+=.1}},
 axe:{n:'Double-Bit Axe',age:1,cost:{food:100,wood:50},tm:20,ic:'axe',d:'Wood +20%',fx:m=>{m.rate.wood+=.2}},
 saw:{n:'Bow Saw',age:2,cost:{food:150,wood:100},tm:30,ic:'axe',req:'axe',d:'Wood +20%',fx:m=>{m.rate.wood+=.2}},
 goldm:{n:'Gold Mining',age:1,cost:{food:100,wood:75},tm:25,ic:'pickg',d:'Gold +15%',fx:m=>{m.rate.gold+=.15}},
 stonem:{n:'Stone Mining',age:1,cost:{food:100,wood:75},tm:25,ic:'picks',d:'Stone +15%',fx:m=>{m.rate.stone+=.15}},
 forge:{n:'Forging',age:1,cost:{food:150},tm:30,ic:'sword',d:'Melee +1 attack',fx:m=>{m.atk.m+=1}},
 iron:{n:'Iron Casting',age:2,cost:{food:220,gold:120},tm:40,ic:'sword',req:'forge',d:'Melee +1 attack',fx:m=>{m.atk.m+=1}},
 blast:{n:'Blast Furnace',age:3,cost:{food:275,gold:225},tm:50,ic:'sword',req:'iron',d:'Melee +2 attack',fx:m=>{m.atk.m+=2}},
 fletch:{n:'Fletching',age:1,cost:{food:100,gold:50},tm:30,ic:'arrow',d:'Archers, towers, TC +1 attack & range',fx:m=>{m.atk.p+=1;m.rng+=1}},
 bodkin:{n:'Bodkin Arrow',age:2,cost:{food:200,gold:100},tm:40,ic:'arrow',req:'fletch',d:'+1 attack & range',fx:m=>{m.atk.p+=1;m.rng+=1}},
 bracer:{n:'Bracer',age:3,cost:{food:300,gold:200},tm:50,ic:'arrow',req:'bodkin',d:'+1 attack & range',fx:m=>{m.atk.p+=1;m.rng+=1}},
 scale:{n:'Scale Armor',age:1,cost:{food:100},tm:30,ic:'shield',d:'Military +1/+1 armor',fx:m=>{m.arm[0]++;m.arm[1]++}},
 chain:{n:'Chain Mail',age:2,cost:{food:200,gold:100},tm:40,ic:'shield',req:'scale',d:'Military +1/+1 armor',fx:m=>{m.arm[0]++;m.arm[1]++}},
 plate:{n:'Plate Armor',age:3,cost:{food:300,gold:150},tm:50,ic:'shield',req:'chain',d:'Military +2/+2 armor',fx:m=>{m.arm[0]+=2;m.arm[1]+=2}}
};
const RATE={berry:.45,farm:.4,wood:.5,gold:.42,stone:.42};
const RT={wood:1,gold:2,stone:3,food:4},RTN=['','wood','gold','stone','food'];
const RAMT=[0,100,400,300,125];
const newMods=()=>({vhp:0,varm:[0,0],vspd:0,carry:10,bhp:1,farm:175,rate:{food:0,farm:0,wood:0,gold:0,stone:0},atk:{m:0,p:0},rng:0,arm:[0,0]});

/* ---------- state ---------- */
const resT=new Uint8Array(N),resA=new Float32Array(N),block=new Uint8Array(N),occ=new Int32Array(N),explored=new Uint8Array(N),vis=new Uint8Array(N);
let S=null,P=[],units=[],blds=[],ents=new Map(),projs=[],fx=[],rubble=[];
let sel=[],placing=null,running=false,paused=false,boxMode=false;
const cam={x:0,y:0,z:1};
let groundCv=document.createElement('canvas'),fogCv=document.createElement('canvas');fogCv.width=W;fogCv.height=H;
const fogCtx=fogCv.getContext('2d'),fogImg=fogCtx.createImageData(W,H);

/* ---------- helpers ---------- */
const afford=(p,c)=>R4.every(r=>(p.res[r]||0)>=(c[r]||0));
const pay=(p,c)=>{for(const r in c)p.res[r]-=c[r]};
const refund=(p,c,f=1)=>{for(const r in c)p.res[r]+=Math.floor(c[r]*f)};
const ec=e=>e.k==='u'?{x:e.x,y:e.y}:{x:e.x+e.w/2,y:e.y+e.h/2};
function rectDist(px,py,x,y,w,h){const dx=Math.max(x-px,0,px-(x+w)),dy=Math.max(y-py,0,py-(y+h));return Math.hypot(dx,dy)}
const edist=(u,e)=>e.k==='u'?Math.hypot(u.x-e.x,u.y-e.y)-e.r:rectDist(u.x,u.y,e.x,e.y,e.w,e.h);
const isMil=u=>u.type!=='villager';
const uMaxHp=u=>U[u.type].hp+(u.type==='villager'?P[u.o].m.vhp:0);
const bMaxHp=b=>Math.round(B[b.type].hp*P[b.o].m.bhp);
function uAtk(u){const d=U[u.type],m=P[u.o].m;return d.atk+(u.type==='villager'||d.sie?0:m.atk[d.at])}
function uArm(u,k){const d=U[u.type],m=P[u.o].m,i=k==='m'?0:1;return d.arm[i]+(u.type==='villager'?m.varm[i]:d.sie?0:m.arm[i])}
function uRng(u){const d=U[u.type];return d.rng+(d.at==='p'&&!d.sie&&d.rng?P[u.o].m.rng:0)}
function uSpd(u){const d=U[u.type];return d.spd*(u.type==='villager'?1+P[u.o].m.vspd:1)}
function gRate(o,k){const m=P[o].m;const r=RATE[k]*(1+(k==='berry'?m.rate.food:m.rate[k]));return r*(P[o].ai?P[o].ai.bonus:1)}
function costStr(c){const m={food:'cf',wood:'cw',gold:'cg',stone:'cs2'};return Object.keys(c).map(k=>`<i class="${m[k]}"></i>${c[k]}`).join('')}
function costTxt(c){return Object.keys(c).map(k=>c[k]+' '+k).join(', ')}
function need(p,c){const out=[];for(const r in c){const d=c[r]-(p.res[r]||0);if(d>0)out.push(Math.ceil(d)+' more '+r)}return out.join(' and ')}
const pass=(i,o)=>{const b=block[i];if(b===0)return true;if(b===3){const g=ents.get(occ[i]);return !!g&&g.o===o}return false};
const passXY=(x,y,o)=>x>=0&&y>=0&&x<W&&y<H&&pass(y*W+x,o);

/* ---------- entities ---------- */
function mkUnit(type,o,x,y){const d=U[type];const u={id:S.nid++,k:'u',type,o,x,y,hp:1,path:null,task:null,carry:0,ct:null,cd:0,face:1,an:0,gar:0,th:Math.random(),rp:0,r:RAD[d.tag],swing:0,work:0};u.hp=uMaxHp(u);units.push(u);ents.set(u.id,u);P[o].pop++;return u}
function stampB(b,on){const d=B[b.type];for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){const i=y*W+x;occ[i]=on?b.id:0;if(!d.flat)block[i]=on?(d.gate?3:2):0}}
function mkBld(type,o,x,y,done){const d=B[type];const b={id:S.nid++,k:'b',type,o,x,y,w:d.w,h:d.h,hp:1,built:done?1:0,queue:[],rally:null,gar:[],cd:Math.random(),food:0,worker:0,started:0,dmgT:0};
 if(type==='farm')b.food=P[o].m.farm;blds.push(b);ents.set(b.id,b);stampB(b,true);if(done){b.hp=bMaxHp(b);onBuilt(b,true)}return b}
function calcPop(p){let c=0;for(const b of blds)if(b.o===p.i&&b.built>=1&&B[b.type].pop)c+=B[b.type].pop;p.popCap=Math.min(200,c);p.pop=units.filter(u=>u.o===p.i).length}
function onBuilt(b,silent){b.built=1;b.hp=Math.max(b.hp,1);calcPop(P[b.o]);if(!silent&&b.o===0&&!B[b.type].wall&&b.type!=='farm'&&b.type!=='house')toast(B[b.type].n+' complete')}
function evict(b){if(B[b.type].flat)return;for(const u of units){if(u.gar)continue;if(u.x>b.x-.1&&u.x<b.x+b.w+.1&&u.y>b.y-.1&&u.y<b.y+b.h+.1){const p=freeAround(b,u.x,u.y);u.x=p.x;u.y=p.y;u.path=null}}}
function freeAround(b,px,py){let best=null,bd=1e9;for(let r=0;r<5&&!best;r++){for(let y=b.y-1-r;y<=b.y+b.h+r;y++)for(let x=b.x-1-r;x<=b.x+b.w+r;x++){if(x>b.x-1-r&&x<b.x+b.w+r&&y>b.y-1-r&&y<b.y+b.h+r)continue;if(!passXY(x,y,b.o))continue;const d=Math.hypot(x+.5-(px??b.x+b.w/2),y+.5-(py??b.y+b.h+1));if(d<bd){bd=d;best={x:x+.5,y:y+.5}}}}
 return best?{x:best.x+(Math.random()-.5)*.3,y:best.y+(Math.random()-.5)*.3}:{x:b.x+b.w/2,y:b.y+b.h+.5}}
function hit(t,d,ao,aid){if(t.dead)return;t.hp-=d;if(t.k==='b')t.dmgT=S.t;else t.dmgT=S.t;
 if(t.o===0&&ao!==0)alertAttack(t);
 if(t.k==='u'&&t.hp>0&&aid){const a=ents.get(aid);if(a&&a.k==='u'&&isMil(t)&&!U[t.type].sie&&(!t.task||t.task.auto))t.task={k:'atk',id:aid,auto:1}}
 if(t.hp<=0)kill(t,ao)}
function kill(e,by,silent){if(e.dead)return;e.dead=true;ents.delete(e.id);
 if(e.k==='u'){units.splice(units.indexOf(e),1);P[e.o].pop--;P[e.o].st.lost++;if(by!=null&&P[by])P[by].st.kills++;
  if(e.gar){const b=ents.get(e.gar);if(b)b.gar=b.gar.filter(i=>i!==e.id)}
  fx.push({k:'die',x:e.x,y:e.y,t:0,life:1.2,c:PCOL[e.o]})}
 else{blds.splice(blds.indexOf(e),1);stampB(e,false);
  for(const id of e.gar){const u=ents.get(id);if(u){u.gar=0;const p=freeAround(e);u.x=p.x;u.y=p.y}}e.gar=[];
  if(!B[e.type].flat){rubble.push({x:e.x,y:e.y,w:e.w,h:e.h,t:0});fx.push({k:'dust',x:e.x+e.w/2,y:e.y+e.h/2,t:0,life:1.4,s:e.w})}
  if(by!=null&&P[by]&&by!==e.o)P[by].st.razed++;
  if(e.o===0&&!silent&&by!==0)toast(B[e.type].n+' destroyed','bad');
  calcPop(P[e.o])}
 const k=sel.indexOf(e.id);if(k>=0){sel.splice(k,1);panelDirty=true}}
function dmgTo(atk,at,bon,t){
 if(t.k==='b'){let d=at==='m'?Math.max(1,atk*.6):1;if(bon&&bon.bld)d+=bon.bld;return d}
 let d=Math.max(1,atk-uArm(t,at));if(bon){const tg=U[t.type].tag;if(bon[tg])d+=bon[tg]}return d}
function shoot(x,y,t,d,o,aid,kind){const c=ec(t);const dist=Math.hypot(c.x-x,c.y-y);projs.push({x0:x,y0:y,tid:t.id,tx:c.x,ty:c.y,d,o,aid,kind,t:0,dur:Math.max(.12,dist/(kind==='rock'?7:11))})}

/* ---------- pathfinding ---------- */
const gS=new Float32Array(N),par=new Int32Array(N),seen=new Int32Array(N),closed=new Int32Array(N);let stampN=1;
const hp_=[],hf_=[];
function hpush(i,f){hp_.push(i);hf_.push(f);let k=hp_.length-1;while(k>0){const p=(k-1)>>1;if(hf_[p]<=hf_[k])break;let t=hp_[p];hp_[p]=hp_[k];hp_[k]=t;t=hf_[p];hf_[p]=hf_[k];hf_[k]=t;k=p}}
function hpop(){const top=hp_[0];const li=hp_.pop(),lf=hf_.pop();if(hp_.length){hp_[0]=li;hf_[0]=lf;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<hp_.length&&hf_[l]<hf_[m])m=l;if(r<hp_.length&&hf_[r]<hf_[m])m=r;if(m===k)break;let t=hp_[m];hp_[m]=hp_[k];hp_[k]=t;t=hf_[m];hf_[m]=hf_[k];hf_[k]=t;k=m}}return top}
function findPath(o,sx,sy,gx0,gy0,gx1,gy1,adj){
 stampN++;hp_.length=0;hf_.length=0;sx=clamp(sx|0,0,W-1);sy=clamp(sy|0,0,H-1);const s=sy*W+sx;
 const hh=(x,y)=>{const dx=Math.max(gx0-x,0,x-gx1),dy=Math.max(gy0-y,0,y-gy1);return Math.max(dx,dy)+.414*Math.min(dx,dy)};
 const inG=(x,y)=>adj?(x>=gx0-1&&x<=gx1+1&&y>=gy0-1&&y<=gy1+1):(x>=gx0&&x<=gx1&&y>=gy0&&y<=gy1);
 gS[s]=0;seen[s]=stampN;par[s]=-1;hpush(s,hh(sx,sy));let best=s,bestH=hh(sx,sy),found=-1,it=0;
 while(hp_.length&&it++<9000){const c=hpop();if(closed[c]===stampN)continue;closed[c]=stampN;const cx=c%W,cy=(c/W)|0;
  if(inG(cx,cy)&&(c===s?pass(c,o)||adj:pass(c,o))){found=c;break}
  const h0=hh(cx,cy);if(h0<bestH){bestH=h0;best=c}
  for(let k=0;k<8;k++){const dx=DX[k],dy=DY[k],nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const ni=ny*W+nx;if(closed[ni]===stampN||!pass(ni,o))continue;
   if(dx&&dy&&(!pass(cy*W+nx,o)||!pass(ny*W+cx,o)))continue;
   const g=gS[c]+(dx&&dy?1.414:1);if(seen[ni]!==stampN||g<gS[ni]){seen[ni]=stampN;gS[ni]=g;par[ni]=c;hpush(ni,g+hh(nx,ny))}}}
 const end=found>=0?found:best;const pts=[];let c=end;while(c!==-1&&c!==s){pts.push({x:c%W+.5,y:((c/W)|0)+.5});c=par[c]}pts.reverse();
 return{pts,partial:found<0}}
function losOk(o,x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/.25);for(let k=1;k<n;k++){const t=k/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t;
 if(!passXY(Math.floor(x+.28),Math.floor(y+.28),o)||!passXY(Math.floor(x-.28),Math.floor(y+.28),o)||!passXY(Math.floor(x+.28),Math.floor(y-.28),o)||!passXY(Math.floor(x-.28),Math.floor(y-.28),o))return false}return true}
function smooth(o,x,y,pts){if(pts.length<2)return pts;const out=[];let cx=x,cy=y,i=0;while(i<pts.length){let j=Math.min(pts.length-1,i+14);for(;j>i;j--)if(losOk(o,cx,cy,pts[j].x,pts[j].y))break;out.push(pts[j]);cx=pts[j].x;cy=pts[j].y;i=j+1}return out}
function pathRect(u,x0,y0,x1,y1,adj){const r=findPath(u.o,u.x,u.y,x0,y0,x1,y1,adj);u.path=smooth(u.o,u.x,u.y,r.pts);u.partial=r.partial;
 if(!u.path.length&&!r.partial){const cx=Math.floor(u.x)+.5,cy=Math.floor(u.y)+.5;if(Math.hypot(cx-u.x,cy-u.y)>.05)u.path=[{x:cx,y:cy}]}}
function goPoint(u,x,y){const tx=clamp(x|0,0,W-1),ty=clamp(y|0,0,H-1);if(passXY(tx,ty,u.o)){pathRect(u,tx,ty,tx,ty,false);if(!u.partial){if(u.path.length)u.path[u.path.length-1]={x,y};else u.path=[{x,y}]}}else pathRect(u,tx,ty,tx,ty,true)}
function pathToEnt(u,e){if(e.k==='u'){const tx=e.x|0,ty=e.y|0;pathRect(u,tx,ty,tx,ty,true);if(!u.partial)u.path.push({x:e.x,y:e.y})}else pathRect(u,e.x,e.y,e.x+e.w-1,e.y+e.h-1,true)}
function step(u,dt){if(!u.path||!u.path.length)return true;const p=u.path[0];const dx=p.x-u.x,dy=p.y-u.y,d=Math.hypot(dx,dy),s=uSpd(u)*dt;
 if(Math.abs(dx)>.04)u.face=dx<0?-1:1;u.an+=dt*uSpd(u)*5;u.mv=1;
 if(d<=s){u.x=p.x;u.y=p.y;u.path.shift();return !u.path.length}
 const nx=u.x+dx/d*s,ny=u.y+dy/d*s;
 if(!passXY(Math.floor(nx),Math.floor(ny),u.o)&&passXY(Math.floor(u.x),Math.floor(u.y),u.o)){u.path=null;return false}
 u.x=nx;u.y=ny;return false}

/* ---------- resources ---------- */
function hasOpen(i){const x=i%W,y=(i/W)|0;for(let k=0;k<8;k++){const nx=x+DX[k],ny=y+DY[k];if(nx>=0&&ny>=0&&nx<W&&ny<H&&block[ny*W+nx]===0)return true}return false}
function nearestRes(rt,x,y,maxR,human){x|=0;y|=0;let best=-1,bd=1e9;for(let r=0;r<=maxR;r++){if(best>=0&&r>bd+1.5)break;
 for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++){if(Math.max(Math.abs(xx-x),Math.abs(yy-y))!==r)continue;if(xx<0||yy<0||xx>=W||yy>=H)continue;const i=yy*W+xx;
  if(resT[i]!==rt||resA[i]<=0)continue;if(human&&!explored[i])continue;if(!hasOpen(i))continue;const d=Math.hypot(xx-x,yy-y);if(d<bd){bd=d;best=i}}}return best}
function deplete(i){resT[i]=0;resA[i]=0;if(block[i]===1)block[i]=0}
function nearestDrop(o,res,x,y){let best=null,bd=1e9;for(const b of blds){if(b.o!==o||b.built<1)continue;const d0=B[b.type].drop;if(!d0||d0.indexOf(res)<0)continue;const d=rectDist(x,y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}return best}
function freeFarm(o,x,y){let best=null,bd=1e9;for(const b of blds){if(b.o!==o||b.type!=='farm')continue;if(b.worker&&ents.has(b.worker)){const w=ents.get(b.worker);if(w.task&&w.task.id===b.id)continue}const d=rectDist(x,y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}return best}
function autoGather(u,types,near){let best=-1,bd=1e9,bt=null;const c=ec(near);for(const t of types){const i=nearestRes(RT[t],c.x,c.y,9,u.o===0);if(i>=0){const d=Math.hypot(i%W-c.x,((i/W)|0)-c.y);if(d<bd){bd=d;best=i;bt=t}}}
 if(best<0)return false;u.task={k:'gather',rt:bt,tx:best%W,ty:(best/W)|0};return true}

/* ---------- unit AI ---------- */
function nearestEnemy(u,r){let best=null,bd=r;for(const e of units){if(e.o===u.o||e.gar)continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<bd){bd=d;best=e}}if(best)return best;
 for(const b of blds){if(b.o===u.o||B[b.type].flat)continue;const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}return best}
function nearestEnemyBld(u,r){let best=null,bd=r;for(const b of blds){if(b.o===u.o||B[b.type].flat)continue;const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}return best}
function updUnit(u,dt){
 if(u.gar)return;if(u.cd>0)u.cd-=dt;if(u.rp>0)u.rp-=dt;if(u.swing>0)u.swing-=dt;u.mv=0;
 const t=u.task;
 if(!t){if(u.path&&u.path.length){step(u,dt);return}
  if(isMil(u)){u.th-=dt;if(u.th<=0){u.th=.5+Math.random()*.3;const e=nearestEnemy(u,U[u.type].los+.5);if(e)u.task={k:'atk',id:e.id,auto:1}}}return}
 switch(t.k){
 case 'move':{if(!u.path||!u.path.length){const d=Math.hypot(t.x-u.x,t.y-u.y);if(d<.35||(t.n||0)>3){u.task=null;u.path=null;return}if(u.rp>0)return;t.n=(t.n||0)+1;u.rp=.4;goPoint(u,t.x,t.y);if(!u.path.length){u.task=null}return}
  step(u,dt);return}
 case 'atk':{const e=ents.get(t.id);
  if(!e||e.dead||(e.k==='u'&&e.gar)){u.path=null;u.task=null;
   if(t.after&&ents.has(t.after)){u.task={k:'atk',id:t.after,wave:t.wave};return}
   if(t.auto||t.wave){const n=nearestEnemy(u,U[u.type].los+2);if(n)u.task={k:'atk',id:n.id,auto:1,wave:t.wave}}return}
  const rng=uRng(u),d=edist(u,e),reach=(rng>0?rng:.3)+u.r;
  if(d<=reach){u.path=null;const c=ec(e);u.face=c.x<u.x?-1:1;
   if(u.cd<=0){const d0=U[u.type];u.cd=d0.rate;u.swing=.3;const dm=dmgTo(uAtk(u),d0.at,d0.bon,e);
    if(rng>0)shoot(u.x,u.y-.35,e,dm,u.o,u.id,u.type==='treb'?'rock':'arrow');else hit(e,dm,u.o,u.id)}return}
  if(t.auto&&d>U[u.type].los+4){u.task=null;u.path=null;return}
  t.rt=(t.rt||0)-dt;
  if(!u.path||!u.path.length||(t.rt<=0&&e.k==='u')){if(u.rp<=0){pathToEnt(u,e);u.rp=.5+Math.random()*.4;t.rt=1.2;
    if(u.partial&&u.path.length<2){const w=nearestEnemyBld(u,2.5);if(w&&w!==e){u.task={k:'atk',id:w.id,after:t.id,wave:t.wave};return}
     if(!u.path.length){t.stuck=(t.stuck||0)+1;if(t.stuck>4){u.task=null;return}}}}}
  step(u,dt);return}
 case 'gather':{if(t.ph==='ret')return doReturn(u,t,dt);
  const rt=RT[t.rt];let i=t.ty*W+t.tx;
  if(resT[i]!==rt||resA[i]<=0){const n=nearestRes(rt,t.tx,t.ty,8,false);if(n<0){if(u.carry>0&&u.ct===t.rt){t.ph='ret';t.end=1;return}u.task=null;return}t.tx=n%W;t.ty=(n/W)|0;i=n;u.path=null}
  if(rectDist(u.x,u.y,t.tx,t.ty,1,1)<=.8){u.path=null;u.face=t.tx+.5<u.x?-1:1;if(u.ct!==t.rt){u.carry=0;u.ct=t.rt}
   const a=Math.min(gRate(u.o,t.rt==='food'?'berry':t.rt)*dt,resA[i]);u.carry+=a;resA[i]-=a;u.work=1;u.an+=dt*7;
   if(resA[i]<=.001)deplete(i);
   if(u.carry>=P[u.o].m.carry){u.carry=P[u.o].m.carry;t.ph='ret';u.path=null}return}
  if(!u.path||!u.path.length){if(u.rp>0)return;u.rp=.4;pathRect(u,t.tx,t.ty,t.tx,t.ty,true);
   if(u.partial&&u.path.length<1){t.bad=(t.bad||0)+1;if(t.bad>3){const n=nearestRes(rt,u.x,u.y,10,false);if(n>=0&&n!==i){t.tx=n%W;t.ty=(n/W)|0;t.bad=0}else u.task=null}}}
  step(u,dt);return}
 case 'farm':{const f=ents.get(t.id);
  if(t.ph==='ret')return doReturn(u,t,dt);
  if(!f||f.dead){u.task=null;return}
  if(f.built<1){u.task={k:'build',id:f.id,q:[]};return}
  if(f.worker&&f.worker!==u.id){const w=ents.get(f.worker);if(w&&w.task&&w.task.k==='farm'&&w.task.id===f.id){const g=freeFarm(u.o,u.x,u.y);if(g){t.id=g.id;g.worker=u.id;t.px=0}else u.task=null;return}}
  f.worker=u.id;
  if(!t.px){t.px=f.x+.7+Math.random()*1.6;t.py=f.y+.7+Math.random()*1.6}
  if(Math.hypot(u.x-t.px,u.y-t.py)<.3){u.path=null;if(u.ct!=='food'){u.carry=0;u.ct='food'}
   const a=Math.min(gRate(u.o,'farm')*dt,f.food);u.carry+=a;f.food-=a;u.work=1;u.an+=dt*6;
   if(f.food<=.001){farmDone(f,u,t);t.ph='ret';u.path=null;return}
   if(u.carry>=P[u.o].m.carry){t.ph='ret';u.path=null}return}
  if(!u.path||!u.path.length){if(u.rp>0)return;u.rp=.4;goPoint(u,t.px,t.py)}
  step(u,dt);return}
 case 'build':{const b=ents.get(t.id);
  if(!b||b.dead||(b.built>=1&&b.hp>=bMaxHp(b)))return nextBuild(u,t,b);
  const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);
  if(d<=.82){u.path=null;u.work=1;u.an+=dt*7;const c=ec(b);u.face=c.x<u.x?-1:1;const mx=bMaxHp(b),tm=B[b.type].tm;
   if(b.built<1){if(!b.started){b.started=1;evict(b)}b.built=Math.min(1,b.built+dt/tm);b.hp=Math.min(mx,b.hp+mx*dt/tm);if(b.built>=1)onBuilt(b)}
   else b.hp=Math.min(mx,b.hp+mx*dt/(tm*2));return}
  if(!u.path||!u.path.length){if(u.rp>0)return;u.rp=.4;pathRect(u,b.x,b.y,b.x+b.w-1,b.y+b.h-1,true);if(u.partial&&!u.path.length){t.bad=(t.bad||0)+1;if(t.bad>3)return nextBuild(u,t,null)}}
  step(u,dt);return}
 case 'gar':{const b=ents.get(t.id);if(!b||b.dead||b.gar.length>=(B[b.type].gar||0)){u.task=t.prev||null;return}
  if(rectDist(u.x,u.y,b.x,b.y,b.w,b.h)<=.8){u.gar=b.id;b.gar.push(u.id);u.path=null;u.task=t.prev||null;const k=sel.indexOf(u.id);if(k>=0){sel.splice(k,1);panelDirty=true}return}
  if(!u.path||!u.path.length){if(u.rp>0)return;u.rp=.4;pathRect(u,b.x,b.y,b.x+b.w-1,b.y+b.h-1,true)}
  step(u,dt);return}
 default:u.task=null}}
function doReturn(u,t,dt){let b=t.drop&&ents.get(t.drop);
 if(!b||b.dead||b.built<1){b=nearestDrop(u.o,u.ct||'food',u.x,u.y);t.drop=b?b.id:0;u.path=null;
  if(!b){if(u.o===0)toastOnce('drop'+u.ct,`Build a ${u.ct==='wood'?'Lumber Camp':u.ct==='food'?'Mill':'Mining Camp'} so villagers can drop off ${u.ct}`);u.task=null;return}}
 if(rectDist(u.x,u.y,b.x,b.y,b.w,b.h)<=.82){if(u.ct){P[u.o].res[u.ct]+=u.carry;P[u.o].st.gath+=u.carry}u.carry=0;t.ph=null;t.drop=0;u.path=null;
  if(t.end||(t.k==='farm'&&!ents.has(t.id)))u.task=null;return}
 if(!u.path||!u.path.length){if(u.rp>0)return;u.rp=.4;pathRect(u,b.x,b.y,b.x+b.w-1,b.y+b.h-1,true)}
 step(u,dt)}
function farmDone(f,u,t){const p=P[f.o];const x=f.x,y=f.y;kill(f,null,true);
 if(p.res.wood>=60){pay(p,B.farm.cost);const nf=mkBld('farm',f.o,x,y,false);nf.worker=u.id;t.id=nf.id;t.px=0}
 else{t.end=1;if(f.o===0)toastOnce('farmwood','A farm ran out. Need 60 wood to reseed it.')}}
function nextBuild(u,t,b){u.path=null;let nb=null;
 if(t.q&&t.q.length){t.q=t.q.filter(id=>{const e=ents.get(id);return e&&e.built<1});let bd=1e9;for(const id of t.q){const e=ents.get(id);const d=rectDist(u.x,u.y,e.x,e.y,e.w,e.h);if(d<bd){bd=d;nb=e}}}
 if(nb){t.id=nb.id;t.bad=0;return}
 if(b&&!b.dead&&b.o===u.o){const ty=b.type;
  if(ty==='farm'){if(!b.worker||b.worker===u.id||!ents.has(b.worker)){b.worker=u.id;u.task={k:'farm',id:b.id};return}}
  if(ty==='lumber'&&autoGather(u,['wood'],b))return;
  if(ty==='mine'&&autoGather(u,['gold','stone'],b))return;
  if(ty==='mill'&&autoGather(u,['food'],b))return}
 if(t.prev){u.task=t.prev;return}
 u.task=null}
function separate(){const n=units.length;for(let i=0;i<n;i++){const a=units[i];if(a.gar)continue;for(let j=i+1;j<n;j++){const b=units[j];if(b.gar)continue;
 const dx=b.x-a.x;if(dx>.9||dx<-.9)continue;const dy=b.y-a.y;if(dy>.9||dy<-.9)continue;const m=(a.r+b.r)*.8,d2=dx*dx+dy*dy;if(d2>=m*m)continue;
 const wa=a.work||U[a.type].sie?.15:1,wb=b.work||U[b.type].sie?.15:1;let d=Math.sqrt(d2),nx,ny;if(d<1e-4){nx=Math.random()-.5;ny=Math.random()-.5;d=.01}else{nx=dx/d;ny=dy/d}
 const push=(m-d)*.25;const ax=a.x-nx*push*wa,ay=a.y-ny*push*wa,bx=b.x+nx*push*wb,by=b.y+ny*push*wb;
 if(passXY(Math.floor(ax),Math.floor(ay),a.o)){a.x=ax;a.y=ay}if(passXY(Math.floor(bx),Math.floor(by),b.o)){b.x=bx;b.y=by}}}}

/* ---------- buildings ---------- */
function spawn(b,type){const p=freeAround(b);const u=mkUnit(type,b.o,p.x,p.y);P[b.o].st.trained++;
 const r=b.rally;if(r){if(r.rt&&type==='villager'&&resT[r.ty*W+r.tx]===RT[r.rt])u.task={k:'gather',rt:r.rt,tx:r.tx,ty:r.ty};
  else if(r.bid&&type==='villager'&&ents.has(r.bid)){const e=ents.get(r.bid);if(e.type==='farm'&&e.built>=1)u.task={k:'farm',id:e.id};else u.task={k:'build',id:e.id,q:[]}}
  else u.task={k:'move',x:r.x,y:r.y}}

 return u}
function applyTech(p,id){const t=TECH[id];
 if(t.up){p.age=t.up;if(p.i===0)toast('You have reached the '+AGE[p.age]+'!','good');else toast('Your rival has reached the '+AGE[p.age],'bad');panelDirty=true;return}
 const before=blds.filter(b=>b.o===p.i).map(b=>[b,b.hp/bMaxHp(b)]);const vh=p.m.vhp;
 p.techs.push(id);p.m=newMods();for(const k of p.techs)TECH[k].fx(p.m);
 for(const [b,f] of before)b.hp=f*bMaxHp(b);
 if(p.m.vhp!==vh)for(const u of units)if(u.o===p.i&&u.type==='villager')u.hp+=p.m.vhp-vh;
 if(p.i===0)toast(t.n+' researched','good');panelDirty=true}
function inQueue(o,id){return blds.some(b=>b.o===o&&b.queue.some(q=>q.t===id))}
function techOk(p,id){const t=TECH[id];if(t.up)return p.age===t.age&&!inQueue(p.i,id);return p.age>=t.age&&p.techs.indexOf(id)<0&&!inQueue(p.i,id)&&(!t.req||p.techs.indexOf(t.req)>=0)}
function updBld(b,dt){if(b.built<1)return;const d=B[b.type],p=P[b.o];
 if(b.queue.length){const q=b.queue[0];const tm=q.u?U[q.u].tm:TECH[q.t].tm;
  if(q.p<tm){q.p+=dt;if(q.t&&q.p>=tm){b.queue.shift();applyTech(p,q.t)}}
  if(q.u&&q.p>=tm){if(p.pop<p.popCap){b.queue.shift();spawn(b,q.u)}else if(b.o===0)toastOnce('house','You need more houses! Population is full.',20)}}
 if(d.arr){b.cd-=dt;if(b.cd<=0){const r=d.arr.r+p.m.rng+Math.max(b.w,b.h)/2;const c=ec(b);let e=null,bd=r;
  for(const u of units){if(u.o===b.o||u.gar)continue;const dd=Math.hypot(u.x-c.x,u.y-c.y);if(dd<bd){bd=dd;e=u}}
  if(e){const n=Math.min(10,d.arr.n+(b.type==='tc'?b.gar.length:0)),a=d.arr.a+p.m.atk.p;for(let k=0;k<n;k++)shoot(c.x+(Math.random()-.5)*b.w*.6,c.y-.8-(Math.random()*.4),e,dmgTo(a,'p',null,e),b.o,b.id,'arrow');b.cd=2}else b.cd=.4}}}
function ringBell(o,on){const p=P[o];p.bell=on;
 if(on){const tcs=blds.filter(b=>b.o===o&&b.type==='tc'&&b.built>=1);if(!tcs.length)return;
  for(const u of units){if(u.o!==o||u.type!=='villager'||u.gar)continue;let best=null,bd=18;for(const b of tcs){const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}
   if(best){const prev=u.task&&u.task.k!=='gar'?u.task:null;if(prev){prev.ph=null;}u.task={k:'gar',id:best.id,prev};u.path=null}}
  if(o===0)toast('The town bell rings! Villagers take cover.','bad')}
 else{for(const b of blds){if(b.o!==o)continue;for(const id of b.gar){const u=ents.get(id);if(!u)continue;u.gar=0;const q=freeAround(b);u.x=q.x;u.y=q.y;u.path=null}b.gar=[]}
  for(const u of units)if(u.o===o&&u.task&&u.task.k==='gar')u.task=u.task.prev||null;if(o===0)toast('All clear. Back to work.')}}

/* ---------- map ---------- */
function makeNoise(seed){const r=mulberry(seed),G=64,g=new Float32Array(G*G);for(let i=0;i<G*G;i++)g[i]=r();const s=t=>t*t*(3-2*t);
 return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const a=g[(yi&63)*G+(xi&63)],b=g[(yi&63)*G+((xi+1)&63)],c=g[((yi+1)&63)*G+(xi&63)],d=g[((yi+1)&63)*G+((xi+1)&63)];const u=s(xf),v=s(yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}}
function genMap(seed){rnd=mulberry(seed);resT.fill(0);resA.fill(0);block.fill(0);occ.fill(0);
 const flip=rnd()<.5;const s0=[10+ri(3),10+ri(3)],s1=[W-14-ri(3),H-14-ri(3)];
 if(flip){s0[0]=W-4-s0[0];s1[0]=W-4-s1[0]}
 const starts=[s0,s1];
 const n1=makeNoise(seed+7),n2=makeNoise(seed+11);
 const nearStart=(x,y,r)=>starts.some(s=>Math.hypot(x-(s[0]+2),y-(s[1]+2))<r);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const edge=Math.min(x,y,W-1-x,H-1-y);const v=n1(x/9,y/9)*.65+n2(x/3.5,y/3.5)*.35;
  if(edge<2||(edge<4&&v>.45)||(v>.63&&!nearStart(x,y,9.5)))setRes(x,y,1)}
 const blob=(type,cx,cy,count)=>{const q=[[cx,cy]];let c=0,g=0;while(q.length&&c<count&&g++<400){const k=ri(q.length);const [x,y]=q.splice(k,1)[0];if(x<2||y<2||x>=W-2||y>=H-2)continue;const i=y*W+x;if(resT[i]&&resT[i]!==1)continue;if(nearStart(x,y,4.2))continue;if(resT[i]===1)resT[i]=0;setRes(x,y,type);c++;q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])}};
 const around=(s,d,f)=>{const a=rnd()*Math.PI*2;return[Math.round(s[0]+2+Math.cos(a)*d),Math.round(s[1]+2+Math.sin(a)*d),a]};
 for(const s of starts){let p=around(s,6.5);blob(4,p[0],p[1],7);p=around(s,9);blob(2,p[0],p[1],7);p=around(s,10);blob(3,p[0],p[1],5);p=around(s,15);blob(2,p[0],p[1],5);
  p=around(s,11);for(let k=0;k<26;k++){const x=p[0]+ri(7)-3,y=p[1]+ri(7)-3;if(x>1&&y>1&&x<W-2&&y<H-2&&!resT[y*W+x]&&!nearStart(x,y,7))setRes(x,y,1)}}
 for(let k=0;k<5;k++){const x=6+ri(W-12),y=6+ri(H-12);if(!nearStart(x,y,14))blob(k%2?3:2,x,y,5)}
 for(let k=0;k<3;k++){const x=6+ri(W-12),y=6+ri(H-12);if(!nearStart(x,y,12))blob(4,x,y,5)}
 for(const s of starts)for(let y=s[1];y<s[1]+4;y++)for(let x=s[0];x<s[0]+4;x++)deplete(y*W+x);
 return starts}
function setRes(x,y,t){const i=y*W+x;resT[i]=t;resA[i]=RAMT[t];block[i]=1}
function renderGround(seed){const S2=16,gw=W*S2;groundCv.width=gw;groundCv.height=gw;const g=groundCv.getContext('2d');const id=g.createImageData(gw,gw),d=id.data;
 const n1=makeNoise(seed+3),n2=makeNoise(seed+5),n3=makeNoise(seed+9);const r2=mulberry(seed+1);
 const tcs=blds.filter(b=>b.type==='tc').map(b=>[b.x+2,b.y+2]);
 for(let y=0;y<gw;y++)for(let x=0;x<gw;x++){const wx=x/S2,wy=y/S2;let v=n1(wx/7,wy/7)*.55+n2(wx/2,wy/2)*.3+n3(wx*1.3,wy*1.3)*.15;v+=(r2()-.5)*.08;
  const ti=(wy|0)*W+(wx|0);let r=74+v*46,gg=112+v*44,b=44+v*20;
  if(resT[ti]===1){r*=.72;gg*=.78;b*=.75}
  let dirt=0;for(const c of tcs){const dd=Math.hypot(wx-c[0],wy-c[1]);dirt=Math.max(dirt,clamp((5.2+n2(wx,wy)*1.6-dd)/1.4,0,1))}
  if(dirt>0){r=r*(1-dirt)+(150+v*30)*dirt;gg=gg*(1-dirt)+(122+v*24)*dirt;b=b*(1-dirt)+(78+v*18)*dirt}
  const o=(y*gw+x)*4;d[o]=r;d[o+1]=gg;d[o+2]=b;d[o+3]=255}
 g.putImageData(id,0,0);
 g.globalAlpha=.5;for(let k=0;k<900;k++){const x=r2()*gw,y=r2()*gw,ti=((y/S2)|0)*W+((x/S2)|0);if(resT[ti])continue;g.fillStyle=r2()<.5?'#9bbd5a':'#4f7a2e';g.fillRect(x,y,1.2,2.2)}
 for(let k=0;k<120;k++){const x=r2()*gw,y=r2()*gw,ti=((y/S2)|0)*W+((x/S2)|0);if(resT[ti])continue;g.fillStyle=['#e8e2a0','#d9a0c8','#f4f0e6'][k%3];g.fillRect(x,y,1.4,1.4)}g.globalAlpha=1}

/* ---------- fog ---------- */
function computeFog(){vis.fill(0);const mark=(cx,cy,r)=>{const r2=r*r+r;const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(W-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(H-1,Math.ceil(cy+r));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=x+.5-cx,dy=y+.5-cy;if(dx*dx+dy*dy<=r2){const i=y*W+x;vis[i]=1;explored[i]=1}}};
 for(const u of units)if(u.o===0&&!u.gar)mark(u.x,u.y,U[u.type].los);
 for(const b of blds)if(b.o===0)mark(b.x+b.w/2,b.y+b.h/2,B[b.type].los+Math.max(b.w,b.h)/2);
 const d=fogImg.data;for(let i=0;i<N;i++){d[i*4+3]=vis[i]?0:explored[i]?120:255}fogCtx.putImageData(fogImg,0,0)}

/* ---------- AI ---------- */
function aiInit(p,diff){p.ai={diff,t:0,nextWave:[960,660,450][diff],gap:[360,250,190][diff],wave:[4,6,8][diff],vilT:[20,28,36][diff],bonus:[.85,1.05,1.3][diff],waves:new Set(),saving:false}}
function aiSpot(o,type,cx,cy,r0,r1){const d=B[type];for(let r=r0;r<=r1;r++){const cand=[];for(let y=Math.round(cy)-r;y<=Math.round(cy)+r;y++)for(let x=Math.round(cx)-r;x<=Math.round(cx)+r;x++){if(Math.max(Math.abs(x-Math.round(cx)),Math.abs(y-Math.round(cy)))!==r)continue;cand.push([x-(d.w>>1),y-(d.h>>1)])}
 for(let k=cand.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));const t=cand[k];cand[k]=cand[j];cand[j]=t}
 for(const [x,y] of cand)if(canPlace(type,x,y,o,!d.flat))return[x,y]}return null}
function aiBuild(p,type,cx,cy,r0,r1){if(!afford(p,B[type].cost))return false;const s=aiSpot(p.i,type,cx,cy,r0,r1);if(!s)return false;
 const vils=units.filter(u=>u.o===p.i&&u.type==='villager'&&!u.gar&&(!u.task||u.task.k!=='build'));if(!vils.length)return false;
 vils.sort((a,b)=>Math.hypot(a.x-s[0],a.y-s[1])-Math.hypot(b.x-s[0],b.y-s[1]));const v=vils.find(u=>!u.task||u.task.k==='gather'&&u.task.rt!=='gold')||vils[0];
 pay(p,B[type].cost);const b=mkBld(type,p.i,s[0],s[1],false);const prev=v.task&&v.task.k!=='build'?v.task:null;if(prev){prev.ph=prev.ph==='ret'?'ret':null}v.task={k:'build',id:b.id,q:[],prev};v.path=null;return b}
function aiAssign(p,v,home,vils){
 const cnt={food:0,wood:0,gold:0,stone:0};for(const u of vils){const t=u.task;if(!t)continue;if(t.k==='gather')cnt[t.rt]++;else if(t.k==='farm')cnt.food++;else if(t.k==='build'&&t.prev){if(t.prev.k==='farm')cnt.food++;else if(t.prev.rt)cnt[t.prev.rt]++}}
 const ratio=p.age===0?{food:.5,wood:.38,gold:.08,stone:.04}:p.age===1?{food:.42,wood:.32,gold:.18,stone:.08}:{food:.3,wood:.3,gold:.28,stone:.12};
 const n=vils.length,R=p.res,adj=r=>cnt[r]-ratio[r]*n+(R[r]>700?3:0)-(R[r]<100?2:0);const order=R4.slice().sort((a,b)=>adj(a)-adj(b));
 for(const r of order){if(r==='food'){const f=freeFarm(p.i,home.x,home.y);if(f&&f.built>=1){f.worker=v.id;v.task={k:'farm',id:f.id};return}
   const bi=nearestRes(4,home.x,home.y,13,false);if(bi>=0){v.task={k:'gather',rt:'food',tx:bi%W,ty:(bi/W)|0};return}
   if(f&&f.built<1){v.task={k:'build',id:f.id,q:[]};return}continue}
  const drops=blds.filter(b=>b.o===p.i&&b.built>=1&&B[b.type].drop&&B[b.type].drop.indexOf(r)>=0&&b.type!=='tc');
  let i=-1;for(const b of drops){const j=nearestRes(RT[r],b.x+1,b.y+1,8,false);if(j>=0){i=j;break}}
  if(i<0)i=nearestRes(RT[r],home.x,home.y,r==='wood'?20:26,false);
  if(i>=0){v.task={k:'gather',rt:r,tx:i%W,ty:(i/W)|0};return}}}
function aiTick(p){const ai=p.ai,o=p.i;ai.t+=1;
 const my=units.filter(u=>u.o===o),vils=my.filter(u=>u.type==='villager'),army=my.filter(u=>u.type!=='villager');
 const mb=blds.filter(b=>b.o===o);const has=(t,done)=>mb.filter(b=>b.type===t&&(!done||b.built>=1));const pending=t=>mb.some(b=>b.type===t&&b.built<1);
 const tcs=has('tc',1);const anchor=tcs[0]||has('castle',1)[0]||mb.find(b=>!B[b.type].wall);
 const home=anchor?{x:anchor.x+anchor.w/2,y:anchor.y+anchor.h/2}:vils[0]?{x:vils[0].x,y:vils[0].y}:null;if(!home)return;
 const R=p.res;const nextAge=['feudal','castle','imperial'][p.age];const ageT=[14,21,27][p.age];
 const ageQ=nextAge&&inQueue(o,nextAge);ai.saving=!!nextAge&&!ageQ&&vils.length>=ageT-2;
 if(!tcs.length&&vils.length&&R.wood>=275&&R.stone>=100&&!pending('tc')){aiBuild(p,'tc',home.x,home.y,0,8)}
 if(nextAge&&!ageQ&&vils.length>=ageT&&afford(p,TECH[nextAge].cost)&&tcs.length){pay(p,TECH[nextAge].cost);tcs[0].queue.push({t:nextAge,p:0})}
 if(vils.length<ai.vilT)for(const tc of tcs){if(tc.queue.length<(ageQ?1:2)&&afford(p,U.villager.cost)&&!(ai.saving&&R.food<TECH[nextAge].cost.food&&R.food>=TECH[nextAge].cost.food-60)){pay(p,U.villager.cost);tc.queue.push({u:'villager',p:0})}}
 const room=p.popCap-p.pop-tcs.reduce((a,b)=>a+b.queue.filter(q=>q.u).length,0);
 if(room<=3+(vils.length>18?3:0)&&p.popCap<200&&mb.filter(b=>b.type==='house'&&b.built<1).length<(vils.length>18?2:1))aiBuild(p,'house',home.x,home.y,4,13);
 if(vils.length>=4&&!pending('lumber')){const wi=nearestRes(1,home.x,home.y,26,false);if(wi>=0){const wx=wi%W,wy=(wi/W)|0;if(!mb.some(b=>B[b.type].drop&&B[b.type].drop.indexOf('wood')>=0&&rectDist(wx+.5,wy+.5,b.x,b.y,b.w,b.h)<5))aiBuild(p,'lumber',wx,wy,1,5)}}
 if(vils.length>=9&&!pending('mill')&&!has('mill').length&&nearestRes(4,home.x,home.y,13,false)<0)aiBuild(p,'mill',home.x,home.y,4,8);
 if(vils.length>=6&&!pending('mill')){const bi=nearestRes(4,home.x,home.y,13,false);if(bi>=0&&!mb.some(b=>B[b.type].drop&&B[b.type].drop.indexOf('food')>=0&&rectDist(bi%W+.5,((bi/W)|0)+.5,b.x,b.y,b.w,b.h)<4))aiBuild(p,'mill',bi%W,(bi/W)|0,1,4)}
 for(const [r,need] of [['gold',11],['stone',p.age>=1?17:99]]){if(vils.length<need||pending('mine'))continue;const gi=nearestRes(RT[r],home.x,home.y,26,false);if(gi<0)continue;const gx=gi%W,gy=(gi/W)|0;
  if(!mb.some(b=>B[b.type].drop&&B[b.type].drop.indexOf(r)>=0&&rectDist(gx+.5,gy+.5,b.x,b.y,b.w,b.h)<4))aiBuild(p,'mine',gx,gy,1,4)}
 const farms=has('farm');const berries=nearestRes(4,home.x,home.y,13,false)>=0;const foodV=vils.filter(u=>u.task&&(u.task.k==='farm'||u.task.rt==='food')).length;
 if(vils.length>=8&&!pending('farm')&&farms.length<ai.vilT*.45&&(!berries||farms.length<foodV-5)&&R.wood>=(ai.saving?60:100)){const m=has('mill',1)[0];const near=farms.length<7||!m?home:{x:m.x+1,y:m.y+1};aiBuild(p,'farm',near.x,near.y,3,9)}
 if(p.age>=2&&ai.diff>0&&!has('castle').length&&R.stone>=650)aiBuild(p,'castle',home.x,home.y,6,13);
 if(!ai.saving||R.wood>400){
  if(vils.length>=11&&!has('barracks').length)aiBuild(p,'barracks',home.x,home.y,6,14);
  if(p.age>=1){if(!has('range').length&&vils.length>=15)aiBuild(p,'range',home.x,home.y,6,15);if(!has('smith').length&&vils.length>=17)aiBuild(p,'smith',home.x,home.y,5,14);if(!has('stable').length&&vils.length>=19)aiBuild(p,'stable',home.x,home.y,6,15)}
  if(p.age>=2){if(!has('workshop').length&&vils.length>=24)aiBuild(p,'workshop',home.x,home.y,6,15);
   if(has('barracks').length<2&&R.wood>500)aiBuild(p,'barracks',home.x,home.y,7,16)}
  if(ai.diff===2&&p.age>=1&&has('tower').length<2&&R.stone>=200)aiBuild(p,'tower',home.x+(Math.random()-.5)*10,home.y+(Math.random()-.5)*10,4,9)}
 if(!ai.saving){for(const tid of ['loom','wheel','axe','collar','goldm','forge','fletch','scale','bodkin','iron','chain','saw','plow','stonem','masonry','blast','bracer','plate']){
  if(tid==='loom'&&vils.length<12)continue;const t=TECH[tid];if(!techOk(p,tid))continue;const bt=Object.keys(B).find(k=>B[k].tech&&B[k].tech.indexOf(tid)>=0);
  const b=has(bt,1).find(x=>!x.queue.length);if(!b)continue;const c=t.cost;if(R4.every(r=>(R[r]||0)>=(c[r]||0)*1.3)){pay(p,c);b.queue.push({t:tid,p:0});break}}}
 if(!ai.saving||army.length<4||R.food>900){const prod=mb.filter(b=>b.built>=1&&B[b.type].train&&b.type!=='tc'&&b.type!=='castle'&&b.queue.length<1);
  if(p.age>=3)prod.push(...has('castle',1).filter(b=>!b.queue.length));
  for(const b of prod){if(room<=0)break;const opts=B[b.type].train.filter(t=>U[t].age<=p.age);if(!opts.length)continue;let pick=opts[opts.length-1];
   if(b.type==='barracks'&&p.age>=1&&Math.random()<.45)pick='spear';if(b.type==='stable'&&p.age<2)pick='scout';if(b.type==='workshop'&&army.filter(u=>u.type==='ram').length>=3)continue;if(b.type==='castle'&&army.filter(u=>u.type==='treb').length>=2)continue;
   if(afford(p,U[pick].cost)){pay(p,U[pick].cost);b.queue.push({u:pick,p:0})}}}
 if(ai.t%15===0){const rich=R4.filter(r=>R[r]>750).sort((a,b)=>R[b]-R[a])[0],poor=R4.filter(r=>R[r]<150)[0];
  if(rich&&poor){let k=0;for(const v of vils){if(k>=2)break;const t=v.task;if(!t)continue;if((t.k==='gather'&&t.rt===rich&&t.ph!=='ret')||(rich==='food'&&t.k==='farm'&&t.ph!=='ret')){if(t.k==='farm'){const f=ents.get(t.id);if(f)f.worker=0}v.task=null;v.path=null;k++}}}}
 for(const v of vils)if(!v.task&&!v.gar)aiAssign(p,v,home,vils);
 let threat=null,td=17;for(const e of units){if(e.o===o||e.gar)continue;const d=Math.hypot(e.x-home.x,e.y-home.y);if(d<td){td=d;threat=e}}
 if(threat){for(const u of army){if(ai.waves.has(u.id))continue;if(!u.task||u.task.auto||u.task.k==='move')u.task={k:'atk',id:threat.id,auto:1}}}
 if(ai.diff>0&&threat&&!p.bell&&units.filter(e=>e.o!==o&&Math.hypot(e.x-home.x,e.y-home.y)<12&&isMil(e)).length>=6&&tcs.length)ringBell(o,true);
 if(p.bell&&(!threat||td>16))ringBell(o,false);
 for(const id of [...ai.waves])if(!ents.has(id))ai.waves.delete(id);
 if(ai.t>=ai.nextWave&&army.length>=ai.wave){ai.nextWave=ai.t+ai.gap;ai.wave+=2;for(const u of army)ai.waves.add(u.id)}
 for(const id of ai.waves){const u=ents.get(id);if(!u||u.task&&!u.task.auto&&u.task.k==='atk')continue;if(u.task&&u.task.k==='atk')continue;
  let best=null,bd=1e9;for(const b of blds){if(b.o===o||B[b.type].flat)continue;const pr=B[b.type].wall?20:0;const d=Math.hypot(b.x-u.x,b.y-u.y)+pr+(u.type==='ram'||u.type==='treb'?0:0);if(d<bd){bd=d;best=b}}
  if(best)u.task={k:'atk',id:best.id,wave:1}}}

/* ---------- placement ---------- */
function canPlace(type,x,y,o,margin){const d=B[type];if(x<0||y<0||x+d.w>W||y+d.h>H)return false;
 for(let yy=y;yy<y+d.h;yy++)for(let xx=x;xx<x+d.w;xx++){const i=yy*W+xx;if(block[i]||occ[i])return false;if(o===0&&!explored[i])return false}
 if(margin){for(let yy=y-1;yy<=y+d.h;yy++)for(let xx=x-1;xx<=x+d.w;xx++){if(xx<0||yy<0||xx>=W||yy>=H)return false;if(yy>=y&&yy<y+d.h&&xx>=x&&xx<x+d.w)continue;const i=yy*W+xx;if(block[i]>=2)return false;if(occ[i]&&!B[ents.get(occ[i]).type].flat)return false}}
 if(o===0)for(const u of units)if(u.o!==0&&!u.gar&&u.x>x&&u.x<x+d.w&&u.y>y&&u.y<y+d.h)return false;
 return true}
function wallLine(ax,ay,bx,by){const out=[[ax,ay]];let x=ax,y=ay;const dx=Math.abs(bx-ax),dy=-Math.abs(by-ay),sx=Math.sign(bx-ax),sy=Math.sign(by-ay);let err=dx+dy,n=0;
 while((x!==bx||y!==by)&&n++<300){const e2=2*err;let mx=false,my=false;if(e2>=dy){err+=dy;mx=true}if(e2<=dx){err+=dx;my=true}if(mx&&my)out.push([x+sx,y]);if(mx)x+=sx;if(my)y+=sy;out.push([x,y])}
 return out}
function selVils(){return sel.map(id=>ents.get(id)).filter(u=>u&&u.k==='u'&&u.o===0&&u.type==='villager')}
function assignBuild(vils,ids){if(!ids.length)return;for(const v of vils){const prev=v.task&&(v.task.k==='gather'||v.task.k==='farm')?v.task:null;if(prev)prev.ph=prev.ph==='ret'?'ret':null;
 let best=ids[0],bd=1e9;for(const id of ids){const e=ents.get(id);const d=rectDist(v.x,v.y,e.x,e.y,e.w,e.h);if(d<bd){bd=d;best=id}}
 v.task={k:'build',id:best,q:ids.filter(i=>i!==best),prev};v.path=null}}
function confirmPlace(){if(!placing||placing.tx==null)return;const p=P[0],d=B[placing.type];const vils=selVils();
 if(d.wall){if(placing.ax==null){placing.ax=placing.tx;placing.ay=placing.ty;panelDirty=true;return}
  const tiles=wallLine(placing.ax,placing.ay,placing.tx,placing.ty);const ids=[];let skipped=0;
  for(const [x,y] of tiles){if(!canPlace(placing.type,x,y,0,false)){skipped++;continue}if(!afford(p,d.cost)){toast('Not enough '+Object.keys(d.cost)[0]+' for the whole wall','bad');break}pay(p,d.cost);ids.push(mkBld(placing.type,0,x,y,false).id)}
  if(!ids.length){toast("Can't build there",'bad');return}assignBuild(vils,ids);placing=null;panelDirty=true;return}
 if(!canPlace(placing.type,placing.tx,placing.ty,0,false)){toast("Can't build there",'bad');return}
 if(!afford(p,d.cost)){toast('Need '+need(p,d.cost),'bad');return}
 pay(p,d.cost);const b=mkBld(placing.type,0,placing.tx,placing.ty,false);assignBuild(vils,[b.id]);
 fx.push({k:'ring',x:b.x+b.w/2,y:b.y+b.h/2,t:0,life:.6,c:'#7fe06a'});placing=null;panelDirty=true}

/* ---------- sprites ---------- */
const sprC=new Map();
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;if(f<0){r*=1+f;g*=1+f;b*=1+f}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}return`rgb(${r|0},${g|0},${b|0})`}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function flag(g,x,y,col,h=16){g.strokeStyle='#3a2a1a';g.lineWidth=1.6;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-h);g.stroke();g.fillStyle=col;g.beginPath();g.moveTo(x,y-h);g.quadraticCurveTo(x+6,y-h+1,x+11,y-h+3);g.quadraticCurveTo(x+6,y-h+5,x,y-h+7);g.fill();g.fillStyle='#ffffff40';g.fillRect(x,y-h,4,2)}
function wallFace(g,x,y,w,h,st){g.fillStyle=st.wall;g.fillRect(x,y,w,h);const k=st.kind;g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
 if(k==='gable'){g.strokeStyle=shade(st.wall,-.22);g.lineWidth=.8;for(let yy=y+5,r=0;yy<y+h;yy+=5,r++){g.beginPath();g.moveTo(x,yy);g.lineTo(x+w,yy);g.stroke();for(let xx=x+(r%2?4:9);xx<x+w;xx+=10){g.beginPath();g.moveTo(xx,yy-5);g.lineTo(xx,yy);g.stroke()}}}
 else if(k==='steep'){g.strokeStyle=shade(st.wall,-.3);g.lineWidth=1;for(let xx=x+3;xx<x+w;xx+=5){g.beginPath();g.moveTo(xx,y);g.lineTo(xx,y+h);g.stroke()}g.fillStyle=shade(st.wall,.12);for(let xx=x+1;xx<x+w;xx+=5)g.fillRect(xx,y,1,h)}
 else if(k==='pagoda'){g.fillStyle='#3b2a20';g.fillRect(x,y,w,2.5);g.fillRect(x,y+h-3,w,3);g.fillStyle=st.pillar;for(let xx=x;xx<x+w;xx+=Math.max(10,w/4)){g.fillRect(xx,y,3,h)}g.fillRect(x+w-3,y,3,h)}
 else{g.fillStyle=shade(st.wall,.15);g.fillRect(x,y,w,2);g.fillStyle=shade(st.wall,-.25);for(let xx=x+6;xx<x+w-6;xx+=12){g.beginPath();g.moveTo(xx,y+h*.75);g.lineTo(xx,y+h*.4);g.arc(xx+2.5,y+h*.4,2.5,Math.PI,0);g.lineTo(xx+5,y+h*.75);g.fill()}}
 const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=gr;g.fillRect(x,y,w,h);g.restore()}
function door(g,cx,by,w,h,col){g.fillStyle='#2a1a10';g.beginPath();g.moveTo(cx-w/2,by);g.lineTo(cx-w/2,by-h+w/2);g.arc(cx,by-h+w/2,w/2,Math.PI,0);g.lineTo(cx+w/2,by);g.fill();if(col){g.fillStyle=col;g.globalAlpha=.55;g.fillRect(cx-w/2+1,by-2,w-2,2);g.globalAlpha=1}}
function roof(g,x,y,w,h,st,col,kind){kind=kind||st.kind;
 if(kind==='gable'||kind==='steep'){const ov=kind==='steep'?3:2.5;const top=st.roof,bot=st.roofD;
  g.fillStyle=top;g.fillRect(x-ov,y-ov,w+ov*2,h/2+ov);g.fillStyle=bot;g.fillRect(x-ov,y+h/2,w+ov*2,h/2+ov);
  g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=.8;for(let yy=y-ov+3;yy<y+h+ov;yy+=3.5){g.beginPath();g.moveTo(x-ov,yy);g.lineTo(x+w+ov,yy);g.stroke()}
  if(kind==='steep'){g.strokeStyle='rgba(255,255,220,.13)';for(let xx=x-ov+2;xx<x+w+ov;xx+=3){g.beginPath();g.moveTo(xx,y-ov);g.lineTo(xx+1,y+h/2);g.stroke()}}
  g.fillStyle='rgba(255,255,255,.28)';g.fillRect(x-ov,y+h/2-1,w+ov*2,1.6);
  g.fillStyle=col;g.fillRect(x-ov,y+h+ov-2,w+ov*2,2);
  if(kind==='steep'){g.strokeStyle='#3a2716';g.lineWidth=2;for(const xx of [x-ov,x+w+ov]){g.beginPath();g.moveTo(xx,y+h/2+4);g.lineTo(xx+(xx<x+w/2?4:-4),y+h/2-6);g.stroke()}}}
 else if(kind==='pagoda'){const ov=5,up=5;g.fillStyle=st.roofD;g.beginPath();g.moveTo(x-ov-3,y-ov-up);g.quadraticCurveTo(x+w/2,y-ov+2,x+w+ov+3,y-ov-up);g.quadraticCurveTo(x+w+ov-2,y+h/2,x+w+ov+3,y+h+ov-up+2);g.quadraticCurveTo(x+w/2,y+h+ov+2,x-ov-3,y+h+ov-up+2);g.quadraticCurveTo(x-ov+2,y+h/2,x-ov-3,y-ov-up);g.fill();
  g.fillStyle=st.roof;g.beginPath();g.moveTo(x-ov,y-ov-1);g.quadraticCurveTo(x+w/2,y-ov+4,x+w+ov,y-ov-1);g.lineTo(x+w/2+4,y+h/2);g.lineTo(x+w/2-4,y+h/2);g.fill();
  g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=1;g.beginPath();g.moveTo(x-ov-2,y-ov-up+1);g.lineTo(x+w/2-3,y+h/2);g.lineTo(x+w/2+3,y+h/2);g.lineTo(x+w+ov+2,y-ov-up+1);g.stroke();
  g.fillStyle=col;g.beginPath();g.arc(x+w/2,y+h/2,2.6,0,7);g.fill()}
 else{g.fillStyle=st.roof;g.fillRect(x,y,w,h);g.strokeStyle=shade(st.roof,-.25);if(kind==='flat'){g.lineWidth=1.5;g.strokeRect(x+.75,y+.75,w-1.5,h-1.5);g.fillStyle=col;g.fillRect(x,y+h-1.5,w,1.5);return}g.lineWidth=2;g.strokeRect(x+1,y+1,w-2,h-2);
  g.fillStyle=shade(st.roof,-.15);for(let xx=x;xx<x+w-2;xx+=5)g.fillRect(xx,y-2,3,3);
  const r=Math.min(w,h)*.3;if(r>4){const cx=x+w/2,cy=y+h/2;g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(cx+2,cy+2,r,r*.8,0,0,7);g.fill();
   const gr=g.createRadialGradient(cx-r*.35,cy-r*.6,1,cx,cy-r*.2,r*1.2);gr.addColorStop(0,shade(st.dome,.45));gr.addColorStop(1,shade(st.dome,-.25));g.fillStyle=gr;g.beginPath();g.ellipse(cx,cy-r*.3,r,r*.95,0,Math.PI,0);g.lineTo(cx+r,cy);g.lineTo(cx-r,cy);g.fill();
   g.fillStyle=col;g.fillRect(cx-r,cy-1,r*2,2.5);g.fillStyle='#e8c15a';g.fillRect(cx-.8,cy-r*1.3-4,1.6,5)}}}
function box(g,x,y,w,h,ht,st,col,kind,opt={}){if(!opt.noShadow){g.fillStyle='rgba(15,10,0,.3)';g.beginPath();g.moveTo(x+w,y+h);g.lineTo(x+w+ht*.35,y+h-ht*.15);g.lineTo(x+w+ht*.35,y-ht*.15+4);g.lineTo(x+w,y);g.fill();g.fillRect(x+3,y+h-1,w,3)}
 wallFace(g,x,y+h-ht,w,ht,st);if(opt.door!==false&&ht>=16)door(g,x+w/2,y+h,Math.min(9,w*.3),Math.min(13,ht*.6),col);roof(g,x,y-ht,w,h,st,col,kind)}
function emblem(g,k,cx,cy,col){g.save();g.fillStyle=col;rr(g,cx-6,cy-7,12,13,2);g.fill();g.strokeStyle='#f4e7c8';g.fillStyle='#f4e7c8';g.lineWidth=1.4;g.lineCap='round';
 if(k==='sword'){g.beginPath();g.moveTo(cx-3.5,cy+3.5);g.lineTo(cx+3.5,cy-4.5);g.moveTo(cx+3.5,cy+3.5);g.lineTo(cx-3.5,cy-4.5);g.stroke()}
 else if(k==='target'){g.beginPath();g.arc(cx,cy-.5,4,0,7);g.stroke();g.beginPath();g.arc(cx,cy-.5,1.4,0,7);g.fill()}
 else if(k==='horse'){g.beginPath();g.arc(cx,cy-1,3.6,Math.PI*.15,Math.PI*.85,true);g.lineWidth=2;g.stroke()}
 else if(k==='anvil'){g.fillRect(cx-4,cy-3,8,2.5);g.fillRect(cx-1.5,cy-1,3,3);g.fillRect(cx-3.5,cy+2,7,1.5)}
 else if(k==='wheel'){g.beginPath();g.arc(cx,cy-.5,4,0,7);g.stroke();for(let a=0;a<3;a++){g.beginPath();g.moveTo(cx+Math.cos(a)*4,cy-.5+Math.sin(a)*4);g.lineTo(cx-Math.cos(a)*4,cy-.5-Math.sin(a)*4);g.stroke()}}
 g.restore()}
function crenel(g,x,y,w,c){g.fillStyle=c;for(let xx=x;xx<x+w-1;xx+=4)g.fillRect(xx,y-3,2.4,3)}
function makeBSprite(type,sk,o){const d=B[type],st=STYLES[sk],col=PCOL[o];const w=d.w*T,h=d.h*T,top=d.ht+30,sc=2;
 const c=document.createElement('canvas');c.width=(w+24)*sc;c.height=(h+top+6)*sc;const g=c.getContext('2d');g.scale(sc,sc);g.translate(8,top);c.ox=8;c.oy=top;c.sc=sc;
 const i=2,x=i,y=i,ww=w-i*2,hh=h-i*2,ht=d.ht;
 switch(type){
 case 'tc':{box(g,x,y+4,ww,hh-4,ht*.55,st,col);const kx=x+ww*.27,ky=y+hh*.08,kw=ww*.46,kh=hh*.5;box(g,kx,ky,kw,kh,ht,st,col,null,{noShadow:1});flag(g,kx+kw/2,ky-ht-(st.kind==='dome'?10:2),col,18);
  g.fillStyle='#3b2a1c';g.fillRect(x+4,y+hh-8,6,6);g.fillRect(x+ww-10,y+hh-8,6,6);break}
 case 'castle':{const cw=st.stone;const s2=Object.assign({},st,{wall:cw});box(g,x,y+2,ww,hh-2,ht*.5,s2,col,'flat',{door:false});g.fillStyle=shade(cw,-.35);g.fillRect(x+5,y+2-ht*.5+5,ww-10,hh-12);crenel(g,x,y+2-ht*.5,ww,shade(cw,-.1));
  const tw=ww*.24;for(const [tx,ty] of [[x-2,y-2],[x+ww-tw+2,y-2],[x-2,y+hh-tw],[x+ww-tw+2,y+hh-tw]]){box(g,tx,ty,tw,tw,ht*.78,s2,col,st.kind==='gable'?'flat':null,{noShadow:1,door:false});if(st.kind==='gable')crenel(g,tx,ty-ht*.78,tw,shade(cw,-.1))}
  box(g,x+ww*.3,y+hh*.22,ww*.4,hh*.42,ht,st,col,null,{noShadow:1});door(g,x+ww/2,y+hh,12,14,col);flag(g,x+ww/2,y+hh*.22-ht-4,col,20);flag(g,x+4,y-2-ht*.78,col,12);break}
 case 'tower':{const s2=Object.assign({},st,{wall:st.stone});box(g,x+2,y+2,ww-4,hh-4,ht,s2,col,st.kind==='gable'?'flat':null,{door:false});if(st.kind==='gable'){crenel(g,x+2,y+2-ht,ww-4,shade(st.stone,-.1));}
  g.fillStyle='#2a1a10';g.fillRect(x+ww/2-1.5,y+hh-ht*.6,3,6);g.fillRect(x+ww/2-1.5,y+hh-ht*.35,3,6);flag(g,x+ww/2,y+2-ht-(st.kind==='dome'?6:0),col,13);break}
 case 'palisade':{g.fillStyle='rgba(0,0,0,.25)';g.fillRect(2,h-4,w+4,5);for(let xx=0;xx<w;xx+=5.4){const hgt=ht+((xx*7)%4);g.fillStyle=xx%2?'#8a6239':'#9c7244';g.beginPath();g.moveTo(xx,h);g.lineTo(xx,h-hgt);g.lineTo(xx+2.7,h-hgt-4);g.lineTo(xx+5.4,h-hgt);g.lineTo(xx+5.4,h);g.fill();g.fillStyle='rgba(0,0,0,.2)';g.fillRect(xx+4,h-hgt,1.4,hgt)}
  g.fillStyle='#5b3d22';g.fillRect(0,h-hgtLine(ht),w,2);break}
 case 'wall':case 'gate':{const s2=Object.assign({},st,{wall:st.stone,roof:shade(st.stone,.1)});box(g,0,4,w,h-4,ht,s2,col,'flat',{door:false,noShadow:0});crenel(g,0,4-ht,w,shade(st.stone,-.05));
  if(type==='gate'){g.fillStyle='#2a1a10';g.beginPath();g.moveTo(8,h);g.lineTo(8,h-ht*.55);g.arc(w/2,h-ht*.55,w/2-8,Math.PI,0);g.lineTo(w-8,h);g.fill();g.fillStyle=col;g.fillRect(9.5,h-ht*.5,w-19,ht*.5)}break}
 default:{box(g,x,y,ww,hh,ht,st,col);
  if(type==='house'){g.fillStyle='#3a2a1c';g.fillRect(x+ww-9,y-ht-4,5,8)}
  if(type==='mill'){const cx=x+ww/2,cy=y+hh-ht+2;g.strokeStyle='#5a4028';g.lineWidth=2.2;g.fillStyle='#efe3c4';for(let a=0;a<4;a++){const an=a*Math.PI/2+.4;g.save();g.translate(cx,cy);g.rotate(an);g.fillRect(2,-2.6,16,5.2);g.strokeRect(2,-2.6,16,5.2);g.restore()}g.fillStyle='#4a3020';g.beginPath();g.arc(cx,cy,2.5,0,7);g.fill()}
  if(type==='lumber'){for(let k=0;k<5;k++){const lx=x+ww-14+(k%3)*5,ly=y+hh+2-(k>2?4:0);g.fillStyle='#7a5230';g.fillRect(lx-12,ly-4,12,4.5);g.fillStyle='#d6b07a';g.beginPath();g.arc(lx,ly-1.8,2.3,0,7);g.fill()}}
  if(type==='mine'){g.fillStyle='#e9c040';g.beginPath();g.ellipse(x+8,y+hh,6,3.5,0,Math.PI,0);g.fill();g.fillStyle='#a19c94';g.beginPath();g.ellipse(x+ww-7,y+hh,6,3.5,0,Math.PI,0);g.fill()}
  if(type==='barracks')emblem(g,'sword',x+ww*.22,y+hh-ht*.55,col);
  if(type==='range')emblem(g,'target',x+ww*.22,y+hh-ht*.55,col);
  if(type==='stable')emblem(g,'horse',x+ww*.22,y+hh-ht*.55,col);
  if(type==='smith'){emblem(g,'anvil',x+ww*.22,y+hh-ht*.55,col);g.fillStyle='#4a4038';g.fillRect(x+ww-12,y-ht-6,7,12)}
  if(type==='workshop')emblem(g,'wheel',x+ww*.22,y+hh-ht*.55,col);
  if(type==='barracks'||type==='range'||type==='stable'||type==='workshop')flag(g,x+ww-6,y-ht+2,col,14)}}
 return c}
function hgtLine(h){return h-4}
function bSprite(type,sk,o){const k=type+sk+o;let c=sprC.get(k);if(!c){c=makeBSprite(type,sk,o);sprC.set(k,c)}return c}
const treeV=[],resV={2:[],3:[],4:[]};
function makeResSprites(){const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const g=c.getContext('2d');g.scale(2,2);f(g);c.w=w;c.h=h;return c};const r=mulberry(99);
 for(let v=0;v<6;v++)treeV.push(mk(44,56,g=>{g.fillStyle='rgba(10,20,0,.32)';g.beginPath();g.ellipse(24,51,14,5,0,0,7);g.fill();
  if(v<4){g.fillStyle='#5a3b20';g.fillRect(20,36,5,16);const base=['#2f6b2a','#3a7a2e','#2b6230','#44802f'][v];const blobs=[[22,28,12],[14,32,9],[30,31,9],[22,19,10],[16,22,7],[29,22,7]];
   for(const [x,y,rad] of blobs){g.fillStyle=shade(base,-.2);g.beginPath();g.arc(x+1,y+2,rad,0,7);g.fill()}for(const [x,y,rad] of blobs){g.fillStyle=base;g.beginPath();g.arc(x,y,rad,0,7);g.fill()}
   for(const [x,y,rad] of blobs){g.fillStyle=shade(base,.22);g.beginPath();g.arc(x-rad*.3,y-rad*.35,rad*.45,0,7);g.fill()}}
  else{g.fillStyle='#4e3420';g.fillRect(20,40,4,12);const base=v===4?'#24553a':'#2c5f3c';for(let k=0;k<4;k++){const yy=10+k*9,ww=7+k*4.5;g.fillStyle=shade(base,-.15);g.beginPath();g.moveTo(22,yy-6);g.lineTo(22+ww+1,yy+9);g.lineTo(22-ww+1,yy+9);g.fill();g.fillStyle=base;g.beginPath();g.moveTo(22,yy-7);g.lineTo(22+ww,yy+8);g.lineTo(22-ww,yy+8);g.fill();g.fillStyle=shade(base,.2);g.beginPath();g.moveTo(22,yy-7);g.lineTo(22-ww*.6,yy+5);g.lineTo(22-ww*.2,yy+6);g.fill()}}}));
 const rock=(g,base,hi,n)=>{g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(17,25,14,5,0,0,7);g.fill();for(let k=0;k<n;k++){const x=6+r()*20,y=12+r()*10,s=5+r()*5;g.fillStyle=shade(base,-.3);g.beginPath();g.moveTo(x-s,y+s*.6);g.lineTo(x-s*.6,y-s*.5);g.lineTo(x+s*.3,y-s*.8);g.lineTo(x+s,y);g.lineTo(x+s*.6,y+s*.7);g.fill();g.fillStyle=base;g.beginPath();g.moveTo(x-s*.8,y+s*.3);g.lineTo(x-s*.5,y-s*.5);g.lineTo(x+s*.3,y-s*.8);g.lineTo(x+s*.8,y-.5);g.lineTo(x+s*.3,y+s*.3);g.fill();g.fillStyle=hi;g.fillRect(x-s*.3,y-s*.45,s*.4,s*.25)}};
 for(let v=0;v<3;v++){resV[2].push(mk(34,30,g=>rock(g,'#e1b52f','#fff2a8',4)));resV[3].push(mk(34,30,g=>rock(g,'#9e9a92','#e3e0da',4)));
  resV[4].push(mk(34,30,g=>{g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(17,25,13,4.5,0,0,7);g.fill();for(const [x,y,s] of [[11,17,7],[22,16,8],[16,11,7]]){g.fillStyle='#2f6a2c';g.beginPath();g.arc(x,y,s,0,7);g.fill();g.fillStyle='#3f8436';g.beginPath();g.arc(x-1.5,y-2,s*.6,0,7);g.fill()}for(let k=0;k<12;k++){g.fillStyle=k%3?'#c8304a':'#e24b5c';g.beginPath();g.arc(6+r()*22,8+r()*14,1.6,0,7);g.fill()}}))}}

/* ---------- unit drawing ---------- */
function drawUnit(g,type,o,face,an,state,u){const col=PCOL[o],d=U[type];const walk=state==='walk';const sw=walk?Math.sin(an)*2.2:0;g.save();g.scale(face,1);
 const swing=state==='atk'?Math.sin((1-(u?u.swing:0)/.3)*Math.PI)*1.3:state==='work'?Math.sin(an)*1.1:0;
 if(d.tag==='sie'){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,0,15,4.5,0,0,7);g.fill();
  if(type==='ram'){g.fillStyle='#6d4b2c';g.fillRect(-13,-15,26,12);g.fillStyle='#57391f';g.beginPath();g.moveTo(-15,-14);g.lineTo(0,-22);g.lineTo(15,-14);g.fill();g.fillStyle=col;g.fillRect(-13,-8,26,2);
   g.fillStyle='#8a8070';g.fillRect(12+Math.max(0,swing)*2,-11,6,4);for(const wx of [-9,9]){g.fillStyle='#3a2716';g.beginPath();g.arc(wx,-2,3.5,0,7);g.fill();g.fillStyle='#8a6a40';g.beginPath();g.arc(wx,-2,1.4,0,7);g.fill()}}
  else{g.strokeStyle='#5a3b20';g.lineWidth=2.5;g.beginPath();g.moveTo(-12,-2);g.lineTo(12,-2);g.moveTo(-8,-2);g.lineTo(0,-20);g.lineTo(8,-2);g.stroke();const a=-.9+(u&&u.cd>0?Math.min(1,u.cd/4)*1.6:0);g.save();g.translate(0,-20);g.rotate(a);g.lineWidth=2;g.beginPath();g.moveTo(-8,0);g.lineTo(20,0);g.stroke();g.fillStyle='#4a4038';g.fillRect(-12,-2,6,8);g.restore();
   for(const wx of [-10,10]){g.fillStyle='#3a2716';g.beginPath();g.arc(wx,-1,3,0,7);g.fill()}g.fillStyle=col;g.fillRect(-2,-24,4,3)}
  g.restore();return}
 g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,0,d.tag==='cav'?10:6.5,d.tag==='cav'?3.2:2.6,0,0,7);g.fill();
 if(d.tag==='cav'){const hc=type==='knight'?'#e8e2d4':'#7a5232';g.strokeStyle=shade(hc,-.35);g.lineWidth=2;g.lineCap='round';const l=walk?Math.sin(an*1.3)*2.5:0;
  g.beginPath();g.moveTo(-6,-6);g.lineTo(-6+l,0);g.moveTo(-3,-6);g.lineTo(-3-l,0);g.moveTo(5,-6);g.lineTo(5-l,0);g.moveTo(7,-6);g.lineTo(7+l,0);g.stroke();
  g.fillStyle=hc;g.beginPath();g.ellipse(0,-8,9,4.5,0,0,7);g.fill();g.beginPath();g.moveTo(5,-10);g.lineTo(9,-16);g.lineTo(12,-15);g.lineTo(9,-9);g.fill();g.beginPath();g.ellipse(11.5,-15,3.2,2,.4,0,7);g.fill();
  g.strokeStyle=shade(hc,-.4);g.lineWidth=1.6;g.beginPath();g.moveTo(-9,-9);g.quadraticCurveTo(-13,-7,-12,-2);g.stroke();
  if(type==='knight'){g.fillStyle=col;g.fillRect(-8,-10,15,4)}
  g.fillStyle=type==='knight'?'#9aa0a8':col;rr(g,-3.2,-19,6.4,8,2);g.fill();g.fillStyle='#e2b48c';g.beginPath();g.arc(0,-21,2.8,0,7);g.fill();
  if(type==='knight'){g.fillStyle='#8f959c';g.beginPath();g.arc(0,-21.5,3.2,Math.PI,0);g.fill();g.fillRect(-3.2,-21.5,6.4,2);g.fillStyle=col;g.beginPath();g.arc(-3,-14,3.2,0,7);g.fill();
   g.strokeStyle='#6b4a2b';g.lineWidth=1.6;g.save();g.translate(2,-16);g.rotate(-.15+swing*.25);g.beginPath();g.moveTo(-4,0);g.lineTo(16,0);g.stroke();g.restore()}
  else{g.fillStyle='#6b4a2b';g.beginPath();g.arc(0,-22,3,Math.PI,0);g.fill();g.strokeStyle='#cfd3d8';g.lineWidth=1.4;g.save();g.translate(2,-15);g.rotate(-.8+swing);g.beginPath();g.moveTo(0,0);g.lineTo(8,0);g.stroke();g.restore()}
  g.restore();return}
 g.strokeStyle='#3b2a1c';g.lineWidth=2;g.lineCap='round';g.beginPath();g.moveTo(-1.5,-6);g.lineTo(-1.5+sw,-.6);g.moveTo(1.5,-6);g.lineTo(1.5-sw,-.6);g.stroke();
 if(u&&u.carry>0&&type==='villager'){const cc={wood:'#8a5c32',gold:'#f0c43c',stone:'#a9a9a9',food:'#d64545'}[u.ct]||'#aaa';g.fillStyle=cc;g.beginPath();g.ellipse(-4.5,-11,3,3.6,0,0,7);g.fill()}
 const tc=type==='villager'?shade(col,.15):col;g.fillStyle=tc;rr(g,-3.6,-13.5,7.2,8.5,2.5);g.fill();g.fillStyle='rgba(0,0,0,.25)';g.fillRect(-3.6,-7.5,7.2,1.6);
 if(type==='villager'){g.fillStyle='#8a6a45';g.fillRect(-3.6,-9.5,7.2,4)}
 g.fillStyle='#e2b48c';g.beginPath();g.arc(0,-16,3,0,7);g.fill();
 if(type==='villager'){g.fillStyle='#6b4a2b';g.beginPath();g.arc(0,-16.6,3.1,Math.PI*1.05,Math.PI*1.95);g.fill()}
 else if(d.tag==='arc'){g.fillStyle='#5e7a3a';g.beginPath();g.moveTo(-3.4,-16);g.lineTo(0,-21);g.lineTo(3.4,-16);g.fill()}
 else{g.fillStyle=type==='champ'?'#c7ccd2':'#9aa0a8';g.beginPath();g.arc(0,-16.6,3.3,Math.PI,0);g.fill();g.fillRect(-3.3,-16.8,6.6,1.6);if(type==='champ'){g.fillStyle=col;g.fillRect(-.8,-22,1.6,3)}}
 g.save();g.translate(2.6,-11.5);
 if(type==='villager'){const tool=u&&u.task?(u.task.k==='build'?'ham':u.task.rt==='wood'?'axe':u.task.rt==='gold'||u.task.rt==='stone'?'pick':u.task.k==='farm'||u.task.rt==='food'?'hoe':null):null;g.rotate(-.5+swing*.9);
  g.strokeStyle='#e2b48c';g.lineWidth=1.8;g.beginPath();g.moveTo(0,0);g.lineTo(3,2);g.stroke();
  if(tool){g.strokeStyle='#6b4a2b';g.lineWidth=1.5;g.beginPath();g.moveTo(1,4);g.lineTo(7,-5);g.stroke();g.fillStyle='#b9bec4';if(tool==='axe'){g.beginPath();g.moveTo(6,-5);g.lineTo(10,-6);g.lineTo(9,-2);g.fill()}else if(tool==='pick'){g.strokeStyle='#b9bec4';g.beginPath();g.moveTo(4,-6);g.quadraticCurveTo(7,-7.5,10,-4);g.stroke()}else if(tool==='ham'){g.fillRect(5,-7,5,3)}else{g.fillRect(6,-6,1.5,4)}}}
 else if(type==='spear'){g.rotate(-.2+swing*.4);g.strokeStyle='#7a5634';g.lineWidth=1.4;g.beginPath();g.moveTo(-6,3);g.lineTo(13,-3);g.stroke();g.fillStyle='#cfd3d8';g.beginPath();g.moveTo(13,-5);g.lineTo(17,-4);g.lineTo(13,-1.5);g.fill()}
 else if(d.tag==='arc'){g.strokeStyle='#6b4a2b';g.lineWidth=1.5;if(type==='xbow'){g.fillStyle='#6b4a2b';g.fillRect(0,-1,8,2);g.beginPath();g.moveTo(7,-5);g.quadraticCurveTo(9,0,7,5);g.stroke()}else{g.beginPath();g.arc(1,0,6.5,-1.2,1.2);g.stroke();g.strokeStyle='#e8e0cc';g.lineWidth=.7;g.beginPath();g.moveTo(1+6.5*Math.cos(-1.2),6.5*Math.sin(-1.2));g.lineTo(1+6.5*Math.cos(1.2),6.5*Math.sin(1.2));g.stroke()}}
 else{g.rotate(-.9+swing*1.1);g.strokeStyle='#d7dbe0';g.lineWidth=1.8;g.beginPath();g.moveTo(1,0);g.lineTo(10,0);g.stroke();g.strokeStyle='#6b4a2b';g.beginPath();g.moveTo(1,-2);g.lineTo(1,2);g.stroke()}
 g.restore();
 if(type==='militia'||type==='champ'){g.fillStyle=shade(col,-.2);g.beginPath();g.arc(-2.8,-9.5,3.6,0,7);g.fill();g.strokeStyle='#c9b07a';g.lineWidth=1;g.stroke()}
 g.restore()}

/* ---------- icons ---------- */
const ICON={};
function iconCanvas(f,bg){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');if(bg){const gr=g.createRadialGradient(28,24,4,32,32,34);gr.addColorStop(0,bg[0]);gr.addColorStop(1,bg[1]);g.fillStyle=gr;rr(g,1,1,62,62,10);g.fill()}f(g);return c.toDataURL()}
function sym(g,k,cx,cy,s,c){g.save();g.translate(cx,cy);g.scale(s,s);g.strokeStyle=c;g.fillStyle=c;g.lineWidth=2.4;g.lineCap='round';g.lineJoin='round';
 switch(k){case 'sword':g.beginPath();g.moveTo(-8,8);g.lineTo(8,-8);g.stroke();g.beginPath();g.moveTo(-9,3);g.lineTo(-3,9);g.stroke();break;
 case 'arrow':g.beginPath();g.moveTo(-9,9);g.lineTo(8,-8);g.stroke();g.beginPath();g.moveTo(9,-9);g.lineTo(2,-8);g.lineTo(8,-2);g.fill();g.beginPath();g.moveTo(-9,9);g.lineTo(-9,4);g.moveTo(-9,9);g.lineTo(-4,9);g.stroke();break;
 case 'shield':g.beginPath();g.moveTo(0,-10);g.lineTo(9,-6);g.quadraticCurveTo(8,6,0,11);g.quadraticCurveTo(-8,6,-9,-6);g.closePath();g.fill();g.fillStyle='#00000055';g.fillRect(-1,-8,2,16);break;
 case 'axe':g.beginPath();g.moveTo(-7,9);g.lineTo(5,-6);g.stroke();g.beginPath();g.moveTo(2,-9);g.quadraticCurveTo(11,-8,9,1);g.lineTo(3,-4);g.fill();break;
 case 'pickg':case 'picks':g.beginPath();g.moveTo(-7,9);g.lineTo(3,-3);g.stroke();g.beginPath();g.moveTo(-6,-6);g.quadraticCurveTo(3,-11,10,-2);g.stroke();g.fillStyle=k==='pickg'?'#f0c43c':'#b8b8b8';g.beginPath();g.arc(-5,6,4,0,7);g.fill();break;
 case 'wheat':for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(i*4,10);g.lineTo(i*4+i*2,-2);g.stroke();for(let k=0;k<3;k++){g.beginPath();g.ellipse(i*4+i*2+(i?i:0),-4-k*3.5,1.8,2.8,0,0,7);g.fill()}}break;
 case 'wheel':g.beginPath();g.arc(0,0,9,0,7);g.stroke();for(let a=0;a<3;a++){g.beginPath();g.moveTo(Math.cos(a)*9,Math.sin(a)*9);g.lineTo(-Math.cos(a)*9,-Math.sin(a)*9);g.stroke()}break;
 case 'brick':for(let r=0;r<3;r++)for(let k=0;k<2;k++){g.fillRect(-10+k*10+(r%2?5:0)-(r%2&&k?10:0),-9+r*6.5,8.5,5)}break;
 case 'crown':g.beginPath();g.moveTo(-10,6);g.lineTo(-10,-5);g.lineTo(-5,0);g.lineTo(0,-8);g.lineTo(5,0);g.lineTo(10,-5);g.lineTo(10,6);g.closePath();g.fill();g.fillRect(-10,7,20,3);break;
 case 'bell':g.beginPath();g.moveTo(-8,6);g.quadraticCurveTo(-7,-9,0,-9);g.quadraticCurveTo(7,-9,8,6);g.closePath();g.fill();g.beginPath();g.arc(0,8,2.4,0,7);g.fill();g.fillRect(-10,5,20,2.5);break;
 case 'stop':rr(g,-8,-8,16,16,2);g.fill();break;
 case 'x':g.beginPath();g.moveTo(-8,-8);g.lineTo(8,8);g.moveTo(8,-8);g.lineTo(-8,8);g.stroke();break;
 case 'check':g.beginPath();g.moveTo(-9,0);g.lineTo(-3,7);g.lineTo(9,-7);g.stroke();break;
 case 'box':g.setLineDash([4,3]);g.strokeRect(-10,-8,20,16);g.setLineDash([]);g.beginPath();g.moveTo(6,4);g.lineTo(12,12);g.stroke();break;
 case 'trash':g.fillRect(-7,-5,14,15);g.fillRect(-9,-8,18,2.5);g.fillRect(-3,-11,6,3);break;
 case 'pop':g.beginPath();g.arc(0,-5,4.5,0,7);g.fill();g.beginPath();g.moveTo(-8,10);g.quadraticCurveTo(-8,0,0,0);g.quadraticCurveTo(8,0,8,10);g.fill();break}
 g.restore()}
function makeIcons(sk){
 for(const t in U)ICON['u_'+t]=iconCanvas(g=>{g.save();g.translate(32,U[t].tag==='cav'?54:U[t].tag==='sie'?50:56);const s=U[t].tag==='cav'?1.85:U[t].tag==='sie'?1.6:2.3;g.scale(s,s);drawUnit(g,t,0,1,0,'idle',null);g.restore()},['#6a4b2e','#2a1b10']);
 for(const t in B)ICON['b_'+t]=iconCanvas(g=>{if(t==='farm'){drawFarmAt(g,8,10,48,44,1,0,true);return}const c=bSprite(t,sk,0);const w=c.width/c.sc,h=c.height/c.sc;const s=Math.min(58/w,58/h);g.drawImage(c,32-w*s/2,32-h*s/2+2,w*s,h*s)},['#5a7a3a','#2b3d1c']);
 for(const t in TECH){const tc=TECH[t];ICON['t_'+t]=iconCanvas(g=>{if(tc.up){sym(g,'crown',32,30,1.6,'#f2cf6a');g.fillStyle='#f6ecd5';g.font='900 15px Cinzel,serif';g.textAlign='center';g.fillText(['II','III','IV'][tc.up-1],32,56);return}sym(g,tc.ic,32,32,1.7,'#f6ecd5')},tc.up?['#7a3a2a','#3a1a12']:['#3d5a7a','#1a2a3d'])}
 ICON.food=iconCanvas(g=>{for(const [x,y] of [[24,36],[38,34],[31,24],[30,42]]){g.fillStyle='#b8283a';g.beginPath();g.arc(x,y,9,0,7);g.fill();g.fillStyle='#ff6b6b';g.beginPath();g.arc(x-3,y-3,3,0,7);g.fill()}g.fillStyle='#3f8436';g.beginPath();g.ellipse(34,14,8,4,-.5,0,7);g.fill()});
 ICON.wood=iconCanvas(g=>{for(const [x,y] of [[14,42],[30,42],[22,28],[46,42],[38,28]]){g.fillStyle='#7a5230';g.fillRect(x-10,y-7,12,14);g.fillStyle='#e2bd86';g.beginPath();g.arc(x+2,y,7,0,7);g.fill();g.strokeStyle='#9b7448';g.lineWidth=1.5;g.beginPath();g.arc(x+2,y,3.5,0,7);g.stroke()}});
 ICON.gold=iconCanvas(g=>{for(const [x,y,s] of [[22,40,12],[42,42,11],[32,26,12]]){g.fillStyle='#a87a10';g.beginPath();g.moveTo(x-s,y+s*.5);g.lineTo(x-s*.4,y-s*.6);g.lineTo(x+s*.6,y-s*.5);g.lineTo(x+s,y+s*.4);g.closePath();g.fill();g.fillStyle='#f2c63e';g.beginPath();g.moveTo(x-s*.7,y+s*.2);g.lineTo(x-s*.3,y-s*.5);g.lineTo(x+s*.5,y-s*.4);g.lineTo(x+s*.6,y+s*.1);g.closePath();g.fill();g.fillStyle='#fff3b0';g.fillRect(x-s*.2,y-s*.4,s*.4,s*.2)}});
 ICON.stone=iconCanvas(g=>{for(const [x,y,s] of [[22,40,13],[43,41,11],[32,25,12]]){g.fillStyle='#6d6a64';g.beginPath();g.moveTo(x-s,y+s*.5);g.lineTo(x-s*.6,y-s*.6);g.lineTo(x+s*.6,y-s*.6);g.lineTo(x+s,y+s*.5);g.closePath();g.fill();g.fillStyle='#b3afa8';g.beginPath();g.moveTo(x-s*.7,y+s*.2);g.lineTo(x-s*.4,y-s*.5);g.lineTo(x+s*.5,y-s*.5);g.lineTo(x+s*.6,y+s*.1);g.closePath();g.fill()}});
 ICON.pop=iconCanvas(g=>sym(g,'pop',32,34,2,'#e8dcc0'));
 ICON.army=iconCanvas(g=>sym(g,'sword',32,32,1.7,'#f6ecd5'));ICON.box=iconCanvas(g=>sym(g,'box',32,32,1.5,'#f6ecd5'));
 ICON.bell=iconCanvas(g=>sym(g,'bell',32,32,1.6,'#f2cf6a'),['#7a5a2a','#3a2a12']);ICON.clear=iconCanvas(g=>sym(g,'check',32,32,1.6,'#bff0a8'),['#3e5a26','#1e2e12']);
 ICON.stop=iconCanvas(g=>sym(g,'stop',32,32,1.4,'#f6ecd5'),['#5a4a3a','#2a2016']);ICON.del=iconCanvas(g=>sym(g,'trash',32,32,1.5,'#ffd0c4'),['#7a2a20','#3a120c']);
 ICON.ok=iconCanvas(g=>sym(g,'check',32,32,1.7,'#e8ffd8'));ICON.no=iconCanvas(g=>sym(g,'x',32,32,1.5,'#ffe0d8'));
 ICON.eco=ICON.b_house;}

/* ---------- rendering ---------- */
function drawFarmAt(g,x,y,w,h,frac,o,icon){g.fillStyle='#6b4a2a';g.fillRect(x,y,w,h);g.fillStyle='#5a3c20';g.fillRect(x+1,y+1,w-2,h-2);const rows=Math.max(4,Math.round(h/6));
 const gc=frac>.5?'#7fae3e':frac>.2?'#b9b046':'#c8a050';for(let r=0;r<rows;r++){const yy=y+3+r*(h-6)/rows;g.fillStyle='#7a5530';g.fillRect(x+2,yy+2,w-4,1.4);if(frac>0){g.fillStyle=gc;for(let xx=x+3;xx<x+w-3;xx+=3.2){g.fillRect(xx,yy-1+Math.sin(xx)*0.5,1.8,2.6*Math.min(1,frac+.3))}}}
 g.strokeStyle=icon?'#3a2410':'#3a2410aa';g.lineWidth=1.5;g.strokeRect(x+.5,y+.5,w-1,h-1)}
function drawBld(g,b,alpha){const sk=P[b.o].style;const c=bSprite(b.type,sk,b.o);const X=b.x*T-c.ox,Y=b.y*T-c.oy,w=c.width/c.sc,h=c.height/c.sc;
 if(b.built<1){g.fillStyle='rgba(90,64,36,.55)';g.fillRect(b.x*T+1,b.y*T+1,b.w*T-2,b.h*T-2);g.strokeStyle='#c9a46a';g.setLineDash([4,3]);g.lineWidth=1.2;g.strokeRect(b.x*T+1.5,b.y*T+1.5,b.w*T-3,b.h*T-3);g.setLineDash([]);
  const vis2=.12+.88*b.built;const cut=h*(1-vis2);if(b.built>0){g.save();g.beginPath();g.rect(X,Y+cut,w,h-cut);g.clip();g.globalAlpha=alpha*(.55+.45*b.built);g.drawImage(c,X,Y,w,h);g.restore()}
  g.strokeStyle='#7a5634';g.lineWidth=1.4;const bx=b.x*T,by=b.y*T+b.h*T,top=Y+cut+6;for(let k=0;k<=b.w;k++){g.beginPath();g.moveTo(bx+k*T-(k===b.w?2:-2),by-1);g.lineTo(bx+k*T-(k===b.w?2:-2),Math.min(by-4,top));g.stroke()}
  g.beginPath();g.moveTo(bx,Math.min(by-4,top)+2);g.lineTo(bx+b.w*T,Math.min(by-4,top)+2);g.stroke();return}
 g.globalAlpha=alpha;g.drawImage(c,X,Y,w,h);g.globalAlpha=1;
 const f=b.hp/bMaxHp(b);if(f<.6&&!B[b.type].wall){const n=f<.3?3:1;for(let k=0;k<n;k++){const t=(performance.now()/1000+k*.7+b.id)%2;g.fillStyle=`rgba(60,55,50,${.5*(1-t/2)})`;g.beginPath();g.arc(b.x*T+b.w*T*(.3+k*.2),b.y*T-t*14,4+t*5,0,7);g.fill()}
  g.fillStyle='rgba(255,140,40,.8)';g.beginPath();g.arc(b.x*T+b.w*T*.35,b.y*T+4+Math.sin(performance.now()/90)*1,3,0,7);g.fill()}}
let lastTapT=0,lastTapId=0;
function render(){const z=cam.z;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#0c0905';ctx.fillRect(0,0,VW,VH);
 if(!S)return;
 ctx.setTransform(DPR*z,0,0,DPR*z,-cam.x*z*DPR,-cam.y*z*DPR);ctx.imageSmoothingEnabled=true;ctx.drawImage(groundCv,0,0,W*T,H*T);
 const x0=Math.max(0,Math.floor(cam.x/T)-2),y0=Math.max(0,Math.floor(cam.y/T)-1),x1=Math.min(W-1,Math.ceil((cam.x+VW/z)/T)+2),y1=Math.min(H-1,Math.ceil((cam.y+VH/z)/T)+3);
 const inV=(x,y,w,h)=>x+w>=x0&&x<=x1+1&&y+h>=y0&&y<=y1+1;const showAll=!running;
 for(const r of rubble){if(!inV(r.x,r.y,r.w,r.h))continue;ctx.fillStyle='rgba(70,55,40,.6)';ctx.fillRect(r.x*T+2,r.y*T+2,r.w*T-4,r.h*T-4);ctx.fillStyle='rgba(40,30,20,.5)';for(let k=0;k<r.w*r.h*3;k++){const a=(k*37+r.x*13)%(r.w*T-6),bb=(k*53+r.y*7)%(r.h*T-6);ctx.fillRect(r.x*T+3+a,r.y*T+3+bb,4,3)}}
 for(const b of blds){if(!B[b.type].flat||!inV(b.x,b.y,b.w,b.h))continue;if(!showAll&&b.o!==0&&!explored[b.y*W+b.x])continue;if(b.built<1){ctx.globalAlpha=.5}drawFarmAt(ctx,b.x*T+1,b.y*T+1,b.w*T-2,b.h*T-2,b.built<1?0:b.food/P[b.o].m.farm,b.o);ctx.globalAlpha=1}
 const selSet=new Set(sel);
 for(const id of sel){const e=ents.get(id);if(!e)continue;ctx.strokeStyle=e.o===0?'#f4f0d8':'#ff7a6a';ctx.lineWidth=1.5;
  if(e.k==='u'){if(e.gar)continue;ctx.beginPath();ctx.ellipse(e.x*T,e.y*T+1,e.r*T*1.15,e.r*T*.55,0,0,7);ctx.stroke()}else{ctx.beginPath();ctx.ellipse((e.x+e.w/2)*T,(e.y+e.h/2)*T+4,e.w*T*.62,e.h*T*.5,0,0,7);ctx.stroke()}}
 const L=[];
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;if(resT[i]&&(showAll||explored[i]))L.push([y+1,0,i])}
 for(const b of blds){if(B[b.type].flat||!inV(b.x,b.y,b.w,b.h+3))continue;if(!showAll&&b.o!==0&&!explored[(b.y+(b.h>>1))*W+b.x+(b.w>>1)])continue;L.push([b.y+b.h,1,b])}
 for(const u of units){if(u.gar||!inV(u.x-1,u.y-1,2,2))continue;if(!showAll&&u.o!==0&&!vis[(u.y|0)*W+(u.x|0)])continue;L.push([u.y,2,u])}
 L.sort((a,b)=>a[0]-b[0]);
 for(const it of L){if(it[1]===0){const i=it[2],x=i%W,y=(i/W)|0,t=resT[i];const h=(x*73856093^y*19349663)>>>0;
   if(t===1){const sp=treeV[h%6];const s=.85+((h>>4)%5)*.06;const ox=((h>>8)%7)-3,oy=((h>>11)%5)-2;ctx.drawImage(sp,x*T+16-22*s+ox,y*T+32-52*s+oy,44*s,56*s)}
   else{const sp=resV[t][h%3];const f=.65+.35*Math.min(1,resA[i]/RAMT[t]);ctx.drawImage(sp,x*T+16-17*f,y*T+30-28*f,34*f,30*f)}}
  else if(it[1]===1)drawBld(ctx,it[2],1);
  else{const u=it[2];ctx.save();ctx.translate(u.x*T,u.y*T+4);const st=u.mv?'walk':u.work?'work':u.swing>0?'atk':'idle';drawUnit(ctx,u.type,u.o,u.face,u.an,st,u);ctx.restore()}}
 for(const p of projs){const f=Math.min(1,p.t/p.dur);const x=p.x0+(p.tx-p.x0)*f,y=p.y0+(p.ty-p.y0)*f-Math.sin(f*Math.PI)*(p.kind==='rock'?2.5:.6);
  if(p.kind==='rock'){ctx.fillStyle='#4a4038';ctx.beginPath();ctx.arc(x*T,y*T,3.5,0,7);ctx.fill()}else{const a=Math.atan2(p.ty-p.y0-Math.cos(f*Math.PI)*.6*2,p.tx-p.x0);ctx.strokeStyle='#2a1c10';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x*T,y*T);ctx.lineTo(x*T-Math.cos(a)*7,y*T-Math.sin(a)*7);ctx.stroke()}}
 for(const f of fx){const k=f.t/f.life;
  if(f.k==='ring'){ctx.strokeStyle=f.c;ctx.globalAlpha=1-k;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x*T,f.y*T,(1-k)*12+4,((1-k)*12+4)*.5,0,0,7);ctx.stroke();ctx.globalAlpha=1}
  else if(f.k==='die'){ctx.fillStyle=f.c;ctx.globalAlpha=(1-k)*.8;ctx.beginPath();ctx.ellipse(f.x*T,f.y*T+3,7,3,0,0,7);ctx.fill();ctx.fillStyle='#9b1c1c';ctx.beginPath();ctx.ellipse(f.x*T+2,f.y*T+3,4,2,0,0,7);ctx.fill();ctx.globalAlpha=1}
  else if(f.k==='dust'){ctx.fillStyle=`rgba(120,105,85,${.6*(1-k)})`;for(let j=0;j<6;j++){ctx.beginPath();ctx.arc(f.x*T+Math.cos(j)*k*f.s*14,f.y*T+Math.sin(j*1.7)*k*f.s*8-k*10,6+k*10,0,7);ctx.fill()}}}
 if(running){ctx.imageSmoothingEnabled=true;ctx.drawImage(fogCv,0,0,W,H,-T*.5,-T*.5,W*T,H*T)}
 for(const id of sel){const e=ents.get(id);if(e)hpBar(e)}
 for(const u of units)if(!u.gar&&!selSet.has(u.id)&&u.hp<uMaxHp(u)&&(u.o===0||vis[(u.y|0)*W+(u.x|0)])&&S.t-(u.dmgT||-9)<4)hpBar(u);
 for(const b of blds)if(!selSet.has(b.id)&&b.built>=1&&b.hp<bMaxHp(b)&&S.t-(b.dmgT||-9)<5&&(b.o===0||vis[b.y*W+b.x]))hpBar(b);
 const sb=sel.length===1&&ents.get(sel[0]);if(sb&&sb.k==='b'&&sb.o===0&&sb.rally){const r=sb.rally;flagAt(r.x*T,r.y*T)}
 if(placing&&placing.tx!=null){const d=B[placing.type];const tiles=d.wall?wallLine(placing.ax??placing.tx,placing.ay??placing.ty,placing.tx,placing.ty):[[placing.tx,placing.ty]];
  for(const [x,y] of tiles){const ok=canPlace(placing.type,x,y,0,false);ctx.globalAlpha=.65;if(d.flat)drawFarmAt(ctx,x*T,y*T,d.w*T,d.h*T,0,0);else{const c=bSprite(placing.type,P[0].style,0);ctx.drawImage(c,x*T-c.ox,y*T-c.oy,c.width/c.sc,c.height/c.sc)}ctx.globalAlpha=1;
   ctx.fillStyle=ok?'rgba(110,230,90,.3)':'rgba(240,70,50,.4)';ctx.fillRect(x*T,y*T,d.w*T,d.h*T);ctx.strokeStyle=ok?'#9cff7c':'#ff6a50';ctx.lineWidth=1.5;ctx.strokeRect(x*T+.5,y*T+.5,d.w*T-1,d.h*T-1)}}
 ctx.setTransform(DPR,0,0,DPR,0,0);
 if(gest&&gest.type==='box'){const x=Math.min(gest.sx,gest.cx),y=Math.min(gest.sy,gest.cy),w=Math.abs(gest.cx-gest.sx),h=Math.abs(gest.cy-gest.sy);ctx.fillStyle='rgba(244,240,216,.12)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#f4f0d8';ctx.lineWidth=1.5;ctx.strokeRect(x+.5,y+.5,w,h)}}
function hpBar(e){let mx,x,y,w;if(e.k==='u'){if(e.gar)return;mx=uMaxHp(e);w=e.r*T*2.2;x=e.x*T-w/2;y=e.y*T-(U[e.type].tag==='cav'?28:U[e.type].tag==='sie'?30:24)}else{mx=bMaxHp(e);w=Math.min(60,e.w*T*.8);x=(e.x+e.w/2)*T-w/2;y=e.y*T-B[e.type].ht-6}
 const f=clamp(e.hp/mx,0,1);ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-1,y-1,w+2,5);ctx.fillStyle=e.o===0?(f>.5?'#6fd25a':f>.25?'#e8c040':'#e85a3a'):'#e8483a';ctx.fillRect(x,y,w*f,3)}
function flagAt(x,y){ctx.strokeStyle='#2a1c10';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-16);ctx.stroke();ctx.fillStyle=PCOL[0];ctx.beginPath();ctx.moveTo(x,y-16);ctx.lineTo(x+10,y-13);ctx.lineTo(x,y-9);ctx.fill()}

/* ---------- minimap ---------- */
const mini=$('#mini'),mctx=mini.getContext('2d'),mimg=mctx.createImageData(W,H);const mcv=document.createElement('canvas');mcv.width=W;mcv.height=H;const mcx=mcv.getContext('2d');
let pings=[];
function drawMini(){const d=mimg.data;for(let i=0;i<N;i++){const o=i*4;if(!explored[i]){d[o]=8;d[o+1]=6;d[o+2]=4;d[o+3]=255;continue}const t=resT[i];let c=t===1?[38,82,34]:t===2?[230,190,50]:t===3?[160,158,150]:t===4?[190,80,100]:[96,132,58];if(!vis[i])c=c.map(v=>v*.55);d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}
 mcx.putImageData(mimg,0,0);for(const b of blds){if(b.o!==0&&!explored[b.y*W+b.x])continue;mcx.fillStyle=b.type==='farm'?shade(PCOL[b.o],-.3):PCOL[b.o];mcx.fillRect(b.x,b.y,b.w,b.h)}
 for(const u of units){if(u.gar)continue;if(u.o!==0&&!vis[(u.y|0)*W+(u.x|0)])continue;mcx.fillStyle=u.o===0?'#a9d0ff':'#ff9a8a';mcx.fillRect(Math.floor(u.x)-.5,Math.floor(u.y)-.5,1.6,1.6)}
 const s=mini.width/W;mctx.imageSmoothingEnabled=false;mctx.clearRect(0,0,mini.width,mini.height);mctx.drawImage(mcv,0,0,mini.width,mini.height);
 const now=S?S.t:0;pings=pings.filter(p=>now-p.t<4);for(const p of pings){mctx.strokeStyle='#ff4a3a';mctx.lineWidth=2;mctx.beginPath();mctx.arc(p.x*s,p.y*s,4+((now-p.t)*8)%10,0,7);mctx.stroke()}
 mctx.strokeStyle='#fff';mctx.lineWidth=1.5;mctx.strokeRect(cam.x/T*s,cam.y/T*s,VW/cam.z/T*s,VH/cam.z/T*s)}

/* ---------- toasts ---------- */
const toastEl=$('#toasts');const once=new Map();
function toast(msg,kind,at){const d=document.createElement('div');d.className='toast'+(kind?' '+kind:'');d.textContent=msg;if(at){d.style.cursor='pointer';d.onclick=()=>centerOn(at.x,at.y)}toastEl.appendChild(d);while(toastEl.children.length>3)toastEl.firstChild.remove();setTimeout(()=>d.remove(),4200)}
function toastOnce(key,msg,gap=30){const t=S?S.t:0;if(once.has(key)&&t-once.get(key)<gap)return;once.set(key,t);toast(msg,'bad')}
let lastAlert=-99;
function alertAttack(t){if(!S||S.t-lastAlert<15)return;lastAlert=S.t;const c=ec(t);pings.push({x:c.x,y:c.y,t:S.t});const name=t.k==='u'?U[t.type].n:B[t.type].n;toast(`Your ${name.toLowerCase()} is under attack! Tap to look.`,'bad',c)}

/* ---------- camera & input ---------- */
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);VW=innerWidth;VH=innerHeight;cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR);clampCam()}
function clampCam(){cam.z=clamp(cam.z,.45,2.4);cam.x=clamp(cam.x,-VW/cam.z*.4,W*T-VW/cam.z*.6);cam.y=clamp(cam.y,-VH/cam.z*.4,H*T-VH/cam.z*.6)}
function centerOn(x,y){cam.x=x*T-VW/cam.z/2;cam.y=y*T-VH/cam.z/2;clampCam()}
const toWorld=(sx,sy)=>({x:(sx/cam.z+cam.x)/T,y:(sy/cam.z+cam.y)/T});
const ptrs=new Map();let gest=null,lpTimer=0;
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{if(!S)return;cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});clearTimeout(lpTimer);
 if(ptrs.size===1){const mouse=e.pointerType==='mouse';gest={type:'pend',id:e.pointerId,sx:e.clientX,sy:e.clientY,cx:e.clientX,cy:e.clientY,mouse,btn:e.button,cam0:{x:cam.x,y:cam.y}};
  if(mouse&&e.button===1)gest.type='pan';
  if(!mouse&&running&&!placing)lpTimer=setTimeout(()=>{if(gest&&gest.type==='pend'){gest.type='box';if(navigator.vibrate)try{navigator.vibrate(12)}catch(_){}}},380)}
 else if(ptrs.size===2){const [a,b]=[...ptrs.values()];gest={type:'pinch',d0:Math.hypot(a.x-b.x,a.y-b.y),z0:cam.z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,cam0:{x:cam.x,y:cam.y}}}});
cv.addEventListener('pointermove',e=>{if(!S)return;const p=ptrs.get(e.pointerId);
 if(e.pointerType==='mouse'&&placing&&!p){const w=toWorld(e.clientX,e.clientY);setGhost(w)}
 if(!p)return;p.x=e.clientX;p.y=e.clientY;if(!gest)return;
 if(gest.type==='pinch'&&ptrs.size>=2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;const wx=gest.mx/gest.z0+gest.cam0.x,wy=gest.my/gest.z0+gest.cam0.y;cam.z=clamp(gest.z0*d/Math.max(20,gest.d0),.45,2.4);cam.x=wx-mx/cam.z;cam.y=wy-my/cam.z;clampCam();return}
 if(gest.id!==e.pointerId)return;gest.cx=e.clientX;gest.cy=e.clientY;const moved=Math.hypot(gest.cx-gest.sx,gest.cy-gest.sy);
 if(gest.type==='pend'&&moved>9){clearTimeout(lpTimer);gest.type=(gest.mouse&&gest.btn===0&&!placing)||(boxMode&&!placing)?'box':gest.mouse&&gest.btn===2?'none':'pan'}
 if(gest.type==='pan'){cam.x=gest.cam0.x-(gest.cx-gest.sx)/cam.z;cam.y=gest.cam0.y-(gest.cy-gest.sy)/cam.z;clampCam()}});
function endPtr(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);clearTimeout(lpTimer);if(!gest)return;
 if(gest.type==='pinch'){if(ptrs.size===0)gest=null;else gest={type:'none',id:-1};return}
 if(gest.id!==e.pointerId){if(ptrs.size===0)gest=null;return}
 if(gest.type==='pend'&&running&&e.type==='pointerup')tap(gest.sx,gest.sy,gest.mouse?(gest.btn===2?'cmd':'sel'):'smart',e.shiftKey);
 else if(gest.type==='box'&&running)boxSelect(gest.sx,gest.sy,gest.cx,gest.cy,e.shiftKey);
 gest=null}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
cv.addEventListener('wheel',e=>{e.preventDefault();const w0={x:e.clientX/cam.z+cam.x,y:e.clientY/cam.z+cam.y};cam.z=clamp(cam.z*Math.exp(-e.deltaY*.0015),.45,2.4);cam.x=w0.x-e.clientX/cam.z;cam.y=w0.y-e.clientY/cam.z;clampCam()},{passive:false});
const keys=new Set();addEventListener('keydown',e=>{if(!running||paused)return;keys.add(e.key.toLowerCase());const k=e.key.toLowerCase();
 if(k==='escape'){if(placing){placing=null;panelDirty=true}else{sel=[];panelDirty=true}}if(k==='delete')act('del2');if(k==='.')nextIdle();if(k==='h')goHome()});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function keyPan(dt){if(!keys.size)return;const s=700*dt/cam.z;if(keys.has('a')||keys.has('arrowleft'))cam.x-=s;if(keys.has('d')||keys.has('arrowright'))cam.x+=s;if(keys.has('w')||keys.has('arrowup'))cam.y-=s;if(keys.has('s')||keys.has('arrowdown'))cam.y+=s;clampCam()}
function setGhost(w){if(!placing)return;const d=B[placing.type];placing.tx=Math.floor(w.x-(d.w-1)/2);placing.ty=Math.floor(w.y-(d.h-1)/2);if(d.w===1){placing.tx=Math.floor(w.x);placing.ty=Math.floor(w.y)}}
function unitAt(w){let best=null,bd=.75;for(const u of units){if(u.gar)continue;if(u.o!==0&&!vis[(u.y|0)*W+(u.x|0)])continue;const d=Math.hypot(u.x-w.x,(u.y-.35)-w.y);if(d<bd+(u.o===0?.1:0)){bd=d;best=u}}return best}
function bldAt(w){const tx=Math.floor(w.x),ty=Math.floor(w.y);for(const b of blds){if(b.o!==0&&!explored[b.y*W+b.x])continue;if(tx>=b.x&&tx<b.x+b.w&&ty>=b.y-(B[b.type].ht>30?1:0)&&ty<b.y+b.h)return b}return null}
function tap(sx,sy,mode,shift){const w=toWorld(sx,sy);
 if(placing){setGhost(w);if(mode!=='smart')confirmPlace();else panelDirty=true;return}
 const hu=unitAt(w),hb=hu?null:bldAt(w);const mine=sel.map(id=>ents.get(id)).filter(e=>e&&e.k==='u'&&e.o===0);
 const selB=sel.length===1&&ents.get(sel[0]);
 if(mode!=='cmd'){
  if(hu&&hu.o===0){const now=performance.now();if(now-lastTapT<380&&lastTapId&&ents.get(lastTapId)?.type===hu.type){const v=visibleUnits().filter(u=>u.o===0&&u.type===hu.type);sel=v.map(u=>u.id).slice(0,60)}else if(shift){if(sel.indexOf(hu.id)<0)sel.push(hu.id)}else sel=[hu.id];lastTapT=now;lastTapId=hu.id;panelDirty=true;return}
  if(mode==='sel'||(!mine.length&&!(selB&&selB.k==='b'&&selB.o===0))){if(hu){sel=[hu.id]}else if(hb){sel=[hb.id]}else sel=[];panelDirty=true;return}}
 if(selB&&selB.k==='b'&&selB.o===0&&!mine.length){if(hb===selB)return;if(hb&&hb.o===0&&hb!==selB&&!(hb.type==='farm'||hb.built<1)){sel=[hb.id];panelDirty=true;return}
  if(hu&&mode==='smart'){sel=[hu.id];panelDirty=true;return}
  if(B[selB.type].train){const tx=Math.floor(w.x),ty=Math.floor(w.y),i=ty*W+tx;selB.rally={x:w.x,y:w.y};if(resT[i]&&explored[i])selB.rally.rt=RTN[resT[i]],selB.rally.tx=tx,selB.rally.ty=ty;if(hb&&hb.o===0)selB.rally.bid=hb.id;
   fx.push({k:'ring',x:w.x,y:w.y,t:0,life:.5,c:'#f4e07a'});toast('Rally point set')}else{sel=hb?[hb.id]:[];panelDirty=true}return}
 if(!mine.length){if(hb){sel=[hb.id];panelDirty=true}return}
 command(mine,w,hu,hb,mode)}
function command(mine,w,hu,hb,mode){const tx=Math.floor(w.x),ty=Math.floor(w.y),i=ty*W+tx;let mark='#7fe06a';
 if(hu&&hu.o!==0){for(const u of mine){u.task={k:'atk',id:hu.id};u.path=null}mark='#ff5a4a'}
 else if(hb&&hb.o!==0){for(const u of mine){u.task={k:'atk',id:hb.id};u.path=null}mark='#ff5a4a'}
 else if(hb&&hb.o===0){const vils=mine.filter(u=>u.type==='villager');
  if(vils.length&&(hb.built<1||hb.hp<bMaxHp(hb))){for(const v of vils){v.task={k:'build',id:hb.id,q:[]};v.path=null}}
  else if(vils.length&&hb.type==='farm'){const v=vils[0];hb.worker=v.id;v.task={k:'farm',id:hb.id};v.path=null;for(const o of vils.slice(1)){const f=freeFarm(0,o.x,o.y);if(f){f.worker=o.id;o.task={k:'farm',id:f.id}}else o.task=null;o.path=null}}
  else if(vils.length&&B[hb.type].drop&&vils.some(v=>v.carry>0)){for(const v of vils){if(v.carry>0){v.task={k:'gather',rt:v.ct,tx:0,ty:0,ph:'ret',drop:hb.id,end:1};v.path=null}}}
  else if(vils.length&&hb.type==='tc'&&P[0].bell){for(const v of vils){v.task={k:'gar',id:hb.id};v.path=null}}
  else if(mode==='smart'){sel=[hb.id];panelDirty=true;return}
  else moveGroup(mine,w)}
 else if(resT[i]&&explored[i]){const vils=mine.filter(u=>u.type==='villager');for(const v of vils){v.task={k:'gather',rt:RTN[resT[i]],tx,ty};v.path=null}const mil=mine.filter(u=>u.type!=='villager');if(mil.length)moveGroup(mil,w)}
 else moveGroup(mine,w);
 fx.push({k:'ring',x:w.x,y:w.y,t:0,life:.5,c:mark})}
function moveGroup(us,w){if(us.length===1){us[0].task={k:'move',x:w.x,y:w.y};us[0].path=null;return}
 const cx=Math.floor(w.x),cy=Math.floor(w.y);const spots=[];for(let r=0;r<8&&spots.length<us.length;r++)for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(Math.max(Math.abs(x-cx),Math.abs(y-cy))!==r)continue;if(passXY(x,y,0))spots.push({x:x+.5,y:y+.5})}
 const rem=us.slice().sort((a,b)=>Math.hypot(a.x-w.x,a.y-w.y)-Math.hypot(b.x-w.x,b.y-w.y));
 for(const sp of spots){if(!rem.length)break;let bi=0,bd=1e9;rem.forEach((u,k)=>{const d=Math.hypot(u.x-sp.x,u.y-sp.y);if(d<bd){bd=d;bi=k}});const u=rem.splice(bi,1)[0];u.task={k:'move',x:sp.x,y:sp.y};u.path=null}}
function visibleUnits(){const a=toWorld(0,0),b=toWorld(VW,VH);return units.filter(u=>!u.gar&&u.x>=a.x&&u.x<=b.x&&u.y>=a.y&&u.y<=b.y)}
function boxSelect(sx,sy,ex,ey,shift){const a=toWorld(Math.min(sx,ex),Math.min(sy,ey)),b=toWorld(Math.max(sx,ex),Math.max(sy,ey));
 let us=units.filter(u=>u.o===0&&!u.gar&&u.x>=a.x&&u.x<=b.x&&u.y>=a.y-.3&&u.y<=b.y+.3);if(us.some(isMil)&&us.some(u=>!isMil(u))&&false)us=us.filter(isMil);
 if(!us.length){if(!shift)sel=[];panelDirty=true;return}sel=(shift?sel.concat(us.map(u=>u.id)):us.map(u=>u.id)).slice(0,60);panelDirty=true}
function nextIdle(){const idle=units.filter(u=>u.o===0&&u.type==='villager'&&!u.task&&!u.gar);if(!idle.length){toast('No idle villagers');return}S.idleIx=((S.idleIx||0)+1)%idle.length;const u=idle[S.idleIx];sel=[u.id];centerOn(u.x,u.y);panelDirty=true}
function goHome(){const b=blds.find(b=>b.o===0&&b.type==='tc')||blds.find(b=>b.o===0);if(b)centerOn(b.x+b.w/2,b.y+b.h/2)}
mini.addEventListener('pointerdown',e=>{if(!S)return;const r=mini.getBoundingClientRect();const go=ev=>centerOn((ev.clientX-r.left)/r.width*W,(ev.clientY-r.top)/r.height*H);go(e);mini.setPointerCapture(e.pointerId);mini.onpointermove=ev=>{if(ev.buttons||ev.pointerType!=='mouse')go(ev)};mini.onpointerup=()=>{mini.onpointermove=null}});
$('#bIdle').onclick=nextIdle;$('#bHome').onclick=goHome;
$('#bArmy').onclick=()=>{const a=units.filter(u=>u.o===0&&isMil(u)&&!u.gar);if(!a.length){toast('You have no army yet');return}const same=a.length===sel.length&&a.every(u=>sel.includes(u.id));sel=a.map(u=>u.id).slice(0,60);if(same){let x=0,y=0;for(const u of a){x+=u.x;y+=u.y}centerOn(x/a.length,y/a.length)}panelDirty=true};
$('#bBox').onclick=()=>{boxMode=!boxMode;$('#bBox').classList.toggle('on',boxMode);toast(boxMode?'Box select on: drag to select. Pinch or the minimap to move.':'Box select off')};

/* ---------- panel ---------- */
const panel=$('#panel'),info=$('#info'),acts=$('#acts');let panelDirty=true,lastSig='',tab='eco',delArm=0;
function selection(){const es=sel.map(id=>ents.get(id)).filter(e=>e&&!(e.k==='u'&&e.gar));sel=es.map(e=>e.id);if(!es.length)return{k:'none',es};if(es[0].k==='b')return{k:es[0].o===0?'bld':'enemy',es};if(es[0].o!==0)return{k:'enemy',es};return{k:'units',es}}
const SHORT={'Lumber Camp':'Lumber','Mining Camp':'Mining','Archery Range':'Archery','Siege Workshop':'Siege','Town Center':'Town Ctr','Watch Tower':'Tower','Stone Wall':'Wall','Battering Ram':'Ram','Crossbowman':'Crossbow','Scout Rider':'Scout','Double-Bit Axe':'Axe','Horse Collar':'Collar','Heavy Plow':'Plow','Gold Mining':'Gold Mine','Stone Mining':'Stone Mine','Iron Casting':'Iron Cast','Blast Furnace':'Furnace','Bodkin Arrow':'Bodkin','Scale Armor':'Scale','Chain Mail':'Chain','Plate Armor':'Plate','Wheelbarrow':'Barrow','Feudal Age':'Feudal','Castle Age':'Castle','Imperial Age':'Imperial'};
function btn(a,icon,name,cost,ok,cls=''){name=SHORT[name]||name;return`<button class="ab ${ok?'':'no'} ${cls}" data-a="${a}"><img src="${ICON[icon]||''}" alt=""><span class="nm">${name}</span>${cost?`<span class="cs">${costStr(cost)}</span>`:''}</button>`}
function taskText(u){const t=u.task;if(!t)return'Idle';if(t.k==='move')return'Moving';if(t.k==='atk')return'Attacking';if(t.k==='build')return'Building';if(t.k==='gar')return'Heading inside';
 if(t.k==='farm')return t.ph==='ret'?'Carrying food home':`Farming (${Math.floor(u.carry)}/${P[0].m.carry})`;if(t.k==='gather'){const v={wood:'Chopping wood',gold:'Mining gold',stone:'Mining stone',food:'Picking berries'}[t.rt];return t.ph==='ret'?`Carrying ${t.rt} home`:`${v} (${Math.floor(u.carry)}/${P[0].m.carry})`}return''}
function renderPanel(){if(!S)return;const s=selection(),p=P[0];
 if(placing){panel.hidden=false;const d=B[placing.type];const wallStage=d.wall?(placing.ax==null?'Tap where the wall starts, then press the check.':'Now tap where the wall ends, then press the check.'):'Tap the map to position it, then press the check.';
  info.innerHTML=`<div class="por"><img src="${ICON['b_'+placing.type]}" alt=""></div><div class="tx"><h4>${d.n}</h4><div class="st">${costStr(d.cost)}${d.wall?' per tile':''}</div><div class="st">${wallStage}</div></div>`;
  const sig='place'+(placing.ax!=null)+(placing.tx!=null);if(sig!==lastSig){lastSig=sig;acts.innerHTML=btn('pok','ok',d.wall&&placing.ax==null?'Start':'Place',null,placing.tx!=null,'ok')+btn('pno','no','Cancel',null,true,'x')}return}
 if(s.k==='none'){panel.hidden=true;lastSig='';return}panel.hidden=false;
 if(s.k==='units'||s.k==='enemy'&&s.es[0].k==='u'){const es=s.es;
  if(es.length===1){const u=es[0],d=U[u.type],mx=uMaxHp(u);const f=u.hp/mx;
   info.innerHTML=`<div class="por"><img src="${ICON['u_'+u.type]}" alt=""></div><div class="tx"><h4>${d.n}${u.o!==0?' (rival)':''}</h4><div class="hp ${f<.35?'lo':''}"><i style="width:${f*100}%"></i></div><div class="st"><b>${Math.ceil(u.hp)}/${mx}</b> HP · Attack <b>${uAtk(u)}</b> · Armor <b>${uArm(u,'m')}/${uArm(u,'p')}</b>${uRng(u)?` · Range <b>${uRng(u)}</b>`:''}</div>${u.o===0?`<div class="st">${taskText(u)}</div>`:''}</div>`}
  else{const g={};for(const u of es)g[u.type]=(g[u.type]||0)+1;info.innerHTML=`<div class="tx"><h4>${es.length} units selected</h4><div class="grp">${Object.keys(g).map(t=>`<button data-a="only:${t}"><img src="${ICON['u_'+t]}" alt=""><b>${g[t]}</b></button>`).join('')}</div></div>`}
  if(s.k==='enemy'){const sig='en';if(sig!==lastSig){lastSig=sig;acts.innerHTML=''}return}
  const vils=es.some(u=>u.type==='villager');let html='',sig='u'+vils+tab+p.age+(delArm>performance.now()?'d':'');
  if(vils){html+=`<div class="tabs"><button data-a="tab:eco" class="${tab==='eco'?'on':''}">Economy</button><button data-a="tab:mil" class="${tab==='mil'?'on':''}">Military</button><button data-a="tab:def" class="${tab==='def'?'on':''}">Defense</button></div>`;
   for(const t of BUILD_TABS[tab]){const d=B[t];if(d.age>p.age){html+=`<button class="ab no" data-a="lock:${t}"><img src="${ICON['b_'+t]}" alt=""><span class="nm">${SHORT[d.n]||d.n}</span><span class="cs">${AGE[d.age].split(' ')[0]}</span></button>`;continue}const ok=afford(p,d.cost);sig+=ok?1:0;html+=btn('build:'+t,'b_'+t,d.n,d.cost,ok)}}
  html+=btn('stop','stop','Stop',null,true)+btn(delArm>performance.now()?'del2':'del','del',delArm>performance.now()?'Sure?':'Delete',null,true);
  if(sig!==lastSig){lastSig=sig;acts.innerHTML=html}return}
 const b=s.es[0],d=B[b.type],mx=bMaxHp(b),f=b.hp/mx;let st='';
 if(b.built<1)st=`Under construction <b>${Math.floor(b.built*100)}%</b>`;
 else if(b.type==='farm')st=`Food left <b>${Math.floor(b.food)}</b>`;
 else if(d.pop)st=`Houses <b>${d.pop}</b> people`;
 if(b.type==='tc'&&b.gar.length)st+=` · <b>${b.gar.length}</b> inside`;
 let q='';if(b.o===0&&b.queue.length)q=`<div class="q">${b.queue.map((it,k)=>{const tm=it.u?U[it.u].tm:TECH[it.t].tm;return`<button data-a="cancel:${k}" aria-label="Cancel"><img src="${ICON[it.u?'u_'+it.u:'t_'+it.t]}" alt="">${k===0?`<i style="width:${Math.min(100,it.p/tm*100)}%"></i>`:''}</button>`}).join('')}</div>`;
 info.innerHTML=`<div class="por"><img src="${ICON['b_'+b.type]}" alt=""></div><div class="tx"><h4>${d.n}${b.o!==0?' (rival)':''}</h4><div class="hp ${f<.35?'lo':''}"><i style="width:${f*100}%"></i></div><div class="st"><b>${Math.ceil(b.hp)}/${mx}</b> HP${st?' · '+st:''}</div>${q}</div>`;
 if(b.o!==0){if(lastSig!=='en'){lastSig='en';acts.innerHTML=''}return}
 let html='',sig='b'+b.id+p.age+b.built+(b.queue.length>=5)+p.techs.length+(p.bell?1:0)+(delArm>performance.now()?'d':'')+blds.reduce((a,x)=>a+x.queue.length,0);
 if(b.built>=1){for(const t of d.train||[]){const ud=U[t];if(ud.age>p.age)continue;const ok=afford(p,ud.cost)&&b.queue.length<5;sig+=ok?1:0;html+=btn('train:'+t,'u_'+t,ud.n,ud.cost,ok)}
  for(const t of d.tech||[]){if(!techOk(p,t))continue;const tc=TECH[t];const ok=afford(p,tc.cost)&&b.queue.length<5;sig+=ok?1:0;html+=btn('tech:'+t,'t_'+t,tc.n,tc.cost,ok)}
  if(b.type==='tc')html+=p.bell?btn('clear','clear','All clear',null,true):btn('bell','bell','Ring bell',null,true)}
 html+=btn(delArm>performance.now()?'del2':'del','del',delArm>performance.now()?'Sure?':'Delete',null,true);
 if(d.train&&b.built>=1)html+=`<div class="hint">Tap the map to set a rally point. Tap a tree or mine to send new villagers straight to work.</div>`;
 if(sig!==lastSig){lastSig=sig;acts.innerHTML=html}}
function act(a){const p=P[0];const [k,v]=a.split(':');const s=selection();
 if(k==='tab'){tab=v;lastSig='';return}
 if(k==='lock'){toast(B[v].n+' unlocks in the '+AGE[B[v].age]);return}
 if(k==='only'){sel=s.es.filter(u=>u.type===v).map(u=>u.id);panelDirty=true;return}
 if(k==='build'){const d=B[v];if(!afford(p,d.cost)){toast('Need '+need(p,d.cost),'bad');return}const c=toWorld(VW/2,VH*.45);placing={type:v,tx:null,ty:null,ax:null,ay:null};setGhost(c);lastSig='';return}
 if(k==='pok'){confirmPlace();lastSig='';return}if(k==='pno'){placing=null;lastSig='';panelDirty=true;return}
 if(k==='stop'){for(const u of s.es)if(u.k==='u'){u.task=null;u.path=null}return}
 if(k==='del'){delArm=performance.now()+2500;lastSig='';return}
 if(k==='del2'){if(delArm<performance.now()&&a!=='del2')return;delArm=0;for(const e of s.es){if(e.o!==0)continue;if(e.k==='b'&&e.built<1)refund(p,B[e.type].cost,1-e.built);kill(e,0,true)}lastSig='';return}
 const b=s.es[0];if(!b||b.k!=='b')return;
 if(k==='train'){const ud=U[v];if(b.queue.length>=5){toast('Queue is full');return}if(!afford(p,ud.cost)){toast('Need '+need(p,ud.cost),'bad');return}pay(p,ud.cost);b.queue.push({u:v,p:0});lastSig='';return}
 if(k==='tech'){const tc=TECH[v];if(!techOk(p,v))return;if(!afford(p,tc.cost)){toast('Need '+need(p,tc.cost),'bad');return}pay(p,tc.cost);b.queue.push({t:v,p:0});lastSig='';return}
 if(k==='cancel'){const it=b.queue[+v];if(!it)return;refund(p,it.u?U[it.u].cost:TECH[it.t].cost);b.queue.splice(+v,1);lastSig='';return}
 if(k==='bell'){ringBell(0,true);lastSig='';return}if(k==='clear'){ringBell(0,false);lastSig='';return}}
panel.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;act(t.dataset.a);renderPanel()});
function updTop(){const p=P[0];for(const r of R4){const el=$('#r-'+r+' b');const v=Math.floor(p.res[r]);if(el.textContent!==String(v))el.textContent=v}
 $('#r-pop b').textContent=p.pop+'/'+p.popCap;$('#r-pop').classList.toggle('warn',p.pop>=p.popCap);
 let ag=AGE[p.age];for(const b of blds)if(b.o===0&&b.queue.length&&b.queue[0].t&&TECH[b.queue[0].t].up){ag=`${AGE[p.age+1].split(' ')[0]} ${Math.floor(b.queue[0].p/TECH[b.queue[0].t].tm*100)}%`}
 $('#age b').textContent=ag;const t=Math.floor(S.t);$('#age small').textContent=Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
 const idle=units.filter(u=>u.o===0&&u.type==='villager'&&!u.task&&!u.gar).length;const bi=$('#bIdle .badge');bi.textContent=idle||'';
 const army=units.filter(u=>u.o===0&&isMil(u)).length;const ba=$('#bArmy .badge');ba.textContent=army||'';ba.style.background=army?'#3f6ea8':''}

/* ---------- game setup ---------- */
function newPlayer(i,style){return{i,style,res:{food:200,wood:200,gold:100,stone:200},age:0,techs:[],m:newMods(),pop:0,popCap:0,ai:null,bell:false,st:{trained:0,kills:0,lost:0,razed:0,gath:0}}}
function newGame(style,diff,demo){const seed=(Math.random()*1e9)|0;units=[];blds=[];ents=new Map();projs=[];fx=[];rubble=[];sel=[];placing=null;explored.fill(0);vis.fill(0);pings=[];
 S={t:0,tick:0,nid:1,seed,speed:1.5,diff};const ostyle=SKEYS.filter(k=>k!==style)[Math.floor(Math.random()*3)];P=[newPlayer(0,style),newPlayer(1,ostyle)];aiInit(P[1],diff);if(demo)aiInit(P[0],1);
 const starts=genMap(seed);rnd=Math.random;
 starts.forEach((s,i)=>{const tc=mkBld('tc',i,s[0],s[1],true);for(let k=0;k<3;k++){const p=freeAround(tc);mkUnit('villager',i,p.x,p.y)}const p=freeAround(tc);mkUnit('scout',i,p.x,p.y);calcPop(P[i])});
 renderGround(seed);computeFog();const tc=blds.find(b=>b.o===0);cam.z=Math.min(VW,VH)<500?(VW>VH?.85:1):1.15;centerOn(tc.x+2,tc.y+3);makeIcons(style);setupHudIcons();}
function setupHudIcons(){for(const r of R4)$('#r-'+r+' img').src=ICON[r];$('#r-pop img').src=ICON.pop;$('#bIdle img').src=ICON.u_villager;$('#bArmy img').src=ICON.army;$('#bBox img').src=ICON.box;$('#bHome img').src=ICON.b_tc}
function save(){if(!running||!S)return;try{const data={v:1,S:{t:S.t,tick:S.tick,nid:S.nid,seed:S.seed,speed:S.speed,diff:S.diff},
 P:P.map(p=>({i:p.i,style:p.style,res:p.res,age:p.age,techs:p.techs,bell:p.bell,st:p.st,ai:p.ai?Object.assign({},p.ai,{waves:[...p.ai.waves]}):null})),
 U:units.map(u=>({id:u.id,type:u.type,o:u.o,x:+u.x.toFixed(2),y:+u.y.toFixed(2),hp:u.hp,carry:u.carry,ct:u.ct,gar:u.gar,face:u.face,task:u.task})),
 B:blds.map(b=>({id:b.id,type:b.type,o:b.o,x:b.x,y:b.y,hp:b.hp,built:b.built,queue:b.queue,rally:b.rally,gar:b.gar,food:b.food,worker:b.worker,started:b.started})),
 rt:Array.from(resT).join(''),ra:Array.from(resA,v=>Math.round(v)),ex:Array.from(explored).join(''),cam:{x:cam.x,y:cam.y,z:cam.z}};
 localStorage.setItem('boc-save',JSON.stringify(data))}catch(e){}}
function hasSave(){try{return !!localStorage.getItem('boc-save')}catch(e){return false}}
function load(){let d;try{d=JSON.parse(localStorage.getItem('boc-save'))}catch(e){return false}if(!d||d.v!==1)return false;
 units=[];blds=[];ents=new Map();projs=[];fx=[];rubble=[];sel=[];placing=null;pings=[];S=Object.assign({},d.S);
 P=d.P.map(q=>{const p=newPlayer(q.i,q.style);Object.assign(p,{res:q.res,age:q.age,techs:q.techs,bell:q.bell,st:q.st});if(q.ai){p.ai=Object.assign({},q.ai,{waves:new Set(q.ai.waves)})}for(const t of p.techs)TECH[t].fx(p.m);return p});
 block.fill(0);occ.fill(0);for(let i=0;i<N;i++){resT[i]=+d.rt[i];resA[i]=d.ra[i];block[i]=resT[i]?1:0;explored[i]=+d.ex[i]}
 for(const q of d.B){const b={k:'b',w:B[q.type].w,h:B[q.type].h,cd:Math.random(),dmgT:0,...q};blds.push(b);ents.set(b.id,b);stampB(b,true)}
 for(const q of d.U){const u={k:'u',path:null,cd:0,an:0,th:Math.random(),rp:0,r:RAD[U[q.type].tag],swing:0,work:0,...q};units.push(u);ents.set(u.id,u)}
 for(const p of P)calcPop(p);renderGround(S.seed);computeFog();Object.assign(cam,d.cam);clampCam();makeIcons(P[0].style);setupHudIcons();return true}

/* ---------- loop ---------- */
let last=performance.now(),acc=0,uiT=0,miniT=0,titleT=0;
function tick(){S.t+=DT;S.tick++;
 for(const b of blds.slice())if(!b.dead)updBld(b,DT);
 for(const u of units.slice())if(!u.dead){u.work=0;updUnit(u,DT)}
 if(S.tick%2===0)separate();
 for(const p of projs){p.t+=DT;if(p.t>=p.dur){const t=ents.get(p.tid);if(t&&!t.dead&&!(t.k==='u'&&t.gar))hit(t,p.d,p.o,p.aid);p.done=1}else{const t=ents.get(p.tid);if(t&&!t.gar){const c=ec(t);p.tx=c.x;p.ty=c.y}}}
 projs=projs.filter(p=>!p.done);for(const f of fx)f.t+=DT;fx=fx.filter(f=>f.t<f.life);for(const r of rubble)r.t+=DT;rubble=rubble.filter(r=>r.t<40);
 if(S.tick%5===0)computeFog();
 if(S.tick%20===0){for(const p of P){calcPop(p);if(p.ai)aiTick(p)}checkEnd()}
 if(S.tick%600===0)save()}
function checkEnd(){for(const p of P){const alive=blds.some(b=>b.o===p.i&&(b.type==='tc'||b.type==='castle')&&b.built>=1)||units.some(u=>u.o===p.i&&u.type==='villager');if(!alive){endGame(p.i!==0);return}}}
function endGame(win){running=false;try{localStorage.removeItem('boc-save')}catch(e){}$('#hud').hidden=true;$('#end').hidden=false;$('#endTitle').textContent=win?'Victory':'Defeat';
 $('#endSub').textContent=win?'The rival crown has fallen.':'Your town has fallen. Rebuild and try again.';const t=Math.floor(S.t);
 const rows=[['','You','Rival'],['Time',Math.floor(t/60)+' min',''],['Units trained',P[0].st.trained,P[1].st.trained],['Units killed',P[0].st.kills,P[1].st.kills],['Units lost',P[0].st.lost,P[1].st.lost],['Buildings razed',P[0].st.razed,P[1].st.razed],['Resources gathered',Math.floor(P[0].st.gath),Math.floor(P[1].st.gath)],['Age reached',AGE[P[0].age],AGE[P[1].age]]];
 $('#endStats').innerHTML=rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}
function frame(now){const dt=Math.min(.25,(now-last)/1000);last=now;
 if(running&&!paused){acc+=dt*S.speed;let n=0;while(acc>=DT&&n<16){tick();acc-=DT;n++}if(n>=16)acc=0}
 else if(!running&&S){titleT+=dt;cam.x+=dt*14;cam.y+=dt*6;if(cam.x>W*T-VW/cam.z-40){cam.x=40}if(cam.y>H*T-VH/cam.z-40)cam.y=40}
 keyPan(dt);render();
 if(running){uiT+=dt;miniT+=dt;if(panelDirty||uiT>.25){uiT=0;panelDirty=false;renderPanel();updTop()}if(miniT>.3){miniT=0;drawMini()}}
 requestAnimationFrame(frame)}

/* ---------- screens ---------- */
let chosenStyle='west',chosenDiff=1;
function buildTitle(){const el=$('#styles');el.innerHTML=SKEYS.map(k=>{const c=bSprite('tc',k,0);const ic=iconCanvas(g=>{const w=c.width/c.sc,h=c.height/c.sc,s=Math.min(60/w,60/h);g.drawImage(c,32-w*s/2,34-h*s/2,w*s,h*s)});return`<button data-s="${k}" class="${k===chosenStyle?'on':''}"><img src="${ic}" alt="">${STYLES[k].n}</button>`}).join('');
 el.onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;chosenStyle=b.dataset.s;el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))};
 $('#diff').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;chosenDiff=+b.dataset.d;$('#diff').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))};
 $('#contBtn').hidden=!hasSave()}
function showTitle(){running=false;paused=false;$('#hud').hidden=true;$('#pause').hidden=true;$('#end').hidden=true;$('#title').hidden=false;buildTitle();
 newGame(SKEYS[Math.floor(Math.random()*4)],1,true);for(const p of P){p.res.wood+=400;}const tc0=blds[0],tc1=blds[1];
 for(const [tc,o] of [[tc0,0],[tc1,1]]){for(const [t,dx,dy] of [['house',-3,0],['house',5,1],['barracks',0,6],['mill',6,-3],['tower',-2,-2],['house',-3,3]]){if(canPlace(t,tc.x+dx,tc.y+dy,1,false))mkBld(t,o,tc.x+dx,tc.y+dy,true)}}
 explored.fill(1);cam.z=VW<700?.9:1.1;centerOn(tc0.x+2,tc0.y+2)}
function startGame(){$('#title').hidden=true;$('#end').hidden=true;newGame(chosenStyle,chosenDiff,false);beginPlay();toast('Tap a villager, then tap a tree, bush or mine to start gathering.','good');setTimeout(()=>{if(running)toast('Pinch to zoom. Hold still, then drag, to box-select.')},4500)}
function beginPlay(){running=true;paused=false;$('#hud').hidden=false;lastSig='';panelDirty=true;updTop();drawMini();setSpeedUI()}
function setSpeedUI(){$('#speed').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.s===S.speed))}
$('#newBtn').onclick=startGame;
$('#contBtn').onclick=()=>{if(load()){$('#title').hidden=true;beginPlay();toast('Welcome back.','good')}else{toast('That save could not be loaded','bad');$('#contBtn').hidden=true}};
$('#againBtn').onclick=startGame;$('#endTitleBtn').onclick=showTitle;
$('#menuBtn').onclick=()=>{paused=true;save();setSpeedUI();$('#pause').hidden=false};
$('#resumeBtn').onclick=()=>{paused=false;$('#pause').hidden=true};
$('#quitBtn').onclick=()=>{save();showTitle()};
$('#speed').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;S.speed=+b.dataset.s;setSpeedUI()};
const helpOpen=()=>{$('#helpScr').hidden=false};$('#helpBtn').onclick=helpOpen;$('#help2Btn').onclick=helpOpen;$('#helpClose').onclick=()=>{$('#helpScr').hidden=true};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){save();if(!paused){paused=true;$('#pause').hidden=false;setSpeedUI()}}});
addEventListener('pagehide',save);
addEventListener('resize',resize);

resize();makeResSprites();showTitle();requestAnimationFrame(frame);
window.__boc={cam,centerOn,setRun:v=>{running=v},get S(){return S},get P(){return P},get units(){return units},get blds(){return blds},tick,newGame,startGame,
 demo(diff){newGame('west',diff,true);running=true;paused=false},fast(n){for(let i=0;i<n;i++){tick();if(!running)break}},save,load,act,tap,confirmPlace,get placing(){return placing},sel:()=>sel,setSel:a=>{sel=a}};
})();
