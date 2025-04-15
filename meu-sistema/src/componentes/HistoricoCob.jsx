import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs, getDoc, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./HistoricoCob.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Printer } from "lucide-react";

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
            console.log(data)
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

            if (docSnap.exists()) {
                const data = docSnap.data();
                const docPDF = new jsPDF();
              
                // Título centralizado
                const titulo = "Avaliação Física de Café - Método COB";
                const pageWidth = docPDF.internal.pageSize.getWidth();
                const textX = (pageWidth - docPDF.getTextWidth(titulo)) / 2;
                docPDF.setFontSize(16);
                docPDF.setFont("helvetica", "bold");
                docPDF.text(titulo, textX, 20);
              
                // Seção 1: Identificação
                autoTable(docPDF, {
                  startY: 30,
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
                  theme: "grid", pageBreak: 'avoid'
                });
              
                // Seção 2: Defeitos
                const defeitosBody = Object.entries(data.defeitos || {}).map(
                  ([nome, qtd]) => [nome, qtd, data.equivalencias?.[nome] || 0]
                );
              
                autoTable(docPDF, {
                  startY: docPDF.lastAutoTable.finalY + 10,
                  head: [["Defeito", "Quantidade", "Equivalência"]],
                  body: defeitosBody,
                  theme: "grid", pageBreak: 'avoid'
                });
              
                // Totais e tipo
                autoTable(docPDF, {
                  startY: docPDF.lastAutoTable.finalY + 10,
                  body: [
                    ["Total de Equivalência", data.equivalenciaTotal || 0],
                    ["Tipo do Café", data.tipo || "—"],
                  ],
                  head: [],
                  theme: "grid",pageBreak: 'avoid'
                });
              
                // Categoria
                autoTable(docPDF, {
                  startY: docPDF.lastAutoTable.finalY + 10,
                  head: [["Categoria", "Valor"]],
                  body: [
                    ["Peneira/Subcategoria", data.peneiraSubcategoria?.join(", ") || "—"],
                    ["Grupo da Bebida", data.grupoBebida || "—"],
                    ["Subclassificação", data.subClassificacaoBebida || "—"],
                    ["Classe da Bebida", data.classeBebida?.join(", ") || "—"],
                  ],
                  theme: "grid",pageBreak: 'avoid'
                });
              
                // Laudo Técnico
                autoTable(docPDF, {
                  startY: docPDF.lastAutoTable.finalY + 10,
                  head: [["Laudo Técnico", "Valor"]],
                  body: [
                    ["Preparo", data.peloPreparo || "—"],
                    ["Seca", data.pelaSeca || "—"],
                    ["Aspecto", data.peloAspecto || "—"],
                    ["Torra Arábica", data.torraArabica || "—"],
                    ["Torra Canephora", data.torraCanephora || "—"],
                    ["Teor Cafeína", data.teorCafeina || "—"],
                  ],
                  theme: "grid",pageBreak: 'avoid'
                });
              
                // Observações
                autoTable(docPDF, {
                  startY: docPDF.lastAutoTable.finalY + 10,
                  body: [["Observações", data.observacoes || "—"]],
                  theme: "grid",pageBreak: 'avoid',
                  head: [],
                });
              
                // Abrir PDF
                const blob = docPDF.output("blob");
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
              } else {
                alert("Documento não encontrado.");
              }
              
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
                                <td>
                                    <button className="botao-excluir" onClick={() => handleDelete(id)}>
                                        EXCLUIR
                                    </button>
                                </td>
                                <td>
                                    <button className="botao-excluir" onClick={() => handleDelete(id)}>
                                        EXCLUIR
                                    </button>
                                    <button className="botao-imprimir-individual" onClick={() => handlePrintPDF(id)}>
                                        <Printer size={16} /> {/* ícone opcional */}
                                    </button>
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
