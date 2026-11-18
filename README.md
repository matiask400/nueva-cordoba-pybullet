# Nueva Córdoba PyBullet

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/matiask400/nueva-cordoba-pybullet/blob/main/simulacion/Mapa_Nueva_Cordoba_Colab.ipynb)

Mapa urbano a escala real para probar el CF2X en PyBullet, con colisiones, sensores y opciones de viento y vehículos. **Para el equipo que trabaja en Colab, empezar en [`simulacion/`](simulacion/).**

Repositorio público: https://github.com/matiask400/nueva-cordoba-pybullet

## Usarlo en Colab — cinco pasos

1. Tocá **Abrir en Colab** arriba. No hace falta GPU.
2. Descargá el repositorio desde **Code → Download ZIP** en GitHub.
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
│   └── cf2.dae
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
| [`simulacion/`](simulacion/) | **Sí** | Los siete archivos: notebook, mapa, física, configuración y dron. |
| [`visor/`](visor/) | No | Visor 3D, tránsito decorativo, tipografías y bibliotecas web. |
| [`exportaciones/`](exportaciones/) | No | GLB para Blender y GeoJSON para GIS. |
| [`validacion/`](validacion/) | No | Informes de las pruebas y de cobertura. |
| [`tests/`](tests/) | No | Programa para repetir las pruebas. |
| [`docs/`](docs/) | No | Detalles técnicos, fuentes e imágenes. |

La notebook utiliza los otros seis archivos de `simulacion/`. No son siete programas que haya que ejecutar por separado. Subir el ZIP completo permite encontrarlos automáticamente.

## Configuración

Editar [`simulacion/configuracion.json`](simulacion/configuracion.json), o usar las opciones de la notebook. Desde el visor también se puede guardar esta misma configuración con el botón ⚙ y el servidor local.

- Viento simplificado: activación, dirección, velocidad, ráfagas y aumento con la altura. Activá también `viento.efecto_edificios.activo` para reducir el viento detrás de edificios cercanos.
- Autos físicos: activación, cantidad, masa y velocidad.
- Árboles: colisión opcional del arbolado ilustrativo.
- Sensores: ruido y latencia opcionales.
- Sector activo: centro y radio; 160 m es el valor inicial. Cargar toda la ciudad con física puede ser lento.

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

## Qué está verificado

- [Motor y colisiones](validacion/resultado_ciudad.json): rayos y contactos en 7.938 partes de construcciones; dinámica, viento y dos autos en un sector de 160 m.
- [Celdas de Colab](validacion/resultado_colab.json): ejecutadas en Kaggle con 146 construcciones, CF2X de 27 g, 4 contactos y 8 sensores. La selección interactiva del ZIP en Colab es manual.
- Repetir desde la raíz: `pip install -r requirements.txt` y `python tests/verificar_escenario.py`. Los informes nuevos se guardan en `validacion/`.

El CF2X tiene masa de 27 g y cilindro de colisión de 12 cm de diámetro por 2,5 cm de alto, más los márgenes internos de PyBullet.

## Precisión y licencias

Escenario aproximado: 7.938 huellas o partes, de las cuales 2.690 intersectan el barrio; no es un conteo verificado de edificios independientes. La mayoría de las alturas son estimadas, el terreno es plano y las fachadas y decoraciones son ilustrativas. No se ha verificado cada construcción ni evaluado la DQN en este mapa.

**Código: [MIT](LICENSE). Datos: [ODbL 1.0 y atribuciones](DATA_LICENSE.md).** Recursos externos: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Procedencia: [docs/MANIFEST.json](docs/MANIFEST.json).
