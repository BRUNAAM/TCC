"use client"
import "./HistoricoScaa.css"
import { useState, useEffect, useCallback } from "react"
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
    const [busca, setBusca] = useState("")
    const [filtroData, setFiltroData] = useState("")
    const [filtroFornecedor, setFiltroFornecedor] = useState("")
    const [ordenacao, setOrdenacao] = useState("data-desc")
    const navigate = useNavigate()

    useEffect(() => {
        // Limpar seleções quando os dados mudarem
        setSelectedAvaliacoes({})
        setHasSelected(false)
    }, [avaliacoesSCAA])

    // Filtrar e ordenar avaliações
    const avaliacoesFiltradas = avaliacoesSCAA
        .filter((avaliacao) => {
            const matchBusca =
                !busca ||
                avaliacao.avaliador?.toLowerCase().includes(busca.toLowerCase()) ||
                avaliacao.fornecedorSelecionado?.toLowerCase().includes(busca.toLowerCase()) ||
                avaliacao.numeroAmostra?.toLowerCase().includes(busca.toLowerCase()) ||
                avaliacao.torraSelecionada?.toLowerCase().includes(busca.toLowerCase())

            const matchData =
                !filtroData || (avaliacao.data && new Date(avaliacao.data).toISOString().split("T")[0] === filtroData)

            const matchFornecedor =
                !filtroFornecedor || avaliacao.fornecedorSelecionado?.toLowerCase().includes(filtroFornecedor.toLowerCase())

            return matchBusca && matchData && matchFornecedor
        })
        .sort((a, b) => {
            switch (ordenacao) {
                case "data-asc":
                    return new Date(a.data || a.dataCriacao) - new Date(b.data || b.dataCriacao)
                case "data-desc":
                    return new Date(b.data || b.dataCriacao) - new Date(a.data || a.dataCriacao)
                case "fornecedor":
                    return (a.fornecedorSelecionado || "").localeCompare(b.fornecedorSelecionado || "")
                case "avaliador":
                    return (a.avaliador || "").localeCompare(b.avaliador || "")
                default:
                    return 0
            }
        })

    // Obter lista única de fornecedores para filtro
    const fornecedoresUnicos = [...new Set(avaliacoesSCAA.map((a) => a.fornecedorSelecionado).filter(Boolean))]

    // Função para manipular a seleção da caixa de seleção
    const handleSelectAvaliacao = useCallback(
        (id) => {
            const newSelected = { ...selectedAvaliacoes }
            if (newSelected[id]) {
                delete newSelected[id]
            } else {
                newSelected[id] = true
            }
            setSelectedAvaliacoes(newSelected)
            setHasSelected(Object.keys(newSelected).length > 0)
        },
        [selectedAvaliacoes],
    )

    // Função para selecionar/desselecionar todas as avaliações
    const handleSelectAll = useCallback(
        (event) => {
            if (event.target.checked) {
                const newSelected = {}
                avaliacoesFiltradas.forEach((avaliacao) => {
                    newSelected[avaliacao.id] = true
                })
                setSelectedAvaliacoes(newSelected)
                setHasSelected(true)
            } else {
                setSelectedAvaliacoes({})
                setHasSelected(false)
            }
        },
        [avaliacoesFiltradas],
    )

    // Função para excluir múltiplas avaliações
    const handleDeleteSelected = useCallback(async () => {
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
    }, [selectedAvaliacoes, refreshData])

    const handleDelete = useCallback(
        async (id) => {
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
        },
        [selectedAvaliacoes, refreshData],
    )

    const handlePrint = () => {
        window.print()
    }

    const handlePrintPDF = useCallback(
        async (id) => {
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

                    const assinaturaY = docPDF.lastAutoTable.finalY + 30
                    const linhaLargura = 80
                    const linhaInicioX = (pageWidth - linhaLargura) / 2

                    docPDF.line(linhaInicioX, assinaturaY, linhaInicioX + linhaLargura, assinaturaY)
                    docPDF.setFont("times", "normal")
                    docPDF.setFontSize(12)
                    docPDF.text(`Avaliador: ${avaliacaoData.avaliador || "—"}`, pageWidth / 2, assinaturaY + 7, {
                        align: "center",
                    })

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
        },
        [avaliacoesSCAA],
    )

    // Renderiza o estado de carregamento
    if (dataLoading) {
        return (
            <div className="historico-scaa-container">
                <div className="historico-header">
                    <div className="header-content">
                        <h1>📊 Histórico SCAA</h1>
                        <button className="botao-voltar" onClick={() => navigate(-1)} title="Voltar">
                            ← Voltar
                        </button>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>🔄 Carregando avaliações...</p>
                </div>
            </div>
        )
    }

    // Calcula se todos os itens estão selecionados
    const allSelected =
        avaliacoesFiltradas.length > 0 && Object.keys(selectedAvaliacoes).length === avaliacoesFiltradas.length

    return (
        <div className="historico-scaa-container">
            {/* Header fixo */}
            <div className="historico-header">
                <div className="header-content">
                    <h1>📊 Histórico SCAA ({avaliacoesFiltradas.length})</h1>
                    <div className="header-actions">
                        <button className="botao-nova" onClick={() => navigate("/scaa")} title="Nova Avaliação">
                            ➕ Nova
                        </button>
                        <button className="botao-voltar" onClick={() => navigate(-1)} title="Voltar">
                            ← Voltar
                        </button>
                    </div>
                </div>

                {/* Filtros e busca */}
                <div className="filtros-container">
                    <div className="filtros-row">
                        <input
                            type="text"
                            placeholder="🔍 Buscar por avaliador, fornecedor, amostra..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="input-busca"
                        />

                        <input
                            type="date"
                            value={filtroData}
                            onChange={(e) => setFiltroData(e.target.value)}
                            className="input-data"
                            title="Filtrar por data"
                        />

                        <select
                            value={filtroFornecedor}
                            onChange={(e) => setFiltroFornecedor(e.target.value)}
                            className="select-fornecedor"
                        >
                            <option value="">Todos os fornecedores</option>
                            {fornecedoresUnicos.map((fornecedor) => (
                                <option key={fornecedor} value={fornecedor}>
                                    {fornecedor}
                                </option>
                            ))}
                        </select>

                        <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} className="select-ordenacao">
                            <option value="data-desc">📅 Mais recente</option>
                            <option value="data-asc">📅 Mais antigo</option>
                            <option value="fornecedor">🏢 Fornecedor A-Z</option>
                            <option value="avaliador">👤 Avaliador A-Z</option>
                        </select>
                    </div>

                    {/* Ações em lote */}
                    <div className="acoes-lote">
                        <button className="botao-atualizar" onClick={refreshData} title="Atualizar dados" disabled={dataLoading}>
                            🔄 Atualizar
                        </button>
                        <button className="botao-imprimir" onClick={handlePrint} title="Imprimir">
                            🖨️ Imprimir
                        </button>
                        {hasSelected && (
                            <button
                                className="botao-excluir-selecionados"
                                onClick={handleDeleteSelected}
                                title="Excluir avaliações selecionadas"
                                disabled={deleting}
                            >
                                {deleting ? "🗑️ Excluindo..." : `🗑️ Excluir (${Object.keys(selectedAvaliacoes).length})`}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Conteúdo principal */}
            {avaliacoesFiltradas.length > 0 ? (
                <div className="avaliacoes-grid">
                    {/* Seleção em massa */}
                    <div className="selecao-massa">
                        <label className="checkbox-container">
                            <input type="checkbox" checked={allSelected} onChange={handleSelectAll} />
                            <span className="checkmark"></span>
                            Selecionar todas as avaliações visíveis
                        </label>
                    </div>

                    {/* Cards das avaliações */}
                    <div className="cards-container">
                        {avaliacoesFiltradas.map((avaliacao) => {
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
                                <div
                                    key={avaliacao.id}
                                    className={`avaliacao-card ${selectedAvaliacoes[avaliacao.id] ? "selected" : ""}`}
                                >
                                    <div className="card-header">
                                        <div className="card-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={!!selectedAvaliacoes[avaliacao.id]}
                                                onChange={() => handleSelectAvaliacao(avaliacao.id)}
                                            />
                                        </div>
                                        <div className="card-info">
                                            <h3>{avaliacao.fornecedorSelecionado || "Fornecedor não informado"}</h3>
                                            <span className="card-date">📅 {formattedDate}</span>
                                        </div>
                                        <div className="card-actions">
                                            <button className="botao-pdf" onClick={() => handlePrintPDF(avaliacao.id)} title="Gerar PDF">
                                                📄
                                            </button>
                                            <button
                                                className="botao-excluir"
                                                onClick={() => handleDelete(avaliacao.id)}
                                                title="Excluir avaliação"
                                                disabled={deleting}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">👤 Avaliador:</span>
                                                <span className="info-value">{avaliacao.avaliador || "—"}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">🔢 Nº Amostra:</span>
                                                <span className="info-value">{avaliacao.numeroAmostra || "—"}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">☕ Torra:</span>
                                                <span className="info-value">{avaliacao.torraSelecionada || "—"}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">⭐ Pontuação:</span>
                                                <span className="info-value">{avaliacao.pontuacaoFinal || "—"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    {busca || filtroData || filtroFornecedor ? (
                        <>
                            <p>🔍 Nenhuma avaliação encontrada com os filtros aplicados</p>
                            <button
                                className="botao-limpar-filtros"
                                onClick={() => {
                                    setBusca("")
                                    setFiltroData("")
                                    setFiltroFornecedor("")
                                }}
                            >
                                Limpar filtros
                            </button>
                        </>
                    ) : (
                        <>
                            <p>📝 Nenhuma avaliação SCAA encontrada</p>
                            <button className="botao-nova-avaliacao" onClick={() => navigate("/scaa")}>
                                Criar primeira avaliação SCAA
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default HistoricoScaa
