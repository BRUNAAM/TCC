import { PDFDocument, StandardFonts } from 'pdf-lib';
import download from 'downloadjs';

const carregarPDF = async (url) => {
    const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());
    return await PDFDocument.load(existingPdfBytes);
};

const gerarPDFLaudo = async (dados) => {
    const [pdfFrente, pdfVerso] = await Promise.all([
        carregarPDF('/COB1.pdf'),
        carregarPDF('/COB2.pdf'),
    ]);

    const novaFrente = await PDFDocument.create();
    const novaVerso = await PDFDocument.create();

    const [paginaFrente] = await novaFrente.copyPages(pdfFrente, [0]);
    const [paginaVerso] = await novaVerso.copyPages(pdfVerso, [0]);

    const fonte = await novaFrente.embedFont(StandardFonts.Helvetica);

    const frente = novaFrente.addPage(paginaFrente);
    const verso = novaVerso.addPage(paginaVerso);

    // === FRENTE ===
    frente.drawText(dados.avaliador || '', {
        x: 160,
        y: 640,
        size: 11,
        font: fonte,
    });
    frente.drawText(dados.fornecedor || '', {
        x: 160,
        y: 640,
        size: 11,
        font: fonte,
    });
    frente.drawText(dados.numeroAmostra || '', {
        x: 160,
        y: 640,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Grão Preto"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Grão Preto"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Grão Ardido"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Concha"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Grãos Verdes"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Grãos Quebrados"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Grãos Brocados"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Grãos Granados ou Chocho"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Coco"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Marinheiro"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Pau, Pedra, Torrão Grande"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Pau, Pedra, Torrão Regular"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Pau, Pedra, Torrão Pequeno"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Casca Grande"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Casca Pequena"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Brocado Sujo"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Brocado Rendado"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Brocado Limpo"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });
    frente.drawText((dados.defeitos?.["Grão Esmagado"] || 0).toString(), {
        x: 190,
        y: 490,
        size: 11,
        font: fonte,
    });











    // === VERSO ===
    verso.drawText(dados.umidade ? `${dados.umidade}%` : '', { x: 115, y: 730, size: 11, font: fonte });
    verso.drawText(dados.aparelho || '', { x: 350, y: 730, size: 11, font: fonte });
    verso.drawText(dados.categoria || '', { x: 115, y: 710, size: 11, font: fonte });
    verso.drawText(dados.subcategoria || '', { x: 300, y: 710, size: 11, font: fonte });
    verso.drawText(dados.grupoBebida || '', { x: 115, y: 690, size: 11, font: fonte });
    verso.drawText(dados.subClassificacaoBebida || '', { x: 300, y: 690, size: 11, font: fonte });
    verso.drawText(dados.classeBebida?.join(', ') || '', { x: 115, y: 670, size: 11, font: fonte });
    verso.drawText(dados.tipo || '', { x: 300, y: 670, size: 11, font: fonte });

    // Observações
    verso.drawText(dados.observacoes || '', {
        x: 50,
        y: 600,
        size: 10,
        font: fonte,
        lineHeight: 12,
        maxWidth: 500,
    });

    // Juntando frente e verso
    const pdfFinal = await PDFDocument.create();
    const [fPg] = await pdfFinal.copyPages(novaFrente, [0]);
    const [vPg] = await pdfFinal.copyPages(novaVerso, [0]);

    pdfFinal.addPage(fPg);
    pdfFinal.addPage(vPg);

    const pdfBytes = await pdfFinal.save();
    download(pdfBytes, 'laudo-cafe.pdf', 'application/pdf');
};

export default gerarPDFLaudo;
