import React, { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs, getDoc, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./HistoricoScaa.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Printer } from "lucide-react";
import logo from "../assets/logopdf.png";


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
            const docRef = doc(db, "avaliacoes_scaa", id); // ajuste o nome da coleção se necessário
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
    
                // Margens padrão do autoTable
                const marginX = 14;
    
                // Cabeçalho: quadro com logo + título
                const boxX = marginX;
                const boxY = 10;
                const boxWidth = 210 - 2 * marginX; // largura total da página A4 com margens
                const boxHeight = 30;
    
                docPDF.setDrawColor(0); // cor da borda
                docPDF.rect(boxX, boxY, boxWidth, boxHeight); // desenha o quadro
    
                // Logo alinhado à esquerda dentro do quadro
                const logoWidth = 25;
                const logoHeight = 25;
                docPDF.addImage(img, "PNG", boxX + 2, boxY + 2.5, logoWidth, logoHeight);
    
                // Título ao lado do logo
                const titulo = "Avaliação Sensorial de Café - Método SCAA";
                docPDF.setFontSize(14);
                docPDF.setFont("helvetica", "bold");
                docPDF.text(titulo, boxX + logoWidth + 10, boxY + 18);
    
                // Configuração padrão para todas as tabelas
                const autoTableOptions = (config) => ({
                    ...config,
                    theme: "grid",
                    pageBreak: "avoid",
                    startY: docPDF.lastAutoTable ? docPDF.lastAutoTable.finalY + 10 : boxY + boxHeight + 10,
                    margin: { left: marginX, right: marginX }, // garante alinhamento com o quadro
                });

                // Seção: Identificação
                autoTable(docPDF, autoTableOptions({
                    head: [["Identificação", "Valor"]],
                    body: [
                        ["Avaliador", data.avaliador || "—"],
                        ["Data", new Date(data.data).toLocaleDateString("pt-BR")],
                        ["Fornecedor", data.fornecedor || "—"],
                        ["Nº Amostra", data.numeroAmostra || "—"],
                        ["Torra", data.torra || "—"],
                        [
                            { content: "Pontuação Final" },
                            { content: data.pontuacaoFinal || "—", styles: { fontStyle: "bold" } }
                          ],
                                              ],
                }));

                // Seção: Notas Sensoriais principais
                autoTable(docPDF, autoTableOptions({
                    head: [["Atributo Sensorial", "Nota"]],
                    body: [
                        ["Acidez", data.notas?.acidez ?? "—"],
                        ["Sabor", data.notas?.sabor ?? "—"],
                        ["Equilíbrio", data.notas?.equilibrio ?? "—"],
                        ["Finalização", data.notas?.finalizacao ?? "—"],
                        ["Corpo", data.notas?.corpo ?? "—"],
                        ["Aroma", data.notas?.aroma ?? "—"],
                    ],
                }));

                // Seção: Critérios Técnicos
                autoTable(docPDF, autoTableOptions({
                    head: [["Critério Técnico", "Valor"]],
                    body: [
                        ["Nível de Acidez", data.nivelAcidez ?? "—"],
                        ["Nível de Corpo", data.nivelCorpo ?? "—"],
                        ["Defeitos Leves", data.defeitosLeves ?? "—"],
                        ["Defeitos Graves", data.defeitosGraves ?? "—"],
                        ["Dry", data.dry ?? "—"],
                        ["Break", data.breakValue ?? "—"],
                    ],
                }));

                // Seção: Observações
                autoTable(docPDF, autoTableOptions({
                    body: [["Observações Gerais", data.observacoes || "—"]],
                    head: [],
                }));

                // Seção extra: Observação de acidez (se houver)
                if (data.obsAcidez) {
                    autoTable(docPDF, autoTableOptions({
                        body: [["Observação de Acidez", data.obsAcidez]],
                        head: [],
                    }));
                }

                // Finaliza e abre o PDF
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
                                <td>
                                    <button className="botao-excluir" onClick={() => handleDelete(id)}>
                                        EXCLUIR
                                    </button>
                                </td>
                                <td>
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

export default HistoricoScaa;
