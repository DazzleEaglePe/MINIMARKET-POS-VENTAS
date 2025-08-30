import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
// Registrar fuentes para evitar PDFs en blanco por falta de vfs
// pdfFonts expone { pdfMake: { vfs } } o { vfs } según bundler
pdfMake.vfs = (pdfFonts?.pdfMake && pdfFonts.pdfMake.vfs) || pdfFonts.vfs;

const createPdf = async (props, output = "print") => {
  return new Promise((resolve, reject) => {
    try {
      const {
        pageSize = {
          width: 226.77,
          height: 841.88,
        },
        pageMargins = [5.66, 5.66, 5.66, 5.66],
        info = {},
        styles = {},
        content,
      } = props;
      const docDefinition = {
        pageSize, //TAMAÑO HOJA
        pageMargins, //MARGENES HOJA
        info, //METADATA PDF
        styles, //ESTILOS PDF
        content, // CONTENIDO PDF
      };
      if (output === "b64") {
        const pdfMakeCreatePdf = pdfMake.createPdf(docDefinition);
        pdfMakeCreatePdf.getBase64((data) => {
          resolve({
            success: true,
            content: data,
            message: "Archivo generado correctamente.",
          });
        });
        return;
      } else if (output === "print") {
        // Usar el flujo nativo de pdfMake para imprimir (mejor manejo de tamaños personalizados)
        const pdfMakeCreatePdf = pdfMake.createPdf(docDefinition);
        pdfMakeCreatePdf.print();
        resolve({ success: true, content: null, message: "Documento enviado a impresión." });
        return;
      } else if (output === "open") {
        // Abrir en nueva pestaña para diagnosticar contenido/tamaño
        const pdfMakeCreatePdf = pdfMake.createPdf(docDefinition);
        pdfMakeCreatePdf.open();
        resolve({ success: true, content: null, message: "Documento abierto." });
        return;
      } else if (output === "popup") {
        // Abrir en una ventana emergente centrada con el PDF embebido en un iframe
        const pdfMakeCreatePdf = pdfMake.createPdf(docDefinition);
        pdfMakeCreatePdf.getBlob((blob) => {
          try {
            const url = URL.createObjectURL(blob);

            // Dimensiones sugeridas para ticket (ajustables)
            const winWidth = 420; // px ~ pensando en 80mm
            const winHeight = 740; // px

            const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
            const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;

            const left = Math.max(0, dualScreenLeft + (viewportWidth - winWidth) / 2);
            const top = Math.max(0, dualScreenTop + (viewportHeight - winHeight) / 2);

            const features = [
              `width=${winWidth}`,
              `height=${winHeight}`,
              `left=${left}`,
              `top=${top}`,
              "resizable=yes",
              "scrollbars=no",
              "toolbar=no",
              "menubar=no",
              "location=no",
              "status=no",
            ].join(",");

            const popup = window.open("", "TicketPreview", features);
            if (!popup) {
              // Fallback si el navegador bloquea popups
              pdfMakeCreatePdf.open();
              resolve({ success: true, content: null, message: "Popup bloqueada; se abrió en nueva pestaña." });
              return;
            }

            popup.document.write(`<!DOCTYPE html>
              <html lang="es">
                <head>
                  <meta charset="utf-8" />
                  <title>Ticket</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <style>
                    html, body { height: 100%; margin: 0; background: #fff; }
                    iframe { border: 0; width: 100%; height: 100%; }
                  </style>
                </head>
                <body>
                  <iframe src="${url}" title="Ticket"></iframe>
                </body>
              </html>`);
            popup.document.close();

            resolve({ success: true, content: null, message: "Documento abierto en ventana emergente." });
          } catch (err) {
            // Cualquier error al crear el popup: intentar abrir en nueva pestaña
            const pdfMakeCreatePdfFallback = pdfMake.createPdf(docDefinition);
            pdfMakeCreatePdfFallback.open();
            resolve({ success: true, content: null, message: "No se pudo abrir popup; abierto en nueva pestaña." });
          }
        });
        return;
      }
      reject({
        success: false,
        content: null,
        message: "Debes enviar tipo salida.",
      });
    } catch (error) {
      reject({
        success: false,
        content: null,
        message: error?.message ?? "No se pudo generar el proceso.",
      });
    }
  });
};
export default createPdf;
