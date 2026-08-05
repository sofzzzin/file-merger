-# TODO: Efecto de pila visible al arrastrar múltiples elementos a la biblioteca

## Pasos
- [x] 1. Agregar elemento `#dragStackOverlay` en `index.html`
- [x] 2. Agregar estilos CSS para la pila de tarjetas en `css/library.css`
- [x] 3. Implementar lógica JS en `js/library/dragLibrary.js` para mostrar/ocultar/posicionar el overlay
- [x] 4. Probar el flujo (arrastrar archivos y páginas múltiples)

## Notas
- El overlay `#dragStackOverlay` se muestra fijo en el cursor al arrastrar elementos sobre la biblioteca.
- Muestra una pila de tarjetas apiladas (efecto mazo de cartas) con un badge de conteo.
- Soporta: archivos del sistema (OS), varias páginas del lienzo (`canvas-multi`) y una página individual (`canvas`).
- Se oculta automáticamente en `dragleave`, `drop` y `dragend`.
