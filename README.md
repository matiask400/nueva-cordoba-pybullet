# Nueva Córdoba PyBullet

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/matiask400/nueva-cordoba-pybullet/blob/dev/simulacion/Mapa_Nueva_Cordoba_Colab.ipynb)

Mapa urbano a escala real para probar el CF2X en PyBullet, con colisiones, sensores y opciones de viento y vehículos. **Para el equipo que trabaja en Colab, empezar en [`simulacion/`](simulacion/).**

Repositorio público: https://github.com/matiask400/nueva-cordoba-pybullet

## Funcionalidades

| Funcionalidad | Qué incluye |
|---|---|
| Mapa urbano a escala real | Huellas de edificios, patios, calles, parques y lugares de referencia de Nueva Córdoba. |
| Dron CF2X en PyBullet | Modelo físico del Crazyflie con masa de 27 g, colisiones con suelo y edificios y ocho sensores horizontales de distancia. |
| Carga del escenario | Sector fijo, ciudad completa o carga de edificios por chunks que siguen al dron. Se pueden ajustar el tamaño, el radio y la retención de los chunks. |
| Viento configurable | Fuerza sobre el dron, ráfagas reproducibles y variación con la altura. El abrigo opcional de edificios reduce el viento detrás de fachadas cercanas. |
| Vehículos y árboles | Autos opcionales con masa, ruedas motorizadas y colisiones. El arbolado ilustrativo también puede tener colisión. |
| Sensores configurables | Ruido y latencia opcionales para las lecturas de distancia. |
| Visor 3D | Vista aérea y a nivel de calle, recorrido por lugares, minimapa, peatones, sendas, fachadas ilustrativas, ortofoto en techos del Buen Pastor e inspección de fuentes y alturas. |
| Exportaciones y pruebas | GeoJSON para GIS, GLB para Blender, notebook de demostración, informes y un script de verificación. |

El viento, el abrigo de edificios, los autos físicos, las colisiones de árboles y la carga por chunks se activan por separado. El ruido y la latencia empiezan en cero. Las opciones físicas se aplican en PyBullet. Para probar la DQN del equipo en el escenario, hace falta integrar su entorno y cargar su checkpoint.

## Usarlo en Colab — cinco pasos

1. Tocá **Abrir en Colab** arriba. No hace falta GPU.
2. Descargá el repositorio desde **Code → Download ZIP** en la [rama dev](https://github.com/matiask400/nueva-cordoba-pybullet/tree/dev).
3. Ejecutá las celdas en orden: instalación y carga de archivos. Cuando se solicite, subí el **ZIP completo**, sin extraerlo.
4. Elegí viento, autos, arbolado, ruido, latencia y radio del sector; los efectos físicos empiezan apagados.
5. Ejecutá la prueba del mapa, el dron y los sensores.

También podés abrir Colab → **Archivo → Subir notebook** y elegir `simulacion/Mapa_Nueva_Cordoba_Colab.ipynb` del ZIP extraído.

**La notebook es una demostración del escenario.** No incluye pesos de una DQN ni ejecuta un vuelo autónomo. La conexión con el agente se explica en la [guía técnica](docs/GUIA_TECNICA.md).

## Dónde está cada cosa

```text
nueva-cordoba-pybullet/
├── README.md                  ← empezar acá
├── simulacion/                ← todo lo que necesita Colab/PyBullet
│   ├── Mapa_Nueva_Cordoba_Colab.ipynb
│   ├── ciudad_pybullet.py
│   ├── fisica_urbana.py
│   ├── configuracion.json     ← editar opciones físicas acá
│   ├── ciudad.json
│   ├── cf2x.urdf
│   ├── cf2.dae
│   └── texturas/              ← ortofoto de los techos del piloto
├── visor/                     ← presentación visual en el navegador
│   ├── index.html
│   ├── abrir_visor.py
│   └── ...
├── exportaciones/             ← archivos para Blender y herramientas GIS
├── validacion/                ← resultados y cobertura
├── tests/                     ← repetir las comprobaciones
├── docs/                      ← guía técnica, procedencia e imágenes
├── requirements.txt           ← instalación local
└── LICENSE, DATA_LICENSE.md, THIRD_PARTY_NOTICES.md
```

| Carpeta | ¿Hace falta para usar Colab? | Contenido |
|---|---|---|
| [`simulacion/`](simulacion/) | **Sí** | Notebook, geometría, física, configuración, modelo del dron y textura de techos. |
| [`visor/`](visor/) | No | Visor 3D, tránsito decorativo, tipografías y bibliotecas web. |
| [`exportaciones/`](exportaciones/) | No | GLB para Blender y GeoJSON para GIS. |
| [`validacion/`](validacion/) | No | Informes de las pruebas y de cobertura. |
| [`tests/`](tests/) | No | Programa para repetir las pruebas. |
| [`docs/`](docs/) | No | Detalles técnicos, fuentes e imágenes. |

Ejecutá las celdas de la notebook y subí el ZIP completo para que encuentre las dependencias en `simulacion/`.

## Configuración

Editá [`simulacion/configuracion.json`](simulacion/configuracion.json) o abrí **⚙ Configuración** en el visor. El servidor local puede guardar los cambios directamente. El visor estático descarga el archivo para copiarlo a `simulacion/`. Las celdas de Colab pueden reemplazar valores para esa ejecución. Reiniciá el escenario de PyBullet después de cambiar opciones físicas.

| Sección | Opciones |
| --- | --- |
| `visual` | `vegetacion`, `trafico`, `peatones`, `cantidad_peatones` (0–250), `sendas`, `texturas_techos`, `texturas_fachadas`, `detalles_azotea`, `sombras`, `noche`. Las fachadas, sendas, peatones y accesorios son del visor. `texturas_techos` también se aplica en PyBullet al usar `crear_escenario`. |
| `escala` | `divisor` (1–30) y `altura_minima_edificio_m` opcional en metros simulados. |
| `sector` | `centro_m` como coordenadas locales X, Y en metros reales, `radio_m` en metros reales, `cargar_todo`. El centro vacío usa el Buen Pastor. |
| `chunks` | `activo`, `tamano_m` en metros reales, `radio_chunks`, `retencion_chunks`. |
| `viento` | `activo`, `velocidad_referencia_m_s`, `altura_referencia_m`, `exponente_altura`, `direccion_grados`, `intensidad_rafagas`, `tiempo_correlacion_s`, `densidad_aire_kg_m3`, `cd_area_m2`, `fuerza_maxima_N`. |
| `viento.efecto_edificios` | `activo`, `alcance_m`, `reduccion_maxima` como fracción de 0 a 1. |
| `vehiculos` | `activos`, `cantidad`, `velocidad_m_s`, `masa_kg`, `torque_motor_Nm`. |
| `arboles` y `sensores` | `arboles.colisiones`, `sensores.ruido_sigma_m`, `sensores.latencia_ms`. |
| `semilla` | Entero que permite repetir la aleatoriedad de la simulación. |

En el visor usá **Peatones** para mostrar u ocultar las figuras y **Ver peatones de cerca** para enfocar un cruce del Buen Pastor. Cuando guardás desde ⚙, se aplican los cambios visuales en el visor.

Con `chunks.activo`, PyBullet carga edificios en una cuadrícula que sigue al dron.
`tamano_m` fija el lado de cada celda, `radio_chunks` cuenta las celdas vecinas en cada dirección y
`retencion_chunks` mantiene un anillo extra para evitar recargas al cruzar bordes.
Usá `mundo.aplicar(..., dron_id)` para actualizar la ventana durante el vuelo y consultá
`mundo.ids_obstaculos` en cada lectura. La opción de ciudad completa tiene prioridad.
El suelo, los autos, los árboles y los adornos no se cargan por chunks. La carga inicial toma
el centro configurado hasta recibir la posición del dron.

El viento urbano usa tres rayos hacia el origen del viento a la altura del dron. Cuanto más cerca
está la fachada que lo protege, más baja la fuerza del viento. Por encima del techo desaparece
esa protección. Esta aproximación modela abrigo y requiere que la fachada esté cargada.
Para un alcance de 30 m, usá celdas de 50 m y un radio de al menos 1 chunk.
Ambas opciones nuevas arrancan apagadas y se pueden activar desde Colab o el JSON.

Los cambios físicos se aplican al iniciar o reiniciar PyBullet. Los autos del visor son decorativos; los autos físicos se crean en PyBullet.

## Ver el mapa en el navegador

La [demo publicada](https://matiask400.github.io/nueva-cordoba-pybullet/visor/) puede corresponder a la versión estable. Para ver los cambios de desarrollo, ejecutá el visor desde una copia de `dev`.

Abrí [`visor/index.html`](visor/index.html) después de descargar y extraer el repositorio. Para guardar configuración e imágenes en sus carpetas, ejecutar desde la raíz:

```bash
python3 visor/abrir_visor.py
```

Abrir http://127.0.0.1:8766. Arrastrar: orbitar; rueda: acercar; W/A/S/D: mover; Q/E: altura. El recorrido mueve la cámara, no un agente entrenado.

![Vista general del escenario](docs/imagenes/vista_del_visor.png)

## Integrarlo con el agente del equipo

Después de ejecutar las celdas de carga de archivos de la notebook, la ruta de `simulacion/` queda preparada y se puede usar:

```python
from fisica_urbana import configuracion, crear_escenario
cfg = configuracion()
mapa, mundo = crear_escenario(env.CLIENT, cfg)
ids_obstaculos = mundo.ids_obstaculos  # consultar en cada lectura de sensores o contactos
```

Reemplazar la generación de edificios artificiales por esta carga y recrearla después de cada reinicio de PyBullet. Aplicar `mundo.aplicar(1 / self.PYB_FREQ, dron_id)` en cada subpaso físico, además de las fuerzas de los motores. El responsable del agente debe revisar inicio/destino, límites, duración y observaciones antes de cargar su checkpoint. Ver la [guía técnica](docs/GUIA_TECNICA.md).

### Usar el notebook de seguimiento del equipo

Ese notebook usa su propia clase `MapaEscalado`. En Colab, cloná esta versión con:

```bash
git clone --branch dev https://github.com/matiask400/nueva-cordoba-pybullet.git /content/nueva-cordoba-pybullet
```

Conservá `ESCALA_MAPA = 1 / 30`, `LADO_SECTOR_M = 72.0`, `CENTRO_SECTOR = (220.0, -170.0)` y `ALTURA_MIN_EDIF = 2.2` para reproducir su sector de Plaza España a escala 1:30. El medio lado simulado es 2,4 m. Esa clase lee la geometría y aplica sus propios parámetros. Las opciones del JSON se usan cuando se carga el escenario con `crear_escenario`. Se comprobó la generación de 30 escenarios con árboles y 30 sin ellos. Los informes de motor citados abajo corresponden a una revisión anterior. La DQN y el vuelo con el mapa actual siguen pendientes de prueba en PyBullet real.

## Qué está verificado

- [Motor y colisiones](validacion/resultado_ciudad.json): rayos y contactos en 7.938 partes de construcciones; dinámica, viento y dos autos en un sector de 160 m.
- [Celdas de Colab](validacion/resultado_colab.json): ejecutadas en Kaggle con 146 construcciones, CF2X de 27 g, 4 contactos y 8 sensores. La selección interactiva del ZIP en Colab es manual.
- Repetir desde la raíz: `pip install -r requirements.txt` y `python tests/verificar_escenario.py`. Los informes nuevos se guardan en `validacion/`.

El CF2X tiene masa de 27 g y cilindro de colisión de 12 cm de diámetro por 2,5 cm de alto, más los márgenes internos de PyBullet.

## Precisión y licencias

El mapa de desarrollo contiene 7.951 huellas o partes, de las cuales 2.703 intersectan el barrio. Una construcción puede estar dividida en varias partes. La mayoría de las alturas son estimadas, el terreno es plano y las fachadas y decoraciones son ilustrativas. No se ha verificado cada construcción ni evaluado la DQN en este mapa.

**Código: [MIT](LICENSE). Datos: [ODbL 1.0 y atribuciones](DATA_LICENSE.md).** Recursos externos: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Procedencia: [docs/MANIFEST.json](docs/MANIFEST.json).

## Escala para comparar con el entorno anterior

En Colab, ajustá `DIVISOR_MAPA` entre 1 y 30. Con 30, el sector se reubica en el origen y 30 m del mapa equivalen a 1 m simulado. Para reproducir el ajuste de alturas de la prueba del equipo, activá también `ALTURA_MINIMA_2_2_M`. Los equivalentes en JSON están en `escala.divisor` y `escala.altura_minima_edificio_m`. La escala aplica a la geometría del mapa. El CF2X, los sensores y las velocidades configuradas se expresan en unidades de simulación. En sectores reducidos conviene empezar con autos apagados por su tamaño físico.

El [recorte del Buen Pastor](docs/REVISION_BUEN_PASTOR.md) reúne las huellas para revisión con ortofoto.

### Piloto de fotointerpretación en el Buen Pastor

El visor proyecta la ortofoto IDECOR / AGRISAT de febrero de 2021 sobre los
techos de 50 edificios. El recorte cubre 235 × 250 m a 25 cm por píxel de
muestreo. PyBullet carga esa misma textura con `visual=True` cuando el archivo
está disponible junto al mapa. El color promedio queda como respaldo.
El visor usa fachadas ilustrativas con ladrillo, revoque, vidrio y balcones.

La superposición permitió revisar el Paseo del Buen Pastor y los Capuchinos.
Hay bordes desplazados entre techo y huella y zonas difíciles de interpretar por
sombras y solapamientos. Las huellas y alturas del escenario conservan sus fuentes
originales hasta contar con evidencia de la base y con datos de altura.


El visor y PyBullet comparten cuatro huellas ajustadas a los anchos estimados
de las calzadas de Achával Rodríguez, Independencia y Boulevard Chacabuco.
En Achával Rodríguez el recorte generó dos volúmenes. Estos ajustes conservan
las alturas anteriores y figuran como `footprint_adjustment` en los datos.

Con la ortofoto de 2021 se dividieron otras tres huellas agrupadas. Las
separaciones siguen cambios visibles entre cubiertas y son aproximadas.
El visor usa alturas ilustrativas en algunas partes. PyBullet conserva las
alturas de colisión originales en esas divisiones. Se retiraron dos torres
decorativas fuera de la huella de los Capuchinos y se filtraron los accesorios
de azotea sin apoyo dentro de su edificio.


Una segunda revisión contrastó las huellas con la ortofoto y recortó siete
edificios que ocupaban la calzada en Pasaje Carlucci, Obispo Trejo y Sanabria,
Buenos Aires, Ituzaingó y Pasaje España. El control de calidad recorre calles
residenciales, primarias, secundarias, terciarias, sin clasificar y calles de
convivencia dentro del barrio. Marca tramos de eje de 5 m o más que penetran
más de 0,8 m en la huella. Los anchos de calzada siguen siendo aproximados.


La revisión de veredas ajustó 325 huellas al corredor de calzada y vereda
representado en el mapa. Las veredas del visor tienen un ancho estimado de
2,3 m por lado. Hay 149 solapes pendientes de contrastar con datos de obra o
imágenes de mayor detalle. El visor anima a 250 peatones, incluidos 180 en
tramos de vereda comprobados contra las huellas.
