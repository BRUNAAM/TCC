import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs, getDoc, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./HistoricoScaa.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logopdf.png";
import "bootstrap-icons/font/bootstrap-icons.css";



const HistoricoScaa = () => {
    const [avaliacoes, setAvaliacoes] = useState([]);
    const navigate = useNavigate();

    const fetchAvaliacoes = async () => {
        const user = auth.currentUser;
        if (user) {
            const q = query(collection(db, "avaliacoes_scaa"), where("userId", "==", user.uid));
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
            await deleteDoc(doc(db, "avaliacoes_scaa", id));
            fetchAvaliacoes();
        }
    };

    const handlePrint = () => {
        window.print();
    };


    const handlePrintPDF = async (id) => {
        try {
            const docRef = doc(db, "avaliacoes_scaa", id);
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

                const titulo = "Avaliação Sensorial de Café - Método SCAA";
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
                        font: "times"
                    },
                    bodyStyles: {
                        font: "times",
                        textColor: 0
                    }
                });

                const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"];

                autoTable(docPDF, autoTableOptions({
                    head: [["Identificação", "Valor"]],
                    body: [
                        ["Avaliador", data.avaliador || "—"],
                        ["Data", new Date(data.data).toLocaleDateString("pt-BR")],
                        ["Fornecedor", data.fornecedor || "—"],
                        ["Nº Amostra", data.numeroAmostra || "—"],
                        ["Torra", data.torra || "—"],
                        [{ content: "Pontuação Final", styles: { fontStyle: "bold" } }, { content: data.pontuacaoFinal || "—", styles: { fontStyle: "bold" } }],
                        [{ content: "Notas Sensoriais", styles: { fontStyle: "bold" } }, { content: data.notasSensorias || "—", styles: { fontStyle: "bold" } }]
                    ]
                }));

                const corpoNotas = [
                    ["Aroma / Fragrância", data.notas?.AromaFragrancia ?? "—"],
                    ["Sabor", data.notas?.sabor ?? "—"],
                    ["Finalização", data.notas?.finalizacao ?? "—"],
                    ["Acidez", data.notas?.acidez ?? "—"],
                    ["Corpo", data.notas?.corpo ?? "—"],
                    ["Equilíbrio", data.notas?.equilibrio ?? "—"],
                    ["Avaliação Pessoal", data.notas?.avaliacaoPessoal ?? "—"]
                ];

                if (data.obsAcidez) {
                    corpoNotas.push(["Tipo de Acidez", data.obsAcidez]);
                }

                autoTable(docPDF, autoTableOptions({
                    head: [["Atributo Sensorial", "Nota"]],
                    body: corpoNotas
                }));

                const descontos = (data.defeitosLeves || 0) * 2 + (data.defeitosGraves || 0) * 4;

                autoTable(docPDF, autoTableOptions({
                    head: [["Critério", "Valor"]],
                    body: [
                        ["Dry", intensidades[data.dry] || "—"],
                        ["Break", intensidades[data.breakValue] || "—"],
                        ["Nível de Acidez", intensidades[data.nivelAcidez] || "—"],
                        ["Nível de Corpo", intensidades[data.nivelCorpo] || "—"],
                        ["Defeitos Leves", `-${(data.defeitosLeves || 0) * 2}`],
                        ["Defeitos Graves", `-${(data.defeitosGraves || 0) * 4}`],
                        ["Total de Pontos Descontados", `-${descontos}`]
                    ]
                }));

                docPDF.addPage();
                autoTable(docPDF, {
                    theme: "grid",
                    margin: { left: marginX, right: marginX },
                    startY: 20,
                    headStyles: {
                        fillColor: [3, 43, 67],
                        textColor: 255,
                        fontStyle: "bold",
                        font: "times"
                    },
                    bodyStyles: {
                        font: "times",
                        textColor: 0
                    },
                    head: [["Observações", "Conteúdo"]],
                    body: [["Observações Gerais", data.observacoes || "—"]]
                });

                const assinaturaY = docPDF.lastAutoTable.finalY + 30;
                const pageWidth = docPDF.internal.pageSize.getWidth();
                const linhaLargura = 80;
                const linhaInicioX = (pageWidth - linhaLargura) / 2;

                docPDF.line(linhaInicioX, assinaturaY, linhaInicioX + linhaLargura, assinaturaY);
                docPDF.setFont("times", "normal");
                docPDF.setFontSize(12);
                docPDF.text(`Avaliador: ${data.avaliador || "—"}`, pageWidth / 2, assinaturaY + 7, { align: "center" });

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
        <div className="historico-scaa-container">
            <div className="historico-header">
                <h2>Histórico de Avaliações SCAA</h2>
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
                            <th>Notas Sensoriais</th>
                            <th>Obs. Acidez</th>
                            <th>Pontuação final</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {avaliacoes.map(({ id, data, fornecedor, numeroAmostra, notasSensorias, obsAcidez, pontuacaoFinal }) => (
                            <tr key={id}>
                                <td>{new Date(data).toLocaleDateString("pt-BR")}</td>
                                <td>{fornecedor}</td>
                                <td>{numeroAmostra}</td>
                                <td>{notasSensorias}</td>
                                <td>{obsAcidez}</td>
                                <td>{pontuacaoFinal}</td>
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

export default HistoricoScaa;
