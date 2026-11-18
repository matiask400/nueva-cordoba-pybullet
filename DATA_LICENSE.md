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
