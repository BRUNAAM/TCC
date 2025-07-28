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
        fazenda: "",
        variedade: "",
        processo: "",
        altitude: "",
        umidade: "",
        densidade: "",
        obsInformacoesGerais: "",
        obsTorra: "",
        obsXicaras: "",
        obsDefeitos: "",
        obsCorpo: "",
        obsEquilibrio: "",
        obsAvaliacaoPessoal: "",
        obsAromaFragrancia: "",
        obsSabor: "",
        obsFinalizacao: "",
        ...overrides,
    }
}

const Scaa = () => {
    // ✅ TRATAMENTO DE ERRO GLOBAL MELHORADO
    useEffect(() => {
        const handleError = (error) => {
            console.error("Erro capturado:", error)
            if (error.message && !error.message.includes("ResizeObserver")) {
                console.warn("Erro não crítico:", error.message)
            }
        }

        const handleUnhandledRejection = (event) => {
            console.error("Promise rejeitada:", event.reason)
            event.preventDefault()
        }

        window.addEventListener("error", handleError)
        window.addEventListener("unhandledrejection", handleUnhandledRejection)

        return () => {
            window.removeEventListener("error", handleError)
            window.removeEventListener("unhandledrejection", handleUnhandledRejection)
        }
    }, [])

    // ✅ ESTADOS COM PERSISTÊNCIA MELHORADA
    const [avaliacoes, setAvaliacoes] = useLocalStorage("scaa-avaliacoes", [])
    const [abaAtiva, setAbaAtiva] = useLocalStorage("scaa-aba-ativa", null)

    // ✅ NOVOS ESTADOS PARA FUNCIONALIDADES AVANÇADAS
    const [mostrarRecuperacao, setMostrarRecuperacao] = useState(false)
    const [mostrarTiposAcidez, setMostrarTiposAcidez] = useState(false)
    const [scrollPosition, setScrollPosition] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [showNotification, setShowNotification] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState("")
    const [notificationType, setNotificationType] = useState("success")
    const [isAutoSaving, setIsAutoSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [saveProgress, setSaveProgress] = useState(0)

    // ✅ REFS PARA CONTROLE AVANÇADO
    const autoSaveTimeoutRef = useRef(null)
    const notificationTimeoutRef = useRef(null)
    const progressIntervalRef = useRef(null)
    const navigate = useNavigate()

    // ✅ USANDO DADOS DO CONTEXTO E FIREBASE
    const { fornecedores, loading: dataLoading } = useData()
    const { avaliacoesSalvas, loading: firebaseLoading } = useFirebaseData()

    const avaliacaoAtual = abaAtiva !== null && avaliacoes[abaAtiva] ? avaliacoes[abaAtiva] : null

    // ✅ FUNÇÃO DE NOTIFICAÇÃO MELHORADA
    const showNotificationMessage = useCallback((message, type = "success", duration = 3000) => {
        setNotificationMessage(message)
        setNotificationType(type)
        setShowNotification(true)

        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current)
        }

        notificationTimeoutRef.current = setTimeout(() => {
            setShowNotification(false)
        }, duration)
    }, [])

    // ✅ EFEITO PARA CONTROLE DE NAVEGAÇÃO E SCROLL MELHORADO
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (avaliacaoAtual && !avaliacaoAtual.isSaved) {
                e.preventDefault()
                e.returnValue = "Você tem alterações não salvas. Deseja realmente sair?"
                return e.returnValue
            }
        }

        const handlePopState = (e) => {
            if (avaliacaoAtual && !avaliacaoAtual.isSaved) {
                const confirmExit = window.confirm("Você tem alterações não salvas. Deseja realmente sair?")
                if (!confirmExit) {
                    window.history.pushState(null, null, window.location.href)
                    return
                }
            }
        }

        const handleScroll = () => {
            setScrollPosition(window.scrollY)
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        window.addEventListener("popstate", handlePopState)
        window.addEventListener("scroll", handleScroll)

        window.history.pushState(null, null, window.location.href)

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
            window.removeEventListener("popstate", handlePopState)
            window.removeEventListener("scroll", handleScroll)

            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current)
            }
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
        }
    }, [avaliacaoAtual])

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
                    showNotificationMessage("Nova avaliação criada!", "info")
                } else {
                    if (abaAtiva === null && avaliacoes.length > 0) {
                        setAbaAtiva(0)
                    }
                }
            } catch (error) {
                console.error("Erro ao inicializar avaliação:", error)
                showNotificationMessage("Erro ao inicializar avaliação", "error")
            }
        }

        inicializarAvaliacao()
    }, [avaliacoes.length, abaAtiva, setAvaliacoes, setAbaAtiva, showNotificationMessage])

    // ✅ EFEITO PARA MOSTRAR OPÇÃO DE RECUPERAÇÃO DE DADOS DO FIREBASE
    useEffect(() => {
        if (!firebaseLoading && avaliacoesSalvas.length > 0 && avaliacoes.length <= 1) {
            const avaliacoesRecentes = avaliacoesSalvas.filter((av) => {
                const dataAvaliacao = new Date(av.dataCriacao)
                const agora = new Date()
                const diferencaHoras = (agora.getTime() - dataAvaliacao.getTime()) / (1000 * 60 * 60)
                return diferencaHoras < 24
            })

            if (avaliacoesRecentes.length > 0) {
                setMostrarRecuperacao(true)
            }
        }
    }, [firebaseLoading, avaliacoesSalvas, avaliacoes.length])

    // ✅ FUNÇÃO PARA RECUPERAR DADOS DO FIREBASE
    const recuperarDadosFirebase = () => {
        try {
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
            showNotificationMessage(`${avaliacoesRecuperadas.length} avaliação(ões) recuperada(s) com sucesso!`, "success")
        } catch (error) {
            console.error("Erro ao recuperar dados:", error)
            showNotificationMessage("Erro ao recuperar dados do Firebase", "error")
        }
    }

    // ✅ FUNÇÃO PARA LIMPAR DADOS LOCAIS COM CONFIRMAÇÃO MELHORADA
    const limparDadosLocais = () => {
        const hasUnsavedData = avaliacoes.some((av) => !av.isSaved)
        const confirmMessage = hasUnsavedData
            ? "ATENÇÃO: Você tem dados não salvos! Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita."
            : "Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita."

        if (window.confirm(confirmMessage)) {
            try {
                localStorage.removeItem("scaa-avaliacoes")
                localStorage.removeItem("scaa-aba-ativa")
                setAvaliacoes([])
                setAbaAtiva(null)
                showNotificationMessage("Dados locais limpos com sucesso!", "info")
                setTimeout(() => window.location.reload(), 1000)
            } catch (error) {
                console.error("Erro ao limpar dados:", error)
                showNotificationMessage("Erro ao limpar dados locais", "error")
            }
        }
    }

    // ✅ FUNÇÕES ORIGINAIS MANTIDAS (com melhorias de performance)
    const handleNotaChange = useCallback(
        (categoria, valor) => {
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
        },
        [avaliacaoAtual, abaAtiva, setAvaliacoes],
    )

    const toggleCheckbox = useCallback(
        (atributo, index) => {
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
        },
        [avaliacaoAtual, abaAtiva, setAvaliacoes],
    )

    const calcularPontuacaoXicara = useCallback(
        (atributo) => {
            if (!avaliacaoAtual) return 0
            const marcados = avaliacaoAtual.notas[atributo].filter((v) => v).length
            return 10 - marcados * 2
        },
        [avaliacaoAtual],
    )

    const calcularPontuacaoXicaras = useCallback(() => {
        return (
            calcularPontuacaoXicara("doçura") +
            calcularPontuacaoXicara("uniformidade") +
            calcularPontuacaoXicara("xicaraLimpa")
        )
    }, [calcularPontuacaoXicara])

    const calcularPontuacaoFinal = useCallback(() => {
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
    }, [avaliacaoAtual, calcularPontuacaoXicara])

    const calcularTotalDescontos = useCallback(() => {
        if (!avaliacaoAtual) return 0
        return avaliacaoAtual.defeitosLeves * 2 + avaliacaoAtual.defeitosGraves * 4
    }, [avaliacaoAtual])

    // ✅ FUNÇÃO PARA SALVAR NO FIREBASE COM INDICADOR DE PROGRESSO
    const salvarAvaliacaoFirebase = useCallback(
        async (avaliacao, isFinalSave = false) => {
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
                    if (isFinalSave) {
                        showNotificationMessage("Preencha todos os campos obrigatórios", "warning")
                    }
                    return null
                }

                if (isFinalSave) {
                    setSaveProgress(0)
                    progressIntervalRef.current = setInterval(() => {
                        setSaveProgress((prev) => Math.min(prev + 10, 90))
                    }, 100)
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

                const calcularPontuacaoXicaraInterna = (atributo) => {
                    const marcados = avaliacao.notas[atributo].filter((v) => v).length
                    return 10 - marcados * 2
                }

                total += calcularPontuacaoXicaraInterna("xicaraLimpa")
                total += calcularPontuacaoXicaraInterna("uniformidade")
                total += calcularPontuacaoXicaraInterna("doçura")
                total -= totalDescontos

                const avaliacaoParaSalvar = {
                    ...avaliacao,
                    pontuacaoFinal: total.toFixed(2),
                    totalDescontos,
                    userId: user.uid,
                    dataCriacao: new Date().toISOString(),
                    tipoSalvamento: isFinalSave ? "manual" : "automatico",
                    versao: "2.0",
                }

                const docRef = await addDoc(collection(db, "usuarios", user.uid, "avaliacoes_scaa"), avaliacaoParaSalvar)

                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current)
                    setSaveProgress(100)
                    setTimeout(() => setSaveProgress(0), 1000)
                }

                console.log(`Avaliação salva ${isFinalSave ? "manualmente" : "automaticamente"} com ID:`, docRef.id)
                setLastSaved(new Date())

                return docRef.id
            } catch (error) {
                console.error("Erro ao salvar avaliação:", error)

                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current)
                    setSaveProgress(0)
                }

                throw error
            }
        },
        [showNotificationMessage],
    )

    // ✅ FUNÇÃO PARA SALVAR COM FEEDBACK MELHORADO
    const handleSalvarAvaliacao = async () => {
        if (!avaliacaoAtual || isSaving) return

        if (!avaliacaoAtual.fornecedorSelecionado || !avaliacaoAtual.numeroAmostra || !avaliacaoAtual.torraSelecionada) {
            showNotificationMessage("Por favor, preencha todos os campos obrigatórios.", "warning")
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

                showNotificationMessage("Avaliação salva com sucesso!", "success")
                handlePrintPDF()
            }
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error)
            showNotificationMessage("Erro ao salvar avaliação. Tente novamente.", "error")
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
        showNotificationMessage("Nova avaliação criada!", "info")
    }

    // ✅ AUTO-SAVE MELHORADO COM INDICADOR
    useEffect(() => {
        if (abaAtiva !== null && avaliacoes[abaAtiva] && !avaliacoes[abaAtiva].isSaved) {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current)
            }

            setIsAutoSaving(true)

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
                            showNotificationMessage("Dados salvos automaticamente", "info", 2000)
                        }
                    }
                } catch (error) {
                    console.error("Erro no auto-save:", error)
                } finally {
                    setIsAutoSaving(false)
                }
            }, 10000)

            return () => {
                if (autoSaveTimeoutRef.current) {
                    clearTimeout(autoSaveTimeoutRef.current)
                }
                setIsAutoSaving(false)
            }
        }
    }, [avaliacoes, abaAtiva, salvarAvaliacaoFirebase, showNotificationMessage])

    // ✅ FUNÇÃO PARA GERAR PDF SEGURA (SEM CORS)
    const handlePrintPDF = () => {
        if (!avaliacaoAtual) return

        try {
            const docPDF = new jsPDF({ unit: "mm", format: "a4" })
            const pageWidth = docPDF.internal.pageSize.getWidth()
            const pageHeight = docPDF.internal.pageSize.getHeight()
            const marginX = 20

            docPDF.setFont("times", "bold")
            docPDF.setFontSize(16)
            docPDF.text("Avaliação Sensorial de Cafés - SCAA", pageWidth / 2, 20, { align: "center" })

            docPDF.setFontSize(12)
            docPDF.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, 30, { align: "center" })

            const autoTableOptions = (config) => ({
                ...config,
                theme: "grid",
                margin: { left: marginX, right: marginX },
                startY: docPDF.lastAutoTable ? docPDF.lastAutoTable.finalY + 10 : 40,
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
                    docPDF.text(`Laudo Técnico SCAA - ${new Date().toLocaleDateString("pt-BR")}`, marginX, pageHeight - 10)
                },
            })

            const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"]
            const descontos = calcularTotalDescontos()

            // Tabela 1: Identificação e Informações Gerais
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
                        ["Fazenda", avaliacaoAtual.fazenda || "—"],
                        ["Variedade", avaliacaoAtual.variedade || "—"],
                        ["Processo", avaliacaoAtual.processo || "—"],
                        ["Altitude (m)", avaliacaoAtual.altitude || "—"],
                        ["Umidade (%)", avaliacaoAtual.umidade || "—"],
                        ["Densidade (g/L)", avaliacaoAtual.densidade || "—"],
                        ["Obs. Informações Gerais", avaliacaoAtual.obsInformacoesGerais || "—"],
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

            // Tabela 2: Atributos Sensoriais
            const corpoNotas = [
                ["Aroma / Fragrância", avaliacaoAtual.notas.AromaFragrancia],
                ["Sabor", avaliacaoAtual.notas.sabor],
                ["Finalização", avaliacaoAtual.notas.finalizacao],
                ["Acidez", avaliacaoAtual.notas.acidez],
                ["Corpo", avaliacaoAtual.notas.corpo],
                ["Equilíbrio", avaliacaoAtual.notas.equilibrio],
                ["Avaliação Pessoal", avaliacaoAtual.notas.avaliacaoPessoal],
            ]

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Atributo Sensorial", "Nota"]],
                    body: corpoNotas,
                }),
            )

            // Tabela 3: Critérios e Observações
            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Critério", "Valor"]],
                    body: [
                        ["Dry", intensidades[avaliacaoAtual.dry] || "—"],
                        ["Observações Dry", avaliacaoAtual.obsDry || "—"],
                        ["Break", intensidades[avaliacaoAtual.breakValue] || "—"],
                        ["Observações Break", avaliacaoAtual.obsBreak || "—"],
                        ["Nível de Acidez", intensidades[avaliacaoAtual.nivelAcidez] || "—"],
                        ["Nível de Corpo", intensidades[avaliacaoAtual.nivelCorpo] || "—"],
                        ["Observações Torra", avaliacaoAtual.obsTorra || "—"],
                        ["Defeitos Leves", `-${avaliacaoAtual.defeitosLeves * 2}`],
                        ["Defeitos Graves", `-${avaliacaoAtual.defeitosGraves * 4}`],
                        ["Observações Defeitos", avaliacaoAtual.obsDefeitos || "—"],
                        ["Obs. Corpo", avaliacaoAtual.obsCorpo || "—"],
                        ["Obs. Equilíbrio", avaliacaoAtual.obsEquilibrio || "—"],
                        ["Obs. Avaliação Pessoal", avaliacaoAtual.obsAvaliacaoPessoal || "—"],
                        ["Obs. Aroma / Fragrância", avaliacaoAtual.obsAromaFragrancia || "—"],
                        ["Obs. Sabor", avaliacaoAtual.obsSabor || "—"],
                        ["Obs. Finalização", avaliacaoAtual.obsFinalizacao || "—"],
                        ["Total de Pontos Descontados", `-${descontos}`],
                    ],
                }),
            )

            // Tabela 4: Detalhes de Xícaras
            const getCheckboxStatus = (arr) => {
                return arr.map((checked, i) => `Copo ${i + 1}: ${checked ? "✓" : "✗"}`).join(", ")
            }

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Atributo de Xícara", "Status dos Copos", "Pontuação"]],
                    body: [
                        ["Doçura", getCheckboxStatus(avaliacaoAtual.notas.doçura), calcularPontuacaoXicara("doçura")],
                        [
                            "Uniformidade",
                            getCheckboxStatus(avaliacaoAtual.notas.uniformidade),
                            calcularPontuacaoXicara("uniformidade"),
                        ],
                        [
                            "Xícara Limpa",
                            getCheckboxStatus(avaliacaoAtual.notas.xicaraLimpa),
                            calcularPontuacaoXicara("xicaraLimpa"),
                        ],
                        [
                            { content: "Pontuação Total das Xícaras", styles: { fontStyle: "bold" } },
                            "",
                            { content: calcularPontuacaoXicaras().toFixed(2), styles: { fontStyle: "bold" } },
                        ],
                        ["Observações Xícaras", { content: avaliacaoAtual.obsXicaras || "—", colSpan: 2 }],
                    ],
                    columnStyles: {
                        0: { cellWidth: 40 },
                        1: { cellWidth: 80 },
                        2: { cellWidth: 30, halign: "center" },
                    },
                }),
            )

            // Tabela 5: Observações Gerais
            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Observações Gerais", "Conteúdo"]],
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

            const nomeArquivo = `laudo_scaa_${avaliacaoAtual.numeroAmostra || "sem_numero"}_${new Date().toISOString().split("T")[0]}.pdf`
            docPDF.save(nomeArquivo)

            showNotificationMessage("PDF gerado com sucesso!", "success")
        } catch (error) {
            console.error("Erro ao gerar PDF:", error)
            showNotificationMessage("Erro ao gerar PDF. Tente novamente.", "error")
        }
    }

    const updateField = useCallback(
        (field, value) => {
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
        },
        [abaAtiva, setAvaliacoes],
    )

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"]

    // ✅ TELA DE CARREGAMENTO MELHORADA
    if (!avaliacaoAtual) {
        return (
            <div className="scaa-container">
                <div className="scaa-header">
                    <h2>Avaliação Sensorial de Cafés</h2>
                    <div className="header-buttons">
                        <button onClick={limparDadosLocais} className="btn-small btn-danger" title="Limpar dados locais">
                            🗑️
                        </button>
                        <button className="fechar" onClick={() => navigate("/logado")}>
                            ✖
                        </button>
                    </div>
                </div>

                {mostrarRecuperacao && (
                    <div className="modal-recuperacao">
                        <div className="modal-content">
                            <h3>🔄 Dados Encontrados</h3>
                            <p>
                                Encontramos <strong>{avaliacoesSalvas.length}</strong> avaliação(ões) salva(s) recentemente no Firebase.
                            </p>
                            <p>Deseja recuperar esses dados?</p>
                            <div className="modal-buttons">
                                <button onClick={recuperarDadosFirebase} className="btn-primary">
                                    ✅ Sim, Recuperar
                                </button>
                                <button onClick={() => setMostrarRecuperacao(false)} className="btn-secondary">
                                    ❌ Não, Começar Novo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="scaa-form">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Carregando avaliação...</p>
                        <button onClick={criarNovaAvaliacao} className="btn-primary">
                            ➕ Criar Nova Avaliação
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="scaa-container">
            {/* ✅ SISTEMA DE NOTIFICAÇÕES */}
            {showNotification && (
                <div className={`notification ${notificationType} ${showNotification ? "show" : ""}`}>
                    <div className="notification-content">
                        <span className="notification-icon">
                            {notificationType === "success" && "✅"}
                            {notificationType === "error" && "❌"}
                            {notificationType === "warning" && "⚠️"}
                            {notificationType === "info" && "ℹ️"}
                        </span>
                        <span className="notification-message">{notificationMessage}</span>
                        <button className="notification-close" onClick={() => setShowNotification(false)}>
                            ✖
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ INDICADOR DE PROGRESSO DE SALVAMENTO */}
            {saveProgress > 0 && (
                <div className="save-progress-container">
                    <div className="save-progress-bar">
                        <div className="save-progress-fill" style={{ width: `${saveProgress}%` }}></div>
                    </div>
                    <span className="save-progress-text">Salvando... {saveProgress}%</span>
                </div>
            )}

            <div className="scaa-header">
                <h2>Avaliação Sensorial de Cafés</h2>
                <div className="header-buttons">
                    <button onClick={limparDadosLocais} className="btn-small btn-danger" title="Limpar dados locais">
                        🗑️
                    </button>
                    <button className="fechar" onClick={() => navigate("/logado")}>
                        ✖
                    </button>
                </div>
            </div>

            {/* ✅ INDICADOR DE STATUS MELHORADO */}
            <div className="status-persistencia">
                <div className="status-left">
                    <span className={`status-indicator ${avaliacaoAtual.isSaved ? "saved" : "unsaved"}`}>
                        {avaliacaoAtual.isSaved ? "✅ Salvo" : "⚠️ Não salvo"}
                    </span>
                    {isAutoSaving && <span className="auto-saving-indicator">🔄 Salvando automaticamente...</span>}
                </div>
                <div className="status-right">
                    <span className="auto-save-info">
                        {lastSaved ? `Último salvamento: ${lastSaved.toLocaleTimeString()}` : "Auto-save ativo"}
                    </span>
                </div>
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
                                    {av.isSaved && <div className="aba-status">✅</div>}
                                    {!av.isSaved && <div className="aba-status unsaved">⚠️</div>}
                                </div>
                            </button>
                        )
                    })}
                    <button onClick={criarNovaAvaliacao} className="botao-nova-aba">
                        ➕ Nova Avaliação
                    </button>
                </div>
            </div>

            <div className="scaa-form">
                {/* ✅ SEÇÃO DE INFORMAÇÕES GERAIS */}
                <div className="secao-form">
                    <h3 className="titulo-secao">📋 Informações Gerais</h3>
                    <div className="campos-form">
                        <div className="campo-form">
                            <label>Nome do Avaliador:</label>
                            <input
                                type="text"
                                value={avaliacaoAtual.avaliador}
                                onChange={(e) => updateField("avaliador", e.target.value)}
                                placeholder="Digite o nome do avaliador"
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
                        <div className="campo-form">
                            <label>Fazenda:</label>
                            <input
                                type="text"
                                value={avaliacaoAtual.fazenda}
                                onChange={(e) => updateField("fazenda", e.target.value)}
                                placeholder="Nome da fazenda"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Variedade:</label>
                            <input
                                type="text"
                                value={avaliacaoAtual.variedade}
                                onChange={(e) => updateField("variedade", e.target.value)}
                                placeholder="Ex: Catuaí, Bourbon"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Processo:</label>
                            <input
                                type="text"
                                value={avaliacaoAtual.processo}
                                onChange={(e) => updateField("processo", e.target.value)}
                                placeholder="Ex: Natural, Lavado"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Altitude (m):</label>
                            <input
                                type="number"
                                value={avaliacaoAtual.altitude}
                                onChange={(e) => updateField("altitude", e.target.value)}
                                placeholder="Ex: 1200"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Umidade (%):</label>
                            <input
                                type="number"
                                value={avaliacaoAtual.umidade}
                                onChange={(e) => updateField("umidade", e.target.value)}
                                step="0.1"
                                placeholder="Ex: 11.5"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Densidade (g/L):</label>
                            <input
                                type="number"
                                value={avaliacaoAtual.densidade}
                                onChange={(e) => updateField("densidade", e.target.value)}
                                step="0.1"
                                placeholder="Ex: 650"
                            />
                        </div>
                    </div>
                    <div className="campo-form observacoes-campo">
                        <label>Observações das Informações Gerais:</label>
                        <textarea
                            value={avaliacaoAtual.obsInformacoesGerais}
                            onChange={(e) => updateField("obsInformacoesGerais", e.target.value)}
                            placeholder="Adicione observações específicas sobre as informações gerais..."
                            className="observacoes-textarea"
                        />
                    </div>
                </div>

                {/* ✅ SEÇÃO DE TORRA */}
                <div className="secao-form">
                    <h3 className="titulo-secao">☕ Seleção da Torra</h3>
                    <div className="torra-options">
                        {[
                            { nome: "Torra Clara", cor: "#a57b70" },
                            { nome: "Torra Média Clara", cor: "#704e44" },
                            { nome: "Torra Média", cor: "#553026" },
                            { nome: "Torra Média Escura", cor: "#2b1a12ff" },
                            { nome: "Torra Escura", cor: "#140b08ff" },
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
                    <div className="campo-form observacoes-campo">
                        <label>Observações da Torra:</label>
                        <textarea
                            value={avaliacaoAtual.obsTorra}
                            onChange={(e) => updateField("obsTorra", e.target.value)}
                            placeholder="Adicione observações sobre a torra..."
                            className="observacoes-textarea"
                        />
                    </div>
                </div>

                {/* ✅ SEÇÃO DRY E BREAK - MOBILE FRIENDLY */}
                <div className="secao-form">
                    <h3 className="titulo-secao">👃 Avaliação Aromática</h3>

                    <div className="avaliacao-item">
                        <h4>Dry - "Aroma do pó seco"</h4>
                        <div className="intensidade-buttons">
                            {intensidades.map((intensidade, index) => (
                                <button
                                    key={index}
                                    className={`intensidade-btn ${avaliacaoAtual.dry === index ? "selected" : ""}`}
                                    onClick={() => updateField("dry", index)}
                                >
                                    {intensidade}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Dry:</label>
                            <textarea
                                value={avaliacaoAtual.obsDry}
                                onChange={(e) => updateField("obsDry", e.target.value)}
                                placeholder="Observações sobre o aroma do pó seco..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Break - "Aroma de Quebra de xícara"</h4>
                        <div className="intensidade-buttons">
                            {intensidades.map((intensidade, index) => (
                                <button
                                    key={index}
                                    className={`intensidade-btn ${avaliacaoAtual.breakValue === index ? "selected" : ""}`}
                                    onClick={() => updateField("breakValue", index)}
                                >
                                    {intensidade}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Break:</label>
                            <textarea
                                value={avaliacaoAtual.obsBreak}
                                onChange={(e) => updateField("obsBreak", e.target.value)}
                                placeholder="Observações sobre o aroma de quebra..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>
                </div>

                {/* ✅ SEÇÃO DE ATRIBUTOS SENSORIAIS - MOBILE FRIENDLY */}
                <div className="secao-form">
                    <h3 className="titulo-secao">🎯 Atributos Sensoriais</h3>

                    <div className="avaliacao-item">
                        <h4>Aroma / Fragrância</h4>
                        <div className="escala-notas-mobile">
                            {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                                <button
                                    key={num}
                                    className={`nota-btn ${Number(avaliacaoAtual.notas.AromaFragrancia) === num ? "selected" : ""}`}
                                    onClick={() => handleNotaChange("AromaFragrancia", num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Aroma / Fragrância:</label>
                            <textarea
                                value={avaliacaoAtual.obsAromaFragrancia}
                                onChange={(e) => updateField("obsAromaFragrancia", e.target.value)}
                                placeholder="Observações sobre aroma e fragrância..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Sabor</h4>
                        <div className="escala-notas-mobile">
                            {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                                <button
                                    key={num}
                                    className={`nota-btn ${Number(avaliacaoAtual.notas.sabor) === num ? "selected" : ""}`}
                                    onClick={() => handleNotaChange("sabor", num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Sabor:</label>
                            <textarea
                                value={avaliacaoAtual.obsSabor}
                                onChange={(e) => updateField("obsSabor", e.target.value)}
                                placeholder="Observações sobre o sabor..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Finalização</h4>
                        <div className="escala-notas-mobile">
                            {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                                <button
                                    key={num}
                                    className={`nota-btn ${Number(avaliacaoAtual.notas.finalizacao) === num ? "selected" : ""}`}
                                    onClick={() => handleNotaChange("finalizacao", num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Finalização:</label>
                            <textarea
                                value={avaliacaoAtual.obsFinalizacao}
                                onChange={(e) => updateField("obsFinalizacao", e.target.value)}
                                placeholder="Observações sobre a finalização..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Acidez</h4>
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
                        <div className="escala-notas-mobile">
                            {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                                <button
                                    key={num}
                                    className={`nota-btn ${Number(avaliacaoAtual.notas.acidez) === num ? "selected" : ""}`}
                                    onClick={() => handleNotaChange("acidez", num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Acidez:</label>
                            <textarea
                                value={avaliacaoAtual.obsAcidez}
                                onChange={(e) => updateField("obsAcidez", e.target.value)}
                                placeholder="Observações sobre a acidez..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Nível de Acidez</h4>
                        <div className="intensidade-buttons">
                            {intensidades.map((intensidade, index) => (
                                <button
                                    key={index}
                                    className={`intensidade-btn ${avaliacaoAtual.nivelAcidez === index ? "selected" : ""}`}
                                    onClick={() => updateField("nivelAcidez", index)}
                                >
                                    {intensidade}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Corpo</h4>
                        <div className="escala-notas-mobile">
                            {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                                <button
                                    key={num}
                                    className={`nota-btn ${Number(avaliacaoAtual.notas.corpo) === num ? "selected" : ""}`}
                                    onClick={() => handleNotaChange("corpo", num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Corpo:</label>
                            <textarea
                                value={avaliacaoAtual.obsCorpo}
                                onChange={(e) => updateField("obsCorpo", e.target.value)}
                                placeholder="Observações sobre o corpo..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Nível de Corpo</h4>
                        <div className="intensidade-buttons">
                            {intensidades.map((intensidade, index) => (
                                <button
                                    key={index}
                                    className={`intensidade-btn ${avaliacaoAtual.nivelCorpo === index ? "selected" : ""}`}
                                    onClick={() => updateField("nivelCorpo", index)}
                                >
                                    {intensidade}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Equilíbrio</h4>
                        <div className="escala-notas-mobile">
                            {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                                <button
                                    key={num}
                                    className={`nota-btn ${Number(avaliacaoAtual.notas.equilibrio) === num ? "selected" : ""}`}
                                    onClick={() => handleNotaChange("equilibrio", num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Equilíbrio:</label>
                            <textarea
                                value={avaliacaoAtual.obsEquilibrio}
                                onChange={(e) => updateField("obsEquilibrio", e.target.value)}
                                placeholder="Observações sobre o equilíbrio..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>

                    <div className="avaliacao-item">
                        <h4>Avaliação Pessoal</h4>
                        <div className="escala-notas-mobile">
                            {[6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10].map((num) => (
                                <button
                                    key={num}
                                    className={`nota-btn ${Number(avaliacaoAtual.notas.avaliacaoPessoal) === num ? "selected" : ""}`}
                                    onClick={() => handleNotaChange("avaliacaoPessoal", num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="campo-form observacoes-campo">
                            <label>Observações Avaliação Pessoal:</label>
                            <textarea
                                value={avaliacaoAtual.obsAvaliacaoPessoal}
                                onChange={(e) => updateField("obsAvaliacaoPessoal", e.target.value)}
                                placeholder="Observações sobre a avaliação pessoal..."
                                className="observacoes-textarea"
                            />
                        </div>
                    </div>
                </div>

                {/* ✅ SEÇÃO DE NOTAS SENSORIAIS */}
                <div className="secao-form">
                    <h3 className="titulo-secao">📝 Notas Sensoriais</h3>
                    <div className="campo-form">
                        <label>Notas Sensoriais:</label>
                        <textarea
                            value={avaliacaoAtual.notasSensorias}
                            onChange={(e) => updateField("notasSensorias", e.target.value)}
                            placeholder="Preencha as notas encontradas no café"
                            className="notas-sensoriais-textarea"
                        />
                    </div>
                </div>

                {/* ✅ SEÇÃO DE XÍCARAS */}
                <div className="secao-form">
                    <h3 className="titulo-secao">☕ Atributos de Xícaras</h3>
                    <div className="nota-xicaras-valor">{calcularPontuacaoXicaras().toFixed(2)}</div>
                    <div className="xicaras-container-mobile">
                        <div className="xicaras-group">
                            <h4>Doçura</h4>
                            <div className="checkboxes-linha">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <label key={index} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={avaliacaoAtual.notas.doçura[index]}
                                            onChange={() => toggleCheckbox("doçura", index)}
                                        />
                                        <span>Copo {index + 1}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="xicaras-group">
                            <h4>Uniformidade</h4>
                            <div className="checkboxes-linha">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <label key={index} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={avaliacaoAtual.notas.uniformidade[index]}
                                            onChange={() => toggleCheckbox("uniformidade", index)}
                                        />
                                        <span>Copo {index + 1}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="xicaras-group">
                            <h4>Limpeza de xícara</h4>
                            <div className="checkboxes-linha">
                                {[0, 1, 2, 3, 4].map((index) => (
                                    <label key={index} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={avaliacaoAtual.notas.xicaraLimpa[index]}
                                            onChange={() => toggleCheckbox("xicaraLimpa", index)}
                                        />
                                        <span>Copo {index + 1}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="campo-form observacoes-campo">
                        <label>Observações das Xícaras:</label>
                        <textarea
                            value={avaliacaoAtual.obsXicaras}
                            onChange={(e) => updateField("obsXicaras", e.target.value)}
                            placeholder="Adicione observações sobre doçura, uniformidade e limpeza de xícara..."
                            className="observacoes-textarea"
                        />
                    </div>
                </div>

                {/* ✅ SEÇÃO DE DEFEITOS */}
                <div className="secao-form">
                    <h3 className="titulo-secao">⚠️ Defeitos</h3>
                    <div className="defeitos-container-mobile">
                        <div className="defeito-item">
                            <label>Defeito Leve (-2):</label>
                            <div className="defeito-input-group">
                                <input
                                    type="number"
                                    value={avaliacaoAtual.defeitosLeves}
                                    onChange={(e) => updateField("defeitosLeves", Number(e.target.value) || 0)}
                                />
                                <span className="resultado-defeito">= -{avaliacaoAtual.defeitosLeves * 2}</span>
                            </div>
                        </div>
                        <div className="defeito-item">
                            <label>Defeito Grave (-4):</label>
                            <div className="defeito-input-group">
                                <input
                                    type="number"
                                    value={avaliacaoAtual.defeitosGraves}
                                    onChange={(e) => updateField("defeitosGraves", Number(e.target.value) || 0)}
                                />
                                <span className="resultado-defeito">= -{avaliacaoAtual.defeitosGraves * 4}</span>
                            </div>
                        </div>
                    </div>
                    <div className="campo-form observacoes-campo">
                        <label>Observações dos Defeitos:</label>
                        <textarea
                            value={avaliacaoAtual.obsDefeitos}
                            onChange={(e) => updateField("obsDefeitos", e.target.value)}
                            placeholder="Adicione observações sobre os defeitos encontrados..."
                            className="observacoes-textarea"
                        />
                    </div>
                </div>

                {/* ✅ SEÇÃO DE OBSERVAÇÕES GERAIS */}
                <div className="secao-form">
                    <h3 className="titulo-secao">💭 Observações Gerais</h3>
                    <div className="campo-form">
                        <label>Observações Gerais:</label>
                        <textarea
                            value={avaliacaoAtual.observacoes}
                            onChange={(e) => updateField("observacoes", e.target.value)}
                            placeholder="Adicione observações gerais sobre a avaliação..."
                            className="observacoes-textarea"
                        />
                    </div>
                </div>

                {/* ✅ PONTUAÇÃO FINAL */}
                <div className="pontuacao-final">
                    <h2>PONTUAÇÃO FINAL: {calcularPontuacaoFinal()}</h2>
                    <p>Descontos Totais: -{calcularTotalDescontos()}</p>
                </div>

                {/* ✅ BOTÃO DE SALVAR MOBILE FRIENDLY */}
                <div className="botoes-acao">
                    <button className="salvar" onClick={handleSalvarAvaliacao} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <i className="bi bi-hourglass-split"></i>
                                SALVANDO...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle"></i>
                                SALVAR AVALIAÇÃO
                            </>
                        )}
                    </button>
                </div>
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
