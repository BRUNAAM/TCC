import html2pdf from "html2pdf.js";

export const gerarPDF = (elementId = "avaliacao-completa", nomeArquivo = "avaliacao-cob.pdf") => {
    const elemento = document.getElementById(elementId);

    if (!elemento) {
        alert("Elemento não encontrado.");
        return;
    }

    const options = {
        margin: 0.5,
        filename: nomeArquivo,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 4 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(options).from(elemento).save();
};
