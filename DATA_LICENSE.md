# Licencia de datos geográficos

La base geográfica consolidada derivada de OpenStreetMap se distribuye bajo **Open Data Commons Open Database License 1.0 (ODbL-1.0)**:
https://opendatacommons.org/licenses/odbl/1-0/

Esto se aplica a `simulacion/ciudad.json`, `visor/ciudad.js`, `exportaciones/edificios.geojson` y los datos geográficos derivados de ellos. Los modelos derivados, como `exportaciones/nueva_cordoba_lod1.glb`, conservan la atribución de sus fuentes. La licencia MIT del código no sustituye las licencias de los datos o recursos de terceros.

Atribución visible: **© OpenStreetMap contributors, Overture Maps Foundation, Microsoft y las fuentes identificadas en los registros.**

Fuentes:

- OpenStreetMap: ODbL 1.0. https://www.openstreetmap.org/copyright
- Overture Maps, tema buildings: licencias y atribuciones por fuente, incluidas OpenStreetMap y Google Open Buildings. https://docs.overturemaps.org/attribution/
- Google Open Buildings: se usa su opción ODbL 1.0 para las huellas presentes en Overture. https://sites.research.google/open-buildings/
- Microsoft Global ML Building Footprints: CDLA Permissive 2.0 para sus datos de origen. https://github.com/microsoft/GlobalMLBuildingFootprints y https://cdla.dev/permissive-2-0/
- Límite barrial: Municipalidad de Córdoba / Dirección de Catastro, normalización de OpenDataCordoba. Se conserva la atribución y procedencia; no se atribuye propiedad del dato original al equipo. https://github.com/OpenDataCordoba/barrios

Los campos `source`, `source_datasets` y `height_source` identifican la procedencia de las huellas y de las alturas. El código no concede derechos sobre imágenes de Google Maps: las capturas aportadas por el usuario no están incluidas ni se usaron como texturas.

Las alturas interpoladas, fachadas y decoraciones son aproximaciones del proyecto; no son mediciones de campo ni un inventario catastral completo.

## Colores de techo del Buen Pastor

El campo `roof_rgb` del piloto se obtuvo del mosaico
[Mosaico_CBAFeb2021 de Mapas Córdoba](https://mapascordoba.gob.ar/viewer/mapa/357),
vuelo del Gran Córdoba de febrero de 2021, IDECOR / AGRISAT. Se recortó la capa
en EPSG:32720 y se resumieron los colores en el interior de las huellas.
Los colores derivados se ofrecen bajo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es)
según los [términos de Mapas Córdoba](https://www.idecor.gob.ar/terminos-y-condiciones/).
El archivo `buen-pastor-2021.jpg` es el recorte reproyectado y comprimido del mismo
mosaico. Se distribuye con la misma atribución y licencia.

Las divisiones marcadas como `division_ortofoto_aproximada` en
`footprint_adjustment` se guiaron por el mismo mosaico IDECOR / AGRISAT de 2021.
Las líneas de división interpretadas usan la atribución y licencia indicadas arriba.
