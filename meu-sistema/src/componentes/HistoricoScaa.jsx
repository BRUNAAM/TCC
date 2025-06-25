"use client"

import "./HistoricoScaa.css"
import { useState, useEffect } from "react"
import { auth, db } from "../config/firebase"
import { deleteDoc, doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import logo from "../assets/logopdf.png"
import "bootstrap-icons/font/bootstrap-icons.css"
import { useData } from "../context/DataContext"

const HistoricoScaa = () => {
    // ✅ USANDO DADOS DO CONTEXTO
    const { avaliacoesSCAA, loading: dataLoading, refreshData } = useData()

    const [selectedAvaliacoes, setSelectedAvaliacoes] = useState({})
    const [hasSelected, setHasSelected] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const navigate = useNavigate()

    // ✅ REMOVIDO: fetchAvaliacoes - agora usa dados do contexto
    // ✅ REMOVIDO: estados loading, error, avaliacoes - agora vem do contexto

    useEffect(() => {
        // Limpar seleções quando os dados mudarem
        setSelectedAvaliacoes({})
        setHasSelected(false)
    }, [avaliacoesSCAA])

    // Função para manipular a seleção da caixa de seleção
    const handleSelectAvaliacao = (id) => {
        const newSelected = { ...selectedAvaliacoes }

        if (newSelected[id]) {
            delete newSelected[id]
        } else {
            newSelected[id] = true
        }

        setSelectedAvaliacoes(newSelected)
        setHasSelected(Object.keys(newSelected).length > 0)
    }

    // Função para selecionar/desselecionar todas as avaliações
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelected = {}
            avaliacoesSCAA.forEach((avaliacao) => {
                newSelected[avaliacao.id] = true
            })
            setSelectedAvaliacoes(newSelected)
            setHasSelected(true)
        } else {
            setSelectedAvaliacoes({})
            setHasSelected(false)
        }
    }

    // Função para excluir múltiplas avaliações
    const handleDeleteSelected = async () => {
        const selectedIds = Object.keys(selectedAvaliacoes)
        if (selectedIds.length === 0) {
            alert("Nenhuma avaliação selecionada para exclusão.")
            return
        }

        const confirm = window.confirm(`Deseja realmente excluir ${selectedIds.length} avaliação(ões)?`)
        if (!confirm) return

        const user = auth.currentUser
        if (!user) {
            alert("Usuário não autenticado.")
            return
        }

        try {
            setDeleting(true)
            let successCount = 0
            let errorCount = 0

            // Processe as exclusões uma por uma para lidar com os erros individualmente
            for (const id of selectedIds) {
                try {
                    const docRef = doc(db, "usuarios", user.uid, "avaliacoes_scaa", id)
                    await deleteDoc(docRef)
                    successCount++
                } catch (err) {
                    console.error(`Erro ao excluir avaliação ${id}:`, err)
                    errorCount++
                }
            }

            // Limpar seleções
            setSelectedAvaliacoes({})
            setHasSelected(false)

            // Atualizar dados do contexto
            refreshData()

            // Mostrar mensagem de resultado
            if (errorCount === 0) {
                alert(`${successCount} avaliação(ões) excluída(s) com sucesso!`)
            } else {
                alert(`${successCount} avaliação(ões) excluída(s) com sucesso e ${errorCount} falha(s).`)
            }
        } catch (err) {
            console.error("Erro ao excluir avaliações:", err)
            alert("Erro ao excluir avaliações: " + err.message)
        } finally {
            setDeleting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!id || typeof id !== "string") {
            console.error("ID inválido para exclusão:", id)
            alert("Erro: ID inválido para exclusão")
            return
        }

        try {
            const confirm = window.confirm("Deseja realmente excluir esta avaliação?")
            if (!confirm) return

            const user = auth.currentUser
            if (!user) {
                alert("Usuário não autenticado.")
                return
            }

            setDeleting(true)
            const docRef = doc(db, "usuarios", user.uid, "avaliacoes_scaa", id)
            await deleteDoc(docRef)

            // Remover da seleção se estava selecionado
            if (selectedAvaliacoes[id]) {
                const newSelected = { ...selectedAvaliacoes }
                delete newSelected[id]
                setSelectedAvaliacoes(newSelected)
                setHasSelected(Object.keys(newSelected).length > 0)
            }

            // Atualizar dados do contexto
            refreshData()
            alert("Avaliação excluída com sucesso!")
        } catch (err) {
            console.error("Erro ao excluir avaliação:", err)
            alert("Erro ao excluir avaliação: " + err.message)
        } finally {
            setDeleting(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handlePrintPDF = async (id) => {
        if (!id || typeof id !== "string") {
            console.error("ID inválido para impressão:", id)
            alert("Erro: ID inválido para impressão")
            return
        }

        try {
            const user = auth.currentUser
            if (!user) {
                alert("Usuário não autenticado.")
                return
            }

            // Encontrar a avaliação nos dados do contexto
            let avaliacaoData
            const avaliacaoEncontrada = avaliacoesSCAA.find((a) => a.id === id)

            if (!avaliacaoEncontrada) {
                console.error("Avaliação não encontrada no contexto")
                // Buscar no Firestore como fallback
                const docRef = doc(db, "usuarios", user.uid, "avaliacoes_scaa", id)
                const docSnap = await getDoc(docRef)

                if (!docSnap.exists()) {
                    alert("Documento não encontrado.")
                    return
                }

                avaliacaoData = { id: docSnap.id, ...docSnap.data() }
            } else {
                avaliacaoData = avaliacaoEncontrada
            }

            // Gerar PDF
            const docPDF = new jsPDF({ unit: "mm", format: "a4" })
            const img = new Image()
            img.src = logo
            img.crossOrigin = "anonymous"

            img.onload = () => {
                const pageWidth = docPDF.internal.pageSize.getWidth()
                const pageHeight = docPDF.internal.pageSize.getHeight()
                const marginX = 20
                const boxY = 10
                const logoWidth = 25
                const logoHeight = 25
                const spacing = 5
                const titulo = "Avaliação Sensorial de Café - Método SCAA"
                const tituloWidth = docPDF.getTextWidth(titulo)
                const startX = (pageWidth - (logoWidth + spacing + tituloWidth)) / 2

                docPDF.addImage(img, "PNG", startX, boxY, logoWidth, logoHeight)
                docPDF.setFont("times", "bold")
                docPDF.setFontSize(14)
                docPDF.text(titulo, startX + logoWidth + spacing, boxY + 16)

                const autoTableOptions = (config) => ({
                    ...config,
                    theme: "grid",
                    margin: { left: marginX, right: marginX },
                    startY: docPDF.lastAutoTable ? docPDF.lastAutoTable.finalY + 10 : boxY + logoHeight + 10,
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
                    didDrawPage: (data) => {
                        const pageCount = docPDF.internal.getNumberOfPages()
                        docPDF.setFontSize(10)
                        docPDF.setTextColor(150)
                        docPDF.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth - marginX, pageHeight - 10, {
                            align: "right",
                        })
                        docPDF.text(`Laudo Técnico - ${new Date().toLocaleDateString("pt-BR")}`, marginX, pageHeight - 10)
                    },
                })

                const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"]

                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Identificação", "Valor"]],
                        body: [
                            ["Avaliador", avaliacaoData.avaliador || "—"],
                            ["Data", avaliacaoData.data ? new Date(avaliacaoData.data).toLocaleDateString("pt-BR") : "—"],
                            ["Fornecedor", avaliacaoData.fornecedor || avaliacaoData.fornecedorSelecionado || "—"],
                            ["Nº Amostra", avaliacaoData.numeroAmostra || "—"],
                            ["Torra", avaliacaoData.torraSelecionada || "—"],
                            [
                                { content: "Pontuação Final", styles: { fontStyle: "bold" } },
                                { content: avaliacaoData.pontuacaoFinal || "—", styles: { fontStyle: "bold" } },
                            ],
                            [
                                { content: "Notas Sensoriais", styles: { fontStyle: "bold" } },
                                { content: avaliacaoData.notasSensorias || "—", styles: { fontStyle: "bold" } },
                            ],
                        ],
                    }),
                )

                const corpoNotas = [
                    ["Aroma / Fragrância", avaliacaoData.notas?.AromaFragrancia || "—"],
                    ["Sabor", avaliacaoData.notas?.sabor || "—"],
                    ["Finalização", avaliacaoData.notas?.finalizacao || "—"],
                    ["Acidez", avaliacaoData.notas?.acidez || "—"],
                    ["Corpo", avaliacaoData.notas?.corpo || "—"],
                    ["Equilíbrio", avaliacaoData.notas?.equilibrio || "—"],
                    ["Avaliação Pessoal", avaliacaoData.notas?.avaliacaoPessoal || "—"],
                ]

                if (avaliacaoData.obsAcidez) corpoNotas.push(["Tipo de Acidez", avaliacaoData.obsAcidez])

                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Atributo Sensorial", "Nota"]],
                        body: corpoNotas,
                    }),
                )

                const defeitosLeves = Number.parseInt(avaliacaoData.defeitosLeves) || 0
                const defeitosGraves = Number.parseInt(avaliacaoData.defeitosGraves) || 0
                const descontos = defeitosLeves * 2 + defeitosGraves * 4

                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Critério", "Valor"]],
                        body: [
                            [
                                "Dry",
                                avaliacaoData.dry !== undefined && intensidades[avaliacaoData.dry]
                                    ? intensidades[avaliacaoData.dry]
                                    : "—",
                            ],
                            [
                                "Break",
                                avaliacaoData.breakValue !== undefined && intensidades[avaliacaoData.breakValue]
                                    ? intensidades[avaliacaoData.breakValue]
                                    : "—",
                            ],
                            [
                                "Nível de Acidez",
                                avaliacaoData.nivelAcidez !== undefined && intensidades[avaliacaoData.nivelAcidez]
                                    ? intensidades[avaliacaoData.nivelAcidez]
                                    : "—",
                            ],
                            [
                                "Nível de Corpo",
                                avaliacaoData.nivelCorpo !== undefined && intensidades[avaliacaoData.nivelCorpo]
                                    ? intensidades[avaliacaoData.nivelCorpo]
                                    : "—",
                            ],
                            ["Defeitos Leves", `-${defeitosLeves * 2}`],
                            ["Defeitos Graves", `-${defeitosGraves * 4}`],
                            ["Total de Pontos Descontados", `-${descontos}`],
                        ],
                    }),
                )

                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Observações", "Conteúdo"]],
                        body: [["Observações Gerais", avaliacaoData.observacoes || "—"]],
                    }),
                )

                const assinaturaY = docPDF.lastAutoTable.finalY + 30
                const linhaLargura = 80
                const linhaInicioX = (pageWidth - linhaLargura) / 2
                docPDF.line(linhaInicioX, assinaturaY, linhaInicioX + linhaLargura, assinaturaY)
                docPDF.setFont("times", "normal")
                docPDF.setFontSize(12)
                docPDF.text(`Avaliador: ${avaliacaoData.avaliador || "—"}`, pageWidth / 2, assinaturaY + 7, { align: "center" })

                const blob = docPDF.output("blob")
                const url = URL.createObjectURL(blob)
                window.open(url, "_blank")
            }

            img.onerror = () => {
                console.error("Erro ao carregar a imagem do logo")
                alert("Erro ao carregar a imagem do logo. O PDF será gerado sem a imagem.")
            }
        } catch (error) {
            console.error("Erro ao gerar PDF:", error)
            alert("Erro ao gerar PDF: " + error.message)
        }
    }

    // Renderiza o estado de carregamento
    if (dataLoading) {
        return (
            <div className="historico-scaa-container">
                <div className="historico-header">
                    <h2>Histórico de Avaliações SCAA</h2>
                    <div className="botoes-topo">
                        <button className="botao-voltar" onClick={() => navigate(-1)} title="Voltar">
                            <i className="bi bi-arrow-return-left"></i>
                        </button>
                    </div>
                </div>
                <p className="carregando">Carregando avaliações...</p>
            </div>
        )
    }

    // Calcula se todos os itens estão selecionados
    const allSelected = avaliacoesSCAA.length > 0 && Object.keys(selectedAvaliacoes).length === avaliacoesSCAA.length

    return (
        <div className="historico-scaa-container">
            <div className="historico-header">
                <h2>Histórico de Avaliações SCAA ({avaliacoesSCAA.length})</h2>
                <div className="botoes-topo">
                    <button className="botao-voltar" onClick={() => navigate(-1)} title="Voltar">
                        <i className="bi bi-arrow-return-left"></i>
                    </button>
                    <button className="botao-imprimir" onClick={handlePrint} title="Imprimir">
                        <i className="bi bi-printer"></i>
                    </button>
                    <button className="botao-atualizar" onClick={refreshData} title="Atualizar dados" disabled={dataLoading}>
                        <i className="bi bi-arrow-clockwise"></i>
                    </button>
                    {hasSelected && (
                        <button
                            className="botao-excluir-selecionados"
                            onClick={handleDeleteSelected}
                            title="Excluir avaliações selecionadas"
                            disabled={deleting}
                            style={{
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 12px",
                                marginLeft: "8px",
                                cursor: deleting ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                opacity: deleting ? 0.6 : 1,
                            }}
                        >
                            <i className="bi bi-trash3"></i>
                            {deleting ? "Excluindo..." : `Excluir Selecionados (${Object.keys(selectedAvaliacoes).length})`}
                        </button>
                    )}
                </div>
            </div>

            {avaliacoesSCAA.length > 0 ? (
                <table className="avaliacoes-table">
                    <thead>
                        <tr>
                            <th style={{ width: "40px" }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    title="Selecionar todas"
                                    style={{ cursor: "pointer" }}
                                />
                            </th>
                            <th>Data</th>
                            <th>Fornecedor</th>
                            <th>Nº Amostra</th>
                            <th>Notas Sensoriais</th>
                            <th>Obs. Acidez</th>
                            <th>Pontuação Final</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {avaliacoesSCAA.map((avaliacao) => {
                            // Formatar a data com segurança
                            let formattedDate = "Data inválida"
                            try {
                                const dateStr = avaliacao.data || avaliacao.dataCriacao
                                if (dateStr) {
                                    const date = new Date(dateStr)
                                    if (!isNaN(date.getTime())) {
                                        formattedDate = date.toLocaleDateString("pt-BR")
                                    }
                                }
                            } catch (e) {
                                console.error("Erro ao formatar data:", e)
                            }

                            return (
                                <tr key={avaliacao.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={!!selectedAvaliacoes[avaliacao.id]}
                                            onChange={() => handleSelectAvaliacao(avaliacao.id)}
                                            style={{ cursor: "pointer" }}
                                        />
                                    </td>
                                    <td>{formattedDate}</td>
                                    <td>{avaliacao.fornecedor || avaliacao.fornecedorSelecionado || "—"}</td>
                                    <td>{avaliacao.numeroAmostra || "—"}</td>
                                    <td>{avaliacao.notasSensorias || "—"}</td>
                                    <td>{avaliacao.obsAcidez || "—"}</td>
                                    <td>{avaliacao.pontuacaoFinal || "—"}</td>
                                    <td className="celula-acoes">
                                        <div className="acoes-botoes">
                                            <button
                                                className="botao-excluir"
                                                onClick={() => handleDelete(avaliacao.id)}
                                                title="Excluir avaliação"
                                                disabled={deleting}
                                            >
                                                <i className="bi bi-trash3"></i>
                                            </button>
                                            <button
                                                className="botao-imprimir-individual"
                                                onClick={() => handlePrintPDF(avaliacao.id)}
                                                title="Imprimir avaliação"
                                            >
                                                <i className="bi bi-printer"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="sem-avaliacoes">
                    <p>📝 Nenhuma avaliação SCAA encontrada.</p>
                    <button
                        className="botao-nova-avaliacao"
                        onClick={() => navigate("/scaa")}
                        style={{
                            marginTop: "20px",
                            padding: "10px 20px",
                            backgroundColor: "#ffba08",
                            color: "#032b43",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        Criar Nova Avaliação SCAA
                    </button>
                </div>
            )}
        </div>
    )
}

export default HistoricoScaa
