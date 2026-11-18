from pathlib import Path
import sys,os
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'simulacion'))
os.chdir(ROOT/'validacion')
import json,time,math,platform,xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter
import numpy as np
import pybullet as p
from PIL import Image
from ciudad_pybullet import cargar_ciudad,cargar_dron,rayos

start=time.perf_counter();c=p.connect(p.DIRECT)
try:
 m=cargar_ciudad(c,visual=True,arboles=False,modo_colision="malla")
 ids=set(m['ids_edificios']);ed=m['edificios'];allids=m['ids_obstaculos']
 dron=cargar_dron(c,[0,0,500]);aabb=p.getAABB(dron,-1,physicsClientId=c);dim=(np.array(aabb[1])-np.array(aabb[0])).tolist()
 info=dict(estado='EN_PRUEBA',edificios_cargados=len(ed),rayos_techo_ok=0,rayos_fachada_ok=0,contactos_cf2x_ok=0,fallos=[],python=platform.python_version(),dron='CF2X oficial',masa_kg=p.getDynamicsInfo(dron,-1,physicsClientId=c)[0],aabb_dron_m=dim,dqn_evaluada=False,arboles_procedurales_en_colision=False)
 assert abs(info['masa_kg']-.027)<1e-5
 assert abs(dim[0]-.12)<.01 and abs(dim[2]-.025)<.01
 for i,(bid,b) in enumerate(zip(m['ids_edificios'],ed)):
  p.resetBasePositionAndOrientation(dron,[0,0,500],[0,0,0,1],physicsClientId=c)
  v=np.array(b['v']);tr=np.array(b['tri']);a=v[tr[:,0]];z=v[tr[:,1]];d=v[tr[:,2]]
  areas=np.abs((z[:,0]-a[:,0])*(d[:,1]-a[:,1])-(z[:,1]-a[:,1])*(d[:,0]-a[:,0]))
  t=tr[np.argmax(areas)];x,y=v[t].mean(axis=0);h=b['h']
  hit=p.rayTest([x,y,h+.25],[x,y,h-.25],physicsClientId=c)[0]
  if hit[0] in ids:info['rayos_techo_ok']+=1
  else:info['fallos'].append(dict(id=b['id'],tipo='rayo_techo',hit=hit[0]))
  p.resetBasePositionAndOrientation(dron,[x,y,h+.006],[0,0,0,1],physicsClientId=c)
  near=p.getClosestPoints(dron,bid,.05,physicsClientId=c)
  if any(t[8]<0 for t in near):info['contactos_cf2x_ok']+=1
  else:info['fallos'].append(dict(id=b['id'],tipo='contacto_dron'))
  p.resetBasePositionAndOrientation(dron,[0,0,500],[0,0,0,1],physicsClientId=c)
  ring=v[:b['rings'][0]];lens=np.linalg.norm(np.roll(ring,-1,axis=0)-ring,axis=1);j=int(np.argmax(lens));a=ring[j];z=ring[(j+1)%len(ring)];delta=z-a;normal=np.array([delta[1],-delta[0]])/np.linalg.norm(delta);mid=(a+z)/2
  aa=mid+normal*.12;bb=mid-normal*.12
  hit=p.rayTest([*aa,h/2],[*bb,h/2],physicsClientId=c)[0]
  if hit[0] in ids:info['rayos_fachada_ok']+=1
  else:info['fallos'].append(dict(id=b['id'],tipo='rayo_fachada',hit=hit[0]))
  if (i+1)%1000==0:print('Probados',i+1,'/',len(ed),flush=True)
 # La validación estática cubre la ciudad completa. La física temporal usa un sector.
 highest=max(ed,key=lambda b:b['h']);center=highest['center']
 p.disconnect(c);c=p.connect(p.DIRECT)
 m=cargar_ciudad(c,visual=True,arboles=False,centro=center,radio=160,modo_colision='prismas')
 ids=set(m['ids_edificios']);ed=m['edificios'];allids=m['ids_obstaculos'];dron=cargar_dron(c,[0,0,500])
 info['edificios_sector_dinamico']=len(ed);info['radio_sector_m']=160;info['modo_estatico']='malla';info['modo_dinamico']='prismas convexos'
 print('Geometría completa comprobada; sector dinámico',len(ed),flush=True)
 # Contacto dinámico del dron de dimensiones originales sobre un techo.
 b=max(ed,key=lambda b:b['h']);v=np.array(b['v']);tr=np.array(b['tri']);a=v[tr[:,0]];z=v[tr[:,1]];d=v[tr[:,2]];areas=np.abs((z[:,0]-a[:,0])*(d[:,1]-a[:,1])-(z[:,1]-a[:,1])*(d[:,0]-a[:,0]));xy=v[tr[np.argmax(areas)]].mean(axis=0)
 p.resetBasePositionAndOrientation(dron,[*xy,b['h']+1],[0,0,0,1],physicsClientId=c);p.resetBaseVelocity(dron,[0,0,0],[0,0,0],physicsClientId=c);p.setGravity(0,0,-9.81,physicsClientId=c)
 for _ in range(720):p.stepSimulation(physicsClientId=c)
 pos=p.getBasePositionAndOrientation(dron,physicsClientId=c)[0];contacts=p.getContactPoints(bodyA=dron,physicsClientId=c);vel=p.getBaseVelocity(dron,physicsClientId=c)[0]
 info['altura_final_cf2x']=float(pos[2]);info['altura_techo_dinamico']=b['h'];info['velocidad_final_cf2x']=list(vel);info['contactos_finales_cf2x']=len(contacts)
 # Un cilindro libre puede apoyarse inclinado; exigimos apoyo real, reposo y altura compatible con su radio.
 info['apoyo_dinamico_cf2x_ok']=bool(any(pt[2] in ids for pt in contacts) and np.linalg.norm(vel)<.05 and abs(pos[2]-b['h'])<.085)
 p.resetBasePositionAndOrientation(dron,[0,0,500],[0,0,0,1],physicsClientId=c)
 info['sensores_espacio_libre_ok']=all(abs(v-.5)<1e-8 for v in rayos(c,[0,0,500],allids))

 # Se ejecuta después de cargar el mapa y verificar el CF2X.
 import copy
 from fisica_urbana import FisicaUrbana,configuracion
 cfg=configuracion();quiet=FisicaUrbana(c,m,copy.deepcopy(cfg));quiet.aplicar(1/240,dron)
 info['opciones_apagadas_ok']=bool(not quiet.ids_vehiculos and np.allclose(quiet.ultima_fuerza,0))
 windcfg=copy.deepcopy(cfg);windcfg['viento']['activo']=True;windcfg['viento']['intensidad_rafagas']=.35
 w=FisicaUrbana(c,m,windcfg);w2=FisicaUrbana(c,m,copy.deepcopy(windcfg))
 info['viento_crece_con_altura_ok']=float(np.linalg.norm(w.viento_en(20)))>float(np.linalg.norm(w.viento_en(2)))
 for _ in range(30):w.aplicar(1/240);w2.aplicar(1/240)
 info['viento_reproducible_ok']=bool(np.allclose(w.rafaga,w2.rafaga));info['viento_rafagas_ok']=bool(np.linalg.norm(w.rafaga)>0)
 p.setGravity(0,0,0,physicsClientId=c);p.resetBasePositionAndOrientation(dron,[0,0,250],[0,0,0,1],physicsClientId=c);p.resetBaseVelocity(dron,[0,0,0],[0,0,0],physicsClientId=c)
 for _ in range(120):w.aplicar(1/240,dron);p.stepSimulation(physicsClientId=c)
 info['viento_fuerza_aplicada_N']=w.ultima_fuerza.tolist();info['viento_desplaza_cf2x_ok']=np.linalg.norm(p.getBaseVelocity(dron,physicsClientId=c)[0])>.001
 p.resetBasePositionAndOrientation(dron,[0,0,500],[0,0,0,1],physicsClientId=c);p.resetBaseVelocity(dron,[0,0,0],[0,0,0],physicsClientId=c);p.setGravity(0,0,-9.81,physicsClientId=c)
 carcfg=copy.deepcopy(cfg);carcfg['vehiculos']['activos']=True;carcfg['vehiculos']['cantidad']=2;cars=FisicaUrbana(c,m,carcfg)
 info['autos_creados']=len(cars.ids_vehiculos);before=[p.getBasePositionAndOrientation(b,physicsClientId=c)[0] for b in cars.ids_vehiculos]
 for _ in range(480):cars.aplicar(1/240);p.stepSimulation(physicsClientId=c)
 after=[p.getBasePositionAndOrientation(b,physicsClientId=c)[0] for b in cars.ids_vehiculos]
 info['autos_recorrido_m']=[float(np.linalg.norm(np.array(a[:2])-np.array(b[:2]))) for a,b in zip(after,before)]
 info['autos_fisica_ok']=bool(cars.ids_vehiculos and all(np.isfinite(a).all() and -.5<a[2]<3 for a in np.array(after)) and any(d>.1 for d in info['autos_recorrido_m']))
 info['autos_masas_kg']=[sum(p.getDynamicsInfo(b,j,physicsClientId=c)[0] for j in range(-1,p.getNumJoints(b,physicsClientId=c))) for b in cars.ids_vehiculos]
 # Verificación de contacto específico con el chasis de un auto.
 if cars.ids_vehiculos:
  bid=cars.ids_vehiculos[0];pos=p.getBasePositionAndOrientation(bid,physicsClientId=c)[0];p.resetBasePositionAndOrientation(dron,pos,[0,0,0,1],physicsClientId=c)
  info['auto_colision_cf2x_ok']=bool(p.getClosestPoints(dron,bid,.1,physicsClientId=c))
 else:info['auto_colision_cf2x_ok']=False
 p.resetBasePositionAndOrientation(dron,[0,0,500],[0,0,0,1],physicsClientId=c)
 noise=copy.deepcopy(cfg);noise['sensores']['ruido_sigma_m']=.01;noise['sensores']['latencia_ms']=100
 s=FisicaUrbana(c,m,noise);s.tiempo=0.;first=s.degradar_sensores([.2,.3],.5);s.tiempo=.03;second=s.degradar_sensores([.4,.5],.5);info['latencia_sensor_ok']=bool(np.allclose(first,second));info['ruido_sensor_ok']=not np.allclose(first,[.2,.3])
 info['segundos']=round(time.perf_counter()-start,2);info['cantidad_fallos']=len(info['fallos']);info['estado']='OK' if not info['fallos'] and info['apoyo_dinamico_cf2x_ok'] and info['sensores_espacio_libre_ok'] and all(info[k] for k in ['opciones_apagadas_ok','viento_crece_con_altura_ok','viento_reproducible_ok','viento_rafagas_ok','viento_desplaza_cf2x_ok','autos_fisica_ok','auto_colision_cf2x_ok','latencia_sensor_ok','ruido_sensor_ok']) else 'REVISAR'
 Path('resultado_ciudad.json').write_text(json.dumps(info,indent=2,ensure_ascii=False,default=lambda x:x.item()));print(json.dumps(info,indent=2,ensure_ascii=False,default=lambda x:x.item()))
 view=p.computeViewMatrixFromYawPitchRoll([0,0,0],1900,30,-55,0,2);projection=p.computeProjectionMatrixFOV(55,1.5,1,6000)
 _,_,rgba,_,_=p.getCameraImage(1500,1000,view,projection,renderer=p.ER_TINY_RENDERER,physicsClientId=c)
 im=Image.fromarray(np.asarray(rgba,dtype=np.uint8).reshape(1000,1500,4));im.save('ciudad_pybullet.png')
 from IPython.display import display
 display(im)
finally:p.disconnect(c)
