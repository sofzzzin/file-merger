# PDF Unifier

Aplicación web para unir PDFs e imágenes en un solo archivo PDF directamente desde el navegador.

## Características

- Sube archivos PDF, PNG y JPG/JPEG.
- Procesa los documentos completamente en el navegador.
- Agrega archivos a una biblioteca y arrástralos al lienzo.
- Reordena páginas por arrastre.
- Selecciona múltiples páginas y envía o elimina en bloque.
- Exporta el resultado final como un PDF unido, o en **lotes** (un PDF por sección en un ZIP).
- Incluye papelera de reciclaje para recuperar elementos eliminados.

## Estructura del proyecto

```text
pdf-unifier/
├── index.html
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── upload.css
│   ├── workspace.css
│   ├── library.css
│   ├── canvas.css
│   ├── lightbox.css
│   ├── modals.css
│   └── responsive.css
├── js/
│   ├── main.js
│   ├── state.js
│   ├── ui/
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── lightbox.js
│   │   ├── zoom.js
│   │   └── selectionBar.js
│   ├── upload/
│   │   ├── uploader.js
│   │   ├── pdfProcessor.js
│   │   └── imageProcessor.js
│   ├── library/
│   │   ├── library.js
│   │   ├── rename.js
│   │   ├── dragLibrary.js
│   │   └── trashLibrary.js
│   ├── canvas/
│   │   ├── canvas.js
│   │   ├── renderPages.js
│   │   ├── dragCanvas.js
│   │   ├── selection.js
│   │   ├── pageNavigation.js
│   │   └── reorder.js
│   ├── trash/
│   │   └── trash.js
│   ├── export/
│   │   └── exportPDF.js
│   └── utils/
│       ├── helpers.js
│       ├── ids.js
│       └── constants.js
├── assets/
│   ├── icons/
│   └── images/
└── README.md
```

## Requisitos

- Un navegador moderno con soporte para JavaScript.


## Cómo ejecutar localmente

1. Abre la carpeta del proyecto en tu editor.
2. Inicia un servidor web local. Por ejemplo, con Python:

```bash
python -m http.server 4173
```

3. Abre en tu navegador:

```text
http://localhost:4173/
```

> También puedes usar cualquier otro servidor estático (como Live Server en VS Code o `npx serve`).

## Uso

1. Sube uno o varios archivos PDF, PNG o JPG/JPEG.
2. Los archivos aparecerán en la biblioteca.
3. Arrastra los elementos al lienzo para armarlos en el orden deseado.
4. Reordena o elimina páginas según necesites.
5. Haz clic en Exportar PDF para generar el archivo final.

## Notas

- Todo el procesamiento se realiza localmente en el navegador.
- Los archivos nunca se envían a un servidor.
- No se requiere conexión a internet para utilizar la aplicación una vez abiertos los archivos del proyecto.
- La exportación del documento se realiza mediante PDF-lib.
- La descarga en lotes empaca los PDFs en un ZIP mediante JSZip.
  
## Créditos

- PDF.js
- PDF-lib
- JSZip
