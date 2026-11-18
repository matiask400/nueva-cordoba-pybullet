"""Física opcional: viento correlacionado dependiente de altura y autos dinámicos.
No ejecuta una DQN. Aplicar antes de CADA p.stepSimulation (240 Hz recomendado).
"""
from pathlib import Path
import json,math,collections
import numpy as np
import pybullet as p
ROOT=Path(__file__).resolve().parent

def configuracion(archivo=None):
    return json.loads(Path(archivo or ROOT/'configuracion.json').read_text())

class FisicaUrbana:
    def __init__(self,client,mapa,config=None):
        self.client=client;self.mapa=mapa;self.config=config or configuracion()
        self.rng=np.random.default_rng(self.config.get('semilla',2026));self.rafaga=np.zeros(3);self.autos=[];self._sensor_buffer=collections.deque();self.tiempo=0.;self.ultimo_viento=np.zeros(3);self.ultima_fuerza=np.zeros(3)
        if self.config['vehiculos']['activos']:self._crear_autos()

    @property
    def ids_vehiculos(self):return [a['id'] for a in self.autos]

    def viento_en(self,altura):
        c=self.config['viento']
        if not c['activo']:return np.zeros(3)
        if c['altura_referencia_m']<=0 or c['tiempo_correlacion_s']<=0:raise ValueError('Altura de referencia y correlación deben ser positivas')
        speed=c['velocidad_referencia_m_s']*(max(.3,altura)/c['altura_referencia_m'])**c['exponente_altura']
        ang=math.radians(c['direccion_grados']);mean=np.array([math.cos(ang),math.sin(ang),0])*speed
        return mean+self.rafaga*speed*c['intensidad_rafagas']

    def aplicar(self,dt,dron_id=None):
        if dt<=0:raise ValueError('dt debe ser positivo')
        self.tiempo+=dt;c=self.config['viento']
        if c['activo']:
            alpha=math.exp(-dt/c['tiempo_correlacion_s'])
            self.rafaga=alpha*self.rafaga+math.sqrt(1-alpha**2)*self.rng.normal(size=3)*np.array([1,1,.25])
            if dron_id is not None:
                pos=p.getBasePositionAndOrientation(dron_id,physicsClientId=self.client)[0]
                vel=np.array(p.getBaseVelocity(dron_id,physicsClientId=self.client)[0]);wind=self.viento_en(pos[2]);rel=wind-vel
                force=.5*c['densidad_aire_kg_m3']*c['cd_area_m2']*np.linalg.norm(rel)*rel
                norm=np.linalg.norm(force);limit=c['fuerza_maxima_N']
                if limit<=0:raise ValueError('La fuerza máxima debe ser positiva')
                if norm>limit:force*=limit/norm
                p.applyExternalForce(dron_id,-1,force.tolist(),pos,p.WORLD_FRAME,physicsClientId=self.client)
                self.ultimo_viento=wind;self.ultima_fuerza=force
        for car in self.autos:self._conducir(car)

    def _crear_autos(self):
        cfg=self.config['vehiculos'];count=int(cfg['cantidad'])
        if not 0<=count<=60:raise ValueError('Cantidad de vehículos fuera de rango 0..60')
        candidates=[r for r in self.mapa['datos']['roads'] if r['kind'] in ['residential','tertiary','secondary','primary'] and len(r['p'])>=2]
        if self.mapa.get('centro_activo') is not None:
            center=np.asarray(self.mapa['centro_activo']);radius=self.mapa['radio_activo'];cropped=[]
            for r in candidates:
                run=[]
                for point in r['p']:
                    if np.linalg.norm(np.asarray(point)-center)<radius-5:run.append(point)
                    else:
                        if len(run)>1:cropped.append({**r,'p':run})
                        run=[]
                if len(run)>1:cropped.append({**r,'p':run})
            candidates=cropped
        self.rng.shuffle(candidates)
        for r in candidates:
            points=np.array(r['p'],dtype=float);lengths=np.r_[0,np.cumsum(np.linalg.norm(np.diff(points,axis=0),axis=1))]
            if lengths[-1]<60:continue
            if len(self.autos)>=count:break
            distance=min(8.,lengths[-1]/4);i=int(np.searchsorted(lengths,distance,side='right'));i=min(max(1,i),len(points)-1)
            a,b=points[i-1],points[i];direction=(b-a)/max(.01,np.linalg.norm(b-a));pos=a+(b-a)*(distance-lengths[i-1])/max(.01,lengths[i]-lengths[i-1]);yaw=math.atan2(direction[1],direction[0])-math.pi/2
            bid=self._auto(pos,yaw,cfg['masa_kg']);p.performCollisionDetection(physicsClientId=self.client)
            blocked=any(pt[2] in set(self.mapa['ids_obstaculos']) for pt in p.getContactPoints(bodyA=bid,physicsClientId=self.client))
            if blocked:p.removeBody(bid,physicsClientId=self.client);continue
            self.autos.append(dict(id=bid,points=points,lengths=lengths,index=i))

    def _auto(self,pos,yaw,mass):
        c=self.client
        chassis=p.createCollisionShape(p.GEOM_BOX,halfExtents=[.85,1.9,.32],physicsClientId=c)
        vis=p.createVisualShape(p.GEOM_BOX,halfExtents=[.85,1.9,.32],rgbaColor=[.25,.39,.49,1],physicsClientId=c)
        orient=p.getQuaternionFromEuler([0,math.pi/2,0])
        wheel=p.createCollisionShape(p.GEOM_CYLINDER,radius=.3,height=.18,collisionFrameOrientation=orient,physicsClientId=c)
        wvis=p.createVisualShape(p.GEOM_CYLINDER,radius=.3,length=.18,visualFrameOrientation=orient,rgbaColor=[.1,.11,.12,1],physicsClientId=c)
        cabin=p.createVisualShape(p.GEOM_BOX,halfExtents=[.72,1.05,.32],rgbaColor=[.35,.48,.52,1],physicsClientId=c)
        ccol=p.createCollisionShape(p.GEOM_BOX,halfExtents=[.72,1.05,.32],physicsClientId=c)
        links=[[x,y,-.36] for x in [-.9,.9] for y in [-1.2,1.2]]+[[0,-.15,.62]]
        bid=p.createMultiBody(baseMass=mass*.9,baseCollisionShapeIndex=chassis,baseVisualShapeIndex=vis,basePosition=[*pos,.7],baseOrientation=p.getQuaternionFromEuler([0,0,yaw]),
          linkMasses=[mass*.02]*4+[mass*.02],linkCollisionShapeIndices=[wheel]*4+[ccol],linkVisualShapeIndices=[wvis]*4+[cabin],linkPositions=links,linkOrientations=[[0,0,0,1]]*5,linkInertialFramePositions=[[0,0,0]]*5,linkInertialFrameOrientations=[[0,0,0,1]]*5,linkParentIndices=[0]*5,linkJointTypes=[p.JOINT_REVOLUTE]*4+[p.JOINT_FIXED],linkJointAxis=[[1,0,0]]*4+[[0,0,0]],physicsClientId=c)
        for j in range(-1,5):p.changeDynamics(bid,j,lateralFriction=.9,rollingFriction=.015,spinningFriction=.02,restitution=.02,physicsClientId=c)
        return bid

    def _conducir(self,car):
        cfg=self.config['vehiculos'];bid=car['id'];pos,quat=p.getBasePositionAndOrientation(bid,physicsClientId=self.client);vel,angvel=p.getBaseVelocity(bid,physicsClientId=self.client);point=np.array(pos[:2]);pts=car['points'];i=car['index']
        if np.linalg.norm(pts[i]-point)<5 and i<len(pts)-1:i+=1;car['index']=i
        target=pts[i];delta=target-point;end=i==len(pts)-1 and np.linalg.norm(delta)<5
        desired=math.atan2(delta[1],delta[0])-math.pi/2;yaw=p.getEulerFromQuaternion(quat)[2];error=(desired-yaw+math.pi)%(2*math.pi)-math.pi
        torque=float(np.clip(2500*error-900*angvel[2],-2500,2500));p.applyExternalTorque(bid,-1,[0,0,torque],p.WORLD_FRAME,physicsClientId=self.client)
        speed=0 if end else cfg['velocidad_m_s']*max(.15,math.cos(error))
        for j in range(4):p.setJointMotorControl2(bid,j,p.VELOCITY_CONTROL,targetVelocity=-speed/.3,force=cfg['torque_motor_Nm'],physicsClientId=self.client)

    def degradar_sensores(self,lecturas,alcance):
        """Aplicar una vez por paso de control; preserva la cantidad de entradas."""
        cfg=self.config['sensores'];sigma=cfg['ruido_sigma_m'];latency=cfg['latencia_ms']/1000
        if sigma<0 or latency<0:raise ValueError('Ruido y latencia deben ser no negativos')
        values=np.clip(np.array(lecturas,dtype=float)+self.rng.normal(0,sigma,size=np.shape(lecturas)),0,alcance)
        self._sensor_buffer.append((self.tiempo,values.copy()))
        target=self.tiempo-latency
        while len(self._sensor_buffer)>1 and self._sensor_buffer[1][0]<=target:self._sensor_buffer.popleft()
        return self._sensor_buffer[0][1].copy()

def crear_escenario(client,config=None):
    """Fábrica recomendada para el equipo. Devuelve (mapa, opciones físicas)."""
    from ciudad_pybullet import cargar_ciudad
    cfg=config or configuracion();sector=cfg.get('sector',{});centro=sector.get('centro_m')
    if centro is None:
        data=json.loads((ROOT/'ciudad.json').read_text())
        centro=next(l['p'] for l in data['landmarks'] if l['name']=='Paseo del Buen Pastor')
    todo=sector.get('cargar_todo',False)
    mapa=cargar_ciudad(client,centro=None if todo else centro,radio=None if todo else sector.get('radio_m',160),arboles=cfg['arboles']['colisiones'])
    return mapa,FisicaUrbana(client,mapa,cfg)
