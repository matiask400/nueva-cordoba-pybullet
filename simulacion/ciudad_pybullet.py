"""Geometría de Nueva Córdoba en metros reales: sin dependencia del visor web."""
from pathlib import Path
import json,math
from tempfile import TemporaryDirectory
ROOT=Path(__file__).resolve().parent

def _techo_texturizado(p, client, edificio, vertices, origen, limites):
    """Crea la malla visual con UV geográficas. La colisión usa su malla original."""
    oeste, sur, este, norte = limites
    n = len(edificio['v'])
    posiciones = [f'v {x} {y} {z}\n' for x, y, z in vertices[n:]]
    uv = [f'vt {(x+origen[0]-oeste)/(este-oeste)} {(y+origen[1]-sur)/(norte-sur)}\n'
          for x, y in edificio['v']]
    caras = ['f ' + ' '.join(f'{i+1}/{i+1}/1' for i in tri) + '\n'
             for tri in edificio['tri']]
    with TemporaryDirectory(prefix='nc-techo-') as carpeta:
        malla = Path(carpeta) / 'techo.obj'
        malla.write_text(''.join(posiciones + uv + ['vn 0 0 1\n'] + caras), encoding='ascii')
        return p.createVisualShape(p.GEOM_MESH, fileName=str(malla), physicsClientId=client)

def cargar_ciudad(client, archivo=None, centro=None, radio=None, visual=True, arboles=False, extras=True, modo_colision='prismas', *, datos=None, suelo=True):
    """Carga cuerpos estáticos. Devuelve IDs, relación con edificios y límites.

    centro/radio opcionales permiten cargar un sector circular sin cambiar escala.
    Árboles procedurales optativos: no representan un relevamiento real.
    Calles visuales, autos y luminarias del visor no se exportan como obstáculos.
    """
    import pybullet as p
    if modo_colision not in ['prismas','malla']:raise ValueError('Modo de colisión desconocido')
    data=datos if datos is not None else json.loads(Path(archivo or ROOT/'ciudad.json').read_text())
    ids=[];buildings=[]
    meta = data.get('meta', {})
    referencia = meta.get('roof_reference')
    coordenadas_techo = meta.get('roof_coordinates')
    if coordenadas_techo is None and referencia:
        coordenadas_techo = (meta['origin_utm'], referencia['bounds_utm'])
    textura = ROOT / 'texturas' / 'buen-pastor-2021.jpg'
    textura_id = None
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
        roof_vis=-1
        if visual:
            v=sum(ord(c) for c in b['id'])%5;palette=[[.72,.69,.61,1],[.63,.66,.62,1],[.76,.71,.60,1],[.59,.63,.65,1],[.69,.63,.54,1]]
            visual_indices = indices
            if 'roof_rgb' in b:
                roof_indices = [i+n for tri in b['tri'] for i in tri]
                if coordenadas_techo and textura.is_file():
                    if textura_id is None:
                        textura_id = p.loadTexture(str(textura), physicsClientId=client)
                    if textura_id >= 0:
                        roof_vis = _techo_texturizado(
                            p, client, b, vertices, *coordenadas_techo)
                if roof_vis == -1:
                    roof_vis = p.createVisualShape(
                        p.GEOM_MESH, vertices=vertices, indices=roof_indices,
                        rgbaColor=[channel/255 for channel in b['roof_rgb']]+[1],
                        physicsClientId=client)
                wall_start = 2*len(b['tri'])
                wall_and_floor = faces[:wall_start:2] + faces[wall_start:]
                visual_indices = [i for face in wall_and_floor for i in face]
            vis=p.createVisualShape(p.GEOM_MESH,vertices=vertices,indices=visual_indices,rgbaColor=palette[v],physicsClientId=client)
        extra=collision_parts[1:]
        if roof_vis != -1 and not extra:
            extra.append(-1)
        count=len(extra)
        link_visuals = [-1]*count
        if roof_vis != -1:
            link_visuals[0] = roof_vis
        body=p.createMultiBody(baseMass=0,baseCollisionShapeIndex=col,baseVisualShapeIndex=vis,
            basePosition=[cx,cy,cz],linkMasses=[0]*count,linkCollisionShapeIndices=extra,
            linkVisualShapeIndices=link_visuals,linkPositions=[[0,0,0]]*count,
            linkOrientations=[[0,0,0,1]]*count,linkInertialFramePositions=[[0,0,0]]*count,
            linkInertialFrameOrientations=[[0,0,0,1]]*count,linkParentIndices=[0]*count,
            linkJointTypes=[p.JOINT_FIXED]*count,linkJointAxis=[[0,0,0]]*count,physicsClientId=client)
        if roof_vis != -1 and textura_id is not None and textura_id >= 0:
            p.changeVisualShape(body, 0, textureUniqueId=textura_id, physicsClientId=client)
        ids.append(body);buildings.append(b)
    ground=None
    if suelo:
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


class CargaPorChunks:
    """Mantiene edificios cercanos y un anillo extra para evitar recargas en bordes."""

    def __init__(self, client, mapa, opciones):
        from collections import defaultdict

        self.client = client
        self.mapa = mapa
        self.tamano = float(opciones.get('tamano_m', 50))
        self.radio = int(opciones.get('radio_chunks', 2))
        self.retencion = int(opciones.get('retencion_chunks', 1))
        if not math.isfinite(self.tamano) or self.tamano <= 0 or not 0 <= self.radio <= 10 or not 0 <= self.retencion <= 5:
            raise ValueError('Configuración inválida de chunks')
        self.indice = defaultdict(set)
        self.cargados = {}
        self.centro = None
        for i, edificio in enumerate(mapa['datos']['buildings']):
            xs, ys = zip(*edificio['v'])
            x0, y0 = self.celda((min(xs), min(ys)))
            x1, y1 = self.celda((max(xs), max(ys)))
            for x in range(x0, x1 + 1):
                for y in range(y0, y1 + 1):
                    self.indice[x, y].add(i)

    def celda(self, posicion):
        return tuple(math.floor(float(v) / self.tamano) for v in posicion[:2])

    def indices(self, centro, radio):
        x, y = centro
        return set().union(*(self.indice.get((i, j), ()) for i in range(x-radio, x+radio+1)
                             for j in range(y-radio, y+radio+1)))

    def actualizar(self, posicion):
        import pybullet as p

        centro = self.celda(posicion)
        if centro == self.centro:
            return
        destino = self.indices(centro, self.radio)
        conservar = self.indices(centro, self.radio + self.retencion)
        edificios = self.mapa['datos']['buildings']
        nuevos = sorted(destino - self.cargados.keys())
        if nuevos:
            lote = cargar_ciudad(self.client, datos={**self.mapa['datos'],
                'buildings': [edificios[i] for i in nuevos]}, suelo=False, extras=False)
            self.cargados.update(zip(nuevos, lote['ids_edificios']))
        for i in self.cargados.keys() - conservar:
            p.removeBody(self.cargados.pop(i), physicsClientId=self.client)
        self.mapa['ids_edificios'][:] = self.cargados.values()
        self.mapa['edificios'][:] = [edificios[i] for i in self.cargados]
        self.mapa['ids_obstaculos'][:] = [
            *self.mapa['ids_edificios'], *self.mapa['ids_extras'], *self.mapa['ids_arboles']]
        self.centro = centro
