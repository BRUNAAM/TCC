import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs, getDoc, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./HistoricoCob.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logopdf.png"; // Importa o logo


const HistoricoCob = () => {
    const [avaliacoes, setAvaliacoes] = useState([]);
    const navigate = useNavigate();

    const fetchAvaliacoes = async () => {
        const user = auth.currentUser;
        if (user) {
            const q = query(collection(db, "avaliacoes_cob"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setAvaliacoes(data);
        }
    };

    useEffect(() => {
        fetchAvaliacoes();
    }, []);

    const handleDelete = async (id) => {
        const confirm = window.confirm("Deseja realmente excluir esta avaliação?");
        if (confirm) {
            await deleteDoc(doc(db, "avaliacoes_cob", id));
            fetchAvaliacoes();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePrintPDF = async (id) => {
        try {
            const docRef = doc(db, "avaliacoes_cob", id);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                alert("Documento não encontrado.");
                return;
            }

            const data = docSnap.data();
            const docPDF = new jsPDF();
            const img = new Image();
            img.src = logo;

            img.onload = () => {
                const marginX = 14;
                const boxX = marginX;
                const boxY = 10;
                const boxWidth = 210 - 2 * marginX;
                const boxHeight = 30;

                const titulo = "Avaliação Física de Café - Método COB";
                const logoWidth = 25;
                const logoHeight = 25;
                const spacing = 5;
                const tituloWidth = docPDF.getTextWidth(titulo);
                const contentWidth = logoWidth + spacing + tituloWidth;
                const startX = (docPDF.internal.pageSize.getWidth() - contentWidth) / 2;
                const centerY = boxY + boxHeight / 2;

                docPDF.rect(boxX, boxY, boxWidth, boxHeight);
                docPDF.addImage(img, "PNG", startX, centerY - logoHeight / 2, logoWidth, logoHeight);
                docPDF.setFont("times", "bold");
                docPDF.setFontSize(14);
                docPDF.text(titulo, startX + logoWidth + spacing, centerY + 5);

                const autoTableOptions = (config) => ({
                    ...config,
                    theme: "grid",
                    margin: { left: marginX, right: marginX },
                    startY: docPDF.lastAutoTable ? docPDF.lastAutoTable.finalY + 10 : boxY + boxHeight + 10,
                    headStyles: {
                        fillColor: [3, 43, 67],
                        textColor: 255,
                        fontStyle: "bold",
                        font: "times",
                    },
                    bodyStyles: {
                        font: "times",
                        textColor: 0,
                    },
                });

                autoTable(docPDF, autoTableOptions({
                    head: [["Identificação", "Valor"]],
                    body: [
                        ["Avaliador", data.avaliador || "—"],
                        ["Data", new Date(data.data).toLocaleDateString("pt-BR")],
                        ["Fornecedor", data.fornecedor || "—"],
                        ["Nº Amostra", data.numeroAmostra || "—"],
                        ["Umidade", data.umidade || "—"],
                        ["Aparelho", data.aparelho || "—"],
                        ["Subcategoria", data.subcategoria || "—"],
                        ["Tipo", data.tipo || "—"],
                        ["Tipo Café (Chato ou Moca)", data.tipoCafe || "—"],
                        ["Posto Serviço", data.postoServico || "—"],
                        ["Classificador MAPA", data.classificadorMapa || "—"],
                    ],
                }));

                const defeitosBody = Object.entries(data.defeitos || {}).map(
                    ([nome, qtd]) => [nome, qtd, data.equivalencias?.[nome] || 0]
                );

                autoTable(docPDF, autoTableOptions({
                    head: [["Defeito", "Quantidade", "Equivalência"]],
                    body: defeitosBody,
                }));

                autoTable(docPDF, autoTableOptions({
                    body: [
                        ["Total de Defeitos", Object.values(data.defeitos || {}).reduce((acc, val) => acc + val, 0)],
                        ["Total Equivalência", data.equivalenciaTotal],
                        ["Tipo do Café", data.tipo || "—"],
                    ],
                    head: [],
                }));

                autoTable(docPDF, autoTableOptions({
                    head: [["Categoria", "Valor"]],
                    body: [
                        ["Peneira/Subcategoria", (data.peneiraSubcategoria || []).join(", ") || "—"],
                        ["Grupo da Bebida", data.grupoBebida || "—"],
                        ["Subclassificação", data.subClassificacaoBebida || "—"],
                        ["Classe da Bebida", (data.classeBebida || []).join(", ") || "—"],
                    ],
                }));

                autoTable(docPDF, autoTableOptions({
                    head: [["Laudo Técnico", "Valor"]],
                    body: [
                        ["Preparo", data.peloPreparo || "—"],
                        ["Seca", data.pelaSeca || "—"],
                        ["Aspecto", data.peloAspecto || "—"],
                        ["Torra Arábica", data.torraArabica || "—"],
                        ["Torra Canephora", data.torraCanephora || "—"],
                        ["Teor Cafeína", data.teorCafeina || "—"],
                    ],
                }));

                autoTable(docPDF, autoTableOptions({
                    body: [["Observações", data.observacoes || "—"]],
                    head: [],
                }));

                // Assinatura
                const assinaturaY = docPDF.lastAutoTable.finalY + 30;
                const pageWidth = docPDF.internal.pageSize.getWidth();
                const linhaLargura = 80;
                const linhaInicioX = (pageWidth - linhaLargura) / 2;

                docPDF.line(linhaInicioX, assinaturaY, linhaInicioX + linhaLargura, assinaturaY);
                docPDF.setFont("times", "normal");
                docPDF.setFontSize(12);
                docPDF.text(`Avaliador: ${data.avaliador || "—"}`, pageWidth / 2, assinaturaY + 7, { align: "center" });
                docPDF.text(`Registro MAPA: ${data.classificadorMapa || "—"}`, pageWidth / 2, assinaturaY + 14, { align: "center" });

                // Abrir em nova aba
                const blob = docPDF.output("blob");
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
            };
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar PDF.");
        }
    };


    return (
        <div className="historico-cob-container">
            <div className="historico-header">
                <h2>Histórico de Avaliações COB</h2>
                <div className="botoes-topo">
                    <button className="botao-voltar" onClick={() => navigate(-1)} title="Voltar">
                        <i className="bi bi-arrow-return-left"></i>
                    </button>
                    <button className="botao-imprimir" onClick={handlePrint} title="Imprimir">
                        <i className="bi bi-printer"></i>
                    </button>
                </div>
            </div>

            {avaliacoes.length > 0 ? (
                <table className="avaliacoes-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Fornecedor</th>
                            <th>Nº Amostra</th>
                            <th>Tipo do Café</th> {/* novo */}
                            <th>Tipo de Bebida</th> {/* novo */}
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        {avaliacoes.map(({ id, data, fornecedor, numeroAmostra, tipo, grupoBebida, subClassificacaoBebida, }) => (
                            <tr key={id}>
                                <td>{new Date(data).toLocaleDateString("pt-BR")}</td>
                                <td>{fornecedor}</td>
                                <td>{numeroAmostra}</td>
                                <td>{tipo}</td> {/* mostra o tipo do café */}
                                <td>{grupoBebida ? `${grupoBebida} - ${subClassificacaoBebida}` : ""}</td> {/* tipo de bebida */}
                                <td className="celula-acoes">
                                    <div className="acoes-botoes">
                                        <button className="botao-excluir" onClick={() => handleDelete(id)} title="Excluir avaliação">
                                            <i className="bi bi-trash3"></i>
                                        </button>
                                        <button className="botao-imprimir-individual" onClick={() => handlePrintPDF(id)} title="Imprimir avaliação">
                                            <i className="bi bi-printer"></i>
                                        </button>
                                    </div>
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>
            ) : (
                <p className="sem-avaliacoes">Nenhuma avaliação encontrada.</p>
            )}
        </div>
    );
};

export default HistoricoCob;
