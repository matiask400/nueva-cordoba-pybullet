"""Geometría de Nueva Córdoba en metros reales: sin dependencia del visor web."""
from pathlib import Path
import json,math
ROOT=Path(__file__).resolve().parent

def cargar_ciudad(client, archivo=None, centro=None, radio=None, visual=True, arboles=False, extras=True, modo_colision='prismas'):
    """Carga cuerpos estáticos. Devuelve IDs, relación con edificios y límites.

    centro/radio opcionales permiten cargar un sector circular sin cambiar escala.
    Árboles procedurales optativos: no representan un relevamiento real.
    Calles visuales, autos y luminarias del visor no se exportan como obstáculos.
    """
    import pybullet as p
    if modo_colision not in ['prismas','malla']:raise ValueError('Modo de colisión desconocido')
    data=json.loads(Path(archivo or ROOT/'ciudad.json').read_text())
    ids=[];buildings=[]
    for b in data['buildings']:
        if centro is not None and radio is not None:
            # Distancia a caja de huella; no descarta edificios largos que intersectan el sector.
            xs=[v[0] for v in b['v']];ys=[v[1] for v in b['v']]
            dx=max(min(xs)-centro[0],0,centro[0]-max(xs));dy=max(min(ys)-centro[1],0,centro[1]-max(ys))
            if math.hypot(dx,dy)>radio:continue
        poly=b['v'];n=len(poly);h=b['h']
        cx,cy=b['center'];cz=h/2
        vertices=[[x-cx,y-cy,-cz] for x,y in poly]+[[x-cx,y-cy,cz] for x,y in poly]
        faces=[]
        for a,c,d in b['tri']:faces.extend([[d,c,a],[a+n,c+n,d+n]])
        start=0
        for end in b['rings']:
            for a in range(start,end):
                c=a+1 if a+1<end else start
                faces.extend([[a,c,c+n],[a,c+n,a+n]])
            start=end
        indices=[j for face in faces for j in face]
        # Prismas convexos por triángulo, unidos rígidamente: conservan patios y
        # evitan techos infinitamente delgados en choques con el nanodron.
        collision_parts=[]
        if modo_colision=='malla':
            collision_parts=[p.createCollisionShape(p.GEOM_MESH,vertices=vertices,indices=indices,flags=p.GEOM_FORCE_CONCAVE_TRIMESH,physicsClientId=client)]
        else:
            outer=poly[:b['rings'][0]]
            convex=len(b['rings'])==1 and all((outer[(i+1)%len(outer)][0]-outer[i][0])*(outer[(i+2)%len(outer)][1]-outer[(i+1)%len(outer)][1])-(outer[(i+1)%len(outer)][1]-outer[i][1])*(outer[(i+2)%len(outer)][0]-outer[(i+1)%len(outer)][0])>=-1e-8 for i in range(len(outer)))
            parts=[vertices] if convex else [[vertices[i] for i in tri]+[vertices[i+n] for i in tri] for tri in b['tri']]
            for points in parts:collision_parts.append(p.createCollisionShape(p.GEOM_MESH,vertices=points,physicsClientId=client))
        col=collision_parts[0]
        vis=-1
        if visual:
            v=sum(ord(c) for c in b['id'])%5;palette=[[.72,.69,.61,1],[.63,.66,.62,1],[.76,.71,.60,1],[.59,.63,.65,1],[.69,.63,.54,1]]
            vis=p.createVisualShape(p.GEOM_MESH,vertices=vertices,indices=indices,rgbaColor=palette[v],physicsClientId=client)
        extra=collision_parts[1:];count=len(extra)
        body=p.createMultiBody(baseMass=0,baseCollisionShapeIndex=col,baseVisualShapeIndex=vis,
            basePosition=[cx,cy,cz],linkMasses=[0]*count,linkCollisionShapeIndices=extra,
            linkVisualShapeIndices=[-1]*count,linkPositions=[[0,0,0]]*count,
            linkOrientations=[[0,0,0,1]]*count,linkInertialFramePositions=[[0,0,0]]*count,
            linkInertialFrameOrientations=[[0,0,0,1]]*count,linkParentIndices=[0]*count,
            linkJointTypes=[p.JOINT_FIXED]*count,linkJointAxis=[[0,0,0]]*count,physicsClientId=client)
        ids.append(body);buildings.append(b)
    allx=[p[0] for line in data['boundary'] for p in line];ally=[p[1] for line in data['boundary'] for p in line]
    half=[(max(allx)-min(allx))/2+500,(max(ally)-min(ally))/2+500,.1];center=[(max(allx)+min(allx))/2,(max(ally)+min(ally))/2,-.1]
    col=p.createCollisionShape(p.GEOM_BOX,halfExtents=half,physicsClientId=client)
    vis=p.createVisualShape(p.GEOM_BOX,halfExtents=half,rgbaColor=[.4,.47,.34,1],physicsClientId=client) if visual else -1
    ground=p.createMultiBody(baseMass=0,baseCollisionShapeIndex=col,baseVisualShapeIndex=vis,basePosition=center,physicsClientId=client)
    extra_ids=[];tree_ids=[]
    if extras:
        for e in data['decor']['landmark_extras']:
            x,y=e['p'];h=e['h'];w=e['w']
            if centro is not None and radio is not None and math.hypot(x-centro[0],y-centro[1])>radio:continue
            col=p.createCollisionShape(p.GEOM_BOX,halfExtents=[w/2,w/2,h/2],physicsClientId=client)
            vis=p.createVisualShape(p.GEOM_BOX,halfExtents=[w/2,w/2,h/2],rgbaColor=[.7,.64,.49,1],physicsClientId=client) if visual else -1
            extra_ids.append(p.createMultiBody(baseMass=0,baseCollisionShapeIndex=col,baseVisualShapeIndex=vis,basePosition=[x,y,h/2],physicsClientId=client))
    if arboles:
        for x,y,h,r in data['decor']['trees']:
            if centro is not None and radio is not None and math.hypot(x-centro[0],y-centro[1])>radio:continue
            col=p.createCollisionShape(p.GEOM_CYLINDER,radius=r,height=h,physicsClientId=client)
            vis=p.createVisualShape(p.GEOM_CYLINDER,radius=r,length=h,rgbaColor=[.25,.43,.22,1],physicsClientId=client) if visual else -1
            tree_ids.append(p.createMultiBody(baseMass=0,baseCollisionShapeIndex=col,baseVisualShapeIndex=vis,basePosition=[x,y,h/2],physicsClientId=client))
    return dict(ids_edificios=ids,edificios=buildings,id_suelo=ground,ids_extras=extra_ids,ids_arboles=tree_ids,ids_obstaculos=ids+extra_ids+tree_ids,datos=data,centro_activo=centro,radio_activo=radio,modo_colision=modo_colision)

def cargar_dron(client,posicion):
    import pybullet as p
    return p.loadURDF(str(ROOT/'cf2x.urdf'),basePosition=posicion,physicsClientId=client)

def rayos(client,posicion,obstaculos,alcance=.5,n=8,radio=.06):
    """Sensores en metros, con el mismo radio de origen que el notebook original."""
    import pybullet as p
    if alcance<=radio:raise ValueError('El alcance debe superar el radio del dron')
    dirs=[[math.cos(2*math.pi*i/n),math.sin(2*math.pi*i/n),0] for i in range(n)]
    a=[[posicion[k]+d[k]*radio for k in range(3)] for d in dirs];b=[[posicion[k]+d[k]*alcance for k in range(3)] for d in dirs]
    ids=set(obstaculos);res=p.rayTestBatch(a,b,physicsClientId=client)
    return [radio+r[2]*(alcance-radio) if r[0] in ids else alcance for r in res]

if __name__=='__main__':
    import time,pybullet as p
    c=p.connect(p.GUI);m=cargar_ciudad(c)
    p.resetDebugVisualizerCamera(1800,30,-50,[0,0,0],physicsClientId=c)
    while p.isConnected(c):time.sleep(.05)
