"use client"

import "./HistoricoScaa.css"
import { useState, useEffect } from "react"
import { auth, db } from "../config/firebase"
import { collection, getDocs, getDoc, deleteDoc, doc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import logo from "../assets/logopdf.png"
import "bootstrap-icons/font/bootstrap-icons.css"

const HistoricoScaa = () => {
    const [avaliacoes, setAvaliacoes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedAvaliacoes, setSelectedAvaliacoes] = useState({})
    // // Estado para rastrear avaliações selecionadas para exclusão em lote
    const [hasSelected, setHasSelected] = useState(false)
    const navigate = useNavigate()

    // O nome da função corresponde ao HistoricoCob
    const fetchAvaliacoes = async () => {
        setLoading(true)
        setError(null)
        try {
            const user = auth.currentUser
            if (!user) {
                console.error("Usuário não autenticado")
                setError("Usuário não autenticado")
                setLoading(false)
                return
            }

            const q = collection(db, "usuarios", user.uid, "avaliacoes_scaa")
            const snapshot = await getDocs(q)

            if (snapshot.empty) {
                console.log("Nenhuma avaliação encontrada")
                setAvaliacoes([])
                setLoading(false)
                return
            }

            // Processar dados com validação cuidadosa
            const data = []
            snapshot.forEach((doc) => {
                try {
                    const rawData = doc.data()
                    // Cria um objeto seguro com todos os campos obrigatórios
                    data.push({
                        id: doc.id,
                        data: rawData.data || rawData.dataCriacao || new Date().toISOString(),
                        fornecedor: String(rawData.fornecedor || rawData.fornecedorSelecionado || ""),
                        numeroAmostra: String(rawData.numeroAmostra || ""),
                        notasSensorias: String(rawData.notasSensorias || ""),
                        obsAcidez: String(rawData.obsAcidez || ""),
                        pontuacaoFinal: rawData.pontuacaoFinal ? String(rawData.pontuacaoFinal) : "",
                        // Armazena os dados brutos para geração de PDF
                        rawData: rawData,
                    })
                } catch (err) {
                    console.error(`Erro ao processar documento ${doc.id}:`, err)
                }
            })

            console.log(`Carregadas ${data.length} avaliações`)
            setAvaliacoes(data)
            // Redefinir seleção ao buscar novos dados
            setSelectedAvaliacoes({})
            setHasSelected(false)
        } catch (err) {
            console.error("Erro ao carregar avaliações:", err)
            setError("Erro ao carregar avaliações: " + err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAvaliacoes()
    }, [])
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
            avaliacoes.forEach((avaliacao) => {
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
            setLoading(true)
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
            // Atualiza a IU após todas as exclusões
            if (successCount > 0) {
                setAvaliacoes((prev) => prev.filter((item) => !selectedAvaliacoes[item.id]))
                setSelectedAvaliacoes({})
                setHasSelected(false)
            }
            //Mostra mensagem de resultado
            if (errorCount === 0) {
                alert(`${successCount} avaliação(ões) excluída(s) com sucesso!`)
            } else {
                alert(`${successCount} avaliação(ões) excluída(s) com sucesso e ${errorCount} falha(s).`)
            }
        } catch (err) {
            console.error("Erro ao excluir avaliações:", err)
            alert("Erro ao excluir avaliações: " + err.message)
        } finally {
            setLoading(false)
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
            // Constroe a referência do documento com cuidado
            const docRef = doc(db, "usuarios", user.uid, "avaliacoes_scaa", id)
            await deleteDoc(docRef)
            // Atualiza a IU filtrando o item excluído
            setAvaliacoes((prev) => prev.filter((item) => item.id !== id))
            // Também remove do selecionado se ele foi selecionado
            if (selectedAvaliacoes[id]) {
                const newSelected = { ...selectedAvaliacoes }
                delete newSelected[id]
                setSelectedAvaliacoes(newSelected)
                setHasSelected(Object.keys(newSelected).length > 0)
            }

            alert("Avaliação excluída com sucesso!")
        } catch (err) {
            console.error("Erro ao excluir avaliação:", err)
            alert("Erro ao excluir avaliação: " + err.message)
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
            // Encontre a avaliação em nosso estado local primeiro para evitar uma leitura extra do Firestore
            let avaliacaoData
            const avaliacaoEncontrada = avaliacoes.find((a) => a.id === id)
            if (!avaliacaoEncontrada) {
                console.error("Avaliação não encontrada no estado local")
                // Retornar ao Firestore se não for encontrado no estado local
                const docRef = doc(db, "usuarios", user.uid, "avaliacoes_scaa", id)
                const docSnap = await getDoc(docRef)

                if (!docSnap.exists()) {
                    alert("Documento não encontrado.")
                    return
                }

                avaliacaoData = { id: docSnap.id, rawData: docSnap.data() }
            } else {
                avaliacaoData = avaliacaoEncontrada
            }
            // Use os dados brutos para geração de PDF
            const data = avaliacaoData.rawData || {}

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
                            ["Avaliador", data.avaliador || "—"],
                            ["Data", data.data ? new Date(data.data).toLocaleDateString("pt-BR") : "—"],
                            ["Fornecedor", data.fornecedor || data.fornecedorSelecionado || "—"],
                            ["Nº Amostra", data.numeroAmostra || "—"],
                            ["Torra", data.torraSelecionada || "—"],
                            [
                                { content: "Pontuação Final", styles: { fontStyle: "bold" } },
                                { content: data.pontuacaoFinal || "—", styles: { fontStyle: "bold" } },
                            ],
                            [
                                { content: "Notas Sensoriais", styles: { fontStyle: "bold" } },
                                { content: data.notasSensorias || "—", styles: { fontStyle: "bold" } },
                            ],
                        ],
                    }),
                )

                const corpoNotas = [
                    ["Aroma / Fragrância", data.notas?.AromaFragrancia || "—"],
                    ["Sabor", data.notas?.sabor || "—"],
                    ["Finalização", data.notas?.finalizacao || "—"],
                    ["Acidez", data.notas?.acidez || "—"],
                    ["Corpo", data.notas?.corpo || "—"],
                    ["Equilíbrio", data.notas?.equilibrio || "—"],
                    ["Avaliação Pessoal", data.notas?.avaliacaoPessoal || "—"],
                ]

                if (data.obsAcidez) corpoNotas.push(["Tipo de Acidez", data.obsAcidez])

                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Atributo Sensorial", "Nota"]],
                        body: corpoNotas,
                    }),
                )

                const defeitosLeves = Number.parseInt(data.defeitosLeves) || 0
                const defeitosGraves = Number.parseInt(data.defeitosGraves) || 0
                const descontos = defeitosLeves * 2 + defeitosGraves * 4

                autoTable(
                    docPDF,
                    autoTableOptions({
                        head: [["Critério", "Valor"]],
                        body: [
                            ["Dry", data.dry !== undefined && intensidades[data.dry] ? intensidades[data.dry] : "—"],
                            [
                                "Break",
                                data.breakValue !== undefined && intensidades[data.breakValue] ? intensidades[data.breakValue] : "—",
                            ],
                            [
                                "Nível de Acidez",
                                data.nivelAcidez !== undefined && intensidades[data.nivelAcidez] ? intensidades[data.nivelAcidez] : "—",
                            ],
                            [
                                "Nível de Corpo",
                                data.nivelCorpo !== undefined && intensidades[data.nivelCorpo] ? intensidades[data.nivelCorpo] : "—",
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
                        body: [["Observações Gerais", data.observacoes || "—"]],
                    }),
                )

                const assinaturaY = docPDF.lastAutoTable.finalY + 30
                const linhaLargura = 80
                const linhaInicioX = (pageWidth - linhaLargura) / 2
                docPDF.line(linhaInicioX, assinaturaY, linhaInicioX + linhaLargura, assinaturaY)
                docPDF.setFont("times", "normal")
                docPDF.setFontSize(12)
                docPDF.text(`Avaliador: ${data.avaliador || "—"}`, pageWidth / 2, assinaturaY + 7, { align: "center" })

                const blob = docPDF.output("blob")
                const url = URL.createObjectURL(blob)
                window.open(url, "_blank")
            }

            img.onerror = () => {
                console.error("Erro ao carregar a imagem do logo")
                alert("Erro ao carregar a imagem do logo. O PDF será gerado sem a imagem.")
                // Continuar com a geração do PDF sem a imagem
            }
        } catch (error) {
            console.error("Erro ao gerar PDF:", error)
            alert("Erro ao gerar PDF: " + error.message)
        }
    }
    // Renderiza o estado de carregamento
    if (loading) {
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
    //Renderiza estado de erro
    if (error) {
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
                <div className="erro-container">
                    <p className="erro-mensagem">Erro ao carregar avaliações: {error}</p>
                    <button className="botao-tentar-novamente" onClick={fetchAvaliacoes}>
                        Tentar Novamente
                    </button>
                </div>
            </div>
        )
    }
    // Calcula se todos os itens estão selecionados
    const allSelected = avaliacoes.length > 0 && Object.keys(selectedAvaliacoes).length === avaliacoes.length

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
                    {/* Adicionar botão para exclusão em lote */}
                    {hasSelected && (
                        <button
                            className="botao-excluir-selecionados"
                            onClick={handleDeleteSelected}
                            title="Excluir avaliações selecionadas"
                            style={{
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 12px",
                                marginLeft: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                            }}
                        >
                            <i className="bi bi-trash3"></i>
                            Excluir Selecionados ({Object.keys(selectedAvaliacoes).length})
                        </button>
                    )}
                </div>
            </div>
            {avaliacoes.length > 0 ? (
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
                            <th>Pontuação final</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {avaliacoes.map((avaliacao) => {
                            //Formate a data com segurança
                            let formattedDate = "Data inválida"
                            try {
                                const dateStr = avaliacao.data
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
                                    <td>{avaliacao.fornecedor || "—"}</td>
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
                <p className="sem-avaliacoes">Nenhuma avaliação encontrada.</p>
            )}
        </div>
    )
}

export default HistoricoScaa
