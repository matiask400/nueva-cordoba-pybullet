/* Ciudad local en metros. Geometría cartográfica + alzados y decoraciones ilustrativos. */
(() => {
'use strict';
const D=window.CIUDAD,TH=window.THREE,CFG=window.NC_CONFIG||{};
if(!D||!TH){document.getElementById('renderfail').style.display='block';document.getElementById('renderfail').textContent='Faltan archivos de la carpeta del visor. Extraé el ZIP completo y abrí index.html.';return;}
const $=id=>document.getElementById(id),V=(x,y,z=0)=>new TH.Vector3(x,z,-y);
let renderer;
try{renderer=new TH.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true,powerPreference:'high-performance'});}catch(e){$('renderfail').style.display='block';$('renderfail').textContent='No se pudo iniciar WebGL. Probá Chrome con aceleración gráfica habilitada.';return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=TH.sRGBEncoding;renderer.toneMapping=TH.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;renderer.shadowMap.enabled=true;renderer.shadowMap.type=TH.PCFSoftShadowMap;$('view').appendChild(renderer.domElement);
const scene=new TH.Scene();scene.background=new TH.Color(0xa9c5cb);scene.fog=new TH.FogExp2(0xb1c7c8,.00013);
const camera=new TH.PerspectiveCamera(47,innerWidth/innerHeight,.2,14000);camera.position.set(1000,1100,1400);
const controls=new TH.OrbitControls(camera,renderer.domElement);controls.target.set(0,25,0);controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.495;controls.minDistance=2;controls.maxDistance=5000;
const hemi=new TH.HemisphereLight(0xcce7ff,0x73634c,.58);scene.add(hemi);const ambient=new TH.AmbientLight(0xffffff,.12);scene.add(ambient);
const sun=new TH.DirectionalLight(0xffdfb5,1.05);sun.position.set(-900,1400,700);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-1500,right:1500,top:1500,bottom:-1500,near:1,far:5000});sun.shadow.bias=-.00008;sun.shadow.normalBias=.3;scene.add(sun);scene.add(sun.target);
const ground=new TH.Mesh(new TH.PlaneGeometry(16000,16000),new TH.MeshStandardMaterial({color:0x656d53,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;scene.add(ground);
const base=new TH.Group(),veg=new TH.Group(),traffic=new TH.Group(),marks=new TH.Group();scene.add(base,veg,traffic,marks);
let seed=2601;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}function hash(s){let h=0;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;}
function mat(color,more={}){return new TH.MeshStandardMaterial({color,roughness:.83,...more});}
function geometry(p,uv,col,ids){const g=new TH.BufferGeometry();g.setAttribute('position',new TH.Float32BufferAttribute(p,3));if(uv)g.setAttribute('uv',new TH.Float32BufferAttribute(uv,2));if(col)g.setAttribute('color',new TH.Float32BufferAttribute(col,3));if(ids)g.setAttribute('buildingIndex',new TH.Float32BufferAttribute(ids,1));g.computeVertexNormals();g.computeBoundingSphere();return g;}
const wallBatches=Array.from({length:5},()=>({p:[],uv:[],c:[],ids:[]})),roofs={p:[],c:[],ids:[]},photoRoofs={p:[],uv:[],c:[],ids:[]},wire=[];
function facadeTexture(variant){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d');
 const [wall,trim,shade]=[
  ['#b77862','#d6a38f','#6e3e33'],
  ['#a9a49a','#d8d1c4','#6b645a'],
  ['#d2b997','#f2e2c8','#856e58'],
  ['#7b8c92','#b8c7c8','#495b66'],
  ['#c89574','#ecd3b6','#795a49'],
 ][variant];
 const finish=ctx.createLinearGradient(0,0,512,512);
 finish.addColorStop(0,trim);finish.addColorStop(.55,wall);finish.addColorStop(1,shade);
 ctx.fillStyle=finish;ctx.fillRect(0,0,512,512);
 if(variant===0||variant===4){
  for(let y=0;y<512;y+=12){
   ctx.fillStyle='#412b232d';ctx.fillRect(0,y,512,2);
   for(let x=(y%24===0?0:-16);x<512;x+=32){
    ctx.fillStyle='#442d2525';ctx.fillRect(x,y,2,12);
    ctx.fillStyle=rand()>.5?'#fff2ce13':'#492c2220';ctx.fillRect(x+2,y+2,30,10);
   }
  }
 }
 for(let i=0;i<4500;i++){
  ctx.fillStyle=rand()>.55?'#26191618':'#fff8df1e';
  ctx.fillRect(rand()*512,rand()*512,1+rand()*4,1+rand()*2);
 }
 for(let y=0;y<512;y+=128){
  ctx.fillStyle=shade;ctx.fillRect(0,y+103,512,12);
  ctx.fillStyle=trim;ctx.fillRect(0,y+99,512,5);
  for(let x=0;x<512;x+=128){
   const glass=ctx.createLinearGradient(x,y+19,x+94,y+96);
   glass.addColorStop(0,'#263039');glass.addColorStop(.42,'#597480');
   glass.addColorStop(.46,'#8798a0');glass.addColorStop(1,'#2c3b41');
   const wide=variant===3;
   const left=x+(wide?10:24),width=wide?108:80;
   ctx.fillStyle=shade;ctx.fillRect(left-6,y+17,width+12,83);
   ctx.fillStyle=trim;ctx.fillRect(left-3,y+18,width+6,76);
   ctx.fillStyle=glass;ctx.fillRect(left,y+22,width,69);
   ctx.fillStyle=variant===3?'#39484e':'#b2aa9a';ctx.fillRect(left+width/2,y+22,3,69);
   if(rand()>.55){
    ctx.fillStyle='#c9ba9a80';ctx.fillRect(left+3,y+23,width*.34,66);
   }
   if(variant===0||variant===2||variant===4){
    ctx.fillStyle='#2825229e';ctx.fillRect(x+10,y+75,108,3);
    for(let bar=16;bar<120;bar+=13)ctx.fillRect(x+bar,y+78,2,20);
    ctx.fillStyle=trim;ctx.fillRect(x+8,y+97,112,6);
    ctx.fillStyle=shade;ctx.fillRect(x+8,y+103,112,8);
   }
  }
 }
 const texture=new TH.CanvasTexture(canvas);
 texture.wrapS=texture.wrapT=TH.RepeatWrapping;
 texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
 texture.encoding=TH.sRGBEncoding;
 return texture;
}
const facadeMaps=wallBatches.map((_,i)=>facadeTexture(i));
const wallMaterials=wallBatches.map((_,i)=>new TH.MeshStandardMaterial({map:facadeMaps[i],vertexColors:true,roughness:.84}));const roofMat=new TH.MeshStandardMaterial({vertexColors:true,roughness:.95});const pickable=[];
function appendTriangle(batch,points,color,id,uv){points.forEach((p,i)=>{batch.p.push(p[0],p[2]||0,-p[1]);if(batch.c)batch.c.push(color.r,color.g,color.b);if(batch.ids)batch.ids.push(id);if(batch.uv)batch.uv.push(...uv[i]);});}
const colors=[0xffffff,0xf8f3ed,0xf1eeeb,0xfcf4e7,0xeaefee,0xe8eef0,0xf2e5d7];
const aerial=D.meta.roof_reference;
const [originX,originY]=D.meta.origin_utm;
function roofUV([x,y]){
 const [west,south,east,north]=aerial.bounds_utm;
 return [(x+originX-west)/(east-west),(y+originY-south)/(north-south)];
}
D.buildings.forEach((b,idx)=>{const h=b.visual_height_m??b.h,ha=hash(b.id),color=new TH.Color(colors[ha%colors.length]);const batch=wallBatches[ha%5];let start=0;
 for(const end of b.rings){for(let i=start;i<end;i++){let j=i+1===end?start:i+1,a=b.v[i],c=b.v[j],length=Math.hypot(a[0]-c[0],a[1]-c[1]);let x=[a[0],a[1],0],y=[c[0],c[1],0],z=[c[0],c[1],h],w=[a[0],a[1],h];let u=Math.max(1,Math.round(length/10)),v=Math.max(1,Math.round(h/3.2))/4;appendTriangle(batch,[x,y,z],color,idx,[[0,0],[u,0],[u,v]]);appendTriangle(batch,[x,z,w],color,idx,[[0,0],[u,v],[0,v]]);wire.push(a[0],h+.05,-a[1],c[0],h+.05,-c[1]);}start=end;}
 const rc=b.roof_rgb ? new TH.Color(`rgb(${b.roof_rgb.join(",")})`) : new TH.Color([0x8b8e84,0x8c8878,0xa2a69b,0xa58c75][ha%4]);for(const t of b.tri){
  const points=t.map(i=>[...b.v[i],h]);
  if(b.roof_rgb&&aerial)appendTriangle(photoRoofs,points,rc,idx,points.map(roofUV));
  else appendTriangle(roofs,points,rc,idx);
 }
});
wallBatches.forEach((b,i)=>{const m=new TH.Mesh(geometry(b.p,b.uv,b.c,b.ids),wallMaterials[i]);m.castShadow=true;m.receiveShadow=true;pickable.push(m);base.add(m);});
const roofMesh=new TH.Mesh(geometry(roofs.p,null,roofs.c,roofs.ids),roofMat);roofMesh.castShadow=true;roofMesh.receiveShadow=true;pickable.push(roofMesh);base.add(roofMesh);
let photoRoofTexture,photoRoofMaterial;
function applyRoofTexture(){
 if(!photoRoofMaterial)return;
 photoRoofMaterial.map=CFG.visual?.texturas_techos===false?null:photoRoofTexture||null;
 photoRoofMaterial.vertexColors=!photoRoofMaterial.map;
 photoRoofMaterial.needsUpdate=true;
}
if(photoRoofs.p.length){
 const material=photoRoofMaterial=new TH.MeshStandardMaterial({vertexColors:true,roughness:.96});
 const mesh=new TH.Mesh(geometry(photoRoofs.p,photoRoofs.uv,photoRoofs.c,photoRoofs.ids),material);
 mesh.castShadow=true;mesh.receiveShadow=true;pickable.push(mesh);base.add(mesh);
 new TH.TextureLoader().load('texturas/buen-pastor-2021.jpg',texture=>{
  texture.encoding=TH.sRGBEncoding;
  texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
  photoRoofTexture=texture;applyRoofTexture();
 });
}
base.add(new TH.LineSegments(geometry(wire),new TH.LineBasicMaterial({color:0x615e52,transparent:true,opacity:.32})));
// Superficies de parques y plazas; polígonos con huecos conservados.
const lcolors={green:0x426b36,water:0x4d8c9b,sport:0xa78b6a,plaza:0xc0b8a3,parking:0x757971};
for(const [kind,color] of Object.entries(lcolors)){const pos=[];const level={green:.015,water:.03,sport:.05,plaza:.065,parking:.08}[kind];for(const land of D.land.filter(x=>x.kind===kind)){for(const tri of land.tri)for(const i of tri){const p=land.v[i];pos.push(p[0],level,-p[1]);}}const m=new TH.Mesh(geometry(pos),mat(color,{side:TH.DoubleSide}));m.receiveShadow=true;base.add(m);}
// Calzadas, veredas y líneas. Anchos estimados cuando OSM no los publica.
const street={p:[],c:[],uv:[]},walk={p:[],c:[],uv:[]},markP=[];const carRoads=[];
function roadStrip(batch,a,b,width,y,color){let dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.05)return;let nx=-dy/len*width/2,ny=dx/len*width/2;const pts=[[a[0]+nx,a[1]+ny,y],[b[0]+nx,b[1]+ny,y],[b[0]-nx,b[1]-ny,y],[a[0]-nx,a[1]-ny,y]];appendTriangle(batch,[pts[0],pts[1],pts[2]],color,0,[pts[0],pts[1],pts[2]].map(v=>[v[0]/8,v[1]/8]));appendTriangle(batch,[pts[0],pts[2],pts[3]],color,0,[pts[0],pts[2],pts[3]].map(v=>[v[0]/8,v[1]/8]));}
const asphalt=new TH.Color(0x242c2e),sidewalk=new TH.Color(0x8c8c7f),foot=new TH.Color(0xc0ae8a);
for(const [roadIndex,r] of D.roads.entries()){const lift=(roadIndex+1)*.008/(D.roads.length+1);let motor=!['footway','path','steps','cycleway','pedestrian','bridleway'].includes(r.kind);for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i];if(motor){roadStrip(walk,a,b,r.width+4.6,.14+lift,sidewalk);roadStrip(street,a,b,r.width,.155+lift,asphalt);}else roadStrip(street,a,b,r.width,.12+lift,foot);
if(motor&&r.width>7){let dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);for(let t=2;t<len-2;t+=10){const end=Math.min(t+3,len);markP.push(a[0]+dx*t/len,.17,-(a[1]+dy*t/len),a[0]+dx*end/len,.17,-(a[1]+dy*end/len));}}}}
function surfaceTexture(sidewalk){const c=document.createElement('canvas');c.width=c.height=256;const a=c.getContext('2d');a.fillStyle=sidewalk?'#b4b4a7':'#aaaaaa';a.fillRect(0,0,256,256);for(let i=0;i<12000;i++){let v=Math.floor(rand()*80+150);a.fillStyle=`rgba(${v},${v},${v},.17)`;a.fillRect(rand()*256,rand()*256,rand()*1.8+1,1);}if(sidewalk){a.strokeStyle='#777c7655';a.lineWidth=1;for(let v=0;v<256;v+=16){a.beginPath();a.moveTo(v,0);a.lineTo(v,256);a.moveTo(0,v);a.lineTo(256,v);a.stroke();}}const t=new TH.CanvasTexture(c);t.encoding=TH.sRGBEncoding;t.wrapS=t.wrapT=TH.RepeatWrapping;t.anisotropy=8;return t;}
for(const [batch,color] of [[walk,0x8c8c7f],[street,0x242c2e]]){const m=new TH.Mesh(geometry(batch.p,batch.uv,batch.c),new TH.MeshStandardMaterial({map:surfaceTexture(batch===walk),vertexColors:true,roughness:1,side:TH.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));m.receiveShadow=true;base.add(m);}
base.add(new TH.LineSegments(geometry(markP),new TH.LineBasicMaterial({color:0xe1dac3,transparent:true,opacity:.75})));
// Sendas ilustrativas en nodos compartidos por calles de distinto nombre.
const junctions=new Map(),crossingPaint={p:[],c:[]},crossingRoutes=[];
const whitePaint=new TH.Color(0xe1ddce);
for(const road of D.roads){
 if(!['primary','secondary','tertiary','residential','unclassified','living_street'].includes(road.kind))continue;
 for(let i=0;i<road.p.length;i++){
  const point=road.p[i],key=point.map(v=>Math.round(v*2)).join(',');
  if(!junctions.has(key))junctions.set(key,[]);
  const arms=junctions.get(key);
  for(const next of [road.p[i-1],road.p[i+1]]){
   if(!next)continue;
   const dx=next[0]-point[0],dy=next[1]-point[1],length=Math.hypot(dx,dy);
   if(length>=7)arms.push({point,dx:dx/length,dy:dy/length,length,road});
  }
 }
}
function crosswalksOverlap(a,b){
 const radius=(r,x,y)=>1.45*Math.abs(r.dx*x+r.dy*y)+r.w*Math.abs(r.dx*y-r.dy*x);
 return [[a.dx,a.dy],[-a.dy,a.dx],[b.dx,b.dy],[-b.dy,b.dx]].every(([x,y])=>
  Math.abs((a.x-b.x)*x+(a.y-b.y)*y)<radius(a,x,y)+radius(b,x,y));
}
for(const arms of junctions.values()){
 const painted=[];
 for(const [i,arm] of arms.entries()){
  const {point,dx,dy,length,road}=arm;
  const side=arms.filter(other=>other.road.id!==road.id&&
   (!road.name||other.road.name!==road.name)&&Math.abs(dx*other.dy-dy*other.dx)>.65);
  if(!side.length||arms.slice(0,i).some(other=>dx*other.dx+dy*other.dy>.95))continue;
  const setback=Math.max(...side.map(other=>other.road.width))/2+2.2;
  if(length<setback+1.3)continue;
  const x=point[0]+dx*setback,y=point[1]+dy*setback;
  const rect={x,y,dx,dy,w:road.width/2};
  if(painted.some(other=>crosswalksOverlap(rect,other)))continue;
  painted.push(rect);
  for(let offset=-road.width/2+.4;offset<road.width/2-.2;offset+=.72){
   const cx=x-dy*offset,cy=y+dx*offset;
   roadStrip(crossingPaint,[cx-dx*1.35,cy-dy*1.35],[cx+dx*1.35,cy+dy*1.35],.38,.184,whitePaint);
  }
  const reach=road.width/2+1;
  crossingRoutes.push([[x-dy*reach,y+dx*reach],[x+dy*reach,y-dx*reach]]);
 }
}
const crossings=new TH.Mesh(geometry(crossingPaint.p,null,crossingPaint.c),
 new TH.MeshStandardMaterial({vertexColors:true,roughness:.94,side:TH.DoubleSide}));
crossings.receiveShadow=true;base.add(crossings);

// Figuras animadas con mallas instanciadas y recorridos sobre caminos y sendas.
const people=new TH.Group();scene.add(people);
const pedestrianLandmarks=D.landmarks.map(landmark=>landmark.p);
const routes=[...crossingRoutes];
for(const road of D.roads){
 if(!['footway','path','pedestrian'].includes(road.kind))continue;
 for(let i=1;i<road.p.length;i++){
  if(Math.hypot(road.p[i][0]-road.p[i-1][0],road.p[i][1]-road.p[i-1][1])>=5)
   routes.push([road.p[i-1],road.p[i]]);
 }
}
function distanceToLandmark(point){
 return Math.min(...pedestrianLandmarks.map(p=>Math.hypot(point[0]-p[0],point[1]-p[1])));
}
const publicWalkers=routes.map(([a,b],i)=>({
 a,b,i,crossing:i<crossingRoutes.length,distance:distanceToLandmark(a),
 length:Math.hypot(b[0]-a[0],b[1]-a[1]),
 speed:1.05+(i%7)*.065,phase:(i*.618034)%1,
})).sort((a,b)=>a.distance-b.distance);
const crossingPeople=[
 ...publicWalkers.filter(walker=>walker.crossing).slice(0,45),
 ...publicWalkers.filter(walker=>!walker.crossing).slice(0,25),
];
const sidewalkPeople=[];
const occupiedBlocks=new Map();
const sidewalkCandidates=(D.decor.sidewalk_routes||[]).map(([a,b],i)=>({
 a,b,i:i+routes.length,crossing:false,distance:distanceToLandmark(a),
 length:Math.hypot(b[0]-a[0],b[1]-a[1]),
 speed:.9+(i%9)*.08,phase:(i*.618034)%1,
})).sort((a,b)=>a.distance-b.distance);
for(const walker of sidewalkCandidates){
 const key=walker.a.map(n=>Math.floor(n/64)).join(',');
 const count=occupiedBlocks.get(key)||0;
 if(count>=3)continue;
 occupiedBlocks.set(key,count+1);
 sidewalkPeople.push(walker);
 if(sidewalkPeople.length===180)break;
}
const walkers=[];
for(let i=0;i<Math.max(crossingPeople.length,sidewalkPeople.length);i++){
 if(i%3===0&&crossingPeople[i/3])walkers.push(crossingPeople[i/3]);
 if(sidewalkPeople[i])walkers.push(sidewalkPeople[i]);
}
walkers.push(...crossingPeople.slice(Math.ceil(sidewalkPeople.length/3)));
const figureParts=[
 {geo:new TH.SphereGeometry(.115,8,6),y:1.59,x:0,colors:[0xc49172,0x9b6247,0xe0b18c,0x714b39]},
 {geo:new TH.BoxGeometry(.38,.52,.22),y:1.22,x:0,colors:[0x415d83,0xd2a24d,0x864941,0x61816e,0xe2ded0]},
 ...[-1,1].flatMap(side=>[
  {geo:new TH.BoxGeometry(.135,.68,.15),y:.65,x:side*.095,swing:side,colors:[0x293749,0x474641,0x313742]},
  {geo:new TH.BoxGeometry(.095,.47,.11),y:1.43,x:side*.23,swing:-side,colors:[0x415d83,0xd2a24d,0x864941,0x61816e,0xe2ded0]},
 ]),
].map(part=>{
 const mesh=new TH.InstancedMesh(part.geo,mat(0xffffff),walkers.length);
 mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(TH.DynamicDrawUsage);
 walkers.forEach(({i},index)=>mesh.setColorAt(index,new TH.Color(part.colors[i%part.colors.length])));
 people.add(mesh);
 return {...part,mesh};
});
const personPose=new TH.Object3D(),partPose=new TH.Object3D();
function updatePeople(seconds){
 if(!people.visible)return;
 for(let index=0;index<figureParts[0].mesh.count;index++){
  const {a,b,length,speed,phase}=walkers[index];
  const cycle=(seconds*speed/length+2*phase)%2;
  const progress=cycle<1?cycle:2-cycle;
  const stride=Math.sin(seconds*speed*10+phase*Math.PI*2);
  personPose.position.copy(V(a[0]+(b[0]-a[0])*progress,a[1]+(b[1]-a[1])*progress,.16+.025*Math.abs(stride)));
  personPose.rotation.y=Math.atan2(b[0]-a[0],a[1]-b[1])+(cycle<1?0:Math.PI);
  personPose.updateMatrix();
  for(const part of figureParts){
   const angle=.52*stride*(part.swing||0);
   partPose.position.set(part.x,part.y,0);
   partPose.rotation.x=angle;
   partPose.translateY(part.y===.65?-.31:part.swing?-.21:0);
   partPose.updateMatrix();
   partPose.matrix.premultiply(personPose.matrix);
   part.mesh.setMatrixAt(index,partPose.matrix);
  }
 }
 for(const {mesh} of figureParts)mesh.instanceMatrix.needsUpdate=true;
}
function togglePeople(visible){
 people.visible=visible;
 $('people').classList.toggle('active',visible);
 $('people').setAttribute('aria-pressed',String(visible));
}
togglePeople(CFG.visual?.peatones!==false);
$('people').onclick=()=>togglePeople(CFG.visual.peatones=!people.visible);
function focusPeople(){
 const landmark=D.landmarks.find(item=>item.name==='Paseo del Buen Pastor');
 const activeWalkers=walkers.slice(0,figureParts[0].mesh.count||walkers.length);
 const crossingWalkers=activeWalkers.filter(walker=>walker.crossing);
 const near=(crossingWalkers.length?crossingWalkers:activeWalkers).reduce((best,walker)=>{
  const center=walker.a.map((value,i)=>(value+walker.b[i])/2);
  const distance=Math.hypot(center[0]-landmark.p[0],center[1]-landmark.p[1]);
  return distance<best.distance?{center,distance,walker}:best;
 },{distance:Infinity});
 if(!near.walker)return;
 togglePeople(true);
 setMode('orbit');
 if(!figureParts[0].mesh.count)setPeopleCount(250);
 const [x,y]=near.center;
 const {a,b,length}=near.walker;
 const dx=(b[0]-a[0])/length,dy=(b[1]-a[1])/length;
 fly(V(x,y,1.1),V(x+dx*5,y+dy*5,13),'Peatones · Buen Pastor');
}
$('people-view').onclick=focusPeople;

// Instancias para miles de detalles sin miles de llamadas de dibujo.
const dummy=new TH.Object3D();function instance(geo,material,items,fn,parent=base,shadows=true){const m=new TH.InstancedMesh(geo,material,items.length);items.forEach((v,i)=>{dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);fn(v,i,dummy);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});m.castShadow=shadows;m.receiveShadow=true;parent.add(m);return m;}
instance(new TH.CylinderGeometry(.13,.2,1,5),mat(0x6f5c42),D.decor.trees,(t,i,o)=>{o.position.copy(V(t[0],t[1],t[2]*.32));o.scale.set(1,t[2]*.64,1);},veg);
const canopy=new TH.InstancedMesh(new TH.IcosahedronGeometry(1,1),mat(0x5a7b3a),D.decor.trees.length);D.decor.trees.forEach((t,i)=>{dummy.position.copy(V(t[0],t[1],t[2]*.77));dummy.scale.set(t[3],t[2]*.42,t[3]);dummy.rotation.set(rand(),rand()*6,rand());dummy.updateMatrix();canopy.setMatrixAt(i,dummy.matrix);canopy.setColorAt(i,new TH.Color([0x648541,0x768d47,0x547743,0x3d6741,0x698d55][i%5]));});canopy.castShadow=true;veg.add(canopy);
instance(new TH.CylinderGeometry(.065,.1,7,5),mat(0x424f4a),D.decor.lamps,(t,i,o)=>o.position.copy(V(t[0],t[1],3.5)));
const lampMat=mat(0xdce5bd,{emissive:0xe9e3b0,emissiveIntensity:.15});instance(new TH.BoxGeometry(.65,.15,1.3),lampMat,D.decor.lamps,(t,i,o)=>{o.position.copy(V(t[0],t[1],7));o.rotation.y=t[2];});
// Equipos y tanques en azoteas (representación visual procedural).
function rooftopFits(building,radius){
 const [x,y]=building.center;
 let inside=false,start=0;
 for(const end of building.rings){
  for(let i=start;i<end;i++){
   const [ax,ay]=building.v[i], [bx,by]=building.v[i+1===end?start:i+1];
   if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
   const dx=bx-ax,dy=by-ay,span=dx*dx+dy*dy;
   const t=span?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/span)):0;
   if(Math.hypot(x-ax-t*dx,y-ay-t*dy)<radius)return false;
  }
  start=end;
 }
 return inside;
}
const roofItems=D.buildings.filter(b=>!b.roof_rgb&&b.h>12&&b.area>70&&hash(b.id)%3===0&&!b.footprint_adjustment&&rooftopFits(b,1.5));
const roofDetails=new TH.Group();base.add(roofDetails);
instance(new TH.BoxGeometry(1,1,1),mat(0x777e78),roofItems,(b,i,o)=>{o.position.copy(V(...b.center,b.h+.55));o.scale.set(2.4,1.1,1.6);},roofDetails);
instance(new TH.CylinderGeometry(.8,.8,1.5,8),mat(0x535c58),roofItems.filter((_,i)=>i%2===0),(b,i,o)=>o.position.copy(V(...b.center,b.h+.75)),roofDetails);
// Alzado estilizado de las torres de Capuchinos; no fotogrametría.
for(const e of D.decor.landmark_extras){let tower=new TH.Mesh(new TH.BoxGeometry(e.w,e.h,e.w),mat(0xb9aa84));tower.position.copy(V(...e.p,e.h/2));tower.castShadow=true;base.add(tower);let roof=new TH.Mesh(new TH.ConeGeometry(e.w*.7,8,4),mat(0x7f8e79));roof.rotation.y=Math.PI/4;roof.position.copy(V(...e.p,e.h+4));roof.castShadow=true;base.add(roof);}
// Vehículos decorativos recorriendo ejes viales, no simulación de tránsito.
const cars=[];const bodyGeo=new TH.BoxGeometry(1.8,1.1,4),cabGeo=new TH.BoxGeometry(1.5,.65,2.2),wheelGeo=new TH.CylinderGeometry(.3,.3,.18,8),wheelMat=mat(0x202725),glassMat=mat(0x45616a,{metalness:.4,roughness:.23});
D.decor.cars.slice(0,60).forEach((r,i)=>{const g=new TH.Group();let body=new TH.Mesh(bodyGeo,mat([0xe0dfd5,0x526e7e,0x9a5945,0xd0c4ac,0x353e43,0x7c8b85][i%6],{metalness:.3,roughness:.4}));body.position.y=.75;g.add(body);const cab=new TH.Mesh(cabGeo,glassMat);cab.position.set(0,1.35,-.2);g.add(cab);for(const x of [-.94,.94])for(const z of [-1.25,1.25]){let w=new TH.Mesh(wheelGeo,wheelMat);w.rotation.z=Math.PI/2;w.position.set(x,.4,z);g.add(w);}body.castShadow=true;traffic.add(g);const pts=r.p.map(p=>V(...p));const lengths=[0];for(let j=1;j<pts.length;j++)lengths.push(lengths[j-1]+pts[j].distanceTo(pts[j-1]));cars.push({g,pts,lengths,length:lengths[lengths.length-1],speed:r.speed,offset:r.width*.22,phase:r.phase});});
// Perímetro municipal en el minimapa y línea discreta en la ciudad.
let boundP=[];D.boundary.forEach(line=>{for(let i=1;i<line.length;i++)boundP.push(line[i-1][0],.2,-line[i-1][1],line[i][0],.2,-line[i][1]);});const boundaryLine=new TH.LineSegments(geometry(boundP),new TH.LineBasicMaterial({color:0xd5ff69,transparent:true,opacity:.45}));marks.add(boundaryLine);
// Etiquetas de hitos como sprites: ancladas en lugares reales de OSM.
function label(text){const c=document.createElement('canvas');c.width=768;c.height=100;const a=c.getContext('2d');a.fillStyle='#14221ce6';a.beginPath();a.roundRect(2,2,764,96,12);a.fill();a.strokeStyle='#c9dfaa70';a.lineWidth=2;a.stroke();a.fillStyle='#d5ff69';a.font='bold 28px Arial';a.textAlign='center';a.fillText(text.length>43?text.slice(0,40)+'…':text,384,61);const t=new TH.CanvasTexture(c);t.encoding=TH.sRGBEncoding;const s=new TH.Sprite(new TH.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(105,14,1);return s;}
D.landmarks.forEach(l=>{let s=label(l.name);s.position.copy(V(...l.p,55));marks.add(s);let line=new TH.Line(geometry([l.p[0],2,-l.p[1],l.p[0],48,-l.p[1]]),new TH.LineBasicMaterial({color:0xd5ff69,transparent:true,opacity:.5}));marks.add(line);});
// Interfaz y navegación.
$('count').textContent=D.buildings.length.toLocaleString('es-AR');$('corecount').textContent=D.meta.report.edificios_barrio.toLocaleString('es-AR');
let mode='orbit',transition=null,tourStart=0,night=false,quality=false,keys={},pointerDown=null,selected=null,selectionMesh=null;
function toast(s){$('toast').textContent=s;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',7000);}
function fly(target,position,name){transition={start:performance.now(),from:camera.position.clone(),to:position.clone(),old:controls.target.clone(),target:target.clone()};if(name)$('location-name').textContent=name;}
const destinations=[...D.landmarks].sort((a,b)=>['Iglesia de los Capuchinos','Paseo del Buen Pastor','Plaza España','Palacio Ferreyra','Parque de Las Tejas'].indexOf(a.name)-['Iglesia de los Capuchinos','Paseo del Buen Pastor','Plaza España','Palacio Ferreyra','Parque de Las Tejas'].indexOf(b.name));
const shown=['Paseo del Buen Pastor','Iglesia de los Capuchinos','Palacio Ferreyra','Plaza España','Parque de Las Tejas'];shown.forEach((name,i)=>{let l=D.landmarks.find(x=>x.name===name);if(!l)return;let b=document.createElement('button');b.className='select';b.textContent=name;let k=document.createElement('small');k.textContent=String(i+1).padStart(2,'0')+' ↗';b.appendChild(k);b.onclick=()=>{setMode('orbit');fly(V(...l.p,10),V(l.p[0]+150,l.p[1]-160,150),l.name);document.querySelectorAll('.select').forEach(x=>x.classList.toggle('active',x===b));};$('destinations').appendChild(b);});
function setMode(m){mode=m;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x.dataset.mode===m));if(m==='street'){const r=D.roads.find(x=>x.name==='Buenos Aires'&&x.kind==='residential')||D.roads.find(x=>x.kind==='residential');const a=r.p[0],b=r.p[1];let dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);fly(V(a[0]+dx/len*30,a[1]+dy/len*30,4),V(a[0],a[1],4),r.name||'Recorrido urbano');toast('Exploración visual: W A S D · Q E para altura. La cámara no ejecuta la DQN ni tiene colisiones.');}if(m==='tour'){tourStart=performance.now();toast('Recorrido de cámara por los hitos. No representa una trayectoria aprendida por el modelo.');}controls.enabled=m!=='tour';}
document.querySelectorAll('[data-mode]').forEach(x=>x.onclick=()=>setMode(x.dataset.mode));$('reset').onclick=()=>{setMode('orbit');fly(new TH.Vector3(0,25,0),new TH.Vector3(1000,1100,1400),'Nueva Córdoba');};$('trees').onclick=()=>{veg.visible=!veg.visible;$('trees').classList.toggle('active',veg.visible);};$('traffic').onclick=()=>{traffic.visible=!traffic.visible;$('traffic').classList.toggle('active',traffic.visible);};
const buildingReview=new Map([
 ['microsoft-96571-0','Huella corregida en Pasaje Carlucci: recorte al borde estimado de la calzada, contrastado con la ortofoto de 2021.'],
 ['microsoft-51375-0','Huella corregida en Pasaje Carlucci: recorte al borde estimado de la calzada, contrastado con la ortofoto de 2021.'],
 ['microsoft-37150-0','Huella corregida en Pasaje Carlucci: recorte al borde estimado de la calzada, contrastado con la ortofoto de 2021.'],
 ['microsoft-35493-0','Huella corregida en Obispo Trejo y Sanabria: recorte al borde estimado de la calzada, contrastado con la ortofoto de 2021.'],
 ['microsoft-22746-0','Huella corregida en Buenos Aires: recorte al borde estimado de la calzada, contrastado con la ortofoto de 2021.'],
 ['microsoft-118270-0','Huella corregida en Ituzaingó: recorte al borde estimado de la calzada, contrastado con la ortofoto de 2021.'],
 ['microsoft-110530-0','Huella corregida en Pasaje España: recorte al borde estimado de la calzada, contrastado con la ortofoto de 2021.'],
 ['overture-666b10ea-d021-4e03-a8d8-1378ab18bc87-1585','Huella de más de 4.700 m² dividida en dos volúmenes según la separación de cubiertas en la ortofoto.'],
 ['microsoft-62775-1','Huella ajustada a la calzada estimada de Achával Rodríguez. El recorte separó dos volúmenes.'],
 ['microsoft-74087-0','Huella ajustada a la calzada estimada de Independencia. Altura de 66 m pendiente de confirmar.'],
 ['microsoft-89576-0','Huella ajustada a la calzada estimada de Boulevard Chacabuco.'],
 ['microsoft-70963-0','Huella ajustada a la calzada estimada de Boulevard Chacabuco.'],
 ['overture-1e65b85f-13b9-4e0d-8b6e-b8cf7360b5a1-1496','Huella original de más de 6.000 m² separada siguiendo cambios de techo visibles en la ortofoto.'],
 ['overture-0bfb110e-e7d6-4f88-8360-310203fbaa54-694','Huella original de más de 5.600 m² separada siguiendo cambios de techo visibles en la ortofoto.'],
 ['overture-2263d0f2-1f2a-41f0-8226-361fcb91800b-3975','Huella separada siguiendo cambios de techo visibles en la ortofoto. La altura original de 57 m todavía es estimada.'],
]);
const reviewedBuildings=[...buildingReview.keys()].map(id=>D.buildings.find(b=>b.id===id)).filter(Boolean);
let reviewIndex=0;
$('review-building').onclick=()=>{
 const b=reviewedBuildings[reviewIndex++%reviewedBuildings.length];
 const [x,y]=b.center;
 fly(V(x,y,b.h/2),V(x+110,y-105,b.h+95),'Edificio para revisar');
 showBuilding(b);
};
$('quality').onclick=()=>{quality=!quality;$('quality').classList.toggle('active',quality);$('legend').style.display=quality?'block':'none';wallBatches.forEach((batch,idx)=>{let vals=[];batch.ids.forEach(id=>{let c=new TH.Color(D.buildings[id].source==='OpenStreetMap'?0x88bcdc:0xa4c478);vals.push(c.r,c.g,c.b);});const g=pickable[idx].geometry;g.setAttribute('color',new TH.Float32BufferAttribute(quality?vals:batch.c,3));});};
$('daynight').onclick=()=>{night=!night;$('daynight').textContent=night?'☾   NOCHE':'☀   TARDE';scene.background.set(night?0x172a3a:0xa9c5cb);scene.fog.color.set(night?0x1b2e3c:0xb1c7c8);sun.intensity=night?.18:1.05;hemi.intensity=night?.48:.58;ambient.intensity=night?.1:.12;lampMat.emissiveIntensity=night?2:.15;renderer.toneMappingExposure=night?.85:.85;};
$('capture').onclick=()=>{const aspect=camera.aspect;renderer.setSize(1600,1000,false);camera.aspect=1.6;camera.updateProjectionMatrix();renderer.render(scene,camera);const image=document.createElement('canvas');image.width=1600;image.height=1000;const a2=image.getContext('2d');a2.drawImage(renderer.domElement,0,0,1600,1000);a2.fillStyle='#14221ce6';a2.fillRect(0,962,1600,38);a2.fillStyle='#dce7d5';a2.font='15px Arial';a2.fillText('© OpenStreetMap contributors · Overture Maps · Microsoft | Reconstrucción aproximada · alturas estimadas',24,986);camera.aspect=aspect;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.render(scene,camera);image.toBlob(async blob=>{if(location.protocol==='http:'&&location.port==='8766'){try{const r=await fetch('/guardar-vista',{method:'POST',headers:{'Content-Type':'image/png'},body:blob});if(r.ok){toast('Imagen guardada en docs/imagenes/vista_del_visor.png');return;}}catch(e){}}const a=document.createElement('a');a.download='nueva_cordoba_3d.png';a.href=URL.createObjectURL(blob);a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000);},'image/png');};
$('info').onclick=()=>toast('Ciudad aproximada con datos OSM, Overture y Microsoft. Alturas sin relevamiento: estimadas. Fachadas, autos y arbolado: ilustrativos. Crazyflie CF2X: colisión Ø 12 cm × 2,5 cm; masa 27 g.');
const raycaster=new TH.Raycaster(),mouse=new TH.Vector2();renderer.domElement.addEventListener('pointerdown',e=>pointerDown=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!pointerDown||Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>5)return;mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(pickable)[0];if(!hit)return;const id=Math.round(hit.object.geometry.getAttribute('buildingIndex').getX(hit.face.a));showBuilding(D.buildings[id]);});
function showBuilding(building){selected=building;$('inspector').style.display='block';$('b-name').textContent=selected.name||'Edificio de Nueva Córdoba';const hs={height_osm:'Altura publicada en OSM; sin verificación en campo',pisos_osm_3m:'Cantidad de pisos OSM × 3 m',estimada_vecindad:'Estimada con edificios cercanos; no medida',supuesto_15m:'Altura supuesta de 15 m',height_overture:'Altura publicada en Overture',pisos_overture_3m:'Pisos Overture × 3 m'};$('b-info').textContent=`Altura: ${selected.h} m · Huella: ${selected.area.toLocaleString('es-AR')} m². ${hs[selected.height_source]||selected.height_source}.`;$('b-source').textContent=`Huella: ${selected.source}${selected.source_datasets?' / '+selected.source_datasets.join(', '):''}. ID: ${selected.id}.${selected.roof_rgb ? ' Techo: ortofoto IDECOR / AGRISAT, febrero de 2021.' : ''}`;
 $('b-review').textContent=[selected.curb_adjustment ? `Huella ajustada a la vereda estimada de ${selected.curb_adjustment.roads.join(', ')}.` : '',buildingReview.get(selected.footprint_adjustment?.parent_id||selected.id),selected.visual_height_m ? `Alzado ilustrativo en el visor: ${selected.visual_height_m} m.` : ''].filter(Boolean).join(' ');
}$('close-inspector').onclick=()=>$('inspector').style.display='none';
window.addEventListener('keydown',e=>{if(['w','a','s','d','q','e','Shift','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){keys[e.key.toLowerCase()]=true;e.preventDefault();}if(e.key.toLowerCase()==='h')document.body.classList.toggle('hidden-ui');});window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);window.addEventListener('blur',()=>keys={});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const mini=$('mini'),mc=mini.getContext('2d'),mapbase=document.createElement('canvas');mapbase.width=490;mapbase.height=380;const bc=mapbase.getContext('2d');let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;D.boundary.flat().forEach(p=>{xmin=Math.min(xmin,p[0]);xmax=Math.max(xmax,p[0]);ymin=Math.min(ymin,p[1]);ymax=Math.max(ymax,p[1]);});const scale=Math.min(440/(xmax-xmin),330/(ymax-ymin));const project=(x,y)=>[245+(x-(xmin+xmax)/2)*scale,190-(y-(ymin+ymax)/2)*scale];bc.fillStyle='#203529';bc.fillRect(0,0,490,380);bc.strokeStyle='#58745b';bc.lineWidth=2;for(const r of D.roads){bc.beginPath();r.p.forEach((p,i)=>bc[i?'lineTo':'moveTo'](...project(...p)));bc.stroke();}bc.fillStyle='#354d39';for(const b of D.buildings){bc.beginPath();let end=b.rings[0];b.v.slice(0,end).forEach((p,i)=>bc[i?'lineTo':'moveTo'](...project(...p)));bc.fill();}bc.strokeStyle='#bbdc7a';bc.lineWidth=2;D.boundary.forEach(line=>{bc.beginPath();line.forEach((p,i)=>bc[i?'lineTo':'moveTo'](...project(...p)));bc.stroke();});
let last=performance.now(),lastMini=0;const clock=new TH.Clock();function frame(now){requestAnimationFrame(frame);const dt=Math.min(.06,(now-last)/1000);last=now;
if(transition){let f=Math.min(1,(now-transition.start)/1800),t=f*f*(3-2*f);camera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.old,transition.target,t);if(f===1)transition=null;}
else if(mode==='tour'){let t=(now-tourStart)/1000,idx=Math.floor(t/13)%D.landmarks.length,l=D.landmarks[idx];const angle=(t%13)/13*1.3+.5,desired=V(l.p[0]+Math.cos(angle)*180,l.p[1]+Math.sin(angle)*180,110);camera.position.lerp(desired,.025);controls.target.lerp(V(...l.p,8),.025);camera.lookAt(controls.target);$('location-name').textContent=l.name;}
const speed=(keys.shift?90:25)*dt;if(mode!=='tour'&&!transition){const forward=new TH.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new TH.Vector3().crossVectors(forward,new TH.Vector3(0,1,0));const move=new TH.Vector3();if(keys.w||keys.arrowup)move.add(forward);if(keys.s||keys.arrowdown)move.sub(forward);if(keys.d||keys.arrowright)move.add(right);if(keys.a||keys.arrowleft)move.sub(right);if(keys.e)move.y+=1;if(keys.q)move.y-=1;move.multiplyScalar(speed);camera.position.add(move);controls.target.add(move);if(camera.position.y<1.5){let dy=1.5-camera.position.y;camera.position.y+=dy;controls.target.y+=dy;}}
if(mode!=='tour')controls.update();
if(traffic.visible)cars.forEach(car=>{let d=(car.phase*car.length+now/1000*car.speed)%car.length;let i=1;while(i<car.lengths.length-1&&car.lengths[i]<d)i++;const a=car.pts[i-1],b=car.pts[i],seg=car.lengths[i]-car.lengths[i-1];const f=seg>0?(d-car.lengths[i-1])/seg:0;car.g.position.lerpVectors(a,b,f);const dir=new TH.Vector3().subVectors(b,a).normalize();car.g.position.x-=dir.z*car.offset;car.g.position.z+=dir.x*car.offset;car.g.rotation.y=Math.atan2(dir.x,dir.z);});
updatePeople(now/1000);
if(now-lastMini>150){mc.drawImage(mapbase,0,0);const a=project(camera.position.x,-camera.position.z),v=new TH.Vector3();camera.getWorldDirection(v);const angle=Math.atan2(v.x,v.z);mc.save();mc.translate(...a);mc.rotate(-angle);mc.fillStyle='#e5ffb7';mc.beginPath();mc.moveTo(0,-8);mc.lineTo(6,6);mc.lineTo(0,3);mc.lineTo(-6,6);mc.closePath();mc.fill();mc.restore();lastMini=now;$('coords').textContent=`X ${camera.position.x.toFixed(0)} m · Y ${(-camera.position.z).toFixed(0)} m · Altura ${camera.position.y.toFixed(0)} m`;}
renderer.render(scene,camera);
}

const fieldDefs=[
 ['Visual',[
  ['visual.vegetacion','Vegetación'],['visual.trafico','Tránsito'],
  ['visual.peatones','Peatones'],['visual.cantidad_peatones','Cantidad de peatones',0,250,1],
  ['visual.sendas','Sendas peatonales'],['visual.texturas_techos','Ortofoto en los techos'],
  ['visual.texturas_fachadas','Texturas de las fachadas'],['visual.detalles_azotea','Accesorios de azotea'],
  ['visual.sombras','Sombras'],['visual.noche','Noche'],
 ]],
 ['Escala y carga en PyBullet',[
  ['escala.divisor','Divisor de escala',1,30,0.1],
  ['escala.altura_minima_edificio_m','Altura mínima (m), opcional',0,1000,.01,true],
  ['sector.cargar_todo','Cargar toda la ciudad'],['sector.centro_m','Centro X, Y (m), opcional','xy'],
  ['sector.radio_m','Radio de física activa (m)',1,5000,1],
  ['chunks.activo','Carga por chunks'],['chunks.tamano_m','Tamaño del chunk (m)',5,1000,1],
  ['chunks.radio_chunks','Radio (chunks)',0,10,1],['chunks.retencion_chunks','Retención (chunks)',0,5,1],
 ]],
 ['Viento y sensores en PyBullet',[
  ['semilla','Semilla',0,2147483647,1],['viento.activo','Viento físico'],
  ['viento.velocidad_referencia_m_s','Velocidad de referencia (m/s)',0,50,.01],
  ['viento.altura_referencia_m','Altura de referencia (m)',.01,500,.01],
  ['viento.exponente_altura','Exponente de altura',0,2,.01],
  ['viento.direccion_grados','Dirección (grados)',0,360,1],
  ['viento.intensidad_rafagas','Intensidad de ráfagas',0,2,.01],
  ['viento.tiempo_correlacion_s','Correlación (s)',.01,120,.01],
  ['viento.densidad_aire_kg_m3','Densidad del aire (kg/m³)',.01,10,.001],
  ['viento.cd_area_m2','Área de arrastre (m²)',0,1,.0001],
  ['viento.fuerza_maxima_N','Fuerza máxima (N)',0,20,.001],
  ['viento.efecto_edificios.activo','Abrigo de edificios'],
  ['viento.efecto_edificios.alcance_m','Alcance del abrigo (m)',.1,500,.1],
  ['viento.efecto_edificios.reduccion_maxima','Reducción máxima',0,1,.01],
  ['sensores.ruido_sigma_m','Ruido de sensores (m)',0,10,.001],
  ['sensores.latencia_ms','Latencia (ms)',0,5000,1],
 ]],
 ['Vehículos y árboles en PyBullet',[
  ['vehiculos.activos','Autos con física'],['vehiculos.cantidad','Cantidad de autos',0,60,1],
  ['vehiculos.velocidad_m_s','Velocidad (m/s)',0,50,.01],
  ['vehiculos.masa_kg','Masa (kg)',1,50000,1],['vehiculos.torque_motor_Nm','Torque (N·m)',0,10000,1],
  ['arboles.colisiones','Colisiones del arbolado'],
 ]],
];
const visualDefaults={vegetacion:true,trafico:true,peatones:true,cantidad_peatones:250,sendas:true,
 texturas_techos:true,texturas_fachadas:true,detalles_azotea:true,sombras:true,noche:false};
CFG.visual={...visualDefaults,...CFG.visual};
function valueAt(key){return key.split('.').reduce((value,part)=>value?.[part],CFG);}
function setValue(key,value){
 const parts=key.split('.');
 const last=parts.pop();
 const group=parts.reduce((current,part)=>(current[part]??={}),CFG);
 group[last]=value;
}
function setPeopleCount(count){
 for(const {mesh} of figureParts)mesh.count=Math.max(0,Math.min(walkers.length,Math.round(count)||0));
}
function applyVisualSettings(){
 const settings=CFG.visual;
 veg.visible=settings.vegetacion;traffic.visible=settings.trafico;
 renderer.shadowMap.enabled=settings.sombras;
 $('trees').classList.toggle('active',veg.visible);
 $('traffic').classList.toggle('active',traffic.visible);
 togglePeople(settings.peatones);
 setPeopleCount(settings.cantidad_peatones);
 crossings.visible=settings.sendas;roofDetails.visible=settings.detalles_azotea;
 wallMaterials.forEach((material,i)=>{
  material.map=settings.texturas_fachadas?facadeMaps[i]:null;
  material.needsUpdate=true;
 });
 applyRoofTexture();
 if(settings.noche!==night)$('daynight').click();
}
const form=$('config-fields');
for(const [section,fields] of fieldDefs){
 const heading=document.createElement('h3');heading.textContent=section;form.append(heading);
 for(const [key,name,min,max,step,optional] of fields){
  const row=document.createElement('label');
  row.style.cssText='display:flex;justify-content:space-between;gap:12px;padding:8px 0;font-size:11px';
  const input=document.createElement('input');input.dataset.config=key;
  input.type=min===undefined?'checkbox':min==='xy'?'text':'number';
  if(input.type==='number'){
   input.min=min;input.max=max;input.step=step;input.required=!optional;
  }
  if(input.type==='text')input.placeholder='220, -170';
  input.style.maxWidth='90px';
  row.append(name,input);form.append(row);
 }
}
const inputs=[...form.querySelectorAll('input')];
$('settings').onclick=()=>{
 for(const input of inputs){
  const value=valueAt(input.dataset.config);
  if(input.type==='checkbox')input.checked=Boolean(value);
  else input.value=Array.isArray(value)?value.join(', '):value??'';
 }
 $('settings-panel').style.display='block';
};
$('close-settings').onclick=()=>$('settings-panel').style.display='none';
$('save-config').onclick=async()=>{
 const values=[];
 for(const input of inputs){
  if(!input.reportValidity())return;
  let value=input.checked;
  if(input.type==='number')value=input.value===''?null:input.valueAsNumber;
  if(input.type==='text'){
   const raw=input.value.trim();
   const parts=raw.split(',').map(part=>part.trim());
   if(raw&&(parts.length!==2||parts.some(part=>!part||!Number.isFinite(Number(part))))){
    toast('Ingresá el centro como X, Y en metros.');return;
   }
   value=raw?parts.map(Number):null;
  }
  values.push([input.dataset.config,value]);
 }
 for(const [key,value] of values)setValue(key,value);
 applyVisualSettings();
 const text=JSON.stringify(CFG,null,2);
 if(location.port==='8766'){
  try{
   const response=await fetch('/guardar-configuracion',{method:'POST',headers:{'Content-Type':'application/json'},body:text});
   if(response.ok){toast('Configuración guardada. Reiniciá PyBullet para aplicar las opciones físicas.');return;}
  }catch(error){/* El visor estático puede descargar el archivo. */}
 }
 const link=document.createElement('a');link.download='configuracion.json';
 const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
 link.href=url;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 toast('Guardá configuracion.json en simulacion/ antes de iniciar PyBullet.');
};
applyVisualSettings();

window.NC_VIEWER={scene,camera,renderer,controls,data:D,ready:true,setMode};$('loading').style.display='none';requestAnimationFrame(frame);
if(new URLSearchParams(location.search).get('vista')==='peatones')focusPeople();
})();
