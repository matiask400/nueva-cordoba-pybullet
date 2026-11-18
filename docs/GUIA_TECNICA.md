# Nueva Córdoba — escenario urbano configurable

Reconstrucción 3D aproximada del barrio y su contexto, en metros reales. La escena contiene 7.938 huellas o partes de construcciones; 2.690 intersectan el perímetro municipal de Nueva Córdoba. No equivale a un inventario de 7.938 edificios independientes: una construcción puede estar formada por varias partes. La escena es una interpretación visual inspirada en ciudades de videojuegos, no una reproducción fotográfica de GTA.

## Organización

Los archivos de PyBullet y Colab están en `simulacion/`; los del navegador, en `visor/`. La configuración física canónica es `simulacion/configuracion.json`. El servidor del visor guarda ahí y actualiza su copia visual `visor/configuracion.js`. Las exportaciones están en `exportaciones/`, los informes en `validacion/` y las imágenes en `docs/imagenes/`.

## Abrir el mapa

Extraer todo el ZIP y abrir visor/index.html en Chrome, Edge o Firefox con WebGL. No necesita instalación ni cuenta. Para guardar las configuraciones directamente en la carpeta, ejecutar `python3 visor/abrir_visor.py` y abrir http://127.0.0.1:8766 . Cerrar con Ctrl+C. Las tipografías y bibliotecas están incluidas para uso sin Internet.

Controles: arrastrar para orbitar, rueda para acercar, botón derecho para desplazar. W/A/S/D para recorrer, Q/E para altura y Shift para acelerar. H oculta la interfaz. Los botones de lugares llevan a hitos reales de OSM. El visor tiene controles de vegetación, tránsito visual, fuentes, día/noche y configuración. La cámara no tiene colisiones ni ejecuta la DQN. El recorrido automático es de cámara, no de un agente entrenado.

## Realismo configurable

El botón ⚙ guarda las opciones en simulacion/configuracion.json. Con el servidor local, el visor lee ese archivo directamente y mantiene una copia visual para uso sin servidor. Si se abre visor/index.html como archivo, el navegador descarga el JSON: reemplazar simulacion/configuracion.json antes de iniciar PyBullet. Con python3 visor/abrir_visor.py el guardado es automático.

- Viento: activa fuerzas aerodinámicas sobre el dron; velocidad media según altura, dirección y ráfagas correlacionadas aleatorias. El perfil usa u(z)=u_ref·(max(z,0.3)/z_ref)^alpha. El abrigo opcional de edificios usa rayos contra las fachadas a la altura del dron. No modela CFD, aceleración en cañones urbanos ni turbulencia detrás de cada edificio. Las fuerzas usan velocidad relativa y arrastre cuadrático, con un límite configurable para evitar valores extremos.
- Autos físicos: chasis con masa, ruedas con colisión, motores y control simplificado de dirección por torque; siguen segmentos de calles y se detienen al llegar al extremo. No son una simulación completa de tránsito ni de neumáticos. No hay semáforos ni conductor inteligente para resolver todas las intersecciones. Los autos decorativos del visor no son estos cuerpos físicos.
- Árboles con colisión: opcionales; distribución procedural ilustrativa, no relevamiento real. La envolvente física del árbol es un cilindro conservador.
- Ruido y latencia de sensores: opciones para degradar lecturas en una simulación. Cambian el desafío; mantenerlas desactivadas para medir primero una referencia.
- Sombras, vegetación, tránsito visual y noche: opciones del visor.

Los fenómenos físicos están apagados por defecto para conservar una referencia reproducible. La semilla fija permite repetir las ráfagas. Las opciones físicas se aplican al iniciar o reiniciar PyBullet: el visor no es un motor PyBullet en el navegador.

## Cargar en PyBullet

Instalar pybullet y numpy. El módulo ciudad_pybullet.py ofrece cargar_ciudad(client, centro=None, radio=None, arboles=False), cargar_dron y rayos. `centro` y `radio` permiten cargar sólo un sector, conservando el tamaño real. Los edificios están descompuestos en prismas convexos estáticos para conservar patios y soportar colisiones con el nanodron; no se reemplazan por cajas que cierren los huecos reales.

Ejemplo mínimo de integración (el control de vuelo corresponde al entorno del equipo):

```python
import sys
from pathlib import Path
# Ejecutar desde la raíz del repositorio; en Colab usar carpeta_mapa.
sys.path.insert(0, str(Path.cwd() / 'simulacion'))
import pybullet as p
from ciudad_pybullet import cargar_ciudad, cargar_dron
from fisica_urbana import FisicaUrbana, configuracion

cfg = configuracion()
client = p.connect(p.DIRECT)
p.setGravity(0, 0, -9.81, physicsClientId=client)
p.setTimeStep(1 / 240, physicsClientId=client)
from fisica_urbana import crear_escenario
mapa, mundo = crear_escenario(client, cfg)
# inicio debe ser un punto libre verificado. No usar (0,0) sin comprobarlo.
# dron = cargar_dron(client, inicio)
# En cada subpaso físico, DESPUÉS de aplicar fuerzas de los motores:
# mundo.aplicar(1 / 240, dron_id=dron)
# p.stepSimulation(physicsClientId=client)
# Para sensores y contactos, incluir:
obstaculos = mapa['ids_obstaculos'] + mundo.ids_vehiculos
# lecturas = mundo.degradar_sensores(lecturas, alcance=0.5)
```

Con gym-pybullet-drones, el viento debe aplicarse en cada subpaso físico, no sólo una vez cada acción de la DQN. Se puede llamar a mundo.aplicar desde el método _physics de una clase derivada, después de super()._physics(rpm, nth_drone). No llamar p.stepSimulation fuera de env.step: el entorno ya lo hace. Recrear el mapa y FisicaUrbana después de cada resetSimulation del entorno. No se alteraron los notebooks originales.

## Dron del proyecto

Los notebooks adjuntos instancian HoverAviary sin cambiar drone_model; el valor por defecto es CF2X. Su URDF oficial especifica masa 0,027 kg, brazo 0,0397 m y cilindro de colisión de radio 0,06 m y longitud 0,025 m. El simulador añade márgenes de colisión; por eso el AABB medido es aproximadamente 0,124 × 0,124 × 0,029 m. El parámetro RADIO_DRON=0.06 del notebook coincide con ese radio. El control por velocidad original limita la velocidad a aproximadamente 0,25 m/s. El URDF y el modelo visual oficiales están incluidos.

## Integración con la DQN y responsabilidades

La entrega del mapa aporta geometría, escala, límites, colisiones, fuentes y opciones de física. El responsable del entorno/agente debe definir inicio y destino libres, duración de episodio, límites de vuelo y normalizaciones; incorporar los IDs de autos y árboles a sensores y contactos; y evaluar el checkpoint en esta distribución. Los notebooks nuevos tienen variantes de 84 y 88 entradas y distintas acciones: no se deben intercambiar sin verificar la configuración del modelo.

Este paquete NO demuestra que la DQN navegue en Nueva Córdoba. Los pesos .pt no están entre los archivos adjuntos. Los recorridos visuales no son inferencia ni entrenamiento. No se hizo un entrenamiento nuevo.

## Geografía y precisión

Origen local: latitud -31.427, longitud -64.1875. Proyección UTM 20S EPSG:32720 trasladada a ese origen; x este, y norte, z arriba en PyBullet. El visor y GLB usan x este, y arriba y z sur. Área de contexto: lon [-64.197, -64.173], lat [-31.437, -31.418]. El perímetro de Nueva Córdoba se incluye en limite_nueva_cordoba.geojson.

Fuentes de huellas: 823 partes de OSM, 6.313 de Overture y 802 adicionales de Microsoft. Overture incluye huellas de Google Open Buildings. Se priorizó OSM, se recortaron solapamientos con otras fuentes, se normalizó la precisión antes de triangular y se conservaron los patios.

Alturas: 40 valores height de OSM, 280 estimaciones a partir de pisos × 3 m, 6.064 estimaciones por edificios vecinos y 1.554 supuestos de 15 m. Ninguna altura fue verificada en campo. Fachadas, ventanas, equipamiento de azotea y torres añadidas a Capuchinos son interpretaciones visuales, no levantamientos arquitectónicos.

El terreno es plano. Se conservan calles, parques y patios: los espacios abiertos reales no se rellenan con construcciones inventadas. La auditoría automática no encontró manzanas grandes completamente sin huellas después de excluir calzadas y áreas verdes, pero esto NO verifica que estén todos los edificios. Las fuentes aéreas pueden omitir, fusionar o desplazar construcciones; falta cotejo con ortofoto/catastro y revisión de alturas. Árboles, postes, cables, balcones, desniveles e interiores no están relevados con exactitud.

## Otros archivos

- exportaciones/edificios.geojson: huellas georreferenciadas y procedencia por geometría.
- exportaciones/nueva_cordoba_lod1.glb: geometría LoD1 de edificios para Blender/motores 3D, en metros. No incluye texturas ni decoraciones del visor.
- docs/imagenes/cobertura_cartografica.png: plano de fuentes y límite barrial.
- exportaciones/sectores_a_revisar.geojson: resultado de la detección automática de grandes sectores sin huellas; no sustituye un control humano.
- validacion/resultado_ciudad.json: informe de las pruebas físicas completadas en Kaggle.
- validacion/resultado_colab.json: comprobación de las celdas computacionales de la notebook.

## Fuentes y atribución

© OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright
Overture Maps: https://docs.overturemaps.org/attribution/ ; los registros exportados conservan los nombres de sus fuentes. El extracto se obtuvo con el cliente oficial y catálogo STAC.
Microsoft Global ML Building Footprints, CDLA Permissive 2.0: https://github.com/microsoft/GlobalMLBuildingFootprints ; índice actualizado 2026-08-13, quadkey 210302322.
Límite barrial: Municipalidad de Córdoba / Dirección de Catastro, normalizado por OpenDataCordoba: https://github.com/OpenDataCordoba/barrios y https://gobiernoabierto.cordoba.gob.ar/data/datos-abiertos/categoria/geografia-y-mapas/barrios-de-la-ciudad/118
Dron: https://github.com/learnsyslab/gym-pybullet-drones ; archivos CF2X oficiales.
Three.js: MIT, licencia en vendor. Tipografías Barlow Condensed y DM Sans: SIL OFL, licencias en vendor.

Referencias del modelo de viento: ecuación de arrastre NASA Glenn https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/ y perfil de velocidad con altura NOAA https://www.csl.noaa.gov/projects/lamar/windshearformula.html . Los parámetros aerodinámicos y el exponente son configurables y no fueron calibrados con mediciones de Nueva Córdoba.
