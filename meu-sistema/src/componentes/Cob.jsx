"use client"
import "./Cob.css"
import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "../config/firebase"
import { collection, addDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useData } from "../context/DataContext"
import {
    X,
    Save,
    FileText,
    User,
    Calendar,
    Building,
    Hash,
    Coffee,
    Scale,
    Droplets,
    Settings,
    FileCheck,
    ChevronUp,
    Plus,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle,
    Wifi,
    WifiOff,
} from "lucide-react"

const tabelaClassificacao = [
    { defeitos: 4, rotulo: "2-5" },
    { defeitos: 5, rotulo: "2-10" },
    { defeitos: 6, rotulo: "2-15" },
    { defeitos: 7, rotulo: "2-20" },
    { defeitos: 8, rotulo: "2-25" },
    { defeitos: 9, rotulo: "2-30" },
    { defeitos: 10, rotulo: "2-35" },
    { defeitos: 11, rotulo: "2-40" },
    { defeitos: 11.05, rotulo: "2-45" },
    { defeitos: 12, rotulo: "3" },
    { defeitos: 13, rotulo: "3-5" },
    { defeitos: 15, rotulo: "3-10" },
    { defeitos: 17, rotulo: "3-15" },
    { defeitos: 18, rotulo: "3-20" },
    { defeitos: 19, rotulo: "3-25" },
    { defeitos: 20, rotulo: "3-30" },
    { defeitos: 22, rotulo: "3-35" },
    { defeitos: 23, rotulo: "3-40" },
    { defeitos: 25, rotulo: "3-45" },
    { defeitos: 26, rotulo: "4" },
    { defeitos: 28, rotulo: "4-5" },
    { defeitos: 30, rotulo: "4-10" },
    { defeitos: 32, rotulo: "4-15" },
    { defeitos: 34, rotulo: "4-20" },
    { defeitos: 36, rotulo: "4-25" },
    { defeitos: 38, rotulo: "4-30" },
    { defeitos: 40, rotulo: "4-35" },
    { defeitos: 42, rotulo: "4-40" },
    { defeitos: 44, rotulo: "4-45" },
    { defeitos: 46, rotulo: "5" },
    { defeitos: 49, rotulo: "5-5" },
    { defeitos: 53, rotulo: "5-10" },
    { defeitos: 57, rotulo: "5-15" },
    { defeitos: 64, rotulo: "5-25" },
    { defeitos: 68, rotulo: "5-30" },
    { defeitos: 71, rotulo: "5-35" },
    { defeitos: 75, rotulo: "5-40" },
    { defeitos: 79, rotulo: "5-45" },
    { defeitos: 86, rotulo: "6" },
    { defeitos: 93, rotulo: "6-5" },
    { defeitos: 100, rotulo: "6-10" },
    { defeitos: 108, rotulo: "6-15" },
    { defeitos: 115, rotulo: "6-20" },
    { defeitos: 123, rotulo: "6-25" },
    { defeitos: 130, rotulo: "6-30" },
    { defeitos: 138, rotulo: "6-35" },
    { defeitos: 145, rotulo: "6-40" },
    { defeitos: 153, rotulo: "6-45" },
    { defeitos: 160, rotulo: "7" },
    { defeitos: 180, rotulo: "7-5" },
    { defeitos: 200, rotulo: "7-10" },
    { defeitos: 220, rotulo: "7-15" },
    { defeitos: 240, rotulo: "7-20" },
    { defeitos: 260, rotulo: "7-25" },
    { defeitos: 280, rotulo: "7-30" },
    { defeitos: 300, rotulo: "7-35" },
    { defeitos: 320, rotulo: "7-40" },
    { defeitos: 340, rotulo: "7-45" },
    { defeitos: 360, rotulo: "8" },
    { defeitos: Number.POSITIVE_INFINITY, rotulo: "Fora de Tipo" },
]

function obterClassificacao(valorDefeitos) {
    if (valorDefeitos <= 0) return { rotulo: "2-5" }
    for (let i = 0; i < tabelaClassificacao.length; i++) {
        if (valorDefeitos <= tabelaClassificacao[i].defeitos) {
            return tabelaClassificacao[i]
        }
    }
    return tabelaClassificacao[tabelaClassificacao.length - 1]
}

const tabelaDefeitos = {
    "Grão Preto": { quantidade: 1, equivalencia: 1 },
    "Grão Ardido": { quantidade: 2, equivalencia: 1 },
    Concha: { quantidade: 3, equivalencia: 1 },
    "Grãos Verdes": { quantidade: 5, equivalencia: 1 },
    "Grãos Quebrados": { quantidade: 5, equivalencia: 1 },
    "Grãos Brocados": { quantidade: 2, equivalencia: 1 },
    "Grãos Mal Granados ou Chocho": { quantidade: 5, equivalencia: 1 },
    Coco: { quantidade: 1, equivalencia: 1 },
    Marinheiro: { quantidade: 2, equivalencia: 1 },
    "Pau, Pedra, Torrão Grande": { quantidade: 1, equivalencia: 5 },
    "Pau, Pedra, Torrão Regular": { quantidade: 1, equivalencia: 2 },
    "Pau, Pedra, Torrão Pequeno": { quantidade: 1, equivalencia: 1 },
    "Casca Grande": { quantidade: 1, equivalencia: 1 },
    "Casca Pequena": { quantidade: 2, equivalencia: 1 },
    "Brocado Sujo": { quantidade: 3, equivalencia: 1 },
    "Brocado Rendado": { quantidade: 2, equivalencia: 1 },
    "Brocado Limpo": { quantidade: 5, equivalencia: 1 },
    "Grão Esmagado": { quantidade: 5, equivalencia: 1 },
}

const Cob = () => {
    // Estados principais
    const [avaliador, setAvaliador] = useState("")
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState("")
    const [numeroAmostra, setNumeroAmostra] = useState("")
    const [observacoes, setObservacoes] = useState("")
    const [defeitos, setDefeitos] = useState({})
    const [umidade, setUmidade] = useState("")
    const [equivalencias, setEquivalencias] = useState({})
    const [equivalenciaTotal, setEquivalenciaTotal] = useState(0)
    const [tipo, setTipo] = useState("")
    const [categoria] = useState("")
    const [peneiraSubcategoria, setPeneiraSubcategoria] = useState([])
    const [grupoBebida, setGrupoBebida] = useState("")
    const [subClassificacaoBebida, setSubClassificacaoBebida] = useState("")
    const [classeBebida, setClasseBebida] = useState([])
    const [aparelho, setAparelho] = useState("")
    const [subcategoria, setSubcategoria] = useState("")
    const [tipoCafe, setTipoCafe] = useState({ grupo: "", tamanho: "" })
    const [postoServico, setPostoServico] = useState("")
    const [classificadorMapa, setClassificadorMapa] = useState("")
    const [peloPreparo, setPeloPreparo] = useState("")
    const [pelaSeca, setPelaSeca] = useState("")
    const [peloAspecto, setPeloAspecto] = useState("")
    const [torraArabica, setTorraArabica] = useState("")
    const [torraCanephora, setTorraCanephora] = useState("")
    const [teorCafeina, setTeorCafeina] = useState("")

    // Estados de UI e controle
    const [salvando, setSalvando] = useState(false)
    const [posicaoScroll, setPosicaoScroll] = useState(0)
    const [mostrarDetalhesDefeitos, setMostrarDetalhesDefeitos] = useState(false)
    const [erros, setErros] = useState({})
    const [tocados, setTocados] = useState({})
    const [carregandoInicial, setCarregandoInicial] = useState(true)
    const [logoState, setLogoState] = useState("loading")
    const [online, setOnline] = useState(navigator.onLine)
    const [notificacao, setNotificacao] = useState(null)
    const [isMobile, setIsMobile] = useState(false)
    const [dadosAlterados, setDadosAlterados] = useState(false)

    const navegar = useNavigate()

    // Refs para acessibilidade
    const refPrincipal = useRef(null)
    const refErro = useRef(null)
    const refSucesso = useRef(null)
    const timeoutNotificacao = useRef(null)
    const intervalSalvarDados = useRef(null)

    // Usando dados do contexto
    const { fornecedores, loading: carregandoDados } = useData()

    // Sistema de notificações
    const mostrarNotificacao = useCallback((mensagem, tipo = "info", duracao = 3000) => {
        setNotificacao({ mensagem, tipo })

        if (timeoutNotificacao.current) {
            clearTimeout(timeoutNotificacao.current)
        }

        timeoutNotificacao.current = setTimeout(() => {
            setNotificacao(null)
        }, duracao)
    }, [])

    // Detectar dispositivo móvel
    useEffect(() => {
        const verificarMobile = () => {
            const mobile = window.innerWidth <= 768
            setIsMobile(mobile)
        }

        verificarMobile()
        window.addEventListener("resize", verificarMobile)
        return () => window.removeEventListener("resize", verificarMobile)
    }, [])

    // Preloader e inicialização
    useEffect(() => {
        const inicializar = async () => {
            setLogoState("loading")
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setLogoState("success")
            setTimeout(() => {
                setCarregandoInicial(false)
            }, 300)
        }

        inicializar()
    }, [])

    // Monitorar status online/offline
    useEffect(() => {
        const handleOnline = () => {
            setOnline(true)
            mostrarNotificacao("Conexão restaurada", "success")
        }

        const handleOffline = () => {
            setOnline(false)
            mostrarNotificacao("Modo offline ativado", "warning")
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [mostrarNotificacao])

    // Salvar dados automaticamente
    const salvarDadosAutomaticamente = useCallback(() => {
        try {
            const dadosFormulario = {
                avaliador,
                fornecedorSelecionado,
                numeroAmostra,
                observacoes,
                defeitos,
                umidade,
                equivalencias,
                equivalenciaTotal,
                tipo,
                categoria,
                peneiraSubcategoria,
                grupoBebida,
                subClassificacaoBebida,
                classeBebida,
                aparelho,
                subcategoria,
                tipoCafe,
                postoServico,
                classificadorMapa,
                peloPreparo,
                pelaSeca,
                peloAspecto,
                torraArabica,
                torraCanephora,
                teorCafeina,
                timestamp: Date.now(),
                sessaoId: `cob_${Date.now()}`,
            }

            localStorage.setItem("cob_dados_temporarios", JSON.stringify(dadosFormulario))
            sessionStorage.setItem("cob_backup", JSON.stringify(dadosFormulario))
        } catch (error) {
            console.error("Erro ao salvar dados automaticamente:", error)
        }
    }, [
        avaliador,
        fornecedorSelecionado,
        numeroAmostra,
        observacoes,
        defeitos,
        umidade,
        equivalencias,
        equivalenciaTotal,
        tipo,
        categoria,
        peneiraSubcategoria,
        grupoBebida,
        subClassificacaoBebida,
        classeBebida,
        aparelho,
        subcategoria,
        tipoCafe,
        postoServico,
        classificadorMapa,
        peloPreparo,
        pelaSeca,
        peloAspecto,
        torraArabica,
        torraCanephora,
        teorCafeina,
    ])

    // Auto-save inteligente
    useEffect(() => {
        if (dadosAlterados) {
            salvarDadosAutomaticamente()
            setDadosAlterados(false)

            if (intervalSalvarDados.current) {
                clearInterval(intervalSalvarDados.current)
            }

            intervalSalvarDados.current = setInterval(() => {
                salvarDadosAutomaticamente()
            }, 5000)
        }

        return () => {
            if (intervalSalvarDados.current) {
                clearInterval(intervalSalvarDados.current)
            }
        }
    }, [dadosAlterados, salvarDadosAutomaticamente])

    // Skip link para acessibilidade
    const pularParaPrincipal = useCallback((e) => {
        e.preventDefault()
        if (refPrincipal.current) {
            refPrincipal.current.focus()
        }
    }, [])

    // Função para anunciar para leitores de tela
    const anunciarParaLeitorTela = useCallback((mensagem) => {
        const anuncio = document.createElement("div")
        anuncio.setAttribute("aria-live", "polite")
        anuncio.setAttribute("aria-atomic", "true")
        anuncio.className = "apenas-leitor-tela"
        anuncio.textContent = mensagem
        document.body.appendChild(anuncio)
        setTimeout(() => {
            if (document.body.contains(anuncio)) {
                document.body.removeChild(anuncio)
            }
        }, 1000)
    }, [])

    // Validação de campos
    const validarCampo = useCallback((campo, valor) => {
        switch (campo) {
            case "fornecedorSelecionado":
                return !valor ? "Fornecedor é obrigatório" : ""
            case "numeroAmostra":
                return !valor ? "Número da amostra é obrigatório" : ""
            case "umidade":
                return valor && (isNaN(valor) || valor < 0 || valor > 100) ? "Umidade deve ser entre 0 e 100%" : ""
            default:
                return ""
        }
    }, [])

    // Atualizar erros
    const atualizarErros = useCallback(() => {
        const novosErros = {}
        novosErros.fornecedorSelecionado = validarCampo("fornecedorSelecionado", fornecedorSelecionado)
        novosErros.numeroAmostra = validarCampo("numeroAmostra", numeroAmostra)
        novosErros.umidade = validarCampo("umidade", umidade)
        setErros(novosErros)
    }, [fornecedorSelecionado, numeroAmostra, umidade, validarCampo])

    // Carregar dados salvos
    const carregarDadosSalvos = useCallback(() => {
        try {
            let dadosSalvos = localStorage.getItem("cob_dados_temporarios")

            if (!dadosSalvos) {
                dadosSalvos = sessionStorage.getItem("cob_backup")
            }

            if (dadosSalvos) {
                const dados = JSON.parse(dadosSalvos)
                const agora = Date.now()
                const tempoLimite = 7 * 24 * 60 * 60 * 1000 // 7 dias

                if (agora - dados.timestamp < tempoLimite) {
                    setAvaliador(dados.avaliador || "")
                    setFornecedorSelecionado(dados.fornecedorSelecionado || "")
                    setNumeroAmostra(dados.numeroAmostra || "")
                    setObservacoes(dados.observacoes || "")
                    setDefeitos(dados.defeitos || {})
                    setUmidade(dados.umidade || "")
                    setEquivalencias(dados.equivalencias || {})
                    setEquivalenciaTotal(dados.equivalenciaTotal || 0)
                    setTipo(dados.tipo || "")
                    setPeneiraSubcategoria(dados.peneiraSubcategoria || [])
                    setGrupoBebida(dados.grupoBebida || "")
                    setSubClassificacaoBebida(dados.subClassificacaoBebida || "")
                    setClasseBebida(dados.classeBebida || [])
                    setAparelho(dados.aparelho || "")
                    setSubcategoria(dados.subcategoria || "")
                    setTipoCafe(dados.tipoCafe || { grupo: "", tamanho: "" })
                    setPostoServico(dados.postoServico || "")
                    setClassificadorMapa(dados.classificadorMapa || "")
                    setPeloPreparo(dados.peloPreparo || "")
                    setPelaSeca(dados.pelaSeca || "")
                    setPeloAspecto(dados.peloAspecto || "")
                    setTorraArabica(dados.torraArabica || "")
                    setTorraCanephora(dados.torraCanephora || "")
                    setTeorCafeina(dados.teorCafeina || "")

                    mostrarNotificacao("Dados anteriores restaurados automaticamente", "success")
                } else {
                    localStorage.removeItem("cob_dados_temporarios")
                    sessionStorage.removeItem("cob_backup")
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dados salvos:", error)
            localStorage.removeItem("cob_dados_temporarios")
            sessionStorage.removeItem("cob_backup")
        }
    }, [mostrarNotificacao])

    // Função para confirmar saída
    const confirmarSaida = useCallback(() => {
        const temDados = fornecedorSelecionado || numeroAmostra || Object.keys(defeitos).length > 0 || observacoes

        if (temDados) {
            const confirmar = window.confirm(
                "Você tem dados não salvos. Tem certeza que deseja sair?\n\nSeus dados foram salvos automaticamente e estarão disponíveis quando retornar.",
            )
            return confirmar
        }
        return true
    }, [fornecedorSelecionado, numeroAmostra, defeitos, observacoes])

    // Função para sair da tela
    const sairDaTela = useCallback(() => {
        if (confirmarSaida()) {
            salvarDadosAutomaticamente()

            if (intervalSalvarDados.current) {
                clearInterval(intervalSalvarDados.current)
            }

            navegar("/logado")
        }
    }, [confirmarSaida, salvarDadosAutomaticamente, navegar])

    // Configurar eventos e navegação
    useEffect(() => {
        const manipularScroll = () => {
            setPosicaoScroll(window.scrollY)
        }

        window.addEventListener("scroll", manipularScroll)
        carregarDadosSalvos()

        return () => {
            window.removeEventListener("scroll", manipularScroll)
        }
    }, [carregarDadosSalvos])

    useEffect(() => {
        const nomeUsuario = localStorage.getItem("usuarioNome") || ""
        setAvaliador(nomeUsuario)
    }, [])

    useEffect(() => {
        const classificacao = obterClassificacao(equivalenciaTotal)
        setTipo(classificacao.rotulo)
    }, [equivalenciaTotal])

    useEffect(() => {
        atualizarErros()
    }, [atualizarErros])

    // Marcar dados como alterados quando qualquer campo muda
    useEffect(() => {
        setDadosAlterados(true)
    }, [
        avaliador,
        fornecedorSelecionado,
        numeroAmostra,
        observacoes,
        defeitos,
        umidade,
        equivalencias,
        equivalenciaTotal,
        tipo,
        peneiraSubcategoria,
        grupoBebida,
        subClassificacaoBebida,
        classeBebida,
        aparelho,
        subcategoria,
        tipoCafe,
        postoServico,
        classificadorMapa,
        peloPreparo,
        pelaSeca,
        peloAspecto,
        torraArabica,
        torraCanephora,
        teorCafeina,
    ])

    const manipularMudancaDefeito = useCallback(
        (defeito, quantidade) => {
            const quantidadeValida = isNaN(quantidade) ? 0 : quantidade
            const defeitosAtualizados = { ...defeitos, [defeito]: quantidadeValida }
            setDefeitos(defeitosAtualizados)

            let totalEquivalencia = 0
            const equivalenciasAtualizadas = {}

            for (const [chave, valor] of Object.entries(defeitosAtualizados)) {
                if (tabelaDefeitos[chave]) {
                    const equivalencia = Math.floor(valor / tabelaDefeitos[chave].quantidade) * tabelaDefeitos[chave].equivalencia
                    equivalenciasAtualizadas[chave] = equivalencia
                    totalEquivalencia += equivalencia
                }
            }

            setEquivalencias(equivalenciasAtualizadas)
            setEquivalenciaTotal(totalEquivalencia)

            anunciarParaLeitorTela(
                `${defeito}: ${quantidadeValida} unidades, equivalência: ${equivalenciasAtualizadas[defeito] || 0}`,
            )
        },
        [defeitos, anunciarParaLeitorTela],
    )

    const manipularMudancaClasse = useCallback((e) => {
        const { value, checked } = e.target
        if (checked) {
            setClasseBebida((anterior) => [...anterior, value])
        } else {
            setClasseBebida((anterior) => anterior.filter((item) => item !== value))
        }
    }, [])

    const manipularMudancaPeneira = useCallback((e) => {
        const { value, checked } = e.target
        if (checked) {
            setPeneiraSubcategoria((anterior) => [...anterior, value])
        } else {
            setPeneiraSubcategoria((anterior) => anterior.filter((item) => item !== value))
        }
    }, [])

    const manipularDesfoqueCampo = useCallback((campo) => {
        setTocados((anterior) => ({ ...anterior, [campo]: true }))
    }, [])

    // Geração de PDF simplificada e segura (SEM IMAGENS)
    const manipularGerarPDF = useCallback(() => {
        if (!fornecedorSelecionado || !numeroAmostra) {
            anunciarParaLeitorTela("Erro: Preencha os campos obrigatórios antes de gerar o PDF")
            mostrarNotificacao("Preencha os campos obrigatórios", "error")
            if (refErro.current) {
                refErro.current.focus()
            }
            return
        }

        anunciarParaLeitorTela("Gerando PDF da avaliação...")
        mostrarNotificacao("Gerando PDF...", "info")

        try {
            const docPDF = new jsPDF({ unit: "mm", format: "a4" })
            const larguraPagina = docPDF.internal.pageSize.getWidth()
            const alturaPagina = docPDF.internal.pageSize.getHeight()
            const margemX = 20

            // Título principal (SEM LOGO)
            docPDF.setFont("times", "bold")
            docPDF.setFontSize(16)
            docPDF.text("Avaliação Física de Café - Método COB", larguraPagina / 2, 20, { align: "center" })

            const opcoesTabelaAuto = (config) => ({
                ...config,
                theme: "grid",
                margin: { left: margemX, right: margemX },
                startY: docPDF.lastAutoTable ? docPDF.lastAutoTable.finalY + 10 : 35,
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
                    const contadorPaginas = docPDF.internal.getNumberOfPages()
                    docPDF.setFontSize(10)
                    docPDF.setTextColor(150)
                    docPDF.text(`Página ${data.pageNumber} de ${contadorPaginas}`, larguraPagina - margemX, alturaPagina - 10, {
                        align: "right",
                    })
                    docPDF.text(`Laudo Técnico - ${new Date().toLocaleDateString("pt-BR")}`, margemX, alturaPagina - 10)
                },
            })

            // Tabela de Identificação
            autoTable(
                docPDF,
                opcoesTabelaAuto({
                    head: [["Identificação", "Valor"]],
                    body: [
                        ["Avaliador", avaliador || "Não informado"],
                        ["Data da Avaliação", new Date().toLocaleDateString("pt-BR")],
                        ["Hora da Avaliação", new Date().toLocaleTimeString("pt-BR")],
                        ["Fornecedor/Produtor", fornecedorSelecionado || "Não informado"],
                        ["Nº da Amostra", numeroAmostra || "Não informado"],
                        ["Umidade (%)", umidade ? `${umidade}%` : "Não informado"],
                        ["Aparelho de Medição", aparelho || "Não informado"],
                        ["Subcategoria", subcategoria || "Não informado"],
                        ["Tipo Final", tipo || "Não classificado"],
                        ["Posto de Serviço", postoServico || "Não informado"],
                        ["Classificador MAPA", classificadorMapa || "Não informado"],
                    ],
                }),
            )

            // Tabela de Defeitos
            const defeitosParaPDF = Object.entries(tabelaDefeitos).map(([nomeDefeito, info]) => [
                nomeDefeito,
                defeitos[nomeDefeito] || 0,
                equivalencias[nomeDefeito] || 0,
                `Cada ${info.quantidade} = ${info.equivalencia} equiv.`,
            ])

            autoTable(
                docPDF,
                opcoesTabelaAuto({
                    head: [["Defeito", "Quantidade", "Equivalência", "Regra"]],
                    body: defeitosParaPDF,
                }),
            )

            // Tabela de Totais
            autoTable(
                docPDF,
                opcoesTabelaAuto({
                    head: [["Resumo dos Defeitos", "Valor"]],
                    body: [
                        [
                            "Total de Defeitos Encontrados",
                            Object.values(defeitos || {}).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0),
                        ],
                        ["Total da Equivalência", equivalenciaTotal],
                        ["Classificação Final", tipo || "Não classificado"],
                        ["Data da Classificação", new Date().toLocaleDateString("pt-BR")],
                        ["Hora da Classificação", new Date().toLocaleTimeString("pt-BR")],
                    ],
                }),
            )

            // Tabela de Categoria
            autoTable(
                docPDF,
                opcoesTabelaAuto({
                    head: [["Categoria", "Valor"]],
                    body: [
                        [
                            "Peneira/Subcategoria",
                            (peneiraSubcategoria || []).length > 0 ? (peneiraSubcategoria || []).join(", ") : "Nenhuma selecionada",
                        ],
                        ["Tipo de Café", tipoCafe.grupo ? `${tipoCafe.grupo} - ${tipoCafe.tamanho}` : "Não informado"],
                        ["Grupo da Bebida", grupoBebida || "Não informado"],
                        ["Subclassificação da Bebida", subClassificacaoBebida || "Não informado"],
                        [
                            "Classe da Bebida",
                            (classeBebida || []).length > 0 ? (classeBebida || []).join(", ") : "Nenhuma selecionada",
                        ],
                    ],
                }),
            )

            // Tabela de Laudo Técnico
            autoTable(
                docPDF,
                opcoesTabelaAuto({
                    head: [["Laudo Técnico", "Avaliação"]],
                    body: [
                        ["Pelo Preparo", peloPreparo || "Não avaliado"],
                        ["Pela Seca", pelaSeca || "Não avaliado"],
                        ["Pelo Aspecto", peloAspecto || "Não avaliado"],
                        ["Torra Arábica", torraArabica || "Não aplicável"],
                        ["Torra Canephora", torraCanephora || "Não aplicável"],
                        ["Teor de Cafeína", teorCafeina || "Não informado"],
                    ],
                }),
            )

            // Tabela de Observações
            if (observacoes && observacoes.trim()) {
                autoTable(
                    docPDF,
                    opcoesTabelaAuto({
                        head: [["Observações Gerais"]],
                        body: [[observacoes]],
                        styles: {
                            cellPadding: 8,
                            fontSize: 10,
                            textColor: [0, 0, 0],
                        },
                        columnStyles: {
                            0: { cellWidth: "auto" },
                        },
                    }),
                )
            } else {
                autoTable(
                    docPDF,
                    opcoesTabelaAuto({
                        head: [["Observações Gerais"]],
                        body: [["Nenhuma observação adicional foi registrada."]],
                    }),
                )
            }

            // Tabela de Resumo Final
            autoTable(
                docPDF,
                opcoesTabelaAuto({
                    head: [["Resumo Final da Avaliação"]],
                    body: [
                        [
                            `Amostra ${numeroAmostra || "N/A"} do fornecedor ${fornecedorSelecionado || "N/A"} foi classificada como ${tipo || "Não classificado"} com ${equivalenciaTotal} pontos de equivalência em defeitos. Avaliação realizada por ${avaliador || "N/A"} em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}.`,
                        ],
                    ],
                    styles: {
                        fillColor: [240, 248, 255],
                        textColor: [0, 0, 0],
                        fontStyle: "italic",
                        cellPadding: 10,
                    },
                }),
            )

            // Assinatura
            const assinaturaY = docPDF.lastAutoTable.finalY + 30
            const larguraLinha = 80
            const inicioLinhaX = (larguraPagina - larguraLinha) / 2

            docPDF.line(inicioLinhaX, assinaturaY, inicioLinhaX + larguraLinha, assinaturaY)
            docPDF.setFont("times", "normal")
            docPDF.setFontSize(12)
            docPDF.text(`Avaliador: ${avaliador || "—"}`, larguraPagina / 2, assinaturaY + 7, { align: "center" })
            docPDF.text(`Registro MAPA: ${classificadorMapa || "—"}`, larguraPagina / 2, assinaturaY + 14, {
                align: "center",
            })

            // Salvar PDF
            docPDF.save(`laudo_cob_${numeroAmostra}_${new Date().toISOString().split("T")[0]}.pdf`)
            anunciarParaLeitorTela("PDF gerado com sucesso!")
            mostrarNotificacao("PDF gerado com sucesso!", "success")
        } catch (error) {
            console.error("Erro ao gerar PDF:", error)
            anunciarParaLeitorTela("Erro ao gerar PDF. Tente novamente.")
            mostrarNotificacao("Erro ao gerar PDF", "error")
        }
    }, [
        fornecedorSelecionado,
        numeroAmostra,
        avaliador,
        umidade,
        aparelho,
        subcategoria,
        tipo,
        tipoCafe,
        postoServico,
        classificadorMapa,
        defeitos,
        equivalencias,
        equivalenciaTotal,
        peneiraSubcategoria,
        grupoBebida,
        subClassificacaoBebida,
        classeBebida,
        peloPreparo,
        pelaSeca,
        peloAspecto,
        torraArabica,
        torraCanephora,
        teorCafeina,
        observacoes,
        anunciarParaLeitorTela,
        mostrarNotificacao,
    ])

    const manipularSalvarAvaliacao = useCallback(async () => {
        if (salvando) return

        if (!fornecedorSelecionado || !numeroAmostra) {
            anunciarParaLeitorTela("Erro: Preencha todos os campos obrigatórios")
            mostrarNotificacao("Preencha todos os campos obrigatórios", "error")
            if (refErro.current) {
                refErro.current.focus()
            }
            return
        }

        setSalvando(true)
        anunciarParaLeitorTela("Salvando avaliação...")
        mostrarNotificacao("Salvando avaliação...", "info")

        try {
            const instanciaAuth = getAuth()
            const usuario = instanciaAuth.currentUser

            if (!usuario) {
                anunciarParaLeitorTela("Erro: Usuário não autenticado")
                mostrarNotificacao("Usuário não autenticado", "error")
                setSalvando(false)
                return
            }

            const avaliacao = {
                userId: usuario.uid,
                avaliador,
                fornecedor: fornecedorSelecionado,
                numeroAmostra,
                observacoes,
                defeitos,
                equivalencias,
                equivalenciaTotal,
                umidade,
                categoria,
                peneiraSubcategoria,
                grupoBebida,
                subClassificacaoBebida,
                classeBebida,
                aparelho,
                subcategoria,
                tipo,
                tipoCafe: tipoCafe.grupo ? `${tipoCafe.grupo} - ${tipoCafe.tamanho}` : "",
                postoServico,
                classificadorMapa,
                peloPreparo,
                pelaSeca,
                peloAspecto,
                torraArabica,
                torraCanephora,
                teorCafeina,
                totalDefeitos: Object.values(defeitos).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0),
                classificacaoFinal: obterClassificacao(equivalenciaTotal),
                dataAvaliacao: new Date().toLocaleDateString("pt-BR"),
                horaAvaliacao: new Date().toLocaleTimeString("pt-BR"),
                timestamp: new Date().toISOString(),
                data: new Date().toISOString(),
            }

            await addDoc(collection(db, "usuarios", usuario.uid, "avaliacoes_cob"), avaliacao)

            anunciarParaLeitorTela("Avaliação salva com sucesso!")
            mostrarNotificacao("Avaliação salva com sucesso!", "success")

            localStorage.removeItem("cob_dados_temporarios")
            sessionStorage.removeItem("cob_backup")

            if (refSucesso.current) {
                refSucesso.current.focus()
            }

            const querVerPDF = window.confirm("Deseja gerar o PDF da avaliação?")
            if (querVerPDF) {
                manipularGerarPDF()
            }
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error)
            anunciarParaLeitorTela("Erro ao salvar avaliação. Tente novamente.")
            mostrarNotificacao("Erro ao salvar avaliação", "error")
        } finally {
            setSalvando(false)
        }
    }, [
        salvando,
        fornecedorSelecionado,
        numeroAmostra,
        avaliador,
        observacoes,
        defeitos,
        equivalencias,
        equivalenciaTotal,
        umidade,
        categoria,
        peneiraSubcategoria,
        grupoBebida,
        subClassificacaoBebida,
        classeBebida,
        aparelho,
        subcategoria,
        tipo,
        tipoCafe,
        postoServico,
        classificadorMapa,
        peloPreparo,
        pelaSeca,
        peloAspecto,
        torraArabica,
        torraCanephora,
        teorCafeina,
        anunciarParaLeitorTela,
        mostrarNotificacao,
        manipularGerarPDF,
    ])

    const voltarAoTopo = useCallback(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
        anunciarParaLeitorTela("Voltando ao topo da página")
    }, [anunciarParaLeitorTela])

    const totalDefeitos = Object.values(defeitos).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0)
    const temErros = Object.values(erros).some((erro) => erro !== "")

    // Preloader
    if (carregandoInicial) {
        return (
            <div className="preloader-container">
                <div className="preloader-content">
                    <div className={`logo-container logo-${logoState}`}>
                        <Coffee className="logo-icon" size={isMobile ? 48 : 64} aria-hidden="true" />
                        <div className="logo-pulse"></div>
                    </div>
                    <div className="preloader-text">
                        <span>Carregando avaliação COB...</span>
                        <div className="preloader-progress">
                            <div className="preloader-bar"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Link para pular conteúdo */}
            <a href="#conteudo-principal" className="link-pular" onClick={pularParaPrincipal}>
                Pular para o conteúdo principal
            </a>

            {/* Sistema de notificações */}
            {notificacao && (
                <div className={`notificacao notificacao-${notificacao.tipo}`} role="alert" aria-live="assertive">
                    <div className="notificacao-conteudo">
                        {notificacao.tipo === "success" && <CheckCircle size={20} />}
                        {notificacao.tipo === "error" && <AlertCircle size={20} />}
                        {notificacao.tipo === "warning" && <AlertCircle size={20} />}
                        {notificacao.tipo === "info" && <Coffee size={20} />}
                        <span>{notificacao.mensagem}</span>
                    </div>
                    <button className="notificacao-fechar" onClick={() => setNotificacao(null)} aria-label="Fechar notificação">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="container-pagina">
                <header className="cabecalho-cob" role="banner">
                    <div className="conteudo-cabecalho">
                        <h1 className="titulo-cabecalho">
                            <Coffee className="icone-cabecalho" aria-hidden="true" size={24} />
                            Avaliação COB
                        </h1>

                        <div className="status-container">
                            <div className={`status-indicator ${online ? "online" : "offline"}`}>
                                {online ? <Wifi size={16} /> : <WifiOff size={16} />}
                                <span className="status-text">{online ? "Online" : "Offline"}</span>
                            </div>
                        </div>

                        <button
                            className="botao-fechar"
                            onClick={sairDaTela}
                            aria-label="Fechar avaliação e voltar ao painel principal"
                            title="Fechar avaliação (dados serão salvos automaticamente)"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <main
                    id="conteudo-principal"
                    className="container-cob"
                    ref={refPrincipal}
                    tabIndex="-1"
                    role="main"
                    aria-label="Formulário de avaliação COB"
                >
                    <div className="formulario-cob">
                        {/* Indicador de progresso */}
                        <div className="indicador-progresso" role="progressbar" aria-label="Progresso do preenchimento">
                            <div className="barra-progresso">
                                <div
                                    className="preenchimento-progresso"
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            ((fornecedorSelecionado ? 1 : 0) +
                                                (numeroAmostra ? 1 : 0) +
                                                (totalDefeitos > 0 ? 1 : 0) +
                                                (umidade ? 1 : 0)) *
                                            25,
                                        )}%`,
                                    }}
                                ></div>
                            </div>
                            <span className="texto-progresso">
                                {Math.min(
                                    100,
                                    ((fornecedorSelecionado ? 1 : 0) +
                                        (numeroAmostra ? 1 : 0) +
                                        (totalDefeitos > 0 ? 1 : 0) +
                                        (umidade ? 1 : 0)) *
                                    25,
                                )}
                                % preenchido
                            </span>
                        </div>

                        {/* Alertas de erro */}
                        {temErros && (
                            <div ref={refErro} className="alerta alerta-erro" role="alert" aria-live="assertive" tabIndex="-1">
                                <AlertCircle className="icone-alerta" aria-hidden="true" size={20} />
                                <div className="conteudo-alerta">
                                    <h3 className="titulo-alerta">Atenção: Campos obrigatórios</h3>
                                    <ul className="lista-alerta">
                                        {Object.entries(erros).map(
                                            ([campo, erro]) =>
                                                erro && (
                                                    <li key={campo} className="item-alerta">
                                                        {erro}
                                                    </li>
                                                ),
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Seção: Identificação */}
                        <section className="secao-cob" aria-labelledby="titulo-identificacao">
                            <h2 id="titulo-identificacao" className="titulo-secao">
                                <User className="icone-secao" aria-hidden="true" size={20} />
                                Identificação
                            </h2>
                            <div className="campos-formulario">
                                <div className="campo-formulario">
                                    <label htmlFor="avaliador" className="rotulo-campo">
                                        Nome do Avaliador:
                                    </label>
                                    <div className="wrapper-input">
                                        <User className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="avaliador"
                                            type="text"
                                            value={avaliador}
                                            onChange={(e) => setAvaliador(e.target.value)}
                                            disabled
                                            className="input-campo"
                                            aria-describedby="desc-avaliador"
                                        />
                                    </div>
                                    <div id="desc-avaliador" className="apenas-leitor-tela">
                                        Nome do avaliador logado no sistema
                                    </div>
                                </div>

                                <div className="campo-formulario">
                                    <label htmlFor="data-avaliacao" className="rotulo-campo">
                                        Data da avaliação:
                                    </label>
                                    <div className="wrapper-input">
                                        <Calendar className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="data-avaliacao"
                                            type="text"
                                            value={new Date().toLocaleDateString("pt-BR")}
                                            disabled
                                            className="input-campo"
                                            aria-describedby="desc-data"
                                        />
                                    </div>
                                    <div id="desc-data" className="apenas-leitor-tela">
                                        Data atual da avaliação
                                    </div>
                                </div>

                                <div className="campo-formulario">
                                    <label htmlFor="fornecedor" className="rotulo-campo obrigatorio">
                                        Fornecedor / Produtor: *
                                    </label>
                                    <div className="input-com-botao">
                                        <div className="wrapper-input">
                                            <Building className="icone-input" aria-hidden="true" size={18} />
                                            <select
                                                id="fornecedor"
                                                value={fornecedorSelecionado}
                                                onChange={(e) => setFornecedorSelecionado(e.target.value)}
                                                onBlur={() => manipularDesfoqueCampo("fornecedorSelecionado")}
                                                className={`input-campo ${tocados.fornecedorSelecionado && erros.fornecedorSelecionado ? "input-erro" : ""
                                                    }`}
                                                aria-describedby="desc-fornecedor erro-fornecedor"
                                                aria-invalid={tocados.fornecedorSelecionado && erros.fornecedorSelecionado ? "true" : "false"}
                                                required
                                            >
                                                <option value="">
                                                    {carregandoDados ? "Carregando fornecedores..." : "Selecione um fornecedor"}
                                                </option>
                                                {fornecedores.map((fornecedor) => (
                                                    <option key={fornecedor.id} value={fornecedor.nome}>
                                                        {fornecedor.nome}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navegar("/fornecedores")}
                                            className="botao-icone"
                                            aria-label="Cadastrar novo fornecedor"
                                            title="Novo fornecedor"
                                        >
                                            <Plus size={18} aria-hidden="true" />
                                            <span className="texto-botao">Novo</span>
                                        </button>
                                    </div>
                                    <div id="desc-fornecedor" className="apenas-leitor-tela">
                                        Selecione o fornecedor ou produtor do café a ser avaliado
                                    </div>
                                    {tocados.fornecedorSelecionado && erros.fornecedorSelecionado && (
                                        <div id="erro-fornecedor" className="erro-campo" role="alert">
                                            <AlertCircle size={14} aria-hidden="true" />
                                            {erros.fornecedorSelecionado}
                                        </div>
                                    )}
                                </div>

                                <div className="campo-formulario">
                                    <label htmlFor="numero-amostra" className="rotulo-campo obrigatorio">
                                        Nº da Amostra: *
                                    </label>
                                    <div className="wrapper-input">
                                        <Hash className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="numero-amostra"
                                            type="text"
                                            value={numeroAmostra}
                                            onChange={(e) => setNumeroAmostra(e.target.value)}
                                            onBlur={() => manipularDesfoqueCampo("numeroAmostra")}
                                            placeholder="Digite o número da amostra"
                                            className={`input-campo ${tocados.numeroAmostra && erros.numeroAmostra ? "input-erro" : ""}`}
                                            aria-describedby="desc-numero erro-numero"
                                            aria-invalid={tocados.numeroAmostra && erros.numeroAmostra ? "true" : "false"}
                                            required
                                        />
                                    </div>
                                    <div id="desc-numero" className="apenas-leitor-tela">
                                        Número de identificação da amostra de café
                                    </div>
                                    {tocados.numeroAmostra && erros.numeroAmostra && (
                                        <div id="erro-numero" className="erro-campo" role="alert">
                                            <AlertCircle size={14} aria-hidden="true" />
                                            {erros.numeroAmostra}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Seção: Classificação Física */}
                        <section className="secao-cob" aria-labelledby="titulo-classificacao">
                            <h2 id="titulo-classificacao" className="titulo-secao">
                                <Scale className="icone-secao" aria-hidden="true" size={20} />
                                Classificação Física do Café
                            </h2>

                            <div className="cabecalho-defeitos">
                                <button
                                    type="button"
                                    className="botao-alternar-detalhes"
                                    onClick={() => setMostrarDetalhesDefeitos(!mostrarDetalhesDefeitos)}
                                    aria-expanded={mostrarDetalhesDefeitos}
                                    aria-controls="detalhes-defeitos"
                                    aria-describedby="desc-alternar"
                                >
                                    {mostrarDetalhesDefeitos ? (
                                        <EyeOff size={18} aria-hidden="true" />
                                    ) : (
                                        <Eye size={18} aria-hidden="true" />
                                    )}
                                    {mostrarDetalhesDefeitos ? "Ocultar detalhes" : "Mostrar detalhes dos defeitos"}
                                </button>
                                <div id="desc-alternar" className="apenas-leitor-tela">
                                    Clique para mostrar ou ocultar informações detalhadas sobre cada tipo de defeito
                                </div>
                            </div>

                            {mostrarDetalhesDefeitos && (
                                <div
                                    id="detalhes-defeitos"
                                    className="info-defeitos"
                                    role="region"
                                    aria-label="Informações sobre defeitos"
                                >
                                    <p className="texto-info">
                                        <strong>Como usar:</strong> Digite a quantidade encontrada de cada defeito. O sistema calculará
                                        automaticamente a equivalência baseada na tabela COB.
                                    </p>
                                </div>
                            )}

                            <div className="container-defeitos" role="group" aria-labelledby="titulo-classificacao">
                                {Object.entries(tabelaDefeitos).map(([defeito, info]) => (
                                    <div key={defeito} className="item-defeito">
                                        <label htmlFor={`defeito-${defeito}`} className="rotulo-defeito">
                                            {defeito}:
                                            {mostrarDetalhesDefeitos && (
                                                <span className="info-defeito">
                                                    (Cada {info.quantidade} = {info.equivalencia} equiv.)
                                                </span>
                                            )}
                                        </label>
                                        <div className="inputs-defeito">
                                            <input
                                                id={`defeito-${defeito}`}
                                                type="number"
                                                min="0"
                                                value={defeitos[defeito] || ""}
                                                onChange={(e) => manipularMudancaDefeito(defeito, Number.parseInt(e.target.value) || 0)}
                                                className="quantidade-defeito"
                                                aria-describedby={`equiv-${defeito}`}
                                                placeholder="0"
                                            />
                                            <div id={`equiv-${defeito}`} className="equivalencia-defeito" aria-live="polite">
                                                Equiv: <span>{equivalencias[defeito] || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="container-totais" role="region" aria-labelledby="titulo-totais">
                                <h3 id="titulo-totais" className="apenas-leitor-tela">
                                    Totais da classificação
                                </h3>
                                <div className="item-total">
                                    <label htmlFor="total-defeitos" className="rotulo-total">
                                        Total de Defeitos:
                                    </label>
                                    <input
                                        id="total-defeitos"
                                        type="text"
                                        readOnly
                                        value={totalDefeitos}
                                        className="input-total"
                                        aria-describedby="desc-total-defeitos"
                                    />
                                    <div id="desc-total-defeitos" className="apenas-leitor-tela">
                                        Soma total de todos os defeitos encontrados
                                    </div>
                                </div>
                                <div className="item-total">
                                    <label htmlFor="total-equivalencia" className="rotulo-total">
                                        Total da Equivalência:
                                    </label>
                                    <input
                                        id="total-equivalencia"
                                        type="text"
                                        readOnly
                                        value={equivalenciaTotal}
                                        className="input-total"
                                        aria-describedby="desc-total-equiv"
                                        aria-live="polite"
                                    />
                                    <div id="desc-total-equiv" className="apenas-leitor-tela">
                                        Equivalência total calculada baseada na tabela COB
                                    </div>
                                </div>
                                <div className="item-total">
                                    <label htmlFor="tipo-cafe" className="rotulo-total">
                                        Tipo do Café:
                                    </label>
                                    <input
                                        id="tipo-cafe"
                                        type="text"
                                        readOnly
                                        value={tipo}
                                        className="input-total resultado-tipo"
                                        aria-describedby="desc-tipo"
                                        aria-live="polite"
                                    />
                                    <div id="desc-tipo" className="apenas-leitor-tela">
                                        Classificação automática baseada no total de equivalências
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Seção: Categoria */}
                        <section className="secao-cob" aria-labelledby="titulo-categoria">
                            <h2 id="titulo-categoria" className="titulo-secao">
                                <Coffee className="icone-secao" aria-hidden="true" size={20} />
                                Categoria
                            </h2>
                            <div className="grade-categoria">
                                <div className="cartao-categoria">
                                    <h3 className="titulo-cartao-categoria">Subcategoria % Peneira</h3>
                                    <fieldset className="grupo-checkbox" aria-labelledby="legenda-peneira">
                                        <legend id="legenda-peneira" className="apenas-leitor-tela">
                                            Selecione as subcategorias de peneira aplicáveis
                                        </legend>
                                        {["15 AC", "16 AC", "17 AC", "18 AC", "19", "Bica Corrida"].map((item) => (
                                            <label key={item} className="rotulo-checkbox">
                                                <input
                                                    type="checkbox"
                                                    value={item}
                                                    checked={peneiraSubcategoria.includes(item)}
                                                    onChange={manipularMudancaPeneira}
                                                    className="input-checkbox"
                                                />
                                                <span className="texto-checkbox">{item}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-categoria">
                                    <h3 className="titulo-cartao-categoria">Chato</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-chato">
                                        <legend id="legenda-chato" className="apenas-leitor-tela">
                                            Selecione o tamanho do café tipo Chato
                                        </legend>
                                        {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                                            <label key={`chato-${tamanho}`} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="tipoCafeChato"
                                                    value={tamanho}
                                                    checked={tipoCafe.grupo === "CHATO" && tipoCafe.tamanho === tamanho}
                                                    onChange={() => setTipoCafe({ grupo: "CHATO", tamanho })}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{tamanho}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-categoria">
                                    <h3 className="titulo-cartao-categoria">Moca</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-moca">
                                        <legend id="legenda-moca" className="apenas-leitor-tela">
                                            Selecione o tamanho do café tipo Moca
                                        </legend>
                                        {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                                            <label key={`moca-${tamanho}`} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="tipoCafeMoca"
                                                    value={tamanho}
                                                    checked={tipoCafe.grupo === "MOCA" && tipoCafe.tamanho === tamanho}
                                                    onChange={() => setTipoCafe({ grupo: "MOCA", tamanho })}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{tamanho}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-categoria">
                                    <h3 className="titulo-cartao-categoria">Grupo I: Arábica</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-arabica">
                                        <legend id="legenda-arabica" className="apenas-leitor-tela">
                                            Selecione a classificação para café Arábica
                                        </legend>
                                        {["Estritamente Mole", "Mole", "Apenas Mole", "Duro", "Riado", "Rio", "Rio Zona"].map((opcao) => (
                                            <label key={opcao} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="subClassificacaoArabica"
                                                    value={opcao}
                                                    checked={grupoBebida === "ARABICA" && subClassificacaoBebida === opcao}
                                                    onChange={() => {
                                                        setGrupoBebida("ARABICA")
                                                        setSubClassificacaoBebida(opcao)
                                                    }}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-categoria">
                                    <h3 className="titulo-cartao-categoria">Grupo II: Robusta</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-robusta">
                                        <legend id="legenda-robusta" className="apenas-leitor-tela">
                                            Selecione a classificação para café Robusta
                                        </legend>
                                        {["Excelente", "Regular", "Boa", "Anormal"].map((opcao) => (
                                            <label key={opcao} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="subClassificacaoRobusta"
                                                    value={opcao}
                                                    checked={grupoBebida === "ROBUSTA" && subClassificacaoBebida === opcao}
                                                    onChange={() => {
                                                        setGrupoBebida("ROBUSTA")
                                                        setSubClassificacaoBebida(opcao)
                                                    }}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-categoria">
                                    <h3 className="titulo-cartao-categoria">Classe</h3>
                                    <fieldset className="grupo-checkbox" aria-labelledby="legenda-classe">
                                        <legend id="legenda-classe" className="apenas-leitor-tela">
                                            Selecione as classes de cor aplicáveis
                                        </legend>
                                        {[
                                            "Verde Azulado",
                                            "Verde Cana",
                                            "Verde",
                                            "Esverdeada",
                                            "Amarelada",
                                            "Amarela",
                                            "Marron",
                                            "Chumbado",
                                            "Esbranquiçada",
                                            "Discrepante",
                                        ].map((item) => (
                                            <label key={item} className="rotulo-checkbox">
                                                <input
                                                    type="checkbox"
                                                    value={item}
                                                    checked={classeBebida.includes(item)}
                                                    onChange={manipularMudancaClasse}
                                                    className="input-checkbox"
                                                />
                                                <span className="texto-checkbox">{item}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>
                            </div>
                        </section>

                        {/* Seção: Conclusão */}
                        <section className="secao-cob" aria-labelledby="titulo-conclusao">
                            <h2 id="titulo-conclusao" className="titulo-secao">
                                <FileCheck className="icone-secao" aria-hidden="true" size={20} />
                                Conclusão
                            </h2>
                            <div className="campos-formulario">
                                <div className="campo-formulario">
                                    <label htmlFor="umidade" className="rotulo-campo">
                                        Umidade (%):
                                    </label>
                                    <div className="wrapper-input">
                                        <Droplets className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="umidade"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={umidade}
                                            onChange={(e) => setUmidade(e.target.value)}
                                            onBlur={() => manipularDesfoqueCampo("umidade")}
                                            placeholder="Digite a umidade"
                                            className={`input-campo ${tocados.umidade && erros.umidade ? "input-erro" : ""}`}
                                            aria-describedby="desc-umidade erro-umidade"
                                            aria-invalid={tocados.umidade && erros.umidade ? "true" : "false"}
                                        />
                                    </div>
                                    <div id="desc-umidade" className="apenas-leitor-tela">
                                        Percentual de umidade do café, valor entre 0 e 100
                                    </div>
                                    {tocados.umidade && erros.umidade && (
                                        <div id="erro-umidade" className="erro-campo" role="alert">
                                            <AlertCircle size={14} aria-hidden="true" />
                                            {erros.umidade}
                                        </div>
                                    )}
                                </div>

                                <div className="campo-formulario">
                                    <label htmlFor="aparelho" className="rotulo-campo">
                                        Aparelho:
                                    </label>
                                    <div className="wrapper-input">
                                        <Settings className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="aparelho"
                                            type="text"
                                            value={aparelho}
                                            onChange={(e) => setAparelho(e.target.value)}
                                            placeholder="Informe o aparelho utilizado"
                                            className="input-campo"
                                            aria-describedby="desc-aparelho"
                                        />
                                    </div>
                                    <div id="desc-aparelho" className="apenas-leitor-tela">
                                        Equipamento utilizado para medição da umidade
                                    </div>
                                </div>

                                <div className="campo-formulario">
                                    <label htmlFor="subcategoria" className="rotulo-campo">
                                        Subcategoria:
                                    </label>
                                    <div className="wrapper-input">
                                        <Coffee className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="subcategoria"
                                            type="text"
                                            value={subcategoria}
                                            onChange={(e) => setSubcategoria(e.target.value)}
                                            placeholder="Preencha a subcategoria"
                                            className="input-campo"
                                            aria-describedby="desc-subcategoria"
                                        />
                                    </div>
                                    <div id="desc-subcategoria" className="apenas-leitor-tela">
                                        Subcategoria específica do café avaliado
                                    </div>
                                </div>

                                <div className="campo-formulario">
                                    <label htmlFor="tipo-conclusao" className="rotulo-campo">
                                        Tipo:
                                    </label>
                                    <div className="wrapper-input">
                                        <Scale className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="tipo-conclusao"
                                            type="text"
                                            value={tipo}
                                            onChange={(e) => setTipo(e.target.value)}
                                            placeholder="Tipo do café"
                                            className="input-campo"
                                            aria-describedby="desc-tipo-conclusao"
                                        />
                                    </div>
                                    <div id="desc-tipo-conclusao" className="apenas-leitor-tela">
                                        Tipo final do café baseado na classificação
                                    </div>
                                </div>

                                <div className="campo-formulario">
                                    <label htmlFor="posto-servico" className="rotulo-campo">
                                        Posto de Serviço:
                                    </label>
                                    <div className="wrapper-input">
                                        <Building className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="posto-servico"
                                            type="text"
                                            value={postoServico}
                                            onChange={(e) => setPostoServico(e.target.value)}
                                            placeholder="Informe o posto de serviço"
                                            className="input-campo"
                                            aria-describedby="desc-posto"
                                        />
                                    </div>
                                    <div id="desc-posto" className="apenas-leitor-tela">
                                        Local ou posto de serviço onde foi realizada a avaliação
                                    </div>
                                </div>

                                <div className="campo-formulario">
                                    <label htmlFor="classificador-mapa" className="rotulo-campo">
                                        Classificador/Reg. MAPA:
                                    </label>
                                    <div className="wrapper-input">
                                        <User className="icone-input" aria-hidden="true" size={18} />
                                        <input
                                            id="classificador-mapa"
                                            type="text"
                                            value={classificadorMapa}
                                            onChange={(e) => setClassificadorMapa(e.target.value)}
                                            placeholder="Informe o registro MAPA"
                                            className="input-campo"
                                            aria-describedby="desc-mapa"
                                        />
                                    </div>
                                    <div id="desc-mapa" className="apenas-leitor-tela">
                                        Número de registro do classificador no Ministério da Agricultura
                                    </div>
                                </div>
                            </div>

                            <div className="campo-formulario campo-observacoes">
                                <label htmlFor="observacoes" className="rotulo-campo">
                                    Observações:
                                </label>
                                <div className="wrapper-textarea">
                                    <FileText className="icone-textarea" aria-hidden="true" size={18} />
                                    <textarea
                                        id="observacoes"
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Digite observações adicionais sobre a avaliação..."
                                        className="textarea-observacoes"
                                        rows="4"
                                        aria-describedby="desc-observacoes"
                                    />
                                </div>
                                <div id="desc-observacoes" className="apenas-leitor-tela">
                                    Campo para observações gerais sobre a avaliação realizada
                                </div>
                            </div>
                        </section>

                        {/* Seção: Laudo de Classificação */}
                        <section className="secao-cob" aria-labelledby="titulo-laudo">
                            <h2 id="titulo-laudo" className="titulo-secao">
                                <FileCheck className="icone-secao" aria-hidden="true" size={20} />
                                Laudo de Classificação
                            </h2>
                            <div className="grade-laudo">
                                <div className="cartao-laudo">
                                    <h3 className="titulo-cartao-laudo">Preparo</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-preparo">
                                        <legend id="legenda-preparo" className="apenas-leitor-tela">
                                            Selecione o método de preparo do café
                                        </legend>
                                        {["Via Seca", "Via Úmida"].map((opcao) => (
                                            <label key={opcao} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="preparo"
                                                    value={opcao}
                                                    checked={peloPreparo === opcao}
                                                    onChange={() => setPeloPreparo(opcao)}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-laudo">
                                    <h3 className="titulo-cartao-laudo">Seca</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-seca">
                                        <legend id="legenda-seca" className="apenas-leitor-tela">
                                            Avalie a qualidade da secagem do café
                                        </legend>
                                        {["Seca Boa", "Seca Regular", "Seca Má"].map((opcao) => (
                                            <label key={opcao} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="seca"
                                                    value={opcao}
                                                    checked={pelaSeca === opcao}
                                                    onChange={() => setPelaSeca(opcao)}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-laudo">
                                    <h3 className="titulo-cartao-laudo">Pelo Aspecto</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-aspecto">
                                        <legend id="legenda-aspecto" className="apenas-leitor-tela">
                                            Avalie o aspecto visual geral do café
                                        </legend>
                                        {["Bom", "Regular", "Mau"].map((opcao) => (
                                            <label key={opcao} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="aspecto"
                                                    value={opcao}
                                                    checked={peloAspecto === opcao}
                                                    onChange={() => setPeloAspecto(opcao)}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-laudo">
                                    <h3 className="titulo-cartao-laudo">Torra (Coffea Arábica)</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-torra-arabica">
                                        <legend id="legenda-torra-arabica" className="apenas-leitor-tela">
                                            Avalie a qualidade da torra para café Arábica
                                        </legend>
                                        {["Torração Fina", "Torração Boa", "Torração Regular", "Torração Má"].map((opcao) => (
                                            <label key={opcao} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="torra-arabica"
                                                    value={opcao}
                                                    checked={torraArabica === opcao}
                                                    onChange={() => {
                                                        setTorraArabica(opcao)
                                                        setTorraCanephora("")
                                                    }}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-laudo">
                                    <h3 className="titulo-cartao-laudo">Torra (Coffea Canephora)</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-torra-canephora">
                                        <legend id="legenda-torra-canephora" className="apenas-leitor-tela">
                                            Avalie a qualidade da torra para café Canephora
                                        </legend>
                                        {[
                                            "Torração Excelente",
                                            "Torração Quase Excelente",
                                            "Torração Muito Boa",
                                            "Torração Boa",
                                            "Torração Regular",
                                            "Torração Má",
                                        ].map((opcao) => (
                                            <label key={opcao} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="torra-canephora"
                                                    value={opcao}
                                                    checked={torraCanephora === opcao}
                                                    onChange={() => {
                                                        setTorraCanephora(opcao)
                                                        setTorraArabica("")
                                                    }}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="cartao-laudo">
                                    <h3 className="titulo-cartao-laudo">Teor de Cafeína</h3>
                                    <fieldset className="grupo-radio" aria-labelledby="legenda-cafeina">
                                        <legend id="legenda-cafeina" className="apenas-leitor-tela">
                                            Selecione o teor de cafeína do café
                                        </legend>
                                        {["Café", "Café descafeinado"].map((opcao) => (
                                            <label key={opcao} className="rotulo-radio">
                                                <input
                                                    type="radio"
                                                    name="teor-cafeina"
                                                    value={opcao}
                                                    checked={teorCafeina === opcao}
                                                    onChange={() => setTeorCafeina(opcao)}
                                                    className="input-radio"
                                                />
                                                <span className="texto-radio">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>
                            </div>
                        </section>

                        {/* Botões de ação */}
                        <div className="botoes-acao">
                            <button
                                className="botao-acao botao-acao-primario"
                                onClick={manipularSalvarAvaliacao}
                                disabled={salvando || temErros}
                                aria-describedby="desc-salvar"
                            >
                                {salvando ? (
                                    <>
                                        <Loader2 className="icone-botao icone-carregando" aria-hidden="true" size={20} />
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="icone-botao" aria-hidden="true" size={20} />
                                        <span>Salvar Avaliação</span>
                                    </>
                                )}
                            </button>
                            <div id="desc-salvar" className="apenas-leitor-tela">
                                {salvando
                                    ? "Salvando avaliação no banco de dados"
                                    : temErros
                                        ? "Corrija os erros antes de salvar"
                                        : "Clique para salvar a avaliação no sistema"}
                            </div>

                            <button
                                className="botao-acao botao-acao-secundario"
                                onClick={manipularGerarPDF}
                                disabled={!fornecedorSelecionado || !numeroAmostra}
                                aria-describedby="desc-pdf"
                            >
                                <FileText className="icone-botao" aria-hidden="true" size={20} />
                                <span>Gerar PDF</span>
                            </button>
                            <div id="desc-pdf" className="apenas-leitor-tela">
                                Gerar relatório em PDF da avaliação realizada
                            </div>
                        </div>

                        {/* Mensagem de sucesso */}
                        <div ref={refSucesso} className="apenas-leitor-tela" tabIndex="-1" role="status" aria-live="polite">
                            Avaliação processada com sucesso
                        </div>
                    </div>
                </main>

                {/* Botão de voltar ao topo */}
                {posicaoScroll > 300 && (
                    <button
                        className="voltar-ao-topo"
                        onClick={voltarAoTopo}
                        title="Voltar ao topo (Ctrl + Home)"
                        aria-label="Voltar ao topo da página"
                    >
                        <ChevronUp size={24} aria-hidden="true" />
                    </button>
                )}
            </div>
        </>
    )
}

export default Cob
