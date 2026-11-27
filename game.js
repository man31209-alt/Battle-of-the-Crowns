/* Battle of the Crowns v2: a medieval real-time strategy game for phones.
   All original code and art (drawn in code). Game systems inspired by the open-source game 0 A.D.:
   three phases, citizen soldiers, territory, capturing, fields, trade, heroes, ranks and navies. */
'use strict';
(function(){
let W=128,H=128,N=W*H;const DT=0.05;
const $=s=>document.querySelector(s);
const cv=$('#game'),ctx=cv.getContext('2d');
let DPR=1,VW=1,VH=1;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const R4=['food','wood','stone','gold'];
const PHASE=['Village','Town','City','Kingdom'];
const PCOL=['#2f6fe0','#d6392b','#3a9a46','#d9a521'];
const PNAME=['You','Red','Green','Gold'];
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rnd=Math.random;
const ri=n=>Math.floor(rnd()*n);
const DX=[1,-1,0,0,1,1,-1,-1],DY=[0,0,1,-1,1,-1,1,-1];

/* ---------- civilizations ---------- */
// mods: applied to a player's modifier set at game start. uu = unique unit (trained at the castle), hero = trained at the castle in the City phase.
const CIVS={
 english:{n:'English',style:'west',bonus:'Archers +1 range. Longbowmen outrange everyone.',mods:m=>{m.arcRng+=1},uu:'longbow',hero:'h_english'},
 french:{n:'French',style:'west',bonus:'Cavalry +20% health. Gendarmes crush lines.',mods:m=>{m.hp.cav+=.2},uu:'gendarme',hero:'h_french'},
 germans:{n:'Holy Roman Empire',style:'west',bonus:'Buildings +15% health, towers fire +1 arrow.',mods:m=>{m.bhp+=.15;m.towerArr+=1},uu:'landsknecht',hero:'h_germans'},
 castilians:{n:'Castilians',style:'west',bonus:'Builders work 25% faster.',mods:m=>{m.build+=.25},uu:'jinete',hero:'h_castilians'},
 byzantines:{n:'Byzantines',style:'mid',bonus:'Spearmen and archers cost 20% less.',mods:m=>{m.cost.spear=.8;m.cost.archer=.8},uu:'cataphract',hero:'h_byzantines'},
 saracens:{n:'Saracens',style:'mid',bonus:'Trade carts earn 30% more; better barter prices.',mods:m=>{m.trade+=.3;m.barter=.5},uu:'mameluke',hero:'h_saracens'},
 vikings:{n:'Vikings',style:'norse',bonus:'Soldiers gather 25% faster; ships cost 20% less.',mods:m=>{m.citGather+=.25;m.shipCost=.8},uu:'berserker',hero:'h_vikings'},
 celts:{n:'Celts',style:'norse',bonus:'Woodcutting +15%, infantry move 10% faster.',mods:m=>{m.rate.wood+=.15;m.spd.inf+=.1},uu:'woad',hero:'h_celts'},
 japanese:{n:'Japanese',style:'east',bonus:'Infantry attack 20% faster; fishing +25%.',mods:m=>{m.infRate=.8;m.rate.fish+=.25},uu:'samurai',hero:'h_japanese'},
 chinese:{n:'Chinese',style:'east',bonus:'Start with 3 more villagers; upgrades cost 15% less.',mods:m=>{m.techCost=.85;m.extraVil=3},uu:'chukonu',hero:'h_chinese'},
 mongols:{n:'Mongols',style:'east',bonus:'Cavalry 15% faster; hunting +40%.',mods:m=>{m.spd.cav+=.15;m.rate.hunt+=.4},uu:'mangudai',hero:'h_mongols'}
};
const CKEYS=Object.keys(CIVS);

/* ---------- units ---------- */
// tag: vil villager, inf infantry, arc ranged foot, cav cavalry, sie siege, shp ship, mon monk, trd trader, her hero
// cit: citizen soldier (can gather and build), look: drawing template
const U={
 villager:{n:'Villager',hp:30,atk:3,at:'m',rng:0,arm:[0,0],spd:1.35,los:5,cost:{food:50},tm:12,ph:0,tag:'vil',rate:1.6,look:'villager',d:'Gathers, builds and repairs.'},
 spear:{n:'Spearman',hp:50,atk:4,at:'m',rng:0,arm:[1,1],spd:1.3,los:5,cost:{food:50,wood:40},tm:12,ph:0,tag:'inf',rate:1.8,bon:{cav:12},cit:1,look:'spear',d:'Citizen soldier. Strong against cavalry. Can gather and build.'},
 archer:{n:'Archer',hp:35,atk:4,at:'p',rng:5,arm:[0,0],spd:1.3,los:7,cost:{food:50,wood:50},tm:12,ph:0,tag:'arc',rate:1.8,bon:{inf:2},cit:1,look:'archer',d:'Citizen soldier. Good against infantry. Can gather and build.'},
 scout:{n:'Scout Rider',hp:70,atk:4,at:'m',rng:0,arm:[1,2],spd:2.2,los:9,cost:{food:100},tm:14,ph:0,tag:'cav',rate:1.6,bon:{arc:4,sie:6},hunter:1,look:'scout',d:'Fast rider. Good against archers and siege. Hunts quickly.'},
 militia:{n:'Swordsman',hp:65,atk:7,at:'m',rng:0,arm:[2,1],spd:1.3,los:5,cost:{food:60,gold:30},tm:14,ph:1,tag:'inf',rate:1.6,bon:{inf:2},cit:1,look:'militia',d:'Citizen soldier. Good against infantry and buildings.'},
 xbow:{n:'Crossbowman',hp:40,atk:6,at:'p',rng:6,arm:[1,1],spd:1.25,los:8,cost:{wood:50,gold:40},tm:14,ph:1,tag:'arc',rate:2.2,bon:{cav:2,inf:2},cit:1,look:'xbow',d:'Citizen soldier. Hits hard, pierces armor.'},
 knight:{n:'Knight',hp:130,atk:11,at:'m',rng:0,arm:[3,3],spd:1.9,los:6,cost:{food:100,gold:80},tm:20,ph:2,tag:'cav',rate:1.8,look:'knight',d:'Heavy cavalry. Strong against archers and infantry.'},
 champ:{n:'Champion',hp:100,atk:13,at:'m',rng:0,arm:[3,2],spd:1.3,los:6,cost:{food:80,gold:60},tm:18,ph:2,tag:'inf',rate:1.7,bon:{inf:3},look:'champ',d:'Elite infantry. Cannot gather.'},
 king:{n:'King',hp:300,atk:7,at:'m',rng:0,arm:[3,3],spd:1.15,los:8,cost:{food:1},tm:1,ph:9,tag:'kng',rate:1.5,look:'king',d:'Your King. If he dies, you lose (Regicide).'},
 monk:{n:'Monk',hp:40,atk:0,at:'m',rng:0,arm:[0,0],spd:1.2,los:8,cost:{gold:100},tm:16,ph:1,tag:'mon',rate:1,heal:3,look:'monk',d:'Heals nearby wounded units. Tap a relic to carry it to a monastery for steady gold.'},
 trader:{n:'Trade Cart',hp:80,atk:0,at:'m',rng:0,arm:[0,2],spd:1.4,los:6,cost:{food:100,gold:80},tm:16,ph:1,tag:'trd',rate:1,look:'trader',d:'Carries goods between two of your markets for gold.'},
 ram:{n:'Battering Ram',hp:260,atk:2,at:'m',rng:0,arm:[-3,150],spd:.8,los:4,cost:{wood:250,gold:100},tm:26,ph:1,tag:'sie',rate:3,bon:{bld:130},look:'ram',d:'Smashes buildings. Weak to melee.'},
 mangonel:{n:'Mangonel',hp:120,atk:14,at:'p',rng:8,arm:[0,10],spd:.75,los:9,cost:{wood:250,gold:150},tm:28,ph:2,tag:'sie',rate:5,bon:{bld:30},splash:1.2,look:'mangonel',d:'Hurls stones that hit groups of units.'},
 treb:{n:'Trebuchet',hp:180,atk:2,at:'p',rng:12,arm:[1,150],spd:.65,los:12,cost:{wood:300,gold:250},tm:34,ph:2,tag:'sie',rate:8,bon:{bld:260},look:'treb',d:'Huge range. Destroys walls and castles.'},
 sheep:{n:'Sheep',hp:10,atk:0,at:'m',rng:0,arm:[0,0],spd:.8,los:3,cost:{food:50},tm:8,ph:0,tag:'ani',rate:1,look:'sheep',d:'Fattened at the corral. Hunt it for 100 food.'},
 fishboat:{n:'Fishing Boat',hp:80,atk:0,at:'m',rng:0,arm:[0,2],spd:1.6,los:7,cost:{wood:80},tm:14,ph:0,tag:'shp',rate:1,nav:1,look:'fishboat',d:'Catches fish and brings it to the dock.'},
 galley:{n:'War Galley',hp:220,atk:7,at:'p',rng:7,arm:[1,3],spd:1.7,los:9,cost:{wood:160,gold:60},tm:20,ph:1,tag:'shp',rate:2,bon:{shp:4,bld:6},nav:1,look:'galley',d:'Warship with archers. Rules the water.'},
 // unique units
 longbow:{n:'Longbowman',hp:40,atk:6,at:'p',rng:7,arm:[0,1],spd:1.3,los:9,cost:{wood:60,gold:40},tm:14,ph:1,tag:'arc',rate:2,bon:{inf:3},look:'longbow',uu:1,d:'English unique archer with great range.'},
 gendarme:{n:'Gendarme',hp:150,atk:13,at:'m',rng:0,arm:[4,4],spd:1.8,los:6,cost:{food:110,gold:90},tm:20,ph:1,tag:'cav',rate:1.9,look:'gendarme',uu:1,d:'French unique armored cavalry.'},
 landsknecht:{n:'Landsknecht',hp:95,atk:14,at:'m',rng:0,arm:[1,1],spd:1.35,los:6,cost:{food:80,gold:50},tm:16,ph:1,tag:'inf',rate:2,bon:{inf:4,cav:4},look:'landsknecht',uu:1,d:'Two-handed sword mercenary.'},
 jinete:{n:'Jinete',hp:80,atk:5,at:'p',rng:4,arm:[1,2],spd:2.2,los:8,cost:{food:90,wood:40},tm:16,ph:1,tag:'cav',rate:1.8,bon:{cav:3},look:'jinete',uu:1,d:'Castilian javelin rider.'},
 cataphract:{n:'Cataphract',hp:140,atk:11,at:'m',rng:0,arm:[4,3],spd:1.7,los:6,cost:{food:110,gold:90},tm:20,ph:1,tag:'cav',rate:1.8,bon:{inf:5},look:'cataphract',uu:1,d:'Byzantine armored cavalry that tramples infantry.'},
 mameluke:{n:'Camel Rider',hp:110,atk:9,at:'m',rng:0,arm:[1,2],spd:2,los:6,cost:{food:90,gold:60},tm:18,ph:1,tag:'cav',rate:1.8,bon:{cav:9},look:'mameluke',uu:1,d:'Saracen camel rider. Horses fear it.'},
 berserker:{n:'Berserker',hp:85,atk:11,at:'m',rng:0,arm:[1,1],spd:1.45,los:6,cost:{food:70,gold:40},tm:15,ph:1,tag:'inf',rate:1.6,regen:1,look:'berserker',uu:1,d:'Viking warrior that heals over time.'},
 woad:{n:'Woad Raider',hp:80,atk:10,at:'m',rng:0,arm:[0,1],spd:1.75,los:6,cost:{food:65,gold:35},tm:14,ph:1,tag:'inf',rate:1.5,look:'woad',uu:1,d:'Fast Celtic raider.'},
 samurai:{n:'Samurai',hp:90,atk:12,at:'m',rng:0,arm:[2,1],spd:1.4,los:6,cost:{food:70,gold:50},tm:15,ph:1,tag:'inf',rate:1.4,bon:{inf:4},look:'samurai',uu:1,d:'Japanese swordsman with lightning strikes.'},
 chukonu:{n:'Chu Ko Nu',hp:45,atk:4,at:'p',rng:5,arm:[0,1],spd:1.3,los:7,cost:{wood:50,gold:40},tm:14,ph:1,tag:'arc',rate:2,multi:3,look:'chukonu',uu:1,d:'Chinese repeating crossbow, fires three bolts.'},
 mangudai:{n:'Horse Archer',hp:75,atk:5,at:'p',rng:5,arm:[0,1],spd:2.2,los:8,cost:{food:80,wood:50},tm:16,ph:1,tag:'cav',rate:1.9,bon:{sie:4},look:'mangudai',uu:1,d:'Mongol mounted archer.'},
 // heroes
 h_english:{n:'Richard the Lionheart',hp:400,atk:16,at:'m',rng:0,arm:[5,5],spd:1.8,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'cav',rate:1.6,look:'herocav',hero:'atk',d:'Hero. Nearby soldiers deal 20% more damage.'},
 h_french:{n:'Joan of Arc',hp:350,atk:12,at:'m',rng:0,arm:[5,5],spd:1.8,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'cav',rate:1.6,look:'herocav',hero:'arm',d:'Hero. Nearby soldiers gain +2 armor.'},
 h_germans:{n:'Frederick Barbarossa',hp:380,atk:15,at:'m',rng:0,arm:[5,4],spd:1.8,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'cav',rate:1.6,look:'herocav',hero:'spd',d:'Hero. Nearby soldiers move 15% faster.'},
 h_castilians:{n:'El Cid',hp:380,atk:15,at:'m',rng:0,arm:[5,4],spd:1.9,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'cav',rate:1.6,look:'herocav',hero:'atk',d:'Hero. Nearby soldiers deal 20% more damage.'},
 h_byzantines:{n:'Belisarius',hp:360,atk:14,at:'m',rng:0,arm:[6,5],spd:1.8,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'cav',rate:1.6,look:'herocav',hero:'arm',d:'Hero. Nearby soldiers gain +2 armor.'},
 h_saracens:{n:'Saladin',hp:360,atk:14,at:'m',rng:0,arm:[5,5],spd:1.9,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'cav',rate:1.6,look:'herocav',hero:'heal',d:'Hero. Nearby soldiers slowly heal.'},
 h_vikings:{n:'Harald Hardrada',hp:420,atk:17,at:'m',rng:0,arm:[4,4],spd:1.4,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'inf',rate:1.5,look:'heroinf',hero:'atk',d:'Hero. Nearby soldiers deal 20% more damage.'},
 h_celts:{n:'William Wallace',hp:400,atk:17,at:'m',rng:0,arm:[4,3],spd:1.45,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'inf',rate:1.5,look:'heroinf',hero:'spd',d:'Hero. Nearby soldiers move 15% faster.'},
 h_japanese:{n:'Minamoto Yoshitsune',hp:380,atk:18,at:'m',rng:0,arm:[4,3],spd:1.5,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'inf',rate:1.3,look:'heroinf',hero:'atk',d:'Hero. Nearby soldiers deal 20% more damage.'},
 h_chinese:{n:'Yue Fei',hp:400,atk:16,at:'m',rng:0,arm:[5,4],spd:1.45,los:8,cost:{food:200,gold:300},tm:30,ph:2,tag:'inf',rate:1.5,look:'heroinf',hero:'arm',d:'Hero. Nearby soldiers gain +2 armor.'},
 h_mongols:{n:'Subutai',hp:360,atk:12,at:'p',rng:6,arm:[4,4],spd:2.2,los:9,cost:{food:200,gold:300},tm:30,ph:2,tag:'cav',rate:1.6,look:'heroarc',hero:'spd',d:'Hero. Nearby soldiers move 15% faster.'}
};
for(const k in U){const u=U[k];if(k.startsWith('h_'))u.tag2='her'}
const RAD={vil:.26,inf:.28,arc:.27,cav:.42,sie:.5,mon:.27,trd:.45,shp:.7,ani:.3};
const isHero=t=>t.startsWith('h_');

/* ---------- buildings ---------- */
// terr: territory radius when this building is a territory root. any: may be built outside your territory. gar: garrison slots.
const B={
 tc:{n:'Town Center',w:4,h:4,hp:3000,cost:{wood:300,stone:300,gold:200},tm:120,ph:1,pop:20,drop:['food','wood','stone','gold'],los:10,arr:{n:3,r:7,a:6},train:['villager','spear','archer'],tech:['loom','treadmill','wheel','masonry','conscript','architecture','town','city','kingdom','royal','hoardings','spikes'],gar:20,terr:16,d:'Center of your town. Trains villagers. Claims territory.'},
 house:{n:'House',w:2,h:2,hp:600,cost:{wood:60},tm:16,ph:0,pop:10,los:4,d:'+10 population.'},
 farmstead:{n:'Farmstead',w:2,h:2,hp:700,cost:{wood:100},tm:20,ph:0,drop:['food'],los:6,tech:['gather','collar','plow','crop'],d:'Drop off food. Farming upgrades.'},
 storehouse:{n:'Storehouse',w:2,h:2,hp:700,cost:{wood:100},tm:20,ph:0,drop:['wood','stone','gold'],los:6,tech:['axe','saw','stonem','goldm','goldm2','twoman','deepmine'],d:'Drop off wood, stone and gold. Gathering upgrades.'},
 field:{n:'Field',w:3,h:3,hp:300,cost:{wood:100},tm:14,ph:0,los:2,flat:1,slots:5,d:'Never runs out. Up to 5 farmers.'},
 corral:{n:'Corral',w:2,h:2,hp:500,cost:{wood:100},tm:16,ph:0,los:4,train:['sheep'],d:'Raises sheep. Send up to 3 villagers here to herd and butcher for steady food, or train sheep to hunt.'},
 dock:{n:'Dock',w:2,h:2,hp:1000,cost:{wood:150},tm:24,ph:0,drop:['food','wood'],los:7,train:['fishboat','galley'],tech:['nets','shipwright'],water:1,any:1,d:'Build on the shore. Fishing boats and warships.'},
 barracks:{n:'Barracks',w:3,h:3,hp:1500,cost:{wood:200},tm:30,ph:0,los:6,train:['spear','militia','champ'],gar:10,d:'Trains infantry.'},
 range:{n:'Archery Range',w:3,h:3,hp:1500,cost:{wood:200},tm:30,ph:0,los:6,train:['archer','xbow'],d:'Trains archers.'},
 stable:{n:'Stable',w:3,h:3,hp:1500,cost:{wood:200},tm:30,ph:0,los:6,train:['scout','knight'],d:'Trains cavalry.'},
 sentry:{n:'Sentry Tower',w:1,h:1,hp:500,cost:{wood:100},tm:20,ph:0,los:10,arr:{n:1,r:6,a:4},gar:3,d:'Cheap lookout tower.'},
 outpost:{n:'Outpost',w:1,h:1,hp:300,cost:{wood:40},tm:10,ph:0,los:14,any:1,d:'Sees far. Can be built outside your territory.'},
 road:{n:'Stone Road',w:1,h:1,hp:250,cost:{stone:3},tm:3,ph:0,los:0,flat:1,road:1,any:1,nocap:1,d:'Units move 35% faster on roads, and pick roads when finding their way. Drag to lay a road.'},
 pgate:{n:'Palisade Gate',w:1,h:1,hp:500,cost:{wood:25},tm:8,ph:0,los:3,wall:1,gate:1,any:1,nocap:1,d:'Wooden gate. Your units pass, enemies cannot. Build it on top of a palisade to swap a piece out.'},
 palisade:{n:'Palisade',w:1,h:1,hp:350,cost:{wood:3},tm:4,ph:0,los:2,wall:1,any:1,nocap:1,d:'Wooden wall.'},
 smith:{n:'Blacksmith',w:3,h:3,hp:1500,cost:{wood:200},tm:30,ph:1,los:6,tech:['forge','iron','fletch','bodkin','scale','chain','barding','plate','blast','bracer'],d:'Attack and armor upgrades.'},
 market:{n:'Market',w:3,h:3,hp:1500,cost:{wood:300},tm:40,ph:1,los:6,train:['trader'],tech:['caravan','guilds','banking'],market:1,d:'Barter goods. Trade carts run between markets.'},
 temple:{n:'Monastery',w:3,h:3,hp:2000,cost:{stone:300},tm:40,ph:1,los:7,train:['monk'],tech:['herbal'],gar:10,heal:3,d:'Trains monks. Heals units inside.'},
 workshop:{n:'Siege Workshop',w:3,h:3,hp:1500,cost:{wood:300},tm:40,ph:1,los:6,train:['ram','mangonel','treb'],d:'Builds siege weapons.'},
 tower:{n:'Stone Tower',w:1,h:1,hp:1600,cost:{wood:100,stone:150},tm:40,ph:1,los:11,arr:{n:2,r:8,a:7},gar:5,d:'Strong tower. Garrison adds arrows.'},
 wall:{n:'Stone Wall',gar:2,arr:{n:0,r:6,a:6},w:1,h:1,hp:2200,cost:{stone:6},tm:6,ph:1,los:2,wall:1,any:1,nocap:1,d:'Thick stone wall.'},
 gate:{n:'Gate',gar:2,arr:{n:0,r:6,a:6},w:1,h:1,hp:2200,cost:{stone:30},tm:12,ph:1,los:3,wall:1,gate:1,any:1,nocap:1,d:'Your units can pass, enemies cannot. Build it on top of a wall to swap a piece out.'},
 castle:{n:'Castle',w:4,h:4,hp:5000,cost:{stone:700},tm:150,ph:1,pop:20,los:12,arr:{n:4,r:9,a:9},train:['UU','HERO','treb'],tech:['boil','murder'],gar:20,terr:12,d:'Fortress. Unique units and heroes. Claims territory.'},
 wonder:{n:'Wonder',w:5,h:5,hp:6000,cost:{wood:1000,stone:1000,gold:1000},tm:300,ph:2,los:10,d:'A marvel of your age. Can win the game.'}
};
const BUILD_TABS={eco:['house','farmstead','storehouse','field','road','corral','dock','market','tc','wonder'],mil:['barracks','range','stable','smith','temple','workshop','castle'],def:['palisade','pgate','sentry','outpost','wall','gate','tower']};

/* ---------- technologies ---------- */
const TECH={
 town:{n:'Town Phase',ph:0,cost:{food:500,wood:400},tm:60,up:1,need:5,d:'Needs 5 buildings. Unlocks smiths, markets, monasteries, castles, siege and stone walls.'},
 city:{n:'City Phase',ph:1,cost:{stone:600,gold:600},tm:80,up:2,need:4,d:'Needs 4 Town-phase buildings. Unlocks knights, champions, heroes and wonders. Stone buildings, +10% building health.'},
 kingdom:{n:'Kingdom Phase',ph:2,cost:{food:1200,stone:800,gold:1000},tm:100,up:3,need:8,d:'Needs 8 Town-phase buildings. Grand architecture, +15% more building health and the best upgrades.'},
 loom:{n:'Loom',ph:0,cost:{gold:50},tm:20,ic:'shield',d:'Villagers +20 health and +1/+2 armor.',fx:m=>{m.vhp+=20;m.varm[0]+=1;m.varm[1]+=2}},
 treadmill:{n:'Treadmill Crane',ph:0,cost:{wood:200},tm:30,ic:'brick',d:'Everyone builds 20% faster.',fx:m=>{m.build+=.2}},
 wheel:{n:'Wheelbarrow',ph:1,cost:{food:200,wood:100},tm:40,ic:'wheel',d:'Villagers 10% faster, carry +5.',fx:m=>{m.vspd+=.1;m.carry+=5}},
 masonry:{n:'Masonry',ph:1,cost:{wood:200,stone:200},tm:40,ic:'brick',d:'Buildings +20% health.',fx:m=>{m.bhp+=.2}},
 conscript:{n:'Conscription',ph:2,cost:{food:500,gold:300},tm:60,ic:'sword',d:'Units train 25% faster.',fx:m=>{m.train+=.25}},
 architecture:{n:'Architecture',ph:2,cost:{wood:400,stone:300},tm:60,ic:'brick',req:'masonry',d:'Buildings +20% more health.',fx:m=>{m.bhp+=.2}},
 gather:{n:'Wicker Baskets',ph:0,cost:{food:100,wood:100},tm:20,ic:'wheat',d:'Berries and hunting +25%.',fx:m=>{m.rate.berry+=.25;m.rate.hunt+=.25}},
 collar:{n:'Horse Collar',ph:0,cost:{food:200,wood:100},tm:30,ic:'wheat',d:'Fields +20%.',fx:m=>{m.rate.farm+=.2}},
 plow:{n:'Heavy Plow',ph:1,cost:{food:300,wood:200},tm:40,ic:'wheat',req:'collar',d:'Fields +25%.',fx:m=>{m.rate.farm+=.25}},
 axe:{n:'Double-Bit Axe',ph:0,cost:{food:150,wood:100},tm:25,ic:'axe',d:'Wood +25%.',fx:m=>{m.rate.wood+=.25}},
 saw:{n:'Bow Saw',ph:1,cost:{food:300,wood:200},tm:40,ic:'axe',req:'axe',d:'Wood +25%.',fx:m=>{m.rate.wood+=.25}},
 stonem:{n:'Stone Mining',ph:0,cost:{food:150,wood:100},tm:25,ic:'picks',d:'Stone +25%.',fx:m=>{m.rate.stone+=.25}},
 goldm:{n:'Gold Mining',ph:0,cost:{food:150,wood:100},tm:25,ic:'pickg',d:'Gold +25%.',fx:m=>{m.rate.gold+=.25}},
 goldm2:{n:'Shaft Mining',ph:1,cost:{food:300,wood:200},tm:40,ic:'pickg',req:'goldm',d:'Gold and stone +25%.',fx:m=>{m.rate.gold+=.25;m.rate.stone+=.25}},
 nets:{n:'Fishing Nets',ph:0,cost:{food:100,wood:150},tm:25,ic:'wheat',d:'Fishing +30%.',fx:m=>{m.rate.fish+=.3}},
 shipwright:{n:'Shipwright',ph:1,cost:{wood:300,gold:100},tm:40,ic:'wheel',d:'Ships +25% health and +1 armor.',fx:m=>{m.hp.shp+=.25;m.armT.shp+=1}},
 forge:{n:'Forging',ph:1,cost:{food:200,gold:100},tm:30,ic:'sword',d:'Melee units +1 attack.',fx:m=>{m.atk.m+=1}},
 iron:{n:'Iron Casting',ph:2,cost:{food:300,gold:200},tm:45,ic:'sword',req:'forge',d:'Melee units +2 attack.',fx:m=>{m.atk.m+=2}},
 fletch:{n:'Fletching',ph:1,cost:{food:200,gold:100},tm:30,ic:'arrow',d:'Archers, towers and ships +1 attack, +1 range.',fx:m=>{m.atk.p+=1;m.rng+=1}},
 bodkin:{n:'Bodkin Arrow',ph:2,cost:{food:300,gold:200},tm:45,ic:'arrow',req:'fletch',d:'Ranged +2 attack.',fx:m=>{m.atk.p+=2}},
 scale:{n:'Scale Armor',ph:1,cost:{food:200,gold:100},tm:30,ic:'shield',d:'Soldiers +1/+1 armor.',fx:m=>{m.arm[0]++;m.arm[1]++}},
 chain:{n:'Chain Mail',ph:2,cost:{food:300,gold:200},tm:45,ic:'shield',req:'scale',d:'Soldiers +2/+2 armor.',fx:m=>{m.arm[0]+=2;m.arm[1]+=2}},
 barding:{n:'Horse Barding',ph:2,cost:{food:300,gold:250},tm:45,ic:'shield',d:'Cavalry +25% health.',fx:m=>{m.hp.cav+=.25}},
 caravan:{n:'Caravan',ph:1,cost:{food:200,gold:150},tm:30,ic:'wheel',d:'Trade carts +25% gold and faster.',fx:m=>{m.trade+=.25;m.spd.trd+=.25}},
 guilds:{n:'Guilds',ph:2,cost:{food:300,gold:200},tm:40,ic:'brick',d:'Better barter prices.',fx:m=>{m.barter*=.5}},
 royal:{n:'Royal Treasury',ph:3,cost:{food:600,gold:600},tm:60,ic:'pickg',d:'Units cost 10% less and train 15% faster.',fx:m=>{m.train+=.15;m.cost.all=(m.cost.all||1)*.9}},
 hoardings:{n:'Hoardings',ph:3,cost:{wood:500,stone:400},tm:60,ic:'brick',req:'architecture',d:'Buildings +25% health. Towers and castles shoot 1 more arrow.',fx:m=>{m.bhp+=.25;m.towerArr+=1}},
 plate:{n:'Plate Armor',ph:3,cost:{food:400,gold:350},tm:60,ic:'shield',req:'chain',d:'Soldiers +2/+3 armor.',fx:m=>{m.arm[0]+=2;m.arm[1]+=3}},
 blast:{n:'Blast Furnace',ph:3,cost:{food:400,gold:300},tm:60,ic:'sword',req:'iron',d:'Melee units +2 attack.',fx:m=>{m.atk.m+=2}},
 bracer:{n:'Bracer',ph:3,cost:{food:400,gold:300},tm:60,ic:'arrow',req:'bodkin',d:'Ranged +1 attack and +1 range.',fx:m=>{m.atk.p+=1;m.rng+=1}},
 crop:{n:'Crop Rotation',ph:3,cost:{food:400,wood:300},tm:50,ic:'wheat',req:'plow',d:'Fields +25%.',fx:m=>{m.rate.farm+=.25}},
 twoman:{n:'Two-Man Saw',ph:3,cost:{food:400,wood:300},tm:50,ic:'axe',req:'saw',d:'Wood +25%.',fx:m=>{m.rate.wood+=.25}},
 deepmine:{n:'Deep Mining',ph:3,cost:{food:400,wood:300},tm:50,ic:'picks',req:'goldm2',d:'Gold and stone +25%.',fx:m=>{m.rate.gold+=.25;m.rate.stone+=.25}},
 banking:{n:'Banking',ph:3,cost:{food:400,gold:300},tm:50,ic:'wheel',req:'caravan',d:'Trade carts +30% gold.',fx:m=>{m.trade+=.3}},
 spikes:{n:'Spiked Palisades',ph:1,cost:{wood:250,gold:50},tm:30,ic:'shield',d:'Enemies right next to your walls, palisades and gates take damage over time.',fx:m=>{m.spikes=1}},
 boil:{n:'Boiling Oil',ph:1,cost:{wood:200,gold:200},tm:40,ic:'shield',d:'Towers, castles and gates scald enemies right next to them.',fx:m=>{m.boil=1}},
 murder:{n:'Murder Holes',ph:2,cost:{stone:200,gold:200},tm:45,ic:'arrow',d:'Towers and castles shoot 1 more arrow and reach 2 tiles farther.',fx:m=>{m.towerArr+=1;m.towerRng=(m.towerRng||0)+2}},
 herbal:{n:'Herbal Medicine',ph:1,cost:{gold:200},tm:30,ic:'wheat',d:'Monks and buildings heal 50% faster.',fx:m=>{m.heal+=.5}}
};
const RATE={berry:.55,farm:.45,wood:.6,gold:.45,stone:.45,hunt:1.2,fish:.6};
const RT={wood:1,gold:2,stone:3,food:4,fish:5},RTN=['','wood','gold','stone','food','food'];
const RAMT=[0,200,500,400,200,400];
const newMods=()=>({vhp:0,varm:[0,0],vspd:0,carry:10,bhp:1,build:1,train:1,rate:{berry:0,farm:0,wood:0,gold:0,stone:0,hunt:0,fish:0},atk:{m:0,p:0},rng:0,arcRng:0,arm:[0,0],armT:{shp:0},
 hp:{cav:0,shp:0},spd:{inf:0,cav:0,trd:0},citGather:0,cost:{},shipCost:1,techCost:1,trade:1,barter:1,heal:1,towerArr:0,infRate:1,extraVil:0});

/* ---------- state ---------- */
let ter,resT,resA,block,occ,explored,vis,terr,treeK,gS,par,seen,closed;
function alloc(w,h){W=w;H=h;N=w*h;ter=new Uint8Array(N);resT=new Uint8Array(N);resA=new Float32Array(N);block=new Uint8Array(N);occ=new Int32Array(N);explored=new Uint8Array(N);vis=new Uint8Array(N);terr=new Uint8Array(N);treeK=new Uint8Array(N);
 gS=new Float32Array(N);par=new Int32Array(N);seen=new Int32Array(N);closed=new Int32Array(N);fogCv.width=W;fogCv.height=H;fogImg=fogCtx.createImageData(W,H)}
let S=null,P=[],units=[],blds=[],animals=[],ents=new Map(),projs=[],fx=[],rubble=[];
let sel=[],placing=null,running=false,paused=false,boxMode=false,cmdMode=null;
const cam={x:0,y:0,z:1};
const groundCv=document.createElement('canvas'),fogCv=document.createElement('canvas');const fogCtx=fogCv.getContext('2d');let fogImg=null;

/* ---------- helpers ---------- */
const costOf=(p,c,kind,key)=>{const o={};let f=1;if(kind==='u'){const d=U[key];f=(p.m.cost[key]||1)*(p.m.cost.all||1);if(d.tag==='shp')f*=p.m.shipCost}else if(kind==='t')f=p.m.techCost;for(const r in c)o[r]=Math.round(c[r]*f);return o};
const afford=(p,c)=>R4.every(r=>(p.res[r]||0)>=(c[r]||0));
const pay=(p,c)=>{for(const r in c)p.res[r]-=c[r]};
const refund=(p,c,f=1)=>{for(const r in c)p.res[r]+=Math.floor(c[r]*f)};
const ec=e=>e.k==='b'?{x:e.x+e.w/2,y:e.y+e.h/2}:{x:e.x,y:e.y};
function rectDist(px,py,x,y,w,h){const dx=Math.max(x-px,0,px-(x+w)),dy=Math.max(y-py,0,py-(y+h));return Math.hypot(dx,dy)}
const edist=(u,e)=>e.k==='b'?rectDist(u.x,u.y,e.x,e.y,e.w,e.h):Math.hypot(u.x-e.x,u.y-e.y)-(e.r||.3);
const ud=u=>U[u.type];
const isMil=u=>{const t=ud(u).tag;return t!=='vil'&&t!=='mon'&&t!=='trd'&&t!=='kng'&&!(u.type==='fishboat')&&t!=='ani'};
const canFight=u=>ud(u).atk>0&&u.type!=='fishboat';
const isEnemy=(a,b)=>a!==b&&a>=0&&b>=0&&!(P[a]&&P[b]&&P[a].team!=null&&P[a].team===P[b].team);
const myTeam=o=>o===0||(o>0&&P[o]&&P[0]&&P[o].team!=null&&P[o].team===P[0].team);
const peace=()=>S&&S.t<S.peace;
function rankMul(u){return u.rank===2?1.2:u.rank===1?1.1:1}
function uMaxHp(u){const d=ud(u),m=P[u.o].m;let h=d.hp;if(d.tag==='vil')h+=m.vhp;if(m.hp[d.tag])h*=1+m.hp[d.tag];return Math.round(h*rankMul(u))}
const bMaxHp=b=>Math.round(B[b.type].hp*P[b.o].m.bhp);
const cpMax=b=>Math.round(B[b.type].hp*.5);
function uAtk(u){const d=ud(u),m=P[u.o].m;let a=d.atk+(d.tag==='vil'||d.tag==='sie'?0:m.atk[d.at]);a*=rankMul(u);if(u.aura==='atk')a*=1.2;return a}
function uArm(u,k){const d=ud(u),m=P[u.o].m,i=k==='m'?0:1;let a=d.arm[i];if(d.tag==='vil')a+=m.varm[i];else if(d.tag!=='sie'&&d.tag!=='shp'&&d.tag!=='trd')a+=m.arm[i];if(d.tag==='shp')a+=m.armT.shp;a+=u.rank||0;if(u.aura==='arm')a+=2;return a}
function uRng(u){const d=ud(u),m=P[u.o].m;if(!d.rng)return 0;return d.rng+(d.at==='p'&&d.tag!=='sie'?m.rng:0)+(d.tag==='arc'?m.arcRng:0)}
function uSpd(u){const d=ud(u),m=P[u.o].m;let s=d.spd;if(d.tag==='vil')s*=1+m.vspd;if(m.spd[d.tag])s*=1+m.spd[d.tag];if(u.aura==='spd')s*=1.15;return s}
function uRate(u){const d=ud(u);return d.rate*(d.tag==='inf'?P[u.o].m.infRate:1)}
function gRate(u,k){const p=P[u.o],m=p.m;let r=RATE[k]*(1+(m.rate[k]||0))*seasonRate(k);const d=ud(u);
 if(d.tag==='vil'){}else if(d.cit){r*=(k==='berry'||k==='farm'?.5:.75)*(1+m.citGather)}else if(d.hunter&&k==='hunt')r*=1.6;else if(d.tag==='shp')r*=1;else r*=.5;
 if(u.aura==='gat')r*=1.15;return r*(p.ai?p.ai.bonus:1)}
const canGather=(u,k)=>{const d=ud(u);if(d.tag==='vil')return k!=='fish';if(d.tag==='shp')return u.type==='fishboat'&&k==='fish';if(d.cit)return k!=='fish';if(d.hunter)return k==='hunt';return false};
const canBuild=u=>{const d=ud(u);return d.tag==='vil'||!!d.cit};
function costStr(c){const m={food:'cf',wood:'cw',gold:'cg',stone:'cs2'};return Object.keys(c).map(k=>`<i class="${m[k]}"></i>${c[k]}`).join('')}
function need(p,c){const out=[];for(const r in c){const d=c[r]-(p.res[r]||0);if(d>0)out.push(Math.ceil(d)+' more '+r)}return out.join(' and ')}
const land=i=>ter[i]!==1&&ter[i]!==4;
const pass=(i,o,nav)=>{if(nav)return ter[i]===1&&block[i]===0;if(ter[i]===1||ter[i]===4)return false;const b=block[i];if(b===0)return true;if(b===3){const g=ents.get(occ[i]);return !!g&&g.o===o&&!g.locked}return false};
const passXY=(x,y,o,nav)=>x>=0&&y>=0&&x<W&&y<H&&pass(y*W+x,o,nav);

/* ---------- entities ---------- */
function mkUnit(type,o,x,y){const d=U[type];const u={id:S.nid++,k:'u',type,o,x,y,hp:1,path:null,task:null,carry:0,ct:null,cd:0,face:1,an:0,gar:0,th:Math.random(),rp:0,r:RAD[d.tag]||.3,swing:0,work:0,xp:0,rank:0,stance:d.tag==='sie'||d.tag==='mon'||d.tag==='trd'?'def':'agg',nav:d.nav?1:0,aura:null};
 u.hp=uMaxHp(u);units.push(u);ents.set(u.id,u);P[o].pop++;if(d.hero)P[o].hero=u.id;return u}
function mkAnimal(type,x,y,o=-1){const a={id:S.nid++,k:'a',type,o,x,y,hp:type==='boar'?60:type==='deer'?20:12,food:type==='boar'?300:type==='deer'?150:100,carc:false,face:1,an:0,path:null,cd:0,th:Math.random()*3,r:.32,fl:0,hx:x,hy:y};animals.push(a);ents.set(a.id,a);return a}
let roadM=null,roadDirty=true;function roadSync(){roadDirty=false;if(!roadM||roadM.length!==N)roadM=new Uint8Array(N);else roadM.fill(0);for(const b of blds)if(b.type==='road'&&b.built>=1)roadM[b.y*W+b.x]=1}
function stampB(b,on){const d=B[b.type];if(d.road)roadDirty=true;for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++){const i=y*W+x;occ[i]=on?b.id:0;if(!d.flat)block[i]=on?(d.gate?3:2):0}}
function mkBld(type,o,x,y,done){const d=B[type];const b={id:S.nid++,k:'b',type,o,x,y,w:d.w,h:d.h,hp:1,built:done?1:0,queue:[],rally:null,gar:[],cd:Math.random(),started:0,dmgT:0,cp:0,slots:[],wonderT:0};
 blds.push(b);ents.set(b.id,b);stampB(b,true);b.cp=cpMax(b);if(done){b.hp=bMaxHp(b);onBuilt(b,true)}terrDirty=true;return b}
function calcPop(p){let c=0;for(const b of blds)if(b.o===p.i&&b.built>=1&&B[b.type].pop)c+=B[b.type].pop;p.popCap=Math.min(S.popMax,c);p.pop=units.filter(u=>u.o===p.i).length}
function onBuilt(b,silent){b.built=1;if(B[b.type].road)roadDirty=true;if(B[b.type].wall)P[b.o].st.walls=(P[b.o].st.walls||0)+1;b.hp=Math.max(b.hp,1);calcPop(P[b.o]);terrDirty=true;if(!silent&&b.o===0&&!B[b.type].wall)sfx('built');
 if(b.type==='wonder'){b.wonderT=S.t;if(!silent)toast((b.o===0?'Your':P[b.o].civN+'’s')+' Wonder is complete!'+(S.wonderWin?' Hold it for 10 minutes to win.':''),b.o===0?'good':'bad')}
 if(!silent&&b.o===0&&!B[b.type].wall&&b.type!=='field'&&b.type!=='house')toast(B[b.type].n+' complete')}
function evict(b){if(B[b.type].flat)return;for(const u of units){if(u.gar||u.nav)continue;if(u.x>b.x-.1&&u.x<b.x+b.w+.1&&u.y>b.y-.1&&u.y<b.y+b.h+.1){const p=freeAround(b,u.x,u.y,false);u.x=p.x;u.y=p.y;u.path=null}}}
function freeAround(b,px,py,nav){let best=null,bd=1e9;for(let r=0;r<7&&!best;r++){for(let y=b.y-1-r;y<=b.y+b.h+r;y++)for(let x=b.x-1-r;x<=b.x+b.w+r;x++){if(x>b.x-1-r&&x<b.x+b.w+r&&y>b.y-1-r&&y<b.y+b.h+r)continue;if(!passXY(x,y,b.o,nav))continue;const d=Math.hypot(x+.5-(px??b.x+b.w/2),y+.5-(py??b.y+b.h+1));if(d<bd){bd=d;best={x:x+.5,y:y+.5}}}}
 return best?{x:best.x+(Math.random()-.5)*.3,y:best.y+(Math.random()-.5)*.3}:{x:b.x+b.w/2,y:b.y+b.h+.5}}
function gainXp(u,v){if(!u||u.k!=='u'||!isMil(u)||ud(u).hero)return;u.xp+=v;const r=u.xp>=160?2:u.xp>=60?1:0;if(r>u.rank){const f=u.hp/uMaxHp(u);u.rank=r;u.hp=f*uMaxHp(u);if(u.o===0)fx.push({k:'promo',x:u.x,y:u.y,t:0,life:1.2})}}
function hit(t,d,ao,aid){if(t.dead)return;if(t.k==='a')return hitAnimal(t,d,aid);t.hp-=d;t.dmgT=S.t;const a=aid&&ents.get(aid);if(a)gainXp(a,d*.3);
 if(t.o===0&&ao!==0&&ao>=0)alertAttack(t);
 if(t.k==='u'&&t.hp>0&&a&&a.k==='u'&&canFight(t)&&ud(t).tag!=='sie'&&t.stance!=='pas'&&(!t.task||t.task.auto)&&!(a.nav&&!uRng(t)))t.task={k:'atk',id:aid,auto:1};
 if(t.hp<=0){if(a)gainXp(a,12);kill(t,ao)}}
function kill(e,by,silent){if(e.dead)return;e.dead=true;ents.delete(e.id);
 if(e.k==='u'){units.splice(units.indexOf(e),1);P[e.o].pop--;P[e.o].st.lost++;if(by!=null&&by>=0&&P[by])P[by].st.kills++;if(P[e.o].hero===e.id)P[e.o].hero=0;
  if(e.gar){const b=ents.get(e.gar);if(b)b.gar=b.gar.filter(i=>i!==e.id)}
  fx.push({k:e.nav?'sink':'die',x:e.x,y:e.y,t:0,life:e.nav?2:1.2,c:PCOL[e.o]});if(!silent)sfx('die',e.x,e.y)}
 else if(e.k==='b'){blds.splice(blds.indexOf(e),1);stampB(e,false);ejectAll(e);
  if(!B[e.type].flat){if(!silent)sfx('crash',e.x+e.w/2,e.y+e.h/2);rubble.push({x:e.x,y:e.y,w:e.w,h:e.h,t:0});fx.push({k:'dust',x:e.x+e.w/2,y:e.y+e.h/2,t:0,life:1.4,s:e.w})}
  if(by!=null&&by>=0&&P[by]&&by!==e.o)P[by].st.razed++;if(!silent&&by!==e.o)P[e.o].st.blost=(P[e.o].st.blost||0)+1;
  if(e.o===0&&!silent&&by!==0)toast(B[e.type].n+' destroyed','bad');calcPop(P[e.o]);terrDirty=true}
 const k=sel.indexOf(e.id);if(k>=0){sel.splice(k,1);panelDirty=true}}
function ejectAll(b){for(const id of b.gar){const u=ents.get(id);if(u){u.gar=0;const p=freeAround(b,null,null,u.nav);u.x=p.x;u.y=p.y;u.path=null}}b.gar=[]}
function dmgTo(atk,at,bon,t){
 if(t.k==='b'){let d=at==='m'?Math.max(1,atk*.5):atk*.12;if(bon&&bon.bld)d+=bon.bld;return d}
 if(t.k==='a')return atk;
 let d=Math.max(1,atk-uArm(t,at));if(bon){const tg=ud(t).tag;if(bon[tg])d+=bon[tg];if(bon.inf&&tg==='her'&&0)d+=bon.inf}return d}
function shoot(x,y,t,d,o,aid,kind,splash){sfx(kind==='rock'?'sling':'bow',x,y);const c=ec(t);const dist=Math.hypot(c.x-x,c.y-y);projs.push({x0:x,y0:y,tid:t.id,tx:c.x,ty:c.y,d,o,aid,kind,t:0,dur:Math.max(.12,dist/(kind==='rock'?7:12)),splash})}

/* ---------- pathfinding (land and water) ---------- */
let stampN=1;const hp_=[],hf_=[];
function hpush(i,f){hp_.push(i);hf_.push(f);let k=hp_.length-1;while(k>0){const p=(k-1)>>1;if(hf_[p]<=hf_[k])break;let t=hp_[p];hp_[p]=hp_[k];hp_[k]=t;t=hf_[p];hf_[p]=hf_[k];hf_[k]=t;k=p}}
function hpop(){const top=hp_[0];const li=hp_.pop(),lf=hf_.pop();if(hp_.length){hp_[0]=li;hf_[0]=lf;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<hp_.length&&hf_[l]<hf_[m])m=l;if(r<hp_.length&&hf_[r]<hf_[m])m=r;if(m===k)break;let t=hp_[m];hp_[m]=hp_[k];hp_[k]=t;t=hf_[m];hf_[m]=hf_[k];hf_[k]=t;k=m}}return top}
let pathBudget=0;const PB_MAX=14000;function pathBusy(u){if(pathBudget>PB_MAX){u.rp=.05+Math.random()*.15;return true}return false}
function findPath(o,nav,sx,sy,gx0,gy0,gx1,gy1,adj){
 stampN++;hp_.length=0;hf_.length=0;sx=clamp(sx|0,0,W-1);sy=clamp(sy|0,0,H-1);const s=sy*W+sx;
 const hh=(x,y)=>{const dx=Math.max(gx0-x,0,x-gx1),dy=Math.max(gy0-y,0,y-gy1);return Math.max(dx,dy)+.414*Math.min(dx,dy)};
 gS[s]=0;seen[s]=stampN;par[s]=-1;hpush(s,hh(sx,sy)*1.05);let best=s,bestH=hh(sx,sy),found=-1,it=0;const cap=Math.min(N,26000,1500+hh(sx,sy)*140);
 while(hp_.length&&it++<cap){const c=hpop();if(closed[c]===stampN)continue;closed[c]=stampN;const cx=c%W,cy=(c/W)|0;
  const inG=adj?(cx>=gx0-1&&cx<=gx1+1&&cy>=gy0-1&&cy<=gy1+1):(cx>=gx0&&cx<=gx1&&cy>=gy0&&cy<=gy1);
  if(inG&&(pass(c,o,nav)||(c===s&&adj))){found=c;break}
  const h0=hh(cx,cy);if(h0<bestH){bestH=h0;best=c}
  for(let k=0;k<8;k++){const dx=DX[k],dy=DY[k],nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const ni=ny*W+nx;if(closed[ni]===stampN||!pass(ni,o,nav))continue;
   if(dx&&dy&&(!pass(cy*W+nx,o,nav)||!pass(ny*W+cx,o,nav)))continue;
   const g=gS[c]+(dx&&dy?1.414:1)*(!nav&&roadM&&roadM[ni]?.7:1);if(seen[ni]!==stampN||g<gS[ni]){seen[ni]=stampN;gS[ni]=g;par[ni]=c;hpush(ni,g+hh(nx,ny)*1.05)}}}
 pathBudget+=it;
 const end=found>=0?found:best;const pts=[];let c=end;while(c!==-1&&c!==s){pts.push({x:c%W+.5,y:((c/W)|0)+.5});c=par[c]}pts.reverse();
 return{pts,partial:found<0}}
function losOk(o,nav,x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/.25);const q=nav?.4:.28;for(let k=1;k<n;k++){const t=k/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t;
 if(!passXY(Math.floor(x+q),Math.floor(y+q),o,nav)||!passXY(Math.floor(x-q),Math.floor(y+q),o,nav)||!passXY(Math.floor(x+q),Math.floor(y-q),o,nav)||!passXY(Math.floor(x-q),Math.floor(y-q),o,nav))return false}return true}
function smooth(o,nav,x,y,pts){if(pts.length<2)return pts;const out=[];let cx=x,cy=y,i=0;while(i<pts.length){let j=Math.min(pts.length-1,i+14);for(;j>i;j--)if(losOk(o,nav,cx,cy,pts[j].x,pts[j].y))break;out.push(pts[j]);cx=pts[j].x;cy=pts[j].y;i=j+1}return out}
function pathRect(u,x0,y0,x1,y1,adj){const r=findPath(u.o,u.nav,u.x,u.y,x0,y0,x1,y1,adj);u.path=smooth(u.o,u.nav,u.x,u.y,r.pts);u.partial=r.partial;
 if(!u.path.length&&!r.partial){const cx=Math.floor(u.x)+.5,cy=Math.floor(u.y)+.5;if(Math.hypot(cx-u.x,cy-u.y)>.05)u.path=[{x:cx,y:cy}]}}
function goPoint(u,x,y){const tx=clamp(x|0,0,W-1),ty=clamp(y|0,0,H-1);if(passXY(tx,ty,u.o,u.nav)){pathRect(u,tx,ty,tx,ty,false);if(!u.partial){if(u.path.length)u.path[u.path.length-1]={x,y};else u.path=[{x,y}]}}else pathRect(u,tx,ty,tx,ty,true)}
function pathToEnt(u,e){if(e.k!=='b'){const tx=e.x|0,ty=e.y|0;pathRect(u,tx,ty,tx,ty,true);if(!u.partial)u.path.push({x:e.x,y:e.y})}else pathRect(u,e.x,e.y,e.x+e.w-1,e.y+e.h-1,true)}
function step(u,dt){if(!u.path||!u.path.length)return true;const p=u.path[0];const _gs=u.task&&u.task.gs;const dx=p.x-u.x,dy=p.y-u.y,d=Math.hypot(dx,dy),s=(_gs?Math.min(uSpd(u),_gs):uSpd(u))*(!u.nav&&roadM&&roadM[(u.y|0)*W+(u.x|0)]?1.35:1)*dt;
 if(Math.abs(dx)>.04)u.face=dx<0?-1:1;u.an+=dt*uSpd(u)*5;u.mv=1;
 if(d<=s){u.x=p.x;u.y=p.y;u.path.shift();return !u.path.length}
 const nx=u.x+dx/d*s,ny=u.y+dy/d*s;
 if(!passXY(Math.floor(nx),Math.floor(ny),u.o,u.nav)&&passXY(Math.floor(u.x),Math.floor(u.y),u.o,u.nav)){u.path=null;return false}
 u.x=nx;u.y=ny;return false}

/* ---------- resources ---------- */
function hasOpen(i,nav){const x=i%W,y=(i/W)|0;for(let k=0;k<8;k++){const nx=x+DX[k],ny=y+DY[k];if(nx>=0&&ny>=0&&nx<W&&ny<H){const j=ny*W+nx;if(block[j]===0&&(nav?ter[j]===1:ter[j]!==1&&ter[j]!==4))return true}}return false}
function nearestRes(rt,x,y,maxR,human,nav){x|=0;y|=0;let best=-1,bd=1e9;for(let r=0;r<=maxR;r++){if(best>=0&&r>bd+1.5)break;
 for(let yy=y-r;yy<=y+r;yy++){if(yy<0||yy>=H)continue;const edge=Math.abs(yy-y)===r;for(let xx=x-r;xx<=x+r;xx+=(edge?1:2*r||1)){if(xx<0||xx>=W)continue;const i=yy*W+xx;
  if(resT[i]!==rt||resA[i]<=0)continue;if(human&&!explored[i])continue;if(!hasOpen(i,nav))continue;const d=Math.hypot(xx-x,yy-y);if(d<bd){bd=d;best=i}}}}return best}
function deplete(i){resT[i]=0;resA[i]=0;if(block[i]===1)block[i]=0}
function nearestDrop(o,res,x,y,nav){let best=null,bd=1e9;for(const b of blds){if(b.o!==o||b.built<1)continue;if(nav&&b.type!=='dock')continue;const d0=B[b.type].drop;if(!d0||d0.indexOf(res)<0)continue;const d=rectDist(x,y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}return best}
function freeField(o,x,y,maxD=60){let best=null,bd=maxD;for(const b of blds){if(b.o!==o||b.type!=='field')continue;b.slots=b.slots.filter(id=>{const w=ents.get(id);return w&&w.task&&w.task.k==='field'&&w.task.id===b.id});if(b.slots.length>=5)continue;const d=rectDist(x,y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}return best}
function nearestHunt(u,x,y,r){let best=null,bd=r;for(const a of animals){if(a.dead||a.food<=0)continue;if(a.o>=0&&a.o!==u.o)continue;const d=Math.hypot(a.x-x,a.y-y);if(d<bd){bd=d;best=a}}return best}
function autoGather(u,types,near){let best=-1,bd=1e9,bt=null;const c=ec(near);for(const t of types){if(t==='hunt')continue;const i=nearestRes(RT[t],c.x,c.y,10,u.o===0,false);if(i>=0){const d=Math.hypot(i%W-c.x,((i/W)|0)-c.y);if(d<bd){bd=d;best=i;bt=t}}}
 if(best<0)return false;u.task={k:'gather',rt:bt,tx:best%W,ty:(best/W)|0};return true}

/* ---------- animals ---------- */
function hitAnimal(a,d,aid){if(a.carc||a.dead)return;a.hp-=d;const at=aid&&ents.get(aid);
 if(a.type==='deer'||a.type==='sheep'){a.fl=3;if(at){const dx=a.x-at.x,dy=a.y-at.y,l=Math.hypot(dx,dy)||1;a.fx=dx/l;a.fy=dy/l}}
 if(a.type==='boar'&&at)a.tgt=at.id;
 if(a.hp<=0){a.carc=true;a.path=null;a.tgt=0}}
function updAnimal(a,dt){if(a.carc||a.dead)return;a.mv=0;if(a.cd>0)a.cd-=dt;
 const spd=a.type==='deer'?(a.fl>0?2.6:.6):a.type==='boar'?(a.tgt?1.8:.5):.5;
 if(a.type==='boar'&&a.tgt){const t=ents.get(a.tgt);if(!t||t.dead||t.gar||Math.hypot(t.x-a.x,t.y-a.y)>9){a.tgt=0}else{const d=Math.hypot(t.x-a.x,t.y-a.y);if(d<.75){if(a.cd<=0){a.cd=1.5;hit(t,Math.max(1,6-uArm(t,'m')),-1,0)}a.face=t.x<a.x?-1:1;return}a.dx=(t.x-a.x)/d;a.dy=(t.y-a.y)/d}}
 else if(a.fl>0){a.fl-=dt;a.dx=a.fx||1;a.dy=a.fy||0}
 else{a.th-=dt;if(a.th<=0){a.th=2+Math.random()*4;if(Math.random()<.55){a.dx=0;a.dy=0}else{let ang=Math.random()*Math.PI*2;if(Math.hypot(a.x-a.hx,a.y-a.hy)>4)ang=Math.atan2(a.hy-a.y,a.hx-a.x);a.dx=Math.cos(ang);a.dy=Math.sin(ang)}}}
 if(!a.dx&&!a.dy)return;const nx=a.x+a.dx*spd*dt,ny=a.y+a.dy*spd*dt;
 if(passXY(Math.floor(nx),Math.floor(ny),-1,false)){a.x=nx;a.y=ny;a.mv=1;a.an+=dt*spd*5;if(Math.abs(a.dx)>.1)a.face=a.dx<0?-1:1}else{a.dx=-a.dx+(Math.random()-.5);a.dy=-a.dy+(Math.random()-.5);const l=Math.hypot(a.dx,a.dy)||1;a.dx/=l;a.dy/=l;a.fx=a.dx;a.fy=a.dy}}

/* ---------- targeting ---------- */
function canHitTarget(u,e){if(e.k==='u'&&e.nav&&!uRng(u)&&!u.nav)return false;if(u.nav&&e.k==='u'&&!e.nav&&!uRng(u))return false;return true}
function nearestEnemy(u,r,withBld){if(peace())return null;let best=null,bd=r;for(const e of units){if(!isEnemy(u.o,e.o)||e.gar)continue;if(!canHitTarget(u,e))continue;const dx=e.x-u.x;if(dx>bd||dx<-bd)continue;const d=Math.hypot(dx,e.y-u.y);if(d<bd){bd=d;best=e}}if(best)return best;
 if(!withBld)return null;for(const b of blds){if(!isEnemy(u.o,b.o)||B[b.type].flat||B[b.type].wall)continue;const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}return best}
function nearestEnemyBld(u,r){let best=null,bd=r;for(const b of blds){if(!isEnemy(u.o,b.o)||B[b.type].flat)continue;const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}return best}
const capturer=u=>{const t=ud(u).tag;return (t==='inf'||t==='cav')&&!uRng(u)};
const capturable=b=>!B[b.type].nocap&&b.built>=1;
function convert(b,no){const old=b.o;for(const q of b.queue){}b.queue=[];ejectAll(b);b.slots=[];b.rally=null;b.o=no;b.cp=Math.round(cpMax(b)*.3);b.hp=Math.min(b.hp,bMaxHp(b));
 P[no].st.captured=(P[no].st.captured||0)+1;calcPop(P[old]);calcPop(P[no]);terrDirty=true;
 if(old===0)toast('Your '+B[b.type].n.toLowerCase()+' was captured!','bad',ec(b));else if(no===0)toast(B[b.type].n+' captured!','good');
 if(b.type==='wonder')b.wonderT=S.t;const k=sel.indexOf(b.id);if(k>=0)panelDirty=true}

/* ---------- unit behaviour ---------- */
function updUnit(u,dt){
 if(u.gar)return;if(u.cd>0)u.cd-=dt;if(u.rp>0)u.rp-=dt;if(u.swing>0)u.swing-=dt;u.mv=0;
 if(ud(u).regen&&u.hp<uMaxHp(u))u.hp=Math.min(uMaxHp(u),u.hp+ud(u).regen*dt);
 if(u.aura==='heal'&&u.hp<uMaxHp(u))u.hp=Math.min(uMaxHp(u),u.hp+dt);
 const t=u.task;
 if(!t){if(u.path&&u.path.length){step(u,dt);return}idleThink(u,dt);return}
 switch(t.k){
 case 'move':{if(!u.path||!u.path.length){const d=Math.hypot(t.x-u.x,t.y-u.y);if(d<.35||(t.n||0)>3){u.task=null;u.path=null;u.home={x:u.x,y:u.y};return}if(u.rp>0||pathBusy(u))return;t.n=(t.n||0)+1;u.rp=.4;goPoint(u,t.x,t.y);if(!u.path.length){u.task=null}return}
  step(u,dt);return}
 case 'patrol':{u.th-=dt;if(u.th<=0){u.th=.4;const e=nearestEnemy(u,ud(u).los+.5,true);if(e){u.task={k:'atk',id:e.id,auto:1,resume:t};u.path=null;return}}
  if(!u.path||!u.path.length){const tx=t.leg?t.bx:t.ax,ty=t.leg?t.by:t.ay;const d=Math.hypot(tx-u.x,ty-u.y);if(d<.8||(t.n||0)>3){t.leg=t.leg?0:1;t.n=0;u.rp=Math.max(u.rp,.3);return}if(u.rp>0||pathBusy(u))return;t.n=(t.n||0)+1;u.rp=.4;goPoint(u,tx,ty);return}step(u,dt);return}
 case 'amove':{u.th-=dt;if(u.th<=0){u.th=.4;const e=nearestEnemy(u,ud(u).los+.5,true);if(e){u.task={k:'atk',id:e.id,auto:1,resume:t};u.path=null;return}}
  if(!u.path||!u.path.length){const d=Math.hypot(t.x-u.x,t.y-u.y);if(d<.6||(t.n||0)>3){u.task=null;u.home={x:u.x,y:u.y};return}if(u.rp>0||pathBusy(u))return;t.n=(t.n||0)+1;u.rp=.4;goPoint(u,t.x,t.y);return}step(u,dt);return}
 case 'atk':return doAttack(u,t,dt);
 case 'gather':return doGather(u,t,dt);
 case 'hunt':return doHunt(u,t,dt);
 case 'field':return doField(u,t,dt);
 case 'build':return doBuild(u,t,dt);
 case 'heal':{const e=ents.get(t.id);if(!e||e.dead||e.gar||e.hp>=uMaxHp(e)||e.o!==u.o){u.task=null;u.path=null;return}
  const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<=4){u.path=null;u.work=1;u.an+=dt*3;u.face=e.x<u.x?-1:1;e.hp=Math.min(uMaxHp(e),e.hp+ud(u).heal*P[u.o].m.heal*dt);if(Math.random()<dt*2)fx.push({k:'heal',x:e.x,y:e.y,t:0,life:.8});return}
  if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.6;pathToEnt(u,e)}step(u,dt);return}
 case 'gar':{const b=ents.get(t.id);if(!b||b.dead||b.o!==u.o||b.gar.length>=(B[b.type].gar||0)||b.built<1){u.task=t.prev||null;return}
  if(rectDist(u.x,u.y,b.x,b.y,b.w,b.h)<=.85){u.gar=b.id;b.gar.push(u.id);u.path=null;u.task=t.prev||null;const k=sel.indexOf(u.id);if(k>=0){sel.splice(k,1);panelDirty=true}return}
  if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.4;pathRect(u,b.x,b.y,b.x+b.w-1,b.y+b.h-1,true);if(u.partial&&!u.path.length){u.task=null;return}}step(u,dt);return}
 case 'trade':return doTrade(u,t,dt);
 case 'relic':return doRelic(u,t,dt);
 default:u.task=null}}
function idleThink(u,dt){const d=ud(u);u.th-=dt;if(u.th>0)return;u.th=.5+Math.random()*.3;
 if(d.tag==='mon'){let best=null,bd=d.los;for(const e of units){if(e.o!==u.o||e.gar||e===u||e.hp>=uMaxHp(e)||ud(e).tag==='shp'||ud(e).tag==='sie')continue;const dd=Math.hypot(e.x-u.x,e.y-u.y);if(dd<bd){bd=dd;best=e}}if(best)u.task={k:'heal',id:best.id};return}
 if(!canFight(u)||u.stance==='pas'||!isMil(u))return;
 const r=u.stance==='hold'?uRng(u)+(uRng(u)?.5:1):d.los+.5;const e=nearestEnemy(u,r,d.tag==='sie'||(capturer(u)&&u.stance==='agg'));
 if(e){if(!u.home)u.home={x:u.x,y:u.y};u.task={k:'atk',id:e.id,auto:1}}
 else if(u.stance==='def'&&u.home&&Math.hypot(u.home.x-u.x,u.home.y-u.y)>1.5){u.task={k:'move',x:u.home.x,y:u.home.y}}}
function doAttack(u,t,dt){const e=ents.get(t.id);
 const done=()=>{u.path=null;u.task=null;if(t.after&&ents.has(t.after)){u.task={k:'atk',id:t.after,wave:t.wave};return}
  if(t.resume){u.task=t.resume;t.resume.n=0;return}
  if(t.auto||t.wave){const n=nearestEnemy(u,ud(u).los+2,!!t.wave||ud(u).tag==='sie');if(n){u.task={k:'atk',id:n.id,auto:1,wave:t.wave};return}}
  if(u.stance==='def'&&u.home)u.task={k:'move',x:u.home.x,y:u.home.y}};
 if(!e||e.dead||(e.k==='u'&&e.gar)||(e.k!=='a'&&!isEnemy(u.o,e.o))||(e.k==='a'&&e.carc)){return done()}
 if(peace()&&e.k!=='a'){u.task=null;u.path=null;return}
 if(!canHitTarget(u,e))return done();
 const rng=uRng(u),d=edist(u,e),reach=(rng>0?rng:.35)+u.r*.8;const D=ud(u);
 if(d<=reach){u.path=null;const c=ec(e);u.face=c.x<u.x?-1:1;
  if(u.cd<=0){u.cd=uRate(u);u.swing=.3;
   if(e.k==='b'&&capturer(u)&&capturable(e)&&!t.dmg){const cap=Math.max(.6,2.6*rankMul(u)*(u.aura==='atk'?1.2:1)-e.gar.length*.35)*uRate(u);e.cp-=cap;e.capT=S.t;e.capBy=u.o;if(e.o===0)alertAttack(e);gainXp(u,1.5);if(e.cp<=0)convert(e,u.o);return}
   const dm=dmgTo(uAtk(u),D.at,D.bon,e);
   if(rng>0){const k=D.multi||1;for(let i=0;i<k;i++)shoot(u.x,u.y-.35,e,dm,u.o,u.id,u.type==='treb'||u.type==='mangonel'?'rock':u.type==='jinete'?'jav':'arrow',D.splash)}else{hit(e,dm,u.o,u.id);sfx(e.k==='b'?'thud':'clang',u.x,u.y)}}return}
 if(u.stance==='hold'){if(t.auto){u.task=null}return}
 const leash=u.stance==='def'&&u.home?Math.hypot(u.x-u.home.x,u.y-u.home.y)>7:false;
 if((t.auto&&d>D.los+6)||leash)return done();
 t.rt=(t.rt||0)-dt;
 if(!u.path||!u.path.length||(t.rt<=0&&e.k!=='b')){if(u.rp<=0&&!pathBusy(u)){pathToEnt(u,e);u.rp=.5+Math.random()*.5;t.rt=1.2+Math.random()*.4+Math.min(4,d*.06);
   if(u.partial&&u.path.length<2){const w=nearestEnemyBld(u,2.6);if(w&&w!==e&&!u.nav){u.task={k:'atk',id:w.id,after:t.id,wave:t.wave,dmg:1};return}
    if(!u.path.length){t.stuck=(t.stuck||0)+1;if(t.stuck>4){u.task=null;return}}}}}
 step(u,dt)}
function doGather(u,t,dt){if(t.ph==='ret')return doReturn(u,t,dt);
 const rt=RT[t.rt];let i=t.ty*W+t.tx;
 if(resT[i]!==rt||resA[i]<=0){const n=nearestRes(rt,t.tx,t.ty,9,false,u.nav);if(n<0){if(u.carry>0&&u.ct===RTN[rt]){t.ph='ret';t.end=1;return}u.task=null;return}t.tx=n%W;t.ty=(n/W)|0;i=n;u.path=null}
 if(rectDist(u.x,u.y,t.tx,t.ty,1,1)<=(u.nav?1.1:.8)){u.path=null;u.face=t.tx+.5<u.x?-1:1;const ctn=RTN[rt];if(u.ct!==ctn){u.carry=0;u.ct=ctn}
  const kind=rt===4?'berry':rt===5?'fish':t.rt;const a=Math.min(gRate(u,kind)*dt,resA[i]);u.carry+=a;resA[i]-=a;u.work=1;u.an+=dt*7;
  if(resA[i]<=.001)deplete(i);
  const cap=P[u.o].m.carry*(u.nav?2:1);if(u.carry>=cap){u.carry=cap;t.ph='ret';u.path=null}return}
 if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.4;pathRect(u,t.tx,t.ty,t.tx,t.ty,true);
  if(u.partial&&u.path.length<1){t.bad=(t.bad||0)+1;if(t.bad>3){const n=nearestRes(rt,u.x,u.y,10,false,u.nav);if(n>=0&&n!==i){t.tx=n%W;t.ty=(n/W)|0;t.bad=0}else u.task=null}}}
 step(u,dt)}
function doReturn(u,t,dt){let b=t.drop&&ents.get(t.drop);
 if(!b||b.dead||b.built<1||b.o!==u.o){b=nearestDrop(u.o,u.ct||'food',u.x,u.y,u.nav);t.drop=b?b.id:0;u.path=null;
  if(!b){if(u.o===0)toastOnce('drop'+u.ct,u.nav?'Build a Dock so boats can drop off fish':`Build a ${u.ct==='food'?'Farmstead':'Storehouse'} near your workers to drop off ${u.ct}`);u.task=null;return}}
 if(rectDist(u.x,u.y,b.x,b.y,b.w,b.h)<=(u.nav?1.15:.85)){if(u.ct){P[u.o].res[u.ct]+=u.carry;P[u.o].st.gath+=u.carry}u.carry=0;t.ph=null;t.drop=0;u.path=null;
  if(t.end||(t.k==='hunt'&&!ents.has(t.id))||(t.k==='field'&&!ents.has(t.id)))u.task=null;return}
 if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.4;pathRect(u,b.x,b.y,b.x+b.w-1,b.y+b.h-1,true);if(u.partial&&!u.path.length){t.drop=0}}
 step(u,dt)}
function doHunt(u,t,dt){if(t.ph==='ret')return doReturn(u,t,dt);const a=ents.get(t.id);
 if(!a||a.dead||a.food<=0){if(u.carry>0){t.ph='ret';t.end=1;return}const n=nearestHunt(u,u.x,u.y,10);if(n){t.id=n.id;return}u.task=null;return}
 const d=Math.hypot(a.x-u.x,a.y-u.y);
 if(!a.carc){const rng=uRng(u);if(d<=(rng>0?rng:.75)){u.path=null;u.face=a.x<u.x?-1:1;if(u.cd<=0){u.cd=Math.max(1,uRate(u)*.8);u.swing=.3;const dm=Math.max(4,uAtk(u));if(rng>0)shoot(u.x,u.y-.35,a,dm,u.o,u.id,'arrow');else hitAnimal(a,dm,u.id)}return}
  if(!u.path||!u.path.length||u.rp<=0){if(u.rp<=0&&!pathBusy(u)){u.rp=.5;goPoint(u,a.x,a.y)}}step(u,dt);return}
 if(d<=.8){u.path=null;u.face=a.x<u.x?-1:1;if(u.ct!=='food'){u.carry=0;u.ct='food'}const am=Math.min(gRate(u,'hunt')*dt,a.food);u.carry+=am;a.food-=am;u.work=1;u.an+=dt*7;
  if(a.food<=.01){a.dead=true;ents.delete(a.id);animals.splice(animals.indexOf(a),1)}
  if(u.carry>=P[u.o].m.carry*(ud(u).hunter?2:1)||a.dead){t.ph='ret';u.path=null}return}
 if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.4;goPoint(u,a.x,a.y)}step(u,dt)}
function doField(u,t,dt){if(t.ph==='ret')return doReturn(u,t,dt);const f=ents.get(t.id);
 if(!f||f.dead||f.o!==u.o){u.task=null;return}
 if(f.built<1){u.task={k:'build',id:f.id,q:[],thenField:1};return}
 f.slots=f.slots.filter(id=>{const w=ents.get(id);return w&&w.task&&w.task.k==='field'&&w.task.id===f.id});
 const isC=f.type==='corral';if(f.slots.indexOf(u.id)<0){if(f.slots.length>=(isC?3:5)){if(isC){u.task=null;return}const g=freeField(u.o,u.x,u.y,20);if(g&&g!==f){t.id=g.id;t.px=0;return}u.task=null;return}f.slots.push(u.id)}
 if(!t.px){const k=f.slots.indexOf(u.id);const sp=isC?[[-.45,.7],[2.45,1.2],[1,2.45]][k%3]:[[.6,.6],[2.4,.6],[1.5,1.5],[.6,2.4],[2.4,2.4]][k%5];t.px=f.x+sp[0];t.py=f.y+sp[1]}
 if(Math.hypot(u.x-t.px,u.y-t.py)<.3){u.path=null;if(u.ct!=='food'){u.carry=0;u.ct='food'}u.carry+=gRate(u,'farm')*(isC?1.1:nearMill(f)?1.15:1)*dt;u.work=1;u.an+=dt*6;
  if(u.carry>=P[u.o].m.carry){t.ph='ret';u.path=null}return}
 if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.4;goPoint(u,t.px,t.py)}step(u,dt)}
function doBuild(u,t,dt){const b=ents.get(t.id);
 if(!b||b.dead||b.o!==u.o||(b.built>=1&&b.hp>=bMaxHp(b)))return nextBuild(u,t,b);
 const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);
 if(d<=.85){u.path=null;u.work=1;u.an+=dt*7;const c=ec(b);u.face=c.x<u.x?-1:1;const mx=bMaxHp(b),tm=B[b.type].tm;const k=P[u.o].m.build*(ud(u).tag==='vil'?1:.7);
  if(b.built<1){if(!b.started){b.started=1;evict(b)}b.built=Math.min(1,b.built+k*dt/tm);b.hp=Math.min(mx,b.hp+mx*k*dt/tm);if(b.built>=1)onBuilt(b)}
  else{const add=Math.min(mx-b.hp,mx*k*dt/(tm*2)),f=add/mx*.5,pp=P[u.o],c=B[b.type].cost;if(R4.some(r=>c[r]&&pp.res[r]<c[r]*f)){if(u.o===0)toastOnce('rep','Not enough resources to keep repairing',15);return nextBuild(u,t,null)}for(const r in c)pp.res[r]-=c[r]*f;b.hp+=add}return}
 if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.4;pathRect(u,b.x,b.y,b.x+b.w-1,b.y+b.h-1,true);if(u.partial&&!u.path.length){t.bad=(t.bad||0)+1;if(t.bad>3)return nextBuild(u,t,null)}}
 step(u,dt)}
function nextBuild(u,t,b){u.path=null;let nb=null;
 if(t.q&&t.q.length){t.q=t.q.filter(id=>{const e=ents.get(id);return e&&e.built<1&&e.o===u.o});let bd=1e9;for(const id of t.q){const e=ents.get(id);const d=rectDist(u.x,u.y,e.x,e.y,e.w,e.h);if(d<bd){bd=d;nb=e}}}
 if(!nb){let bd=14;for(const e of blds){if(e.o!==u.o||e.built>=1||e.dead||(b&&e.id===b.id))continue;const d=rectDist(u.x,u.y,e.x,e.y,e.w,e.h);if(d<bd){bd=d;nb=e}}}
 if(nb){t.id=nb.id;t.bad=0;return}
 if(b&&!b.dead&&b.o===u.o&&canGather(u,'farm')){const ty=b.type;
  if(ty==='field'&&(ud(u).tag==='vil'||t.thenField)){u.task={k:'field',id:b.id};return}
  if(ty==='corral'&&ud(u).tag==='vil'&&b.slots.filter(id=>{const e=ents.get(id);return e&&e.task&&e.task.id===b.id}).length<3){u.task={k:'field',id:b.id};return}
  if(ty==='storehouse'&&autoGather(u,['wood','gold','stone'],b))return;
  if(ty==='farmstead'){if(autoGather(u,['food'],b))return;const f=freeField(u.o,b.x,b.y,8);if(f){u.task={k:'field',id:f.id};return}}}
 if(t.prev){u.task=t.prev;return}
 u.task=null}
function doTrade(u,t,dt){let a=ents.get(t.a),b=ents.get(t.b);if(!a||!b||a.dead||b.dead||a.o!==u.o||b.o!==u.o){u.task=null;return}
 const dest=t.leg?a:b;if(rectDist(u.x,u.y,dest.x,dest.y,dest.w,dest.h)<=.9){const d=Math.hypot(a.x-b.x,a.y-b.y);const g=Math.max(5,Math.round(.03*d*d*P[u.o].m.trade));P[u.o].res.gold+=g;P[u.o].st.gath+=g;if(u.o===0&&isVisibleTo0(u))fx.push({k:'gold',x:u.x,y:u.y,t:0,life:1.2,v:g});t.leg=t.leg?0:1;u.path=null;return}
 if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.5;pathRect(u,dest.x,dest.y,dest.x+dest.w-1,dest.y+dest.h-1,true)}step(u,dt)}
const isVisibleTo0=u=>vis[(u.y|0)*W+(u.x|0)];
function separate(){const n=units.length;const cell=new Map();for(let i=0;i<n;i++){const a=units[i];if(a.gar)continue;const k=((a.x|0)>>1)*4096+((a.y|0)>>1);let l=cell.get(k);if(!l){l=[];cell.set(k,l)}l.push(a)}
 for(const [k,l] of cell){const cx=Math.floor(k/4096),cy=k%4096;const near=[];for(let dx=0;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(dx===0&&dy<0)continue;const m=cell.get((cx+dx)*4096+cy+dy);if(m)near.push(m)}
  for(let i=0;i<l.length;i++){const a=l[i];for(const m of near){for(let j=(m===l?i+1:0);j<m.length;j++){const b=m[j];if(a.nav!==b.nav)continue;
   const dx=b.x-a.x,dy=b.y-a.y;const mm=(a.r+b.r)*.8,d2=dx*dx+dy*dy;if(d2>=mm*mm)continue;
   const wa=a.work||ud(a).tag==='sie'?.15:1,wb=b.work||ud(b).tag==='sie'?.15:1;let d=Math.sqrt(d2),nx,ny;if(d<1e-4){nx=Math.random()-.5;ny=Math.random()-.5;d=.01}else{nx=dx/d;ny=dy/d}
   const push=(mm-d)*.25;const ax=a.x-nx*push*wa,ay=a.y-ny*push*wa,bx=b.x+nx*push*wb,by=b.y+ny*push*wb;
   if(passXY(Math.floor(ax),Math.floor(ay),a.o,a.nav)){a.x=ax;a.y=ay}if(passXY(Math.floor(bx),Math.floor(by),b.o,b.nav)){b.x=bx;b.y=by}}}}}}

/* ---------- buildings ---------- */
function trainList(b){const d=B[b.type];if(!d.train)return[];const civ=CIVS[P[b.o].civ];return d.train.map(t=>t==='UU'?civ.uu:t==='HERO'?civ.hero:t)}
function spawn(b,type){const nav=!!U[type].nav;const p=freeAround(b,null,null,nav);
 if(type==='sheep'){const a=mkAnimal('sheep',p.x,p.y,b.o);a.hx=p.x;a.hy=p.y;P[b.o].st.trained++;return a}
 const u=mkUnit(type,b.o,p.x,p.y);P[b.o].st.trained++;if(b.o===0)sfx('ready');u.home={x:p.x,y:p.y};
 const r=b.rally;if(r&&!nav){if(r.rt&&canGather(u,r.rt==='food'?'berry':r.rt)&&resT[r.ty*W+r.tx]===RT[r.rt])u.task={k:'gather',rt:r.rt,tx:r.tx,ty:r.ty};
  else if(r.bid&&ents.has(r.bid)&&canBuild(u)){const e=ents.get(r.bid);if(e.o===u.o){if(e.type==='field'&&e.built>=1)u.task={k:'field',id:e.id};else if(e.built<1)u.task={k:'build',id:e.id,q:[]};else if(B[e.type].gar)u.task={k:'gar',id:e.id}}}
  else u.task={k:'move',x:r.x,y:r.y}}
 else if(nav&&type==='fishboat'){const i=nearestRes(5,b.x+1,b.y+1,20,false,true);if(i>=0)u.task={k:'gather',rt:'fish',tx:i%W,ty:(i/W)|0}}
 else if(nav&&r){u.task={k:'move',x:r.x,y:r.y}}
 return u}
function phaseCount(p,ph){let n=0;for(const b of blds){if(b.o!==p.i||b.built<1)continue;const d=B[b.type];if(d.wall||d.flat||b.type==='outpost'||b.type==='palisade')continue;if(ph===0||d.ph>=1)n++}return n}
function phaseReady(p,id){const t=TECH[id];if(!t.up)return true;return phaseCount(p,t.ph)>=t.need}
function applyTech(p,id){const t=TECH[id];
 if(t.up){const bb=blds.filter(b=>b.o===p.i).map(b=>[b,b.hp/bMaxHp(b)]);evictSprites(p.i);p.phase=t.up;recomputeMods(p);for(const [b,f] of bb)b.hp=f*bMaxHp(b);if(p.i===0){toast('You have entered the '+PHASE[p.phase]+' Phase!','good');sfx('fanfare')}else if(vis0(p))toast(p.civN+' entered the '+PHASE[p.phase]+' Phase','bad');panelDirty=true;return}
 const before=blds.filter(b=>b.o===p.i).map(b=>[b,b.hp/bMaxHp(b)]);const ub=units.filter(u=>u.o===p.i).map(u=>[u,u.hp/uMaxHp(u)]);
 p.techs.push(id);recomputeMods(p);for(const [b,f] of before)b.hp=f*bMaxHp(b);for(const [u,f] of ub)u.hp=f*uMaxHp(u);
 if(p.i===0)toast(t.n+' researched','good');panelDirty=true}
const vis0=p=>true;
function recomputeMods(p){p.m=newMods();p.m.bhp+=[0,0,.1,.25][p.phase||0];CIVS[p.civ].mods(p.m);for(const k of p.techs)TECH[k].fx(p.m)}
function inQueue(o,id){return blds.some(b=>b.o===o&&b.queue.some(q=>q.t===id))}
function techOk(p,id){const t=TECH[id];if(t.up)return p.phase===t.ph&&!inQueue(p.i,id);return p.phase>=t.ph&&p.techs.indexOf(id)<0&&!inQueue(p.i,id)&&(!t.req||p.techs.indexOf(t.req)>=0)}
function unitOk(p,type,b){const d=U[type];if(p.phase<d.ph)return false;if(d.hero){if(p.hero&&ents.has(p.hero))return false;if(blds.some(x=>x.o===p.i&&x.queue.some(q=>q.u===type)))return false}return true}
function qTime(q){const p=1;if(q.u){return U[q.u].tm*Math.pow(q.n||1,.8)}return TECH[q.t].tm}
function updBld(b,dt){const d=B[b.type],p=P[b.o];
 if(b.built<1)return;
 if(b.queue.length){const q=b.queue[0];const tm=qTime(q)/(q.u?p.m.train:1);
  if(q.p<tm){q.p+=dt;if(q.t&&q.p>=tm){b.queue.shift();applyTech(p,q.t)}}
  if(q.u&&q.p>=tm){const n=q.n||1;const room=q.u==='sheep'?n:p.popCap-p.pop;if(room>=1){const k=Math.min(n-(q.done||0),room);for(let i=0;i<k;i++)spawn(b,q.u);q.done=(q.done||0)+k;if(q.done>=n)b.queue.shift()}else if(b.o===0)toastOnce('house','You need more houses! Population is full.',20)}}
 if(d.gate&&b.built>=1){if((S.tick+b.id)%4===0){let near=false;if(!b.locked)for(const u of units){if(u.o!==b.o||u.gar)continue;if(Math.abs(u.x-b.x-.5)<1.7&&Math.abs(u.y-b.y-.5)<1.7){near=true;break}}if(near&&!b.openT)sfx(b.type==='gate'?'chain':'creak',b.x+.5,b.y+.5);b.openT=near?1:0}b.open=(b.open||0)+clamp((b.openT||0)-(b.open||0),-dt*(b.type==='gate'?1.1:1.8),dt*(b.type==='gate'?1.1:1.8))}
 if(b.cp<cpMax(b)&&(!b.capT||S.t-b.capT>1.5))b.cp=Math.min(cpMax(b),b.cp+(3+b.gar.length*2)*dt);
 if(b.gar.length){const h=(d.heal||1)*p.m.heal*dt;for(const id of b.gar){const u=ents.get(id);if(u&&u.hp<uMaxHp(u))u.hp=Math.min(uMaxHp(u),u.hp+h)}}
 if(!peace()&&b.built>=1&&(S.tick+b.id)%20===0&&((d.wall&&p.m.spikes)||(p.m.boil&&(b.type==='tower'||b.type==='castle'||b.type==='gate'))))scald(b,p);
 if(d.arr&&!peace()&&(!d.wall||b.gar.length)){b.cd-=dt;if(b.cd<=0){const r=d.arr.r+p.m.rng+Math.max(b.w,b.h)/2+((b.type==='tower'||b.type==='castle')?(p.m.towerRng||0):0);const c=ec(b);let e=null,bd=r;
  for(const u of units){if(!isEnemy(b.o,u.o)||u.gar)continue;const dd=Math.hypot(u.x-c.x,u.y-c.y);if(dd<bd){bd=dd;e=u}}
  if(e){const n=Math.min(12,d.arr.n+(d.arr.n?p.m.towerArr*(b.type==='tower'||b.type==='sentry'?1:0):0)+b.gar.filter(id=>{const g=ents.get(id);return g&&ud(g).tag!=='vil'||b.type==='tc'}).length),a=d.arr.a+p.m.atk.p;
   for(let k=0;k<n;k++)shoot(c.x+(Math.random()-.5)*b.w*.6,c.y-.8-(Math.random()*.4),e,dmgTo(a,'p',null,e),b.o,b.id,'arrow');b.cd=2}else b.cd=.4}}}
function scald(b,p){const dm=(b.type==='tower'||b.type==='castle'||b.type==='gate')&&p.m.boil?12:0,sp=B[b.type].wall&&p.m.spikes?2:0;const dmg=dm+sp;if(!dmg)return;
 for(const u of units){if(u.gar||!isEnemy(b.o,u.o))continue;if(rectDist(u.x,u.y,b.x,b.y,b.w,b.h)<.9){hit(u,dmg,b.o);if(Math.random()<.5)fx.push({k:'dust',x:u.x,y:u.y,t:0,life:.5,s:.3})}}}
function autoRepair(p){if(!p.autoRep||peace()&&false)return;let n=0;for(const b of blds){if(n>=3)break;if(b.o!==p.i||b.built<1||b.hp>=bMaxHp(b)*.96||B[b.type].flat||S.t-(b.dmgT||-99)<6)continue;
 const on=units.filter(u=>u.o===p.i&&u.task&&u.task.k==='build'&&u.task.id===b.id).length;if(on>=(b.w>=3?3:1))continue;let best=null,bd=18;
 for(const u of units){if(u.o!==p.i||u.gar||ud(u).tag!=='vil')continue;const t=u.task;if(t&&!(t.k==='gather'||t.k==='field'))continue;const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=u}}
 if(best){assignBuild([best],[b.id]);n++}}}
function ringBell(o,on){const p=P[o];p.bell=on;
 if(on){const tcs=blds.filter(b=>b.o===o&&(b.type==='tc'||b.type==='castle'||b.type==='tower')&&b.built>=1);if(!tcs.length)return;
  for(const u of units){if(u.o!==o||ud(u).tag!=='vil'||u.gar)continue;let best=null,bd=20;for(const b of tcs){if(b.gar.length+units.filter(x=>x.task&&x.task.k==='gar'&&x.task.id===b.id).length>=(B[b.type].gar||0))continue;const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;best=b}}
   if(best){const prev=u.task&&u.task.k!=='gar'?u.task:null;if(prev)prev.ph=null;u.task={k:'gar',id:best.id,prev};u.path=null}}
  if(o===0)toast('The town bell rings! Villagers take cover.','bad')}
 else{for(const b of blds){if(b.o!==o)continue;const keep=[];for(const id of b.gar){const u=ents.get(id);if(!u)continue;if(ud(u).tag==='vil'){u.gar=0;const q=freeAround(b);u.x=q.x;u.y=q.y;u.path=null}else keep.push(id)}b.gar=keep}
  for(const u of units)if(u.o===o&&u.task&&u.task.k==='gar'&&ud(u).tag==='vil')u.task=u.task.prev||null;if(o===0)toast('All clear. Back to work.')}}
function unload(b){ejectAll(b);panelDirty=true}
/* barter: price in gold for 100 units; buying raises the price, selling lowers it */
function barter(p,res,buy){const pr=p.barter[res];const fee=p.m.barter;if(buy){const cost=Math.round(pr*(1+.2*fee));if(p.res.gold<cost)return false;p.res.gold-=cost;p.res[res]+=100;p.barter[res]=Math.min(400,pr*1.06)}
 else{if(p.res[res]<100)return false;const gain=Math.round(pr*(1-.25*fee));p.res[res]-=100;p.res.gold+=gain;p.barter[res]=Math.max(20,pr*.94)}return true}

/* ---------- territory ---------- */
let terrDirty=true,terrEdges=[];
function computeTerritory(){terrDirty=false;terr.fill(0);const best=new Float32Array(N).fill(9);
 for(const b of blds){const d=B[b.type];if(!d.terr||b.built<1)continue;const cx=b.x+b.w/2,cy=b.y+b.h/2,r=d.terr;
  for(let y=Math.max(0,Math.floor(cy-r));y<=Math.min(H-1,Math.ceil(cy+r));y++)for(let x=Math.max(0,Math.floor(cx-r));x<=Math.min(W-1,Math.ceil(cx+r));x++){const f=Math.hypot(x+.5-cx,y+.5-cy)/r;if(f>1)continue;const i=y*W+x;if(f<best[i]){best[i]=f;terr[i]=b.o+1}}}
 terrEdges=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,o=terr[i];if(!o)continue;if(x+1>=W||terr[i+1]!==o)terrEdges.push([x+1,y,x+1,y+1,o-1]);if(x===0||terr[i-1]!==o)terrEdges.push([x,y,x,y+1,o-1]);if(y+1>=H||terr[i+W]!==o)terrEdges.push([x,y+1,x+1,y+1,o-1]);if(y===0||terr[i-W]!==o)terrEdges.push([x,y,x+1,y,o-1])}}

/* ---------- map generation ---------- */
const MAPS={mainland:{n:'Mainland',d:'Open land, forests and ponds.',biome:'temp'},rivers:{n:'Rivers',d:'Rivers split the land. Cross at the fords.',biome:'temp'},lakes:{n:'Great Lake',d:'A big lake in the middle. Fish and warships.',biome:'temp'},
 coast:{n:'Coastline',d:'A sea along one side of the map.',biome:'temp'},highlands:{n:'Highlands',d:'Thick forests, narrow clearings, rich in stone.',biome:'temp'},desert:{n:'Desert Oasis',d:'Sand, palm oases and lots of gold.',biome:'desert'},nordic:{n:'Nordic Fjords',d:'Snowy pine forests and cold fjords.',biome:'snow'},
 mediterranean:{n:'Inland Sea',d:'A great sea in the middle. Every kingdom has a shore.',biome:'temp'},blackforest:{n:'Black Forest',d:'Endless woods with a few paths cut through. Wood for days.',biome:'temp'},
 steppe:{n:'Steppe',d:'Wide dry grassland. Few trees, big herds, extra gold.',biome:'steppe'},goldrush:{n:'Gold Rush',d:'A huge gold field in the middle. Fight for it.',biome:'temp'},
 fortress:{n:'Fortress',d:'Everyone starts behind stone walls with towers.',biome:'temp'},mountainpass:{n:'Mountain Pass',d:'Rock ridges you cannot cross. Hold the passes.',biome:'temp'},
 canyon:{n:'Red Canyon',d:'Desert mesas and narrow canyons.',biome:'desert'},marsh:{n:'Marshlands',d:'Shallow bogs, reeds and ponds full of fish.',biome:'temp'},
 alpine:{n:'Alpine Valley',d:'Snowy peaks ring a green valley. Rich in stone.',biome:'snow'},islands:{n:'Islands',d:'Each kingdom on its own island, linked by shallow sandbars.',biome:'temp'}};
const MKEYS=Object.keys(MAPS);
const SIZES={s:96,m:128,l:160};
function makeNoise(seed){const r=mulberry(seed),G=64,g=new Float32Array(G*G);for(let i=0;i<G*G;i++)g[i]=r();const s=t=>t*t*(3-2*t);
 return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const a=g[(yi&63)*G+(xi&63)],b=g[(yi&63)*G+((xi+1)&63)],c=g[((yi+1)&63)*G+(xi&63)],d=g[((yi+1)&63)*G+((xi+1)&63)];const u=s(xf),v=s(yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}}
function setRes(x,y,t){if(x<1||y<1||x>=W-1||y>=H-1)return false;const i=y*W+x;if(ter[i]===4)return false;if(t!==5&&ter[i]===1)return false;if(t===5&&ter[i]!==1)return false;resT[i]=t;resA[i]=RAMT[t];block[i]=1;return true}
function clearRes(i){resT[i]=0;resA[i]=0;if(block[i]===1)block[i]=0}
function genMap(seed,type,size,np){alloc(SIZES[size]||128,SIZES[size]||128);rnd=mulberry(seed);const mt=MAPS[type];S.biome=mt.biome;
 const n1=makeNoise(seed+7),n2=makeNoise(seed+11),n3=makeNoise(seed+23);const C=W/2;
 let TT=1;const water=(x,y)=>{if(x>=0&&y>=0&&x<W&&y<H)ter[y*W+x]=TT};const blobT=(cx,cy,r,rough,t)=>{TT=t;blobW(cx,cy,r,rough);TT=1};
 const blobW=(cx,cy,r,rough)=>{for(let y=Math.floor(cy-r-3);y<=cy+r+3;y++)for(let x=Math.floor(cx-r-3);x<=cx+r+3;x++){const d=Math.hypot(x-cx,y-cy)+(n3(x/4,y/4)-.5)*rough;if(d<r)water(x,y)}};
 const river=(ax,ay,bx,by,w)=>{const pts=[];const L=Math.hypot(bx-ax,by-ay);const nx=-(by-ay)/L,ny=(bx-ax)/L;const ph=rnd()*9;for(let k=0;k<=L;k+=.5){const t=k/L;const wob=Math.sin(t*6.2+ph)*W*.05+(n2(t*5,ph)-.5)*W*.06;pts.push([ax+(bx-ax)*t+nx*wob,ay+(by-ay)*t+ny*wob])}
  for(const [px,py] of pts){const ww=w+(n3(px/6,py/6)-.5)*1.2;for(let y=Math.floor(py-ww);y<=py+ww;y++)for(let x=Math.floor(px-ww);x<=px+ww;x++)if(Math.hypot(x+.5-px,y+.5-py)<ww)water(x,y)}
  const fords=TT===4?2:Math.max(3,Math.round(L/20));for(let f=0;f<fords;f++){const t=(f+.5)/fords+(rnd()-.5)*.05;const p=pts[Math.floor(t*(pts.length-1))];for(let y=Math.floor(p[1]-w-3);y<=p[1]+w+3;y++)for(let x=Math.floor(p[0]-w-3);x<=p[0]+w+3;x++){if(x<0||y<0||x>=W||y>=H)continue;const i=y*W+x;if(ter[i]===TT&&Math.hypot(x+.5-p[0],y+.5-p[1])<w+2.6)ter[i]=TT===1?2:0}}};const ridge=(ax,ay,bx,by,w)=>{TT=4;river(ax,ay,bx,by,w);TT=1};
 if(type==='rivers'){if(np<=2||rnd()<.5){const a=rnd()<.5;a?river(-2,W*(.3+rnd()*.4),W+2,W*(.3+rnd()*.4),2.2):river(W*(.3+rnd()*.4),-2,W*(.3+rnd()*.4),W+2,2.2)}else{river(-2,W*.5,W+2,W*.5,2);river(W*.5,-2,W*.5,W+2,2)}}
 else if(type==='lakes'){blobW(C,C,W*.15,6);for(let k=0;k<3;k++){const a=rnd()*6.28,r=W*.3;blobW(C+Math.cos(a)*r,C+Math.sin(a)*r,3+rnd()*2,3)}}
 else if(type==='coast'||type==='nordic'){const side=ri(4);const depth=W*(type==='nordic'?.14:.2);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=[x,y,W-1-x,H-1-y][side];const lim=depth+(n1(x/8,y/8)-.5)*W*.12+(type==='nordic'?Math.sin((side%2?x:y)/W*18)*W*.05:0);if(v<lim)ter[y*W+x]=1}
  if(type==='nordic')for(let k=0;k<3;k++)blobW(W*(.25+rnd()*.5),H*(.25+rnd()*.5),2.5+rnd()*2,3)}
 else if(type==='mediterranean'){blobW(C,C,W*.2,12);for(let k=0;k<2;k++)blobT(C+(rnd()-.5)*W*.12,C+(rnd()-.5)*W*.12,2+rnd()*2,2,0)}
 else if(type==='islands'){for(let y=0;y<H;y++)for(let x=0;x<W;x++)ter[y*W+x]=1}
 else if(type==='marsh'){for(let k=0;k<Math.round(W*W/700);k++)blobT(W*(.06+rnd()*.88),H*(.06+rnd()*.88),1.5+rnd()*3.5,3,2);for(let k=0;k<Math.round(W*W/2200);k++)blobW(W*(.1+rnd()*.8),H*(.1+rnd()*.8),2+rnd()*2.5,3)}
 else if(type==='canyon'){for(let k=0;k<Math.round(W*W/500);k++)blobT(W*(.04+rnd()*.92),H*(.04+rnd()*.92),2.5+rnd()*4.5,6,4);for(let k=0;k<2;k++)blobW(W*(.25+rnd()*.5),H*(.25+rnd()*.5),2+rnd()*1.5,2)}
 else if(type==='alpine'){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const d=Math.hypot(x-C,y-C)/(W*.5)+(n1(x/7,y/7)-.5)*.35;if(d>.93)ter[y*W+x]=4}for(let k=0;k<Math.round(W*W/2500);k++)blobT(W*(.12+rnd()*.76),H*(.12+rnd()*.76),1.5+rnd()*2,4,4);blobW(C,C,3+rnd()*2,3)}
 else if(type==='steppe'){for(let k=0;k<2;k++)blobW(W*(.2+rnd()*.6),H*(.2+rnd()*.6),2.5+rnd()*2,3)}
 else if(type==='desert'){for(let k=0;k<Math.round(W*W/2600);k++)blobW(W*(.12+rnd()*.76),H*(.12+rnd()*.76),2.2+rnd()*2.8,3)}
 else{const n=type==='highlands'?2:Math.round(W*W/3000);for(let k=0;k<n;k++)blobW(W*(.12+rnd()*.76),H*(.12+rnd()*.76),2.5+rnd()*2.5,3)}
 // start positions spread around the map, nudged onto dry land
 const starts=[];const off=rnd()*6.28;const rad=W*(type==='alpine'?.28:type==='mediterranean'?.36:np<=2?.34:.33);
 for(let k=0;k<np;k++){const a=off+k/np*Math.PI*2;let bx=C+Math.cos(a)*rad-2,by=C+Math.sin(a)*rad-2;let best=null,bs=1e9;
  for(let r=0;r<W*.3&&!best;r+=1)for(let j=0;j<24;j++){const aa=j/24*6.28;const x=Math.round(bx+Math.cos(aa)*r),y=Math.round(by+Math.sin(aa)*r);if(x<10||y<10||x>W-14||y>H-14)continue;let ok=true;
   for(let yy=y-7;yy<y+11&&ok;yy++)for(let xx=x-7;xx<x+11;xx++){if(xx<0||yy<0||xx>=W||yy>=H||ter[yy*W+xx]===1||ter[yy*W+xx]===4){ok=false;break}}
   if(ok&&starts.every(s=>Math.hypot(s[0]-x,s[1]-y)>W*.3)){const sc=r;if(sc<bs){bs=sc;best=[x,y]}}}
  if(!best){best=[Math.round(clamp(bx,10,W-14)),Math.round(clamp(by,10,H-14))];for(let yy=best[1]-6;yy<best[1]+10;yy++)for(let xx=best[0]-6;xx<best[0]+10;xx++)if(xx>=0&&yy>=0&&xx<W&&yy<H)ter[yy*W+xx]=0}
  starts.push(best)}
 if(type==='islands'){const r0=W*(np<=2?.2:np===3?.17:.15);for(const s of starts)blobT(s[0]+2,s[1]+2,r0,8,0);for(let k=0;k<starts.length&&starts.length>1;k++){const a=starts[k],b=starts[(k+1)%starts.length];if(starts.length===2&&k===1)break;const L=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<=L;t+=.5){const px=a[0]+2+(b[0]-a[0])*t/L,py=a[1]+2+(b[1]-a[1])*t/L+Math.sin(t/L*Math.PI)*W*.04;for(let y=Math.floor(py-2);y<=py+2;y++)for(let x=Math.floor(px-2);x<=px+2;x++)if(x>=0&&y>=0&&x<W&&y<H&&ter[y*W+x]===1&&Math.hypot(x+.5-px,y+.5-py)<2.2)ter[y*W+x]=2}}for(let k=0;k<Math.max(2,np);k++){const a=rnd()*6.28;blobT(C+Math.cos(a)*W*.08,C+Math.sin(a)*W*.08,3+rnd()*2,3,0)}}
 const nearStart=(x,y,r)=>starts.some(s=>Math.hypot(x-(s[0]+2),y-(s[1]+2))<r);
 if(type==='mountainpass'){const ang=starts.map(s=>Math.atan2(s[1]+2-C,s[0]+2-C)).sort((a,b)=>a-b);const mids=[];for(let k=0;k<ang.length;k++){let a=ang[k],b=k+1<ang.length?ang[k+1]:ang[0]+6.283;mids.push((a+b)/2)}
  if(np===2)mids.push(...mids.map(a=>a+.6));for(const a of mids)ridge(C+Math.cos(a)*W*.1,C+Math.sin(a)*W*.1,C+Math.cos(a)*W*.64,C+Math.sin(a)*W*.64,2.6);
  for(let k=0,g=0;k<Math.round(W*W/3000)&&g<400;g++){const x=W*(.08+rnd()*.84),y=H*(.08+rnd()*.84);if(nearStart(x,y,15))continue;blobT(x,y,1.5+rnd()*2.5,4,4);k++}
  for(const s of starts)for(let y=s[1]-9;y<s[1]+13;y++)for(let x=s[0]-9;x<s[0]+13;x++)if(x>=0&&y>=0&&x<W&&y<H&&ter[y*W+x]===4)ter[y*W+x]=0}
 const thr={highlands:.52,desert:.86,nordic:.57,blackforest:.42,steppe:.8,canyon:.9,alpine:.56,marsh:.6,islands:.58}[type]||.62;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(ter[i]===1||ter[i]===4)continue;const edge=Math.min(x,y,W-1-x,H-1-y);const v=n1(x/9,y/9)*.65+n2(x/3.5,y/3.5)*.35;
  if(edge<2||(edge<4&&v>.45)||(v>thr&&!nearStart(x,y,11)))setRes(x,y,1)}
 if(type==='desert'){for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(ter[i]===1||resT[i])continue;let nw=false;for(let k=0;k<8&&!nw;k++){const xx=x+DX[k]*2,yy=y+DY[k]*2;if(xx>=0&&yy>=0&&xx<W&&yy<H&&ter[yy*W+xx]===1)nw=true}if(nw&&rnd()<.35&&!nearStart(x,y,9))setRes(x,y,1)}}
 const blob=(t,cx,cy,count,avoid=4.5)=>{const q=[[cx,cy]];let c=0,g=0;while(q.length&&c<count&&g++<500){const k=ri(q.length);const [x,y]=q.splice(k,1)[0];if(x<2||y<2||x>=W-2||y>=H-2)continue;const i=y*W+x;if(ter[i]===1||(resT[i]&&resT[i]!==1))continue;if(nearStart(x,y,avoid))continue;if(resT[i]===1)clearRes(i);if(setRes(x,y,t))c++;q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1])}return c};
 const around=(s,d)=>{for(let tries=0;tries<30;tries++){const a=rnd()*Math.PI*2;const x=Math.round(s[0]+2+Math.cos(a)*d),y=Math.round(s[1]+2+Math.sin(a)*d);if(x>3&&y>3&&x<W-4&&y<H-4&&ter[y*W+x]!==1&&ter[y*W+x]!==4)return[x,y]}return[s[0]+2,s[1]+2+d]};
 const herd=(type,x,y,n)=>{for(let k=0;k<n;k++){const ax=x+(rnd()-.5)*3,ay=y+(rnd()-.5)*3;if(passXY(Math.floor(ax),Math.floor(ay),-1,false))mkAnimal(type,ax,ay)}};
 const rich={desert:1.4,highlands:1.2,steppe:1.5,alpine:1.3,canyon:1.3}[type]||1;
 for(const s of starts){let p=around(s,7);blob(4,p[0],p[1],7);p=around(s,10);blob(2,p[0],p[1],7);p=around(s,17);blob(2,p[0],p[1],6,8);p=around(s,11);blob(3,p[0],p[1],6);p=around(s,18);blob(3,p[0],p[1],5,8);
  p=around(s,12);for(let k=0;k<40;k++){const x=p[0]+ri(9)-4,y=p[1]+ri(9)-4;if(x>1&&y>1&&x<W-2&&y<H-2&&!resT[y*W+x]&&!nearStart(x,y,8))setRes(x,y,1)}
  p=around(s,5.5);herd('sheep',p[0],p[1],4);p=around(s,14);herd(type==='desert'?'deer':'deer',p[0],p[1],5);p=around(s,16);herd('boar',p[0],p[1],1)}
 const area=W*H;const far=(x,y)=>!nearStart(x,y,16);
 const scatter=(n,f)=>{let k=0,g=0;while(k<n&&g++<n*40){const x=4+ri(W-8),y=4+ri(H-8);if(ter[y*W+x]===1||ter[y*W+x]===4||!far(x,y))continue;f(x,y);k++}};
 scatter(Math.round(area/1700*rich),(x,y)=>blob(2,x,y,4+ri(4)));scatter(Math.round(area/2100*rich),(x,y)=>blob(3,x,y,4+ri(3)));scatter(Math.round(area/3200),(x,y)=>blob(4,x,y,5+ri(3)));
 scatter(Math.round(area/1500),(x,y)=>herd(type==='nordic'?'deer':rnd()<.25?'sheep':'deer',x,y,3+ri(4)));scatter(Math.round(area/3800),(x,y)=>herd('boar',x,y,1+ri(2)));
 if(type==='steppe')scatter(Math.round(area/1200),(x,y)=>herd(rnd()<.5?'sheep':'deer',x,y,4+ri(4)));
 if(type==='goldrush'){blob(2,C,C,70,4);for(let k=0;k<4;k++){const a=rnd()*6.28;blob(2,Math.round(C+Math.cos(a)*7),Math.round(C+Math.sin(a)*7),18,4)}blob(3,Math.round(C+5),Math.round(C-6),14)}
 if(type==='alpine'||type==='canyon'||type==='mountainpass')scatter(Math.round(area/2600),(x,y)=>blob(3,x,y,5+ri(4)));
 if(type==='blackforest'||type==='mountainpass'||type==='canyon'||type==='alpine'||type==='highlands'){const cut=(ax,ay,bx,by,w)=>{const L=Math.hypot(bx-ax,by-ay),ph=rnd()*9;for(let k=0;k<=L;k+=.5){const t=k/L;const wob=Math.sin(t*5+ph)*3;const px=ax+(bx-ax)*t-(by-ay)/L*wob,py=ay+(by-ay)*t+(bx-ax)/L*wob;for(let y=Math.floor(py-w);y<=py+w;y++)for(let x=Math.floor(px-w);x<=px+w;x++){if(x<1||y<1||x>=W-1||y>=H-1)continue;const i=y*W+x;if(ter[i]===4)ter[i]=0;if(resT[i]===1)clearRes(i)}}};
  for(const s of starts)cut(s[0]+2,s[1]+2,C,C,type==='blackforest'?1.6:1.3);for(let k=0;k<starts.length;k++){const a=starts[k],b=starts[(k+1)%starts.length];if(starts.length>1&&(type==='blackforest'||type==='alpine'))cut(a[0]+2,a[1]+2,b[0]+2,b[1]+2,1.2)}}
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(ter[i]!==1||rnd()>.03)continue;let ok=true,wn=0;for(let k=0;k<8;k++){const j=(y+DY[k])*W+x+DX[k];if(resT[j]===5)ok=false;if(ter[j]===1)wn++}if(ok&&wn>=6)setRes(x,y,5)}
 for(const s of starts){for(let y=s[1]-1;y<s[1]+5;y++)for(let x=s[0]-1;x<s[0]+5;x++)if(x>=0&&y>=0&&x<W&&y<H){const i=y*W+x;clearRes(i);ter[i]=0}}
 for(let i=0;i<N;i++){if(resT[i]===1){const h=((i*2654435761)>>>0);treeK[i]=S.biome==='desert'?6+h%3:S.biome==='snow'?9+h%3:h%6}
  if(ter[i]===0){const x=i%W,y=(i/W)|0;for(let k=0;k<4;k++){const xx=x+DX[k],yy=y+DY[k];if(xx>=0&&yy>=0&&xx<W&&yy<H&&ter[yy*W+xx]===1){ter[i]=3;break}}}}
 animals=animals.filter(a=>{const i=(a.y|0)*W+(a.x|0);if(ter[i]===1||ter[i]===4||block[i]){ents.delete(a.id);return false}return true});
 return starts}
const BIOME={temp:{g:[74,112,44],gv:[46,44,20],dirt:[150,122,78],sand:[196,178,120]},desert:{g:[200,170,110],gv:[30,26,18],dirt:[176,140,90],sand:[214,190,130]},snow:{g:[222,228,236],gv:[18,16,14],dirt:[150,140,128],sand:[190,190,186]},steppe:{g:[150,150,70],gv:[40,34,16],dirt:[160,130,84],sand:[200,184,126]}};
function renderGround(seed){const S2=Math.max(10,Math.min(20,Math.floor(2304/W))),gw=W*S2;groundCv.width=gw;groundCv.height=gw;const g=groundCv.getContext('2d');const id=g.createImageData(gw,gw),d=id.data;
 const n1=makeNoise(seed+3),n2=makeNoise(seed+5),n3=makeNoise(seed+9);const r2=mulberry(seed+1);const bm=BIOME[S.biome];
 const dist=new Uint8Array(N).fill(9);for(let i=0;i<N;i++)if(ter[i]!==1)dist[i]=0;for(let pass=1;pass<=5;pass++)for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(dist[i]!==9)continue;for(let k=0;k<4;k++){const xx=x+DX[k],yy=y+DY[k];if(xx>=0&&yy>=0&&xx<W&&yy<H&&dist[yy*W+xx]===pass-1){dist[i]=pass;break}}}
 const tcs=blds.filter(b=>b.type==='tc').map(b=>[b.x+2,b.y+2]);dirtM=new Uint8Array(N);for(const c of tcs)for(let y=Math.max(0,c[1]-8);y<Math.min(H,c[1]+8);y++)for(let x=Math.max(0,c[0]-8);x<Math.min(W,c[0]+8);x++)if(Math.hypot(x+.5-c[0],y+.5-c[1])<6.6)dirtM[y*W+x]=1;
 for(let y=0;y<gw;y++)for(let x=0;x<gw;x++){const wx=x/S2,wy=y/S2;let v=n1(wx/7,wy/7)*.55+n2(wx/2,wy/2)*.3+n3(wx*1.3,wy*1.3)*.15;v+=(r2()-.5)*.08;
  const ti=(wy|0)*W+(wx|0),t=ter[ti];let r,gg,b;
  if(t===1){const dd=Math.min(5,dist[ti]+(n2(wx*.8,wy*.8)-.5)*1.2);const deep=clamp(dd/4,0,1);if(S.biome==='snow'){r=70-deep*40;gg=120-deep*50;b=140-deep*30}else{r=60-deep*35;gg=140-deep*60;b=170-deep*30}const wv=Math.sin(wx*3+wy*2+n3(wx,wy)*6)*.5+.5;r+=wv*12;gg+=wv*12;b+=wv*10;if(dd<.9){r+=40*(1-dd);gg+=30*(1-dd);b+=10*(1-dd)}}
  else if(t===2){r=120+v*30;gg=150+v*30;b=150+v*20}
  else if(t===4){const rk=S.biome==='desert'?[150,84,56]:S.biome==='snow'?[128,128,134]:[112,108,100];r=rk[0]+v*40;gg=rk[1]+v*36;b=rk[2]+v*32}
  else{r=bm.g[0]+v*bm.gv[0];gg=bm.g[1]+v*bm.gv[1];b=bm.g[2]+v*bm.gv[2];if(S.biome==='temp'&&n3(wx/5,wy/5)>.7){r+=12;gg+=4}
   if(S.biome==='desert'){let near=false;const k0=(wy|0),k1=(wx|0);for(let yy=k0-3;yy<=k0+3&&!near;yy+=3)for(let xx=k1-3;xx<=k1+3;xx+=3)if(xx>=0&&yy>=0&&xx<W&&yy<H&&ter[yy*W+xx]===1)near=true;if(near){r=r*.5+60;gg=gg*.5+70;b=b*.5+25}}
   if(resT[ti]===1){r*=.75;gg*=.8;b*=.78}
   if(t===3){const f=.75;r=r*(1-f)+(bm.sand[0]+v*20)*f;gg=gg*(1-f)+(bm.sand[1]+v*18)*f;b=b*(1-f)+(bm.sand[2]+v*14)*f}
   let dirt=0;for(const c of tcs){const dd=Math.hypot(wx-c[0],wy-c[1]);dirt=Math.max(dirt,clamp((5.4+n2(wx,wy)*1.6-dd)/1.4,0,1))}
   if(dirt>0){r=r*(1-dirt)+(bm.dirt[0]+v*30)*dirt;gg=gg*(1-dirt)+(bm.dirt[1]+v*24)*dirt;b=b*(1-dirt)+(bm.dirt[2]+v*18)*dirt}}
  const o=(y*gw+x)*4;d[o]=r;d[o+1]=gg;d[o+2]=b;d[o+3]=255}
 g.putImageData(id,0,0);
 g.globalAlpha=.5;const tuft=S.biome==='desert'?['#b09050','#8a7a3a']:S.biome==='steppe'?['#c4b860','#7a7a30']:S.biome==='snow'?['#ffffff','#b8c4d0']:['#a3c460','#3f6a24'];
 for(let k=0;k<W*W*.9;k++){const x=r2()*gw,y=r2()*gw,ti=((y/S2)|0)*W+((x/S2)|0);if(resT[ti]||ter[ti]===1||ter[ti]===4)continue;g.fillStyle=tuft[k%2];g.fillRect(x,y,1.3,3)}
 if(S.biome==='temp')for(let k=0;k<W*W*.03;k++){const x=r2()*gw,y=r2()*gw,ti=((y/S2)|0)*W+((x/S2)|0);if(resT[ti]||ter[ti]===1)continue;g.fillStyle=['#e8e2a0','#d9a0c8','#f4f0e6'][k%3];g.fillRect(x,y,1.4,1.4)}g.globalAlpha=1}

function fortressWalls(tc){const cx=tc.x+2,cy=tc.y+2,R=12,V=[];for(let k=0;k<8;k++){const a=(k+.5)/8*Math.PI*2;V.push([Math.round(cx+Math.cos(a)*R),Math.round(cy+Math.sin(a)*R)])}
 const seen=new Set(),tiles=[];for(let k=0;k<8;k++){for(const [x,y] of wallLine(V[k][0],V[k][1],V[(k+1)%8][0],V[(k+1)%8][1])){const key=y*W+x;if(!seen.has(key)){seen.add(key);tiles.push([x,y])}}}
 const gateAt=(x,y)=>(Math.abs(x-cx)<=1&&Math.abs(y-cy)>R-3)||(Math.abs(y-cy)<=1&&Math.abs(x-cx)>R-3);
 for(const [x,y] of tiles){if(x<1||y<1||x>=W-1||y>=H-1)continue;const i=y*W+x;if(ter[i]===1||ter[i]===4||occ[i])continue;if(resT[i]===1)clearRes(i);if(block[i])continue;
  if(animals.some(a=>(a.x|0)===x&&(a.y|0)===y))continue;mkBld(gateAt(x,y)?'gate':'wall',tc.o,x,y,true)}
 for(const [x,y] of V){if(x<1||y<1||x>=W-1||y>=H-1)continue;const i=y*W+x;const o=occ[i]&&ents.get(occ[i]);if(o&&o.type==='wall'){stampB(o,false);ents.delete(o.id);blds.splice(blds.indexOf(o),1)}if(!occ[i]&&!block[i]&&ter[i]!==1&&ter[i]!==4)mkBld('tower',tc.o,x,y,true)}}

/* ---------- fog ---------- */
function computeFog(){vis.fill(0);const mark=(cx,cy,r)=>{const r2=r*r+r;const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(W-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(H-1,Math.ceil(cy+r));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=x+.5-cx,dy=y+.5-cy;if(dx*dx+dy*dy<=r2){const i=y*W+x;vis[i]=1;explored[i]=1}}};
 const nl=1-.2*nightF();for(const u of units)if(myTeam(u.o)&&!u.gar)mark(u.x,u.y,ud(u).los*nl);
 for(const b of blds)if(myTeam(b.o))mark(b.x+b.w/2,b.y+b.h/2,B[b.type].los+Math.max(b.w,b.h)/2);
 for(const a of animals)if(a.o===0)mark(a.x,a.y,3);
 const d=fogImg.data;for(let i=0;i<N;i++){d[i*4+3]=vis[i]?0:explored[i]?118:255}fogCtx.putImageData(fogImg,0,0)}

/* ---------- AI ---------- */
const AIPERS={balanced:{n:'Balanced',w:1,g:1,s:1,v:1},rusher:{n:'Aggressive',w:.6,g:.8,s:.7,v:.85},boomer:{n:'Builder',w:1.35,g:1,s:1.3,v:1.25},turtle:{n:'Defender',w:1.45,g:1.15,s:1.2,v:1.05}};
function aiInit(p,diff){const pk=Object.keys(AIPERS);const pers=pk[Math.floor(Math.random()*pk.length)],q=AIPERS[pers];
 p.ai={diff,pers,t:0,nextWave:S.peace+Math.round([900,620,430][diff]*q.w),gap:Math.round([360,250,180][diff]*q.g),wave:Math.round([5,8,11][diff]*q.s),vilT:Math.round([22,34,46][diff]*q.v),bonus:[.85,1.05,1.3][diff],waves:new Set(),saving:false,target:-1,
  autoRep0:p.autoRep=true,nextRaid:diff?S.peace+[0,520,380][diff]*(pers==='rusher'?.7:pers==='turtle'?1.6:1)+Math.random()*90:1e9,raid:[],raidT:0,waveN:0,regroup:0}}
function aiSpot(o,type,cx,cy,r0,r1){const d=B[type];for(let r=r0;r<=r1;r++){const cand=[];const X=Math.round(cx),Y=Math.round(cy);for(let y=Y-r;y<=Y+r;y++)for(let x=X-r;x<=X+r;x++){if(Math.max(Math.abs(x-X),Math.abs(y-Y))!==r)continue;cand.push([x-(d.w>>1),y-(d.h>>1)])}
 for(let k=cand.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));const t=cand[k];cand[k]=cand[j];cand[j]=t}
 for(const [x,y] of cand)if(canPlace(type,x,y,o,!d.flat&&!d.water))return[x,y]}return null}
function aiBuild(p,type,cx,cy,r0,r1){const c=B[type].cost;if(!afford(p,c))return false;const s=aiSpot(p.i,type,cx,cy,r0,r1);if(!s)return false;
 const ws=units.filter(u=>u.o===p.i&&canBuild(u)&&!u.gar&&(!u.task||u.task.k!=='build')&&!p.ai.waves.has(u.id));if(!ws.length)return false;
 ws.sort((a,b)=>Math.hypot(a.x-s[0],a.y-s[1])-Math.hypot(b.x-s[0],b.y-s[1]));const v=ws.find(u=>ud(u).tag==='vil'&&(!u.task||u.task.k==='gather'&&u.task.rt!=='gold'))||ws[0];
 pay(p,c);const b=mkBld(type,p.i,s[0],s[1],false);const prev=v.task&&v.task.k!=='build'?v.task:null;if(prev&&prev.ph!=='ret')prev.ph=null;v.task={k:'build',id:b.id,q:[],prev};v.path=null;
 if(B[type].w>=3){const helper=ws.find(u=>u!==v&&ud(u).tag==='vil'&&Math.hypot(u.x-s[0],u.y-s[1])<14);if(helper){const pv=helper.task&&helper.task.k!=='build'?helper.task:null;helper.task={k:'build',id:b.id,q:[],prev:pv};helper.path=null}}return b}
function aiAssign(p,v,home,vils){const d=ud(v);
 const cnt={food:0,wood:0,gold:0,stone:0};for(const u of vils){const t=u.task;if(!t)continue;const tt=t.k==='build'&&t.prev?t.prev:t;if(tt.k==='gather')cnt[tt.rt==='fish'?'food':tt.rt]++;else if(tt.k==='field'||tt.k==='hunt')cnt.food++}
 const ratio=p.phase===0?{food:.47,wood:.43,gold:.05,stone:.05}:p.phase===1?{food:.38,wood:.37,gold:.17,stone:.08}:{food:.34,wood:.32,gold:.26,stone:.08};
 const n=Math.max(1,vils.length),R=p.res,adj=r=>cnt[r]-ratio[r]*n+(R[r]>900?3:0)-(R[r]<100?2:0);let order=R4.slice().sort((a,b)=>adj(a)-adj(b));
 if(d.tag!=='vil'){order=order.filter(r=>r!=='food');if(d.hunter){const a=nearestHunt(v,home.x,home.y,20);if(a){v.task={k:'hunt',id:a.id};return}return}}
 for(const r of order){if(r==='food'){const f=freeField(p.i,home.x,home.y);if(f&&f.built>=1){v.task={k:'field',id:f.id};return}
   const bi=nearestRes(4,home.x,home.y,15,false,false);if(bi>=0){v.task={k:'gather',rt:'food',tx:bi%W,ty:(bi/W)|0};return}
   const a=nearestHunt(v,home.x,home.y,15);if(a){v.task={k:'hunt',id:a.id};return}
   if(f&&f.built<1){v.task={k:'build',id:f.id,q:[]};return}continue}
  const drops=blds.filter(b=>b.o===p.i&&b.built>=1&&b.type==='storehouse');let i=-1;
  for(const b of drops){const j=nearestRes(RT[r],b.x+1,b.y+1,9,false,false);if(j>=0){i=j;break}}
  if(i<0)i=nearestRes(RT[r],home.x,home.y,r==='wood'?24:30,false,false);
  if(i>=0){v.task={k:'gather',rt:r,tx:i%W,ty:(i/W)|0};return}}}
function aiNearestEnemyBld(p,home){let best=null,bd=1e9;for(const b of blds){if(!isEnemy(p.i,b.o)||B[b.type].flat)continue;const d=Math.hypot(b.x-home.x,b.y-home.y)+(B[b.type].wall?25:0)+(b.type==='tc'||b.type==='castle'?-6:0);if(d<bd){bd=d;best=b}}return best}
function aiTick(p){const ai=p.ai,o=p.i;ai.t+=1;if(!ai.raid)ai.raid=[];if(ai.nextRaid==null)ai.nextRaid=ai.t+400;if(ai.regroup==null)ai.regroup=0;if(ai.waveN==null)ai.waveN=0;if(!ai.pers)ai.pers="balanced";
 const my=units.filter(u=>u.o===o),vils=my.filter(u=>ud(u).tag==='vil'),army=my.filter(u=>isMil(u)&&ud(u).tag!=='shp'),cits=army.filter(u=>ud(u).cit&&!ai.waves.has(u.id));
 const mb=blds.filter(b=>b.o===o);const has=(t,done)=>mb.filter(b=>b.type===t&&(!done||b.built>=1));const pending=t=>mb.some(b=>b.type===t&&b.built<1);
 const tcs=has('tc',1);const anchor=tcs[0]||has('castle',1)[0]||mb.find(b=>!B[b.type].wall);
 const home=anchor?{x:anchor.x+anchor.w/2,y:anchor.y+anchor.h/2}:vils[0]?{x:vils[0].x,y:vils[0].y}:null;if(!home)return;
 const R=p.res;const nextPh=['town','city','kingdom'][p.phase];const gatherers=vils.length+cits.length;const phT=[16,26,40][p.phase]||999;
 const phQ=nextPh&&inQueue(o,nextPh);ai.saving=!!nextPh&&!phQ&&gatherers>=phT-3;
 if(!tcs.length&&vils.length&&afford(p,B.tc.cost)&&!pending('tc'))aiBuild(p,'tc',home.x,home.y,0,10);
 if(nextPh&&!phQ&&gatherers>=phT&&phaseReady(p,nextPh)&&tcs.length){const c=costOf(p,TECH[nextPh].cost,'t');if(afford(p,c)){pay(p,c);tcs[0].queue.push({t:nextPh,p:0})}}
 if(vils.length<ai.vilT)for(const tc of tcs){if(tc.queue.length<2&&!(phQ&&tc.queue.length)){const c=costOf(p,U.villager.cost,'u','villager');if(afford(p,c)&&!(ai.saving&&R.food<c.food+TECH[nextPh].cost.food*.5)){pay(p,c);tc.queue.push({u:'villager',p:0})}}}
 const queued=mb.reduce((a,b)=>a+b.queue.filter(q=>q.u).reduce((s,q)=>s+(q.n||1),0),0);const room=p.popCap-p.pop-queued;
 if(room<=5+(p.pop>40?5:0)&&p.popCap<S.popMax&&mb.filter(b=>b.type==='house'&&b.built<1).length<(p.pop>30?2:1))aiBuild(p,'house',home.x,home.y,4,15);
 if(gatherers>=4&&!pending('storehouse')){for(const r of ['wood','gold','stone']){if(r!=='wood'&&gatherers<(r==='gold'?10:13))continue;const ri2=nearestRes(RT[r],home.x,home.y,24,false,false);if(ri2<0)continue;const rx=ri2%W,ry=(ri2/W)|0;
  if(!mb.some(b=>B[b.type].drop&&B[b.type].drop.indexOf(r)>=0&&rectDist(rx+.5,ry+.5,b.x,b.y,b.w,b.h)<6)){if(aiBuild(p,'storehouse',rx,ry,1,5))break}}}
 if(gatherers>=5&&!pending('farmstead')&&!has('farmstead').length){const bi=nearestRes(4,home.x,home.y,14,false,false);if(bi>=0)aiBuild(p,'farmstead',bi%W,(bi/W)|0,1,4);else if(gatherers>=8)aiBuild(p,'farmstead',home.x,home.y,4,9)}
 const fields=has('field');const berries=nearestRes(4,home.x,home.y,14,false,false)>=0;const hunt=nearestHunt({o},home.x,home.y,14);const foodV=vils.filter(u=>u.task&&(u.task.k==='field'||u.task.k==='hunt'||u.task.rt==='food')).length;
 const fieldCap=fields.length*5;if(gatherers>=7&&!pending('field')&&fields.length<Math.ceil(ai.vilT*.5/5)+1&&(fieldCap<foodV-6||(!berries&&!hunt&&fieldCap<foodV+3))&&R.wood>=(ai.saving?100:150)){const fs=has('farmstead',1)[0];const near=fs&&fields.length>=2?{x:fs.x+1,y:fs.y+1}:home;aiBuild(p,'field',near.x,near.y,3,9)}
 const wi=ai.dockWater??(ai.dockWater=(()=>{for(let r=4;r<=18;r++)for(let k=0;k<32;k++){const a=k/32*6.28;const x=Math.round(home.x+Math.cos(a)*r),y=Math.round(home.y+Math.sin(a)*r);if(x>=0&&y>=0&&x<W&&y<H&&ter[y*W+x]===1)return[x,y]}return null})());
 if(wi&&gatherers>=12&&!has('dock').length&&!pending('dock'))aiBuild(p,'dock',wi[0],wi[1],0,6);
 const docks=has('dock',1);if(docks.length){const boats=my.filter(u=>u.type==='fishboat').length,gal=my.filter(u=>u.type==='galley').length;const dk=docks[0];
  if(!dk.queue.length&&boats<(ai.diff?5:3)){const c=costOf(p,U.fishboat.cost,'u','fishboat');if(afford(p,c)&&room>0){pay(p,c);dk.queue.push({u:'fishboat',p:0})}}
  else if(!dk.queue.length&&p.phase>=1&&gal<ai.diff+1&&!ai.saving){const c=costOf(p,U.galley.cost,'u','galley');if(afford(p,c)&&room>0){pay(p,c);dk.queue.push({u:'galley',p:0})}}}
 if(!ai.saving||R.wood>600){
  if(gatherers>=10&&!has('barracks').length)aiBuild(p,'barracks',home.x,home.y,6,14);
  if(gatherers>=14&&!has('range').length)aiBuild(p,'range',home.x,home.y,6,15);
  if(gatherers>=17&&!has('stable').length)aiBuild(p,'stable',home.x,home.y,6,15);
  if(ai.pers==='rusher'&&gatherers>=7&&!has('barracks').length)aiBuild(p,'barracks',home.x,home.y,6,14);
  if(ai.pers==='turtle'&&gatherers>=9&&has('sentry').length<2+ai.diff&&R.wood>150)aiBuild(p,'sentry',home.x+(Math.random()-.5)*16,home.y+(Math.random()-.5)*16,6,10);
  if(gatherers>=12&&has('sentry').length<ai.diff&&R.wood>250)aiBuild(p,'sentry',home.x+(Math.random()-.5)*14,home.y+(Math.random()-.5)*14,5,10);
  if(p.phase>=1){for(const [t,g] of [['smith',20],['temple',24],['market',26],['workshop',28]]){if(gatherers>=g&&!has(t).length&&!pending(t)){aiBuild(p,t,home.x,home.y,6,16);break}}
   if(ai.diff>0&&!has('castle').length&&!pending('castle')&&R.stone>=700)aiBuild(p,'castle',home.x,home.y,7,15);
   if(ai.pers==='turtle'&&has('tower').length<2+ai.diff*2&&R.stone>=250)aiBuild(p,'tower',home.x+(Math.random()-.5)*18,home.y+(Math.random()-.5)*18,6,12);
   if(ai.diff===2&&has('tower').length<3&&R.stone>=300)aiBuild(p,'tower',home.x+(Math.random()-.5)*16,home.y+(Math.random()-.5)*16,5,11);
   if(has('barracks').length<2&&R.wood>700)aiBuild(p,'barracks',home.x,home.y,7,17)}
  if(p.phase>=2&&ai.diff===2&&S.wonderWin&&!has('wonder').length&&R.wood>1300&&R.stone>1200&&R.gold>1200)aiBuild(p,'wonder',home.x,home.y,6,16)}
 if(!ai.saving){for(const tid of ['loom','gather','axe','collar','stonem','goldm','treadmill','wheel','forge','fletch','scale','saw','plow','goldm2','nets','masonry','iron','bodkin','chain','barding','herbal','conscript','architecture','shipwright','caravan','blast','plate','bracer','crop','twoman','deepmine','hoardings','royal','banking','spikes','boil','murder']){
  const t=TECH[tid];if(!techOk(p,tid))continue;if((tid==='loom'||tid==='treadmill')&&gatherers<12)continue;const bt=Object.keys(B).find(k=>B[k].tech&&B[k].tech.indexOf(tid)>=0);
  const b=has(bt,1).find(x=>!x.queue.length);if(!b)continue;const c=costOf(p,t.cost,'t');if(R4.every(r=>(R[r]||0)>=(c[r]||0)*1.3)){pay(p,c);b.queue.push({t:tid,p:0});break}}}
 if(!ai.saving||army.length<6||R.food>1000){const prod=mb.filter(b=>b.built>=1&&B[b.type].train&&b.type!=='corral'&&b.type!=='dock'&&b.type!=='market'&&b.type!=='temple'&&b.queue.length<1);let rm=room;
  for(const b of prod){if(rm<=0)break;let opts=trainList(b).filter(t=>unitOk(p,t,b)&&t!=='villager');if(!opts.length)continue;
   let pick=opts[Math.floor(Math.random()*opts.length)];if(b.type==='tc'){if(vils.length<ai.vilT*.6)continue;pick=Math.random()<.5?'spear':'archer'}
   if(b.type==='workshop'&&army.filter(u=>ud(u).tag==='sie').length>=3)continue;if(b.type==='castle'){const h=opts.find(t=>isHero(t));pick=h&&Math.random()<.4?h:opts.find(t=>U[t].uu)||pick}
   const n=ai.diff>0&&U[pick].tag!=='sie'&&!isHero(pick)&&rm>=5&&R.food>600?5:1;const c0=costOf(p,U[pick].cost,'u',pick);const c={};for(const r in c0)c[r]=c0[r]*n;if(afford(p,c)){pay(p,c);b.queue.push({u:pick,p:0,n});rm-=n}}}
 if(ai.t%12===0){const rich=R4.filter(r=>r!=='gold'&&R[r]>1400).sort((a,b)=>R[b]-R[a])[0],poor=R4.filter(r=>r!=='gold'&&R[r]<150)[0];const mk=has('market',1)[0];if(mk){if(rich)barter(p,rich,false);if(poor&&R.gold>500)barter(p,poor,true)}
  const rr=R4.filter(r=>R[r]>1000).sort((a,b)=>R[b]-R[a])[0],pr=R4.filter(r=>R[r]<150)[0];if(rr&&pr){let k=0;for(const v of vils){if(k>=2)break;const t=v.task;if(t&&((t.k==='gather'&&t.rt===rr)||(rr==='food'&&(t.k==='field'||t.k==='hunt')))&&t.ph!=='ret'){v.task=null;v.path=null;k++}}}}
 let threat=null,td=19;for(const e of units){if(!isEnemy(o,e.o)||e.gar||!isMil(e))continue;const d=Math.hypot(e.x-home.x,e.y-home.y);if(d<td){td=d;threat=e}}
 for(const b of mb)if(b.capT&&S.t-b.capT<2){let bd2=9;for(const e of units){if(!isEnemy(o,e.o)||e.gar)continue;const d=rectDist(e.x,e.y,b.x,b.y,b.w,b.h);if(d<bd2){bd2=d;threat=e;td=0}}}
 if(threat&&!peace()){for(const u of army){if(ai.waves.has(u.id)&&td>8)continue;if(!u.task||u.task.auto||u.task.k==='move'||u.task.k==='gather'||u.task.k==='hunt'){if(u.task&&u.task.k==='gather')u.carry=0;u.task={k:'atk',id:threat.id,auto:1}}}}
 if(ai.diff>0&&threat&&!p.bell&&units.filter(e=>isEnemy(o,e.o)&&isMil(e)&&Math.hypot(e.x-home.x,e.y-home.y)<12).length>=6&&tcs.length)ringBell(o,true);
 if(p.bell&&(!threat||td>16))ringBell(o,false);
 const all=[...vils,...cits];for(const v of all)if(!v.task&&!v.gar&&!ai.waves.has(v.id))aiAssign(p,v,home,all);
 for(const bt of my.filter(u=>u.type==='fishboat'&&!u.task)){const i=nearestRes(5,bt.x,bt.y,30,false,true);if(i>=0)bt.task={k:'gather',rt:'fish',tx:i%W,ty:(i/W)|0}}
 for(const g of my.filter(u=>u.type==='galley'&&!u.task)){const e=nearestEnemy(g,25,true);if(e)g.task={k:'atk',id:e.id,auto:1}}
 for(const id of [...ai.waves])if(!ents.has(id))ai.waves.delete(id);
 aiRaid(p,army,home);aiRetreat(p,home);aiBreach(p);aiMode(p,army,home);if(p.i&&myTeam(p.i))aiAlly(p,army,home);
 if(!peace()&&ai.t>=ai.nextWave&&army.length>=ai.wave&&ai.t>=ai.regroup){ai.nextWave=ai.t+ai.gap;ai.wave+=3;ai.waveN=0;let k=0;for(const u of army){if(ud(u).cit&&k>=army.length*.7)continue;if(ai.raid.includes(u.id))continue;ai.waves.add(u.id);ai.waveN++;k++;if(u.task&&u.task.k==='gather')u.carry=0;u.task=null}}
 for(const id of ai.waves){const u=ents.get(id);if(!u||u.gar)continue;if(u.task&&u.task.k==='atk')continue;const t=aiNearestEnemyBld(p,{x:u.x,y:u.y});if(t)u.task={k:'atk',id:t.id,wave:1,dmg:ud(u).tag==='sie'?1:0};else{const e=nearestEnemy(u,999,false);if(e)u.task={k:'atk',id:e.id,wave:1}}}}

/* ---------- placement ---------- */
function swapWall(type,x,y,o){if(!B[type].gate||x<0||y<0||x>=W||y>=H)return null;const w=ents.get(occ[y*W+x]);if(!w||w.k!=='b'||w.o!==o||w.built<1)return null;const wood=type==='pgate';if(wood?w.type!=='palisade':(w.type!=='wall'&&w.type!=='palisade'))return null;return w}
function canPlace(type,x,y,o,margin){const d=B[type];if(x<0||y<0||x+d.w>W||y+d.h>H)return false;if(swapWall(type,x,y,o))return true;let landN=0;
 for(let yy=y;yy<y+d.h;yy++)for(let xx=x;xx<x+d.w;xx++){const i=yy*W+xx;if(block[i]||occ[i])return false;if(d.water?ter[i]!==1:ter[i]===1)return false;if(ter[i]===4)return false;if(o===0&&!explored[i])return false;if(!d.any&&o!==0&&terr[i]!==o+1)return false}
 if(d.water){for(let yy=y-1;yy<=y+d.h;yy++)for(let xx=x-1;xx<=x+d.w;xx++){if(xx<0||yy<0||xx>=W||yy>=H)continue;const i=yy*W+xx;if(ter[i]!==1&&!block[i])landN++}if(!landN)return false}
 if(margin){for(let yy=y-1;yy<=y+d.h;yy++)for(let xx=x-1;xx<=x+d.w;xx++){if(xx<0||yy<0||xx>=W||yy>=H)return false;if(yy>=y&&yy<y+d.h&&xx>=x&&xx<x+d.w)continue;const i=yy*W+xx;if(block[i]>=2)return false;if(occ[i]&&!B[ents.get(occ[i]).type].flat)return false}}
 for(const u of units)if(u.o!==o&&!u.gar&&u.x>x&&u.x<x+d.w&&u.y>y&&u.y<y+d.h)return false;
 return true}
function wallLine(ax,ay,bx,by){const out=[[ax,ay]];let x=ax,y=ay;const dx=Math.abs(bx-ax),dy=-Math.abs(by-ay),sx=Math.sign(bx-ax),sy=Math.sign(by-ay);let err=dx+dy,n=0;
 while((x!==bx||y!==by)&&n++<300){const e2=2*err;let mx=false,my=false;if(e2>=dy){err+=dy;mx=true}if(e2<=dx){err+=dx;my=true}if(mx&&my)out.push([x+sx,y]);if(mx)x+=sx;if(my)y+=sy;out.push([x,y])}
 return out}
function selWorkers(){return sel.map(id=>ents.get(id)).filter(u=>u&&u.k==='u'&&u.o===0&&canBuild(u))}
function assignBuild(ws,ids){if(!ids.length)return;for(const v of ws){if(v.task&&v.task.k==='build'&&ents.has(v.task.id)){const q=v.task.q||(v.task.q=[]);for(const id of ids)if(id!==v.task.id&&!q.includes(id))q.push(id);continue}const prev=v.task&&(v.task.k==='gather'||v.task.k==='field'||v.task.k==='hunt')?v.task:null;if(prev&&prev.ph!=='ret')prev.ph=null;
 let best=ids[0],bd=1e9;for(const id of ids){const e=ents.get(id);const d=rectDist(v.x,v.y,e.x,e.y,e.w,e.h);if(d<bd){bd=d;best=id}}
 v.task={k:'build',id:best,q:ids.filter(i=>i!==best),prev};v.path=null}}
function placeWhy(type,x,y){const d=B[type];for(let yy=y;yy<y+d.h;yy++)for(let xx=x;xx<x+d.w;xx++){if(xx<0||yy<0||xx>=W||yy>=H)return'off the map';const i=yy*W+xx;if(!explored[i])return'unexplored ground';if(d.water&&ter[i]!==1)return'docks go on water next to the shore';if(!d.water&&ter[i]===1)return'water';if(ter[i]===4)return'rocky mountain';if(block[i]||occ[i])return'something is in the way';}return'something is in the way'}
function confirmPlace(){if(!placing||placing.tx==null)return;const p=P[0],d=B[placing.type];const ws=selWorkers();
 if(d.wall||d.road){if(placing.ax==null){placing.ax=placing.tx;placing.ay=placing.ty}
  const tiles=wallLine(placing.ax,placing.ay,placing.tx,placing.ty);const ids=[];
  for(const [x,y] of tiles){if(!canPlace(placing.type,x,y,0,false))continue;if(!afford(p,d.cost)){toast('Not enough '+Object.keys(d.cost)[0]+' for the whole '+(d.road?'road':'wall'),'bad');break}pay(p,d.cost);const sw=swapWall(placing.type,x,y,0);if(sw)kill(sw,0,true);ids.push(mkBld(placing.type,0,x,y,false).id)}
  if(!ids.length){toast("Can't build there",'bad');placing.ax=placing.ay=null;lastSig='';return}assignBuild(ws,ids);placing=null;panelDirty=true;return}
 if(!canPlace(placing.type,placing.tx,placing.ty,0,false)){toast("Can't build there: "+placeWhy(placing.type,placing.tx,placing.ty),'bad');return}
 if(!afford(p,d.cost)){toast('Need '+need(p,d.cost),'bad');return}
 pay(p,d.cost);const b=mkBld(placing.type,0,placing.tx,placing.ty,false);assignBuild(ws,[b.id]);
 fx.push({k:'ring',x:b.x+b.w/2,y:b.y+b.h/2,t:0,life:.6,c:'#7fe06a'});placing=null;panelDirty=true}

/* raids on villagers, retreats when a wave is beaten, and breaching walls */
function aiRaid(p,army,home){const ai=p.ai;ai.raid=ai.raid.filter(id=>ents.has(id));
 if(!ai.raid.length&&!peace()&&ai.t>=ai.nextRaid){ai.nextRaid=ai.t+[0,300,200][ai.diff]*(ai.pers==='rusher'?.7:1)+Math.random()*80;
  const fast=army.filter(u=>!ai.waves.has(u.id)&&!ud(u).cit&&ud(u).tag!=='sie'&&!u.gar&&(ud(u).tag==='cav'||uRng(u)>0)).sort((a,b)=>uSpd(b)-uSpd(a)).slice(0,3+ai.diff);
  if(fast.length>=3){let best=null,bs=-1;for(const v of units){if(!isEnemy(p.i,v.o)||ud(v).tag!=='vil'||v.gar)continue;let dt=1e9;for(const b of blds)if(b.o===v.o&&(b.type==='tc'||b.type==='castle'||b.type==='tower'))dt=Math.min(dt,Math.hypot(b.x-v.x,b.y-v.y));
    const sc=Math.min(dt,25)-Math.hypot(v.x-home.x,v.y-home.y)*.15;if(sc>bs){bs=sc;best=v}}
   if(best){ai.raid=fast.map(u=>u.id);ai.raidT=ai.t;for(const u of fast){u.task={k:'atk',id:best.id,raid:1};u.path=null}}}}
 if(!ai.raid.length)return;const rs=ai.raid.map(id=>ents.get(id));let avgHp=0;for(const u of rs)avgHp+=u.hp/uMaxHp(u);avgHp/=rs.length;
 const over=ai.t-ai.raidT>75||avgHp<.45;for(const u of rs){if(over){if(!u.task||u.task.k!=='move'){u.task={k:'move',x:home.x+(Math.random()-.5)*4,y:home.y+(Math.random()-.5)*4};u.path=null}continue}
  if(!u.task||u.task.k!=='atk'){let tv=null,td=14;for(const v of units){if(!isEnemy(p.i,v.o)||v.gar||ud(v).tag!=='vil')continue;const d=Math.hypot(v.x-u.x,v.y-u.y);if(d<td){td=d;tv=v}}if(tv){u.task={k:'atk',id:tv.id,raid:1};u.path=null}}}
 if(over&&rs.every(u=>Math.hypot(u.x-home.x,u.y-home.y)<6||!u.task))ai.raid=[]}
function aiRetreat(p,home){const ai=p.ai;if(!ai.waves.size||ai.waveN<6)return;const ws=[...ai.waves].map(id=>ents.get(id)).filter(Boolean);
 if(ws.length>=ai.waveN*.35)return;let cx=0,cy=0;for(const u of ws){cx+=u.x;cy+=u.y}cx/=ws.length;cy/=ws.length;let foe=0;for(const e of units)if(isEnemy(p.i,e.o)&&isMil(e)&&!e.gar&&Math.hypot(e.x-cx,e.y-cy)<10)foe++;
 if(foe<ws.length*1.5)return;for(const u of ws){u.task={k:'move',x:home.x+(Math.random()-.5)*5,y:home.y+(Math.random()-.5)*5};u.path=null}ai.waves.clear();ai.waveN=0;ai.regroup=ai.t+90}
function aiBreach(p){const ai=p.ai;if(!ai.waves.size||ai.t%3)return;for(const id of ai.waves){const u=ents.get(id);if(!u||!u.task||u.task.k!=='atk'||!u.partial)continue;const cur=ents.get(u.task.id);if(cur&&cur.k==='b'&&B[cur.type].wall)continue;
 let wb=null,wd=14;for(const b of blds){if(!isEnemy(p.i,b.o)||!B[b.type].wall)continue;const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h)+(b.type==='gate'?-3:0);if(d<wd){wd=d;wb=b}}if(wb){u.task={k:'atk',id:wb.id,wave:1,breach:1};u.path=null}}}
/* ---------- sprites: isometric 3D kit ---------- */
const sprC=new Map();
const HW=32,HH=16,ZS=32;
const LV=(()=>{const v=[.3,.85,1.15],n=Math.hypot(...v);return v.map(a=>a/n)})();
const VV=[.577,.577,.577];
const PJ=(x,y,z)=>[(x-y)*HW,(x+y)*HH-(z||0)];
function shade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;if(f<0){r*=1+f;g*=1+f;b*=1+f}else{r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}const hx=v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0');return'#'+hx(r)+hx(g)+hx(b)}
function mul(hex,f){const n=parseInt(hex.slice(1),16);return`rgb(${Math.min(255,(n>>16)*f)|0},${Math.min(255,(n>>8&255)*f)|0},${Math.min(255,(n&255)*f)|0})`}
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function defineEdges(c,px,col){const g=c.getContext('2d'),w=c.width,h=c.height;const id=g.getImageData(0,0,w,h),d=id.data;const m=new Uint8Array(w*h);
 for(let i=0;i<w*h;i++)m[i]=d[i*4+3]>150?1:0;const n=parseInt(col.slice(1),16),cr=n>>16,cg=n>>8&255,cb=n&255;const r2=px*px+.5;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(m[i])continue;let hit=false;
  for(let dy=-px;dy<=px&&!hit;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-px;dx<=px;dx++){if(dx*dx+dy*dy>r2)continue;const xx=x+dx;if(xx>=0&&xx<w&&m[yy*w+xx]){hit=true;break}}}
  if(hit){const o=i*4,a=d[o+3]/255,k=.9;d[o]=cr*k+d[o]*(1-k)*a;d[o+1]=cg*k+d[o+1]*(1-k)*a;d[o+2]=cb*k+d[o+2]*(1-k)*a;d[o+3]=255*Math.max(k,a)}}
 g.putImageData(id,0,0);return c}
function fnorm(p,c){const u=[(p[1][0]-p[0][0])*ZS,(p[1][1]-p[0][1])*ZS,p[1][2]-p[0][2]],v=[(p[2][0]-p[0][0])*ZS,(p[2][1]-p[0][1])*ZS,p[2][2]-p[0][2]];
 let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(n[0],n[1],n[2])||1;n=[n[0]/l,n[1]/l,n[2]/l];
 if(c){let fx=0,fy=0,fz=0;for(const q of p){fx+=q[0];fy+=q[1];fz+=q[2]}fx/=p.length;fy/=p.length;fz/=p.length;if(n[0]*(fx-c[0])*ZS+n[1]*(fy-c[1])*ZS+n[2]*(fz-c[2])<0)n=[-n[0],-n[1],-n[2]]}return n}
function Q(p,s,t){const a0=p[0][0]+(p[1][0]-p[0][0])*s,a1=p[0][1]+(p[1][1]-p[0][1])*s,a2=p[0][2]+(p[1][2]-p[0][2])*s,b0=p[3][0]+(p[2][0]-p[3][0])*s,b1=p[3][1]+(p[2][1]-p[3][1])*s,b2=p[3][2]+(p[2][2]-p[3][2])*s;return PJ(a0+(b0-a0)*t,a1+(b1-a1)*t,a2+(b2-a2)*t)}
function seg(g,p,s0,t0,s1,t1){const a=Q(p,s0,t0),b=Q(p,s1,t1);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1])}
function sub(g,p,s0,s1,t0,t1){const a=Q(p,s0,t0),b=Q(p,s1,t0),c=Q(p,s1,t1),d=Q(p,s0,t1);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.lineTo(d[0],d[1]);g.closePath()}
let FNS=false;const flen=(a,c)=>Math.hypot((c[0]-a[0])*ZS,(c[1]-a[1])*ZS,c[2]-a[2]);
function face(g,p,col,tex,c,o){if(p.length===3)p=[p[0],p[1],p[2],p[2]];const n=fnorm(p,c);if(n[0]*VV[0]+n[1]*VV[1]+n[2]*VV[2]<=.002&&!(o&&o.force))return false;
 const b=.52+.55*Math.max(0,n[0]*LV[0]+n[1]*LV[1]+n[2]*LV[2]);const s=p.map(q=>PJ(q[0],q[1],q[2]));
 g.beginPath();g.moveTo(s[0][0],s[0][1]);for(let i=1;i<4;i++)g.lineTo(s[i][0],s[i][1]);g.closePath();g.fillStyle=mul(col,b);g.fill();
 if(tex){g.save();g.clip();texture(g,p,tex,col,b);g.restore()}
 if(!(o&&o.ns)&&!FNS){g.beginPath();g.moveTo(s[0][0],s[0][1]);for(let i=1;i<4;i++)g.lineTo(s[i][0],s[i][1]);g.closePath();g.strokeStyle=mul(col,b*.5);g.lineWidth=.7;g.stroke()}
 return true}
function texture(g,p,k,col,b){const Lu=flen(p[0],p[1]),Lv=Math.max(flen(p[0],p[3]),flen(p[1],p[2]));const dark=mul(col,b*.6),lite=mul(col,Math.min(1.4,b*1.22));g.lineWidth=.7;
 if(k==='stone'){const rows=Math.max(2,Math.round(Lv/5.5)),cols=Math.max(2,Math.round(Lu/9));g.fillStyle='rgba(255,255,255,.08)';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if((r*7+c*13)%4===0){sub(g,p,(c+(r%2?.5:0))/cols,(c+.9+(r%2?.5:0))/cols,r/rows,(r+.9)/rows);g.fill()}
  g.fillStyle='rgba(0,0,0,.07)';for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if((r*5+c*3)%5===0){sub(g,p,c/cols,(c+.9)/cols,r/rows,(r+.9)/rows);g.fill()}
  g.strokeStyle=dark;g.beginPath();for(let r=1;r<rows;r++)seg(g,p,0,r/rows,1,r/rows);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const s=(c+(r%2?.5:0))/cols;if(s>0&&s<1)seg(g,p,s,r/rows,s,(r+1)/rows)}g.stroke()}
 else if(k==='plank'){g.strokeStyle=dark;g.beginPath();const n=Math.max(3,Math.round(Lu/4));for(let i=1;i<n;i++)seg(g,p,i/n,0,i/n,1);g.stroke();g.strokeStyle=lite;g.globalAlpha=.4;g.beginPath();for(let i=0;i<n;i++)seg(g,p,(i+.3)/n,0,(i+.3)/n,1);g.stroke();g.globalAlpha=1}
 else if(k==='log'){const n=Math.max(3,Math.round(Lv/4));for(let i=0;i<n;i++){g.strokeStyle=dark;g.beginPath();seg(g,p,0,i/n,1,i/n);g.stroke();g.strokeStyle=lite;g.globalAlpha=.5;g.beginPath();seg(g,p,0,(i+.5)/n,1,(i+.5)/n);g.stroke();g.globalAlpha=1}}
 else if(k==='timber'){g.fillStyle='rgba(120,110,95,.55)';sub(g,p,0,1,0,.22);g.fill();g.strokeStyle='#4a2f1a';g.lineWidth=1.5;g.beginPath();seg(g,p,0,.22,1,.22);seg(g,p,0,.6,1,.6);seg(g,p,0,.97,1,.97);const n=Math.max(2,Math.round(Lu/13));for(let i=0;i<=n;i++)seg(g,p,i/n,.22,i/n,1);for(let i=0;i<n;i++){if(i%2)seg(g,p,i/n,.6,(i+1)/n,.97);else seg(g,p,(i+1)/n,.6,i/n,.97)}g.stroke()}
 else if(k==='east'){g.strokeStyle='#3b2a20';g.lineWidth=1.5;g.beginPath();const n=Math.max(2,Math.round(Lu/12));for(let i=0;i<=n;i++)seg(g,p,i/n,0,i/n,1);seg(g,p,0,.95,1,.95);seg(g,p,0,.16,1,.16);g.stroke();g.fillStyle='#5a4a40';sub(g,p,0,1,0,.15);g.fill()}
 else if(k==='sand'){g.strokeStyle=mul(col,b*.86);g.beginPath();const rows=Math.max(2,Math.round(Lv/7));for(let r=1;r<rows;r++)seg(g,p,0,r/rows,1,r/rows);g.stroke();g.fillStyle='rgba(255,255,255,.12)';sub(g,p,0,1,.9,1);g.fill()}
 else if(k==='tile'){const rows=Math.max(3,Math.round(Lv/3.4)),cols=Math.max(3,Math.round(Lu/3.6));g.strokeStyle=dark;g.beginPath();for(let r=1;r<rows;r++)seg(g,p,0,r/rows,1,r/rows);g.stroke();
  g.globalAlpha=.55;g.beginPath();for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const s=(c+(r%2?.5:0))/cols;if(s>0&&s<1)seg(g,p,s,r/rows,s,(r+.8)/rows)}g.stroke();
  g.strokeStyle=lite;g.globalAlpha=.4;g.beginPath();for(let r=0;r<rows;r++)seg(g,p,0,(r+.2)/rows,1,(r+.2)/rows);g.stroke();g.globalAlpha=1}
 else if(k==='thatch'){let sd=Math.round(Lu*7+Lv*3);const rnd2=()=>{sd=(sd*9301+49297)%233280;return sd/233280};const n=Math.round(Lu*Lv/7);g.lineWidth=.8;
  for(let i=0;i<n;i++){const s=rnd2(),t=rnd2();g.strokeStyle=rnd2()<.5?dark:lite;g.globalAlpha=.7;g.beginPath();seg(g,p,s,t,s+(rnd2()-.5)*.04,Math.min(1,t+.14));g.stroke()}
  g.globalAlpha=.5;g.strokeStyle=dark;g.lineWidth=1.1;g.beginPath();for(let r=1;r<5;r++)seg(g,p,0,r/5,1,r/5);g.stroke();g.globalAlpha=1}
 else if(k==='slate'){const rows=Math.max(3,Math.round(Lv/3.2));g.strokeStyle=dark;g.beginPath();for(let r=1;r<rows;r++)seg(g,p,0,r/rows,1,r/rows);g.stroke();g.strokeStyle=lite;g.globalAlpha=.5;g.beginPath();const cols=Math.max(3,Math.round(Lu/3));for(let c=1;c<cols;c++)seg(g,p,c/cols,0,c/cols,1);g.stroke();g.globalAlpha=1}
 if(k!=='tile'&&k!=='thatch'&&k!=='slate'){const A=Q(p,.5,0),Bq=Q(p,.5,.4);const gr=g.createLinearGradient(A[0],A[1],Bq[0],Bq[1]);gr.addColorStop(0,'rgba(0,0,0,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;sub(g,p,0,1,0,.4);g.fill()}}
function box3(g,x,y,z,w,d,h,col,tex,topCol,topTex,feat){const c=[x+w/2,y+d/2,z+h/2];
 const fx=[[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],fy=[[x+w,y+d,z],[x,y+d,z],[x,y+d,z+h],[x+w,y+d,z+h]],top=[[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];
 if(face(g,fx,col,tex,c)&&feat&&feat.x)feat.x(fx);if(face(g,fy,col,tex,c)&&feat&&feat.y)feat.y(fy);if(topCol)face(g,top,topCol,topTex,c);return{fx,fy,top}}
function door(g,f,w,h,s,col){g.fillStyle='#22140a';sub(g,f,s-w/2,s+w/2,0,h);g.fill();g.strokeStyle='#0f0804';g.lineWidth=.9;g.stroke();g.fillStyle='rgba(120,80,40,.6)';sub(g,f,s-w/2+.02,s+w/2-.02,0,h*.9);g.fill();g.strokeStyle='rgba(30,16,6,.8)';g.lineWidth=.6;g.beginPath();seg(g,f,s,0,s,h*.9);g.stroke();if(col){g.fillStyle=col;sub(g,f,s-w/2,s+w/2,h,h+.07);g.fill()}}
function win(g,f,s,px,t0=.45,t1=.75){const w=(px||4.5)/flen(f[0],f[1]);g.fillStyle='#24160c';sub(g,f,s-w/2,s+w/2,t0,t1);g.fill();g.fillStyle='rgba(255,205,120,.5)';sub(g,f,s-w/2,s,t0,(t0+t1)/2);g.fill();g.strokeStyle='rgba(25,14,6,.85)';g.lineWidth=.8;sub(g,f,s-w/2,s+w/2,t0,t1);g.stroke();g.fillStyle='rgba(255,255,255,.25)';sub(g,f,s-w/2-.01,s+w/2+.01,t0-.04,t0);g.fill()}
function gable(g,x,y,z,w,d,rh,ov,col,tex,wcol,axis){const M=axis==='y'?(a,b,c)=>[b,a,c]:(a,b,c)=>[a,b,c];let X=x,Y=y,Wd=w,D=d;if(axis==='y'){X=y;Y=x;Wd=d;D=w}
 const zr=z+rh,ze=z-ov/(D/2)*rh,ex0=X-ov,ex1=X+Wd+ov,ey0=Y-ov,ey1=Y+D+ov,ym=Y+D/2;const c=M(X+Wd/2,Y+D/2,z+rh/3);
 face(g,[M(ex1,ey0,ze),M(ex0,ey0,ze),M(ex0,ym,zr),M(ex1,ym,zr)],col,tex,c);face(g,[M(X,Y+D,z),M(X,Y,z),M(X,ym,zr)],wcol,null,c);
 const e1=[M(X+Wd,Y,z),M(X+Wd,Y+D,z),M(X+Wd,ym,zr)];face(g,e1,wcol,null,c);face(g,[M(ex0,ey1,ze),M(ex1,ey1,ze),M(ex1,ym,zr),M(ex0,ym,zr)],col,tex,c);
 const a=PJ(...M(ex0,ym,zr)),b=PJ(...M(ex1,ym,zr));g.strokeStyle='rgba(255,240,215,.4)';g.lineWidth=1.3;g.beginPath();g.moveTo(a[0],a[1]-.4);g.lineTo(b[0],b[1]-.4);g.stroke();return{e1,M,X,Y,Wd,D,zr,ym}}
function hip(g,x,y,z,w,d,rh,ov,col,tex,up){const ex0=x-ov,ex1=x+w+ov,ey0=y-ov,ey1=y+d+ov,ze=z-ov*.6*rh/Math.max(.3,Math.min(w,d)/2);let r0,r1;
 if(w>=d){r0=[x+d/2,y+d/2,z+rh];r1=[x+w-d/2,y+d/2,z+rh]}else{r0=[x+w/2,y+w/2,z+rh];r1=[x+w/2,y+d-w/2,z+rh]}const c=[x+w/2,y+d/2,z];
 let N,Wf,Sf,E;if(w>=d){N=[[ex1,ey0,ze],[ex0,ey0,ze],r0,r1];Wf=[[ex0,ey0,ze],[ex0,ey1,ze],r0,r0];Sf=[[ex0,ey1,ze],[ex1,ey1,ze],r1,r0];E=[[ex1,ey1,ze],[ex1,ey0,ze],r1,r1]}
 else{N=[[ex1,ey0,ze],[ex0,ey0,ze],r0,r0];Wf=[[ex0,ey0,ze],[ex0,ey1,ze],r1,r0];Sf=[[ex0,ey1,ze],[ex1,ey1,ze],r1,r1];E=[[ex1,ey1,ze],[ex1,ey0,ze],r0,r1]}
 face(g,N,col,tex,c);face(g,Wf,col,tex,c);face(g,E,col,tex,c);face(g,Sf,col,tex,c);
 g.strokeStyle='rgba(255,240,215,.3)';g.lineWidth=1.1;g.beginPath();for(const [a,b] of [[[ex1,ey1,ze],r1],[[ex0,ey1,ze],w>=d?r0:r1],[[ex1,ey0,ze],w>=d?r1:r0]]){const A=PJ(...a),Bp=PJ(...b);g.moveTo(A[0],A[1]);g.lineTo(Bp[0],Bp[1])}g.stroke();
 if(up){g.strokeStyle=mul(col,.7);g.lineWidth=2.2;g.lineCap='round';for(const q of [[ex0,ey1],[ex1,ey1],[ex1,ey0],[ex0,ey0]]){const A=PJ(q[0],q[1],ze),dx=(q[0]-(x+w/2))-(q[1]-(y+d/2));g.beginPath();g.moveTo(A[0],A[1]);g.quadraticCurveTo(A[0]+Math.sign(dx)*4,A[1],A[0]+Math.sign(dx)*6,A[1]-6);g.stroke()}g.lineCap='butt'}}
function cyl(g,cx,cy,z,r,h,col,tex,topCol){const n=14,c=[cx,cy,z+h/2],pts=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}
 for(let i=0;i<n;i++){const a=pts[i],b=pts[(i+1)%n];face(g,[[a[0],a[1],z],[b[0],b[1],z],[b[0],b[1],z+h],[a[0],a[1],z+h]],col,tex,c,{ns:1})}
 if(topCol){const s=pts.map(p=>PJ(p[0],p[1],z+h));g.beginPath();g.moveTo(s[0][0],s[0][1]);for(const q of s)g.lineTo(q[0],q[1]);g.closePath();g.fillStyle=mul(topCol,1);g.fill();g.strokeStyle=mul(topCol,.5);g.lineWidth=.7;g.stroke()}}
function cone(g,cx,cy,z,r,h,col,tex){const n=14,c=[cx,cy,z+h/3];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;face(g,[[cx+Math.cos(a)*r,cy+Math.sin(a)*r,z],[cx+Math.cos(b)*r,cy+Math.sin(b)*r,z],[cx,cy,z+h]],col,tex,c,{ns:1})}}
function dome(g,cx,cy,z,r,col){const lat=6,lon=16,R=r*ZS,c=[cx,cy,z];for(let i=0;i<lat;i++){const p0=i/lat*Math.PI/2,p1=(i+1)/lat*Math.PI/2;for(let j=0;j<lon;j++){const a0=j/lon*Math.PI*2,a1=(j+1)/lon*Math.PI*2;
 const pt=(p,a)=>[cx+Math.cos(a)*Math.cos(p)*r,cy+Math.sin(a)*Math.cos(p)*r,z+Math.sin(p)*R*.95];face(g,[pt(p0,a0),pt(p0,a1),pt(p1,a1),pt(p1,a0)],col,null,c,{ns:1})}}
 const t=PJ(cx,cy,z+R*.95);g.strokeStyle='#e8c15a';g.lineWidth=1.6;g.beginPath();g.moveTo(t[0],t[1]);g.lineTo(t[0],t[1]-7);g.stroke();g.fillStyle='#e8c15a';g.beginPath();g.arc(t[0],t[1]-7.5,1.6,0,7);g.fill()}
function banner(g,x,y,z,col,h=18){const p=PJ(x,y,z);g.strokeStyle='#2a1c10';g.lineWidth=1.5;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0],p[1]-h);g.stroke();
 g.fillStyle=col;g.beginPath();g.moveTo(p[0],p[1]-h);g.quadraticCurveTo(p[0]+7,p[1]-h+1,p[0]+13,p[1]-h+3.5);g.quadraticCurveTo(p[0]+7,p[1]-h+6.5,p[0],p[1]-h+8);g.fill();g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=.6;g.stroke();
 g.fillStyle='#e8c15a';g.beginPath();g.arc(p[0],p[1]-h-1,1.4,0,7);g.fill()}
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}up.pop();lo.pop();return lo.concat(up)}
function shadow3(g,x,y,w,d,h){const k=h/ZS,ox=-LV[0]/LV[2]*k*.9,oy=-LV[1]/LV[2]*k*.9;const pts=[];for(const [a,b] of [[x,y],[x+w,y],[x+w,y+d],[x,y+d]]){pts.push(PJ(a,b,0),PJ(a+ox,b+oy,0))}
 const hp=hull(pts);g.fillStyle='rgba(20,15,5,.3)';g.beginPath();g.moveTo(hp[0][0],hp[0][1]);for(const q of hp)g.lineTo(q[0],q[1]);g.closePath();g.fill()}
function merlons(g,x,y,z,w,d,col,tex){const s=.25,m=.14;FNS=true;const list=[];for(let t=.04;t<w-.05;t+=s){list.push([x+t,y]);list.push([x+t,y+d-m])}for(let t=.04+s;t<d-.05;t+=s){list.push([x,y+t]);list.push([x+w-m,y+t])}
 list.sort((a,b)=>a[0]+a[1]-b[0]-b[1]);for(const [a,b] of list)box3(g,a,b,z,m,m,5,col,null,shade(col,.15));FNS=false}
const SP={
 west:{wall:'#e8dcc0',wallTex:'timber',big:'#b2aa9a',bigTex:'stone',stone:'#ada596',roof:'#a8492e',roofTex:'tile',kind:'gable',wood:'#6b4a2c'},
 east:{wall:'#efe9da',wallTex:'east',big:'#ece5d3',bigTex:'east',stone:'#b9b4a6',roof:'#4b5d67',roofTex:'slate',kind:'pagoda',wood:'#5a3a26'},
 mid:{wall:'#dcbf8b',wallTex:'sand',big:'#d6b884',bigTex:'sand',stone:'#ccb689',roof:'#e4cd9c',roofTex:null,kind:'flat',dome:'#3f8f93',wood:'#7a5636'},
 norse:{wall:'#8b6443',wallTex:'log',big:'#806048',bigTex:'plank',stone:'#9a958a',roof:'#9a8650',roofTex:'thatch',kind:'steep',wood:'#5e4129'}};
function sroof(g,st,x,y,z,w,d,rh,ov,axis,wcol){const k=st.kind;
 if(k==='gable')return gable(g,x,y,z,w,d,rh,ov,st.roof,st.roofTex,wcol,axis);
 if(k==='steep'){const r=gable(g,x,y,z,w,d,rh*1.45,ov+.04,st.roof,st.roofTex,wcol,axis);const a=PJ(...r.M(r.X+r.Wd,r.ym,r.zr));g.strokeStyle='#3a2716';g.lineWidth=2;g.lineCap='round';g.beginPath();g.moveTo(a[0]-6,a[1]+7);g.lineTo(a[0]+4,a[1]-6);g.moveTo(a[0]+6,a[1]+7);g.lineTo(a[0]-4,a[1]-6);g.stroke();g.lineCap='butt';return r}
 if(k==='pagoda')return hip(g,x,y,z,w,d,rh*.85,ov+.12,st.roof,st.roofTex,true);
 merlons(g,x,y,z,w,d,shade(wcol,-.06))}
function hut(g,st,x,y,w,d,h,rh,axis,o={}){const flat=st.kind==='flat';const wc=o.wall||st.wall;box3(g,x,y,0,w,d,h,wc,o.tex||st.wallTex,flat?st.roof:null,null,o.feat);sroof(g,st,x,y,h,w,d,rh,o.ov??.12,axis,wc)}
const ZMX={pgate:56,tc:150,castle:150,tower:140,palisade:46,wall:56,gate:78,field:10,farmstead:100,storehouse:70,dock:70,market:100,temple:170,sentry:100,outpost:80,corral:44,wonder:240,barracks:110,range:110,stable:100,smith:110,workshop:110,house:90};
function model(g,type,sk,col,tier=2,o=-1){let st=tierStyle(sk,tier);if(o===0&&tier>=1&&S&&S.opts&&ROOFS[S.opts.roof]&&st.kind!=='flat')st=Object.assign({},st,ROOFS[S.opts.roof]);const bigO=(feat)=>({wall:st.big,tex:st.bigTex,feat});
 switch(type){
 case 'house':{shadow3(g,.3,.35,1.4,1.3,40);hut(g,st,.3,.35,1.4,1.3,20,16,'x',{feat:{y:f=>{door(g,f,.2,.62,.3,col);win(g,f,.72)},x:f=>win(g,f,.5)}});
  if(st.kind==='flat'){box3(g,.45,.5,20,.6,.55,10,st.wall,st.wallTex,st.roof,null,{x:f=>win(g,f,.5,3.5,.3,.7)});merlons(g,.45,.5,30,.6,.55,st.wall)}else box3(g,1.2,.55,26,.18,.18,16,st.stone,'stone',shade(st.stone,-.2));break}
 case 'tc':{shadow3(g,.25,.25,3.5,3.5,90);hut(g,st,.25,.25,3.5,3.5,24,16,'x',bigO({y:f=>{door(g,f,.13,.62,.5,col);for(const s of [.16,.3,.7,.84])win(g,f,s,4)},x:f=>{for(const s of [.18,.39,.61,.82])win(g,f,s,4)}}));
  const kz=st.kind==='flat'?24:30;box3(g,1.3,1.3,kz,1.4,1.4,62-kz+12,st.big,st.bigTex,st.kind==='flat'?st.roof:null,null,{y:f=>{win(g,f,.35,5,.45,.75);win(g,f,.65,5,.45,.75)},x:f=>{win(g,f,.5,5,.45,.75)}});
  if(st.kind==='flat'){merlons(g,1.3,1.3,74,1.4,1.4,st.big);dome(g,2,2,74,.5,st.dome);banner(g,2.7,2.7,79,col,20)}else{sroof(g,st,1.3,1.3,74,1.4,1.4,20,.12,'y',st.big);banner(g,2,2,74+(st.kind==='steep'?30:21),col,20)}
  for(const [a,b] of [[.25,3.75],[3.75,3.75]]){const p=PJ(a,b,0);g.fillStyle='#4a3a2a';g.fillRect(p[0]-2,p[1]-8,4,8)}break}
 case 'farmstead':{shadow3(g,.3,.3,1.4,1.4,50);hut(g,st,.3,.3,1.4,1.4,28,18,'x',{feat:{y:f=>door(g,f,.2,.6,.5,col),x:f=>win(g,f,.5)}});
  const c=PJ(1,1.72,22);g.save();g.translate(c[0],c[1]);for(let a=0;a<4;a++){g.save();g.rotate(a*Math.PI/2+.35);g.fillStyle='#efe5c8';g.fillRect(3,-3.2,20,6.4);g.strokeStyle='#5a4028';g.lineWidth=1;g.strokeRect(3,-3.2,20,6.4);g.beginPath();for(let k=1;k<4;k++){g.moveTo(3+k*5,-3.2);g.lineTo(3+k*5,3.2)}g.stroke();g.strokeStyle='#4a3020';g.lineWidth=1.6;g.beginPath();g.moveTo(0,0);g.lineTo(24,0);g.stroke();g.restore()}g.fillStyle='#3a2716';g.beginPath();g.arc(0,0,2.6,0,7);g.fill();g.restore();
  box3(g,.5,1.75,0,.25,.25,6,'#c9b27a','plank','#e0cc90');box3(g,.85,1.78,0,.22,.22,5,'#c9b27a','plank','#e0cc90');break}
case 'storehouse':{shadow3(g,.25,.25,1.5,1.1,40);for(const [a,b] of [[.3,.3],[1.55,.3]])box3(g,a,b,0,.1,.1,18,st.wood,'plank',st.wood);box3(g,.25,.25,0,1.5,.4,18,st.wall,st.wallTex,null);
  for(const [a,b] of [[.3,1.2],[1.55,1.2]])box3(g,a,b,0,.1,.1,18,st.wood,'plank',st.wood);st.kind==='flat'?box3(g,.2,.2,18,1.6,1.15,3,st.roof,null,st.roof):sroof(g,st,.25,.25,18,1.5,1.05,12,.1,'x',st.wall);
  box3(g,.25,1.45,0,.85,.36,8,'#7a5230','log','#c49a64');box3(g,.35,1.5,8,.6,.28,5,'#7a5230','log','#c49a64');cone(g,1.45,1.62,0,.3,11,'#e2b632');cone(g,1.72,1.3,0,.26,9,'#a29e96');break}
 case 'barracks':{shadow3(g,.25,.35,2.5,1.7,60);hut(g,st,.25,.35,2.5,1.7,28,18,'x',bigO({y:f=>{door(g,f,.14,.62,.5,col);win(g,f,.18);win(g,f,.82)},x:f=>{win(g,f,.3);win(g,f,.7)}}));
  for(let k=0;k<4;k++){const a=PJ(.6+k*.28,2.55,0);g.strokeStyle='#5a3b22';g.lineWidth=1.3;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(a[0]+1,a[1]-22);g.stroke();g.fillStyle='#cfd3d8';g.beginPath();g.moveTo(a[0]+1,a[1]-26);g.lineTo(a[0]+2.6,a[1]-21);g.lineTo(a[0]-.6,a[1]-21);g.fill()}
  box3(g,.5,2.5,0,1.2,.08,10,st.wood,'plank',st.wood);banner(g,2.8,2.6,0,col,44);break}
 case 'range':{shadow3(g,.3,.25,1.5,2.4,56);hut(g,st,.3,.25,1.5,2.4,26,16,'y',bigO({x:f=>{door(g,f,.14,.6,.5,col);win(g,f,.2);win(g,f,.8)},y:f=>win(g,f,.5)}));
  for(const yy of [.9,2.1]){const p=PJ(2.55,yy,0);g.strokeStyle='#5a3b22';g.lineWidth=1.4;g.beginPath();g.moveTo(p[0]-4,p[1]);g.lineTo(p[0],p[1]-16);g.lineTo(p[0]+4,p[1]);g.stroke();
   g.fillStyle='#d8c07a';g.beginPath();g.ellipse(p[0],p[1]-16,7,8,0,0,7);g.fill();g.strokeStyle='#8a6a30';g.lineWidth=.8;g.stroke();g.fillStyle='#c0392b';g.beginPath();g.ellipse(p[0],p[1]-16,4.4,5,0,0,7);g.fill();g.fillStyle='#f3e8c8';g.beginPath();g.ellipse(p[0],p[1]-16,2.4,2.8,0,0,7);g.fill();g.fillStyle='#c0392b';g.beginPath();g.ellipse(p[0],p[1]-16,1,1.2,0,0,7);g.fill()}
  banner(g,2.8,2.85,0,col,40);break}
 case 'stable':{shadow3(g,.25,.3,2.5,1.4,48);hut(g,st,.25,.3,2.5,1.4,22,16,'x',{feat:{y:f=>{for(const s of [.2,.5,.8])door(g,f,.13,.6,s,null)},x:f=>win(g,f,.5)}});
  for(let k=0;k<=5;k++){const x=.3+k*.5;box3(g,x,2.55,0,.07,.07,10,st.wood,null,st.wood)}const a=PJ(.3,2.58,7),b=PJ(2.8,2.58,7),a2=PJ(.3,2.58,3.5),b2=PJ(2.8,2.58,3.5);g.strokeStyle=st.wood;g.lineWidth=1.5;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.moveTo(a2[0],a2[1]);g.lineTo(b2[0],b2[1]);g.stroke();
  box3(g,2.3,1.9,0,.35,.3,8,'#cdb26a','thatch','#dcc27a');banner(g,.2,2.8,0,col,36);break}
 case 'smith':{shadow3(g,.4,.4,2.1,2.0,60);hut(g,st,.4,.4,2.1,2.0,24,18,'x',bigO({y:f=>{door(g,f,.16,.62,.4,col);win(g,f,.78)},x:f=>{const w0=4/flen(f[0],f[1]);g.fillStyle='#ff9a3a';sub(g,f,.5-w0,.5+w0,.15,.5);g.fill();g.strokeStyle='#2a160a';g.stroke()}}));
  box3(g,1.95,.6,20,.32,.32,30,st.stone,'stone',shade(st.stone,-.3));const sm=PJ(2.1,.76,52);for(let k=0;k<3;k++){g.fillStyle=`rgba(110,105,100,${.35-k*.09})`;g.beginPath();g.arc(sm[0]+k*4,sm[1]-k*7,3+k*2,0,7);g.fill()}
  const an=PJ(2.75,2.4,0);g.fillStyle='#3a3a3e';g.fillRect(an[0]-6,an[1]-8,12,3);g.fillRect(an[0]-2,an[1]-5,4,4);g.fillRect(an[0]-4,an[1]-1.5,8,1.5);break}
 case 'workshop':{shadow3(g,.3,.3,2.3,1.9,64);hut(g,st,.3,.3,2.3,1.9,30,20,'x',bigO({y:f=>door(g,f,.32,.75,.55,col),x:f=>win(g,f,.5)}));
  const w0=PJ(.7,2.5,10);g.strokeStyle='#4a3020';g.lineWidth=2.2;g.beginPath();g.ellipse(w0[0],w0[1],9,10,0,0,7);g.stroke();g.lineWidth=1.2;g.beginPath();for(let a=0;a<4;a++){g.moveTo(w0[0]+Math.cos(a*.8)*9,w0[1]+Math.sin(a*.8)*10);g.lineTo(w0[0]-Math.cos(a*.8)*9,w0[1]-Math.sin(a*.8)*10)}g.stroke();
  box3(g,1.5,2.4,0,.9,.35,6,st.wood,'log',shade(st.wood,.2));banner(g,2.75,2.6,0,col,40);break}
 case 'castle':{shadow3(g,0,0,4,4,110);const sc=st.stone,wt=.42,wh=32,stx=sk==='mid'?'sand':'stone';
  const tower=(x,y)=>{if(sk==='west'||sk==='norse'){cyl(g,x,y,0,.5,46,sc,stx,shade(sc,-.1));cone(g,x,y,46,.6,sk==='west'?28:34,st.roof,st.roofTex)}
   else if(sk==='east'){box3(g,x-.45,y-.45,0,.9,.9,44,st.big,'east',null);hip(g,x-.45,y-.45,44,.9,.9,14,.22,st.roof,'slate',true)}
   else{box3(g,x-.45,y-.45,0,.9,.9,46,sc,'sand',sc);merlons(g,x-.45,y-.45,46,.9,.9,sc);dome(g,x,y,46,.32,st.dome)}};
  tower(.45,.45);box3(g,.45,.2,0,3.1,wt,wh,sc,stx,shade(sc,.08));merlons(g,.45,.2,wh,3.1,wt,sc);box3(g,.2,.45,0,wt,3.1,wh,sc,stx,shade(sc,.08));merlons(g,.2,.45,wh,wt,3.1,sc);
  box3(g,1.3,1.3,0,1.4,1.4,64,st.big,st.bigTex,st.kind==='flat'?st.roof:null,null,{y:f=>{win(g,f,.35,4,.6,.8);win(g,f,.65,4,.6,.8)},x:f=>win(g,f,.5,4,.6,.8)});
  if(st.kind==='flat'){merlons(g,1.3,1.3,64,1.4,1.4,st.big);dome(g,2,2,64,.5,st.dome)}else sroof(g,st,1.3,1.3,64,1.4,1.4,22,.1,'x',st.big);
  tower(3.55,.45);tower(.45,3.55);
  box3(g,3.38,.45,0,wt,3.1,wh,sc,stx,shade(sc,.08));merlons(g,3.38,.45,wh,wt,3.1,sc);
  box3(g,.45,3.38,0,3.1,wt,wh,sc,stx,shade(sc,.08),null,{y:f=>{door(g,f,.14,.72,.5,col)}});merlons(g,.45,3.38,wh,3.1,wt,sc);
  tower(3.55,3.55);banner(g,2,2,sk==='mid'?82:94,col,24);banner(g,3.55,3.55,sk==='east'?60:sk==='mid'?68:76,col,16);banner(g,.45,3.55,sk==='east'?60:sk==='mid'?68:76,col,16);break}
 case 'tower':{shadow3(g,.15,.15,.7,.7,80);const sc=st.stone;
  if(sk==='west'){box3(g,.17,.17,0,.66,.66,54,sc,'stone',null,null,{y:f=>{win(g,f,.5,3,.55,.75);door(g,f,.3,.3,.5,null)},x:f=>win(g,f,.5,3,.55,.75)});hip(g,.17,.17,54,.66,.66,22,.1,st.roof,'tile')}
  else if(sk==='east'){box3(g,.2,.2,0,.6,.6,34,st.big,'east',null,null,{y:f=>win(g,f,.5,3)});hip(g,.2,.2,34,.6,.6,10,.18,st.roof,'slate',true);box3(g,.26,.26,40,.48,.48,16,st.big,'east',null);hip(g,.26,.26,56,.48,.48,12,.16,st.roof,'slate',true)}
  else if(sk==='mid'){box3(g,.18,.18,0,.64,.64,54,sc,'sand',sc,null,{y:f=>win(g,f,.5,3,.6,.8),x:f=>win(g,f,.5,3,.6,.8)});merlons(g,.18,.18,54,.64,.64,sc);dome(g,.5,.5,54,.24,st.dome)}
  else{box3(g,.18,.18,0,.64,.64,50,st.big,'plank',null,null,{y:f=>win(g,f,.5,3,.6,.8)});hip(g,.18,.18,50,.64,.64,28,.08,st.roof,'thatch')}
  banner(g,.5,.5,sk==='east'?70:sk==='mid'?68:sk==='norse'?78:76,col,14);break}
 case 'palisade':{shadow3(g,.1,.1,.8,.8,24);const ps=[];for(const a of [.14,.38,.62,.86])for(const b of [.14,.38,.62,.86])ps.push([a,b]);FNS=true;ps.sort((p,q)=>p[0]+p[1]-q[0]-q[1]);
  for(const [a,b] of ps){const hh=22+Math.round((a*31+b*17)%3)*2;box3(g,a-.1,b-.1,0,.2,.2,hh,'#8a6239',null,null);hip(g,a-.1,b-.1,hh,.2,.2,7,0,'#a07648',null)}FNS=false;break}
 case 'wall':{shadow3(g,0,0,1,1,30);box3(g,0,0,0,1,1,26,st.stone,sk==='mid'?'sand':'stone',shade(st.stone,.1));merlons(g,0,0,26,1,1,st.stone);break}
 case 'gate':{shadow3(g,0,0,1,1,36);box3(g,0,0,0,1,1,30,st.stone,sk==='mid'?'sand':'stone',shade(st.stone,.1),null,{x:f=>door(g,f,.5,.7,.5,col),y:f=>door(g,f,.5,.7,.5,col)});merlons(g,0,0,30,1,1,st.stone);banner(g,.5,.5,35,col,12);break}

 case 'corral':{const posts=[];for(let k=0;k<=4;k++){posts.push([.15+k*.425,.15],[.15+k*.425,1.85]);if(k>0&&k<4)posts.push([.15,.15+k*.425],[1.85,.15+k*.425])}posts.sort((a,b)=>a[0]+a[1]-b[0]-b[1]);FNS=true;
  const rail=(a,b,z)=>{const p=PJ(...a,z),q=PJ(...b,z);g.strokeStyle='#6b4a2c';g.lineWidth=1.6;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()};
  rail([.15,.15],[1.85,.15],8);rail([.15,.15],[.15,1.85],8);rail([.15,.15],[1.85,.15],4);rail([.15,.15],[.15,1.85],4);
  for(const [a,b] of posts)box3(g,a-.04,b-.04,0,.08,.08,11,'#7a5634',null,'#9a7448');box3(g,.9,.6,0,.5,.22,5,'#6b4a2c','plank','#5a7ab0');box3(g,.4,1.1,0,.35,.3,7,'#cdb26a','thatch','#dcc27a');
  rail([1.85,.15],[1.85,1.85],8);rail([.15,1.85],[1.85,1.85],8);rail([1.85,.15],[1.85,1.85],4);rail([.15,1.85],[1.85,1.85],4);FNS=false;break}
 case 'dock':{const deck='#8a6440';FNS=true;for(const [a,b] of [[.1,.1],[1.9,.1],[.1,1.9],[1.9,1.9],[1,.1],[.1,1],[1.9,1],[1,1.9]])box3(g,a-.06,b-.06,-6,.12,.12,12,'#5a3e26',null,null);FNS=false;
  box3(g,0,0,4,2,2,3,deck,'plank',deck,'plank');box3(g,.2,.2,7,.7,.7,14,st.wall,st.wallTex,st.kind==='flat'?st.roof:null);if(st.kind!=='flat')sroof(g,st,.2,.2,21,.7,.7,9,.06,'x',st.wall);
  const c=PJ(1.6,1.5,7),t=PJ(1.6,1.5,40);g.strokeStyle='#4a3020';g.lineWidth=2;g.beginPath();g.moveTo(c[0],c[1]);g.lineTo(t[0],t[1]);g.lineTo(t[0]-16,t[1]+6);g.stroke();g.lineWidth=.8;g.beginPath();g.moveTo(t[0]-16,t[1]+6);g.lineTo(t[0]-16,t[1]+20);g.stroke();
  box3(g,1.2,1.3,7,.3,.25,5,'#7a5230','plank','#9a7040');banner(g,1.9,1.9,7,col,22);break}
 case 'market':{shadow3(g,.2,.2,2.6,2.6,30);box3(g,.1,.1,0,2.8,2.8,2,'#a89a84','stone','#b8ab94','stone');
  const stall=(x,y,c1)=>{FNS=true;for(const [a,b] of [[x,y],[x+.8,y],[x,y+.8],[x+.8,y+.8]])box3(g,a,b,2,.07,.07,16,st.wood,null,st.wood);FNS=false;
   box3(g,x+.05,y+.5,2,.75,.3,6,'#8a6440','plank','#a88050');gable(g,x-.05,y-.05,18,.95,.95,7,.06,c1,null,c1,'x');
   const p=PJ(x+.3,y+.65,8);g.fillStyle='#d04040';g.beginPath();g.arc(p[0],p[1],1.6,0,7);g.fill();g.fillStyle='#e8c040';g.beginPath();g.arc(p[0]+3,p[1]+1,1.6,0,7);g.fill();g.fillStyle='#6fa040';g.beginPath();g.arc(p[0]+5.5,p[1]+2,1.6,0,7);g.fill()};
  stall(.3,.3,'#b23a3a');stall(1.6,.3,'#d9b13a');stall(.3,1.6,'#3a6ab2');stall(1.6,1.6,col);box3(g,1.3,1.35,2,.35,.35,8,'#7a5230','plank','#c49a64');banner(g,2.85,2.85,2,col,30);break}
 case 'temple':{if(sk==='west'){shadow3(g,.3,.6,2.4,1.6,90);hut(g,st,.3,.6,2.0,1.6,30,20,'x',{wall:st.stone,tex:'stone',feat:{y:f=>{for(const s of [.25,.5,.75])win(g,f,s,4,.4,.85)},x:f=>{door(g,f,.24,.6,.5,col);win(g,f,.5,6,.7,.92)}}});
   box3(g,2.25,.75,0,.7,.7,74,st.stone,'stone',null,null,{y:f=>{win(g,f,.5,4,.75,.92)},x:f=>{door(g,f,.4,.35,.5,null);win(g,f,.5,4,.75,.92)}});hip(g,2.25,.75,74,.7,.7,34,.06,st.roof,'tile');
   const tp=PJ(2.6,1.1,108);g.strokeStyle='#e8c15a';g.lineWidth=1.6;g.beginPath();g.moveTo(tp[0],tp[1]);g.lineTo(tp[0],tp[1]-10);g.moveTo(tp[0]-3,tp[1]-7);g.lineTo(tp[0]+3,tp[1]-7);g.stroke()}
  else if(sk==='mid'){shadow3(g,.3,.3,2.4,2.4,80);box3(g,.3,.3,0,2.4,2.4,30,st.wall,st.wallTex,st.roof,null,{y:f=>{door(g,f,.18,.7,.5,col);win(g,f,.2,4);win(g,f,.8,4)},x:f=>{win(g,f,.3,4);win(g,f,.7,4)}});merlons(g,.3,.3,30,2.4,2.4,st.wall);
   cyl(g,1.5,1.5,30,.75,10,st.wall,'sand',st.wall);dome(g,1.5,1.5,40,.75,st.dome);cyl(g,2.55,2.55,0,.18,84,st.wall,'sand',st.wall);dome(g,2.55,2.55,84,.2,st.dome)}
  else if(sk==='east'){shadow3(g,.4,.4,2.2,2.2,100);box3(g,.3,.3,0,2.4,2.4,4,st.stone,'stone',st.stone,'stone');let z=4;for(const [i,s] of [[0,1.8],[1,1.4],[2,1.0]]){const o0=1.5-s/2;box3(g,o0,o0,z,s,s,20-i*3,st.big,'east',null,null,i===0?{y:f=>door(g,f,.22,.6,.5,col)}:null);z+=20-i*3;hip(g,o0,o0,z,s,s,10,.28,st.roof,'slate',true);z+=6}
   const tp=PJ(1.5,1.5,z+6);g.strokeStyle='#c9a24a';g.lineWidth=1.8;g.beginPath();g.moveTo(tp[0],tp[1]+6);g.lineTo(tp[0],tp[1]-12);g.stroke()}
  else{shadow3(g,.4,.4,2.2,2.2,110);hut(g,st,.4,.4,2.2,2.2,22,22,'x',{wall:st.big,tex:'plank',feat:{y:f=>door(g,f,.2,.65,.5,col),x:f=>win(g,f,.5)}});box3(g,1.05,1.05,40,.9,.9,16,st.big,'plank',null);hip(g,1.05,1.05,56,.9,.9,22,.12,st.roof,'thatch');
   const tp=PJ(1.5,1.5,78);g.strokeStyle='#3a2716';g.lineWidth=1.8;g.beginPath();g.moveTo(tp[0],tp[1]);g.lineTo(tp[0],tp[1]-14);g.stroke()}
  break}
 case 'sentry':{shadow3(g,.2,.2,.6,.6,60);FNS=true;for(const [a,b] of [[.2,.2],[.72,.2],[.2,.72],[.72,.72]])box3(g,a,b,0,.08,.08,40,st.wood,null,st.wood);FNS=false;
  box3(g,.12,.12,40,.76,.76,4,st.wood,'plank',st.wood,'plank');box3(g,.15,.15,44,.7,.7,12,st.wood,'plank',null,null,{y:f=>win(g,f,.5,4,.3,.7)});hip(g,.12,.12,56,.76,.76,14,.06,st.roof,st.roofTex||'tile');banner(g,.5,.5,70,col,12);break}
 case 'outpost':{shadow3(g,.3,.3,.4,.4,40);box3(g,.4,.4,0,.2,.2,40,st.wood,'plank',st.wood);box3(g,.25,.25,40,.5,.5,3,st.wood,'plank',st.wood,'plank');
  const p=PJ(.5,.5,46);g.fillStyle='#ffb040';g.beginPath();g.moveTo(p[0]-4,p[1]);g.quadraticCurveTo(p[0],p[1]-14,p[0]+4,p[1]);g.fill();g.fillStyle='#fff0a0';g.beginPath();g.moveTo(p[0]-2,p[1]);g.quadraticCurveTo(p[0],p[1]-7,p[0]+2,p[1]);g.fill();banner(g,.3,.7,43,col,14);break}
 case 'wonder':{shadow3(g,.3,.3,4.4,4.4,200);
  if(sk==='west'){box3(g,.2,.2,0,4.6,4.6,3,st.stone,'stone',st.stone,'stone');hut(g,st,.6,1.4,3.2,2.2,52,30,'x',{wall:st.stone,tex:'stone',feat:{y:f=>{for(const s of [.15,.32,.5,.68,.85])win(g,f,s,5,.35,.8)}}});
   hut(g,st,1.5,.6,1.2,3.8,46,26,'y',{wall:st.stone,tex:'stone',feat:{y:f=>{door(g,f,.4,.55,.5,col);win(g,f,.5,9,.65,.9)}}});
   for(const yy of [.9,3.1]){box3(g,3.75,yy,0,.9,.9,110,st.stone,'stone',null,null,{x:f=>{win(g,f,.5,4,.5,.62);win(g,f,.5,4,.75,.88)},y:f=>win(g,f,.5,4,.75,.88)});hip(g,3.75,yy,110,.9,.9,44,.06,st.roof,'tile')}
   box3(g,3.75,1.8,0,.9,1.3,64,st.stone,'stone',null,null,{x:f=>{door(g,f,.32,.4,.5,col);const c=Q(f,.5,.72);g.fillStyle='#3a5a9a';g.beginPath();g.arc(c[0],c[1],7,0,7);g.fill();g.strokeStyle='#e8c15a';g.lineWidth=1.2;g.stroke();for(let a=0;a<8;a++){g.beginPath();g.moveTo(c[0],c[1]);g.lineTo(c[0]+Math.cos(a*.785)*7,c[1]+Math.sin(a*.785)*7);g.stroke()}}});gable(g,3.75,1.8,64,.9,1.3,20,.06,st.roof,'tile',st.stone,'y');banner(g,4.2,1.35,154,col,24)}
  else if(sk==='mid'){box3(g,.3,.3,0,4.4,4.4,44,st.wall,st.wallTex,st.roof,null,{y:f=>{door(g,f,.14,.7,.5,col);for(const s of [.18,.32,.68,.82])win(g,f,s,5,.4,.8)},x:f=>{for(const s of [.2,.4,.6,.8])win(g,f,s,5,.4,.8)}});merlons(g,.3,.3,44,4.4,4.4,st.wall);
   for(const [a,b] of [[.6,.6],[4.4,.6],[.6,4.4]])cyl(g,a,b,0,.28,120,st.wall,'sand',st.wall);cyl(g,2.5,2.5,44,1.4,24,st.wall,'sand',st.wall);dome(g,2.5,2.5,68,1.4,st.dome);
   cyl(g,4.4,4.4,0,.28,120,st.wall,'sand',st.wall);for(const [a,b] of [[.6,.6],[4.4,.6],[.6,4.4],[4.4,4.4]])dome(g,a,b,120,.3,st.dome)}
  else if(sk==='east'){box3(g,.2,.2,0,4.6,4.6,5,st.stone,'stone',st.stone,'stone');let z=5;for(let i=0;i<5;i++){const s=3.4-i*.55,o0=2.5-s/2;box3(g,o0,o0,z,s,s,26-i*3,st.big,'east',null,null,i===0?{y:f=>door(g,f,.2,.6,.5,col),x:f=>win(g,f,.5,6)}:{y:f=>win(g,f,.5,5),x:f=>win(g,f,.5,5)});z+=26-i*3;hip(g,o0,o0,z,s,s,12,.32,st.roof,'slate',true);z+=7}
   const tp=PJ(2.5,2.5,z+8);g.strokeStyle='#d8b04a';g.lineWidth=2.4;g.beginPath();g.moveTo(tp[0],tp[1]+8);g.lineTo(tp[0],tp[1]-18);g.stroke();for(let k=0;k<4;k++){g.beginPath();g.arc(tp[0],tp[1]-k*5,2.4,0,7);g.stroke()}}
  else{hut(g,st,.4,1.3,4.2,2.4,42,46,'x',{wall:st.big,tex:'plank',feat:{y:f=>{door(g,f,.12,.6,.5,col);for(const s of [.2,.35,.65,.8])win(g,f,s,5)},x:f=>door(g,f,.3,.6,.5,null)}});
   hut(g,st,1.7,.3,1.6,4.4,34,36,'y',{wall:st.big,tex:'plank'});box3(g,2.2,2.2,60,.6,.6,40,st.big,'plank',null);hip(g,2.2,2.2,100,.6,.6,40,.1,st.roof,'thatch');banner(g,2.5,2.5,150,col,22)}
  break}
 }}
function makeBSprite(type,sk,o,tier,mask){const d=B[type],w=d.w,h=d.h,zm=ZMX[type]||100,pad=22,sc=2.5;const c=document.createElement('canvas');
 c.width=Math.ceil(((w+h)*HW+pad*2+40)*sc);c.height=Math.ceil(((w+h)*HH+zm+pad*2)*sc);const g=c.getContext('2d');g.scale(sc,sc);c.ox=h*HW+pad;c.oy=zm+pad;c.sc=sc;g.translate(c.ox,c.oy);
 if(B[type].wall){const mk=mask||0;wallModel(g,type,sk,PCOL[o],tier,mk);return mk?c:defineEdges(c,2,'#1c120a')}model(g,type,sk,PCOL[o],tier,o);if(tier>=3&&!B[type].wall&&!B[type].flat&&B[type].w>=2)royalTrim(g,type,PCOL[o]);if(tier===0&&!B[type].wall&&!B[type].flat&&B[type].w>=2&&type!=='dock')rusticBits(g,type);return defineEdges(c,2,'#1c120a')}
function bSprite(type,sk,o,tier=2,mask){const k=type+'|'+sk+'|'+o+'|'+tier+(mask!=null?'|m'+mask:'');let c=sprC.get(k);if(!c){c=makeBSprite(type,sk,o,tier,mask);sprC.set(k,c)}return c}
const treeV=[],resV={2:[],3:[],4:[]};
function makeResSprites(){const mk=(w,h,f,ec)=>{const c=document.createElement('canvas');c.width=w*3;c.height=h*3;const g=c.getContext('2d');g.scale(3,3);f(g);c.w=w;c.h=h;return defineEdges(c,2,ec||'#16210f')};const r=mulberry(99);
 for(let v=0;v<6;v++)treeV.push(mk(44,56,g=>{g.fillStyle='rgba(10,20,0,.32)';g.beginPath();g.ellipse(24,51,14,5,0,0,7);g.fill();
  if(v<4){g.fillStyle='#5a3b20';g.fillRect(20,36,5,16);const base=['#2f6b2a','#3a7a2e','#2b6230','#44802f'][v];const blobs=[[22,28,12],[14,32,9],[30,31,9],[22,19,10],[16,22,7],[29,22,7]];
   for(const [x,y,rad] of blobs){g.fillStyle=shade(base,-.2);g.beginPath();g.arc(x+1,y+2,rad,0,7);g.fill()}for(const [x,y,rad] of blobs){g.fillStyle=base;g.beginPath();g.arc(x,y,rad,0,7);g.fill()}
   for(const [x,y,rad] of blobs){g.fillStyle=shade(base,.22);g.beginPath();g.arc(x-rad*.3,y-rad*.35,rad*.45,0,7);g.fill()}}
  else{g.fillStyle='#4e3420';g.fillRect(20,40,4,12);const base=v===4?'#24553a':'#2c5f3c';for(let k=0;k<4;k++){const yy=10+k*9,ww=7+k*4.5;g.fillStyle=shade(base,-.15);g.beginPath();g.moveTo(22,yy-6);g.lineTo(22+ww+1,yy+9);g.lineTo(22-ww+1,yy+9);g.fill();g.fillStyle=base;g.beginPath();g.moveTo(22,yy-7);g.lineTo(22+ww,yy+8);g.lineTo(22-ww,yy+8);g.fill();g.fillStyle=shade(base,.2);g.beginPath();g.moveTo(22,yy-7);g.lineTo(22-ww*.6,yy+5);g.lineTo(22-ww*.2,yy+6);g.fill()}}},'#122010'));
 const rock=(g,base,hi,n)=>{g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(17,25,14,5,0,0,7);g.fill();for(let k=0;k<n;k++){const x=6+r()*20,y=12+r()*10,s=5+r()*5;g.fillStyle=shade(base,-.3);g.beginPath();g.moveTo(x-s,y+s*.6);g.lineTo(x-s*.6,y-s*.5);g.lineTo(x+s*.3,y-s*.8);g.lineTo(x+s,y);g.lineTo(x+s*.6,y+s*.7);g.fill();g.fillStyle=base;g.beginPath();g.moveTo(x-s*.8,y+s*.3);g.lineTo(x-s*.5,y-s*.5);g.lineTo(x+s*.3,y-s*.8);g.lineTo(x+s*.8,y-.5);g.lineTo(x+s*.3,y+s*.3);g.fill();g.fillStyle=hi;g.fillRect(x-s*.3,y-s*.45,s*.4,s*.25)}};
 for(let v=0;v<3;v++){resV[2].push(mk(34,30,g=>rock(g,'#e1b52f','#fff2a8',4),'#3a2a0c'));resV[3].push(mk(34,30,g=>rock(g,'#9e9a92','#e3e0da',4),'#2a2722'));
  resV[4].push(mk(34,30,g=>{g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(17,25,13,4.5,0,0,7);g.fill();for(const [x,y,s] of [[11,17,7],[22,16,8],[16,11,7]]){g.fillStyle='#2f6a2c';g.beginPath();g.arc(x,y,s,0,7);g.fill();g.fillStyle='#3f8436';g.beginPath();g.arc(x-1.5,y-2,s*.6,0,7);g.fill()}for(let k=0;k<12;k++){g.fillStyle=k%3?'#c8304a':'#e24b5c';g.beginPath();g.arc(6+r()*22,8+r()*14,1.6,0,7);g.fill()}},'#14240f'))}}


function makeResSprites2(){const mk=(w,h,f,ec)=>{const c=document.createElement('canvas');c.width=w*3;c.height=h*3;const g=c.getContext('2d');g.scale(3,3);f(g);c.w=w;c.h=h;return defineEdges(c,2,ec||'#16210f')};
 for(let v=0;v<3;v++)treeV[6+v]=mk(44,56,g=>{g.fillStyle='rgba(10,20,0,.3)';g.beginPath();g.ellipse(24,51,12,4,0,0,7);g.fill();const lean=(v-1)*3;
  g.strokeStyle='#7a5a36';g.lineWidth=3.4;g.lineCap='round';g.beginPath();g.moveTo(23,51);g.quadraticCurveTo(22+lean,32,24+lean,16);g.stroke();g.strokeStyle='#5a4026';g.lineWidth=.6;for(let k=0;k<8;k++){g.beginPath();g.moveTo(21+lean*k/8,48-k*4);g.lineTo(25+lean*k/8,47-k*4);g.stroke()}
  const tx=24+lean,ty=16;for(let k=0;k<7;k++){const a=-Math.PI+k/6*Math.PI+(v*.2);const ex=tx+Math.cos(a)*15,ey=ty+Math.sin(a)*7+6;g.strokeStyle=k%2?'#3f7a2e':'#4f8f36';g.lineWidth=3;g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo((tx+ex)/2,ty-6+Math.abs(Math.cos(a))*4,ex,ey);g.stroke()}
  g.fillStyle='#6a4a2a';for(const [dx,dy] of [[-1.5,1.5],[1.5,2],[0,3]]){g.beginPath();g.arc(tx+dx,ty+dy,1.4,0,7);g.fill()}},'#14200c');
 for(let v=0;v<3;v++)treeV[9+v]=mk(44,56,g=>{g.fillStyle='rgba(10,20,30,.25)';g.beginPath();g.ellipse(24,51,13,4.5,0,0,7);g.fill();g.fillStyle='#4e3420';g.fillRect(20,42,4,10);const base=v===1?'#1f4a34':'#24503a';
  for(let k=0;k<4;k++){const yy=10+k*9+v,ww=7+k*4.6;g.fillStyle=shade(base,-.18);g.beginPath();g.moveTo(22,yy-6);g.lineTo(22+ww+1,yy+9);g.lineTo(22-ww+1,yy+9);g.fill();g.fillStyle=base;g.beginPath();g.moveTo(22,yy-7);g.lineTo(22+ww,yy+8);g.lineTo(22-ww,yy+8);g.fill();
   g.fillStyle='#f4f8fc';g.beginPath();g.moveTo(22,yy-7);g.lineTo(22+ww*.55,yy+2);g.quadraticCurveTo(22,yy+.5,22-ww*.6,yy+2.6);g.closePath();g.fill()}},'#14202a');
 resV[5]=[];for(let v=0;v<3;v++)resV[5].push(mk(34,30,g=>{g.strokeStyle='rgba(230,245,255,.55)';g.lineWidth=1;g.beginPath();g.ellipse(17,20,13,5,0,0,7);g.stroke();g.beginPath();g.ellipse(17,20,8,3,0,0,7);g.stroke();
  for(const [x,y,a] of [[11,18,.2],[20,21,-.3],[16,24,.1]].slice(0,2+v%2)){g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#24506a';g.beginPath();g.ellipse(0,0,4,1.5,0,0,7);g.fill();g.beginPath();g.moveTo(-3.6,0);g.lineTo(-6,-1.8);g.lineTo(-6,1.8);g.fill();g.restore()}},'#1a3040'))}

/* ---------- mountain rocks ---------- */
const rockCache={};
function rockSprite(v){const key=S.biome+v;if(rockCache[key])return rockCache[key];const w=72,h=70,c=document.createElement('canvas');c.width=w*3;c.height=h*3;const g=c.getContext('2d');g.scale(3,3);
 const r=mulberry(911+v*37);const pal=S.biome==='desert'?['#c27a4e','#9a5a38','#6e3c26','#e0a070']:S.biome==='snow'?['#9a9aa2','#74747e','#50505a','#f4f6fa']:['#9a958a','#76716a','#53504a','#b8b2a4'];
 g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(36,h-12,32,10,0,0,7);g.fill();
 const peaks=2+v%2;for(let k=0;k<peaks;k++){const cx=18+k*(36/(peaks-1||1))+(r()-.5)*8,top=8+r()*18+(k%2)*8,bw=22+r()*6,base=h-12;
  const L=[cx-bw,base],T=[cx+(r()-.5)*6,top],Rr=[cx+bw,base],M=[cx+(r()-.5)*5,base+3];
  g.fillStyle=pal[0];g.beginPath();g.moveTo(...L);g.lineTo(cx-bw*.55,top+(base-top)*.45);g.lineTo(...T);g.lineTo(...M);g.closePath();g.fill();
  g.fillStyle=pal[1];g.beginPath();g.moveTo(...T);g.lineTo(cx+bw*.5,top+(base-top)*.4);g.lineTo(...Rr);g.lineTo(...M);g.closePath();g.fill();
  g.strokeStyle=pal[2];g.lineWidth=.8;for(let j=0;j<4;j++){const yy=top+(base-top)*(.3+j*.17);g.beginPath();g.moveTo(cx-bw*(.2+j*.15)+r()*3,yy);g.lineTo(cx-bw*(.05+j*.1),yy+3+r()*2);g.stroke();g.beginPath();g.moveTo(cx+bw*(.15+j*.14),yy-1);g.lineTo(cx+bw*(.3+j*.14),yy+4);g.stroke()}
  if(S.biome!=='desert'){g.fillStyle=pal[3];g.beginPath();g.moveTo(T[0],T[1]);const sd=(base-top)*(S.biome==='snow'?.42:.22);g.lineTo(T[0]-sd*.8,T[1]+sd);g.lineTo(T[0]-sd*.3,T[1]+sd*.8);g.lineTo(T[0],T[1]+sd*1.1);g.lineTo(T[0]+sd*.4,T[1]+sd*.75);g.lineTo(T[0]+sd*.7,T[1]+sd*.9);g.closePath();g.fill()}
  else{g.fillStyle='rgba(255,220,170,.25)';for(let j=1;j<4;j++){const yy=top+(base-top)*j/4;g.fillRect(cx-bw*j/4,yy,bw*j/2,1.4)}}}
 c.w=w;c.h=h;const out=defineEdges(c,2,S.biome==='desert'?'#3a1c10':'#22201c');rockCache[key]=out;return out}

/* ---------- architecture that improves with each phase ---------- */
const TIERS={
 west:[{wall:'#9a7650',wallTex:'log',big:'#8e6c4a',bigTex:'plank',stone:'#8c8577',roof:'#b39a5e',roofTex:'thatch',kind:'steep',wood:'#5a3e24'},
       {wall:'#e2d3b0',wallTex:'timber',big:'#d8c8a4',bigTex:'timber',stone:'#9e978a',roof:'#6e5038',roofTex:'slate',kind:'gable',wood:'#5e3f26'},null,
       {wall:'#f2ead8',wallTex:'timber',big:'#d2cbbd',bigTex:'stone',stone:'#c4bdae',roof:'#585e6c',roofTex:'slate',kind:'gable',wood:'#4a2e1a'}],
 east:[{wall:'#a8865c',wallTex:'plank',big:'#9c7c56',bigTex:'plank',stone:'#8e8a7e',roof:'#b29c62',roofTex:'thatch',kind:'gable',wood:'#5a3a26'},
       {wall:'#e6dcc4',wallTex:'east',big:'#d9cfb6',bigTex:'plank',stone:'#a8a496',roof:'#6a5a48',roofTex:'slate',kind:'pagoda',wood:'#5a3a26'},null,
       {wall:'#f6f1e4',wallTex:'east',big:'#f2ecdc',bigTex:'east',stone:'#c8c4b6',roof:'#2e6a58',roofTex:'slate',kind:'pagoda',wood:'#7a1e1a'}],
 mid:[{wall:'#b48e62',wallTex:'sand',big:'#ad885e',bigTex:'sand',stone:'#a8936c',roof:'#a88a5e',roofTex:null,kind:'flat',dome:'#8a7050',wood:'#6a4a2e'},
      {wall:'#cdb080',wallTex:'sand',big:'#c8aa7c',bigTex:'sand',stone:'#bca97e',roof:'#d8c08e',roofTex:null,kind:'flat',dome:'#a06a3a',wood:'#7a5636'},null,
      {wall:'#efe2c2',wallTex:'sand',big:'#eadcb8',bigTex:'sand',stone:'#ddd0aa',roof:'#f4e6c0',roofTex:null,kind:'flat',dome:'#2a8aa8',wood:'#7a5636'}],
 norse:[{wall:'#6e5038',wallTex:'log',big:'#6a4e36',bigTex:'log',stone:'#857f74',roof:'#7c8a4a',roofTex:'thatch',kind:'steep',wood:'#4a3220'},
        {wall:'#8b6443',wallTex:'log',big:'#806048',bigTex:'plank',stone:'#948f84',roof:'#9a8650',roofTex:'thatch',kind:'steep',wood:'#5e4129'},
        {wall:'#94704c',wallTex:'plank',big:'#a29c90',bigTex:'stone',stone:'#a29c90',roof:'#6a4c32',roofTex:'slate',kind:'steep',wood:'#4e3420'},
        {wall:'#9a7250',wallTex:'plank',big:'#bcb6a8',bigTex:'stone',stone:'#b4ae9f',roof:'#4a4a52',roofTex:'slate',kind:'steep',wood:'#3e2a1a'}]};
function tierStyle(sk,tier){const t=TIERS[sk]&&TIERS[sk][tier];return t||SP[sk]}
function bTier(o){const p=P&&P[o];return p?Math.min(3,p.phase||0):2}
function evictSprites(o){for(const k of [...sprC.keys()]){const a=k.split('|');if(a[2]==String(o))sprC.delete(k)}}
function royalTrim(g,type,col){const d=B[type],w=d.w,h=d.h;const zm=ZMX[type]||100;
 for(const [x,y] of [[.15,h-.1],[w-.1,h-.1]]){banner(g,x,y,0,col,Math.min(46,zm*.42))}
 const p=PJ(w/2,h-.05,0);g.fillStyle='#e8c15a';g.strokeStyle='#6a4a10';g.lineWidth=.8;g.beginPath();g.arc(p[0],p[1]-zm*.22,3.4,0,7);g.fill();g.stroke();g.fillStyle=col;g.beginPath();g.arc(p[0],p[1]-zm*.22,1.8,0,7);g.fill()}
function rusticBits(g,type){const d=B[type],w=d.w,h=d.h;
 const p=PJ(w-.15,h*.55,0);g.fillStyle='#6b4a2c';for(let k=0;k<3;k++){g.beginPath();g.ellipse(p[0]+k*2.4,p[1]-k*2.6,4.6,2,0,0,7);g.fill();g.fillStyle=k%2?'#6b4a2c':'#7a5636'}g.fillStyle='#c8a868';for(let k=0;k<3;k++){g.beginPath();g.arc(p[0]-3+k*3.4,p[1]-2.6*k-1,1,0,7);g.fill()}
 const q=PJ(.2,h-.2,0);g.fillStyle='#c9ad62';g.strokeStyle='#7a6030';g.lineWidth=.8;g.beginPath();g.ellipse(q[0],q[1]-4,6,4.5,0,0,7);g.fill();g.stroke();g.beginPath();g.moveTo(q[0]-5,q[1]-4);g.lineTo(q[0]+5,q[1]-4);g.stroke()}

/* ---------- walls that join up with their neighbours ---------- */
function crenel(g,x,y,z,w,d,axis,col){const m=.13;FNS=true;const L=[];if(axis==='y'){for(let t=.03;t<d-.04;t+=.25){L.push([x,y+t]);L.push([x+w-m,y+t])}}else{for(let t=.03;t<w-.04;t+=.25){L.push([x+t,y]);L.push([x+t,y+d-m])}}
 L.sort((a,b)=>a[0]+a[1]-b[0]-b[1]);for(const [a,b] of L)box3(g,a,b,z,m,m,5,col,null,shade(col,.15));FNS=false}
function wallModel(g,type,sk,col,tier,m){const st=tierStyle(sk,tier);const N=m&1,E=m&2,S=m&4,Wm=m&8;
 if(type==='palisade'||type==='pgate'){const pts=[[.5,.5]];if(N)pts.push([.5,.28],[.5,.07]);if(S)pts.push([.5,.72],[.5,.93]);if(Wm)pts.push([.28,.5],[.07,.5]);if(E)pts.push([.72,.5],[.93,.5]);
  if(!m)pts.push([.3,.3],[.7,.3],[.3,.7],[.7,.7]);if(type==='pgate'){const ax=E||Wm||!(N||S)?'x':'y';const ps=ax==='x'?[[.08,.5],[.92,.5]]:[[.5,.08],[.5,.92]];FNS=true;
   for(const [a,b] of ps){box3(g,a-.1,b-.1,0,.2,.2,38,'#6e4a2a',null,null);hip(g,a-.1,b-.1,38,.2,.2,7,0,'#8a6239',null)}
   if(ax==='x')box3(g,.12,.42,30,.76,.16,4,'#6e4a2a',null,'#7a5636');else box3(g,.42,.12,30,.16,.76,4,'#6e4a2a',null,'#7a5636');
   FNS=false;const p=PJ(.5,.5,40);g.fillStyle=col;g.fillRect(p[0]-5,p[1]-3,10,5);return}
  shadow3(g,.3,.3,.4,.4,20);FNS=true;pts.sort((p,q)=>p[0]+p[1]-q[0]-q[1]);for(const [a,b] of pts){const hh=22+Math.round((a*31+b*17)%3)*2;box3(g,a-.1,b-.1,0,.2,.2,hh,'#8a6239',null,null);hip(g,a-.1,b-.1,hh,.2,.2,7,0,'#a07648',null)}FNS=false;return}
 const sc=st.stone,tex=sk==='mid'?'sand':'stone',top=shade(sc,.1);const hw=26,t0=.27,tw=.46;
 if(type==='gate'){const ax=E||Wm||!(N||S)?'x':'y';shadow3(g,0,0,1,1,34);
  const T=.2,G0=t0-.1,GW=tw+.2,TH=50,MH=42;
  if(ax==='x'){box3(g,0,G0-.04,0,T,GW+.08,TH,sc,tex,top);box3(g,T,G0,0,1-2*T,GW,MH,shade(sc,-.04),tex,top);box3(g,1-T,G0-.04,0,T,GW+.08,TH,sc,tex,top);crenel(g,0,G0-.04,TH,T,GW+.08,'x',sc);crenel(g,1-T,G0-.04,TH,T,GW+.08,'x',sc);crenel(g,T,G0,MH,1-2*T,GW,'x',sc)}
  else{box3(g,G0-.04,0,0,GW+.08,T,TH,sc,tex,top);box3(g,G0,T,0,GW,1-2*T,MH,shade(sc,-.04),tex,top);box3(g,G0-.04,1-T,0,GW+.08,T,TH,sc,tex,top);crenel(g,G0-.04,0,TH,GW+.08,T,'y',sc);crenel(g,G0-.04,1-T,TH,GW+.08,T,'y',sc);crenel(g,G0,T,MH,GW,1-2*T,'y',sc)}
  banner(g,.5,.5,MH+6,col,13);return}
 const straightY=(N||S)&&!E&&!Wm,straightX=(E||Wm)&&!N&&!S;
 if(straightY){const y0=N?0:t0,y1=S?1:t0+tw;shadow3(g,t0,y0,tw,y1-y0,hw);box3(g,t0,y0,0,tw,y1-y0,hw,sc,tex,top);crenel(g,t0,y0,hw,tw,y1-y0,'y',sc);return}
 if(straightX){const x0=Wm?0:t0,x1=E?1:t0+tw;shadow3(g,x0,t0,x1-x0,tw,hw);box3(g,x0,t0,0,x1-x0,tw,hw,sc,tex,top);crenel(g,x0,t0,hw,x1-x0,tw,'x',sc);return}
 shadow3(g,0,0,1,1,hw);const arm=(x,y,w,d,ax)=>{box3(g,x,y,0,w,d,hw,sc,tex,top);crenel(g,x,y,hw,w,d,ax,sc)};
 if(N)arm(t0,0,tw,t0,'y');if(Wm)arm(0,t0,t0,tw,'x');const ph=m?hw+4:hw;box3(g,t0-.05,t0-.05,0,tw+.1,tw+.1,ph,shade(sc,.03),tex,top);merlons(g,t0-.05,t0-.05,ph,tw+.1,tw+.1,sc);if(E)arm(t0+tw,t0,1-t0-tw,tw,'x');if(S)arm(t0,t0+tw,tw,1-t0-tw,'y')}
function wallMask(b){let m=0;const D=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]];for(const [dx,dy,bit] of D){const x=b.x+dx,y=b.y+dy;if(x<0||y<0||x>=W||y>=H)continue;const n=ents.get(occ[y*W+x]);if(n&&n.k==='b'&&n.o===b.o&&B[n.type].wall&&((n.type==='palisade'||n.type==='pgate')===(b.type==='palisade'||b.type==='pgate')))m|=bit}return m}

/* ---------- live gates: a portcullis that lifts and doors that swing ---------- */
const gateAxis=b=>{const m=wallMask(b);return (m&2)||(m&8)||!((m&1)||(m&4))?'x':'y'};
function drawGateLive(g,b){const op=b.open||0,ax=gateAxis(b);
 if(b.type==='gate'){const t0=.27,tw=.46,F=t0-.1+tw+.2;const a=.25,c=.75,h0=30,ar=(c-a)/2;
  const P3=(u,z)=>ax==='x'?PJ(b.x+u,b.y+F,z):PJ(b.x+F,b.y+u,z);const arch=[];arch.push(P3(a,0));for(let k=0;k<=10;k++){const th=Math.PI-k/10*Math.PI;arch.push(P3(.5+Math.cos(th)*ar,h0-ar*36*.6+Math.sin(th)*ar*36*.6))}arch.push(P3(c,0));
  const path=()=>{g.beginPath();g.moveTo(arch[0][0],arch[0][1]);for(const q of arch)g.lineTo(q[0],q[1]);g.closePath()};
  g.save();path();g.fillStyle='#120c08';g.fill();g.strokeStyle='#5a5248';g.lineWidth=2.2;g.stroke();g.clip();
  const lift=op*h0*.95;g.strokeStyle='#4a4b54';g.lineWidth=2;g.beginPath();for(let u=a+.035;u<c;u+=.065){const p0=P3(u,lift),p1=P3(u,lift+h0+4);g.moveTo(p0[0],p0[1]);g.lineTo(p1[0],p1[1])}
  for(let z=lift+4;z<lift+h0+4;z+=6){const p0=P3(a,z),p1=P3(c,z);g.moveTo(p0[0],p0[1]);g.lineTo(p1[0],p1[1])}g.stroke();
  g.strokeStyle='rgba(190,195,210,.45)';g.lineWidth=.7;g.beginPath();for(let u=a+.035;u<c;u+=.065){const p0=P3(u+.008,lift+1),p1=P3(u+.008,lift+h0+3);g.moveTo(p0[0],p0[1]);g.lineTo(p1[0],p1[1])}g.stroke();g.strokeStyle='rgba(190,195,210,.35)';g.lineWidth=.6;g.beginPath();for(let z=lift+4.6;z<lift+h0+4;z+=6){const p0=P3(a,z),p1=P3(c,z);g.moveTo(p0[0],p0[1]);g.lineTo(p1[0],p1[1])}g.stroke();
  g.fillStyle='#2c2c32';for(let u=a+.035;u<c;u+=.065){const p=P3(u,lift);g.beginPath();g.moveTo(p[0]-1.6,p[1]-1);g.lineTo(p[0]+1.6,p[1]-1);g.lineTo(p[0],p[1]+3.5);g.fill()}
  if(b.locked){const p=P3(.5,h0*.45);g.fillStyle='#e8c15a';g.fillRect(p[0]-3,p[1]-3,6,6)}g.restore();return}
 /* two wooden doors hinged on the posts, swinging inward */
 const ang=op*Math.PI*.46,H=26,L=.4;const leaves=[];
 for(const s of [-1,1]){const hu=.5+s*.42;const hx=ax==='x'?b.x+hu:b.x+.5,hy=ax==='x'?b.y+.5:b.y+hu;const dx=ax==='x'?-s:0,dy=ax==='x'?0:-s;const nx=ax==='x'?0:-1,ny=ax==='x'?-1:0;
  const ex=hx+(dx*Math.cos(ang)+nx*Math.sin(ang))*L,ey=hy+(dy*Math.cos(ang)+ny*Math.sin(ang))*L;leaves.push({hx,hy,ex,ey,d:(hx+ex)/2+(hy+ey)/2})}
 leaves.sort((p,q)=>p.d-q.d);for(const l of leaves){const q=[PJ(l.hx,l.hy,0),PJ(l.ex,l.ey,0),PJ(l.ex,l.ey,H),PJ(l.hx,l.hy,H)];
  g.beginPath();g.moveTo(q[0][0],q[0][1]);for(const v of q)g.lineTo(v[0],v[1]);g.closePath();g.fillStyle=shade('#9a7046',-.12*Math.sin(ang));g.fill();g.strokeStyle='#3a2414';g.lineWidth=1;g.stroke();
  g.strokeStyle='rgba(50,30,14,.6)';g.lineWidth=.7;g.beginPath();for(let k=1;k<4;k++){const t=k/4;const a0=PJ(l.hx+(l.ex-l.hx)*t,l.hy+(l.ey-l.hy)*t,0),a1=PJ(l.hx+(l.ex-l.hx)*t,l.hy+(l.ey-l.hy)*t,H);g.moveTo(a0[0],a0[1]);g.lineTo(a1[0],a1[1])}g.stroke();
  g.strokeStyle='#3a3a40';g.lineWidth=1.6;g.beginPath();for(const z of [5,H-5]){const a0=PJ(l.hx,l.hy,z),a1=PJ(l.ex,l.ey,z);g.moveTo(a0[0],a0[1]);g.lineTo(a1[0],a1[1])}g.stroke()}}

/* ---------- cobbled stone roads that join with their neighbours ---------- */
const roadC={};
function roadMask(b){let m=0;const D=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]];for(const [dx,dy,bit] of D){const x=b.x+dx,y=b.y+dy;if(x<0||y<0||x>=W||y>=H)continue;const n=ents.get(occ[y*W+x]);if(n&&n.type==='road')m|=bit}return m}
function roadSprite(m){const key=(S&&S.biome||'temp')+m;if(roadC[key])return roadC[key];const sc=2.5,pad=4,c=document.createElement('canvas');c.width=(HW*2+pad*2)*sc;c.height=(HH*2+pad*2)*sc;const g=c.getContext('2d');g.scale(sc,sc);g.translate(pad+HW,pad);
 const P2=(x,y)=>[(x-y)*HW,(x+y)*HH];const r=mulberry(500+m);const base=S&&S.biome==='desert'?[176,150,112]:S&&S.biome==='snow'?[150,150,156]:[138,130,118];
 const quad=(x0,y0,x1,y1)=>{const a=P2(x0,y0),b=P2(x1,y0),cc=P2(x1,y1),d=P2(x0,y1);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(cc[0],cc[1]);g.lineTo(d[0],d[1]);g.closePath()};
 // the paved area: a centre square plus arms toward each joined neighbour (a full tile when it has 3+ neighbours)
 const n=((m&1)?1:0)+((m&2)?1:0)+((m&4)?1:0)+((m&8)?1:0);const e=.12;const parts=n>=3||!m?[[e*(m&8?0:1),e*(m&1?0:1),1-e*(m&2?0:1),1-e*(m&4?0:1)]]:[[e,e,1-e,1-e]];
 if(n>0&&n<3){if(m&1)parts.push([e,0,1-e,e]);if(m&4)parts.push([e,1-e,1-e,1]);if(m&8)parts.push([0,e,e,1-e]);if(m&2)parts.push([1-e,e,1,1-e])}
 if(n===2){if((m&1)&&(m&2))parts.push([1-e,0,1,e]);if((m&2)&&(m&4))parts.push([1-e,1-e,1,1]);if((m&4)&&(m&8))parts.push([0,1-e,e,1]);if((m&8)&&(m&1))parts.push([0,0,e,e])}
 g.save();g.beginPath();for(const [x0,y0,x1,y1] of parts){const a=P2(x0,y0),b=P2(x1,y0),cc=P2(x1,y1),d=P2(x0,y1);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(cc[0],cc[1]);g.lineTo(d[0],d[1]);g.closePath()}g.clip();
 g.fillStyle=`rgb(${base[0]-62},${base[1]-62},${base[2]-60})`;g.fillRect(-HW,0,HW*2,HH*2);
 for(let yy=0;yy<1;yy+=.17)for(let xx=-.05+(Math.round(yy/.17)%2)*.09;xx<1.05;xx+=.18){const w=.14+r()*.03,h=.13+r()*.02,sh=(r()-.5)*28;const cx=xx+w/2,cy=yy+h/2;
  const pts=[P2(cx-w/2,cy-h/2),P2(cx+w/2,cy-h/2),P2(cx+w/2,cy+h/2),P2(cx-w/2,cy+h/2)];g.fillStyle=`rgb(${base[0]+18+sh|0},${base[1]+18+sh|0},${base[2]+18+sh|0})`;g.beginPath();g.moveTo(pts[0][0],pts[0][1]-.6);for(const q of pts)g.lineTo(q[0],q[1]-.6);g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=.5;g.beginPath();g.moveTo(pts[0][0],pts[0][1]-.6);g.lineTo(pts[1][0],pts[1][1]-.6);g.stroke()}
 g.restore();g.strokeStyle='rgba(44,34,24,.85)';g.lineWidth=1.5;const ln=(a,b)=>{const A=P2(a[0],a[1]),Bp=P2(b[0],b[1]);g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(Bp[0],Bp[1]);g.stroke()};
 const [x0,y0,x1,y1]=parts[0];if(!(m&1))ln([x0,y0],[x1,y0]);if(!(m&2))ln([x1,y0],[x1,y1]);if(!(m&4))ln([x1,y1],[x0,y1]);if(!(m&8))ln([x0,y1],[x0,y0]);
 if(n>0&&n<3){const NE=n===2&&(m&1)&&(m&2),SE=n===2&&(m&2)&&(m&4),SW=n===2&&(m&4)&&(m&8),NW=n===2&&(m&8)&&(m&1);
  if(m&1){if(!NW)ln([e,0],[e,e]);if(!NE)ln([1-e,0],[1-e,e])}if(m&4){if(!SW)ln([e,1-e],[e,1]);if(!SE)ln([1-e,1-e],[1-e,1])}if(m&8){if(!NW)ln([0,e],[e,e]);if(!SW)ln([0,1-e],[e,1-e])}if(m&2){if(!NE)ln([1-e,e],[1,e]);if(!SE)ln([1-e,1-e],[1,1-e])}}
 c.ox=pad+HW;c.oy=pad;c.w=c.width/sc;c.h=c.height/sc;roadC[key]=c;return c}
let sprNew=0;const SPR_MAX=5;
/* ---------- unit drawing (people & horses) ---------- */
const SKIN=['#e8bd96','#c18c62','#8a573a'],HAIR=['#5a3a22','#2a1c12','#8a5a2a','#1a1410'];
function seg2(g,x0,y0,x1,y1,w,col){g.lineCap='round';g.strokeStyle=shade(col,-.42);g.lineWidth=w+.6;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();
 const nx=-(y1-y0),ny=(x1-x0),l=Math.hypot(nx,ny)||1,ox=nx/l*w*.22,oy=ny/l*w*.22;const sx=ox<0||oy<0?1:-1;
 g.strokeStyle=shade(col,.32);g.globalAlpha=.75;g.lineWidth=w*.32;g.beginPath();g.moveTo(x0-Math.abs(ox)*.9,y0-Math.abs(oy)*.4);g.lineTo(x1-Math.abs(ox)*.9,y1-Math.abs(oy)*.4);g.stroke();
 g.strokeStyle=shade(col,-.3);g.globalAlpha=.5;g.lineWidth=w*.3;g.beginPath();g.moveTo(x0+Math.abs(ox),y0+Math.abs(oy)*.4);g.lineTo(x1+Math.abs(ox),y1+Math.abs(oy)*.4);g.stroke();g.globalAlpha=1}
function limb(g,x0,y0,a1,l1,a2,l2,w,col,col2){const x1=x0+Math.sin(a1)*l1,y1=y0+Math.cos(a1)*l1,x2=x1+Math.sin(a1+a2)*l2,y2=y1+Math.cos(a1+a2)*l2;
 if(w>0){seg2(g,x0,y0,x1,y1,w,col);seg2(g,x1,y1,x2,y2,w*.84,col2||col)}return[x2,y2,Math.atan2(x2-x1,y2-y1),x1,y1]}
function grad(g,x0,x1,c){const gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,shade(c,.26));gr.addColorStop(.45,c);gr.addColorStop(1,shade(c,-.36));return gr}
function hand(g,x,y,sk){g.fillStyle=sk;g.beginPath();g.ellipse(x,y,.85,1,0,0,7);g.fill();g.strokeStyle=shade(sk,-.4);g.lineWidth=.35;g.stroke()}
function shoe(g,x,y,col){g.fillStyle=col;g.beginPath();g.moveTo(x-1.2,y-1.6);g.quadraticCurveTo(x+2.6,y-1.8,x+2.7,y-.3);g.lineTo(x-1.3,y-.1);g.closePath();g.fill();g.fillStyle='#120b06';g.fillRect(x-1.3,y-.45,4,.5);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x-.6,y-1.55,1.8,.4)}
function weapon(g,k,h,col){const [x,y,a]=h;g.save();g.translate(x,y);g.rotate(-a);g.lineCap='round';
 const steel=(x0,y0,x1,y1,w)=>{g.strokeStyle='#6f767e';g.lineWidth=w+.5;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle='#e6eaee';g.lineWidth=w;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle='#ffffff';g.lineWidth=w*.3;g.beginPath();g.moveTo(x0-.25,y0);g.lineTo(x1-.25,y1);g.stroke()};
 const wood=(x0,y0,x1,y1,w)=>{g.strokeStyle='#3e2a18';g.lineWidth=w+.45;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();g.strokeStyle='#8a6440';g.lineWidth=w;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke()};
 switch(k){
 case 'sword':wood(0,-1,0,1.4,1.1);g.fillStyle='#c9a24a';g.beginPath();g.arc(0,-1.4,.6,0,7);g.fill();g.strokeStyle='#8a8f96';g.lineWidth=1.1;g.beginPath();g.moveTo(-2,1.6);g.lineTo(2,1.6);g.stroke();steel(0,1.9,0,10.5,1);g.fillStyle='#e6eaee';g.beginPath();g.moveTo(-.5,10.4);g.lineTo(0,11.8);g.lineTo(.5,10.4);g.fill();break;
 case 'bigsword':wood(0,-3,0,2,1.2);g.strokeStyle='#8a8f96';g.lineWidth=1.3;g.beginPath();g.moveTo(-2.8,2.1);g.lineTo(2.8,2.1);g.stroke();steel(0,2.4,0,14,1.3);break;
 case 'axe':wood(0,-2,0,9.5,1.05);g.fillStyle='#9aa1a8';g.beginPath();g.moveTo(-.4,6.4);g.lineTo(-3.9,5.4);g.quadraticCurveTo(-4.9,7.9,-3.9,10.6);g.lineTo(-.4,9.2);g.fill();g.strokeStyle='#e8ecef';g.lineWidth=.5;g.beginPath();g.moveTo(-3.9,5.6);g.quadraticCurveTo(-4.7,8,-3.9,10.4);g.stroke();break;
 case 'pick':wood(0,-2,0,9,1.05);g.strokeStyle='#5f666d';g.lineWidth=1.6;g.beginPath();g.moveTo(-4.6,7.3);g.quadraticCurveTo(0,10.6,4.6,7.3);g.stroke();g.strokeStyle='#c8cdd2';g.lineWidth=.6;g.beginPath();g.moveTo(-4.4,7.1);g.quadraticCurveTo(0,10,4.4,7.1);g.stroke();break;
 case 'ham':wood(0,-1,0,7,1.05);g.fillStyle='#7a8087';g.fillRect(-2.6,6.2,5.2,2.6);g.fillStyle='#b9bec4';g.fillRect(-2.6,6.2,5.2,.8);break;
 case 'hoe':wood(0,-5,0,10,1);g.fillStyle='#8a9096';g.fillRect(-.6,9.5,3.6,1.6);break;
 case 'basket':g.fillStyle='#9c7440';g.beginPath();g.ellipse(0,2.6,3.1,2.3,0,0,7);g.fill();g.strokeStyle='#c49a5a';g.lineWidth=.45;for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(k,1);g.lineTo(k*1.1,4.6);g.stroke()}g.strokeStyle='#5a3e1c';g.lineWidth=.6;g.beginPath();g.ellipse(0,2.6,3.1,2.3,0,0,7);g.stroke();
  for(const [bx,by,c] of [[-1.2,1.2,'#b02a40'],[.2,.8,'#d23a50'],[1.3,1.3,'#9a1f35']]){g.fillStyle=c;g.beginPath();g.arc(bx,by,.95,0,7);g.fill()}g.fillStyle='rgba(255,255,255,.5)';g.fillRect(.1,.4,.4,.4);break;
 case 'spear':wood(0,-9,0,15,1.05);g.fillStyle='#6f767e';g.beginPath();g.moveTo(0,20);g.lineTo(-1.5,15);g.lineTo(1.5,15);g.fill();g.fillStyle='#eef1f4';g.beginPath();g.moveTo(0,19.4);g.lineTo(-.9,15.3);g.lineTo(0,15.3);g.fill();break;
 case 'katana':g.strokeStyle='#1a1a1a';g.lineWidth=1.3;g.beginPath();g.moveTo(0,-2);g.lineTo(0,1.6);g.stroke();g.fillStyle='#c9a24a';g.fillRect(-1.4,1.4,2.8,.6);g.strokeStyle='#eef1f4';g.lineWidth=1;g.beginPath();g.moveTo(0,2);g.quadraticCurveTo(.8,7,0,12.5);g.stroke();break;
 case 'axe2':wood(0,-1,0,9.5,1.1);g.fillStyle='#9aa1a8';g.beginPath();g.moveTo(-.4,5.6);g.quadraticCurveTo(-5.4,5,-4.6,11.4);g.lineTo(-.4,9.6);g.fill();g.strokeStyle='#e8ecef';g.lineWidth=.5;g.beginPath();g.moveTo(-4.4,6.4);g.quadraticCurveTo(-5.2,9,-4.5,11.2);g.stroke();break;
 case 'javelin':wood(0,-6,0,12,.9);g.fillStyle='#dfe3e7';g.beginPath();g.moveTo(0,15);g.lineTo(-.9,12);g.lineTo(.9,12);g.fill();break;
 case 'staff':wood(0,-9,0,11,1);g.fillStyle='#e8c15a';g.beginPath();g.arc(0,-9.6,1,0,7);g.fill();break;
 case 'lance':wood(0,-7,0,22,1.3);g.fillStyle='#e6eaee';g.beginPath();g.moveTo(0,25);g.lineTo(-1.2,21.5);g.lineTo(1.2,21.5);g.fill();g.fillStyle=col;g.beginPath();g.moveTo(.6,19.5);g.quadraticCurveTo(3,18.8,5.2,16.4);g.lineTo(.6,15.6);g.fill();g.fillStyle='rgba(255,255,255,.3)';g.fillRect(.6,15.8,1.4,3);break}
 g.restore()}
function face_(g,hx,hy,sk,o){const {fem,hair,beard,hat}=o;
 g.fillStyle=shade(sk,-.18);g.beginPath();g.moveTo(hx-1,hy+1.4);g.lineTo(hx+.8,hy+1.6);g.lineTo(hx+.7,hy+3.4);g.lineTo(hx-1,hy+3.4);g.fill();
 const gr=g.createRadialGradient(hx+.4,hy-.8,.3,hx,hy,2.6);gr.addColorStop(0,shade(sk,.18));gr.addColorStop(.7,sk);gr.addColorStop(1,shade(sk,-.3));g.fillStyle=gr;
 g.beginPath();g.ellipse(hx,hy,1.95,2.3,0,0,7);g.fill();
 g.fillStyle=sk;g.beginPath();g.moveTo(hx+1.6,hy-1.2);g.quadraticCurveTo(hx+2.25,hy-.6,hx+2.15,hy+.1);g.lineTo(hx+2.7,hy+.75);g.lineTo(hx+2,hy+.95);g.quadraticCurveTo(hx+2.1,hy+1.5,hx+1.7,hy+1.75);g.quadraticCurveTo(hx+1.2,hy+2.3,hx+.4,hy+2.25);g.lineTo(hx+.2,hy+1);g.closePath();g.fill();
 g.strokeStyle=shade(sk,-.38);g.lineWidth=.3;g.beginPath();g.moveTo(hx+2.6,hy+.75);g.lineTo(hx+2,hy+.95);g.stroke();g.beginPath();g.moveTo(hx+1.55,hy+1.45);g.lineTo(hx+1.95,hy+1.4);g.stroke();
 g.fillStyle=shade(sk,-.28);g.beginPath();g.ellipse(hx-.45,hy+.3,.5,.75,0,0,7);g.fill();
 g.fillStyle='#f4efe6';g.beginPath();g.ellipse(hx+1.35,hy-.25,.42,.28,0,0,7);g.fill();g.fillStyle='#2a1a10';g.beginPath();g.arc(hx+1.5,hy-.25,.2,0,7);g.fill();
 g.strokeStyle=hair;g.lineWidth=.42;g.beginPath();g.moveTo(hx+.9,hy-.82);g.lineTo(hx+1.95,hy-.72);g.stroke();
 g.fillStyle='rgba(200,90,80,.25)';g.beginPath();g.arc(hx+1,hy+.85,.6,0,7);g.fill();
 if(beard){g.fillStyle=hair;g.beginPath();g.moveTo(hx-.3,hy+.6);g.quadraticCurveTo(hx+.3,hy+2.9,hx+1.6,hy+2.25);g.quadraticCurveTo(hx+2.1,hy+1.6,hx+2,hy+1.25);g.lineTo(hx+1.2,hy+1.25);g.quadraticCurveTo(hx+.8,hy+.8,hx+.2,hy+.3);g.fill()}
 if(!hat){g.fillStyle=hair;g.beginPath();g.moveTo(hx+1.7,hy-1.1);g.quadraticCurveTo(hx+1.2,hy-2.75,hx-.4,hy-2.55);g.quadraticCurveTo(hx-2.3,hy-2.2,hx-2.15,hy+.2);g.quadraticCurveTo(hx-2,hy+1.4,hx-1.1,hy+1.5);g.lineTo(hx-.9,hy-.6);g.quadraticCurveTo(hx+.3,hy-1.7,hx+1.7,hy-1.1);g.fill();
  g.strokeStyle=shade(hair,.3);g.lineWidth=.25;g.beginPath();for(let k=0;k<4;k++){g.moveTo(hx-1.5+k*.7,hy-2.2);g.quadraticCurveTo(hx-1.8+k*.5,hy-1,hx-1.9+k*.3,hy+.3)}g.stroke()}}
function person(g,o){const {an=0,state='idle',col,fem=false,skin=0,kind='vil',swing=0,tool=null,carry=0,ct=null,mounted=false}=o;const ov=o.ov||{};
 const walk=state==='walk',work=state==='work',atk=state==='atk';const s=Math.sin(an),c=Math.cos(an);
 const sk=SKIN[skin%3],hair=HAIR[(skin*3+(fem?1:0))%4];const armored=ov.armored??(kind!=='vil'&&kind!=='archer'&&kind!=='monk');const mail='#8f959c',tunic=ov.tunic||(kind==='vil'?shade(col,.12):col);
 const pants=kind==='vil'?(fem?'#6a4a34':'#6b5238'):armored?'#5c6168':'#5b4a34',boots=armored?'#3a2c20':'#4a3322',sleeve=armored?mail:kind==='archer'?'#5e6b3a':(kind==='vil'?shade(col,.3):tunic);
 const hipY=mounted?-14:-10.4,shY=mounted?-21.5:-17.4,bob=walk&&!mounted?Math.abs(c)*.35:0;g.translate(0,-bob);
 if(mounted){const e=limb(g,-.4,hipY,-1.25,4.6,1.35,4.9,2.2,pants);shoe(g,e[0],e[1]+.6,boots)}
 else{const la=walk?s*.5:0,lb=walk?-s*.5:0,ka=walk?Math.max(0,c)*.75:.04,kb=walk?Math.max(0,-c)*.75:.04;
  for(const [a,k,dk] of [[lb,kb,-.2],[la,ka,0]]){const pc=dk?shade(pants,-.25):pants;const e=limb(g,dk,hipY,a,5,-k,4.2,2.3,pc,pc);if(armored||kind==='vil'&&!fem){g.strokeStyle=dk?shade(boots,-.3):boots;g.lineWidth=2;g.lineCap='round';g.beginPath();const t=.62;g.moveTo(e[0]+(e[3]-e[0])*t,e[1]+(e[4]-e[1])*t);g.lineTo(e[0],e[1]-.4);g.stroke()}shoe(g,e[0]-.3,e[1]+1.05,dk?shade(boots,-.3):boots)}}
 let fa=walk?-s*.45:.12,fe=-.3;if(work){fa=2.2-Math.max(0,Math.sin(an))*1.3;fe=-.3}if(kind==='archer'){fa=1.45;fe=-.55}if(kind==='xbow'){fa=1.3;fe=-.9}if(kind==='spear'){fa=1.0+(atk?swing*.6:0);fe=-.7}
 const farH=limb(g,-.9,shY+.8,fa,4.1,fe,3.9,1.75,shade(sleeve,-.28),armored?shade(mail,-.28):shade(sleeve,-.28));hand(g,farH[0],farH[1],shade(sk,-.15));
 if(carry&&ct){const cc={wood:'#8a5c32',gold:'#f0c43c',stone:'#a9a9a9',food:'#c23a3a'}[ct]||'#aaa';g.fillStyle='#a88a5c';g.beginPath();g.ellipse(-3.3,shY+3.8,2.4,3.3,-.2,0,7);g.fill();g.strokeStyle='#6a5232';g.lineWidth=.4;g.stroke();g.fillStyle=cc;g.beginPath();g.ellipse(-3.3,shY+1.5,2,1.4,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.arc(-3.8,shY+1.2,.6,0,7);g.fill()}
 if(kind==='archer'||kind==='xbow'){g.save();g.translate(-2.7,shY+2.8);g.rotate(-.35);g.fillStyle='#5a3b22';g.fillRect(-1.25,-3,2.5,6.8);g.fillStyle='#7a5432';g.fillRect(-1.25,-3,.8,6.8);for(let k=0;k<3;k++){g.fillStyle=k===1?'#e8e0cc':'#c8b890';g.fillRect(-1+k*.8,-4.4,.6,1.6)}g.restore()}
 if(ov.cape){g.fillStyle=shade(col,-.3);g.beginPath();g.moveTo(-2.4,shY);g.quadraticCurveTo(-5.6,hipY,-4.8,mounted?hipY+2.5:-1);g.lineTo(-.8,mounted?hipY+2.5:-1.4);g.lineTo(1.4,shY);g.closePath();g.fill();g.strokeStyle='#e8c15a';g.lineWidth=.4;g.stroke()}
 const bot=fem&&!mounted?-1.3:hipY+3.2;const base=armored?mail:tunic;
 g.fillStyle=grad(g,-3,3,base);g.beginPath();g.moveTo(-2.9,shY+.2);g.quadraticCurveTo(-1.4,shY-.9,0,shY-.8);g.quadraticCurveTo(1.6,shY-.9,2.9,shY+.3);g.quadraticCurveTo(2.6,shY+3.4,2.05,hipY-.4);g.lineTo(fem?3.6:3,bot);g.quadraticCurveTo(0,bot+.7,fem?-3.6:-3,bot);g.lineTo(-2.05,hipY-.4);g.quadraticCurveTo(-2.6,shY+3.4,-2.9,shY+.2);g.closePath();g.fill();
 g.save();g.clip();const rg=g.createRadialGradient(-1.6,shY+1.4,.4,-.5,shY+3,7);rg.addColorStop(0,'rgba(255,255,255,.22)');rg.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=rg;g.fillRect(-4,shY-2,8,bot-shY+3);
 g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=.35;g.beginPath();g.moveTo(-1,hipY+.8);g.quadraticCurveTo(-1.3,bot-1,-1.8,bot);g.moveTo(1,hipY+.8);g.quadraticCurveTo(1.4,bot-1,1.7,bot);g.moveTo(-1.4,shY+2.2);g.quadraticCurveTo(0,shY+3,1.6,shY+2.2);g.stroke();
 if(armored){g.fillStyle='rgba(40,44,50,.35)';for(let yy=shY+.8;yy<bot;yy+=.9)for(let xx=-2.8+((yy*10|0)%2)*.45;xx<2.9;xx+=.9)g.fillRect(xx,yy,.42,.42);g.fillStyle='rgba(255,255,255,.18)';for(let yy=shY+1.1;yy<hipY;yy+=.9)g.fillRect(-2.2,yy,.4,.3)}
 g.restore();g.strokeStyle='rgba(20,12,6,.55)';g.lineWidth=.45;g.stroke();
 if(armored){g.fillStyle=grad(g,-1.9,1.9,col);g.beginPath();g.moveTo(-1.9,shY+.5);g.lineTo(1.9,shY+.5);g.lineTo(1.7,bot+.8);g.lineTo(0,bot+1.3);g.lineTo(-1.7,bot+.8);g.closePath();g.fill();g.strokeStyle='rgba(20,12,6,.5)';g.lineWidth=.4;g.stroke();
  g.strokeStyle='#e8cf7a';g.lineWidth=.55;g.beginPath();g.moveTo(0,shY+1.6);g.lineTo(0,shY+4.4);g.moveTo(-1,shY+2.6);g.lineTo(1,shY+2.6);g.stroke();
  if(kind==='champ'){g.fillStyle='#b9c0c7';g.beginPath();g.ellipse(-2.4,shY+.6,1.5,1.1,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.5)';g.fillRect(-3,shY,.8,.6)}}
 else if(kind==='vil'){g.fillStyle=sk;g.beginPath();g.moveTo(-.9,shY-.6);g.lineTo(.9,shY-.6);g.lineTo(0,shY+1.3);g.closePath();g.fill();
  if(!fem){g.fillStyle='#8a6a45';g.beginPath();g.moveTo(-1.7,hipY-1.4);g.lineTo(2.3,hipY-1.4);g.lineTo(2.5,bot+.2);g.lineTo(-1.3,bot+.2);g.closePath();g.fill();g.strokeStyle='rgba(40,25,10,.4)';g.lineWidth=.35;g.stroke()}
  else{g.fillStyle='#f1ead8';g.beginPath();g.moveTo(-1.3,hipY-1.4);g.lineTo(1.9,hipY-1.4);g.lineTo(2.5,bot-.4);g.lineTo(-1,bot-.4);g.closePath();g.fill();g.strokeStyle='rgba(120,100,70,.4)';g.lineWidth=.35;g.stroke()}}
 g.fillStyle='#3a2716';g.fillRect(-2.2,hipY-1,4.4,1.1);g.fillStyle='#d8b45a';g.fillRect(.4,hipY-1.05,1,1.2);g.fillStyle='#6a4a2a';g.beginPath();g.ellipse(-1.6,hipY+.6,.9,1.1,0,0,7);g.fill();
 const hx=.3,hy=shY-3.1;const hatK=ov.hat!==undefined?ov.hat:(kind==='vil'?(fem?'scarf':null):kind);const beard=!fem&&(skin===0||skin===3||kind==='knight');
 face_(g,hx,hy,sk,{fem,hair,beard,hat:!!hatK&&hatK!=='crown'});
 if(ov.paint){g.strokeStyle='#2f5fb8';g.lineWidth=.45;g.beginPath();g.moveTo(hx+.4,hy-1.6);g.lineTo(hx+1.8,hy+.2);g.moveTo(hx-.4,hy-.8);g.lineTo(hx+1,hy+1.6);g.stroke()}
 const steelG=(x0,x1)=>{const gr2=g.createLinearGradient(x0,0,x1,0);gr2.addColorStop(0,'#e8ecef');gr2.addColorStop(.4,'#a7adb4');gr2.addColorStop(1,'#5c6269');return gr2};
 if(hatK==='hood'){g.fillStyle=ov.tunic||'#6b4a2e';g.beginPath();g.moveTo(hx+1.6,hy-1.6);g.quadraticCurveTo(hx+.6,hy-3.4,hx-1,hy-3);g.quadraticCurveTo(hx-3,hy-2.2,hx-2.8,hy+1);g.quadraticCurveTo(hx-2.6,hy+3,hx-1,hy+3.4);g.lineTo(hx-.4,hy+1.6);g.quadraticCurveTo(hx-.8,hy-1,hx+1.6,hy-1.6);g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=.35;g.stroke()}
 else if(hatK==='crown'){g.fillStyle='#e8c15a';g.beginPath();g.moveTo(hx-2,hy-2);g.lineTo(hx-2,hy-3.6);g.lineTo(hx-1.2,hy-2.8);g.lineTo(hx-.2,hy-4);g.lineTo(hx+.8,hy-2.8);g.lineTo(hx+1.8,hy-3.6);g.lineTo(hx+1.9,hy-2);g.closePath();g.fill();g.strokeStyle='#8a6a20';g.lineWidth=.3;g.stroke();g.fillStyle='#d23a3a';g.beginPath();g.arc(hx,hy-2.6,.4,0,7);g.fill()}
 else if(hatK==='kabuto'){g.fillStyle='#2a2a30';g.beginPath();g.arc(hx,hy-.7,2.5,Math.PI,0);g.fill();g.fillStyle='#3a3a44';g.beginPath();g.moveTo(hx-3.2,hy+.2);g.lineTo(hx+2.4,hy-.4);g.lineTo(hx+2.2,hy+.3);g.lineTo(hx-3,hy+1.4);g.closePath();g.fill();g.strokeStyle='#d8b04a';g.lineWidth=.6;g.beginPath();g.moveTo(hx+.4,hy-2.8);g.quadraticCurveTo(hx+2.2,hy-4.6,hx+3,hy-5.4);g.moveTo(hx-.2,hy-2.8);g.quadraticCurveTo(hx-1.6,hy-4.6,hx-2.4,hy-5.4);g.stroke()}
 else if(hatK==='turban'){g.fillStyle='#efe8d6';g.beginPath();g.ellipse(hx-.1,hy-1.6,2.7,1.8,0,0,7);g.fill();g.strokeStyle='rgba(120,100,70,.5)';g.lineWidth=.35;g.beginPath();g.moveTo(hx-2.5,hy-1.8);g.quadraticCurveTo(hx,hy-.6,hx+2.5,hy-2);g.stroke();g.fillStyle='#a7adb4';g.beginPath();g.arc(hx,hy-3,1,0,7);g.fill()}
 else if(hatK==='fur'){g.fillStyle='#6a5038';g.beginPath();g.moveTo(hx+1.8,hy-1.2);g.quadraticCurveTo(hx+.6,hy-3.6,hx-1.2,hy-3.2);g.quadraticCurveTo(hx-3.4,hy-2.4,hx-3,hy+1.6);g.quadraticCurveTo(hx-3.4,hy+4,hx-2.2,hy+5);g.lineTo(hx-1,hy+1.4);g.quadraticCurveTo(hx-.8,hy-1.2,hx+1.8,hy-1.2);g.fill();g.strokeStyle='#8a6e50';g.lineWidth=.4;for(let k=0;k<5;k++){g.beginPath();g.moveTo(hx-2.8+k*.9,hy-2.8);g.lineTo(hx-3+k*.9,hy-1.6);g.stroke()}}
 else if(hatK==='cap'){g.fillStyle='#7a4a2a';g.beginPath();g.arc(hx,hy-.9,2.45,Math.PI,0);g.fill();g.fillStyle='#c9a87a';g.fillRect(hx-2.6,hy-1.1,5.2,1);g.fillStyle=col;g.beginPath();g.moveTo(hx,hy-3.3);g.lineTo(hx+.6,hy-4.6);g.lineTo(hx+1,hy-3.2);g.fill()}
 else if(hatK==='cap2'){g.fillStyle='#3f5a2a';g.beginPath();g.moveTo(hx-2.6,hy-.6);g.quadraticCurveTo(hx-1,hy-3.8,hx+2.8,hy-1.4);g.lineTo(hx+2.6,hy-.8);g.closePath();g.fill();g.strokeStyle='#c83a3a';g.lineWidth=.55;g.beginPath();g.moveTo(hx-1.4,hy-2.4);g.lineTo(hx-3.6,hy-4.6);g.stroke()}
 else if(hatK==='cap3'){g.fillStyle=col;g.beginPath();g.ellipse(hx-.2,hy-2,3,1.2,-.15,0,7);g.fill();g.strokeStyle='#efe6d0';g.lineWidth=.7;g.beginPath();g.moveTo(hx-1,hy-2.6);g.quadraticCurveTo(hx-3.6,hy-5,hx-4.6,hy-2.6);g.stroke()}
 else if(hatK==='scarf'){g.fillStyle='#ece3cc';g.beginPath();g.moveTo(hx+1.75,hy-1.3);g.quadraticCurveTo(hx+.9,hy-3.1,hx-.6,hy-2.9);g.quadraticCurveTo(hx-2.6,hy-2.4,hx-2.5,hy+.4);g.quadraticCurveTo(hx-2.6,hy+2.8,hx-1.6,hy+3.4);g.lineTo(hx-.6,hy+1.6);g.quadraticCurveTo(hx-.9,hy-.6,hx+1.75,hy-1.3);g.fill();g.strokeStyle='rgba(110,90,60,.45)';g.lineWidth=.35;g.stroke();g.beginPath();g.moveTo(hx-1.6,hy-1.8);g.quadraticCurveTo(hx-2,hy+.5,hx-1.4,hy+2.6);g.stroke()}
 else if(hatK==='archer'){g.fillStyle='#4e5a2e';g.beginPath();g.moveTo(hx-2.7,hy+2.8);g.lineTo(hx-2.6,hy-1.2);g.quadraticCurveTo(hx-1,hy-4.4,hx+2.4,hy-1.6);g.lineTo(hx+2,hy-1);g.quadraticCurveTo(hx,hy-1.8,hx-.9,hy+2.8);g.closePath();g.fill();g.fillStyle='rgba(255,255,255,.15)';g.beginPath();g.moveTo(hx-1.8,hy-2);g.quadraticCurveTo(hx-.5,hy-3.4,hx+1.2,hy-2.2);g.lineTo(hx-1.4,hy-1.2);g.fill();g.strokeStyle='#e8e0cc';g.lineWidth=.55;g.beginPath();g.moveTo(hx-1,hy-2.8);g.lineTo(hx-3.4,hy-5.6);g.stroke()}
 else if(hatK==='spear'||hatK==='xbow'){g.fillStyle=steelG(hx-2.4,hx+2.4);g.beginPath();g.arc(hx,hy-.9,2.35,Math.PI,0);g.fill();g.fillStyle=steelG(hx-3.8,hx+3.8);g.beginPath();g.ellipse(hx,hy-.8,3.8,.85,0,0,7);g.fill();g.strokeStyle='#4a5056';g.lineWidth=.35;g.stroke();g.fillStyle='#8f959c';g.fillRect(hx-2.2,hy-.2,1.2,2.6)}
 else if(hatK==='champ'||hatK==='knight'){g.fillStyle=steelG(hx-2.5,hx+2.6);rr(g,hx-2.45,hy-2.9,5.1,5.3,1.1);g.fill();g.strokeStyle='#4a5056';g.lineWidth=.35;g.stroke();g.fillStyle='#16161a';g.fillRect(hx+.2,hy-.9,2.4,.6);g.fillStyle='#22222a';for(let k=0;k<3;k++)g.fillRect(hx+1.2+k*.5,hy+.5,.25,.8);
  g.fillStyle=col;g.beginPath();g.moveTo(hx-.2,hy-2.9);g.quadraticCurveTo(hx-3.6,hy-6.2,hx-4.6,hy-1.6);g.quadraticCurveTo(hx-2.2,hy-4,hx+.5,hy-2.9);g.fill();g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.moveTo(hx-.6,hy-3.2);g.quadraticCurveTo(hx-2.6,hy-5,hx-3.4,hy-3.8);g.lineTo(hx-.6,hy-3);g.fill()}
 else if(hatK){g.fillStyle=steelG(hx-2.5,hx+2.5);g.beginPath();g.arc(hx,hy-.6,2.5,Math.PI*1.02,Math.PI*1.98);g.lineTo(hx+2.45,hy+.1);g.lineTo(hx-2.45,hy+.1);g.closePath();g.fill();g.strokeStyle='#4a5056';g.lineWidth=.35;g.stroke();g.fillStyle='#8f959c';g.fillRect(hx+1.6,hy-.7,.7,2.6);
  g.fillStyle='#8a9097';g.beginPath();g.moveTo(hx-2.5,hy);g.lineTo(hx-1,hy);g.lineTo(hx-.6,hy+3.2);g.lineTo(hx-2.6,hy+3.4);g.closePath();g.fill();g.fillStyle='rgba(40,44,50,.35)';for(let yy=hy+.3;yy<hy+3.2;yy+=.8)for(let xx=hx-2.4;xx<hx-.9;xx+=.8)g.fillRect(xx,yy,.38,.38)}
 if(ov.shield??(kind==='militia'||kind==='champ'||kind==='scout')){g.save();g.translate(-.3,shY+4.6);const sg=g.createLinearGradient(-3,0,3,0);sg.addColorStop(0,shade(col,.3));sg.addColorStop(.5,col);sg.addColorStop(1,shade(col,-.35));g.fillStyle=sg;g.beginPath();g.moveTo(-2.9,-3.4);g.quadraticCurveTo(0,-4.1,2.9,-3.4);g.quadraticCurveTo(3,2,0,4.9);g.quadraticCurveTo(-3,2,-2.9,-3.4);g.fill();g.strokeStyle='#c9ae72';g.lineWidth=.75;g.stroke();
  g.strokeStyle='rgba(255,240,200,.8)';g.lineWidth=.6;g.beginPath();g.moveTo(0,-3.2);g.lineTo(0,4.2);g.moveTo(-2.4,-1);g.lineTo(2.4,-1);g.stroke();g.fillStyle='#d8c08a';g.beginPath();g.arc(0,-1,.8,0,7);g.fill();g.fillStyle='#fff';g.fillRect(-.3,-1.3,.35,.35);g.restore()}
 let na=walk?s*.45:-.1,ne=-.3,item=null;
 if(kind==='vil'){item=tool==='hoe'&&ct==='food'&&!work?null:tool;if(work){const k=Math.max(0,Math.sin(an));na=tool==='hoe'?1.0+k*.8:2.6-k*1.6;ne=-.5}if(tool==='hoe'&&ct==='food'){item='basket';na=.9;ne=-.9}}
 else if(kind==='militia'||kind==='champ'){item=kind==='champ'?'bigsword':'sword';na=atk?2.7-swing*2.1:.5;ne=atk?-.4:-1.1}
 else if(kind==='spear'){item='spear';na=atk?1.2+swing*.5:1.0;ne=-.9}
 else if(kind==='archer'){na=1.5;ne=0}else if(kind==='xbow'){na=1.35;ne=-.8}
 else if(kind==='scout'){item='sword';na=atk?2.6-swing*2:.6;ne=-1}else if(kind==='knight'){item='lance';na=1.1+(atk?swing*.3:0);ne=-1}
 const nh=limb(g,.6,shY+.8,na,4.1,ne,3.9,1.95,sleeve,armored?mail:(kind==='vil'?sk:sleeve));
 if(ov.wpn){item=ov.wpn;if(item==='javelin'){na=atk?2.5-swing*1.6:1.1;ne=-1}else if(item==='spear'){na=1;ne=-.9}else if(item==='staff'){na=.35;ne=-.7}else{na=atk?2.7-swing*2.1:.5;ne=atk?-.4:-1.1}}
 if(item){const lv=kind==='spear'||kind==='knight'||item==='spear'||item==='lance';weapon(g,item,[nh[0],nh[1],lv?Math.PI/2+.05:nh[2]],col)}
 hand(g,nh[0],nh[1],armored?'#6e737a':sk);
 if(kind==='archer'){const x=nh[0]+.6,y=nh[1],BR=ov.longbow?8.8:6.6;g.lineCap='round';g.strokeStyle='#3e2a18';g.lineWidth=1.7;g.beginPath();g.arc(x-3,y,BR,-1.15,1.15);g.stroke();g.strokeStyle='#8a6440';g.lineWidth=1.1;g.beginPath();g.arc(x-3,y,BR,-1.15,1.15);g.stroke();
  g.strokeStyle='#efe6d0';g.lineWidth=.4;g.beginPath();g.moveTo(x-3+6.6*Math.cos(-1.15),y+6.6*Math.sin(-1.15));g.lineTo(farH[0],farH[1]);g.lineTo(x-3+6.6*Math.cos(1.15),y+6.6*Math.sin(1.15));g.stroke();
  if(!atk||swing>.3){g.strokeStyle='#7a5a34';g.lineWidth=.7;g.beginPath();g.moveTo(farH[0],farH[1]);g.lineTo(x+3.6,y);g.stroke();g.fillStyle='#c8cdd2';g.beginPath();g.moveTo(x+4.6,y);g.lineTo(x+3.4,y-.6);g.lineTo(x+3.4,y+.6);g.fill()}}
 if(kind==='xbow'){g.save();g.translate(nh[0],nh[1]);g.fillStyle='#5a3b22';g.fillRect(-6,-.8,9,1.6);g.fillStyle='#8a6440';g.fillRect(-6,-.8,9,.6);g.strokeStyle='#3e2a18';g.lineWidth=1.3;g.beginPath();g.moveTo(2.6,-4);g.quadraticCurveTo(4.2,0,2.6,4);g.stroke();g.strokeStyle='#efe6d0';g.lineWidth=.4;g.beginPath();g.moveTo(2.6,-4);g.lineTo(-1,0);g.lineTo(2.6,4);g.stroke();g.restore()}
 g.translate(0,bob)}
function horse(g,o){const {an=0,walk=false,coat='#7a5232',col,knight=false}=o;const s=Math.sin(an*1.2);const dk=shade(coat,-.38),mane=shade(coat,-.6),lt=shade(coat,.25);
 const leg=(x,y,p,far,front)=>{const a=walk?p*.55:0,k=walk?Math.max(0,p)*.85:.06;const lc=far?dk:coat;const e=limb(g,x,y,a,5,front?-k:k,4.8,far?2:2.4,lc,lc);g.fillStyle='#1c140d';g.beginPath();g.moveTo(e[0]-1.2,e[1]+.2);g.lineTo(e[0]+1.4,e[1]+.2);g.lineTo(e[0]+1.1,e[1]-1.2);g.lineTo(e[0]-1,e[1]-1.2);g.fill();if(!far){g.fillStyle='rgba(255,255,255,.22)';g.fillRect(e[0]-.9,e[1]-2.4,1.8,.9)}};
 leg(-6.2,-9.6,s,true,false);leg(5,-10,-s,true,true);
 g.strokeStyle=mane;g.lineWidth=2.4;g.lineCap='round';g.beginPath();g.moveTo(-8.8,-13.2);g.quadraticCurveTo(-12.4,-11+(walk?s:0),-11.4,-4.6);g.stroke();g.strokeStyle=shade(mane,.25);g.lineWidth=.6;g.beginPath();g.moveTo(-9.6,-12.6);g.quadraticCurveTo(-12,-10,-11.2,-5.6);g.stroke();
 const gr=g.createLinearGradient(0,-16.5,0,-6.5);gr.addColorStop(0,lt);gr.addColorStop(.5,coat);gr.addColorStop(1,dk);g.fillStyle=gr;
 g.beginPath();g.moveTo(-9.2,-12);g.quadraticCurveTo(-9.4,-16,-5,-15.8);g.quadraticCurveTo(0,-15,4.6,-16);g.quadraticCurveTo(7.5,-20,10.4,-22.6);g.lineTo(13.4,-21.2);g.quadraticCurveTo(11.2,-17.5,9.6,-12.5);g.quadraticCurveTo(9,-8.4,5.6,-8);g.quadraticCurveTo(0,-7,-5,-7.6);g.quadraticCurveTo(-9.2,-8,-9.2,-12);g.closePath();g.fill();g.strokeStyle='rgba(20,12,6,.55)';g.lineWidth=.5;g.stroke();
 g.fillStyle='rgba(255,255,255,.16)';g.beginPath();g.ellipse(-5.6,-12.6,3,2.4,-.2,0,7);g.fill();g.beginPath();g.ellipse(5.6,-12.4,2.4,2.6,.3,0,7);g.fill();
 g.fillStyle=gr;g.beginPath();g.moveTo(10,-23.3);g.quadraticCurveTo(14.6,-22.7,16.9,-18.7);g.quadraticCurveTo(16.6,-16.9,14.8,-17.3);g.quadraticCurveTo(12.6,-18.8,10.4,-19.6);g.closePath();g.fill();g.strokeStyle='rgba(20,12,6,.55)';g.stroke();
 g.fillStyle=dk;g.beginPath();g.moveTo(10.5,-23.1);g.lineTo(11.2,-25.9);g.lineTo(12.2,-22.7);g.fill();g.fillStyle='#0e0a08';g.beginPath();g.arc(12.7,-21.3,.6,0,7);g.fill();g.fillStyle='#fff';g.fillRect(12.6,-21.6,.25,.25);g.beginPath();g.fillStyle='#0e0a08';g.arc(16.1,-18.1,.42,0,7);g.fill();
 g.strokeStyle=mane;g.lineWidth=1.9;g.beginPath();g.moveTo(10.2,-23.1);g.quadraticCurveTo(7,-20,4.8,-15.8);g.stroke();
 if(knight){g.fillStyle=grad(g,-9,9,col);g.beginPath();g.moveTo(-8.6,-14);g.quadraticCurveTo(-1,-16.6,7.2,-15);g.lineTo(9,-8.4);for(let k=0;k<6;k++)g.lineTo(7.8-k*3.3,-6.6+(k%2)*1);g.lineTo(-9.2,-8.4);g.closePath();g.fill();g.strokeStyle='#e8d090';g.lineWidth=.6;g.stroke();
  g.strokeStyle='rgba(255,240,200,.7)';g.lineWidth=.5;g.beginPath();g.moveTo(-1,-15);g.lineTo(-1,-8);g.moveTo(-3,-12);g.lineTo(1,-12);g.stroke();
  g.fillStyle='#b9bec4';g.beginPath();g.moveTo(10,-23.3);g.quadraticCurveTo(14.6,-22.6,16.5,-19.3);g.lineTo(13,-20.6);g.closePath();g.fill()}
 else{g.fillStyle=grad(g,-4,3,col);g.fillRect(-4.2,-15.6,6.8,4.4);g.strokeStyle='#e8d090';g.lineWidth=.5;g.strokeRect(-4.2,-15.6,6.8,4.4);g.fillStyle='#4a2f1a';g.beginPath();g.moveTo(-3.6,-15.6);g.quadraticCurveTo(-1,-17.2,2,-15.6);g.lineTo(2,-15);g.lineTo(-3.6,-15);g.fill()}
 g.strokeStyle='#3a2716';g.lineWidth=.55;g.beginPath();g.moveTo(15.8,-18.5);g.lineTo(2.2,-17.4);g.stroke();
 leg(-4.2,-9.4,-s,false,false);leg(7,-10,s,false,true)}

const LOOK={villager:{k:'vil'},spear:{k:'spear'},archer:{k:'archer'},militia:{k:'militia'},xbow:{k:'xbow'},champ:{k:'champ'},
 king:{k:'champ',ov:{hat:'crown',cape:1,wpn:'sword',shield:true,tunic:'#6a2a7a'}},
 monk:{k:'monk',fem:1,ov:{hat:'hood',tunic:'#6b4a2e',armored:false,wpn:'staff',shield:false}},
 longbow:{k:'archer',ov:{longbow:1,hat:'cap2'}},landsknecht:{k:'champ',ov:{hat:'cap3',armored:false,tunic:null,wpn:'bigsword',shield:false}},
 berserker:{k:'militia',ov:{hat:'fur',armored:false,wpn:'axe2',shield:true}},woad:{k:'militia',ov:{hat:null,armored:false,paint:1,wpn:'sword',shield:true}},
 samurai:{k:'champ',ov:{hat:'kabuto',wpn:'katana',shield:false}},chukonu:{k:'xbow',ov:{hat:'cap'}},heroinf:{k:'champ',ov:{hat:'crown',cape:1,wpn:'bigsword',shield:false}},
 scout:{rider:'scout'},knight:{rider:'knight',kn:1},gendarme:{rider:'knight',kn:1,coat:['#2e2a28','#3a3330','#4a3f38']},cataphract:{rider:'knight',kn:1,barding:1},
 jinete:{rider:'scout',ov:{wpn:'javelin',hat:'cap',shield:true}},mameluke:{rider:'scout',camel:1,ov:{hat:'turban',wpn:'sword',shield:false}},mangudai:{rider:'archer',ov:{hat:'cap'}},
 herocav:{rider:'knight',kn:1,ov:{hat:'crown',cape:1}},heroarc:{rider:'archer',ov:{hat:'crown',cape:1}}};
function camelHump(g,coat){g.fillStyle=shade(coat,.1);g.beginPath();g.ellipse(-2.2,-16.2,4,2.6,0,Math.PI,0);g.fill();g.strokeStyle='rgba(20,12,6,.5)';g.lineWidth=.5;g.stroke()}
function cart(g,col,an,walk){const s=walk?Math.sin(an):0;horse(g,{an,walk,coat:'#7a5a3a',col:'#6b4a2c',knight:false});
 g.save();g.translate(-12,0);g.fillStyle='#7a5634';g.fillRect(-9,-12,14,5);g.strokeStyle='#4a3020';g.lineWidth=.6;g.strokeRect(-9,-12,14,5);
 g.fillStyle=shade(col,.15);g.beginPath();g.moveTo(-9,-12);g.quadraticCurveTo(-2,-21,5,-12);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.4)';g.stroke();
 g.fillStyle='#9a6a3a';g.beginPath();g.ellipse(-5,-13.5,1.8,2,0,0,7);g.fill();g.strokeStyle='#4a3020';g.lineWidth=1.6;g.beginPath();g.moveTo(5,-9);g.lineTo(13,-11);g.stroke();
 for(const wx of [-6,2]){g.fillStyle='#3a2716';g.beginPath();g.arc(wx,-4,3.2,0,7);g.fill();g.strokeStyle='#8a6a40';g.lineWidth=.6;g.beginPath();for(let a=0;a<3;a++){const r=a+s*.3;g.moveTo(wx+Math.cos(r)*3,-4+Math.sin(r)*3);g.lineTo(wx-Math.cos(r)*3,-4-Math.sin(r)*3)}g.stroke()}g.restore()}
function ship(g,type,col,an,u){const bob=Math.sin(an*.6)*.6;g.translate(0,bob);const L=type==='galley'?22:14;
 g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(0,1,L+3,3.2,0,0,7);g.fill();
 const hull=type==='galley'?'#5a3a22':'#7a5634';const gr=g.createLinearGradient(0,-8,0,2);gr.addColorStop(0,shade(hull,.25));gr.addColorStop(1,shade(hull,-.35));g.fillStyle=gr;
 g.beginPath();g.moveTo(-L,-6);g.quadraticCurveTo(-L+2,1.5,-L*.4,2);g.lineTo(L*.5,2);g.quadraticCurveTo(L+1,1,L+3,-7);g.lineTo(L-1,-6);g.lineTo(-L,-6);g.closePath();g.fill();g.strokeStyle='#2a1a0e';g.lineWidth=.6;g.stroke();
 g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=.4;g.beginPath();g.moveTo(-L+1,-3.5);g.lineTo(L,-3.5);g.stroke();
 if(type==='galley'){for(let k=-L+5;k<L-3;k+=3.2){g.strokeStyle='#4a3020';g.lineWidth=.6;const a=Math.sin(an*1.4+k)*1.5;g.beginPath();g.moveTo(k,-3);g.lineTo(k-2+a,3.5);g.stroke()}
  for(let k=-L+4;k<L-2;k+=3.4){g.fillStyle=k%2?col:'#d8c08a';g.beginPath();g.arc(k,-6.4,1.3,0,7);g.fill()}
  g.strokeStyle='#3a2716';g.lineWidth=1.3;g.beginPath();g.moveTo(0,-6);g.lineTo(0,-34);g.moveTo(-11,-30);g.lineTo(11,-30);g.stroke();
  const sg=g.createLinearGradient(-11,0,11,0);sg.addColorStop(0,shade(col,.25));sg.addColorStop(1,shade(col,-.25));g.fillStyle=sg;g.beginPath();g.moveTo(-11,-30);g.quadraticCurveTo(0,-26,11,-30);g.lineTo(10,-13);g.quadraticCurveTo(0,-10,-10,-13);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=.5;g.stroke();
  g.strokeStyle='#f0e6cc';g.lineWidth=1.1;g.beginPath();g.moveTo(0,-28);g.lineTo(0,-14);g.moveTo(-5,-21);g.lineTo(5,-21);g.stroke();
  g.fillStyle='#e8c15a';g.beginPath();g.moveTo(L+3,-7);g.quadraticCurveTo(L+5,-11,L+3,-12);g.lineTo(L+1.5,-7);g.fill()}
 else{g.strokeStyle='#3a2716';g.lineWidth=1;g.beginPath();g.moveTo(-2,-6);g.lineTo(-2,-24);g.stroke();g.fillStyle='#efe6cf';g.beginPath();g.moveTo(-1.6,-23);g.lineTo(9,-9);g.lineTo(-1.6,-8);g.closePath();g.fill();g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=.4;g.stroke();
  g.fillStyle=col;g.beginPath();g.moveTo(-1.6,-14);g.lineTo(4.6,-14);g.lineTo(3.2,-12);g.lineTo(-1.6,-12);g.fill();
  g.strokeStyle='rgba(220,210,180,.7)';g.lineWidth=.4;for(let k=0;k<4;k++){g.beginPath();g.moveTo(-L+1+k*2,-5);g.lineTo(-L-2+k*2.4,1);g.stroke()}
  if(u&&u.carry>0){g.fillStyle='#8ab4d8';g.beginPath();g.ellipse(6,-7,2.6,1.2,0,0,7);g.fill()}}}
function mangonel(g,col,u){g.strokeStyle='#5a3b20';g.lineWidth=2.2;g.beginPath();g.moveTo(-11,-3);g.lineTo(11,-3);g.moveTo(-9,-3);g.lineTo(-9,-9);g.lineTo(9,-9);g.lineTo(9,-3);g.moveTo(4,-9);g.lineTo(4,-17);g.stroke();
 const a=-.5-((u&&u.cd>0)?Math.min(1,u.cd/5)*1.6:0);g.save();g.translate(-4,-9);g.rotate(a);g.lineWidth=2;g.beginPath();g.moveTo(0,0);g.lineTo(-16,0);g.stroke();g.fillStyle='#4a3a2a';g.beginPath();g.arc(-17,0,2.6,0,Math.PI);g.fill();g.restore();
 for(const wx of [-8,8]){g.fillStyle='#3a2716';g.beginPath();g.arc(wx,-1,3,0,7);g.fill();g.fillStyle='#8a6a40';g.beginPath();g.arc(wx,-1,1.1,0,7);g.fill()}g.fillStyle=col;g.fillRect(-2,-11,4,2)}
function drawUnit(g,type,o,face,an,state,u,noSh){const col=PCOL[o]||'#888',d=U[type];u=u||{};g.save();g.scale(face,1);const swing=state==='atk'?Math.sin((1-(u.swing||0)/.3)*Math.PI):0;const walk=state==='walk';
 if(d.tag==='shp'){ship(g,type,col,an+(u.id||0),u);g.restore();return}
 if(d.tag==='sie'||type==='trader'){if(!noSh){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,0,15,4.5,0,0,7);g.fill()}
  if(type==='trader'){cart(g,col,an,walk);g.restore();return}
  if(type==='mangonel'){mangonel(g,col,u);g.restore();return}
  if(type==='ram'){g.fillStyle='#6d4b2c';g.fillRect(-13,-15,26,12);g.strokeStyle='#4a3020';g.lineWidth=.6;for(let k=-13;k<13;k+=3){g.beginPath();g.moveTo(k,-15);g.lineTo(k,-3);g.stroke()}g.fillStyle='#57391f';g.beginPath();g.moveTo(-15,-14);g.lineTo(0,-23);g.lineTo(15,-14);g.fill();
   g.fillStyle='#7a6a50';g.beginPath();g.moveTo(-14,-14.5);g.lineTo(0,-22.5);g.lineTo(0,-19);g.lineTo(-11,-13);g.fill();g.fillStyle=col;g.fillRect(-13,-8,26,2);
   g.fillStyle='#8a8070';g.fillRect(12+Math.max(0,swing)*3,-11.5,6,5);g.fillStyle='#5a5248';g.fillRect(17+Math.max(0,swing)*3,-12,2,6);for(const wx of [-9,0,9]){g.fillStyle='#3a2716';g.beginPath();g.arc(wx,-2,3.5,0,7);g.fill();g.fillStyle='#8a6a40';g.beginPath();g.arc(wx,-2,1.4,0,7);g.fill()}}
  else{g.strokeStyle='#5a3b20';g.lineWidth=2.5;g.beginPath();g.moveTo(-12,-2);g.lineTo(12,-2);g.moveTo(-8,-2);g.lineTo(0,-20);g.lineTo(8,-2);g.stroke();const a=-.9+((u.cd||0)>0?Math.min(1,u.cd/4)*1.6:0);g.save();g.translate(0,-20);g.rotate(a);g.lineWidth=2;g.beginPath();g.moveTo(-8,0);g.lineTo(20,0);g.stroke();g.fillStyle='#4a4038';g.fillRect(-12,-2,6,8);g.restore();
   for(const wx of [-10,10]){g.fillStyle='#3a2716';g.beginPath();g.arc(wx,-1,3,0,7);g.fill()}g.fillStyle=col;g.fillRect(-2,-24,4,3)}
  g.restore();return}
 if(!noSh){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(0,0,d.tag==='cav'?11:5.5,d.tag==='cav'?3.2:2.2,0,0,7);g.fill()}
 const v=u.vr||0,lk=LOOK[d.look]||LOOK[type]||{k:'vil'};
 if(lk.rider){const coat=lk.camel?'#c9a36a':(lk.coat||(lk.kn?['#d9d4c8','#4a3a2c','#8a8a8a']:['#7a5232','#5a3a22','#9a6a3a']))[v%3];
  horse(g,{an,walk,coat,col:lk.barding?'#9aa0a8':col,knight:!!lk.kn});if(lk.camel)camelHump(g,coat);g.translate(.5,lk.camel?-1.5:0);person(g,{an,state,col,skin:v,kind:lk.rider,swing,mounted:true,ov:lk.ov});g.restore();return}
 person(g,{an,state,col,fem:lk.fem||(type==='villager'&&v%2===1),skin:v%3,kind:lk.k,swing,tool:u.tool||null,carry:u.carry,ct:u.ct,ov:lk.ov});g.restore()}
function drawAnimal(g,type,face,an,mv,carc){g.save();g.scale(face,1);const s=mv?Math.sin(an):0;
 if(carc){g.rotate(0);g.translate(0,-1)}
 const coat=type==='deer'?'#9a6a3a':type==='boar'?'#4a3a30':'#ece6d8',dk=shade(coat,-.35);
 const leg=(x,p,far)=>{if(carc)return;g.strokeStyle=far?dk:shade(coat,-.15);g.lineWidth=type==='sheep'?1.3:1.1;g.lineCap='round';g.beginPath();g.moveTo(x,-5);g.lineTo(x+p*1.4,-.3);g.stroke()};
 if(carc){g.fillStyle=coat;g.beginPath();g.ellipse(0,-2,type==='boar'?6:5.5,2.2,0,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=.5;g.stroke();g.fillStyle='#7a1a1a';g.beginPath();g.ellipse(1.5,-.8,2.4,.9,0,0,7);g.fill();g.restore();return}
 leg(-3,s,true);leg(3,-s,true);
 const gr=g.createLinearGradient(0,-9,0,-3);gr.addColorStop(0,shade(coat,.2));gr.addColorStop(1,dk);g.fillStyle=gr;
 if(type==='sheep'){g.beginPath();g.ellipse(0,-6,5,3.2,0,0,7);g.fill();for(let k=-3;k<=3;k+=2){g.beginPath();g.arc(k,-8.4,1.4,0,7);g.fill()}g.fillStyle='#3a3430';g.beginPath();g.ellipse(5.2,-7,1.6,1.3,.3,0,7);g.fill()}
 else if(type==='boar'){g.beginPath();g.ellipse(0,-5.5,6,3.2,0,0,7);g.fill();g.beginPath();g.moveTo(4,-8);g.lineTo(8.6,-5.4);g.lineTo(8,-3.6);g.lineTo(4,-3.4);g.fill();g.fillStyle='#f0e8d0';g.beginPath();g.moveTo(7,-4.2);g.lineTo(8.4,-6);g.lineTo(7.6,-4);g.fill();g.strokeStyle='#2a201a';g.lineWidth=.8;g.beginPath();g.moveTo(-5,-8);g.lineTo(3,-8.6);g.stroke()}
 else{g.beginPath();g.ellipse(0,-7,5,2.6,0,0,7);g.fill();g.beginPath();g.moveTo(3,-8.4);g.lineTo(5.4,-12.4);g.lineTo(6.6,-12);g.lineTo(5,-7.4);g.fill();g.beginPath();g.ellipse(6.6,-12.6,2,1.2,.4,0,7);g.fill();g.fillStyle='#f4ece0';g.beginPath();g.ellipse(-4.4,-7.2,1,1.2,0,0,7);g.fill();
  g.strokeStyle='#6a4a2a';g.lineWidth=.6;g.beginPath();g.moveTo(6,-13.4);g.lineTo(5,-16);g.lineTo(3.8,-17);g.moveTo(5,-16);g.lineTo(6.2,-17.2);g.moveTo(6.8,-13.4);g.lineTo(7.8,-16);g.stroke()}
 g.fillStyle='#111';g.beginPath();g.arc(type==='deer'?7:type==='boar'?6.4:5.6,type==='deer'?-12.8:type==='boar'?-6.4:-7.3,.4,0,7);g.fill();
 leg(-2,-s,false);leg(4,s,false);g.restore()}
const US=1.6,uC=new Map();
function toolOf(u){const t=u.task;if(!t||!canBuild(u))return null;return t.k==='build'?'ham':t.rt==='wood'?'axe':t.rt==='gold'||t.rt==='stone'?'pick':t.k==='field'||t.rt==='food'||t.k==='hunt'?'hoe':null}
function unitSprite(u,st){const TAU=Math.PI*2;const d=ud(u);const fr=st==='walk'||st==='work'||d.tag==='shp'?Math.floor(((u.an%TAU)+TAU)%TAU/TAU*8)%8:0;const sw=st==='atk'?Math.round(clamp(u.swing/.3,0,1)*4):0;
 const tool=ud(u).tag==='vil'?toolOf(u):null,ct=u.carry>0&&(d.tag==='vil'||d.tag==='shp')?u.ct:'',cd=d.tag==='sie'?Math.round(Math.min(1,Math.max(0,u.cd)/5)*4):0;
 const vr=d.tag==='vil'?u.id%6:u.id%3;const key=u.type+u.o+u.face+st+fr+sw+tool+ct+cd+'v'+vr;let c=uC.get(key);if(c){uC.delete(key);uC.set(key,c);u._sp=c;return c}if(u._sp&&sprNew>=SPR_MAX)return u._sp;sprNew++;if(uC.size>420){let n=0;for(const k of uC.keys()){uC.delete(k);if(++n>=60)break}}
 const big=d.tag==='shp';const sc=2,W0=big?120:84,H0=big?100:88,ox=W0/2,oy=big?66:74;c=document.createElement('canvas');c.width=W0*sc;c.height=H0*sc;const g=c.getContext('2d',{willReadFrequently:true});g.scale(sc,sc);g.translate(ox,oy);g.scale(US,US);
 drawUnit(g,u.type,u.o,u.face,fr/8*TAU,st,{swing:sw/4*.3,carry:ct?1:0,ct,tool,cd:cd*1.25,vr,id:0},true);defineEdges(c,1,'#22160c');c.ox=ox;c.oy=oy;c.w=W0;c.h=H0;uC.set(key,c);u._sp=c;return c}
const aC=new Map();
function animalSprite(a){const TAU=Math.PI*2;const fr=a.mv?Math.floor(((a.an%TAU)+TAU)%TAU/TAU*8)%8:0;const key=a.type+a.face+fr+(a.carc?1:0);let c=aC.get(key);if(c){a._sp=c;return c}if(a._sp&&sprNew>=SPR_MAX)return a._sp;sprNew++;
 const sc=2,W0=44,H0=40,ox=22,oy=30;c=document.createElement('canvas');c.width=W0*sc;c.height=H0*sc;const g=c.getContext('2d',{willReadFrequently:true});g.scale(sc,sc);g.translate(ox,oy);g.scale(US,US);drawAnimal(g,a.type,a.face,fr/8*TAU,a.mv,a.carc);defineEdges(c,1,'#22160c');c.ox=ox;c.oy=oy;c.w=W0;c.h=H0;aC.set(key,c);a._sp=c;return c}
/* ---------- rendering ---------- */
function drawFarmAt(g,x,y,w,h,frac,o,icon){g.fillStyle='#6b4a2a';g.fillRect(x,y,w,h);g.fillStyle='#5a3c20';g.fillRect(x+1,y+1,w-2,h-2);const rows=Math.max(4,Math.round(h/6));
 const gc=frac>.5?'#7fae3e':frac>.2?'#b9b046':'#c8a050';for(let r=0;r<rows;r++){const yy=y+3+r*(h-6)/rows;g.fillStyle='#7a5530';g.fillRect(x+2,yy+2,w-4,1.4);if(frac>0){g.fillStyle=gc;for(let xx=x+3;xx<x+w-3;xx+=3.2){g.fillRect(xx,yy-1+Math.sin(xx)*0.5,1.8,2.6*Math.min(1,frac+.3))}}}
 g.strokeStyle='#3a2410';g.lineWidth=1.5;g.strokeRect(x+.5,y+.5,w-1,h-1)}
function footprint(g,x,y,w,h){const a=PJ(x,y,0),b=PJ(x+w,y,0),c=PJ(x+w,y+h,0),d=PJ(x,y+h,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(c[0],c[1]);g.lineTo(d[0],d[1]);g.closePath()}
const farmC=new Map();
function farmSprite(w,h,q,built){const k=w+'x'+h+q+built;let c=farmC.get(k);if(c)return c;const pad=6,sc=2.5;c=document.createElement('canvas');c.width=((w+h)*HW+pad*2)*sc;c.height=((w+h)*HH+pad*2+8)*sc;
 const g=c.getContext('2d');g.scale(sc,sc);c.ox=h*HW+pad;c.oy=pad+8;c.w=c.width/sc;c.h=c.height/sc;g.translate(c.ox,c.oy);
 footprint(g,.04,.04,w-.08,h-.08);g.fillStyle=built?'#6e4b2a':'#8a6a44';g.fill();g.strokeStyle='#3e2814';g.lineWidth=1.2;g.stroke();
 footprint(g,.14,.14,w-.28,h-.28);g.fillStyle=built?'#5e3f22':'#7a5c3a';g.fill();
 const R=9;for(let r=0;r<R;r++){const t=.2+(h-.4)*(r+.5)/R;const a=PJ(.18,t,0),b=PJ(w-.18,t,0);g.strokeStyle='#4a2f17';g.lineWidth=1.3;g.beginPath();g.moveTo(a[0],a[1]+1);g.lineTo(b[0],b[1]+1);g.stroke();g.strokeStyle='#86603a';g.lineWidth=.7;g.beginPath();g.moveTo(a[0],a[1]-.4);g.lineTo(b[0],b[1]-.4);g.stroke();
  if(built&&q>0){const cols=['#c8a050','#b9b046','#9fb544','#86ad3c','#7aa83a'];for(let s=.24;s<w-.22;s+=.13){const p=PJ(s,t,0);const hgt=2+q*1.1;g.strokeStyle=cols[Math.min(4,q-1)];g.lineWidth=1.3;g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0]-.6,p[1]-hgt);g.moveTo(p[0],p[1]);g.lineTo(p[0]+1.2,p[1]-hgt*.8);g.stroke();if(q<=2){g.fillStyle='#e0c060';g.fillRect(p[0]-.8,p[1]-hgt-1.2,1.6,1.6)}}}}
 farmC.set(k,c);return c}
function drawBld(g,b){const c=B[b.type].wall?bSprite(b.type,P[b.o].style,b.o,bTier(b.o),wallMask(b)):bSprite(b.type,P[b.o].style,b.o,bTier(b.o));const p=PJ(b.x,b.y,0);const X=p[0]-c.ox,Y=p[1]-c.oy,w=c.width/c.sc,h=c.height/c.sc;
 if(b.built<1){footprint(g,b.x,b.y,b.w,b.h);g.fillStyle='rgba(95,68,38,.55)';g.fill();g.setLineDash([4,3]);g.strokeStyle='#d6b47a';g.lineWidth=1.2;g.stroke();g.setLineDash([]);
  const bot=PJ(b.x+b.w,b.y+b.h,0)[1]+6,cy=bot-(bot-Y)*(.1+.9*b.built);
  if(b.built>0){g.save();g.beginPath();g.rect(X,cy,w,h);g.clip();g.globalAlpha=.55+.45*b.built;g.drawImage(c,X,Y,w,h);g.restore()}
  g.strokeStyle='#8a6640';g.lineWidth=1.8;g.beginPath();for(const [a,bb] of [[b.x+.1,b.y+b.h-.1],[b.x+b.w-.1,b.y+b.h-.1],[b.x+b.w-.1,b.y+.1]]){const q=PJ(a,bb,0);g.moveTo(q[0],q[1]);g.lineTo(q[0],Math.max(cy-4,q[1]-70))}g.stroke();return}
 g.drawImage(c,X,Y,w,h);
 if(B[b.type].gate)drawGateLive(g,b);
 if(b.type==='corral'&&b.built>=1){if(!b._sh)b._sh=[[.55,.8,0],[1.35,.6,1],[1.1,1.35,0]].map(([x,y,f])=>({type:'sheep',face:f,mv:0,an:0,x,y}));const n=Math.min(3,1+(b.slots?b.slots.length:0));const t=performance.now()/1000;for(let k=0;k<n;k++){const sh=b._sh[k];if((t*.25+k*.37+b.id*.1)%1<.02)sh.face^=1;const sp=animalSprite(sh),q=PJ(b.x+sh.x,b.y+sh.y,0);g.drawImage(sp,q[0]-sp.ox,q[1]-sp.oy,sp.w,sp.h)}}
 if(B[b.type].wall&&b.gar.length&&(b.o===0||vis[b.y*W+b.x])){const gu=ents.get(b.gar[0]);if(gu){const sp=unitSprite(gu,'idle'),q=PJ(b.x+.5,b.y+.5,(ZMX[b.type]||56)*.82);g.drawImage(sp,q[0]-sp.ox*.8,q[1]-sp.oy*.8,sp.w*.8,sp.h*.8)}}
 const f=b.hp/bMaxHp(b);if(f<.6&&!B[b.type].wall){const n=f<.3?3:1,cc=PJ(b.x+b.w/2,b.y+b.h/2,(ZMX[b.type]||100)*.35);for(let k=0;k<n;k++){const t=(performance.now()/1000+k*.7+b.id)%2;g.fillStyle=`rgba(60,55,50,${.5*(1-t/2)})`;g.beginPath();g.arc(cc[0]+(k-1)*12,cc[1]-t*20,5+t*7,0,7);g.fill()}
  g.fillStyle='rgba(255,140,40,.85)';g.beginPath();g.arc(cc[0],cc[1]+6+Math.sin(performance.now()/90),3.5,0,7);g.fill()}}
let lastTapT=0,lastTapId=0;
function render(){const z=cam.z;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle='#0c0905';ctx.fillRect(0,0,VW,VH);if(!S)return;
 ctx.setTransform(DPR*z,0,0,DPR*z,-cam.x*z*DPR,-cam.y*z*DPR);ctx.imageSmoothingEnabled=true;
 const S2=groundCv.width/W;ctx.save();ctx.transform(HW/S2,HH/S2,-HW/S2,HH/S2,0,0);ctx.drawImage(groundCv,0,0);ctx.restore();SEASONTINT();WATERFX();
 const cs=[toWorld(0,0),toWorld(VW,0),toWorld(0,VH),toWorld(VW,VH)];
 const x0=Math.max(0,Math.floor(Math.min(...cs.map(c=>c.x)))-2),x1=Math.min(W-1,Math.ceil(Math.max(...cs.map(c=>c.x)))+5),y0=Math.max(0,Math.floor(Math.min(...cs.map(c=>c.y)))-2),y1=Math.min(H-1,Math.ceil(Math.max(...cs.map(c=>c.y)))+5);
 const vr=cam.x+VW/z,vb=cam.y+VH/z;const cull=(px,py,up)=>px>cam.x-130&&px<vr+130&&py>cam.y-30&&py-up<vb+30;const showAll=!running;
 for(const r of rubble){const c=PJ(r.x+r.w/2,r.y+r.h/2,0);if(!cull(c[0],c[1],0))continue;footprint(ctx,r.x+.1,r.y+.1,r.w-.2,r.h-.2);ctx.fillStyle='rgba(72,58,42,.65)';ctx.fill();ctx.fillStyle='rgba(40,30,20,.6)';
  for(let k=0;k<r.w*r.h*5;k++){const a=((k*37+r.x*13)%97)/97*r.w,bb=((k*53+r.y*7)%89)/89*r.h;const q=PJ(r.x+a,r.y+bb,0);ctx.fillRect(q[0]-2,q[1]-1.5,4,3)}}
 for(const b of blds){if(!B[b.type].flat)continue;const c=PJ(b.x+b.w/2,b.y+b.h/2,0);if(!cull(c[0],c[1],0))continue;if(!showAll&&b.o!==0&&!explored[b.y*W+b.x])continue;
  if(B[b.type].road){const sp=roadSprite(roadMask(b));const p=PJ(b.x,b.y,0);ctx.globalAlpha=b.built<1?.25+.6*b.built:1;ctx.drawImage(sp,p[0]-sp.ox,p[1]-sp.oy,sp.w,sp.h);ctx.globalAlpha=1;continue}
  const q=b.built<1?0:4;const sp=farmSprite(b.w,b.h,q,b.built>=1);const p=PJ(b.x,b.y,0);ctx.drawImage(sp,p[0]-sp.ox,p[1]-sp.oy,sp.w,sp.h)}
 DETAIL(x0,x1,y0,y1,cull,showAll);HILL(cull);RELICS(cull);

 const selSet=new Set(sel);
 for(const id of sel){const e=ents.get(id);if(!e)continue;ctx.strokeStyle=e.o===0?'#f4f0d8':'#ff7a6a';ctx.lineWidth=1.6;
  if(e.k==='u'){if(e.gar)continue;const p=PJ(e.x,e.y,0);const r=e.r*1.25;ctx.beginPath();ctx.ellipse(p[0],p[1],r*HW*1.25,r*HH*1.25,0,0,7);ctx.stroke()}else{footprint(ctx,e.x-.05,e.y-.05,e.w+.1,e.h+.1);ctx.stroke()}}
 const L=[];
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;if(ter[i]===4&&(showAll||explored[i])){const p=PJ(x+.5,y+.5,0);if(cull(p[0],p[1],90))L.push([x+y+1,4,i,p]);continue}if(!resT[i]||!(showAll||explored[i]))continue;const p=PJ(x+.5,y+.5,0);if(cull(p[0],p[1],90))L.push([x+y+1,0,i,p])}
 for(const b of blds){if(B[b.type].flat)continue;if(!showAll&&b.o!==0&&!explored[(b.y+(b.h>>1))*W+b.x+(b.w>>1)])continue;const c=PJ(b.x+b.w/2,b.y+b.h,0);if(!cull(c[0],c[1],(ZMX[b.type]||100)+40))continue;L.push([b.x+b.y+(b.w+b.h)/2,1,b])}
 for(const u of units){if(u.gar)continue;if(!showAll&&u.o!==0&&!vis[(u.y|0)*W+(u.x|0)])continue;const p=PJ(u.x,u.y,0);if(!cull(p[0],p[1],70))continue;L.push([u.x+u.y,2,u,p])}
 for(const a of animals){if(!showAll&&!vis[(a.y|0)*W+(a.x|0)]&&!(a.carc&&explored[(a.y|0)*W+(a.x|0)]))continue;const p=PJ(a.x,a.y,0);if(!cull(p[0],p[1],40))continue;L.push([a.x+a.y-.01,3,a,p])}
 L.sort((a,b)=>a[0]-b[0]);
 for(const it of L){if(it[1]===0){const i=it[2],x=i%W,y=(i/W)|0,t=resT[i],p=it[3];const h=(x*73856093^y*19349663)>>>0;
   if(t===1){const sp=treeV[treeK[i]]||treeV[h%6];const s=(.88+((h>>4)%5)*.06)*1.45;const ox=((h>>8)%9)-4,oy=((h>>11)%5)-2;ctx.drawImage(sp,p[0]-24*s+ox,p[1]-51*s+oy,44*s,56*s)}
   else{const sp=resV[t][h%3];const f=(t===5?1:.7+.3*Math.min(1,resA[i]/RAMT[t]))*1.55;ctx.drawImage(sp,p[0]-17*f,p[1]-25*f+4,34*f,30*f)}}
  else if(it[1]===4){const i=it[2],x=i%W,y=(i/W)|0,p=it[3];const h=(x*73856093^y*19349663)>>>0;const sp=rockSprite(h%4);const s=1.15+((h>>5)%5)*.08;ctx.drawImage(sp,p[0]-sp.w*s/2,p[1]-sp.h*s+16,sp.w*s,sp.h*s)}
  else if(it[1]===1)drawBld(ctx,it[2]);
  else if(it[1]===3){const a=it[2],p=it[3];if(!a.carc){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(p[0],p[1],9,3.4,0,0,7);ctx.fill()}const sp=animalSprite(a);ctx.drawImage(sp,p[0]-sp.ox,p[1]-sp.oy,sp.w,sp.h)}
  else{const u=it[2],p=it[3];const st=u.mv?'walk':u.work?'work':u.swing>0?'atk':'idle';const tg=U[u.type].tag;if(tg!=='shp'){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(p[0],p[1],(tg==='sie'?15:tg==='cav'?10:6.5)*US,(tg==='sie'?4.5:tg==='cav'?3.4:2.8)*US,0,0,7);ctx.fill()}
   const sp=unitSprite(u,st);ctx.drawImage(sp,p[0]-sp.ox,p[1]-sp.oy,sp.w,sp.h)}}
 SMOKEFX(cull);
 for(const pr of projs){const f=Math.min(1,pr.t/pr.dur);const x=pr.x0+(pr.tx-pr.x0)*f,y=pr.y0+(pr.ty-pr.y0)*f;const arc=pr.kind==='rock'?70:26;const zz=16+Math.sin(f*Math.PI)*arc;const p=PJ(x,y,zz);
  if(pr.kind==='rock'){ctx.fillStyle='#4a4038';ctx.beginPath();ctx.arc(p[0],p[1],4.5,0,7);ctx.fill();ctx.strokeStyle='#1a140e';ctx.lineWidth=1;ctx.stroke()}
  else{const f2=Math.min(1,f+.05);const q=PJ(pr.x0+(pr.tx-pr.x0)*f2,pr.y0+(pr.ty-pr.y0)*f2,16+Math.sin(f2*Math.PI)*arc);const a=Math.atan2(q[1]-p[1],q[0]-p[0]);ctx.strokeStyle='#2a1c10';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[0]-Math.cos(a)*9,p[1]-Math.sin(a)*9);ctx.stroke()}}
 for(const f of fx){const k=f.t/f.life,p=PJ(f.x,f.y,0);
  if(f.k==='ring'){ctx.strokeStyle=f.c;ctx.globalAlpha=1-k;ctx.lineWidth=2;const r=(1-k)*14+6;ctx.beginPath();ctx.ellipse(p[0],p[1],r,r*.5,0,0,7);ctx.stroke();ctx.globalAlpha=1}
  else if(f.k==='die'){ctx.globalAlpha=(1-k)*.85;ctx.fillStyle='#7a1515';ctx.beginPath();ctx.ellipse(p[0]+2,p[1],9,4,0,0,7);ctx.fill();ctx.fillStyle=f.c;ctx.beginPath();ctx.ellipse(p[0]-2,p[1]-2,7,3,0,0,7);ctx.fill();ctx.globalAlpha=1}
  else if(f.k==='dust'){ctx.fillStyle=`rgba(120,105,85,${.6*(1-k)})`;for(let j=0;j<7;j++){ctx.beginPath();ctx.arc(p[0]+Math.cos(j)*k*f.s*22,p[1]+Math.sin(j*1.7)*k*f.s*10-k*20,8+k*14,0,7);ctx.fill()}}}
 if(running){ctx.save();ctx.transform(HW,HH,-HW,HH,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(fogCv,0,0);ctx.restore()}
 NIGHT();
 for(const id of sel){const e=ents.get(id);if(e)hpBar(e)}
 for(const u of units)if(!u.gar&&!selSet.has(u.id)&&u.hp<uMaxHp(u)&&(u.o===0||vis[(u.y|0)*W+(u.x|0)])&&S.t-(u.dmgT||-9)<4)hpBar(u);
 for(const b of blds)if(!selSet.has(b.id)&&b.built>=1&&b.hp<bMaxHp(b)&&S.t-(b.dmgT||-9)<5&&(b.o===0||vis[b.y*W+b.x]))hpBar(b);
 OVERLAYS(selSet);BIRDS();
 const sb=sel.length===1&&ents.get(sel[0]);if(sb&&sb.k==='b'&&sb.o===0&&sb.rally){const q=PJ(sb.rally.x,sb.rally.y,0);flagAt(q[0],q[1])}
 if(placing&&placing.tx!=null){const d=B[placing.type];const tiles=d.wall||d.road?wallLine(placing.ax??placing.tx,placing.ay??placing.ty,placing.tx,placing.ty):[[placing.tx,placing.ty]];
  tiles.sort((a,b)=>a[0]+a[1]-b[0]-b[1]);
  for(const [x,y] of tiles){const ok=canPlace(placing.type,x,y,0,false);footprint(ctx,x,y,d.w,d.h);ctx.fillStyle=ok?'rgba(110,230,90,.3)':'rgba(240,70,50,.4)';ctx.fill();ctx.strokeStyle=ok?'#9cff7c':'#ff6a50';ctx.lineWidth=1.5;ctx.stroke();
   ctx.globalAlpha=.6;if(d.road){const sp=roadSprite(15),p=PJ(x,y,0);ctx.drawImage(sp,p[0]-sp.ox,p[1]-sp.oy,sp.w,sp.h)}else if(d.flat){const sp=farmSprite(d.w,d.h,0,false),p=PJ(x,y,0);ctx.drawImage(sp,p[0]-sp.ox,p[1]-sp.oy,sp.w,sp.h)}else{const c=bSprite(placing.type,P[0].style,0,bTier(0)),p=PJ(x,y,0);ctx.drawImage(c,p[0]-c.ox,p[1]-c.oy,c.width/c.sc,c.height/c.sc)}ctx.globalAlpha=1}}
 ctx.setTransform(DPR,0,0,DPR,0,0);
 if(gest&&gest.type==='box'){const x=Math.min(gest.sx,gest.cx),y=Math.min(gest.sy,gest.cy),w=Math.abs(gest.cx-gest.sx),h=Math.abs(gest.cy-gest.sy);ctx.fillStyle='rgba(244,240,216,.12)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#f4f0d8';ctx.lineWidth=1.5;ctx.strokeRect(x+.5,y+.5,w,h)}}
function hpBar(e){let mx,x,y,w;if(e.k==='u'){if(e.gar)return;mx=uMaxHp(e);const p=PJ(e.x,e.y,0),tg=U[e.type].tag;w=tg==='cav'||tg==='sie'?30:22;x=p[0]-w/2;y=p[1]-(tg==='cav'?44:tg==='sie'?50:36)}
 else{mx=bMaxHp(e);const p=PJ(e.x+e.w/2,e.y+e.h/2,0);w=Math.min(72,e.w*22);x=p[0]-w/2;y=p[1]-(ZMX[e.type]||100)*.8}
 const f=clamp(e.hp/mx,0,1);ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(x-1,y-1,w+2,5);ctx.fillStyle=e.o===0?(f>.5?'#6fd25a':f>.25?'#e8c040':'#e85a3a'):'#e8483a';ctx.fillRect(x,y,w*f,3)}
function flagAt(x,y){ctx.strokeStyle='#2a1c10';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-20);ctx.stroke();ctx.fillStyle=PCOL[0];ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+12,y-16);ctx.lineTo(x,y-12);ctx.fill()}

/* ---------- minimap ---------- */
const mini=$('#mini');mini.width=288;mini.height=144;const mctx=mini.getContext('2d');const mcv=document.createElement('canvas');const mcx=mcv.getContext('2d');let mimg=null;
let pings=[];
const toMini=(x,y)=>{const a=144/W;return[(x-y)*a+144,(x+y)*a/2]};
function drawMini(){if(!mimg||mcv.width!==W){mcv.width=W;mcv.height=H;mimg=mcx.createImageData(W,H)}const d=mimg.data;for(let i=0;i<N;i++){const o=i*4;if(!explored[i]){d[o]=8;d[o+1]=6;d[o+2]=4;d[o+3]=255;continue}const t=resT[i];let c=ter[i]===1?(t===5?[90,140,190]:[44,92,150]):ter[i]===4?[122,112,104]:t===1?[38,82,34]:t===2?[230,190,50]:t===3?[160,158,150]:t===4?[190,80,100]:(S.biome==='desert'?[188,164,108]:S.biome==='snow'?[214,220,228]:[96,132,58]);if(!vis[i])c=c.map(v=>v*.55);d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}
 mcx.putImageData(mimg,0,0);for(const b of blds){if(b.o!==0&&!explored[b.y*W+b.x])continue;mcx.fillStyle=b.type==='field'?shade(PCOL[b.o],-.3):PCOL[b.o];mcx.fillRect(b.x,b.y,b.w,b.h)}
 for(const u of units){if(u.gar)continue;if(u.o!==0&&!vis[(u.y|0)*W+(u.x|0)])continue;mcx.fillStyle=u.o===0?'#a9d0ff':'#ff9a8a';mcx.fillRect(Math.floor(u.x)-.5,Math.floor(u.y)-.5,1.6,1.6)}
 mctx.setTransform(1,0,0,1,0,0);mctx.clearRect(0,0,288,144);mctx.imageSmoothingEnabled=false;{const a=144/W;mctx.setTransform(a,a/2,-a,a/2,144,0)}mctx.drawImage(mcv,0,0);mctx.setTransform(1,0,0,1,0,0);
 const now=S?S.t:0;pings=pings.filter(p=>now-p.t<4);for(const p of pings){const m=toMini(p.x,p.y);mctx.strokeStyle='#ff4a3a';mctx.lineWidth=2.5;mctx.beginPath();mctx.arc(m[0],m[1],5+((now-p.t)*10)%12,0,7);mctx.stroke()}
 const cs=[toWorld(0,0),toWorld(VW,0),toWorld(VW,VH),toWorld(0,VH)].map(c=>toMini(c.x,c.y));mctx.strokeStyle='#fff';mctx.lineWidth=2;mctx.beginPath();mctx.moveTo(cs[0][0],cs[0][1]);for(const c of cs)mctx.lineTo(c[0],c[1]);mctx.closePath();mctx.stroke()}

function WATERFX(){if(!S)return;const t=performance.now()/1000;const cs=[toWorld(0,0),toWorld(VW,0),toWorld(0,VH),toWorld(VW,VH)];
 const x0=Math.max(0,Math.floor(Math.min(...cs.map(c=>c.x)))),x1=Math.min(W-1,Math.ceil(Math.max(...cs.map(c=>c.x)))),y0=Math.max(0,Math.floor(Math.min(...cs.map(c=>c.y)))),y1=Math.min(H-1,Math.ceil(Math.max(...cs.map(c=>c.y))));
 if((x1-x0)*(y1-y0)>9000)return;ctx.strokeStyle='rgba(235,248,255,.5)';ctx.lineWidth=1.2;ctx.beginPath();
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;if(ter[i]!==1)continue;const h=(x*73856093^y*19349663)>>>0;if(h%5)continue;const ph=(t*.5+(h%100)/100)%1;const p=PJ(x+.5+ph*.6-.3,y+.5,0);const w=6*Math.sin(ph*Math.PI);if(w<1)continue;ctx.moveTo(p[0]-w,p[1]);ctx.quadraticCurveTo(p[0],p[1]-2,p[0]+w,p[1])}ctx.stroke()}
function TERRITORY(cull){ctx.lineWidth=1.6;ctx.setLineDash([5,4]);for(let o=0;o<P.length;o++){ctx.strokeStyle=PCOL[o];ctx.globalAlpha=.75;ctx.beginPath();let n=0;
 for(const e of terrEdges){if(e[4]!==o)continue;if(!explored[Math.min(N-1,e[1]*W+e[0])]&&o!==0)continue;const a=PJ(e[0],e[1],0),b=PJ(e[2],e[3],0);if(!cull(a[0],a[1],0)&&!cull(b[0],b[1],0))continue;ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);n++}if(n)ctx.stroke()}ctx.setLineDash([]);ctx.globalAlpha=1}
function OVERLAYS(selSet){const now=S.t;
 for(const b of blds){if(b.o!==0&&!vis[(b.y|0)*W+(b.x|0)])continue;const c=PJ(b.x+b.w/2,b.y+b.h/2,0);const top=c[1]-(ZMX[b.type]||100)*.62;
  if(b.cp<cpMax(b)-1&&b.built>=1){const f=clamp(b.cp/cpMax(b),0,1),w=Math.min(72,b.w*22);ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(c[0]-w/2-1,top+5,w+2,5);ctx.fillStyle=PCOL[b.o];ctx.fillRect(c[0]-w/2,top+6,w*f,3);ctx.fillStyle=b.capBy!=null?PCOL[b.capBy]:'#888';ctx.fillRect(c[0]-w/2+w*f,top+6,w*(1-f),3)}
  if(b.gar.length){ctx.fillStyle='rgba(20,14,8,.85)';ctx.beginPath();ctx.arc(c[0]+18,top-2,8,0,7);ctx.fill();ctx.fillStyle='#f6ecd5';ctx.font='800 10px Alegreya Sans,sans-serif';ctx.textAlign='center';ctx.fillText(b.gar.length,c[0]+18,top+1.5)}
  if(b.type==='wonder'&&b.built>=1&&S.wonderWin){const left=Math.max(0,600-(now-b.wonderT));ctx.fillStyle='rgba(20,14,8,.85)';ctx.fillRect(c[0]-26,top-30,52,16);ctx.fillStyle=PCOL[b.o];ctx.font='800 11px Alegreya Sans,sans-serif';ctx.textAlign='center';ctx.fillText(Math.floor(left/60)+':'+String(Math.floor(left%60)).padStart(2,'0'),c[0],top-18)}}
 for(const u of units){if(u.gar)continue;if(u.o!==0&&!vis[(u.y|0)*W+(u.x|0)])continue;const p=PJ(u.x,u.y,0);
  if(u.rank){ctx.fillStyle=u.rank===2?'#f2cf6a':'#d8d8d8';const y=p[1]-38;for(let k=0;k<u.rank;k++){ctx.beginPath();ctx.moveTo(p[0]-4,y+k*3);ctx.lineTo(p[0],y+k*3-2.5);ctx.lineTo(p[0]+4,y+k*3);ctx.lineTo(p[0]+4,y+k*3+1.3);ctx.lineTo(p[0],y+k*3-1.2);ctx.lineTo(p[0]-4,y+k*3+1.3);ctx.fill()}}
  if(ud(u).hero){ctx.strokeStyle=PCOL[u.o];ctx.globalAlpha=.35+.15*Math.sin(performance.now()/300);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p[0],p[1],7*HW*.7,7*HH*.7,0,0,7);ctx.stroke();ctx.globalAlpha=1}}}

/* ---------- ground detail, smoke and birds ---------- */
const decoCache={};let dirtM=null;
function decoSet(){const key=S.biome;if(decoCache[key])return decoCache[key];
 const mk=(w,h,f)=>{const c=document.createElement('canvas');c.width=w*3;c.height=h*3;const g=c.getContext('2d');g.scale(3,3);g.lineCap='round';g.lineJoin='round';f(g,w,h);c.w=w;c.h=h;return c};
 const bm=S.biome;const grassC=bm==='desert'?['#a89058','#8a7440','#c4aa6a']:bm==='snow'?['#8a9a7a','#6a7a5e','#f4f6fa']:bm==='steppe'?['#b4ac5a','#8e8a3e','#d0c878']:['#4f8a2e','#3a6e22','#78b048'];
 const tuft=v=>mk(20,16,(g,w,h)=>{g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(10,14,7,2,0,0,7);g.fill();const r=mulberry(50+v);
  for(let k=0;k<9;k++){const x=4+r()*12,lean=(r()-.5)*7,ht=5+r()*(bm==='steppe'||bm==='desert'?8:7);g.strokeStyle=grassC[k%3];g.lineWidth=1.1;g.beginPath();g.moveTo(x,14);g.quadraticCurveTo(x+lean*.3,14-ht*.6,x+lean,14-ht);g.stroke()}});
 const flowers=v=>mk(20,14,(g)=>{const r=mulberry(80+v);const col=[['#f4f0e6','#f0d040'],['#d860a0','#f8e0f0'],['#f0c030','#c07018'],['#7aa0f0','#f8f8ff']][v%4];
  for(let k=0;k<6;k++){const x=3+r()*14,y=5+r()*7;g.strokeStyle='#3f7a2a';g.lineWidth=.8;g.beginPath();g.moveTo(x,y+2.5);g.lineTo(x,y+.5);g.stroke();g.fillStyle=col[0];for(let p=0;p<5;p++){const a=p/5*6.28;g.beginPath();g.arc(x+Math.cos(a)*1.1,y+Math.sin(a)*.7,.8,0,7);g.fill()}g.fillStyle=col[1];g.beginPath();g.arc(x,y,.55,0,7);g.fill()}});
 const pebbles=v=>mk(18,10,(g)=>{const r=mulberry(110+v);const base=bm==='desert'?[170,130,90]:bm==='snow'?[120,120,128]:[130,124,112];
  for(let k=0;k<4+v;k++){const x=3+r()*12,y=3+r()*5,s=1+r()*2;const sh=r()*30;g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(x+.5,y+1,s*1.2,s*.6,0,0,7);g.fill();g.fillStyle=`rgb(${base[0]+sh},${base[1]+sh},${base[2]+sh})`;g.beginPath();g.ellipse(x,y,s*1.1,s*.7,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(x-s*.3,y-s*.25,s*.4,s*.25,0,0,7);g.fill()}});
 const bush=v=>mk(22,18,(g)=>{g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(11,15,8,2.6,0,0,7);g.fill();const r=mulberry(140+v);
  const cs=bm==='desert'||bm==='steppe'?['#8a7c3c','#6e6230','#a89850']:bm==='snow'?['#4e6a4a','#3a5238','#f2f4f8']:['#3f7428','#2e5a1e','#5e9a3a'];
  for(let k=0;k<7;k++){const x=5+r()*12,y=7+r()*7,s=2.4+r()*2;g.fillStyle=cs[k%2];g.beginPath();g.arc(x,y,s,0,7);g.fill()}g.fillStyle=cs[2];for(let k=0;k<4;k++){g.beginPath();g.arc(6+r()*10,6+r()*4,1.5,0,7);g.fill()}});
 const mush=v=>mk(14,10,(g)=>{for(let k=0;k<3;k++){const x=3+k*4,y=7-(k%2);g.fillStyle='#efe6d0';g.fillRect(x-.5,y-2,1.2,3);g.fillStyle=v%2?'#c03028':'#a07850';g.beginPath();g.ellipse(x,y-2,2,1.3,0,Math.PI,0);g.fill();if(v%2){g.fillStyle='#fff';g.fillRect(x-.8,y-3,.6,.6)}}});
 const reeds=v=>mk(18,22,(g)=>{const r=mulberry(170+v);for(let k=0;k<8;k++){const x=4+r()*10,ht=10+r()*9,lean=(r()-.5)*4;g.strokeStyle=k%2?'#6a8a3a':'#8aa04a';g.lineWidth=1;g.beginPath();g.moveTo(x,20);g.quadraticCurveTo(x+lean*.4,20-ht*.6,x+lean,20-ht);g.stroke();if(k%3===0){g.fillStyle='#6a4020';g.beginPath();g.ellipse(x+lean*.9,20-ht+2,.9,2.2,0,0,7);g.fill()}}
  g.strokeStyle='rgba(220,240,255,.35)';g.lineWidth=.7;g.beginPath();g.ellipse(9,20,7,1.6,0,0,7);g.stroke()});
 const lily=v=>mk(20,10,(g)=>{const r=mulberry(200+v);for(let k=0;k<3;k++){const x=4+r()*12,y=3+r()*4,s=2.2+r();g.fillStyle=k%2?'#3e7a30':'#4e8e38';g.beginPath();g.ellipse(x,y,s,s*.55,0,.4,6.0);g.lineTo(x,y);g.fill()}if(v%2){g.fillStyle='#f6e8f0';g.beginPath();g.arc(10,4.5,1.1,0,7);g.fill();g.fillStyle='#f0c040';g.beginPath();g.arc(10,4.5,.4,0,7);g.fill()}});
 const shells=v=>mk(16,8,(g)=>{const r=mulberry(230+v);if(v%2){g.strokeStyle='#8a6a48';g.lineWidth=1.6;g.beginPath();g.moveTo(2,5);g.lineTo(13,3);g.stroke();g.strokeStyle='#6a4e34';g.lineWidth=.6;g.beginPath();g.moveTo(5,4.6);g.lineTo(7,2.4);g.stroke()}else for(let k=0;k<4;k++){g.fillStyle=['#f4e8dc','#e8c8b0','#fff4ea'][k%3];g.beginPath();g.arc(3+r()*10,2+r()*4,.9,0,7);g.fill()}});
 const scree=v=>{const c=pebbles(v+3);return c};
 const cracks=v=>mk(20,10,(g)=>{const r=mulberry(260+v);g.strokeStyle='rgba(120,90,50,.45)';g.lineWidth=.7;for(let k=0;k<3;k++){let x=3+r()*14,y=2+r()*6;g.beginPath();g.moveTo(x,y);for(let j=0;j<3;j++){x+=(r()-.5)*7;y+=(r()-.5)*3;g.lineTo(x,y)}g.stroke()}});
 const set={tuft:[0,1,2,3].map(tuft),flowers:[0,1,2,3].map(flowers),pebbles:[0,1,2].map(pebbles),bush:[0,1,2].map(bush),mush:[0,1].map(mush),reeds:[0,1,2].map(reeds),lily:[0,1].map(lily),shells:[0,1].map(shells),scree:[0,1,2].map(scree),cracks:[0,1].map(cracks)};
 decoCache[key]=set;return set}
function decoFor(i,x,y,h){const t=ter[i];if(resT[i]&&resT[i]!==5)return null;if(t===4)return null;if(occ[i])return null;const r=h%100;
 const nearT=(tv)=>{for(let k=0;k<4;k++){const xx=x+DX[k],yy=y+DY[k];if(xx>=0&&yy>=0&&xx<W&&yy<H&&ter[yy*W+xx]===tv)return true}return false};
 if(t===1){if(resT[i])return null;if(S.biome!=='temp'||!nearT(3)&&!nearT(0))return null;return r<10?'lily':r<22?'reeds':null}
 if(t===2)return r<55?'reeds':null;
 if(nearT(4))return r<70?'scree':null;
 if(t===3)return r<22?'shells':null;
 if(dirtM&&dirtM[i])return r<14?'pebbles':null;
 const b=S.biome;
 if(b==='desert')return r<18?'pebbles':r<30?'tuft':r<38?'bush':r<46?'cracks':null;
 if(b==='snow')return r<14?'tuft':r<24?'pebbles':r<30?'bush':null;
 if(b==='steppe')return r<40?'tuft':r<46?'pebbles':r<52?'bush':r<56?'flowers':null;
 return r<22?'tuft':r<32?'flowers':r<42?'pebbles':r<47?'bush':r<49?'mush':null}
function DETAIL(x0,x1,y0,y1,cull,showAll){if(cam.z<.4)return;const set=decoSet();
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x;if(!(showAll||explored[i]))continue;const h=((x*92837111)^(y*689287499)^S.seed)>>>0;const k=decoFor(i,x,y,h);if(!k)continue;
  const arr=set[k],sp=arr[(h>>>8)%arr.length];const ox=((h>>>12)%100)/100*.6+.2,oy=((h>>>18)%100)/100*.6+.2;const p=PJ(x+ox,y+oy,0);if(!cull(p[0],p[1],30))continue;ctx.drawImage(sp,p[0]-sp.w/2,p[1]-sp.h+2,sp.w,sp.h)}}
/* chimney smoke */
const SMOKE={tc:[[.35,-.62],[ -.2,-.7]],house:[[.18,-.8]],blacksmith:[[.2,-.75]],farmstead:[[.2,-.7]],storehouse:[[.1,-.7]],castle:[[.25,-.8]]};
function SMOKEFX(cull){const t=performance.now()/1000;ctx.save();
 for(const b of blds){const sm=SMOKE[b.type];if(!sm||b.built<1)continue;if(!vis[(b.y+1)*W+b.x+1]&&b.o!==0)continue;const c=PJ(b.x+b.w/2,b.y+b.h/2,0);if(!cull(c[0],c[1],140))continue;const zm=ZMX[b.type]||100;
  for(let s=0;s<sm.length;s++){const bx=c[0]+sm[s][0]*b.w*16,by=c[1]+sm[s][1]*zm;for(let k=0;k<5;k++){const ph=((t*.35+k/5+b.id*.13+s*.3)%1);const yy=by-ph*34,xx=bx+Math.sin(ph*4+b.id)*4+ph*10;ctx.globalAlpha=(1-ph)*.5*(ph<.1?ph*10:1);ctx.fillStyle=ph<.3?'#e4e0d8':'#c4c0b8';ctx.beginPath();ctx.arc(xx,yy,3+ph*8,0,7);ctx.fill()}}}
 ctx.restore()}
/* birds */
let flock=null;
function BIRDS(){if(!S||!running)return;const t=performance.now()/1000;const vw=VW/cam.z,vh=VH/cam.z;
 if(!flock||flock.x>cam.x+vw+200||flock.x<cam.x-400||flock.y<cam.y-400||flock.y>cam.y+vh+300){if(flock&&t<flock.next)return;const dir=Math.random()<.5?1:-1;
  flock={x:dir>0?cam.x-150:cam.x+vw+150,y:cam.y+vh*(.15+Math.random()*.5),vx:dir*(40+Math.random()*25),vy:(Math.random()-.5)*12,n:3+((Math.random()*5)|0),t0:t,last:t,next:t+12+Math.random()*25};flock.next=t+12+Math.random()*25}
 const dt=Math.min(.1,t-flock.last);flock.last=t;flock.x+=flock.vx*dt;flock.y+=flock.vy*dt;
 for(let k=0;k<flock.n;k++){const row=Math.ceil(k/2),side=k%2?1:-1;const bx=flock.x-Math.sign(flock.vx)*row*14,by=flock.y+side*row*9;const flap=Math.sin(t*9+k*1.7)*3.2;
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.ellipse(bx+20,by+70,3.5,1.3,0,0,7);ctx.fill();
  ctx.strokeStyle='#2a2622';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(bx-5,by-flap);ctx.quadraticCurveTo(bx-2,by-1,bx,by);ctx.quadraticCurveTo(bx+2,by-1,bx+5,by-flap);ctx.stroke()}}

/* ---------- sound effects and music (all generated, no files) ---------- */
const AU={ctx:null,master:null,sfxG:null,musG:null,noise:null,last:{},voices:0,set:{sfx:1,music:1},mus:{next:0,bar:0,step:0,timer:0,deg:0,phrase:0}};
try{const s=JSON.parse(localStorage.getItem('boc-audio')||'null');if(s)Object.assign(AU.set,s)}catch(e){}
function auSave(){try{localStorage.setItem('boc-audio',JSON.stringify(AU.set))}catch(e){}}
function auInit(){if(AU.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();AU.ctx=c;
 AU.master=c.createGain();AU.master.gain.value=.9;const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=6;AU.master.connect(comp);comp.connect(c.destination);
 AU.sfxG=c.createGain();AU.sfxG.gain.value=AU.set.sfx?1:0;AU.sfxG.connect(AU.master);AU.musG=c.createGain();AU.musG.gain.value=AU.set.music?.55:0;AU.musG.connect(AU.master);
 const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=nb;
 AU.mus.next=c.currentTime+.3;AU.mus.timer=setInterval(musTick,150)}catch(e){AU.ctx=null}}
addEventListener('pointerdown',()=>{auInit();if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume()},{capture:true});
document.addEventListener('visibilitychange',()=>{if(!AU.ctx)return;if(document.hidden)AU.ctx.suspend();else AU.ctx.resume()});
function auApply(){if(!AU.ctx)return;const t=AU.ctx.currentTime;AU.sfxG.gain.setTargetAtTime(AU.set.sfx?1:0,t,.05);AU.musG.gain.setTargetAtTime(AU.set.music?.55:0,t,.3)}
function toggleSnd(k){AU.set[k]=AU.set[k]?0:1;auSave();auApply();updSndBtns()}
function updSndBtns(){document.querySelectorAll('[data-snd]').forEach(b=>{const k=b.dataset.snd;b.textContent=(k==='sfx'?'Sound: ':'Music: ')+(AU.set[k]?'On':'Off');b.classList.toggle('on',!!AU.set[k])})}
document.querySelectorAll('[data-snd]').forEach(b=>b.onclick=()=>toggleSnd(b.dataset.snd));updSndBtns();
/* building blocks */
function tone(dest,type,f,t,dur,vol,o={}){const c=AU.ctx,os=c.createOscillator(),g=c.createGain();os.type=type;os.frequency.setValueAtTime(f,t);if(o.slide)os.frequency.exponentialRampToValueAtTime(Math.max(20,o.slide),t+dur);
 if(o.vib){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=o.vib;lg.gain.value=f*.012;l.connect(lg);lg.connect(os.frequency);l.start(t);l.stop(t+dur+.05)}
 const at=o.at||.004;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+at);g.gain.exponentialRampToValueAtTime(.0005,t+dur);
 let n=os;if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;fl.Q.value=o.q||.7;os.connect(fl);n=fl}else if(o.bp){const fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=o.bp;fl.Q.value=o.q||4;os.connect(fl);n=fl}
 n.connect(g);g.connect(dest);os.start(t);os.stop(t+dur+.05)}
function noiz(dest,ft,f,t,dur,vol,o={}){const c=AU.ctx,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=AU.noise;s.playbackRate.value=o.rate||1;fl.type=ft;fl.frequency.setValueAtTime(f,t);if(o.to)fl.frequency.exponentialRampToValueAtTime(o.to,t+dur);fl.Q.value=o.q||1;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+(o.at||.003));g.gain.exponentialRampToValueAtTime(.0005,t+dur);s.connect(fl);fl.connect(g);g.connect(dest);s.start(t,Math.random()*.5);s.stop(t+dur+.05)}
const SFX={
 clang:(d,t,v,p)=>{tone(d,'sine',1850*p,t,.2,.11*v);tone(d,'sine',2790*p,t,.15,.07*v);tone(d,'square',620*p,t,.05,.03*v,{lp:2500});noiz(d,'bandpass',3600,t,.07,.13*v,{q:2})},
 thud:(d,t,v,p)=>{noiz(d,'lowpass',320*p,t,.14,.32*v);tone(d,'sine',95*p,t,.13,.22*v,{slide:50})},
 bow:(d,t,v,p)=>{tone(d,'triangle',310*p,t,.07,.11*v,{slide:190});noiz(d,'bandpass',2200,t+.01,.16,.16*v,{to:500,q:1.5})},
 sling:(d,t,v,p)=>{noiz(d,'lowpass',900,t,.25,.14*v,{to:200});tone(d,'sine',70,t,.18,.2*v,{slide:40})},
 chop:(d,t,v,p)=>{noiz(d,'bandpass',760*p,t,.07,.26*v,{q:3});tone(d,'sine',190*p,t,.06,.12*v)},
 mine:(d,t,v,p)=>{tone(d,'square',2350*p,t,.04,.04*v,{lp:5000});tone(d,'sine',3650*p,t,.1,.06*v);noiz(d,'highpass',4200,t,.03,.08*v)},
 hammer:(d,t,v,p)=>{tone(d,'sine',430*p,t,.06,.12*v);noiz(d,'bandpass',1500*p,t,.04,.13*v,{q:2})},
 die:(d,t,v,p)=>{noiz(d,'lowpass',420,t,.22,.15*v);tone(d,'sine',150*p,t,.22,.1*v,{slide:70})},
 crash:(d,t,v,p)=>{noiz(d,'lowpass',700,t,.9,.32*v,{to:150});for(let k=1;k<4;k++)noiz(d,'bandpass',500+k*300,t+k*.12,.2,.16*v,{q:2});tone(d,'sine',60,t,.6,.25*v,{slide:35})},
 built:(d,t,v)=>{SFX.hammer(d,t,v,1);SFX.hammer(d,t+.16,v,1.08);tone(d,'sine',880,t+.34,.6,.06*v);tone(d,'sine',1320,t+.42,.6,.05*v)},
 ready:(d,t,v)=>{tone(d,'sine',660,t,.7,.07*v);tone(d,'sine',990,t,.5,.035*v);tone(d,'sine',1650,t,.25,.02*v)},
 ackS:(d,t,v,p)=>{tone(d,'sawtooth',140*p,t,.14,.14*v,{bp:650,q:3,at:.02});tone(d,'sawtooth',140*p,t,.14,.05*v,{bp:1100,q:4,at:.02})},
 ackV:(d,t,v,p)=>{tone(d,'triangle',360*p,t,.11,.07*v,{slide:300*p,at:.015});tone(d,'sine',720*p,t,.08,.02*v)},
 chain:(d,t,v)=>{for(let k=0;k<9;k++){noiz(d,'bandpass',2600+Math.random()*900,t+k*.07,.05,.07*v,{q:6});tone(d,'square',900+Math.random()*300,t+k*.07,.03,.015*v,{lp:3000})}tone(d,'sine',70,t,.7,.06*v)},
 creak:(d,t,v)=>{tone(d,'sawtooth',180,t,.5,.04*v,{slide:120,bp:900,q:8,at:.05});tone(d,'sawtooth',260,t+.08,.35,.025*v,{slide:200,bp:1400,q:8,at:.05})},
 click:(d,t,v)=>{tone(d,'sine',1250,t,.035,.05*v)},
 horn:(d,t,v)=>{tone(d,'sawtooth',196,t,.42,.1*v,{lp:1100,vib:5,at:.06});tone(d,'sawtooth',262,t+.45,.75,.1*v,{lp:1200,vib:5,at:.06})},
 fanfare:(d,t,v)=>{[[392,0,.2],[523,.2,.2],[659,.4,.2],[784,.6,.7]].forEach(([f,o,l])=>{tone(d,'sawtooth',f,t+o,l,.07*v,{lp:2000,at:.02});tone(d,'square',f/2,t+o,l,.03*v,{lp:900,at:.02})})},
 win:(d,t,v)=>{[[392,0],[523,.25],[659,.5],[784,.75],[1047,1.1]].forEach(([f,o],i)=>tone(d,'sawtooth',f,t+o,i===4?1.6:.3,.08*v,{lp:2200,at:.02,vib:i===4?5:0}))},
 lose:(d,t,v)=>{[[294,0],[262,.4],[220,.8],[147,1.3]].forEach(([f,o],i)=>tone(d,'sawtooth',f,t+o,i===3?1.8:.45,.07*v,{lp:900,at:.04}))}};
const GAP={chain:.6,creak:.6,clang:.07,thud:.1,bow:.08,sling:.2,chop:.22,mine:.22,hammer:.18,die:.12,crash:.5,built:.4,ready:.3,ackS:.25,ackV:.25,click:.06,horn:2,fanfare:1,win:1,lose:1};
function sfx(name,x,y){if(!SFX[name]||!AU.ctx||!AU.set.sfx||!running&&name!=='win'&&name!=='lose'&&name!=='click')return;const c=AU.ctx,t=c.currentTime;if((AU.last[name]||0)+GAP[name]>t)return;let v=1;
 if(x!=null){const p=PJ(x,y,0),sx=(p[0]-cam.x)*cam.z,sy=(p[1]-cam.y)*cam.z;if(sx<-80||sy<-80||sx>VW+80||sy>VH+80)return;v=clamp(cam.z,.45,1.15);const dx=sx/VW-.5;v*=1-Math.abs(dx)*.3}
 if(AU.voices>14)return;AU.last[name]=t;AU.voices++;setTimeout(()=>AU.voices--,250);SFX[name](AU.sfxG,t+.005,v,.92+Math.random()*.16)}
/* work sounds, called from the game tick */
function workSfx(u){if(!AU.ctx||!AU.set.sfx)return;u.wsT=(u.wsT||Math.random())-DT;if(u.wsT>0)return;u.wsT=.75+Math.random()*.3;const t=u.task;if(!t)return;
 if(t.k==='build')sfx('hammer',u.x,u.y);else if(t.k==='gather'){const r=t.rt;sfx(r===1?'chop':r===2||r===3?'mine':null,u.x,u.y)}}
/* music: a calm medieval tune in D dorian with lute, drone, recorder and hand drum */
const SCALE=[0,2,3,5,7,9,10],CHORDS=[[0,2,4],[6,1,3],[0,2,4],[4,6,1],[3,5,0],[6,1,3],[4,6,1],[0,2,4]];
const nf=(deg,oct)=>{const o=Math.floor(deg/7);const s=SCALE[((deg%7)+7)%7];return 146.83*Math.pow(2,(s+12*(o+oct))/12)};
function pluck(t,f,vol,len=.9){tone(AU.musG,'triangle',f,t,len,vol,{lp:2400,at:.003});tone(AU.musG,'sine',f*2,t,len*.5,vol*.35,{at:.002});tone(AU.musG,'square',f,t,.05,vol*.12,{lp:1800})}
function musTick(){const c=AU.ctx;if(!c||!AU.set.music||document.hidden)return;const M=AU.mus;const war=!!(running&&typeof lastAtk!=='undefined'&&lastAtk&&S&&S.t-lastAtk.t<25);
 const beat=war?.5:.68;while(M.next<c.currentTime+.6){const t=M.next,st=M.step%8,bar=M.bar%8,ch=CHORDS[bar];
  if(st===0){for(const k of [0,2])tone(AU.musG,'triangle',nf(ch[0],-1)*(k?1.5:1),t,beat*8.2,.018,{lp:600,at:.6});tone(AU.musG,'sine',nf(ch[0],-2),t,beat*8,.03,{at:.4})}
  if(st%2===0||Math.random()<.35){const pick=st%2===0?ch[(st/2)%3]:ch[Math.floor(Math.random()*3)];pluck(t,nf(pick,st<4?0:1),st===0?.045:.03,.8)}
  if(M.phrase%2===1&&(st%2===0||Math.random()<.4)){M.deg=clamp(M.deg+[-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)],0,9);if(Math.random()<.5)M.deg=ch[Math.floor(Math.random()*3)]+(M.deg>5?7:0);
   if(Math.random()<.85)tone(AU.musG,'sine',nf(M.deg,1),t,beat*(st%2?.9:1.7),.032,{at:.04,vib:5.5,lp:3000})}
  if(st===0||st===4||(war&&st%2===0)){noiz(AU.musG,'lowpass',war?260:200,t,.18,war?.16:.09);tone(AU.musG,'sine',war?90:75,t,.18,war?.12:.07,{slide:45})}
  if(war&&st%2===1)noiz(AU.musG,'bandpass',2400,t,.04,.04,{q:3});
  M.next+=beat/2;M.step++;if(M.step%8===0){M.bar++;if(M.bar%8===0)M.phrase++}}}

/* ---------- seasons, day and night ---------- */
const SEAS=['Spring','Summer','Autumn','Winter'],SEAS_LEN=240,DAY_LEN=360;
const seasonsOn=()=>!!(S&&S.opts&&S.opts.seasons!==0);
function seasonIx(){return seasonsOn()?Math.floor(S.t/SEAS_LEN)%4:1}
function nightF(){if(!seasonsOn())return 0;const c=-Math.cos(S.t/DAY_LEN*Math.PI*2);return clamp((c-.25)/.75,0,1)}
function seasonRate(k){const s=seasonIx();if(k==='farm')return s===3?.75:s===2?1.1:1;if(k==='berry')return s===3?.75:1;return 1}
let glowSp=null,flakes=null;
function mkGlow(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,190,90,.9)');gr.addColorStop(.35,'rgba(255,150,50,.35)');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);return c}
function SEASONTINT(){const s=seasonIx();if(!seasonsOn()||s<2)return;const t=(S.t%SEAS_LEN)/SEAS_LEN,edge=Math.min(1,t*8,(1-t)*8);
 const vw=VW/cam.z,vh=VH/cam.z;if(s===3){const a=(S.biome==='desert'?.1:S.biome==='snow'?.25:.42)*edge;ctx.fillStyle=`rgba(236,242,250,${a})`;ctx.fillRect(cam.x,cam.y,vw,vh)}
 else{ctx.fillStyle=`rgba(205,120,40,${.13*edge})`;ctx.fillRect(cam.x,cam.y,vw,vh)}}
function NIGHT(){const n=nightF();const s=seasonIx();const snowing=seasonsOn()&&s===3&&S.biome!=='desert';if(n<.02&&!snowing)return;ctx.save();ctx.setTransform(DPR,0,0,DPR,0,0);
 if(n>=.02){ctx.fillStyle=`rgba(12,20,52,${.48*n})`;ctx.fillRect(0,0,VW,VH);if(!glowSp)glowSp=mkGlow();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,n*1.3)*.55;
  for(const b of blds){if(b.built<1||B[b.type].flat||B[b.type].wall&&b.type!=='gate')continue;if(b.o!==0&&!vis[b.y*W+b.x])continue;const c=PJ(b.x+b.w/2,b.y+b.h/2,10);const sx=(c[0]-cam.x)*cam.z,sy=(c[1]-cam.y)*cam.z;if(sx<-120||sy<-120||sx>VW+120||sy>VH+120)continue;
   const r=(30+b.w*16)*cam.z*(1+.05*Math.sin(performance.now()/180+b.id));ctx.drawImage(glowSp,sx-r,sy-r*.7,r*2,r*1.4)}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1}
 if(snowing){const t=performance.now()/1000;if(!flakes)flakes=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),s:.6+Math.random()*1.6,v:.04+Math.random()*.06,p:Math.random()*6}));
  const edge=Math.min(1,(S.t%SEAS_LEN)/SEAS_LEN*6,(1-(S.t%SEAS_LEN)/SEAS_LEN)*6);ctx.fillStyle=`rgba(255,255,255,${.75*edge})`;
  for(const f of flakes){const y=(f.y+t*f.v)%1,x=(f.x+Math.sin(t*.8+f.p)*.01+t*.008)%1;ctx.beginPath();ctx.arc(x*VW,y*VH,f.s*1.4,0,7);ctx.fill()}}
 ctx.restore()}
/* farmstead next to a field makes it better */
function nearMill(f){if(f.millT>S.t)return f.mill;f.millT=S.t+5;f.mill=blds.some(b=>b.o===f.o&&b.type==='farmstead'&&b.built>=1&&rectDist(b.x+b.w/2,b.y+b.h/2,f.x,f.y,f.w,f.h)<=3.2);return f.mill}
/* player color and roof choices */
const COLORS={blue:'#2f6fe0',red:'#d6392b',green:'#3a9a46',gold:'#d9a521',purple:'#8a4ad0',teal:'#1fa3a3',orange:'#e0742a'};
const ROOFS={red:{roof:'#a8492e',roofTex:'tile'},blue:{roof:'#3e5a8a',roofTex:'slate'},green:{roof:'#2e6a58',roofTex:'slate'},slate:{roof:'#585e6c',roofTex:'slate'},gold:{roof:'#c89a3a',roofTex:'tile'},black:{roof:'#33302e',roofTex:'slate'}};
function applyColors(o){const pick=COLORS[o&&o.color]||COLORS.blue;const rest=['blue','red','green','gold','purple','teal','orange'].map(k=>COLORS[k]).filter(c=>c!==pick);PCOL[0]=pick;for(let i=1;i<PCOL.length;i++)PCOL[i]=rest[i-1];sprC.clear();uC.clear()}
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
 for(const t in U)ICON['u_'+t]=iconCanvas(g=>{const tg=U[t].tag;g.save();g.translate(32,tg==='cav'?54:tg==='sie'||tg==='trd'?50:tg==='shp'?48:tg==='ani'?44:56);const s=tg==='cav'?1.75:tg==='sie'?1.6:tg==='trd'?1.25:tg==='shp'?(t==='galley'?1.1:1.5):tg==='ani'?2.6:2.3;g.scale(s,s);if(tg==='ani')drawAnimal(g,'sheep',1,0,0,0);else drawUnit(g,t,0,1,0,'idle',null,true);g.restore()},isHero(t)?['#8a6a2e','#3a2a10']:U[t].uu?['#6a3a5a','#2a1020']:['#6a4b2e','#2a1b10']);
 for(const t in B)ICON['b_'+t]=iconCanvas(g=>{if(t==='field'){drawFarmAt(g,8,10,48,44,1,0,true);return}if(t==='road'){const sp=roadSprite(5);g.drawImage(sp,4,14,56,28);return}const c=bSprite(t,sk,0);const w=c.width/c.sc,h=c.height/c.sc;const s=Math.min(58/w,58/h);g.drawImage(c,32-w*s/2,32-h*s/2+2,w*s,h*s)},['#5a7a3a','#2b3d1c']);
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
 for(const f of ['loose','line','box','wedge'])ICON['form_'+f]=iconCanvas(g=>{const pts=f==='loose'?[[18,20],[34,16],[46,26],[24,34],[40,40],[20,48],[44,50]]:f==='line'?[[12,24],[22,24],[32,24],[42,24],[52,24],[12,38],[22,38],[32,38],[42,38],[52,38]]:f==='box'?[[20,18],[32,18],[44,18],[20,32],[32,32],[44,32],[20,46],[32,46],[44,46]]:[[32,14],[25,26],[39,26],[18,38],[32,38],[46,38],[11,50],[25,50],[39,50],[53,50]];
  pts.forEach(([x,y],i)=>{g.fillStyle=(f==='loose'?i%2:y>30)?'#9fd0ff':'#f6ecd5';g.beginPath();g.arc(x,y,4,0,7);g.fill()});g.fillStyle='#ffd34a';g.beginPath();g.moveTo(32,4);g.lineTo(27,10);g.lineTo(37,10);g.fill()},['#3a4a5a','#1a2430']);
 ICON.lock=iconCanvas(g=>{g.strokeStyle='#e8dcc0';g.lineWidth=5;g.beginPath();g.arc(32,26,10,Math.PI,0);g.stroke();g.fillStyle='#e8c15a';g.fillRect(18,26,28,22);g.fillStyle='#3a2a1a';g.beginPath();g.arc(32,35,3.5,0,7);g.fill();g.fillRect(30.5,36,3,7)},['#4a3a2a','#20160c']);
 ICON.repair=iconCanvas(g=>{g.save();g.translate(32,32);g.rotate(-.7);g.fillStyle='#8a5a30';g.fillRect(-3,-4,6,26);g.fillStyle='#c8ccd4';g.fillRect(-11,-14,22,10);g.restore();g.fillStyle='#7fe06a';g.beginPath();g.arc(47,46,7,0,7);g.fill();g.fillStyle='#fff';g.fillRect(43.5,45,7,2);g.fillRect(46,42.5,2,7)},['#3a4a2a','#1a2410']);
 ICON.patrol=iconCanvas(g=>{g.strokeStyle='#f6ecd5';g.fillStyle='#f6ecd5';g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(16,24);g.lineTo(44,24);g.stroke();g.beginPath();g.moveTo(48,24);g.lineTo(39,17);g.lineTo(39,31);g.fill();g.strokeStyle='#ffd34a';g.fillStyle='#ffd34a';g.beginPath();g.moveTo(48,42);g.lineTo(20,42);g.stroke();g.beginPath();g.moveTo(16,42);g.lineTo(25,35);g.lineTo(25,49);g.fill();g.fillStyle='#e8dcc0';g.beginPath();g.arc(32,33,3,0,7);g.fill()},['#5a4a2a','#2a1e0c']);
 ICON.amove=iconCanvas(g=>{sym(g,'sword',26,34,1.2,'#f6ecd5');sym(g,'arrow',40,26,1,'#ffb0a0')},['#6a3a2a','#2a120c']);ICON.gar=iconCanvas(g=>{g.fillStyle='#e8dcc0';g.fillRect(18,22,28,26);g.fillRect(16,16,6,8);g.fillRect(29,16,6,8);g.fillRect(42,16,6,8);g.fillStyle='#3a2a1a';g.fillRect(28,34,8,14)},['#4a5a6a','#1a2a36']);
 ICON.unload=iconCanvas(g=>{g.fillStyle='#e8dcc0';g.fillRect(14,24,22,22);g.strokeStyle='#bff0a8';g.lineWidth=3.5;g.beginPath();g.moveTo(30,36);g.lineTo(52,36);g.moveTo(44,28);g.lineTo(52,36);g.lineTo(44,44);g.stroke()},['#3e5a26','#1e2e12']);
 ICON.st_agg=iconCanvas(g=>sym(g,'sword',32,32,1.6,'#ffcfb8'),['#7a3a2a','#3a1a12']);ICON.st_def=iconCanvas(g=>sym(g,'shield',32,32,1.5,'#cfe0ff'),['#3a5a7a','#1a2a3d']);ICON.st_hold=iconCanvas(g=>sym(g,'stop',32,32,1.3,'#f6ecd5'),['#5a5a3a','#2a2a16']);ICON.st_pas=iconCanvas(g=>sym(g,'x',32,32,1.3,'#d8d8d8'),['#4a4a4a','#1e1e1e']);
 ICON.batch=iconCanvas(g=>{g.fillStyle='#f6ecd5';g.font='900 26px Cinzel,serif';g.textAlign='center';g.fillText('×5',32,42)},['#5a4a2a','#2a2010']);ICON.batch1=iconCanvas(g=>{g.fillStyle='#f6ecd5';g.font='900 26px Cinzel,serif';g.textAlign='center';g.fillText('×1',32,42)},['#4a3a2a','#2a2010']);
 ICON.trade=iconCanvas(g=>sym(g,'wheel',32,32,1.5,'#f2cf6a'),['#6a5a2a','#2a2010']);
 for(const r of ['food','wood','stone']){ICON['buy_'+r]=ICON[r];ICON['sell_'+r]=ICON[r]}ICON.hero=ICON.u_h_english;}

/* ---------- camera & input ---------- */
let rScale=1,emaF=16,slowT=0,fastT=0;
function adaptRes(dt){if(!running||paused||document.hidden)return;emaF=emaF*.94+dt*1000*.06;const full=Math.min(2,window.devicePixelRatio||1);
 if(emaF>42){slowT+=dt;fastT=0;if(slowT>1.5&&full*rScale>1.01){rScale=Math.max(1/full,rScale-.15);slowT=0;resize()}}else if(emaF<24){fastT+=dt;slowT=0;if(fastT>6&&rScale<1){rScale=Math.min(1,rScale+.1);fastT=0;resize()}}else{slowT=0;fastT=0}}
function resize(){DPR=Math.max(1,Math.min(2,window.devicePixelRatio||1)*rScale);VW=innerWidth;VH=innerHeight;cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR);clampCam()}
function clampCam(){cam.z=clamp(cam.z,.4,2.2);const vw=VW/cam.z,vh=VH/cam.z;cam.x=clamp(cam.x,-H*HW-vw*.3,W*HW-vw*.7);cam.y=clamp(cam.y,-vh*.3,(W+H)*HH-vh*.7)}
function centerOn(x,y){const p=PJ(x,y,0);cam.x=p[0]-VW/cam.z/2;cam.y=p[1]-VH/cam.z/2;clampCam()}
const toWorld=(sx,sy)=>{const px=sx/cam.z+cam.x,py=sy/cam.z+cam.y;return{x:(px/HW+py/HH)/2,y:(py/HH-px/HW)/2,px,py}};
const ptrs=new Map();let gest=null,lpTimer=0;
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{if(!S)return;cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});clearTimeout(lpTimer);
 if(ptrs.size===1){const mouse=e.pointerType==='mouse';gest={type:'pend',id:e.pointerId,sx:e.clientX,sy:e.clientY,cx:e.clientX,cy:e.clientY,mouse,btn:e.button,cam0:{x:cam.x,y:cam.y}};
  if(mouse&&e.button===1)gest.type='pan';
  else if(placing&&running&&(B[placing.type].wall||B[placing.type].road)&&!(mouse&&e.button===2)){gest.type='wall';setGhost(toWorld(e.clientX,e.clientY));placing.ax=placing.tx;placing.ay=placing.ty;lastSig='';panelDirty=true}
  if(!mouse&&running&&!placing)lpTimer=setTimeout(()=>{if(gest&&gest.type==='pend'){gest.type='box';if(navigator.vibrate)try{navigator.vibrate(12)}catch(_){}}},380)}
 else if(ptrs.size===2){const [a,b]=[...ptrs.values()];gest={type:'pinch',d0:Math.hypot(a.x-b.x,a.y-b.y),z0:cam.z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,cam0:{x:cam.x,y:cam.y}}}});
cv.addEventListener('pointermove',e=>{if(!S)return;const p=ptrs.get(e.pointerId);
 if(e.pointerType==='mouse'&&placing&&!p){const w=toWorld(e.clientX,e.clientY);setGhost(w)}
 if(!p)return;p.x=e.clientX;p.y=e.clientY;if(!gest)return;
 if(gest.type==='pinch'&&ptrs.size>=2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;const wx=gest.mx/gest.z0+gest.cam0.x,wy=gest.my/gest.z0+gest.cam0.y;cam.z=clamp(gest.z0*d/Math.max(20,gest.d0),.45,2.4);cam.x=wx-mx/cam.z;cam.y=wy-my/cam.z;clampCam();return}
 if(gest.id!==e.pointerId)return;gest.cx=e.clientX;gest.cy=e.clientY;const moved=Math.hypot(gest.cx-gest.sx,gest.cy-gest.sy);
 if(gest.type==='wall'){if(placing)setGhost(toWorld(e.clientX,e.clientY));return}
 if(gest.type==='pend'&&moved>9){clearTimeout(lpTimer);gest.type=(gest.mouse&&gest.btn===0&&!placing)||(boxMode&&!placing)?'box':gest.mouse&&gest.btn===2?'none':'pan'}
 if(gest.type==='pan'){cam.x=gest.cam0.x-(gest.cx-gest.sx)/cam.z;cam.y=gest.cam0.y-(gest.cy-gest.sy)/cam.z;clampCam()}});
function endPtr(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);clearTimeout(lpTimer);if(!gest)return;
 if(gest.type==='pinch'){if(ptrs.size===0)gest=null;else gest={type:'none',id:-1};return}
 if(gest.id!==e.pointerId){if(ptrs.size===0)gest=null;return}
 if(gest.type==='wall'){if(placing&&e.type==='pointerup'&&Math.hypot(gest.cx-gest.sx,gest.cy-gest.sy)>9)confirmPlace();gest=null;return}
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
/* ---------- toasts ---------- */
const toastEl=$('#toasts');const once=new Map();
function toast(msg,kind,at){const d=document.createElement('div');d.className='toast'+(kind?' '+kind:'');d.textContent=msg;if(at){d.style.cursor='pointer';d.onclick=()=>centerOn(at.x,at.y)}toastEl.appendChild(d);while(toastEl.children.length>3)toastEl.firstChild.remove();setTimeout(()=>d.remove(),4200)}
function toastOnce(key,msg,gap=30){const t=S?S.t:0;if(once.has(key)&&t-once.get(key)<gap)return;once.set(key,t);toast(msg,'bad')}
let lastAlert=-99;
function alertAttack(t){if(!S||S.t-lastAlert<15)return;lastAlert=S.t;const c=ec(t);pings.push({x:c.x,y:c.y,t:S.t});noteAttack(c);sfx('horn');const name=t.k==='u'?ud(t).n:B[t.type].n;toast(`Your ${name.toLowerCase()} is under attack! Tap to look.`,'bad',c)}

/* ---------- picking ---------- */
function unitAt(w){let best=null,bd=19;for(const u of units){if(u.gar)continue;if(u.o!==0&&!vis[(u.y|0)*W+(u.x|0)])continue;const p=PJ(u.x,u.y,0),tg=ud(u).tag;const off=tg==='cav'?20:tg==='sie'||tg==='shp'?18:15;
 const d=Math.hypot(w.px-p[0],w.py-(p[1]-off))-(u.o===0?3:0);if(d<bd){bd=d;best=u}}return best}
function animalAt(w){let best=null,bd=16;for(const a of animals){if(!vis[(a.y|0)*W+(a.x|0)])continue;const p=PJ(a.x,a.y,0);const d=Math.hypot(w.px-p[0],w.py-(p[1]-8));if(d<bd){bd=d;best=a}}return best}
function bldAt(w){let best=null,bk=-1e9;for(const b of blds){if(b.o!==0&&!explored[b.y*W+b.x])continue;const zm=B[b.type].flat?0:(ZMX[b.type]||100)*.75;
 for(let zz=0;zz<=zm;zz+=5){const tx=(w.px/HW+(w.py+zz)/HH)/2,ty=((w.py+zz)/HH-w.px/HW)/2;if(tx>=b.x&&tx<b.x+b.w&&ty>=b.y&&ty<b.y+b.h){const k=b.x+b.y+(b.w+b.h)/2;if(k>bk){bk=k;best=b}break}}}return best}
function tap(sx,sy,mode,shift){const w=toWorld(sx,sy);
 if(placing){setGhost(w);if(mode!=='smart')confirmPlace();else{panelDirty=true;lastSig=''}return}
 const hu=unitAt(w);let hb=hu?null:bldAt(w);if(hb&&B[hb.type].road&&sel.some(id=>{const e=ents.get(id);return e&&e.k==='u'&&e.o===0}))hb=null;const ha=hu||hb?null:animalAt(w);const mine=sel.map(id=>ents.get(id)).filter(e=>e&&e.k==='u'&&e.o===0);
 if(cmdMode&&mine.length){const m=cmdMode;cmdMode=null;lastSig='';
  sfx(mine.some(isMil)?'ackS':'ackV');
  if(m==='patrol'){if(peace()){toast('Ceasefire! Patrols start when it ends.','bad');return}const fs=mine.filter(canFight);groupTask(fs,w,'patrol');for(const u of fs){const t=u.task;t.ax=u.x;t.ay=u.y;t.bx=t.x;t.by=t.y;t.leg=1}fx.push({k:'ring',x:w.x,y:w.y,t:0,life:.5,c:'#ffd34a'});cmdMode=null;lastSig='';panelDirty=true;return}
  if(m==='amove'){amoveGroup(mine,w);fx.push({k:'ring',x:w.x,y:w.y,t:0,life:.5,c:'#ff8a4a'});return}
  if(m==='gar'){if(hb&&hb.o===0&&B[hb.type].gar){for(const u of mine){if(u.nav)continue;u.task={k:'gar',id:hb.id};u.path=null}fx.push({k:'ring',x:hb.x+hb.w/2,y:hb.y+hb.h/2,t:0,life:.5,c:'#7fc0ff'})}else toast('Tap one of your towers, castles, barracks, monasteries or town centers');return}
  if(m==='trade'){if(hb&&hb.o===0&&hb.type==='market')setTrade(mine,hb);else toast('Tap one of your markets');return}}
 const selB=sel.length===1&&ents.get(sel[0]);
 if(mode!=='cmd'){
  if(hu&&hu.o===0){const now=performance.now();if(now-lastTapT<380&&lastTapId&&ents.get(lastTapId)?.type===hu.type){const v=visibleUnits().filter(u=>u.o===0&&u.type===hu.type);sel=v.map(u=>u.id).slice(0,80)}else if(shift){if(sel.indexOf(hu.id)<0)sel.push(hu.id)}else sel=[hu.id];lastTapT=now;lastTapId=hu.id;panelDirty=true;return}
  if(mode==='sel'||(!mine.length&&!(selB&&selB.k==='b'&&selB.o===0))){if(hu){sel=[hu.id];if(hu.o===0)sfx(isMil(hu)?'ackS':'ackV')}else if(hb){sel=[hb.id];sfx('click')}else sel=[];panelDirty=true;return}}
 if(selB&&selB.k==='b'&&selB.o===0&&!mine.length){if(hb===selB)return;if(hb&&hb.o===0&&hb!==selB&&!(hb.type==='field'||hb.built<1)){sel=[hb.id];panelDirty=true;return}
  if(hu&&mode==='smart'){sel=[hu.id];panelDirty=true;return}
  if(B[selB.type].train){const tx=Math.floor(w.x),ty=Math.floor(w.y),i=ty*W+tx;selB.rally={x:w.x,y:w.y};if(resT[i]&&resT[i]<5&&explored[i])selB.rally.rt=RTN[resT[i]],selB.rally.tx=tx,selB.rally.ty=ty;if(hb&&hb.o===0)selB.rally.bid=hb.id;
   fx.push({k:'ring',x:w.x,y:w.y,t:0,life:.5,c:'#f4e07a'});toast('Rally point set')}else{sel=hb?[hb.id]:[];panelDirty=true}return}
 if(!mine.length){if(hb){sel=[hb.id];panelDirty=true}return}
 command(mine,w,hu,hb,ha,mode)}
function command(mine,w,hu,hb,ha,mode){{const rl=!hu&&!hb&&relicAt(w);const mk=mine.find(u=>u.type==='monk');if(rl&&mk){mk.task={k:'relic',rid:rl.id};mk.path=null;fx.push({k:'ring',x:rl.x,y:rl.y,t:0,life:.5,c:'#ffe58a'});sfx('ackV');return}}sfx(mine.some(isMil)?'ackS':'ackV');const tx=Math.floor(w.x),ty=Math.floor(w.y),i=ty*W+tx;let mark='#7fe06a';const ships=mine.filter(u=>u.nav),landU=mine.filter(u=>!u.nav);
 const attack=e=>{if(peace()){toast('Ceasefire! No fighting until it ends.','bad');return false}for(const u of mine){if(!canFight(u))continue;u.task={k:'atk',id:e.id};u.path=null}return true};
 if(hu&&isEnemy(0,hu.o)){if(attack(hu))mark='#ff5a4a'}
 else if(hb&&isEnemy(0,hb.o)){if(attack(hb))mark='#ff5a4a'}
 else if(ha){const hunters=mine.filter(u=>canGather(u,'hunt'));for(const u of hunters){u.task={k:'hunt',id:ha.id};u.path=null}const rest=mine.filter(u=>!canGather(u,'hunt'));if(rest.length)moveGroup(rest,w)}
 else if(hb&&hb.o===0){const ws=landU.filter(canBuild),traders=landU.filter(u=>u.type==='trader');
  if(traders.length&&hb.type==='market'){setTrade(traders,hb);return}
  if(ws.length&&(hb.built<1||hb.hp<bMaxHp(hb))){for(const v of ws){if(v.task&&v.task.k==='build'&&ents.has(v.task.id)&&v.task.id!==hb.id){const q=v.task.q||(v.task.q=[]);if(!q.includes(hb.id))q.push(hb.id);continue}v.task={k:'build',id:hb.id,q:[]};v.path=null}}
  else if(ws.length&&hb.type==='field'){for(const v of ws){const f=hb.slots.length<5?hb:freeField(0,v.x,v.y,20);if(f){f.slots.push(v.id);v.task={k:'field',id:f.id}}else v.task=null;v.path=null}}
  else if(ws.length&&hb.type==='corral'&&hb.built>=1){let n=0;for(const v of ws){hb.slots=hb.slots.filter(id=>{const e=ents.get(id);return e&&e.task&&e.task.k==='field'&&e.task.id===hb.id});if(hb.slots.length>=3)break;if(!hb.slots.includes(v.id))hb.slots.push(v.id);v.task={k:'field',id:hb.id};v.path=null;n++}if(n<ws.length)toast(n?`The corral takes 3 herders; ${ws.length-n} stayed put.`:'This corral already has 3 herders.','bad')}
  else if(mode==='smart'&&hb.built>=1){sel=[hb.id];panelDirty=true;return}
  else if(ws.length&&B[hb.type].drop&&ws.some(v=>v.carry>0)){for(const v of ws){if(v.carry>0){v.task={k:'gather',rt:v.ct,tx:0,ty:0,ph:'ret',drop:hb.id,end:1};v.path=null}}}
  else if(B[hb.type].gar&&hb.built>=1&&(landU.every(isMil)||(hb.type==='tc'&&P[0].bell))&&landU.length){for(const u of landU){u.task={k:'gar',id:hb.id};u.path=null}mark='#7fc0ff'}
  else if(mode==='smart'){sel=[hb.id];panelDirty=true;return}
  else moveGroup(mine,w)}
 else if(resT[i]&&explored[i]){const rt=resT[i];const k=rt===5?'fish':rt===4?'berry':RTN[rt];const g=mine.filter(u=>canGather(u,k));for(const v of g){v.task={k:'gather',rt:rt===5?'fish':RTN[rt],tx,ty};v.path=null}const rest=mine.filter(u=>!canGather(u,k));if(rest.length)moveGroup(rest,w)}
 else moveGroup(mine,w);
 fx.push({k:'ring',x:w.x,y:w.y,t:0,life:.5,c:mark})}
function setTrade(trs,mk){const others=blds.filter(b=>b.o===0&&b.type==='market'&&b!==mk&&b.built>=1);if(!others.length){toast('Build a second market far away to start trading','bad');return}
 for(const t of trs){if(t.type!=='trader')continue;let far=others[0];for(const o of others)if(Math.hypot(o.x-mk.x,o.y-mk.y)>Math.hypot(far.x-mk.x,far.y-mk.y))far=o;t.task={k:'trade',a:mk.id,b:far.id,leg:0};t.path=null}
 toast('Trade route set. Farther markets earn more gold.','good')}
function spotsNear(w,n,nav){const cx=Math.floor(w.x),cy=Math.floor(w.y);const spots=[];for(let r=0;r<10&&spots.length<n;r++)for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(Math.max(Math.abs(x-cx),Math.abs(y-cy))!==r)continue;if(passXY(x,y,0,nav))spots.push({x:x+.5,y:y+.5})}return spots}
const FORMS={loose:'Loose',line:'Line',box:'Box',wedge:'Wedge'},FORM_K=['loose','line','box','wedge'];
function formSlots(form,n){const sl=[];if(form==='line'){const wd=Math.max(3,Math.ceil(Math.sqrt(n*3)));for(let i=0;i<n;i++){const r=Math.floor(i/wd),c=i%wd,inRow=Math.min(wd,n-r*wd);sl.push([c-(inRow-1)/2,r])}}
 else if(form==='box'){const wd=Math.ceil(Math.sqrt(n));for(let i=0;i<n;i++){const r=Math.floor(i/wd),c=i%wd,inRow=Math.min(wd,n-r*wd);sl.push([c-(inRow-1)/2,r])}}
 else{let r=0,i=0;while(i<n){const inRow=Math.min(r+1,n-i);for(let c=0;c<inRow;c++){sl.push([c-(inRow-1)/2,r]);i++}r++}}return sl}
function formationTask(grp,w,k){const form=S.form;let cx=0,cy=0;for(const u of grp){cx+=u.x;cy+=u.y}cx/=grp.length;cy/=grp.length;let dx=w.x-cx,dy=w.y-cy;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;const rx=-dy,ry=dx,sp=.95;
 const cat=u=>{const d=ud(u);return d.tag==='sie'?3:uRng(u)>0||d.heal?2:d.tag==='cav'&&form==='wedge'?0:1};const sorted=grp.slice().sort((a,b)=>cat(a)-cat(b));const slots=formSlots(form,grp.length);
 const order=slots.map((s,i)=>i).sort((a,b)=>slots[a][1]-slots[b][1]||slots[a][0]-slots[b][0]);let gs=99;for(const u of grp)gs=Math.min(gs,uSpd(u));
 let i=0;while(i<sorted.length){const row=slots[order[i]][1];const ids=[];while(i<sorted.length&&slots[order[i]][1]===row){ids.push(i);i++}
  const us=ids.map(j=>sorted[j]).sort((a,b)=>(a.x*rx+a.y*ry)-(b.x*rx+b.y*ry));ids.forEach((j,n)=>{const s=slots[order[j]];let tx=w.x+rx*s[0]*sp-dx*s[1]*sp,ty=w.y+ry*s[0]*sp-dy*s[1]*sp;
   if(!passXY(Math.floor(tx),Math.floor(ty),0,0)){const alt=spotsNear({x:tx,y:ty},1,0)[0];if(alt){tx=alt.x;ty=alt.y}}const u=us[n];u.task={k,x:tx,y:ty,gs:L>4?gs:0};u.path=null;u.home={x:tx,y:ty}})}}
function groupTask(us,w,k){for(const nav of [0,1]){const grp=us.filter(u=>u.nav===nav);if(!grp.length)continue;if(!nav&&grp.length>1&&S.form&&S.form!=='loose'&&(k==='move'||k==='amove'||k==='patrol')&&grp.some(isMil)){formationTask(grp,w,k);continue}if(grp.length===1){grp[0].task={k,x:w.x,y:w.y};grp[0].path=null;grp[0].home={x:w.x,y:w.y};continue}
 const spots=spotsNear(w,grp.length,nav);const rem=grp.slice().sort((a,b)=>Math.hypot(a.x-w.x,a.y-w.y)-Math.hypot(b.x-w.x,b.y-w.y));
 for(const sp of spots){if(!rem.length)break;let bi=0,bd=1e9;rem.forEach((u,k2)=>{const d=Math.hypot(u.x-sp.x,u.y-sp.y);if(d<bd){bd=d;bi=k2}});const u=rem.splice(bi,1)[0];u.task={k,x:sp.x,y:sp.y};u.path=null;u.home={x:sp.x,y:sp.y}}
 for(const u of rem){u.task={k,x:w.x,y:w.y};u.path=null}}}
const moveGroup=(us,w)=>groupTask(us,w,'move');
const amoveGroup=(us,w)=>{if(peace()){toast('Ceasefire! Moving without attacking.');return groupTask(us,w,'move')}groupTask(us.filter(canFight),w,'amove');groupTask(us.filter(u=>!canFight(u)),w,'move')};
function visibleUnits(){const x0=cam.x,y0=cam.y,x1=cam.x+VW/cam.z,y1=cam.y+VH/cam.z;return units.filter(u=>{if(u.gar)return false;const p=PJ(u.x,u.y,0);return p[0]>=x0&&p[0]<=x1&&p[1]>=y0&&p[1]<=y1})}
function boxSelect(sx,sy,ex,ey,shift){const a=toWorld(Math.min(sx,ex),Math.min(sy,ey)),b=toWorld(Math.max(sx,ex),Math.max(sy,ey));
 let us=units.filter(u=>{if(u.o!==0||u.gar)return false;const p=PJ(u.x,u.y,0);return p[0]>=a.px-6&&p[0]<=b.px+6&&p[1]-14>=a.py-10&&p[1]-14<=b.py+10});
 if(us.some(isMil)&&us.some(u=>!isMil(u))&&!shift)us=us.filter(isMil);
 if(!us.length){if(!shift)sel=[];panelDirty=true;return}sel=(shift?sel.concat(us.map(u=>u.id)):us.map(u=>u.id)).slice(0,80);panelDirty=true}
function nextIdle(){const idle=units.filter(u=>u.o===0&&ud(u).tag==='vil'&&!u.task&&!u.gar);if(!idle.length){toast('No idle villagers');return}S.idleIx=((S.idleIx||0)+1)%idle.length;const u=idle[S.idleIx];sel=[u.id];centerOn(u.x,u.y);panelDirty=true}
function goHome(){const b=blds.find(b=>b.o===0&&b.type==='tc')||blds.find(b=>b.o===0);if(b)centerOn(b.x+b.w/2,b.y+b.h/2)}
mini.addEventListener('pointerdown',e=>{if(!S)return;const r=mini.getBoundingClientRect();const go=ev=>{const mx=(ev.clientX-r.left)/r.width*288,my=(ev.clientY-r.top)/r.height*144;const a=144/W;const u=(mx-144)/a,v=my*2/a;centerOn((v+u)/2,(v-u)/2)};go(e);mini.setPointerCapture(e.pointerId);mini.onpointermove=ev=>{if(ev.buttons||ev.pointerType!=='mouse')go(ev)};mini.onpointerup=()=>{mini.onpointermove=null}});
$('#bIdle').onclick=nextIdle;$('#bHome').onclick=goHome;
$('#bArmy').onclick=()=>{const a=units.filter(u=>u.o===0&&isMil(u)&&!u.gar);if(!a.length){toast('You have no army yet');return}const same=a.length===sel.length&&a.every(u=>sel.includes(u.id));sel=a.map(u=>u.id).slice(0,80);if(same){let x=0,y=0;for(const u of a){x+=u.x;y+=u.y}centerOn(x/a.length,y/a.length)}panelDirty=true};
$('#bBox').onclick=()=>{boxMode=!boxMode;$('#bBox').classList.toggle('on',boxMode);toast(boxMode?'Box select on: drag to select. Pinch or the minimap to move.':'Box select off')};

/* ---------- panel ---------- */
const panel=$('#panel'),info=$('#info'),acts=$('#acts');let panelDirty=true,lastSig='',tab='eco',delArm=0,batch5=false;
const SHORT={'Lumber Camp':'Lumber','Archery Range':'Archery','Siege Workshop':'Siege','Town Center':'Town Ctr','Stone Tower':'Tower','Sentry Tower':'Sentry','Stone Wall':'Wall','Battering Ram':'Ram','Crossbowman':'Crossbow','Scout Rider':'Scout','Double-Bit Axe':'Axe','Horse Collar':'Collar','Heavy Plow':'Plow','Gold Mining':'Gold Mine','Stone Mining':'Stone Mine','Shaft Mining':'Shaft Mine','Iron Casting':'Iron Cast','Bodkin Arrow':'Bodkin','Scale Armor':'Scale','Chain Mail':'Chain','Wheelbarrow':'Barrow','Town Phase':'Town','City Phase':'City','Treadmill Crane':'Crane','Wicker Baskets':'Baskets','Fishing Nets':'Nets','Horse Barding':'Barding','Herbal Medicine':'Herbal','Conscription':'Conscript','Architecture':'Architect','Fishing Boat':'Fish Boat','War Galley':'Galley','Trade Cart':'Trader','Camel Rider':'Camel','Horse Archer':'Horse Arch','Landsknecht':'Landsk.','Woad Raider':'Woad','Longbowman':'Longbow','Cataphract':'Cataphr.','Richard the Lionheart':'Richard','Joan of Arc':'Joan','Frederick Barbarossa':'Barbarossa','Minamoto Yoshitsune':'Yoshitsune','Harald Hardrada':'Harald','William Wallace':'Wallace','Storehouse':'Storehouse','Farmstead':'Farmstead','Monastery':'Monastery'};
function selection(){const es=sel.map(id=>ents.get(id)).filter(e=>e&&!(e.k==='u'&&e.gar));sel=es.map(e=>e.id);if(!es.length)return{k:'none',es};if(es[0].k==='b')return{k:es[0].o===0?'bld':'enemy',es};if(es[0].o!==0)return{k:'enemy',es};return{k:'units',es}}
function btn(a,icon,name,cost,ok,cls='',sub){name=SHORT[name]||name;return`<button class="ab ${ok?'':'no'} ${cls}" data-a="${a}"><img src="${ICON[icon]||''}" alt=""><span class="nm">${name}</span>${cost?`<span class="cs">${costStr(cost)}</span>`:sub?`<span class="cs">${sub}</span>`:''}</button>`}
function taskText(u){const t=u.task;if(!t)return isMil(u)?'Ready':'Idle';const m={move:'Moving',amove:'Attack-moving',patrol:'Patrolling',atk:'Attacking',build:'Building',gar:'Heading inside',heal:'Healing',trade:'Trading'};if(m[t.k])return m[t.k];
 const cap=P[0].m.carry;if(t.k==='field')return t.ph==='ret'?'Carrying food home':`Farming (${Math.floor(u.carry)}/${cap})`;if(t.k==='hunt')return t.ph==='ret'?'Carrying meat home':`Hunting (${Math.floor(u.carry)})`;
 if(t.k==='gather'){const v={wood:'Chopping wood',gold:'Mining gold',stone:'Mining stone',food:'Picking berries',fish:'Fishing'}[t.rt];return t.ph==='ret'?`Carrying ${t.rt} home`:`${v} (${Math.floor(u.carry)})`}return''}
const RANKN=['','Advanced','Elite'];const STN={agg:'Aggressive',def:'Defensive',hold:'Hold ground',pas:'Passive'};
function renderPanel(){if(!S)return;const s=selection(),p=P[0];
 if(placing){panel.hidden=false;const d=B[placing.type];const wallStage=d.road?'Drag along the ground to lay the road. Lift your finger and your villagers pave it.':d.wall?'Drag along the ground from where the wall starts to where it ends. Lift your finger to build it.':d.water?'Tap the water next to the shore, then press the check.':d.any?'Tap the map, then press the check.':'Tap inside your territory (dashed line), then press the check.';
  info.innerHTML=`<div class="por"><img src="${ICON['b_'+placing.type]}" alt=""></div><div class="tx"><h4>${d.n}</h4><div class="st">${costStr(d.cost)}${d.wall?' per tile':''}</div><div class="st">${wallStage}</div></div>`;
  const sig='place'+(placing.ax!=null)+(placing.tx!=null);if(sig!==lastSig){lastSig=sig;acts.innerHTML=btn('pok','ok','Place',null,placing.tx!=null,'ok')+btn('pno','no','Cancel',null,true,'x')}return}
 if(s.k==='none'){panel.hidden=true;lastSig='';return}panel.hidden=false;
 if(s.es[0].k==='u'){const es=s.es;
  if(es.length===1){const u=es[0],d=ud(u),mx=uMaxHp(u);const f=u.hp/mx;
   info.innerHTML=`<div class="por"><img src="${ICON['u_'+u.type]}" alt=""></div><div class="tx"><h4>${d.n}${u.o!==0?' ('+P[u.o].civN+')':''}</h4><div class="hp ${f<.35?'lo':''}"><i style="width:${f*100}%"></i></div><div class="st"><b>${Math.ceil(u.hp)}/${mx}</b> HP${d.atk?` · Atk <b>${Math.round(uAtk(u))}</b>`:''} · Arm <b>${uArm(u,'m')}/${uArm(u,'p')}</b>${uRng(u)?` · Rng <b>${uRng(u)}</b>`:''}${u.rank?` · <b>${RANKN[u.rank]}</b>`:''}</div>${u.o===0?`<div class="st">${taskText(u)}${isMil(u)&&canFight(u)?' · '+STN[u.stance]:''}${d.hero?' · '+d.d:''}</div>`:''}</div>`}
  else{const g={};for(const u of es)g[u.type]=(g[u.type]||0)+1;info.innerHTML=`<div class="tx"><h4>${es.length} units selected</h4><div class="grp">${Object.keys(g).map(t=>`<button data-a="only:${t}"><img src="${ICON['u_'+t]}" alt=""><b>${g[t]}</b></button>`).join('')}</div></div>`}
  if(s.k==='enemy'){if(lastSig!=='en'){lastSig='en';acts.innerHTML=''}return}
  const workers=es.some(canBuild),mil=es.some(u=>isMil(u)&&canFight(u)),trd=es.some(u=>u.type==='trader');const da=delArm>performance.now();
  let html='',sig='u'+(S.form||'')+workers+mil+tab+p.phase+(da?'d':'')+(cmdMode||'')+es.map(u=>u.stance).join('');
  if(workers){html+=`<div class="tabs"><button data-a="tab:eco" class="${tab==='eco'?'on':''}">Economy</button><button data-a="tab:mil" class="${tab==='mil'?'on':''}">Military</button><button data-a="tab:def" class="${tab==='def'?'on':''}">Defense</button></div>`;
   for(const t of BUILD_TABS[tab]){const d=B[t];if(d.ph>p.phase){html+=`<button class="ab no" data-a="lock:${t}"><img src="${ICON['b_'+t]}" alt=""><span class="nm">${SHORT[d.n]||d.n}</span><span class="cs">${PHASE[d.ph]}</span></button>`;continue}const ok=afford(p,d.cost);sig+=ok?1:0;html+=btn('build:'+t,'b_'+t,d.n,d.cost,ok)}}
  if(mil){const st=es.find(u=>isMil(u)).stance;for(const k of ['agg','def','hold','pas'])html+=btn('stance:'+k,'st_'+k,STN[k],null,true,st===k?'ok':'');html+=btn('amove','amove','Attack-move',null,true,cmdMode==='amove'?'ok':'');html+=btn('patrol','patrol','Patrol',null,true,cmdMode==='patrol'?'ok':'');html+=btn('form','form_'+(S.form||'loose'),'Form: '+FORMS[S.form||'loose'],null,true,'');}
  if(es.some(u=>!u.nav))html+=btn('gar','gar','Garrison',null,true,cmdMode==='gar'?'ok':'');
  if(trd)html+=btn('trade','trade','Trade route',null,true,cmdMode==='trade'?'ok':'');
  html+=btn('stop','stop','Stop',null,true)+btn(da?'del2':'del','del',da?'Sure?':'Delete',null,true);
  if(cmdMode)html+=`<div class="hint">${cmdMode==='patrol'?'Tap a spot. Your soldiers walk back and forth between here and there, fighting any enemy they spot.':cmdMode==='amove'?'Tap a spot. Your soldiers fight anything they meet on the way.':cmdMode==='gar'?'Tap a tower, castle, town center, barracks or monastery to go inside. Units inside heal and add arrows.':'Tap one of your markets.'}</div>`;
  if(sig!==lastSig){lastSig=sig;acts.innerHTML=html}return}
 const b=s.es[0],d=B[b.type],mx=bMaxHp(b),f=b.hp/mx;let st='';
 if(b.built<1)st=`Building <b>${Math.floor(b.built*100)}%</b>`;else if(d.pop)st=`Houses <b>${d.pop}</b>`;
 if(d.gar)st+=` · Inside <b>${b.gar.length}/${d.gar}</b>`;if(b.type==='field')st+=` · Farmers <b>${b.slots.length}/5</b>`;
 if(b.cp<cpMax(b)-1)st+=` · Capture <b>${Math.round(b.cp/cpMax(b)*100)}%</b>`;if(b.type==='wonder'&&b.built>=1&&S.wonderWin)st+=` · Victory in <b>${Math.max(0,Math.ceil((600-(S.t-b.wonderT))/60))} min</b>`;
 let q='';if(b.o===0&&b.queue.length)q=`<div class="q">${b.queue.map((it,k)=>{const tm=qTime(it)/(it.u?p.m.train:1);return`<button data-a="cancel:${k}" aria-label="Cancel"><img src="${ICON[it.u?'u_'+it.u:'t_'+it.t]}" alt="">${(it.n||1)>1?`<b class="qn">${it.n}</b>`:''}${k===0?`<i style="width:${Math.min(100,it.p/tm*100)}%"></i>`:''}</button>`}).join('')}</div>`;
 info.innerHTML=`<div class="por"><img src="${ICON['b_'+b.type]}" alt=""></div><div class="tx"><h4>${d.n}${b.o!==0?' ('+P[b.o].civN+')':''}</h4><div class="hp ${f<.35?'lo':''}"><i style="width:${f*100}%"></i></div><div class="st"><b>${Math.ceil(b.hp)}/${mx}</b> HP${st?' · '+st:''}</div>${q}</div>`;
 if(b.o!==0){if(lastSig!=='en'){lastSig='en';acts.innerHTML=''}return}
 const da=delArm>performance.now();let html='',sig='b'+b.id+p.phase+b.built+(b.queue.length>=5)+p.techs.length+(p.bell?1:0)+(da?'d':'')+blds.reduce((a,x)=>a+x.queue.length,0)+batch5+b.gar.length+(p.hero?1:0)+phaseCount(p,0)+phaseCount(p,1);
 if(b.built>=1){const tl=trainList(b);for(const t of tl){const ud2=U[t];if(ud2.ph>p.phase){html+=`<button class="ab no" data-a="lockU:${t}"><img src="${ICON['u_'+t]}" alt=""><span class="nm">${SHORT[ud2.n]||ud2.n}</span><span class="cs">${PHASE[ud2.ph]}</span></button>`;continue}
   const n=batch5&&!isHero(t)?5:1;const c0=costOf(p,ud2.cost,'u',t),c={};for(const r in c0)c[r]=c0[r]*n;const ok=afford(p,c)&&b.queue.length<5&&unitOk(p,t,b);sig+=ok?1:0;html+=btn('train:'+t,'u_'+t,ud2.n,c,ok)}
  if(tl.length&&tl.some(t=>!isHero(t)))html+=btn('batch',batch5?'batch':'batch1',batch5?'Batch ×5':'Batch ×1',null,true,batch5?'ok':'');
  for(const t of d.tech||[]){if(!techOk(p,t))continue;const tc=TECH[t];const c=costOf(p,tc.cost,'t');let ok=afford(p,c)&&b.queue.length<5;let sub=null;if(tc.up){const n=phaseCount(p,tc.ph);ok=ok&&n>=tc.need;sig+=n;if(n<tc.need){html+=btn('tech:'+t,'t_'+t,tc.n,null,false,'',`${n}/${tc.need} bldgs`);continue}}sig+=ok?1:0;html+=btn('tech:'+t,'t_'+t,tc.n,c,ok)}
  if(b.type==='tc')html+=p.bell?btn('clear','clear','All clear',null,true):btn('bell','bell','Ring bell',null,true);
  if(d.gar&&b.gar.length)html+=btn('unload','unload','Unload all',null,true);
  if(d.gate){html+=btn('lock','lock',b.locked?'Unlock gate':'Lock gate',null,true,b.locked?'ok':'');sig+=b.locked?'L':''}
  if(b.type==='tc'){html+=btn('autorep','repair','Auto-repair: '+(p.autoRep?'On':'Off'),null,true,p.autoRep?'ok':'');sig+=p.autoRep?'R':''}
  if(d.market){for(const r of ['food','wood','stone']){const pr=p.barter[r];html+=btn('buy:'+r,r,'Buy 100',null,p.res.gold>=Math.round(pr*(1+.2*p.m.barter)),'',Math.round(pr*(1+.2*p.m.barter))+' gold')+btn('sell:'+r,r,'Sell 100',null,p.res[r]>=100,'',Math.round(pr*(1-.25*p.m.barter))+' gold')}sig+=JSON.stringify(p.barter)+Math.floor(p.res.gold/50)}}
 html+=btn(da?'del2':'del','del',da?'Sure?':'Delete',null,true);
 if(d.train&&b.built>=1)html+=`<div class="hint">Tap the map to set a rally point. Tap a tree, mine or field to send new workers straight there.</div>`;
 if(sig!==lastSig){lastSig=sig;acts.innerHTML=html}}
function act(a){const p=P[0];const [k,v]=a.split(':');const s=selection();
 if(k==='tab'){tab=v;lastSig='';return}
 if(k==='lock'){toast(B[v].n+' unlocks in the '+PHASE[B[v].ph]+' Phase');return}if(k==='lockU'){toast(U[v].n+' unlocks in the '+PHASE[U[v].ph]+' Phase');return}
 if(k==='only'){sel=s.es.filter(u=>u.type===v).map(u=>u.id);panelDirty=true;return}
 if(k==='build'){const d=B[v];if(!afford(p,d.cost)){toast('Need '+need(p,d.cost),'bad');return}const c=toWorld(VW/2,VH*.45);placing={type:v,tx:null,ty:null,ax:null,ay:null};setGhost(c);lastSig='';cmdMode=null;return}
 if(k==='pok'){confirmPlace();lastSig='';return}if(k==='pno'){placing=null;lastSig='';panelDirty=true;return}
 if(k==='stop'){for(const u of s.es)if(u.k==='u'){u.task=null;u.path=null;u.home={x:u.x,y:u.y}}cmdMode=null;return}
 if(k==='stance'){for(const u of s.es)if(u.k==='u'&&isMil(u)){u.stance=v;u.home={x:u.x,y:u.y};if(v==='pas'&&u.task&&u.task.k==='atk')u.task=null}lastSig='';return}
 if(k==='form'){S.form=FORM_K[(FORM_K.indexOf(S.form||'loose')+1)%FORM_K.length];lastSig='';panelDirty=true;toast('Formation: '+FORMS[S.form]+(S.form==='loose'?'':'. Melee in front, archers behind, siege at the back.'));return}
 if(k==='amove'||k==='patrol'||k==='gar'||k==='trade'){cmdMode=cmdMode===k?null:k;lastSig='';return}
 if(k==='del'){delArm=performance.now()+2500;lastSig='';return}
 if(k==='del2'){delArm=0;for(const e of s.es){if(e.o!==0)continue;if(e.k==='b'&&e.built<1)refund(p,B[e.type].cost,1-e.built);kill(e,0,true)}lastSig='';return}
 if(k==='batch'){batch5=!batch5;lastSig='';return}
 const b=s.es[0];if(!b||b.k!=='b')return;
 if(k==='train'){const ud2=U[v];if(b.queue.length>=5){toast('Queue is full');return}if(!unitOk(p,v,b)){toast(isHero(v)?'You can only have one hero at a time':'Not available yet');return}const n=batch5&&!isHero(v)?5:1;const c0=costOf(p,ud2.cost,'u',v),c={};for(const r in c0)c[r]=c0[r]*n;if(!afford(p,c)){toast('Need '+need(p,c),'bad');return}pay(p,c);b.queue.push({u:v,p:0,n,cost:c});lastSig='';return}
 if(k==='tech'){const tc=TECH[v];if(!techOk(p,v))return;if(tc.up&&!phaseReady(p,v)){toast(`You need ${tc.need} ${tc.ph?'Town-phase or later ':''}buildings first${tc.ph?'':' (houses and farmsteads count)'}`,'bad');return}const c=costOf(p,tc.cost,'t');if(!afford(p,c)){toast('Need '+need(p,c),'bad');return}pay(p,c);b.queue.push({t:v,p:0,cost:c});lastSig='';return}
 if(k==='cancel'){const it=b.queue[+v];if(!it)return;const c=it.cost||(it.u?costOf(p,U[it.u].cost,'u',it.u):costOf(p,TECH[it.t].cost,'t'));refund(p,c,it.done?1-it.done/(it.n||1):1);b.queue.splice(+v,1);lastSig='';return}
 if(k==='bell'){ringBell(0,true);lastSig='';return}if(k==='clear'){ringBell(0,false);lastSig='';return}
 if(k==='unload'){unload(b);lastSig='';return}
 if(k==='lock'){b.locked=!b.locked;lastSig='';toast(b.locked?'Gate locked. Nobody can pass, not even your units.':'Gate unlocked');return}
 if(k==='autorep'){p.autoRep=!p.autoRep;lastSig='';toast(p.autoRep?'Auto-repair on: nearby villagers fix damaged buildings once the fighting stops there. Repairs cost a little of the building\'s price.':'Auto-repair off');return}
 if(k==='buy'||k==='sell'){if(!barter(p,v,k==='buy'))toast(k==='buy'?'Not enough gold':'Need 100 '+v,'bad');lastSig='';return}}
panel.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;act(t.dataset.a);renderPanel()});
function updTop(){const p=P[0];for(const r of R4){const el=$('#r-'+r+' b');const v=Math.floor(p.res[r]);if(el.textContent!==String(v))el.textContent=v}
 $('#r-pop b').textContent=p.pop+'/'+p.popCap;$('#r-pop').classList.toggle('warn',p.pop>=p.popCap);
 let ag=PHASE[p.phase]+' Phase';for(const b of blds)if(b.o===0&&b.queue.length&&b.queue[0].t&&TECH[b.queue[0].t].up){ag=`${PHASE[p.phase+1]} ${Math.floor(b.queue[0].p/TECH[b.queue[0].t].tm*100)}%`}
 $('#age b').textContent=ag;const t=Math.floor(S.t);const pc=peace()?' · Peace '+Math.floor((S.peace-S.t)/60)+':'+String(Math.floor((S.peace-S.t)%60)).padStart(2,'0'):'';$('#age small').textContent=(seasonsOn()?SEAS[seasonIx()]+(nightF()>.3?' night':'')+' · ':'')+Math.floor(t/60)+':'+String(t%60).padStart(2,'0')+pc;
 const idle=units.filter(u=>u.o===0&&ud(u).tag==='vil'&&!u.task&&!u.gar).length;const bi=$('#bIdle .badge');bi.textContent=idle||'';
 const army=units.filter(u=>u.o===0&&isMil(u)).length;const ba=$('#bArmy .badge');ba.textContent=army||'';ba.style.background=army?'#3f6ea8':''}

/* ---------- phone controls: groups, quick select, alerts, speed ---------- */
function longPress(el,onTap,onLong){let t=0,fired=false;el.addEventListener('pointerdown',e=>{fired=false;clearTimeout(t);t=setTimeout(()=>{fired=true;onLong();if(navigator.vibrate)try{navigator.vibrate(15)}catch(_){}},480)});
 const end=()=>clearTimeout(t);el.addEventListener('pointerup',end);el.addEventListener('pointerleave',end);el.addEventListener('pointercancel',end);
 el.addEventListener('click',e=>{e.preventDefault();if(fired){fired=false;return}onTap()})}
function groupIds(g){if(!S.groups)S.groups=[[],[],[]];const ids=S.groups[g].filter(id=>{const e=ents.get(id);return e&&!e.dead&&e.o===0&&!e.gar});S.groups[g]=ids;return ids}
function saveGroup(g){if(!sel.length){toast('Select some units first, then hold a group button to save them');return}if(!S.groups)S.groups=[[],[],[]];S.groups[g]=sel.filter(id=>{const e=ents.get(id);return e&&e.k==='u'&&e.o===0});toast(`Group ${g+1} saved (${S.groups[g].length})`,'good');updGroups()}
function tapGroup(g){const ids=groupIds(g);if(!ids.length){if(sel.length)saveGroup(g);else toast(`Group ${g+1} is empty. Select units, then hold this button to save them.`);return}
 const same=ids.length===sel.length&&ids.every(id=>sel.includes(id));sel=ids.slice();panelDirty=true;lastSig='';
 if(same){let x=0,y=0;for(const id of ids){const e=ents.get(id);x+=e.x;y+=e.y}centerOn(x/ids.length,y/ids.length)}}
function updGroups(){if(!S)return;for(let g=0;g<3;g++){const b=document.querySelector(`#groups [data-g="${g}"] .badge`);if(b){const n=groupIds(g).length;b.textContent=n||'';}}}
document.querySelectorAll('#groups [data-g]').forEach(b=>{const g=+b.dataset.g;longPress(b,()=>tapGroup(g),()=>saveGroup(g))});
function selectAllIdle(){const idle=units.filter(u=>u.o===0&&ud(u).tag==='vil'&&!u.task&&!u.gar);if(!idle.length){toast('No idle villagers');return}sel=idle.map(u=>u.id);panelDirty=true;lastSig='';toast(`${idle.length} idle villager${idle.length>1?'s':''} selected`)}
{const b=$('#bIdle');b.onclick=null;longPress(b,nextIdle,selectAllIdle)}
{const b=$('#bArmy');const tapA=b.onclick;b.onclick=null;longPress(b,()=>tapA&&tapA.call(b),()=>{const a=units.filter(u=>u.o===0&&isMil(u)&&!u.gar&&!u.task);if(!a.length){toast('No idle soldiers');return}sel=a.map(u=>u.id);panelDirty=true;lastSig='';toast(`${a.length} idle soldier${a.length>1?'s':''} selected`)})}
/* attack alert button */
let lastAtk=null;
function noteAttack(c){lastAtk={x:c.x,y:c.y,t:S.t}}
$('#alertBtn').onclick=()=>{if(lastAtk)centerOn(lastAtk.x,lastAtk.y)};
function updAlert(){const on=!!(lastAtk&&S&&S.t-lastAtk.t<20);const b=$('#alertBtn');if(b.hidden===on)b.hidden=!on}
/* speed and pause */
const SPEEDS=[1,1.5,2,3];
function setSpeedLbl(){$('#spdBtn').textContent=(S?S.speed:1.5)+'×';$('#pauseBtn').classList.toggle('on',paused&&$('#pause').hidden);$('#pausedBar').hidden=!(paused&&$('#pause').hidden&&running)}
$('#spdBtn').onclick=()=>{const i=SPEEDS.indexOf(S.speed);S.speed=SPEEDS[(i+1)%SPEEDS.length];setSpeedLbl();if(typeof setSpeedUI==='function')setSpeedUI();toast('Speed '+S.speed+'×')};
$('#pauseBtn').onclick=()=>{paused=!paused;setSpeedLbl()};
$('#pausedBar').onclick=()=>{paused=false;setSpeedLbl()};

/* ---------- victory modes: king of the hill, regicide, last castle ---------- */
const VMODES={conquest:'Conquest',wonder:'Wonder',hill:'King of the Hill',regicide:'Regicide',castle:'Last Castle'};
const vmode=()=>(S&&S.vmode)||'conquest';
function freeRect(x,y,w,h){if(x<1||y<1||x+w>=W-1||y+h>=H-1)return false;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=yy*W+xx;if(block[i]||occ[i]||ter[i]===1||ter[i]===4)return false}return true}
function clearRect(cx,cy,r){for(let y=Math.max(1,cy-r);y<=Math.min(H-2,cy+r);y++)for(let x=Math.max(1,cx-r);x<=Math.min(W-2,cx+r);x++){const i=y*W+x;if(resT[i]&&resT[i]!==5&&Math.hypot(x-cx,y-cy)<=r)clearRes(i)}}
function setupMode(starts){const m=vmode();
 if(m==='castle'){for(const tc of blds.filter(b=>b.type==='tc')){let done=false;for(let r=5;r<14&&!done;r++)for(let k=0;k<24&&!done;k++){const a=k/24*6.283;const x=Math.round(tc.x+2+Math.cos(a)*r-2),y=Math.round(tc.y+2+Math.sin(a)*r-2);if(freeRect(x-1,y-1,6,6)){mkBld('castle',tc.o,x,y,true);done=true}}
  if(!done){clearRect(tc.x+8,tc.y+2,4);if(freeRect(tc.x+6,tc.y,4,4))mkBld('castle',tc.o,tc.x+6,tc.y,true)}}}
 if(m==='regicide'){for(const tc of blds.filter(b=>b.type==='tc')){const p=freeAround(tc);const k=mkUnit('king',tc.o,p.x,p.y);k.hp=uMaxHp(k);P[tc.o].king=k.id}}
 if(m==='hill'){const C=W/2;let best=null;for(let r=0;r<W/3&&!best;r++)for(let k=0;k<Math.max(1,r*8)&&!best;k++){const a=k/Math.max(1,r*8)*6.283;const x=Math.round(C+Math.cos(a)*r),y=Math.round(C+Math.sin(a)*r);if(x>3&&y>3&&x<W-4&&y<H-4&&ter[y*W+x]!==1&&ter[y*W+x]!==4)best=[x,y]}
  if(best){clearRect(best[0],best[1],4);for(let y=best[1]-3;y<=best[1]+3;y++)for(let x=best[0]-3;x<=best[0]+3;x++)if(ter[y*W+x]===4)ter[y*W+x]=0;S.hill={x:best[0]+.5,y:best[1]+.5,o:-1,t:0}}}
 placeRelics(starts)}
function hillTick(){const h=S.hill;if(!h)return;const cnt=new Array(P.length).fill(0);for(const u of units){if(u.gar||!isMil(u)&&ud(u).tag!=='kng')continue;if(Math.hypot(u.x-h.x,u.y-h.y)<5)cnt[u.o]++}
 const here=cnt.map((c,i)=>c?i:-1).filter(i=>i>=0);const tms=[...new Set(here.map(i=>P[i].team??i))];if(tms.length===1){const o=here.includes(0)?0:here[0];const same=h.o>=0&&(P[h.o].team??h.o)===(P[o].team??o);if(!same){h.o=o;h.t=0;if(myTeam(o))toast(o===0?'You hold the hill! Keep it for 5 minutes.':'Your ally holds the hill!','good');else toast(P[o].civN+' took the hill!','bad',{x:h.x,y:h.y})}else h.t+=1}
 h.contested=tms.length>1;if(h.o>=0&&h.t>=300&&P[h.o].alive)endGame(myTeam(h.o),myTeam(h.o)?'You held the hill for five minutes. The crown is yours.':P[h.o].civN+' held the hill for five minutes.')}
function modeDefeat(p){const m=vmode();if(m==='castle'&&S.t>3)return !blds.some(b=>b.o===p.i&&b.type==='castle');if(m==='regicide'&&p.king)return !ents.has(p.king);return false}
function aiMode(p,army,home){const m=vmode(),ai=p.ai;
 if(m==='hill'&&S.hill&&!peace()&&ai.t%5===0){const h=S.hill;if(h.o!==p.i||h.contested){const idle=army.filter(u=>!ai.waves.has(u.id)&&!(ai.raid||[]).includes(u.id)&&(!u.task||u.task.auto)&&ud(u).tag!=='sie');if(idle.length>=4+ai.diff*2)for(const u of idle){u.task={k:'amove',x:h.x+(Math.random()-.5)*5,y:h.y+(Math.random()-.5)*5};u.path=null}}}
 if(m==='regicide'&&p.king){const k=ents.get(p.king);if(k&&!k.gar){let near=false;for(const e of units)if(isEnemy(p.i,e.o)&&isMil(e)&&Math.hypot(e.x-k.x,e.y-k.y)<9){near=true;break}
   if(near){const tc=blds.find(b=>b.o===p.i&&(b.type==='castle'||b.type==='tc')&&b.built>=1&&b.gar.length<(B[b.type].gar||0));if(tc&&(!k.task||k.task.k!=='gar'))k.task={k:'gar',id:tc.id}}
   else if(!k.task&&Math.hypot(k.x-home.x,k.y-home.y)>6){k.task={k:'move',x:home.x+2,y:home.y+2};k.path=null}}}
 if(ai.t%5===0){const free=(S.relics||[]).filter(r=>!r.t&&!r.c);if(free.length&&blds.some(b=>b.o===p.i&&b.type==='temple'&&b.built>=1))for(const mk of units){if(mk.o!==p.i||mk.type!=='monk'||mk.gar||mk.task&&mk.task.k==='relic')continue;
   const mn=units.filter(u=>u.o===p.i&&u.type==='monk').length;const tp=blds.find(b=>b.o===p.i&&b.type==='temple'&&b.built>=1&&!b.queue.length);if(mn<2&&tp&&afford(p,U.monk.cost)&&unitOk(p,'monk',tp)){pay(p,U.monk.cost);tp.queue.push({u:'monk',p:0})}
   let br=null,bd=70;for(const r of free){if((S.relics||[]).some(q=>q!==r&&q.claim===mk.id))continue;const d=Math.hypot(r.x-mk.x,r.y-mk.y);if(d<bd){bd=d;br=r}}if(br){mk.task={k:'relic',rid:br.id};mk.path=null;br.claim=mk.id;break}}}}
/* relics */
function placeRelics(starts){S.relics=[];const n={s:4,m:6,l:8}[S.size]||6;let id=1;for(let g=0;g<4000&&S.relics.length<n;g++){const x=2+Math.floor(Math.random()*(W-4)),y=2+Math.floor(Math.random()*(H-4));const i=y*W+x;
 if(ter[i]===1||ter[i]===4||block[i]||occ[i])continue;if(starts.some(s=>Math.hypot(s[0]+2-x,s[1]+2-y)<18))continue;if(S.relics.some(r=>Math.hypot(r.x-x,r.y-y)<14))continue;if(S.hill&&Math.hypot(S.hill.x-x,S.hill.y-y)<6)continue;S.relics.push({id:id++,x:x+.5,y:y+.5,c:0,t:0})}}
function relicAt(w){for(const r of S.relics||[]){if(r.c||r.t)continue;if(Math.hypot(r.x-w.x,r.y-w.y)<.9)return r}return null}
function dropRelic(r,x,y){r.c=0;r.t=0;r.claim=0;const sp=spotsNear({x,y},1,0)[0]||{x,y};r.x=sp.x;r.y=sp.y}
function relicTick(){if(!S.relics)return;for(const r of S.relics){if(r.c&&!ents.has(r.c)){const u=r.lastPos||{x:r.x,y:r.y};dropRelic(r,u.x,u.y)}if(r.c){const u=ents.get(r.c);if(u){r.lastPos={x:u.x,y:u.y};r.x=u.x;r.y=u.y}}
 if(r.t){const b=ents.get(r.t);if(!b||b.dead){dropRelic(r,r.x,r.y);continue}P[b.o].res.gold+=.5;P[b.o].st.gath+=.5}}}
function doRelic(u,t,dt){const r=(S.relics||[]).find(q=>q.id===t.rid);if(!r||r.t){u.task=null;return}
 if(!r.c){if(Math.hypot(r.x-u.x,r.y-u.y)<.8){r.c=u.id;r.claim=0;u.path=null;if(u.o===0)toast('Relic picked up. Take it to a monastery.','good')}else{if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.4;goPoint(u,r.x,r.y);if(!u.path.length&&u.partial){u.task=null;return}}step(u,dt);return}}
 if(r.c!==u.id){u.task=null;return}let tb=null,bd=1e9;for(const b of blds){if(b.o!==u.o||b.type!=='temple'||b.built<1)continue;const d=rectDist(u.x,u.y,b.x,b.y,b.w,b.h);if(d<bd){bd=d;tb=b}}
 if(!tb){return}if(bd<=.9){r.c=0;r.t=tb.id;const c=ec(tb);r.x=c.x;r.y=c.y;u.task=null;u.path=null;if(u.o===0){toast('Relic stored in the monastery: +30 gold per minute.','good');sfx('ready')}return}
 if(!u.path||!u.path.length){if(u.rp>0||pathBusy(u))return;u.rp=.5;pathRect(u,tb.x,tb.y,tb.x+tb.w-1,tb.y+tb.h-1,true)}step(u,dt)}
let relicSp=null;
function mkRelicSp(){const c=document.createElement('canvas');c.width=60;c.height=60;const g=c.getContext('2d');g.scale(3,3);g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(10,16,8,2.6,0,0,7);g.fill();
 g.fillStyle='#8a5a20';g.fillRect(4,8,12,8);g.fillStyle='#e8c15a';g.fillRect(4,6,12,3);g.fillRect(4,8,1.5,8);g.fillRect(14.5,8,1.5,8);g.fillStyle='#fff6c8';g.fillRect(9,9,2,5.5);g.fillRect(7.5,10.5,5,1.8);g.strokeStyle='#3a2410';g.lineWidth=.6;g.strokeRect(4,6,12,10);return c}
function RELICS(cull){if(!S.relics)return;if(!relicSp)relicSp=mkRelicSp();const t=performance.now()/1000;for(const r of S.relics){if(r.t)continue;const i=(r.y|0)*W+(r.x|0);if(!r.c&&!explored[i]&&running)continue;let rx=r.x,ry=r.y;if(r.c){const u=ents.get(r.c);if(!u||(u.o!==0&&!vis[i]))continue;rx=u.x;ry=u.y}
  const p=PJ(rx,ry,r.c?34:0);if(!cull(p[0],p[1],40))continue;ctx.globalAlpha=.35+.2*Math.sin(t*3+r.id);ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.ellipse(p[0],p[1]-6,13,8,0,0,7);ctx.fill();ctx.globalAlpha=1;ctx.drawImage(relicSp,p[0]-10,p[1]-17,20,20)}}
function HILL(cull){const h=S.hill;if(!h)return;const c=PJ(h.x,h.y,0);if(!cull(c[0],c[1],120))return;ctx.save();ctx.setLineDash([7,5]);ctx.lineWidth=2.2;ctx.strokeStyle=h.o>=0?PCOL[h.o]:'#e8dcc0';ctx.globalAlpha=.85;ctx.beginPath();ctx.ellipse(c[0],c[1],5*HW*1.41,5*HH*1.41,0,0,7);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 ctx.fillStyle='#8a857a';ctx.strokeStyle='#2a241c';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(c[0]-9,c[1]);ctx.lineTo(c[0]-5,c[1]-62);ctx.lineTo(c[0],c[1]-70);ctx.lineTo(c[0]+5,c[1]-62);ctx.lineTo(c[0]+9,c[1]);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#a8a296';ctx.beginPath();ctx.moveTo(c[0]-9,c[1]);ctx.lineTo(c[0]-5,c[1]-62);ctx.lineTo(c[0],c[1]-70);ctx.lineTo(c[0],c[1]+2);ctx.closePath();ctx.fill();
 ctx.fillStyle='#6a5a48';ctx.fillRect(c[0]-14,c[1]-3,28,6);const fp=[c[0],c[1]-70];ctx.strokeStyle='#2a1c10';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(fp[0],fp[1]);ctx.lineTo(fp[0],fp[1]-22);ctx.stroke();
 ctx.fillStyle=h.o>=0?PCOL[h.o]:'#e8dcc0';ctx.beginPath();ctx.moveTo(fp[0],fp[1]-22);ctx.quadraticCurveTo(fp[0]+9,fp[1]-20+Math.sin(performance.now()/200)*2,fp[0]+16,fp[1]-17);ctx.lineTo(fp[0],fp[1]-12);ctx.fill();
 if(h.o>=0){const left=Math.max(0,300-h.t);ctx.fillStyle='rgba(20,14,8,.85)';ctx.fillRect(c[0]-26,c[1]-112,52,16);ctx.fillStyle=PCOL[h.o];ctx.font='800 11px Alegreya Sans,sans-serif';ctx.textAlign='center';ctx.fillText(Math.floor(left/60)+':'+String(Math.floor(left%60)).padStart(2,'0')+(h.contested?' ⚔':''),c[0],c[1]-100)}ctx.restore()}
/* history for the end-of-game graph */
function histTick(){if(!S.hist)S.hist=[];S.hist.push(P.map(p=>{let a=0,v=0;for(const u of units)if(u.o===p.i){if(ud(u).tag==='vil')v++;else if(isMil(u))a++}return[a,v,blds.filter(b=>b.o===p.i&&!B[b.type].wall).length,Math.floor(p.st.gath)]}))}
let chartK=0;
function drawChart(){const cv=$('#endChart');if(!cv||!S||!S.hist||S.hist.length<2){if(cv)cv.hidden=true;return}cv.hidden=false;const dpr=Math.min(2,devicePixelRatio||1),w=cv.clientWidth||320,h=150;cv.width=w*dpr;cv.height=h*dpr;const g=cv.getContext('2d');g.scale(dpr,dpr);
 const H0=S.hist,n=H0.length;let mx=1;for(const row of H0)for(const v of row)mx=Math.max(mx,v[chartK]);g.fillStyle='#0006';g.fillRect(0,0,w,h);g.strokeStyle='#ffffff18';g.lineWidth=1;for(let k=1;k<4;k++){g.beginPath();g.moveTo(0,h*k/4);g.lineTo(w,h*k/4);g.stroke()}
 for(let o=0;o<P.length;o++){g.strokeStyle=PCOL[o];g.lineWidth=o===0?2.6:1.8;g.beginPath();H0.forEach((row,i)=>{const v=row[o]?row[o][chartK]:0;const x=6+(w-12)*i/(n-1),y=h-8-(h-20)*v/mx;i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke()}
 g.fillStyle='#e8dcc0';g.font='700 11px Alegreya Sans,sans-serif';g.fillText('max '+mx,6,13);g.textAlign='right';g.fillText(Math.floor(S.t/60)+' min',w-6,h-3);document.querySelectorAll('#chartTabs [data-k]').forEach(b=>b.classList.toggle('on',+b.dataset.k===chartK))}
document.querySelectorAll('#chartTabs [data-k]').forEach(b=>b.onclick=()=>{chartK=+b.dataset.k;drawChart()});
/* achievements */
const ACH=[['win','First Crown','Win a game.'],['hard','Iron Crown','Win on Hard.'],['three','Against All Odds','Win against 3 rivals.'],['untouch','Untouchable','Win without losing a single building.'],['quick','Swift Conquest','Win in under 25 minutes.'],
 ['kingdom','Long Live the Kingdom','Reach the Kingdom phase.'],['wonder','Wonder of the World','Finish building a Wonder.'],['relic3','Keeper of Relics','Hold 3 relics in your monasteries at once.'],['army100','Grand Army','Have 100 soldiers at once.'],
 ['walls50','Master Mason','Build 50 pieces of wall in one game.'],['hill','King of the Hill','Win a King of the Hill game.'],['regicide','God Save the King','Win a Regicide game.'],['castle','Last Castle Standing','Win a Last Castle game.'],['seasons','Through the Winter','Play through a full year of seasons.'],['tut','Squire','Finish the tutorial.']];
let achD={};try{achD=JSON.parse(localStorage.getItem('boc-ach')||'{}')}catch(e){}
function unlock(k){if(achD[k])return;achD[k]=Date.now();try{localStorage.setItem('boc-ach',JSON.stringify(achD))}catch(e){}const a=ACH.find(x=>x[0]===k);if(a){toast('🏆 Achievement: '+a[1],'good');sfx('ready')}}
function achTick(){if(!S||!running||S.demo)return;const p=P[0];if(p.phase>=3)unlock('kingdom');if(blds.some(b=>b.o===0&&b.type==='wonder'&&b.built>=1))unlock('wonder');
 if((S.relics||[]).filter(r=>{const b=r.t&&ents.get(r.t);return b&&b.o===0}).length>=3)unlock('relic3');if(units.filter(u=>u.o===0&&isMil(u)).length>=100)unlock('army100');if((p.st.walls||0)>=50)unlock('walls50');if(seasonsOn()&&S.t>=SEAS_LEN*4)unlock('seasons')}
function achEnd(win){if(!win||S.demo||S.tut)return;unlock('win');if(S.diff===2)unlock('hard');if((S.rivals||P.length-1)>=3)unlock('three');if(!(P[0].st.blost))unlock('untouch');if(S.t<25*60)unlock('quick');const m=vmode();if(m==='hill'||m==='regicide'||m==='castle')unlock(m)}
function showAch(){const n=ACH.filter(a=>achD[a[0]]).length;$('#achList').innerHTML=`<p class="sub">${n} of ${ACH.length} earned</p>`+ACH.map(a=>`<div class="ach ${achD[a[0]]?'got':''}"><b>${achD[a[0]]?'🏆':'🔒'} ${a[1]}</b><span>${a[2]}</span></div>`).join('');$('#achScr').hidden=false}
$('#achBtn').onclick=showAch;$('#achClose').onclick=()=>{$('#achScr').hidden=true};

/* ---------- allies: help, gifts and requests ---------- */
function aiAlly(p,army,home){const ai=p.ai;if(peace())return;
 const free=()=>army.filter(u=>!ai.waves.has(u.id)&&!(ai.raid||[]).includes(u.id)&&ud(u).tag!=='sie'&&(!u.task||u.task.auto||u.task.k==='move'));
 if(typeof lastAtk!=='undefined'&&lastAtk&&S.t-lastAtk.t<12&&ai.t>=(ai.helpT||0)){const fs=free();if(fs.length>=3){ai.helpT=ai.t+25;for(const u of fs){u.task={k:'amove',x:lastAtk.x+(Math.random()-.5)*4,y:lastAtk.y+(Math.random()-.5)*4};u.path=null}if(ai.t>=(ai.sayT||0)){ai.sayT=ai.t+60;toast(p.civN+': we are coming to help!','good',{x:lastAtk.x,y:lastAtk.y})}}}
 const rq=ai.req;if(rq&&ai.t<rq.until){if(!rq.sent){rq.sent=1;const fs=army.filter(u=>ud(u).tag!=='kng'&&!u.gar);for(const u of fs){u.task={k:'amove',x:rq.x+(Math.random()-.5)*5,y:rq.y+(Math.random()-.5)*5};u.path=null;ai.waves.add(u.id)}ai.waveN=ai.waves.size}}
 if(ai.t%60===0){const me=P[0];for(const r of R4){if(me.res[r]<80&&p.res[r]>600){const n=150;p.res[r]-=n;me.res[r]+=n;toast(`${p.civN} sent you ${n} ${r}.`,'good');break}}}}
function allyList(){return P.filter(p=>p.i&&myTeam(p.i)&&p.alive)}
function showAllies(){const al=allyList();if(!al.length){toast('You have no allies in this game.');return}
 $('#allyList').innerHTML=al.map(p=>`<div class="ach got"><b><i class="sw" style="background:${PCOL[p.i]}"></i>${p.civN}</b><span>Food ${Math.floor(p.res.food)} · Wood ${Math.floor(p.res.wood)} · Stone ${Math.floor(p.res.stone)} · Gold ${Math.floor(p.res.gold)}</span>
  <div class="row wrap">${R4.map(r=>`<button class="seg1" data-gift="${p.i}:${r}">Send 100 ${r}</button>`).join('')}</div>
  <div class="row"><button class="seg1 on" data-req="${p.i}:attack">Attack where I'm looking</button><button class="seg1 on" data-req="${p.i}:defend">Defend my town</button></div></div>`).join('');
 $('#allyList').querySelectorAll('[data-gift]').forEach(b=>b.onclick=()=>{const [i,r]=b.dataset.gift.split(':');const me=P[0];if(me.res[r]<100){toast('Not enough '+r,'bad');return}me.res[r]-=100;P[+i].res[r]+=100;sfx('click');showAllies()});
 $('#allyList').querySelectorAll('[data-req]').forEach(b=>b.onclick=()=>{const [i,k]=b.dataset.req.split(':');const p=P[+i];let x,y;
  if(k==='defend'){const tc=blds.find(q=>q.o===0&&(q.type==='tc'||q.type==='castle'));if(!tc){toast('You have no town to defend','bad');return}x=tc.x+tc.w/2;y=tc.y+tc.h/2}
  else{const c=toWorld(VW/2,VH/2);let best=null,bd=40;for(const q of blds){if(!isEnemy(0,q.o)||!explored[q.y*W+q.x])continue;const d=Math.hypot(q.x-c.x,q.y-c.y);if(d<bd){bd=d;best=q}}if(best){x=best.x+best.w/2;y=best.y+best.h/2}else{x=c.x;y=c.y}}
  p.ai.req={k,x,y,until:p.ai.t+120,sent:0};$('#allyScr').hidden=true;toast(`${p.civN}: ${k==='defend'?'marching to your town':'attacking'}!`,'good',{x,y});sfx('ackS')})}
$('#allyBtn').onclick=()=>{paused=true;showAllies();$('#allyScr').hidden=false};$('#allyClose').onclick=()=>{$('#allyScr').hidden=true;paused=false};

/* ---------- optional tutorial and scenario missions ---------- */
let missDone={};try{missDone=JSON.parse(localStorage.getItem('boc-missions')||'{}')}catch(e){}
function objBar(txt,sub){const b=$('#tutBar');if(!txt){b.hidden=true;return}b.hidden=false;$('#tutTxt').innerHTML=txt;$('#tutSub').textContent=sub||''}
const fmt=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function launch(o,after){$('#title').hidden=true;$('#end').hidden=true;$('#missScr').hidden=true;$('#loading').hidden=false;setTimeout(()=>{newGame(o,false);after();$('#loading').hidden=true;beginPlay();storyTick(true)},30)}
/* tutorial */
const TUT=[
 ['Welcome! Drag with one finger to look around, and pinch to zoom.','Move the view a little to continue.',s=>Math.hypot(cam.x-s.cx,cam.y-s.cy)>60||cam.z!==s.cz],
 ['Tap one of your <b>villagers</b> (the people in plain clothes) to select them.','',()=>sel.some(id=>{const e=ents.get(id);return e&&e.k==='u'&&ud(e).tag==='vil'})],
 ['Now tap the <b>red berry bushes</b> near your town center. Villagers gather food and carry it home.','',()=>units.some(u=>u.o===0&&u.task&&u.task.k==='gather'&&u.task.rt==='food')],
 ['Select another villager and tap a <b>tree</b> to chop wood.','',()=>units.some(u=>u.o===0&&u.task&&u.task.k==='gather'&&u.task.rt==='wood')],
 ['Tap your <b>Town Center</b> (the big building) and press <b>Villager</b> to train a new one.','More villagers means a faster economy.',()=>blds.some(b=>b.o===0&&b.type==='tc'&&b.queue.some(q=>q.u==='villager'))||P[0].st.trained>0],
 ['Select a villager, open <b>Economy</b> and build a <b>House</b>. Tap the ground, then press Place.','Houses raise your population limit.',()=>blds.some(b=>b.o===0&&b.type==='house')],
 ['Build a <b>Farmstead</b>, then a <b>Field</b> next to it.','Fields never run out, and a nearby farmstead makes them 15% better.',()=>blds.some(b=>b.o===0&&b.type==='field')],
 ['Open <b>Military</b> and build a <b>Barracks</b>.','',()=>blds.some(b=>b.o===0&&b.type==='barracks')],
 ['Tap the <b>sword button</b> on the left to select your army, then tap <b>Patrol</b> or <b>Attack-move</b> and tap the map.','Hold the sword button to pick only idle soldiers.',()=>units.some(u=>u.o===0&&u.task&&(u.task.k==='patrol'||u.task.k==='amove'))],
 ['With soldiers selected, <b>hold the 1 button</b> under the minimap to save them as group 1. Tap 1 later to select them again.','',()=>S.groups&&S.groups[0]&&S.groups[0].length>0],
 ['Pick a <b>wall</b> or <b>palisade</b> in the Defense tab and <b>drag</b> along the ground to lay it.','Lift your finger and your villagers build it.',()=>blds.some(b=>b.o===0&&B[b.type].wall)],
 ['That\'s the basics! Grow to 5 buildings and research the <b>Town Phase</b> at your town center to unlock more.','Tap the Under attack button whenever it shows. The tutorial is done — keep playing or quit from the menu.',()=>false]];
function startTutorial(){launch({civ:SETUP.civ,map:'mainland',size:'s',rivals:1,diff:0,peace:30,vmode:'conquest',res:'std',pop:200,color:SETUP.color,roof:SETUP.roof,seasons:0,tut:1},()=>{S.tut={i:0,cx:cam.x,cy:cam.y,cz:cam.z};S.tut.t0=0})}
/* missions */
const MISS=[
 {id:'hold',n:'Hold the Castle',d:'Your castle stands alone on the frontier. Waves of raiders, then rams and trebuchets, will come for 15 minutes. Train troops, man the walls and keep the castle standing.',start(){launch({civ:SETUP.civ,map:'highlands',size:'s',rivals:1,diff:1,peace:0,vmode:'conquest',res:'high',pop:200,color:SETUP.color,roof:SETUP.roof,seasons:1},()=>{
   const foe=P[1];foe.ai=null;for(const u of units.slice())if(u.o===1)kill(u,null,true);for(const b of blds.slice())if(b.o===1)kill(b,null,true);foe.alive=true;
   const p=P[0];p.phase=1;recomputeMods(p);const tc=blds.find(b=>b.o===0&&b.type==='tc');fortressWalls(tc);S.vmode='castle';setupMode([[tc.x,tc.y]]);S.vmode='conquest';
   const cs=blds.find(b=>b.o===0&&b.type==='castle');for(let k=0;k<12;k++){const q=freeAround(cs||tc);mkUnit(k<6?'archer':'spear',0,q.x,q.y)}
   S.mission={id:'hold',end:15*60,wave:0,next:70,castle:cs?cs.id:0}})},
  tick(){const m=S.mission;const cs=ents.get(m.castle);if(!cs){endGame(false,'The castle has fallen.');return true}if(S.t>=m.end){missionWin('The raiders are broken. The frontier is safe.');return true}
   if(S.t>=m.next){m.wave++;m.next=S.t+Math.max(40,75-m.wave*3);spawnWave(m.wave,cs)}objBar(`<b>Hold the Castle</b> · ${fmt(m.end-S.t)} left`,`Wave ${m.wave} · next in ${fmt(m.next-S.t)}`);return true}},
 {id:'rebuild',n:'Rebuild the Village',d:'Raiders burned your village. With little left, grow back to 25 villagers and 8 houses and reach the Town Phase within 25 minutes.',start(){launch({civ:SETUP.civ,map:'mainland',size:'s',rivals:1,diff:0,peace:8,vmode:'conquest',res:'low',pop:200,color:SETUP.color,roof:SETUP.roof,seasons:1},()=>{
   const p=P[0];const tc=blds.find(b=>b.o===0&&b.type==='tc');tc.hp=bMaxHp(tc)*.45;p.res.food=120;p.res.wood=80;let n=0;for(const u of units.slice())if(u.o===0&&ud(u).tag==='vil'&&++n>3)kill(u,null,true);
   for(let k=0;k<6;k++){const a=k/6*6.28;rubble.push({x:Math.round(tc.x+2+Math.cos(a)*7),y:Math.round(tc.y+2+Math.sin(a)*7),w:2,h:2,t:0})}S.mission={id:'rebuild',end:25*60}})},
  tick(){const m=S.mission,p=P[0];if(!blds.some(b=>b.o===0&&b.type==='tc')){endGame(false,'The town center fell.');return true}
   const v=units.filter(u=>u.o===0&&ud(u).tag==='vil').length,h=blds.filter(b=>b.o===0&&b.type==='house'&&b.built>=1).length;if(v>=25&&h>=8&&p.phase>=1){missionWin('The village lives again.');return true}
   if(S.t>=m.end){endGame(false,'Time ran out before the village recovered.');return true}const ck=(ok,t)=>(ok?'✅ ':'▫️ ')+t;
   objBar(`<b>Rebuild</b> · ${fmt(m.end-S.t)} left`,`${ck(v>=25,'Villagers '+v+'/25')}  ${ck(h>=8,'Houses '+h+'/8')}  ${ck(p.phase>=1,'Town Phase')}`);return false}},
 {id:'canyon',n:'Siege of the Red Canyon',d:'A Defender lord has walled himself in at the far end of the canyon. You start in the Town Phase with siege rams. Tear his walls down.',start(){launch({civ:SETUP.civ,map:'canyon',size:'s',rivals:1,diff:2,peace:0,vmode:'conquest',res:'high',pop:200,color:SETUP.color,roof:SETUP.roof,seasons:1},()=>{
   const foe=P[1];foe.ai.pers='turtle';foe.phase=1;recomputeMods(foe);const ftc=blds.find(b=>b.o===1&&b.type==='tc');fortressWalls(ftc);
   const p=P[0];p.phase=1;recomputeMods(p);const tc=blds.find(b=>b.o===0&&b.type==='tc');for(let k=0;k<3;k++){const q=freeAround(tc);mkUnit('ram',0,q.x,q.y)}for(let k=0;k<6;k++){const q=freeAround(tc);mkUnit('militia',0,q.x,q.y)}
   S.mission={id:'canyon'}})},
  tick(){objBar('<b>Siege of the Red Canyon</b>','Destroy the walled town at the far end of the canyon. Rams break walls and gates.');return false}}];
function missionWin(msg){const m=S.mission;missDone[m.id]=1;try{localStorage.setItem('boc-missions',JSON.stringify(missDone))}catch(e){}endGame(true,msg)}
function spawnWave(n,cs){const c=ec(cs);let sx=0,sy=0,bd=-1;for(let k=0;k<12;k++){const a=Math.random()*6.283;const x=clamp(Math.round(c.x+Math.cos(a)*W*.45),2,W-3),y=clamp(Math.round(c.y+Math.sin(a)*W*.45),2,H-3);const d=Math.hypot(x-c.x,y-c.y);if(passXY(x,y,1,0)&&d>bd){bd=d;sx=x;sy=y}}
 const count=4+Math.round(n*2.5),pool=n<3?['militia','spear','archer']:n<6?['militia','spear','archer','scout','xbow']:['champ','knight','xbow','archer','spear'];
 for(let k=0;k<count;k++){const sp=spotsNear({x:sx+.5,y:sy+.5},count,0)[k]||{x:sx+.5,y:sy+.5};const u=mkUnit(pool[k%pool.length],1,sp.x,sp.y);u.hp=uMaxHp(u);u.task={k:'amove',x:c.x,y:c.y}}
 if(n>=4){const nr=n>=9?3:n>=6?2:1;const sps=spotsNear({x:sx+.5,y:sy+.5},nr,0);for(const sp of sps){const r=mkUnit(n>=9?'treb':'ram',1,sp.x,sp.y);r.hp=uMaxHp(r);r.task={k:'atk',id:cs.id}}}
 toast(`Wave ${n}: ${count} raiders are coming!`,'bad',{x:sx,y:sy});sfx('horn')}
/* called each second; returns true when the mission handles win and loss itself */
function storyTick(force){if(!S||(!running&&!force))return false;if(S.mission){const M=MISS.find(m=>m.id===S.mission.id);return M?M.tick():false}
 if(S.tut){const st=TUT[S.tut.i];if(!st){objBar(null);return false}if(st[2](S.tut)){S.tut.i++;sfx('ready');if(S.tut.i===TUT.length-1)unlock('tut');S.tut.cx=cam.x;S.tut.cy=cam.y;S.tut.cz=cam.z}const cur=TUT[S.tut.i];if(cur)objBar(`<b>Tutorial ${S.tut.i+1}/${TUT.length}</b> · ${cur[0]}`,cur[1]);return false}
 objBar(null);return false}
$('#tutSkip').onclick=()=>{if(S&&S.tut){S.tut=null;objBar(null);toast('Tutorial closed. Have fun!')}else if(S&&S.mission){$('#tutBar').classList.toggle('mini')}};
function showMissions(){$('#missList').innerHTML=MISS.map((m,i)=>`<div class="ach ${missDone[m.id]?'got':''}"><b>${missDone[m.id]?'✅':'⚔'} ${m.n}</b><span>${m.d}</span><button class="big" data-mi="${i}" style="margin-top:6px">Play</button></div>`).join('');$('#missScr').hidden=false;
 $('#missList').querySelectorAll('[data-mi]').forEach(b=>b.onclick=()=>MISS[+b.dataset.mi].start())}
$('#missBtn').onclick=showMissions;$('#missClose').onclick=()=>{$('#missScr').hidden=true};$('#tutBtn').onclick=startTutorial;

/* ---------- game setup ---------- */
const STARTRES={low:{food:200,wood:200,stone:100,gold:100},std:{food:300,wood:300,stone:200,gold:200},high:{food:1000,wood:1000,stone:1000,gold:1000}};
function newPlayer(i,civ,rl){const p={i,civ,civN:CIVS[civ].n,style:CIVS[civ].style,res:Object.assign({},STARTRES[rl]||STARTRES.std),phase:0,techs:[],m:null,pop:0,popCap:0,ai:null,bell:false,hero:0,alive:true,barter:{food:100,wood:100,stone:100},st:{trained:0,kills:0,lost:0,razed:0,gath:0,captured:0}};recomputeMods(p);return p}
function newGame(o,demo){const seed=(Math.random()*1e9)|0;units=[];blds=[];animals=[];ents=new Map();projs=[];fx=[];rubble=[];sel=[];placing=null;cmdMode=null;pings=[];uC.clear();lastSig='';
 applyColors(o);const nAl=demo?0:Math.min(2,o.allies||0);const nRv=Math.max(1,Math.min(3-nAl,o.rivals||1));const np=1+nAl+nRv;S={t:0,tick:0,nid:1,seed,speed:1.5,diff:o.diff,peace:(o.peace||0)*60,vmode:demo?'conquest':(o.vmode||(o.wonder?'wonder':'conquest')),demo:!!demo,hist:[],tut:!!o.tut,popMax:o.pop||200,size:o.size,opts:o};
 const civs=[o.civ];const pool=CKEYS.filter(k=>k!==o.civ);for(let i=1;i<np;i++)civs.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
 P=civs.map((c,i)=>newPlayer(i,c,o.res));for(const p of P)p.team=nAl?(p.i<=nAl?0:1):p.i;S.allies=nAl;S.rivals=nRv;for(let i=1;i<np;i++)aiInit(P[i],o.diff);if(demo)aiInit(P[0],1);
 const mt=o.map==='random'?MKEYS[Math.floor(Math.random()*MKEYS.length)]:o.map;S.mapType=mt;
 const starts=genMap(seed,mt,o.size,np);rnd=Math.random;
 starts.forEach((s,i)=>{const tc=mkBld('tc',i,s[0],s[1],true);const nv=5+P[i].m.extraVil;for(let k=0;k<nv;k++){const p=freeAround(tc);mkUnit('villager',i,p.x,p.y)}for(let k=0;k<2;k++){const p=freeAround(tc);mkUnit('spear',i,p.x,p.y)}const p=freeAround(tc);mkUnit('scout',i,p.x,p.y);calcPop(P[i])});if(mt==='fortress')for(const tc of blds.filter(b=>b.type==='tc'))fortressWalls(tc);S.wonderWin=S.vmode==='wonder';setupMode(starts);
 computeTerritory();renderGround(seed);computeFog();const tc=blds.find(b=>b.o===0);cam.z=Math.min(VW,VH)<500?(VW>VH?.62:.78):1;centerOn(tc.x+2,tc.y+3);makeIcons(P[0].style);setupHudIcons()}
function setupHudIcons(){for(const r of R4)$('#r-'+r+' img').src=ICON[r];$('#r-pop img').src=ICON.pop;$('#bIdle img').src=ICON.u_villager;$('#bArmy img').src=ICON.army;$('#bBox img').src=ICON.box;$('#bHome img').src=ICON.b_tc}
const enc=a=>{let s='';for(let i=0;i<a.length;i++)s+=a[i].toString(36);return s};
function save(){if(!running||!S)return;try{const data={v:2,S:Object.assign({},S),W,H,
 P:P.map(p=>({i:p.i,civ:p.civ,res:p.res,phase:p.phase,techs:p.techs,bell:p.bell,autoRep:p.autoRep,king:p.king,team:p.team,st:p.st,barter:p.barter,hero:p.hero,alive:p.alive,ai:p.ai?Object.assign({},p.ai,{waves:[...p.ai.waves]}):null})),
 U:units.map(u=>({id:u.id,type:u.type,o:u.o,x:+u.x.toFixed(2),y:+u.y.toFixed(2),hp:u.hp,carry:u.carry,ct:u.ct,gar:u.gar,face:u.face,task:u.task,xp:u.xp,rank:u.rank,stance:u.stance,home:u.home})),
 B:blds.map(b=>({id:b.id,type:b.type,o:b.o,x:b.x,y:b.y,hp:b.hp,built:b.built,queue:b.queue,rally:b.rally,gar:b.gar,started:b.started,cp:b.cp,slots:b.slots,wonderT:b.wonderT,locked:b.locked})),
 A:animals.map(a=>({id:a.id,type:a.type,o:a.o,x:+a.x.toFixed(2),y:+a.y.toFixed(2),hp:a.hp,food:a.food,carc:a.carc,hx:a.hx,hy:a.hy})),
 ter:enc(ter),rt:enc(resT),tk:enc(treeK),ex:enc(explored),ra:Array.from(resA,v=>Math.round(v)),cam:{x:cam.x,y:cam.y,z:cam.z}};
 localStorage.setItem('boc-save2',JSON.stringify(data))}catch(e){}}
function hasSave(){try{return !!localStorage.getItem('boc-save2')}catch(e){return false}}
function load(){let d;try{d=JSON.parse(localStorage.getItem('boc-save2'))}catch(e){return false}if(!d||d.v!==2)return false;
 applyColors(d.S.opts);alloc(d.W,d.H);units=[];blds=[];animals=[];ents=new Map();projs=[];fx=[];rubble=[];sel=[];placing=null;cmdMode=null;pings=[];uC.clear();lastSig='';S=Object.assign({},d.S);
 P=d.P.map(q=>{const p=newPlayer(q.i,q.civ,'std');Object.assign(p,{res:q.res,phase:q.phase,techs:q.techs,bell:q.bell,autoRep:q.autoRep,king:q.king,team:q.team,st:q.st,barter:q.barter,hero:q.hero,alive:q.alive});if(q.ai)p.ai=Object.assign({},q.ai,{waves:new Set(q.ai.waves)});recomputeMods(p);return p});
 for(let i=0;i<N;i++){ter[i]=parseInt(d.ter[i],36);resT[i]=parseInt(d.rt[i],36);treeK[i]=parseInt(d.tk[i],36);explored[i]=+d.ex[i];resA[i]=d.ra[i];block[i]=resT[i]?1:0}
 for(const q of d.B){const b=Object.assign({k:'b',w:B[q.type].w,h:B[q.type].h,cd:Math.random(),dmgT:0},q);blds.push(b);ents.set(b.id,b);stampB(b,true)}
 for(const q of d.U){const u=Object.assign({k:'u',path:null,cd:0,an:0,th:Math.random(),rp:0,r:RAD[U[q.type].tag]||.3,swing:0,work:0,nav:U[q.type].nav?1:0,aura:null},q);units.push(u);ents.set(u.id,u)}
 for(const q of d.A){const a=Object.assign({k:'a',face:1,an:0,path:null,cd:0,th:1,r:.32,fl:0},q);animals.push(a);ents.set(a.id,a)}
 for(const p of P)calcPop(p);computeTerritory();renderGround(S.seed);computeFog();Object.assign(cam,d.cam);clampCam();makeIcons(P[0].style);setupHudIcons();return true}

/* ---------- loop ---------- */
let last=performance.now(),acc=0,uiT=0,miniT=0;
function updAuras(){for(const u of units)u.aura=null;for(const p of P){const h=p.hero&&ents.get(p.hero);if(!h||h.gar)continue;const k=ud(h).hero;for(const u of units){if(u.o!==p.i||u===h||u.gar||!isMil(u))continue;if(Math.hypot(u.x-h.x,u.y-h.y)<=7)u.aura=k}}}
function tick(){S.t+=DT;S.tick++;pathBudget=0;
 for(const b of blds.slice())if(!b.dead)updBld(b,DT);
 for(const u of units.slice())if(!u.dead){u.work=0;updUnit(u,DT);if(u.work&&u.o===0)workSfx(u)}
 for(const a of animals.slice())if(!a.dead)updAnimal(a,DT);
 if(roadDirty)roadSync();
 if(S.tick%2===0)separate();
 if(S.tick%20===3){hillTick();relicTick()}if(S.tick%600===0)histTick();if(S.tick%40===0)achTick();
 if(S.tick%20===7)for(const p of P)if(p.alive)autoRepair(p);
 for(const p of projs){p.t+=DT;if(p.t>=p.dur){const t=ents.get(p.tid);if(t&&!t.dead&&!(t.k==='u'&&t.gar))hit(t,p.d,p.o,p.aid);
   if(p.splash){for(const u of units){if(u.gar||!isEnemy(p.o,u.o)||u===t)continue;if(Math.hypot(u.x-p.tx,u.y-p.ty)<p.splash)hit(u,p.d*.6,p.o,p.aid)}fx.push({k:'dust',x:p.tx,y:p.ty,t:0,life:.8,s:.5})}p.done=1}
  else{const t=ents.get(p.tid);if(t&&!t.gar){const c=ec(t);p.tx=c.x;p.ty=c.y}}}
 projs=projs.filter(p=>!p.done);for(const f of fx)f.t+=DT;fx=fx.filter(f=>f.t<f.life);for(const r of rubble)r.t+=DT;rubble=rubble.filter(r=>r.t<40);
 if(S.tick%5===0)computeFog();
 if(S.tick%20===0){updAuras();for(const p of P){calcPop(p);if(p.ai&&p.alive)aiTick(p)}if(!storyTick())checkEnd();if(S.peace&&Math.abs(S.t-S.peace)<.6)toast('The ceasefire is over. War begins!','bad')}
 if(terrDirty&&S.tick%10===0)computeTerritory();
 if(S.tick%600===0)save()}
function defeat(p){p.alive=false;for(const u of units.slice())if(u.o===p.i)kill(u,null,true);for(const b of blds.slice())if(b.o===p.i)kill(b,null,true);if(p.i!==0)toast(p.civN+' has been defeated!','good')}
function checkEnd(){if(!running)return;for(const p of P){if(!p.alive)continue;const alive=!modeDefeat(p)&&(blds.some(b=>b.o===p.i&&(b.type==='tc'||b.type==='castle'||b.type==='wonder')&&b.built>=1)||units.some(u=>u.o===p.i&&canBuild(u)));if(!alive){if(p.i===0){endGame(false);return}defeat(p);if(myTeam(p.i))toast('Your ally '+p.civN+' has fallen!','bad')}}
 if(P.filter(p=>isEnemy(0,p.i)).every(p=>!p.alive)){endGame(true,S.allies?'You and your allies stand victorious.':undefined);return}
 if(S.wonderWin)for(const b of blds){if(b.type==='wonder'&&b.built>=1&&S.t-b.wonderT>=600&&P[b.o].alive){endGame(myTeam(b.o),b.o===0?'Your Wonder stood for ten years. The crown is yours.':P[b.o].civN+' held their Wonder for ten years.');return}}}
function endGame(win,msg){sfx(win?'win':'lose');histTick();achEnd(win);running=false;try{localStorage.removeItem('boc-save2')}catch(e){}$('#hud').hidden=true;$('#end').hidden=false;$('#endTitle').textContent=win?'Victory':'Defeat';
 $('#endSub').textContent=msg||(win?'Every rival crown has fallen.':'Your town has fallen. Rebuild and try again.');const t=Math.floor(S.t);
 const rows=[['',...P.map(p=>p.i===0?'You':(myTeam(p.i)?'Ally: ':'')+p.civN)],['Civilization',...P.map(p=>p.civN)],['Play style',...P.map(p=>p.ai?(AIPERS[p.ai.pers]||AIPERS.balanced).n:'—')],['Units trained',...P.map(p=>p.st.trained)],['Units killed',...P.map(p=>p.st.kills)],['Units lost',...P.map(p=>p.st.lost)],['Buildings razed',...P.map(p=>p.st.razed)],['Buildings captured',...P.map(p=>p.st.captured||0)],['Resources gathered',...P.map(p=>Math.floor(p.st.gath))],['Phase',...P.map(p=>PHASE[p.phase])],['Relics held',...P.map(p=>(S.relics||[]).filter(r=>{const b=r.t&&ents.get(r.t);return b&&b.o===p.i}).length)]];
 $('#endStats').innerHTML=`<tr><td colspan="${P.length+1}">Game time ${Math.floor(t/60)} min</td></tr>`+rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('');setTimeout(drawChart,50)}
function frame(now){const dt=Math.min(.25,(now-last)/1000);last=now;sprNew=0;
 if(running&&!paused){acc+=dt*S.speed;let n=0;const maxT=S.speed>1?8:4;while(acc>=DT&&n<maxT){tick();acc-=DT;n++;if(!running)break}if(n>=maxT)acc=Math.min(acc,DT)}
 else if(!running&&S){cam.x+=dt*16;cam.y+=dt*5;if(cam.x>W*HW*.55)cam.x=-H*HW*.55;if(cam.y>(W+H)*HH*.75)cam.y=(W+H)*HH*.2}
 keyPan(dt);adaptRes(dt);render();
 if(running){uiT+=dt;miniT+=dt;if(panelDirty||uiT>.25){uiT=0;panelDirty=false;renderPanel();updTop()}if(miniT>.35){miniT=0;drawMini();updGroups();updAlert();setSpeedLbl()}}
 requestAnimationFrame(frame)}

/* ---------- screens ---------- */
const SETUP={civ:'english',map:'mainland',size:'m',rivals:1,allies:0,diff:1,peace:0,wonder:1,vmode:'wonder',res:'std',pop:200,color:'blue',roof:'auto',seasons:1};
try{Object.assign(SETUP,JSON.parse(localStorage.getItem('boc-setup')||'{}'))}catch(e){}
if(!CIVS[SETUP.civ])SETUP.civ='english';
function segUI(id,opts,key){const el=$('#'+id);el.innerHTML=opts.map(([v,l])=>`<button data-v="${v}" class="${String(SETUP[key])===String(v)?'on':''}">${l}</button>`).join('');
 el.onclick=e=>{const b=e.target.closest('[data-v]');if(!b)return;const v=b.dataset.v;SETUP[key]=isNaN(+v)?v:+v;el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));saveSetup();updSetupInfo()}}
function saveSetup(){try{localStorage.setItem('boc-setup',JSON.stringify(SETUP))}catch(e){}}
function updSetupInfo(){const c=CIVS[SETUP.civ];$('#civinfo').innerHTML=`<b>${c.n}</b>: ${c.bonus} Unique unit: <b>${U[c.uu].n}</b>. Hero: <b>${U[c.hero].n}</b>.`;$('#mapinfo').textContent=SETUP.map==='random'?'A surprise map type.':MAPS[SETUP.map].d}
function buildTitle(){const el=$('#civs');el.innerHTML=CKEYS.map(k=>{const c=CIVS[k];const sp=bSprite('house',c.style,0);const ic=iconCanvas(g=>{const w=sp.width/sp.sc,h=sp.height/sp.sc,s=Math.min(52/w,52/h);g.drawImage(sp,32-w*s/2,34-h*s/2,w*s,h*s)});return`<button data-c="${k}" class="${k===SETUP.civ?'on':''}"><img src="${ic}" alt="">${c.n}</button>`}).join('');
 el.onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;SETUP.civ=b.dataset.c;el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));saveSetup();updSetupInfo()};
 segUI('mapType',[...MKEYS.map(k=>[k,MAPS[k].n]),['random','Random']],'map');segUI('mapSize',[['s','Small'],['m','Medium'],['l','Large']],'size');segUI('rivals',[[1,'1'],[2,'2'],[3,'3']],'rivals');segUI('allies',[[0,'None'],[1,'1 ally'],[2,'2 allies']],'allies');
 segUI('diff',[[0,'Easy'],[1,'Normal'],[2,'Hard']],'diff');segUI('peace',[[0,'None'],[5,'5 min'],[10,'10 min'],[15,'15 min'],[20,'20 min'],[30,'30 min'],[45,'45 min'],[60,'1 hour'],[90,'90 min']],'peace');segUI('victory',Object.entries(VMODES),'vmode');
 segUI('startRes',[['low','Low'],['std','Standard'],['high','High']],'res');segUI('popLim',[[100,'100'],[200,'200'],[300,'300']],'pop');segUI('pcolor',Object.keys(COLORS).map(k=>[k,`<i class="sw" style="background:${COLORS[k]}"></i>${k[0].toUpperCase()+k.slice(1)}`]),'color');segUI('proof',[['auto','By style'],['red','Red tile'],['blue','Blue slate'],['green','Copper green'],['slate','Grey slate'],['gold','Gold tile'],['black','Black slate']],'roof');segUI('seasons',[[1,'On'],[0,'Off']],'seasons');updSetupInfo();$('#contBtn').hidden=!hasSave()}
function showTitle(){running=false;paused=false;$('#hud').hidden=true;$('#pause').hidden=true;$('#end').hidden=true;$('#title').hidden=false;
 newGame({civ:CKEYS[Math.floor(Math.random()*CKEYS.length)],map:['mainland','lakes','coast'][Math.floor(Math.random()*3)],size:'s',rivals:1,diff:1,peace:0,wonder:0,res:'high',pop:200},true);
 for(const tc of blds.filter(b=>b.type==='tc')){for(const [t,dx,dy] of [['house',-3,0],['house',5,1],['barracks',0,6],['farmstead',6,-3],['sentry',-2,-2],['house',-3,3],['field',5,5],['storehouse',-5,-4]]){if(canPlace(t,tc.x+dx,tc.y+dy,tc.o,false))mkBld(t,tc.o,tc.x+dx,tc.y+dy,true)}}
 computeTerritory();explored.fill(1);buildTitle();cam.z=VW<700?.7:.9;const t0=blds[0];centerOn(t0.x+2,t0.y+2)}
function startGame(){$('#title').hidden=true;$('#end').hidden=true;$('#loading').hidden=false;setTimeout(()=>{newGame(Object.assign({},SETUP),false);$('#loading').hidden=true;beginPlay();
 toast('Tap a villager, then tap a tree, bush or animal to start gathering.','good')},30)}
function beginPlay(){running=true;paused=false;lastAtk=null;$('#allyBtn').hidden=!(S.allies>0);$('#hud').hidden=false;lastSig='';panelDirty=true;updTop();drawMini();setSpeedUI();setSpeedLbl();updGroups()}
function setSpeedUI(){$('#speed').querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.s===S.speed))}
$('#newBtn').onclick=startGame;
$('#contBtn').onclick=()=>{$('#loading').hidden=false;setTimeout(()=>{const ok=load();$('#loading').hidden=true;if(ok){$('#title').hidden=true;beginPlay();toast('Welcome back.','good')}else{toast('That save could not be loaded','bad');$('#contBtn').hidden=true}},30)};
$('#againBtn').onclick=startGame;$('#endTitleBtn').onclick=showTitle;
$('#menuBtn').onclick=()=>{paused=true;save();setSpeedUI();$('#pause').hidden=false};
$('#resumeBtn').onclick=()=>{paused=false;$('#pause').hidden=true;setSpeedLbl()};
$('#quitBtn').onclick=()=>{save();showTitle()};
$('#speed').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;S.speed=+b.dataset.s;setSpeedUI()};
const helpOpen=()=>{$('#helpScr').hidden=false};$('#helpBtn').onclick=helpOpen;$('#help2Btn').onclick=helpOpen;$('#helpClose').onclick=()=>{$('#helpScr').hidden=true};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){save();if(!paused){paused=true;$('#pause').hidden=false;setSpeedUI()}}});
addEventListener('pagehide',save);addEventListener('resize',resize);

resize();makeResSprites();makeResSprites2();showTitle();requestAnimationFrame(frame);
window.__boc={get S(){return S},get P(){return P},get units(){return units},get blds(){return blds},get animals(){return animals},tick,newGame,setRun:v=>{running=v},cam,centerOn,mkUnit,mkBld,canPlace,drawUnit,
 fast(n){for(let i=0;i<n;i++){tick();if(!running)break}},mkUnit,render,AU,SFX,musTick,moveTo:(us,x,y)=>{moveGroup(us,{x,y});for(let i=0;i<0;i++);},save,load,act,tap,confirmPlace,get placing(){return placing},sel:()=>sel,setSel:a=>{sel=a;panelDirty=true},get W(){return W},ter:()=>ter,terr:()=>terr,explored:()=>explored,resT:()=>resT,get pathBudget(){return pathBudget}};
})();
