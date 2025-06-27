"use client"

import "./Scaa.css"
import { getAuth } from "firebase/auth"
import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "../config/firebase"
import { collection, addDoc } from "firebase/firestore"
import GraoCafe from "./GraoCafe"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import "bootstrap-icons/font/bootstrap-icons.css"
import logo from "../assets/logopdf.png"
import { useData } from "../context/DataContext"
// ✅ NOVOS IMPORTS PARA PERSISTÊNCIA
import { useLocalStorage } from "../hooks/use-local-storage"
import { useFirebaseData } from "../hooks/use-firebase-data"

const novaEstruturaAvaliacao = (overrides = {}) => {
    return {
        id: Date.now(),
        avaliador: "",
        data: new Date().toISOString().split("T")[0],
        fornecedorSelecionado: "",
        numeroAmostra: "",
        torraSelecionada: "",
        observacoes: "",
        notasSensorias: "",
        obsAcidez: "",
        obsDry: "",
        obsBreak: "",
        dry: 2,
        breakValue: 2,
        nivelAcidez: 2,
        nivelCorpo: 2,
        notas: {
            AromaFragrancia: 6,
            sabor: 6,
            finalizacao: 6,
            acidez: 6,
            corpo: 6,
            equilibrio: 6,
            avaliacaoPessoal: 6,
            doçura: [false, false, false, false, false],
            uniformidade: [false, false, false, false, false],
            xicaraLimpa: [false, false, false, false, false],
        },
        defeitosLeves: 0,
        defeitosGraves: 0,
        isSaved: false,
        ...overrides,
    }
}

const Scaa = () => {
    // Tratamento de erro global
    useEffect(() => {
        const handleError = (error) => {
            console.error("Erro capturado:", error)
        }

        window.addEventListener("error", handleError)
        window.addEventListener("unhandledrejection", handleError)

        return () => {
            window.removeEventListener("error", handleError)
            window.removeEventListener("unhandledrejection", handleError)
        }
    }, [])
    // ✅ SUBSTITUINDO useState POR useLocalStorage PARA PERSISTÊNCIA
    const [avaliacoes, setAvaliacoes] = useLocalStorage("scaa-avaliacoes", [])
    const [abaAtiva, setAbaAtiva] = useLocalStorage("scaa-aba-ativa", null)

    // ✅ NOVOS ESTADOS PARA FUNCIONALIDADES DE PERSISTÊNCIA
    const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false)

    // Estados que permanecem normais (não precisam de persistência)
    const [mostrarTiposAcidez, setMostrarTiposAcidez] = useState(false)
    const [scrollPosition, setScrollPosition] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const autoSaveTimeoutRef = useRef(null)
    const navigate = useNavigate()

    // ✅ USANDO DADOS DO CONTEXTO E FIREBASE
    const { fornecedores, loading: dataLoading } = useData()
    const { avaliacoesSalvas, loading: firebaseLoading } = useFirebaseData()

    const avaliacaoAtual = abaAtiva !== null && avaliacoes[abaAtiva] ? avaliacoes[abaAtiva] : null

    // ✅ EFEITO PARA CONTROLE DE NAVEGAÇÃO E SCROLL (mantido igual)
    useEffect(() => {
        window.history.pushState(null, null, window.location.href)
        const bloquearVoltar = () => {
            window.history.pushState(null, null, window.location.href)
        }
        window.addEventListener("popstate", bloquearVoltar)

        const handleScroll = () => {
            setScrollPosition(window.scrollY)
        }
        window.addEventListener("scroll", handleScroll)

        return () => {
            window.removeEventListener("popstate", bloquearVoltar)
            window.removeEventListener("scroll", handleScroll)
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
        }
    }, [])

    // ✅ EFEITO MELHORADO PARA INICIALIZAÇÃO COM PERSISTÊNCIA
    useEffect(() => {
        const usuarioNome = (() => {
            try {
                return localStorage.getItem("usuarioNome") || ""
            } catch (error) {
                console.warn("Erro ao acessar localStorage:", error)
                return ""
            }
        })()

        const inicializarAvaliacao = () => {
            try {
                if (avaliacoes.length === 0) {
                    const novaAvaliacao = novaEstruturaAvaliacao({
                        avaliador: usuarioNome,
                    })
                    setAvaliacoes([novaAvaliacao])
                    setAbaAtiva(0)
                } else {
                    if (abaAtiva === null && avaliacoes.length > 0) {
                        setAbaAtiva(0)
                    }
                }
            } catch (error) {
                console.error("Erro ao inicializar avaliação:", error)
            }
        }

        inicializarAvaliacao()
    }, [avaliacoes.length, abaAtiva, setAvaliacoes, setAbaAtiva])

    // ✅ EFEITO PARA MOSTRAR OPÇÃO DE RECUPERAÇÃO DE DADOS DO FIREBASE
    useEffect(() => {
        if (!firebaseLoading && avaliacoesSalvas.length > 0 && avaliacoes.length <= 1) {
            const avaliacoesRecentes = avaliacoesSalvas.filter((av) => {
                const dataAvaliacao = new Date(av.dataCriacao)
                const agora = new Date()
                const diferencaHoras = (agora.getTime() - dataAvaliacao.getTime()) / (1000 * 60 * 60)
                return diferencaHoras < 24 // Avaliações das últimas 24 horas
            })

            if (avaliacoesRecentes.length > 0) {
                setMostrarRecuperacao(true)
            }
        }
    }, [firebaseLoading, avaliacoesSalvas, avaliacoes.length])

    // ✅ FUNÇÃO PARA RECUPERAR DADOS DO FIREBASE
    const recuperarDadosFirebase = () => {
        const avaliacoesRecuperadas = avaliacoesSalvas.map((av) => ({
            ...novaEstruturaAvaliacao(),
            ...av,
            id: Date.now() + Math.random(),
            isSaved: true,
            firebaseId: av.id,
        }))

        setAvaliacoes(avaliacoesRecuperadas)
        setAbaAtiva(0)
        setMostrarRecuperacao(false)

        alert(`${avaliacoesRecuperadas.length} avaliação(ões) recuperada(s) com sucesso!`)
    }

    // ✅ FUNÇÃO PARA LIMPAR DADOS LOCAIS
    const limparDadosLocais = () => {
        if (window.confirm("Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita.")) {
            localStorage.removeItem("scaa-avaliacoes")
            localStorage.removeItem("scaa-aba-ativa")
            setAvaliacoes([])
            setAbaAtiva(null)
            window.location.reload()
        }
    }

    // Todas as funções originais mantidas iguais
    const handleNotaChange = (categoria, valor) => {
        if (!avaliacaoAtual) return

        setAvaliacoes((prev) => {
            const newAvaliacoes = [...prev]
            newAvaliacoes[abaAtiva] = {
                ...newAvaliacoes[abaAtiva],
                notas: {
                    ...newAvaliacoes[abaAtiva].notas,
                    [categoria]: Number.parseFloat(valor),
                },
                isSaved: false,
            }
            return newAvaliacoes
        })
    }

    const toggleCheckbox = (atributo, index) => {
        if (!avaliacaoAtual) return

        setAvaliacoes((prev) => {
            const newAvaliacoes = [...prev]
            const newArray = [...newAvaliacoes[abaAtiva].notas[atributo]]
            newArray[index] = !newArray[index]

            newAvaliacoes[abaAtiva] = {
                ...newAvaliacoes[abaAtiva],
                notas: {
                    ...newAvaliacoes[abaAtiva].notas,
                    [atributo]: newArray,
                },
                isSaved: false,
            }
            return newAvaliacoes
        })
    }

    const calcularPontuacaoXicara = (atributo) => {
        if (!avaliacaoAtual) return 0
        const marcados = avaliacaoAtual.notas[atributo].filter((v) => v).length
        return 10 - marcados * 2
    }

    const calcularPontuacaoXicaras = () => {
        return (
            calcularPontuacaoXicara("doçura") +
            calcularPontuacaoXicara("uniformidade") +
            calcularPontuacaoXicara("xicaraLimpa")
        )
    }

    const calcularPontuacaoFinal = () => {
        if (!avaliacaoAtual) return "0.00"

        let total = 0

        Object.keys(avaliacaoAtual.notas).forEach((key) => {
            if (!["doçura", "uniformidade", "xicaraLimpa"].includes(key)) {
                total += avaliacaoAtual.notas[key]
            }
        })

        total += calcularPontuacaoXicara("xicaraLimpa")
        total += calcularPontuacaoXicara("uniformidade")
        total += calcularPontuacaoXicara("doçura")
        total -= avaliacaoAtual.defeitosLeves * 2
        total -= avaliacaoAtual.defeitosGraves * 4

        return total.toFixed(2)
    }

    const calcularTotalDescontos = () => {
        if (!avaliacaoAtual) return 0
        return avaliacaoAtual.defeitosLeves * 2 + avaliacaoAtual.defeitosGraves * 4
    }

    // Função para salvar no Firebase (mantida igual)
    const salvarAvaliacaoFirebase = useCallback(async (avaliacao, isFinalSave = false) => {
        try {
            const authInstance = getAuth()
            const user = authInstance.currentUser

            if (!user) {
                console.warn("Usuário não autenticado.")
                return null
            }

            if (avaliacao.isSaved && !isFinalSave) {
                console.log("Avaliação já foi salva, pulando salvamento automático.")
                return null
            }

            if (!avaliacao.fornecedorSelecionado || !avaliacao.numeroAmostra || !avaliacao.torraSelecionada) {
                console.log("Dados insuficientes para salvar.")
                return null
            }

            const defeitosLeves = avaliacao.defeitosLeves || 0
            const defeitosGraves = avaliacao.defeitosGraves || 0
            const totalDescontos = defeitosLeves * 2 + defeitosGraves * 4

            let total = 0
            Object.keys(avaliacao.notas).forEach((key) => {
                if (!["doçura", "uniformidade", "xicaraLimpa"].includes(key)) {
                    total += avaliacao.notas[key]
                }
            })

            const calcularPontuacaoXicara = (atributo) => {
                const marcados = avaliacao.notas[atributo].filter((v) => v).length
                return 10 - marcados * 2
            }

            total += calcularPontuacaoXicara("xicaraLimpa")
            total += calcularPontuacaoXicara("uniformidade")
            total += calcularPontuacaoXicara("doçura")
            total -= totalDescontos

            const avaliacaoParaSalvar = {
                ...avaliacao,
                pontuacaoFinal: total.toFixed(2),
                totalDescontos,
                userId: user.uid,
                dataCriacao: new Date().toISOString(),
                tipoSalvamento: isFinalSave ? "manual" : "automatico",
            }

            const docRef = await addDoc(collection(db, "usuarios", user.uid, "avaliacoes_scaa"), avaliacaoParaSalvar)

            console.log(`Avaliação salva ${isFinalSave ? "manualmente" : "automaticamente"} com ID:`, docRef.id)

            return docRef.id
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error)
            throw error
        }
    }, [])

    const handleSalvarAvaliacao = async () => {
        if (!avaliacaoAtual || isSaving) return

        if (!avaliacaoAtual.fornecedorSelecionado || !avaliacaoAtual.numeroAmostra || !avaliacaoAtual.torraSelecionada) {
            alert("Por favor, preencha todos os campos obrigatórios.")
            return
        }

        setIsSaving(true)

        try {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
                autoSaveTimeoutRef.current = null
            }

            const docId = await salvarAvaliacaoFirebase(avaliacaoAtual, true)

            if (docId) {
                setAvaliacoes((prev) => {
                    const newAvaliacoes = [...prev]
                    newAvaliacoes[abaAtiva] = {
                        ...newAvaliacoes[abaAtiva],
                        isSaved: true,
                        firebaseId: docId,
                    }
                    return newAvaliacoes
                })

                alert("Avaliação salva com sucesso!")
                handlePrintPDF()
            }
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error)
            alert("Erro ao salvar avaliação. Tente novamente mais tarde.")
        } finally {
            setIsSaving(false)
        }
    }

    const criarNovaAvaliacao = () => {
        const novaAvaliacao = novaEstruturaAvaliacao({
            avaliador: avaliacoes.length > 0 && avaliacoes[0].avaliador ? avaliacoes[0].avaliador : "",
        })

        setAvaliacoes((prev) => [...prev, novaAvaliacao])
        setAbaAtiva(avaliacoes.length)
    }

    // Auto-save melhorado (mantido igual)
    useEffect(() => {
        if (abaAtiva !== null && avaliacoes[abaAtiva] && !avaliacoes[abaAtiva].isSaved) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }

            autoSaveTimeoutRef.current = setTimeout(async () => {
                try {
                    const avaliacaoAtual = avaliacoes[abaAtiva]

                    if (
                        !avaliacaoAtual.isSaved &&
                        avaliacaoAtual.fornecedorSelecionado &&
                        avaliacaoAtual.numeroAmostra &&
                        avaliacaoAtual.torraSelecionada
                    ) {
                        console.log("Executando auto-save...")
                        const docId = await salvarAvaliacaoFirebase(avaliacaoAtual, false)
                        if (docId) {
                            console.log("Auto-save realizado com sucesso")
                        }
                    }
                } catch (error) {
                    console.error("Erro no auto-save:", error)
                }
            }, 10000)

            return () => {
                if (autoSaveTimeoutRef.current) {
                    clearTimeout(autoSaveTimeoutRef.current)
                }
            }
        }
    }, [avaliacoes, abaAtiva, salvarAvaliacaoFirebase])

    // Função handlePrintPDF mantida igual (muito longa, mantendo original)
    const handlePrintPDF = () => {
        if (!avaliacaoAtual) return

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
            const titulo = "Avaliação Sensorial de Cafés"
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

            const corpoNotas = [
                ["Aroma / Fragrância", avaliacaoAtual.notas.AromaFragrancia],
                ["Sabor", avaliacaoAtual.notas.sabor],
                ["Finalização", avaliacaoAtual.notas.finalizacao],
                ["Acidez", avaliacaoAtual.notas.acidez],
            ]

            if (avaliacaoAtual.obsAcidez) corpoNotas.push(["Tipo de Acidez", avaliacaoAtual.obsAcidez])

            corpoNotas.push(
                ["Corpo", avaliacaoAtual.notas.corpo],
                ["Equilíbrio", avaliacaoAtual.notas.equilibrio],
                ["Avaliação Pessoal", avaliacaoAtual.notas.avaliacaoPessoal],
            )

            const descontos = calcularTotalDescontos()
            const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"]

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Identificação", "Valor"]],
                    body: [
                        ["Avaliador", avaliacaoAtual.avaliador || "—"],
                        ["Data", new Date(avaliacaoAtual.data).toLocaleDateString("pt-BR")],
                        ["Fornecedor", avaliacaoAtual.fornecedorSelecionado || "—"],
                        ["Nº Amostra", avaliacaoAtual.numeroAmostra || "—"],
                        ["Torra", avaliacaoAtual.torraSelecionada || "—"],
                        [
                            { content: "Pontuação Final", styles: { fontStyle: "bold" } },
                            { content: calcularPontuacaoFinal(), styles: { fontStyle: "bold" } },
                        ],
                        [
                            { content: "Notas Sensoriais", styles: { fontStyle: "bold" } },
                            { content: avaliacaoAtual.notasSensorias || "—", styles: { fontStyle: "bold" } },
                        ],
                    ],
                }),
            )

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Atributo Sensorial", "Nota"]],
                    body: corpoNotas,
                }),
            )

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Critério", "Valor"]],
                    body: [
                        ["Dry", intensidades[avaliacaoAtual.dry] || "—"],
                        ["Break", intensidades[avaliacaoAtual.breakValue] || "—"],
                        ["Nível de Acidez", intensidades[avaliacaoAtual.nivelAcidez] || "—"],
                        ["Nível de Corpo", intensidades[avaliacaoAtual.nivelCorpo] || "—"],
                        ["Defeitos Leves", `-${avaliacaoAtual.defeitosLeves * 2}`],
                        ["Defeitos Graves", `-${avaliacaoAtual.defeitosGraves * 4}`],
                        ["Total de Pontos Descontados", `-${descontos}`],
                    ],
                }),
            )

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Observações", "Conteúdo"]],
                    body: [["Observações Gerais", avaliacaoAtual.observacoes || "—"]],
                }),
            )

            const assinaturaY = docPDF.lastAutoTable.finalY + 30
            const linhaLargura = 80
            const linhaInicioX = (pageWidth - linhaLargura) / 2

            docPDF.line(linhaInicioX, assinaturaY, linhaInicioX + linhaLargura, assinaturaY)
            docPDF.setFont("times", "normal")
            docPDF.setFontSize(12)
            docPDF.text(`Avaliador: ${avaliacaoAtual.avaliador || "—"}`, pageWidth / 2, assinaturaY + 7, { align: "center" })
            docPDF.save(`laudo_scaa_${avaliacaoAtual.numeroAmostra}_${new Date().toISOString().split("T")[0]}.pdf`)
        }
    }

    const updateField = (field, value) => {
        if (abaAtiva === null) return

        setAvaliacoes((prev) => {
            const newAvaliacoes = [...prev]
            newAvaliacoes[abaAtiva] = {
                ...newAvaliacoes[abaAtiva],
                [field]: value,
                isSaved: false,
            }
            return newAvaliacoes
        })
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"]

    // ✅ TELA DE CARREGAMENTO MELHORADA COM OPÇÕES DE RECUPERAÇÃO
    if (!avaliacaoAtual) {
        return (
            <div className="scaa-container">
                <div className="scaa-header">
                    <h2>Avaliação Sensorial de Café - SCAA</h2>
                    <div className="header-buttons">
                        <button onClick={limparDadosLocais} className="btn-small btn-danger" title="Limpar dados locais">
                            🗑️
                        </button>
                        <button className="fechar" onClick={() => navigate("/logado")}>
                            ✖
                        </button>
                    </div>
                </div>

                {/* ✅ MODAL DE RECUPERAÇÃO DE DADOS */}
                {mostrarRecuperacao && (
                    <div className="modal-recuperacao">
                        <div className="modal-content">
                            <h3>Dados Encontrados</h3>
                            <p>Encontramos {avaliacoesSalvas.length} avaliação(ões) salva(s) recentemente.</p>
                            <p>Deseja recuperar esses dados?</p>
                            <div className="modal-buttons">
                                <button onClick={recuperarDadosFirebase} className="btn-primary">
                                    Sim, Recuperar
                                </button>
                                <button onClick={() => setMostrarRecuperacao(false)} className="btn-secondary">
                                    Não, Começar Novo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="scaa-form">
                    <p>Carregando avaliação...</p>
                    <button onClick={criarNovaAvaliacao}>Criar Nova Avaliação</button>
                </div>
            </div>
        )
    }

    return (
        <div className="scaa-container">
            <div className="scaa-header">
                <h2>Avaliação Sensorial de Café - SCAA</h2>
                <div className="header-buttons">
                    <button onClick={limparDadosLocais} className="btn-small btn-danger" title="Limpar dados locais">
                        🗑️
                    </button>
                    <button className="fechar" onClick={() => navigate("/logado")}>
                        ✖
                    </button>
                </div>
            </div>

            {/* ✅ INDICADOR DE STATUS DE PERSISTÊNCIA */}
            <div className="status-persistencia">
                <span className={`status-indicator ${avaliacaoAtual.isSaved ? "saved" : "unsaved"}`}>
                    {avaliacaoAtual.isSaved ? "✓ Salvo" : "⚠️ Não salvo"}
                </span>
                <span className="auto-save-info">Os dados são salvos automaticamente no seu navegador</span>
            </div>

            <div className={`abas-sticky-container ${scrollPosition > 100 ? "compact-mode" : ""}`}>
                <div className="abas">
                    {avaliacoes.map((av, index) => {
                        return (
                            <button
                                key={av.id}
                                className={abaAtiva === index ? "aba ativa" : "aba"}
                                onClick={() => setAbaAtiva(index)}
                                title={`Fornecedor: ${av.fornecedorSelecionado || "Não selecionado"}, Amostra: ${av.numeroAmostra || "Não definida"}`}
                            >
                                <div className="aba-conteudo">
                                    <div className="aba-numero">{av.numeroAmostra || `#${index + 1}`}</div>
                                    <div className="aba-fornecedor">{av.fornecedorSelecionado || "Sem fornecedor"}</div>
                                    {av.isSaved && <div className="aba-status">✓</div>}
                                </div>
                            </button>
                        )
                    })}
                    <button onClick={criarNovaAvaliacao} className="botao-nova-aba">
                        + Nova Avaliação
                    </button>
                </div>
            </div>

            <div className="scaa-form">
                <div className="campos-form">
                    <div className="campo-form">
                        <label>Nome do Avaliador:</label>
                        <input
                            type="text"
                            value={avaliacaoAtual.avaliador}
                            onChange={(e) => updateField("avaliador", e.target.value)}
                        />
                    </div>

                    <div className="campo-form">
                        <label>Data:</label>
                        <input type="date" value={avaliacaoAtual.data} onChange={(e) => updateField("data", e.target.value)} />
                    </div>

                    <div className="campo-form">
                        <label>Fornecedor:</label>
                        <div className="input-com-botao">
                            <select
                                value={avaliacaoAtual.fornecedorSelecionado}
                                onChange={(e) => updateField("fornecedorSelecionado", e.target.value)}
                            >
                                <option value="">{dataLoading ? "Carregando fornecedores..." : "Selecione um fornecedor"}</option>
                                {fornecedores.map((f) => (
                                    <option key={f.id} value={f.nome}>
                                        {f.nome}
                                    </option>
                                ))}
                            </select>
                            <button type="button" onClick={() => navigate("/fornecedores")} className="botao-icone">
                                <i className="bi bi-folder-plus"></i>
                                <span className="botao-texto">Novo</span>
                            </button>
                        </div>
                    </div>

                    <div className="campo-form">
                        <label>N° da Amostra:</label>
                        <input
                            type="text"
                            value={avaliacaoAtual.numeroAmostra}
                            onChange={(e) => updateField("numeroAmostra", e.target.value)}
                            placeholder="Digite o número da amostra"
                        />
                    </div>
                </div>

                <div className="campo-form observacoes-campo">
                    <label>Observações:</label>
                    <textarea
                        value={avaliacaoAtual.observacoes}
                        onChange={(e) => updateField("observacoes", e.target.value)}
                        placeholder="Adicione observações..."
                        className="observacoes-textarea"
                    />
                </div>

                {/* Resto do formulário mantido exatamente igual ao original */}
                <div className="torra-container">
                    <h3>SELECIONE A COR DA TORRA:</h3>
                    <div className="torra-options">
                        {[
                            { nome: "Torra Clara", cor: "#a57b70" },
                            { nome: "Torra Média Clara", cor: "#704e44" },
                            { nome: "Torra Média", cor: "#553026" },
                            { nome: "Torra Escura", cor: "#3b1e17" },
                        ].map((torra) => (
                            <div
                                key={torra.nome}
                                className={`torra-option ${avaliacaoAtual.torraSelecionada === torra.nome ? "selecionado" : ""}`}
                                onClick={() => updateField("torraSelecionada", torra.nome)}
                            >
                                <GraoCafe cor={torra.cor} />
                                <span>{torra.nome}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sliders verticais (DRY, BREAK) - mantidos iguais */}
                <div className="vertical-sliders-container">
                    <div className="vertical-slider-box">
                        <h4 className="dry">
                            Dry <br /> "Aroma do pó seco"
                        </h4>
                        <div className="slider-row-with-note">
                            <div className="slider-row">
                                <div className="slider-labels">
                                    {intensidades
                                        .slice()
                                        .reverse()
                                        .map((label, displayIndex) => {
                                            const actualIndex = 4 - displayIndex
                                            return (
                                                <span
                                                    key={actualIndex}
                                                    className={avaliacaoAtual.dry === actualIndex ? "selected" : ""}
                                                    onClick={() => updateField("dry", actualIndex)}
                                                >
                                                    {label}
                                                </span>
                                            )
                                        })}
                                </div>
                                <div
                                    className="slider-indicator"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const y = e.clientY - rect.top
                                        const percentage = Math.min(Math.max(y / rect.height, 0), 1)
                                        const newValue = 4 - Math.round(percentage * 4)
                                        updateField("dry", newValue)
                                    }}
                                >
                                    <div
                                        className="slider-ball"
                                        style={{
                                            top: `${((4 - avaliacaoAtual.dry) / 4) * 100}%`,
                                        }}
                                    ></div>
                                    <div className="slider-line"></div>
                                </div>
                            </div>
                            <textarea
                                className="slider-lateral-note"
                                placeholder="Observações Dry"
                                value={avaliacaoAtual.obsDry}
                                onChange={(e) => updateField("obsDry", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="vertical-slider-box">
                        <h4 className="break">
                            Break <br /> "Aroma de Quebra de xicara"
                        </h4>
                        <div className="slider-row-with-note">
                            <div className="slider-row">
                                <div className="slider-labels">
                                    {intensidades
                                        .slice()
                                        .reverse()
                                        .map((label, displayIndex) => {
                                            const actualIndex = 4 - displayIndex
                                            return (
                                                <span
                                                    key={actualIndex}
                                                    className={avaliacaoAtual.breakValue === actualIndex ? "selected" : ""}
                                                    onClick={() => updateField("breakValue", actualIndex)}
                                                >
                                                    {label}
                                                </span>
                                            )
                                        })}
                                </div>
                                <div
                                    className="slider-indicator"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const y = e.clientY - rect.top
                                        const percentage = Math.min(Math.max(y / rect.height, 0), 1)
                                        const newValue = 4 - Math.round(percentage * 4)
                                        updateField("breakValue", newValue)
                                    }}
                                >
                                    <div
                                        className="slider-ball"
                                        style={{
                                            top: `${((4 - avaliacaoAtual.breakValue) / 4) * 100}%`,
                                        }}
                                    ></div>
                                    <div className="slider-line"></div>
                                </div>
                            </div>
                            <textarea
                                className="slider-lateral-note"
                                placeholder="Observações Break"
                                value={avaliacaoAtual.obsBreak}
                                onChange={(e) => updateField("obsBreak", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Todos os sliders horizontais mantidos iguais */}
                <div className="nota-container">
                    <label>Aroma / Fragrancia:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={avaliacaoAtual.notas.AromaFragrancia}
                        onChange={(e) => handleNotaChange("AromaFragrancia", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                            <span
                                key={num}
                                className={Number(avaliacaoAtual.notas.AromaFragrancia) === num ? "selecionado" : ""}
                                onClick={() => handleNotaChange("AromaFragrancia", num)}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="nota-container">
                    <label>Sabor:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={avaliacaoAtual.notas.sabor}
                        onChange={(e) => handleNotaChange("sabor", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                            <span
                                key={num}
                                className={Number(avaliacaoAtual.notas.sabor) === num ? "selecionado" : ""}
                                onClick={() => handleNotaChange("sabor", num)}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="nota-container">
                    <label>Finalização:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={avaliacaoAtual.notas.finalizacao}
                        onChange={(e) => handleNotaChange("finalizacao", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                            <span
                                key={num}
                                className={Number(avaliacaoAtual.notas.finalizacao) === num ? "selecionado" : ""}
                                onClick={() => handleNotaChange("finalizacao", num)}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="nota-cafe-container">
                    <label>Notas Sensoriais:</label>
                    <textarea
                        value={avaliacaoAtual.notasSensorias}
                        onChange={(e) => updateField("notasSensorias", e.target.value)}
                        placeholder="Preencha as notas encontradas no café"
                        className="notas-sensoriais-textarea"
                    />
                </div>

                <div className="vertical-sliders-container vertical-slider-single">
                    <div className="titulo-acidez-com-botao">
                        <h4>Nível de Acidez</h4>
                    </div>

                    <div className="slider-row">
                        <div className="slider-labels">
                            {intensidades
                                .slice()
                                .reverse()
                                .map((label, displayIndex) => {
                                    const actualIndex = 4 - displayIndex
                                    return (
                                        <span
                                            key={actualIndex}
                                            className={avaliacaoAtual.nivelAcidez === actualIndex ? "selected" : ""}
                                            onClick={() => updateField("nivelAcidez", actualIndex)}
                                        >
                                            {label}
                                        </span>
                                    )
                                })}
                        </div>
                        <div
                            className="slider-indicator"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const y = e.clientY - rect.top
                                const percentage = Math.min(Math.max(y / rect.height, 0), 1)
                                const newValue = 4 - Math.round(percentage * 4)
                                updateField("nivelAcidez", newValue)
                            }}
                        >
                            <div
                                className="slider-ball"
                                style={{
                                    top: `${((4 - avaliacaoAtual.nivelAcidez) / 4) * 100}%`,
                                }}
                            ></div>
                            <div className="slider-line"></div>
                        </div>
                    </div>
                </div>

                <div className="nota-container">
                    <label>Acidez:</label>
                    <button
                        className="botao-info-acidez"
                        onClick={() => setMostrarTiposAcidez(!mostrarTiposAcidez)}
                        title="Ver tipos de acidez"
                        type="button"
                    >
                        <i className="bi bi-info-circle-fill"></i>
                    </button>

                    {mostrarTiposAcidez && (
                        <div className="caixa-tipos-acidez">
                            <button className="fechar-info" onClick={() => setMostrarTiposAcidez(false)}>
                                ×
                            </button>
                            <p>
                                <strong>Acidez Cítrica:</strong> Limão, laranja, lima, abacaxi. Bastante desejável.
                            </p>
                            <p>
                                <strong>Acidez Fosfórica:</strong> Presente em refrigerantes tipo cola, lembra espumante.
                            </p>
                            <p>
                                <strong>Acidez Málica:</strong> Como a da maçã. Comum em cafés de altitude, especialmente na América
                                Central.
                            </p>
                            <p>
                                <strong>Acidez Lática:</strong> Derivados do leite. Rara no café.
                            </p>
                            <p>
                                <strong>Acidez Tartárica:</strong> Comum nos vinhos, vinda da videira.
                            </p>
                            <p>
                                <strong>Acidez Acética:</strong> Acidez do vinagre. Considerado defeito no café.
                            </p>
                        </div>
                    )}
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={avaliacaoAtual.notas.acidez}
                        onChange={(e) => handleNotaChange("acidez", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                            <span
                                key={num}
                                className={Number(avaliacaoAtual.notas.acidez) === num ? "selecionado" : ""}
                                onClick={() => handleNotaChange("acidez", num)}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                    <textarea
                        className="observacoes-acidez"
                        placeholder="Observações Acidez"
                        value={avaliacaoAtual.obsAcidez}
                        onChange={(e) => updateField("obsAcidez", e.target.value)}
                    />
                </div>

                <div className="vertical-sliders-container vertical-slider-single">
                    <h4>Nível de Corpo</h4>
                    <div className="slider-row">
                        <div className="slider-labels">
                            {intensidades
                                .slice()
                                .reverse()
                                .map((label, displayIndex) => {
                                    const actualIndex = 4 - displayIndex
                                    return (
                                        <span
                                            key={actualIndex}
                                            className={avaliacaoAtual.nivelCorpo === actualIndex ? "selected" : ""}
                                            onClick={() => updateField("nivelCorpo", actualIndex)}
                                        >
                                            {label}
                                        </span>
                                    )
                                })}
                        </div>
                        <div
                            className="slider-indicator"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const y = e.clientY - rect.top
                                const percentage = Math.min(Math.max(y / rect.height, 0), 1)
                                const newValue = 4 - Math.round(percentage * 4)
                                updateField("nivelCorpo", newValue)
                            }}
                        >
                            <div
                                className="slider-ball"
                                style={{
                                    top: `${((4 - avaliacaoAtual.nivelCorpo) / 4) * 100}%`,
                                }}
                            ></div>
                            <div className="slider-line"></div>
                        </div>
                    </div>
                </div>

                <div className="nota-container">
                    <label>Corpo:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={avaliacaoAtual.notas.corpo}
                        onChange={(e) => handleNotaChange("corpo", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                            <span
                                key={num}
                                className={Number(avaliacaoAtual.notas.corpo) === num ? "selecionado" : ""}
                                onClick={() => handleNotaChange("corpo", num)}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="nota-container">
                    <label>Equilíbrio:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={avaliacaoAtual.notas.equilibrio}
                        onChange={(e) => handleNotaChange("equilibrio", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                            <span
                                key={num}
                                className={Number(avaliacaoAtual.notas.equilibrio) === num ? "selecionado" : ""}
                                onClick={() => handleNotaChange("equilibrio", num)}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="nota-container">
                    <label>Avaliação Pessoal:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={avaliacaoAtual.notas.avaliacaoPessoal}
                        onChange={(e) => handleNotaChange("avaliacaoPessoal", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                            <span
                                key={num}
                                className={Number(avaliacaoAtual.notas.avaliacaoPessoal) === num ? "selecionado" : ""}
                                onClick={() => handleNotaChange("avaliacaoPessoal", num)}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="secao-xicaras-defeitos">
                    <h4 className="titulo-secao">Pontuação dos atributos de xícaras:</h4>
                    <div className="nota-xicaras-valor">{calcularPontuacaoXicaras().toFixed(2)}</div>

                    <div className="xicaras-container">
                        <div className="xicaras-group">
                            <label>Doçura</label>
                            <div className="checkboxes-coluna">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <input
                                        key={index}
                                        type="checkbox"
                                        checked={avaliacaoAtual.notas.doçura[index]}
                                        onChange={() => toggleCheckbox("doçura", index)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="xicaras-group">
                            <label>Uniformidade</label>
                            <div className="checkboxes-coluna">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <input
                                        key={index}
                                        type="checkbox"
                                        checked={avaliacaoAtual.notas.uniformidade[index]}
                                        onChange={() => toggleCheckbox("uniformidade", index)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="xicaras-group">
                            <label>Limpeza de xícara</label>
                            <div className="checkboxes-coluna">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <input
                                        key={index}
                                        type="checkbox"
                                        checked={avaliacaoAtual.notas.xicaraLimpa[index]}
                                        onChange={() => toggleCheckbox("xicaraLimpa", index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="defeitos-container">
                    <div className="defeito-box">
                        <label>Defeito Leve (-2):</label>
                        <input
                            type="number"
                            value={avaliacaoAtual.defeitosLeves}
                            onChange={(e) => updateField("defeitosLeves", Number(e.target.value) || 0)}
                        />
                        <span className="resultado-defeito">= {avaliacaoAtual.defeitosLeves * 2}</span>
                    </div>
                    <div className="defeito-box">
                        <label>Defeito Grave (-4):</label>
                        <input
                            type="number"
                            value={avaliacaoAtual.defeitosGraves}
                            onChange={(e) => updateField("defeitosGraves", Number(e.target.value) || 0)}
                        />
                        <span className="resultado-defeito">= {avaliacaoAtual.defeitosGraves * 4}</span>
                    </div>
                </div>

                <div className="pontuacao-final">
                    <h2>PONTUAÇÃO FINAL: {calcularPontuacaoFinal()}</h2>
                    <p>Descontos Totais: {calcularTotalDescontos()}</p>
                </div>

                <button className="salvar" onClick={handleSalvarAvaliacao} disabled={isSaving}>
                    {isSaving ? "SALVANDO..." : "SALVAR"}
                </button>
            </div>

            {scrollPosition > 300 && (
                <button className="voltar-ao-topo" onClick={scrollToTop} title="Voltar ao topo">
                    <i className="bi bi-arrow-up-circle-fill"></i>
                </button>
            )}
        </div>
    )
}

export default Scaa
