"use client"

import "./HistoricoScaa.css"
import { useState, useEffect } from "react"
import { auth, db } from "../config/firebase"
import { deleteDoc, doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import logo from "../assets/logopdf.png"
import "bootstrap-icons/font/bootstrap-icons.css"
import { useData } from "../context/DataContext"

const HistoricoScaa = () => {
    // Estados principais
    const { avaliacoesScaa = [], loading: dataLoading, refreshData } = useData()
    const [selectedAvaliacoes, setSelectedAvaliacoes] = useState({})
    const [hasSelected, setHasSelected] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [localLoading, setLocalLoading] = useState(false)
    const [error, setError] = useState(null)
    const [localAvaliacoes, setLocalAvaliacoes] = useState([])
    const navigate = useNavigate()

    // ✅ BACKUP: Buscar dados diretamente do Firebase se o contexto falhar
    const fetchAvaliacoesDirectly = async () => {
        try {
            setLocalLoading(true)
            setError(null)

            const user = auth.currentUser
            if (!user) {
                setError("Usuário não autenticado")
                return
            }

            const avaliacoesRef = collection(db, "usuarios", user.uid, "avaliacoes_scaa")
            const q = query(avaliacoesRef, orderBy("data", "desc"))
            const querySnapshot = await getDocs(q)

            const avaliacoesList = []
            querySnapshot.forEach((doc) => {
                avaliacoesList.push({
                    id: doc.id,
                    ...doc.data(),
                })
            })

            setLocalAvaliacoes(avaliacoesList)
            console.log("✅ Avaliações carregadas diretamente:", avaliacoesList.length)
        } catch (err) {
            console.error("❌ Erro ao buscar avaliações:", err)
            setError("Erro ao carregar avaliações: " + err.message)
        } finally {
            setLocalLoading(false)
        }
    }

    // ✅ EFEITO: Carregar dados na inicialização
    useEffect(() => {
        if (!dataLoading && avaliacoesScaa.length === 0) {
            console.log("🔄 Contexto vazio, buscando dados diretamente...")
            fetchAvaliacoesDirectly()
        } else if (avaliacoesScaa.length > 0) {
            setLocalAvaliacoes(avaliacoesScaa)
        }
    }, [avaliacoesScaa, dataLoading])

    // ✅ LIMPAR SELEÇÕES quando dados mudarem
    useEffect(() => {
        setSelectedAvaliacoes({})
        setHasSelected(false)
    }, [localAvaliacoes])

    // ✅ FUNÇÃO: Manipular seleção individual
    const handleSelectAvaliacao = (id) => {
        if (!id) {
            console.error("❌ ID inválido para seleção:", id)
            return
        }

        const newSelected = { ...selectedAvaliacoes }
        if (newSelected[id]) {
            delete newSelected[id]
        } else {
            newSelected[id] = true
        }

        setSelectedAvaliacoes(newSelected)
        setHasSelected(Object.keys(newSelected).length > 0)
    }

    // ✅ FUNÇÃO: Selecionar/desselecionar todas
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelected = {}
            localAvaliacoes.forEach((avaliacao) => {
                if (avaliacao.id) {
                    newSelected[avaliacao.id] = true
                }
            })
            setSelectedAvaliacoes(newSelected)
            setHasSelected(Object.keys(newSelected).length > 0)
        } else {
            setSelectedAvaliacoes({})
            setHasSelected(false)
        }
    }

    // ✅ FUNÇÃO: Excluir múltiplas avaliações (MELHORADA)
    const handleDeleteSelected = async () => {
        const selectedIds = Object.keys(selectedAvaliacoes).filter((id) => id && id.trim() !== "")

        if (selectedIds.length === 0) {
            alert("Nenhuma avaliação selecionada para exclusão.")
            return
        }

        const confirmMessage = `Deseja realmente excluir ${selectedIds.length} avaliação(ões)?\n\nEsta ação não pode ser desfeita.`
        if (!window.confirm(confirmMessage)) return

        const user = auth.currentUser
        if (!user) {
            alert("Erro: Usuário não autenticado.")
            return
        }

        try {
            setDeleting(true)
            let successCount = 0
            let errorCount = 0
            const errors = []

            // ✅ Processar exclusões sequencialmente
            for (const id of selectedIds) {
                try {
                    console.log(`🗑️ Excluindo avaliação: ${id}`)
                    const docRef = doc(db, "usuarios", user.uid, "avaliacoes_scaa", id)

                    // Verificar se existe antes de excluir
                    const docSnap = await getDoc(docRef)
                    if (!docSnap.exists()) {
                        console.warn(`⚠️ Documento ${id} não encontrado`)
                        errorCount++
                        errors.push(`Avaliação ${id} não encontrada`)
                        continue
                    }

                    await deleteDoc(docRef)
                    successCount++
                    console.log(`✅ Avaliação ${id} excluída com sucesso`)
                } catch (err) {
                    console.error(`❌ Erro ao excluir avaliação ${id}:`, err)
                    errorCount++
                    errors.push(`Erro ao excluir ${id}: ${err.message}`)
                }
            }

            // ✅ Limpar seleções
            setSelectedAvaliacoes({})
            setHasSelected(false)

            // ✅ Atualizar dados
            if (refreshData) {
                await refreshData()
            }
            await fetchAvaliacoesDirectly()

            // ✅ Mostrar resultado
            if (errorCount === 0) {
                alert(`✅ ${successCount} avaliação(ões) excluída(s) com sucesso!`)
            } else {
                const message = `Resultado da exclusão:\n✅ ${successCount} sucesso(s)\n❌ ${errorCount} erro(s)\n\nDetalhes dos erros:\n${errors.join("\n")}`
                alert(message)
            }
        } catch (err) {
            console.error("❌ Erro geral ao excluir avaliações:", err)
            alert("Erro inesperado ao excluir avaliações: " + err.message)
        } finally {
            setDeleting(false)
        }
    }

    // ✅ FUNÇÃO: Excluir avaliação individual (MELHORADA)
    const handleDelete = async (id) => {
        if (!id || typeof id !== "string" || id.trim() === "") {
            console.error("❌ ID inválido para exclusão:", id)
            alert("Erro: ID inválido para exclusão")
            return
        }

        const confirmMessage = "Deseja realmente excluir esta avaliação?\n\nEsta ação não pode ser desfeita."
        if (!window.confirm(confirmMessage)) return

        const user = auth.currentUser
        if (!user) {
            alert("Erro: Usuário não autenticado.")
            return
        }

        try {
            setDeleting(true)
            console.log(`🗑️ Excluindo avaliação individual: ${id}`)

            const docRef = doc(db, "usuarios", user.uid, "avaliacoes_scaa", id)

            // Verificar se existe antes de excluir
            const docSnap = await getDoc(docRef)
            if (!docSnap.exists()) {
                alert("Erro: Avaliação não encontrada no banco de dados.")
                return
            }

            await deleteDoc(docRef)
            console.log(`✅ Avaliação ${id} excluída com sucesso`)

            // ✅ Remover da seleção se estava selecionado
            if (selectedAvaliacoes[id]) {
                const newSelected = { ...selectedAvaliacoes }
                delete newSelected[id]
                setSelectedAvaliacoes(newSelected)
                setHasSelected(Object.keys(newSelected).length > 0)
            }

            // ✅ Atualizar dados
            if (refreshData) {
                await refreshData()
            }
            await fetchAvaliacoesDirectly()

            alert("✅ Avaliação excluída com sucesso!")
        } catch (err) {
            console.error("❌ Erro ao excluir avaliação:", err)
            alert("Erro ao excluir avaliação: " + err.message)
        } finally {
            setDeleting(false)
        }
    }

    // ✅ FUNÇÃO: Imprimir página
    const handlePrint = () => {
        window.print()
    }

    // ✅ FUNÇÃO: Atualizar dados manualmente
    const handleRefresh = async () => {
        setError(null)
        if (refreshData) {
            await refreshData()
        }
        await fetchAvaliacoesDirectly()
    }

    // ✅ FUNÇÃO: Gerar PDF (mantida igual ao original)
    const handlePrintPDF = async (id) => {
        if (!id || typeof id !== "string") {
            console.error("❌ ID inválido para impressão:", id)
            alert("Erro: ID inválido para impressão")
            return
        }

        try {
            const user = auth.currentUser
            if (!user) {
                alert("Usuário não autenticado.")
                return
            }

            // ✅ Buscar avaliação nos dados locais primeiro
            let avaliacaoData = localAvaliacoes.find((a) => a.id === id)

            if (!avaliacaoData) {
                console.log("🔍 Avaliação não encontrada localmente, buscando no Firestore...")
                const docRef = doc(db, "usuarios", user.uid, "avaliacoes_scaa", id)
                const docSnap = await getDoc(docRef)

                if (!docSnap.exists()) {
                    alert("Erro: Avaliação não encontrada.")
                    return
                }

                avaliacaoData = { id: docSnap.id, ...docSnap.data() }
            }

            // ✅ Gerar PDF (código mantido igual ao original)
            const docPDF = new jsPDF({ unit: "mm", format: "a4" })
            const img = new Image()
            img.src = logo
            img.crossOrigin = "anonymous"

            img.onload = () => {
                const pageWidth = docPDF.internal.pageSize.getWidth()
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
                })

                // Informações gerais
                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Identificação", "Valor"]],
                        body: [
                            ["Avaliador", avaliacaoData.avaliador || "—"],
                            ["Data", avaliacaoData.data ? new Date(avaliacaoData.data).toLocaleDateString("pt-BR") : "—"],
                            ["Fornecedor", avaliacaoData.fornecedorSelecionado || "—"],
                            ["Nº Amostra", avaliacaoData.numeroAmostra || "—"],
                            ["Torra", avaliacaoData.torraSelecionada || "—"],
                            ["Notas Sensoriais", avaliacaoData.notasSensorias || "—"],
                        ],
                    }),
                )

                // Notas sensoriais
                const notas = avaliacaoData.notas || {}
                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Atributo Sensorial", "Nota"]],
                        body: [
                            ["Aroma/Fragrância", notas.AromaFragrancia || "—"],
                            ["Sabor", notas.sabor || "—"],
                            ["Finalização", notas.finalizacao || "—"],
                            ["Acidez", notas.acidez || "—"],
                            ["Corpo", notas.corpo || "—"],
                            ["Equilíbrio", notas.equilibrio || "—"],
                            ["Avaliação Pessoal", notas.avaliacaoPessoal || "—"],
                        ],
                    }),
                )

                // Pontuação final
                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Resultado Final", "Valor"]],
                        body: [
                            ["Pontuação Total", avaliacaoData.pontuacaoFinal || "—"],
                            ["Total Descontos", avaliacaoData.totalDescontos || "—"],
                        ],
                    }),
                )

                const blob = docPDF.output("blob")
                const url = URL.createObjectURL(blob)
                window.open(url, "_blank")
            }

            img.onerror = () => {
                console.error("❌ Erro ao carregar logo")
                alert("Erro ao carregar logo. PDF será gerado sem imagem.")
            }
        } catch (error) {
            console.error("❌ Erro ao gerar PDF:", error)
            alert("Erro ao gerar PDF: " + error.message)
        }
    }

    // ✅ RENDERIZAÇÃO: Estado de carregamento
    if (dataLoading || localLoading) {
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
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="carregando">Carregando avaliações...</p>
                </div>
            </div>
        )
    }

    // ✅ RENDERIZAÇÃO: Estado de erro
    if (error) {
        return (
            <div className="historico-scaa-container">
                <div className="historico-header">
                    <h2>Histórico de Avaliações SCAA</h2>
                    <div className="botoes-topo">
                        <button className="botao-voltar" onClick={() => navigate(-1)} title="Voltar">
                            <i className="bi bi-arrow-return-left"></i>
                        </button>
                        <button className="botao-atualizar" onClick={handleRefresh} title="Tentar novamente">
                            <i className="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                </div>
                <div className="error-container">
                    <p className="error-message">❌ {error}</p>
                    <button className="botao-nova-avaliacao" onClick={handleRefresh}>
                        Tentar Novamente
                    </button>
                </div>
            </div>
        )
    }

    // ✅ CÁLCULOS: Verificar se todos estão selecionados
    const allSelected = localAvaliacoes.length > 0 && Object.keys(selectedAvaliacoes).length === localAvaliacoes.length

    // ✅ RENDERIZAÇÃO PRINCIPAL
    return (
        <div className="historico-scaa-container">
            <div className="historico-header">
                <h2>Histórico de Avaliações SCAA ({localAvaliacoes.length})</h2>
                <div className="botoes-topo">
                    <button className="botao-voltar" onClick={() => navigate(-1)} title="Voltar">
                        <i className="bi bi-arrow-return-left"></i>
                    </button>
                    <button className="botao-imprimir" onClick={handlePrint} title="Imprimir">
                        <i className="bi bi-printer"></i>
                    </button>
                    <button className="botao-atualizar" onClick={handleRefresh} title="Atualizar dados" disabled={localLoading}>
                        <i className={`bi bi-arrow-clockwise ${localLoading ? "spinning" : ""}`}></i>
                    </button>
                    {hasSelected && (
                        <button
                            className="botao-excluir-selecionados"
                            onClick={handleDeleteSelected}
                            title="Excluir avaliações selecionadas"
                            disabled={deleting}
                        >
                            <i className="bi bi-trash3"></i>
                            <span className="botao-texto-selecionados">
                                {deleting ? "Excluindo..." : `Excluir (${Object.keys(selectedAvaliacoes).length})`}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {localAvaliacoes.length > 0 ? (
                <div className="avaliacoes-table">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: "50px" }}>
                                    <input type="checkbox" checked={allSelected} onChange={handleSelectAll} title="Selecionar todas" />
                                </th>
                                <th>Data</th>
                                <th>Fornecedor</th>
                                <th>Nº Amostra</th>
                                <th>Torra</th>
                                <th>Pontuação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {localAvaliacoes.map((avaliacao) => {
                                // ✅ Formatação segura da data
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
                                    console.error("❌ Erro ao formatar data:", e)
                                }

                                return (
                                    <tr key={avaliacao.id} className={selectedAvaliacoes[avaliacao.id] ? "selected-row" : ""}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={!!selectedAvaliacoes[avaliacao.id]}
                                                onChange={() => handleSelectAvaliacao(avaliacao.id)}
                                            />
                                        </td>
                                        <td>{formattedDate}</td>
                                        <td>{avaliacao.fornecedorSelecionado || "—"}</td>
                                        <td>{avaliacao.numeroAmostra || "—"}</td>
                                        <td>{avaliacao.torraSelecionada || "—"}</td>
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
                </div>
            ) : (
                <div className="sem-avaliacoes">
                    <p>📝 Nenhuma avaliação SCAA encontrada.</p>
                    <button className="botao-nova-avaliacao" onClick={() => navigate("/scaa")}>
                        Criar Nova Avaliação SCAA
                    </button>
                </div>
            )}
        </div>
    )
}

export default HistoricoScaa
