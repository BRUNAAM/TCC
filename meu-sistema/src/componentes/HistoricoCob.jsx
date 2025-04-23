import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs, getDoc, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./HistoricoCob.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Printer } from "lucide-react";
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
            const img = new Image();
            img.src = logo;

            img.onload = () => {
                const docPDF = new jsPDF();

                // Margens compatíveis com autoTable
                const marginX = 14;
                const boxX = marginX;
                const boxY = 10;
                const boxWidth = 210 - 2 * marginX;
                const boxHeight = 30;

                // Quadro com logo + título
                docPDF.setDrawColor(0);
                docPDF.rect(boxX, boxY, boxWidth, boxHeight);

                const logoWidth = 25;
                const logoHeight = 25;
                docPDF.addImage(img, "PNG", boxX + 2, boxY + 2.5, logoWidth, logoHeight);

                const titulo = "Avaliação Física de Café - Método COB";
                docPDF.setFontSize(14);
                docPDF.setFont("helvetica", "bold");
                docPDF.text(titulo, boxX + logoWidth + 10, boxY + 18);

                // Posição inicial para as tabelas
                const autoTableOptions = (config) => ({
                    ...config,
                    theme: "grid",
                    pageBreak: "avoid",
                    margin: { left: marginX, right: marginX },
                    startY: docPDF.lastAutoTable ? docPDF.lastAutoTable.finalY + 10 : boxY + boxHeight + 10,
                });

                // Seção 1: Identificação
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
                        ["Posto Serviço", data.postoServico || "—"],
                        ["Classificador MAPA", data.classificadorMapa || "—"],
                    ],
                }));

                // Seção 2: Defeitos
                const defeitosBody = Object.entries(data.defeitos || {}).map(
                    ([nome, qtd]) => [nome, qtd, data.equivalencias?.[nome] || 0]
                );

                autoTable(docPDF, autoTableOptions({
                    head: [["Defeito", "Quantidade", "Equivalência"]],
                    body: defeitosBody,
                }));

                // Seção 3: Totais e tipo
                autoTable(docPDF, autoTableOptions({
                    body: [
                        ["Total de Equivalência", data.equivalenciaTotal || 0],
                        ["Tipo do Café", data.tipo || "—"],
                    ],
                    head: [],
                }));

                // Seção 4: Categoria
                autoTable(docPDF, autoTableOptions({
                    head: [["Categoria", "Valor"]],
                    body: [
                        ["Peneira/Subcategoria", data.peneiraSubcategoria?.join(", ") || "—"],
                        ["Grupo da Bebida", data.grupoBebida || "—"],
                        ["Subclassificação", data.subClassificacaoBebida || "—"],
                        ["Classe da Bebida", data.classeBebida?.join(", ") || "—"],
                    ],
                }));

                // Seção 5: Laudo Técnico
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

                // Seção 6: Observações
                autoTable(docPDF, autoTableOptions({
                    body: [["Observações", data.observacoes || "—"]],
                    head: [],
                }));

                // Abrir PDF em nova aba
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
                    <button className="botao-voltar" onClick={() => navigate(-1)}>VOLTAR</button>
                    <button className="botao-imprimir" onClick={handlePrint}>IMPRIMIR</button>
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
                                <div className="acoes-botoes">
                                    <button className="botao-excluir" onClick={() => handleDelete(id)} title="Excluir avaliação">
                                        <i className="bi bi-trash3"></i>
                                    </button>
                                    <button className="botao-imprimir-individual" onClick={() => handlePrintPDF(id)} title="Imprimir avaliação">
                                        <i className="bi bi-printer"></i>
                                    </button>
                                </div>
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
