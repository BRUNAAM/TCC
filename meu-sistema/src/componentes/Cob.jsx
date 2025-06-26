"use client"

import "./Cob.css"
import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "../config/firebase"
import { collection, addDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import logo from "../assets/logopdf.png"
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
} from "lucide-react"

const classificationTable = [
    { defeitos: 4, label: "2-5" },
    { defeitos: 5, label: "2-10" },
    { defeitos: 6, label: "2-15" },
    { defeitos: 7, label: "2-20" },
    { defeitos: 8, label: "2-25" },
    { defeitos: 9, label: "2-30" },
    { defeitos: 10, label: "2-35" },
    { defeitos: 11, label: "2-40" },
    { defeitos: 11.05, label: "2-45" },
    { defeitos: 12, label: "3" },
    { defeitos: 13, label: "3-5" },
    { defeitos: 15, label: "3-10" },
    { defeitos: 17, label: "3-15" },
    { defeitos: 18, label: "3-20" },
    { defeitos: 19, label: "3-25" },
    { defeitos: 20, label: "3-30" },
    { defeitos: 22, label: "3-35" },
    { defeitos: 23, label: "3-40" },
    { defeitos: 25, label: "3-45" },
    { defeitos: 26, label: "4" },
    { defeitos: 28, label: "4-5" },
    { defeitos: 30, label: "4-10" },
    { defeitos: 32, label: "4-15" },
    { defeitos: 34, label: "4-20" },
    { defeitos: 36, label: "4-25" },
    { defeitos: 38, label: "4-30" },
    { defeitos: 40, label: "4-35" },
    { defeitos: 42, label: "4-40" },
    { defeitos: 44, label: "4-45" },
    { defeitos: 46, label: "5" },
    { defeitos: 49, label: "5-5" },
    { defeitos: 53, label: "5-10" },
    { defeitos: 57, label: "5-15" },
    { defeitos: 64, label: "5-25" },
    { defeitos: 68, label: "5-30" },
    { defeitos: 71, label: "5-35" },
    { defeitos: 75, label: "5-40" },
    { defeitos: 79, label: "5-45" },
    { defeitos: 86, label: "6" },
    { defeitos: 93, label: "6-5" },
    { defeitos: 100, label: "6-10" },
    { defeitos: 108, label: "6-15" },
    { defeitos: 115, label: "6-20" },
    { defeitos: 123, label: "6-25" },
    { defeitos: 130, label: "6-30" },
    { defeitos: 138, label: "6-35" },
    { defeitos: 145, label: "6-40" },
    { defeitos: 153, label: "6-45" },
    { defeitos: 160, label: "7" },
    { defeitos: 180, label: "7-5" },
    { defeitos: 200, label: "7-10" },
    { defeitos: 220, label: "7-15" },
    { defeitos: 240, label: "7-20" },
    { defeitos: 260, label: "7-25" },
    { defeitos: 280, label: "7-30" },
    { defeitos: 300, label: "7-35" },
    { defeitos: 320, label: "7-40" },
    { defeitos: 340, label: "7-45" },
    { defeitos: 360, label: "8" },
    { defeitos: Number.POSITIVE_INFINITY, label: "Fora de Tipo" },
]

function getClassification(defeitosValue) {
    if (defeitosValue <= 0) return { label: "2-5" }

    for (let i = 0; i < classificationTable.length; i++) {
        if (defeitosValue <= classificationTable[i].defeitos) {
            return classificationTable[i]
        }
    }
    return classificationTable[classificationTable.length - 1]
}

// Tabela de defeitos como constante fora do componente
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
    const [salvando, setSalvando] = useState(false)
    const [scrollPosition, setScrollPosition] = useState(0)
    const [showDefeitosDetails, setShowDefeitosDetails] = useState(false)
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})

    const navigate = useNavigate()

    // Refs para acessibilidade
    const mainRef = useRef(null)
    const errorRef = useRef(null)
    const successRef = useRef(null)

    // Usando dados do contexto
    const { fornecedores, loading: dataLoading } = useData()

    // Skip link para acessibilidade
    const skipToMain = useCallback((e) => {
        e.preventDefault()
        if (mainRef.current) {
            mainRef.current.focus()
        }
    }, [])

    // Função para anunciar para leitores de tela
    const announceToScreenReader = useCallback((message) => {
        const announcement = document.createElement("div")
        announcement.setAttribute("aria-live", "polite")
        announcement.setAttribute("aria-atomic", "true")
        announcement.className = "sr-only"
        announcement.textContent = message
        document.body.appendChild(announcement)
        setTimeout(() => {
            document.body.removeChild(announcement)
        }, 1000)
    }, [])

    // Validação de campos
    const validateField = useCallback((field, value) => {
        switch (field) {
            case "fornecedorSelecionado":
                return !value ? "Fornecedor é obrigatório" : ""
            case "numeroAmostra":
                return !value ? "Número da amostra é obrigatório" : ""
            case "umidade":
                return value && (isNaN(value) || value < 0 || value > 100) ? "Umidade deve ser entre 0 e 100%" : ""
            default:
                return ""
        }
    }, [])

    // Atualizar erros
    const updateErrors = useCallback(() => {
        const newErrors = {}
        newErrors.fornecedorSelecionado = validateField("fornecedorSelecionado", fornecedorSelecionado)
        newErrors.numeroAmostra = validateField("numeroAmostra", numeroAmostra)
        newErrors.umidade = validateField("umidade", umidade)
        setErrors(newErrors)
    }, [fornecedorSelecionado, numeroAmostra, umidade, validateField])

    useEffect(() => {
        const bloquearVoltar = (e) => {
            e.preventDefault()
            window.history.pushState(null, null, window.location.href)
        }

        window.history.pushState(null, null, window.location.href)
        window.addEventListener("popstate", bloquearVoltar)

        const handleScroll = () => {
            setScrollPosition(window.scrollY)
        }
        window.addEventListener("scroll", handleScroll)

        return () => {
            window.removeEventListener("popstate", bloquearVoltar)
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    useEffect(() => {
        const usuarioNome = localStorage.getItem("usuarioNome") || ""
        setAvaliador(usuarioNome)
    }, [])

    useEffect(() => {
        const classification = getClassification(equivalenciaTotal)
        setTipo(classification.label)
    }, [equivalenciaTotal])

    useEffect(() => {
        updateErrors()
    }, [updateErrors])

    // REMOVER tabelaDefeitos das dependências do useCallback
    const handleDefeitoChange = useCallback(
        (defeito, quantidade) => {
            const validQuantity = isNaN(quantidade) ? 0 : quantidade

            const updatedDefeitos = { ...defeitos, [defeito]: validQuantity }
            setDefeitos(updatedDefeitos)

            let totalEquivalencia = 0
            const updatedEquivalencias = {}

            for (const [key, value] of Object.entries(updatedDefeitos)) {
                if (tabelaDefeitos[key]) {
                    const equivalencia = Math.floor(value / tabelaDefeitos[key].quantidade) * tabelaDefeitos[key].equivalencia
                    updatedEquivalencias[key] = equivalencia
                    totalEquivalencia += equivalencia
                }
            }
            setEquivalencias(updatedEquivalencias)
            setEquivalenciaTotal(totalEquivalencia)

            // Anunciar mudança para leitores de tela
            announceToScreenReader(
                `${defeito}: ${validQuantity} unidades, equivalência: ${updatedEquivalencias[defeito] || 0}`,
            )
        },
        [defeitos, announceToScreenReader], // Removido tabelaDefeitos das dependências
    )

    const handleClasseChange = useCallback((e) => {
        const { value, checked } = e.target
        if (checked) {
            setClasseBebida((prev) => [...prev, value])
        } else {
            setClasseBebida((prev) => prev.filter((item) => item !== value))
        }
    }, [])

    const handlePeneiraChange = useCallback((e) => {
        const { value, checked } = e.target
        if (checked) {
            setPeneiraSubcategoria((prev) => [...prev, value])
        } else {
            setPeneiraSubcategoria((prev) => prev.filter((item) => item !== value))
        }
    }, [])

    const handleFieldBlur = useCallback((field) => {
        setTouched((prev) => ({ ...prev, [field]: true }))
    }, [])

    const handlePrintPDF = useCallback(() => {
        if (!fornecedorSelecionado || !numeroAmostra) {
            announceToScreenReader("Erro: Preencha os campos obrigatórios antes de gerar o PDF")
            if (errorRef.current) {
                errorRef.current.focus()
            }
            return
        }

        announceToScreenReader("Gerando PDF da avaliação...")

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
            const titulo = "Avaliação Física de Café - Método COB"
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

            // Tabelas do PDF
            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Identificação", "Valor"]],
                    body: [
                        ["Avaliador", avaliador || "—"],
                        ["Data", new Date().toLocaleDateString("pt-BR")],
                        ["Fornecedor", fornecedorSelecionado || "—"],
                        ["Nº Amostra", numeroAmostra || "—"],
                        ["Umidade", umidade || "—"],
                        ["Aparelho", aparelho || "—"],
                        ["Subcategoria", subcategoria || "—"],
                        ["Tipo", tipo || "—"],
                        ["Tipo Café (Chato ou Moca)", tipoCafe.grupo ? `${tipoCafe.grupo} - ${tipoCafe.tamanho}` : "—"],
                        ["Posto Serviço", postoServico || "—"],
                        ["Classificador MAPA", classificadorMapa || "—"],
                    ],
                }),
            )

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Defeito", "Quantidade", "Equivalência"]],
                    body: Object.entries(defeitos || {}).map(([nome, qtd]) => [nome, qtd, equivalencias?.[nome] || 0]),
                }),
            )

            autoTable(
                docPDF,
                autoTableOptions({
                    body: [
                        ["Total de Defeitos", Object.values(defeitos || {}).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0)],
                        ["Total Equivalência", equivalenciaTotal],
                        ["Tipo do Café", tipo || "—"],
                    ],
                    head: [],
                }),
            )

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Categoria", "Valor"]],
                    body: [
                        ["Peneira/Subcategoria", (peneiraSubcategoria || []).join(", ") || "—"],
                        ["Grupo da Bebida", grupoBebida || "—"],
                        ["Subclassificação", subClassificacaoBebida || "—"],
                        ["Classe da Bebida", (classeBebida || []).join(", ") || "—"],
                    ],
                }),
            )

            autoTable(
                docPDF,
                autoTableOptions({
                    head: [["Laudo Técnico", "Valor"]],
                    body: [
                        ["Preparo", peloPreparo || "—"],
                        ["Seca", pelaSeca || "—"],
                        ["Aspecto", peloAspecto || "—"],
                        ["Torra Arábica", torraArabica || "—"],
                        ["Torra Canephora", torraCanephora || "—"],
                        ["Teor Cafeína", teorCafeina || "—"],
                    ],
                }),
            )

            autoTable(
                docPDF,
                autoTableOptions({
                    body: [["Observações", observacoes || "—"]],
                    head: [],
                }),
            )

            const assinaturaY = docPDF.lastAutoTable.finalY + 30
            const linhaLargura = 80
            const linhaInicioX = (pageWidth - linhaLargura) / 2
            docPDF.line(linhaInicioX, assinaturaY, linhaInicioX + linhaLargura, assinaturaY)
            docPDF.setFont("times", "normal")
            docPDF.setFontSize(12)
            docPDF.text(`Avaliador: ${avaliador || "—"}`, pageWidth / 2, assinaturaY + 7, { align: "center" })
            docPDF.text(`Registro MAPA: ${classificadorMapa || "—"}`, pageWidth / 2, assinaturaY + 14, {
                align: "center",
            })

            docPDF.save(`laudo_cob_${numeroAmostra}_${new Date().toISOString().split("T")[0]}.pdf`)
            announceToScreenReader("PDF gerado com sucesso!")
        }

        img.onerror = () => {
            console.warn("Erro ao carregar logo, gerando PDF sem imagem")
            announceToScreenReader("Aviso: PDF gerado sem logo devido a erro no carregamento da imagem")
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
        announceToScreenReader,
    ])

    const handleSalvarAvaliacao = useCallback(async () => {
        if (salvando) return

        // Validar campos obrigatórios
        if (!fornecedorSelecionado || !numeroAmostra) {
            announceToScreenReader("Erro: Preencha todos os campos obrigatórios")
            if (errorRef.current) {
                errorRef.current.focus()
            }
            return
        }

        setSalvando(true)
        announceToScreenReader("Salvando avaliação...")

        try {
            const authInstance = getAuth()
            const user = authInstance.currentUser

            if (!user) {
                announceToScreenReader("Erro: Usuário não autenticado")
                setSalvando(false)
                return
            }

            const avaliacao = {
                userId: user.uid,
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
                data: new Date().toISOString(),
            }

            await addDoc(collection(db, "usuarios", user.uid, "avaliacoes_cob"), avaliacao)

            announceToScreenReader("Avaliação salva com sucesso!")
            if (successRef.current) {
                successRef.current.focus()
            }

            const querVerPDF = window.confirm("Deseja gerar o PDF da avaliação?")
            if (querVerPDF) {
                handlePrintPDF()
            }
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error)
            announceToScreenReader("Erro ao salvar avaliação. Tente novamente.")
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
        announceToScreenReader,
        handlePrintPDF,
    ])

    const scrollToTop = useCallback(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
        announceToScreenReader("Voltando ao topo da página")
    }, [announceToScreenReader])

    const totalDefeitos = Object.values(defeitos).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0)

    const hasErrors = Object.values(errors).some((error) => error !== "")

    return (
        <>
            {/* Skip Link */}
            <a href="#main-content" className="skip-link" onClick={skipToMain}>
                Pular para o conteúdo principal
            </a>

            <div className="page-wrapper">
                <header className="cob-header" role="banner">
                    <div className="header-content">
                        <h1 className="header-title">
                            <Coffee className="header-icon" aria-hidden="true" size={24} />
                            Avaliação COB
                        </h1>
                        <button
                            className="close-button"
                            onClick={() => navigate("/logado")}
                            aria-label="Fechar avaliação e voltar ao painel principal"
                            title="Fechar (Esc)"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <main
                    id="main-content"
                    className="cob-container"
                    ref={mainRef}
                    tabIndex="-1"
                    role="main"
                    aria-label="Formulário de avaliação COB"
                >
                    <div className="cob-form">
                        {/* Indicador de progresso */}
                        <div className="progress-indicator" role="progressbar" aria-label="Progresso do preenchimento">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
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
                            <span className="progress-text">
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
                        {hasErrors && (
                            <div ref={errorRef} className="alert alert-error" role="alert" aria-live="assertive" tabIndex="-1">
                                <AlertCircle className="alert-icon" aria-hidden="true" size={20} />
                                <div className="alert-content">
                                    <h3 className="alert-title">Atenção: Campos obrigatórios</h3>
                                    <ul className="alert-list">
                                        {Object.entries(errors).map(
                                            ([field, error]) =>
                                                error && (
                                                    <li key={field} className="alert-item">
                                                        {error}
                                                    </li>
                                                ),
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Seção: Identificação */}
                        <section className="cob-section" aria-labelledby="identificacao-title">
                            <h2 id="identificacao-title" className="section-title">
                                <User className="section-icon" aria-hidden="true" size={20} />
                                Identificação
                            </h2>
                            <div className="campos-form">
                                <div className="campo-form">
                                    <label htmlFor="avaliador" className="campo-label">
                                        Nome do Avaliador:
                                    </label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="avaliador"
                                            type="text"
                                            value={avaliador}
                                            onChange={(e) => setAvaliador(e.target.value)}
                                            disabled
                                            className="campo-input"
                                            aria-describedby="avaliador-desc"
                                        />
                                    </div>
                                    <div id="avaliador-desc" className="sr-only">
                                        Nome do avaliador logado no sistema
                                    </div>
                                </div>

                                <div className="campo-form">
                                    <label htmlFor="data-avaliacao" className="campo-label">
                                        Data da avaliação:
                                    </label>
                                    <div className="input-wrapper">
                                        <Calendar className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="data-avaliacao"
                                            type="text"
                                            value={new Date().toLocaleDateString("pt-BR")}
                                            disabled
                                            className="campo-input"
                                            aria-describedby="data-desc"
                                        />
                                    </div>
                                    <div id="data-desc" className="sr-only">
                                        Data atual da avaliação
                                    </div>
                                </div>

                                <div className="campo-form">
                                    <label htmlFor="fornecedor" className="campo-label required">
                                        Fornecedor / Produtor: *
                                    </label>
                                    <div className="input-com-botao">
                                        <div className="input-wrapper">
                                            <Building className="input-icon" aria-hidden="true" size={18} />
                                            <select
                                                id="fornecedor"
                                                value={fornecedorSelecionado}
                                                onChange={(e) => setFornecedorSelecionado(e.target.value)}
                                                onBlur={() => handleFieldBlur("fornecedorSelecionado")}
                                                className={`campo-input ${touched.fornecedorSelecionado && errors.fornecedorSelecionado ? "input-error" : ""
                                                    }`}
                                                aria-describedby="fornecedor-desc fornecedor-error"
                                                aria-invalid={touched.fornecedorSelecionado && errors.fornecedorSelecionado ? "true" : "false"}
                                                required
                                            >
                                                <option value="">
                                                    {dataLoading ? "Carregando fornecedores..." : "Selecione um fornecedor"}
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
                                            onClick={() => navigate("/fornecedores")}
                                            className="botao-icone"
                                            aria-label="Cadastrar novo fornecedor"
                                            title="Novo fornecedor"
                                        >
                                            <Plus size={18} aria-hidden="true" />
                                            <span className="botao-texto">Novo</span>
                                        </button>
                                    </div>
                                    <div id="fornecedor-desc" className="sr-only">
                                        Selecione o fornecedor ou produtor do café a ser avaliado
                                    </div>
                                    {touched.fornecedorSelecionado && errors.fornecedorSelecionado && (
                                        <div id="fornecedor-error" className="field-error" role="alert">
                                            <AlertCircle size={14} aria-hidden="true" />
                                            {errors.fornecedorSelecionado}
                                        </div>
                                    )}
                                </div>

                                <div className="campo-form">
                                    <label htmlFor="numero-amostra" className="campo-label required">
                                        Nº da Amostra: *
                                    </label>
                                    <div className="input-wrapper">
                                        <Hash className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="numero-amostra"
                                            type="text"
                                            value={numeroAmostra}
                                            onChange={(e) => setNumeroAmostra(e.target.value)}
                                            onBlur={() => handleFieldBlur("numeroAmostra")}
                                            placeholder="Digite o número da amostra"
                                            className={`campo-input ${touched.numeroAmostra && errors.numeroAmostra ? "input-error" : ""}`}
                                            aria-describedby="numero-desc numero-error"
                                            aria-invalid={touched.numeroAmostra && errors.numeroAmostra ? "true" : "false"}
                                            required
                                        />
                                    </div>
                                    <div id="numero-desc" className="sr-only">
                                        Número de identificação da amostra de café
                                    </div>
                                    {touched.numeroAmostra && errors.numeroAmostra && (
                                        <div id="numero-error" className="field-error" role="alert">
                                            <AlertCircle size={14} aria-hidden="true" />
                                            {errors.numeroAmostra}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Seção: Classificação Física */}
                        <section className="cob-section" aria-labelledby="classificacao-title">
                            <h2 id="classificacao-title" className="section-title">
                                <Scale className="section-icon" aria-hidden="true" size={20} />
                                Classificação Física do Café
                            </h2>

                            <div className="defeitos-header">
                                <button
                                    type="button"
                                    className="toggle-details-button"
                                    onClick={() => setShowDefeitosDetails(!showDefeitosDetails)}
                                    aria-expanded={showDefeitosDetails}
                                    aria-controls="defeitos-details"
                                    aria-describedby="toggle-desc"
                                >
                                    {showDefeitosDetails ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                    {showDefeitosDetails ? "Ocultar detalhes" : "Mostrar detalhes dos defeitos"}
                                </button>
                                <div id="toggle-desc" className="sr-only">
                                    Clique para mostrar ou ocultar informações detalhadas sobre cada tipo de defeito
                                </div>
                            </div>

                            {showDefeitosDetails && (
                                <div
                                    id="defeitos-details"
                                    className="defeitos-info"
                                    role="region"
                                    aria-label="Informações sobre defeitos"
                                >
                                    <p className="info-text">
                                        <strong>Como usar:</strong> Digite a quantidade encontrada de cada defeito. O sistema calculará
                                        automaticamente a equivalência baseada na tabela COB.
                                    </p>
                                </div>
                            )}

                            <div className="defeitos-container" role="group" aria-labelledby="classificacao-title">
                                {Object.entries(tabelaDefeitos).map(([defeito, info]) => (
                                    <div key={defeito} className="defeito-item">
                                        <label htmlFor={`defeito-${defeito}`} className="defeito-label">
                                            {defeito}:
                                            {showDefeitosDetails && (
                                                <span className="defeito-info">
                                                    (Cada {info.quantidade} = {info.equivalencia} equiv.)
                                                </span>
                                            )}
                                        </label>
                                        <div className="defeito-inputs">
                                            <input
                                                id={`defeito-${defeito}`}
                                                type="number"
                                                min="0"
                                                value={defeitos[defeito] || ""}
                                                onChange={(e) => handleDefeitoChange(defeito, Number.parseInt(e.target.value) || 0)}
                                                className="defeito-quantidade"
                                                aria-describedby={`equiv-${defeito}`}
                                                placeholder="0"
                                            />
                                            <div id={`equiv-${defeito}`} className="defeito-equivalencia" aria-live="polite">
                                                Equiv: <span>{equivalencias[defeito] || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="totais-container" role="region" aria-labelledby="totais-title">
                                <h3 id="totais-title" className="sr-only">
                                    Totais da classificação
                                </h3>
                                <div className="total-item">
                                    <label htmlFor="total-defeitos" className="total-label">
                                        Total de Defeitos:
                                    </label>
                                    <input
                                        id="total-defeitos"
                                        type="text"
                                        readOnly
                                        value={totalDefeitos}
                                        className="total-input"
                                        aria-describedby="total-defeitos-desc"
                                    />
                                    <div id="total-defeitos-desc" className="sr-only">
                                        Soma total de todos os defeitos encontrados
                                    </div>
                                </div>
                                <div className="total-item">
                                    <label htmlFor="total-equivalencia" className="total-label">
                                        Total da Equivalência:
                                    </label>
                                    <input
                                        id="total-equivalencia"
                                        type="text"
                                        readOnly
                                        value={equivalenciaTotal}
                                        className="total-input"
                                        aria-describedby="total-equiv-desc"
                                        aria-live="polite"
                                    />
                                    <div id="total-equiv-desc" className="sr-only">
                                        Equivalência total calculada baseada na tabela COB
                                    </div>
                                </div>
                                <div className="total-item">
                                    <label htmlFor="tipo-cafe" className="total-label">
                                        Tipo do Café:
                                    </label>
                                    <input
                                        id="tipo-cafe"
                                        type="text"
                                        readOnly
                                        value={tipo}
                                        className="total-input tipo-resultado"
                                        aria-describedby="tipo-desc"
                                        aria-live="polite"
                                    />
                                    <div id="tipo-desc" className="sr-only">
                                        Classificação automática baseada no total de equivalências
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Seção: Categoria */}
                        <section className="cob-section" aria-labelledby="categoria-title">
                            <h2 id="categoria-title" className="section-title">
                                <Coffee className="section-icon" aria-hidden="true" size={20} />
                                Categoria
                            </h2>
                            <div className="categoria-grid">
                                <div className="categoria-card">
                                    <h3 className="categoria-card-title">Subcategoria % Peneira</h3>
                                    <fieldset className="checkbox-group" aria-labelledby="peneira-legend">
                                        <legend id="peneira-legend" className="sr-only">
                                            Selecione as subcategorias de peneira aplicáveis
                                        </legend>
                                        {["15 AC", "16 AC", "17 AC", "18 AC", "19", "Bica Corrida"].map((item) => (
                                            <label key={item} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    value={item}
                                                    checked={peneiraSubcategoria.includes(item)}
                                                    onChange={handlePeneiraChange}
                                                    className="checkbox-input"
                                                />
                                                <span className="checkbox-text">{item}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="categoria-card">
                                    <h3 className="categoria-card-title">Chato</h3>
                                    <fieldset className="radio-group" aria-labelledby="chato-legend">
                                        <legend id="chato-legend" className="sr-only">
                                            Selecione o tamanho do café tipo Chato
                                        </legend>
                                        {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                                            <label key={`chato-${tamanho}`} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="tipoCafeChato"
                                                    value={tamanho}
                                                    checked={tipoCafe.grupo === "CHATO" && tipoCafe.tamanho === tamanho}
                                                    onChange={() => setTipoCafe({ grupo: "CHATO", tamanho })}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{tamanho}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="categoria-card">
                                    <h3 className="categoria-card-title">Moca</h3>
                                    <fieldset className="radio-group" aria-labelledby="moca-legend">
                                        <legend id="moca-legend" className="sr-only">
                                            Selecione o tamanho do café tipo Moca
                                        </legend>
                                        {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                                            <label key={`moca-${tamanho}`} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="tipoCafeMoca"
                                                    value={tamanho}
                                                    checked={tipoCafe.grupo === "MOCA" && tipoCafe.tamanho === tamanho}
                                                    onChange={() => setTipoCafe({ grupo: "MOCA", tamanho })}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{tamanho}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="categoria-card">
                                    <h3 className="categoria-card-title">Grupo I: Arábica</h3>
                                    <fieldset className="radio-group" aria-labelledby="arabica-legend">
                                        <legend id="arabica-legend" className="sr-only">
                                            Selecione a classificação para café Arábica
                                        </legend>
                                        {["Estritamente Mole", "Mole", "Apenas Mole", "Duro", "Riado", "Rio", "Rio Zona"].map((opcao) => (
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="subClassificacaoArabica"
                                                    value={opcao}
                                                    checked={grupoBebida === "ARABICA" && subClassificacaoBebida === opcao}
                                                    onChange={() => {
                                                        setGrupoBebida("ARABICA")
                                                        setSubClassificacaoBebida(opcao)
                                                    }}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="categoria-card">
                                    <h3 className="categoria-card-title">Grupo II: Robusta</h3>
                                    <fieldset className="radio-group" aria-labelledby="robusta-legend">
                                        <legend id="robusta-legend" className="sr-only">
                                            Selecione a classificação para café Robusta
                                        </legend>
                                        {["Excelente", "Regular", "Boa", "Anormal"].map((opcao) => (
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="subClassificacaoRobusta"
                                                    value={opcao}
                                                    checked={grupoBebida === "ROBUSTA" && subClassificacaoBebida === opcao}
                                                    onChange={() => {
                                                        setGrupoBebida("ROBUSTA")
                                                        setSubClassificacaoBebida(opcao)
                                                    }}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="categoria-card">
                                    <h3 className="categoria-card-title">Classe</h3>
                                    <fieldset className="checkbox-group" aria-labelledby="classe-legend">
                                        <legend id="classe-legend" className="sr-only">
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
                                            <label key={item} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    value={item}
                                                    checked={classeBebida.includes(item)}
                                                    onChange={handleClasseChange}
                                                    className="checkbox-input"
                                                />
                                                <span className="checkbox-text">{item}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>
                            </div>
                        </section>

                        {/* Seção: Conclusão */}
                        <section className="cob-section" aria-labelledby="conclusao-title">
                            <h2 id="conclusao-title" className="section-title">
                                <FileCheck className="section-icon" aria-hidden="true" size={20} />
                                Conclusão
                            </h2>
                            <div className="campos-form">
                                <div className="campo-form">
                                    <label htmlFor="umidade" className="campo-label">
                                        Umidade (%):
                                    </label>
                                    <div className="input-wrapper">
                                        <Droplets className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="umidade"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={umidade}
                                            onChange={(e) => setUmidade(e.target.value)}
                                            onBlur={() => handleFieldBlur("umidade")}
                                            placeholder="Digite a umidade"
                                            className={`campo-input ${touched.umidade && errors.umidade ? "input-error" : ""}`}
                                            aria-describedby="umidade-desc umidade-error"
                                            aria-invalid={touched.umidade && errors.umidade ? "true" : "false"}
                                        />
                                    </div>
                                    <div id="umidade-desc" className="sr-only">
                                        Percentual de umidade do café, valor entre 0 e 100
                                    </div>
                                    {touched.umidade && errors.umidade && (
                                        <div id="umidade-error" className="field-error" role="alert">
                                            <AlertCircle size={14} aria-hidden="true" />
                                            {errors.umidade}
                                        </div>
                                    )}
                                </div>

                                <div className="campo-form">
                                    <label htmlFor="aparelho" className="campo-label">
                                        Aparelho:
                                    </label>
                                    <div className="input-wrapper">
                                        <Settings className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="aparelho"
                                            type="text"
                                            value={aparelho}
                                            onChange={(e) => setAparelho(e.target.value)}
                                            placeholder="Informe o aparelho utilizado"
                                            className="campo-input"
                                            aria-describedby="aparelho-desc"
                                        />
                                    </div>
                                    <div id="aparelho-desc" className="sr-only">
                                        Equipamento utilizado para medição da umidade
                                    </div>
                                </div>

                                <div className="campo-form">
                                    <label htmlFor="subcategoria" className="campo-label">
                                        Subcategoria:
                                    </label>
                                    <div className="input-wrapper">
                                        <Coffee className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="subcategoria"
                                            type="text"
                                            value={subcategoria}
                                            onChange={(e) => setSubcategoria(e.target.value)}
                                            placeholder="Preencha a subcategoria"
                                            className="campo-input"
                                            aria-describedby="subcategoria-desc"
                                        />
                                    </div>
                                    <div id="subcategoria-desc" className="sr-only">
                                        Subcategoria específica do café avaliado
                                    </div>
                                </div>

                                <div className="campo-form">
                                    <label htmlFor="tipo-conclusao" className="campo-label">
                                        Tipo:
                                    </label>
                                    <div className="input-wrapper">
                                        <Scale className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="tipo-conclusao"
                                            type="text"
                                            value={tipo}
                                            onChange={(e) => setTipo(e.target.value)}
                                            placeholder="Tipo do café"
                                            className="campo-input"
                                            aria-describedby="tipo-conclusao-desc"
                                        />
                                    </div>
                                    <div id="tipo-conclusao-desc" className="sr-only">
                                        Tipo final do café baseado na classificação
                                    </div>
                                </div>

                                <div className="campo-form">
                                    <label htmlFor="posto-servico" className="campo-label">
                                        Posto de Serviço:
                                    </label>
                                    <div className="input-wrapper">
                                        <Building className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="posto-servico"
                                            type="text"
                                            value={postoServico}
                                            onChange={(e) => setPostoServico(e.target.value)}
                                            placeholder="Informe o posto de serviço"
                                            className="campo-input"
                                            aria-describedby="posto-desc"
                                        />
                                    </div>
                                    <div id="posto-desc" className="sr-only">
                                        Local ou posto de serviço onde foi realizada a avaliação
                                    </div>
                                </div>

                                <div className="campo-form">
                                    <label htmlFor="classificador-mapa" className="campo-label">
                                        Classificador/Reg. MAPA:
                                    </label>
                                    <div className="input-wrapper">
                                        <User className="input-icon" aria-hidden="true" size={18} />
                                        <input
                                            id="classificador-mapa"
                                            type="text"
                                            value={classificadorMapa}
                                            onChange={(e) => setClassificadorMapa(e.target.value)}
                                            placeholder="Informe o registro MAPA"
                                            className="campo-input"
                                            aria-describedby="mapa-desc"
                                        />
                                    </div>
                                    <div id="mapa-desc" className="sr-only">
                                        Número de registro do classificador no Ministério da Agricultura
                                    </div>
                                </div>
                            </div>

                            <div className="campo-form observacoes-campo">
                                <label htmlFor="observacoes" className="campo-label">
                                    Observações:
                                </label>
                                <div className="textarea-wrapper">
                                    <FileText className="textarea-icon" aria-hidden="true" size={18} />
                                    <textarea
                                        id="observacoes"
                                        value={observacoes}
                                        onChange={(e) => setObservacoes(e.target.value)}
                                        placeholder="Digite observações adicionais sobre a avaliação..."
                                        className="observacoes-textarea"
                                        rows="4"
                                        aria-describedby="observacoes-desc"
                                    />
                                </div>
                                <div id="observacoes-desc" className="sr-only">
                                    Campo para observações gerais sobre a avaliação realizada
                                </div>
                            </div>
                        </section>

                        {/* Seção: Laudo de Classificação */}
                        <section className="cob-section" aria-labelledby="laudo-title">
                            <h2 id="laudo-title" className="section-title">
                                <FileCheck className="section-icon" aria-hidden="true" size={20} />
                                Laudo de Classificação
                            </h2>
                            <div className="laudo-grid">
                                <div className="laudo-card">
                                    <h3 className="laudo-card-title">Preparo</h3>
                                    <fieldset className="radio-group" aria-labelledby="preparo-legend">
                                        <legend id="preparo-legend" className="sr-only">
                                            Selecione o método de preparo do café
                                        </legend>
                                        {["Via Seca", "Via Úmida"].map((opcao) => (
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="preparo"
                                                    value={opcao}
                                                    checked={peloPreparo === opcao}
                                                    onChange={() => setPeloPreparo(opcao)}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="laudo-card">
                                    <h3 className="laudo-card-title">Seca</h3>
                                    <fieldset className="radio-group" aria-labelledby="seca-legend">
                                        <legend id="seca-legend" className="sr-only">
                                            Avalie a qualidade da secagem do café
                                        </legend>
                                        {["Seca Boa", "Seca Regular", "Seca Má"].map((opcao) => (
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="seca"
                                                    value={opcao}
                                                    checked={pelaSeca === opcao}
                                                    onChange={() => setPelaSeca(opcao)}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="laudo-card">
                                    <h3 className="laudo-card-title">Pelo Aspecto</h3>
                                    <fieldset className="radio-group" aria-labelledby="aspecto-legend">
                                        <legend id="aspecto-legend" className="sr-only">
                                            Avalie o aspecto visual geral do café
                                        </legend>
                                        {["Bom", "Regular", "Mau"].map((opcao) => (
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="aspecto"
                                                    value={opcao}
                                                    checked={peloAspecto === opcao}
                                                    onChange={() => setPeloAspecto(opcao)}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="laudo-card">
                                    <h3 className="laudo-card-title">Torra (Coffea Arábica)</h3>
                                    <fieldset className="radio-group" aria-labelledby="torra-arabica-legend">
                                        <legend id="torra-arabica-legend" className="sr-only">
                                            Avalie a qualidade da torra para café Arábica
                                        </legend>
                                        {["Torração Fina", "Torração Boa", "Torração Regular", "Torração Má"].map((opcao) => (
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="torra-arabica"
                                                    value={opcao}
                                                    checked={torraArabica === opcao}
                                                    onChange={() => {
                                                        setTorraArabica(opcao)
                                                        setTorraCanephora("")
                                                    }}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="laudo-card">
                                    <h3 className="laudo-card-title">Torra (Coffea Canephora)</h3>
                                    <fieldset className="radio-group" aria-labelledby="torra-canephora-legend">
                                        <legend id="torra-canephora-legend" className="sr-only">
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
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="torra-canephora"
                                                    value={opcao}
                                                    checked={torraCanephora === opcao}
                                                    onChange={() => {
                                                        setTorraCanephora(opcao)
                                                        setTorraArabica("")
                                                    }}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>

                                <div className="laudo-card">
                                    <h3 className="laudo-card-title">Teor de Cafeína</h3>
                                    <fieldset className="radio-group" aria-labelledby="cafeina-legend">
                                        <legend id="cafeina-legend" className="sr-only">
                                            Selecione o teor de cafeína do café
                                        </legend>
                                        {["Café", "Café descafeinado"].map((opcao) => (
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="teor-cafeina"
                                                    value={opcao}
                                                    checked={teorCafeina === opcao}
                                                    onChange={() => setTeorCafeina(opcao)}
                                                    className="radio-input"
                                                />
                                                <span className="radio-text">{opcao}</span>
                                            </label>
                                        ))}
                                    </fieldset>
                                </div>
                            </div>
                        </section>

                        {/* Botões de ação */}
                        <div className="action-buttons">
                            <button
                                className="action-button action-button-primary"
                                onClick={handleSalvarAvaliacao}
                                disabled={salvando || hasErrors}
                                aria-describedby="salvar-desc"
                            >
                                {salvando ? (
                                    <>
                                        <Loader2 className="button-icon loading-icon" aria-hidden="true" size={20} />
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="button-icon" aria-hidden="true" size={20} />
                                        <span>Salvar Avaliação</span>
                                    </>
                                )}
                            </button>
                            <div id="salvar-desc" className="sr-only">
                                {salvando
                                    ? "Salvando avaliação no banco de dados"
                                    : hasErrors
                                        ? "Corrija os erros antes de salvar"
                                        : "Clique para salvar a avaliação no sistema"}
                            </div>

                            <button
                                className="action-button action-button-secondary"
                                onClick={handlePrintPDF}
                                disabled={!fornecedorSelecionado || !numeroAmostra}
                                aria-describedby="pdf-desc"
                            >
                                <FileText className="button-icon" aria-hidden="true" size={20} />
                                <span>Gerar PDF</span>
                            </button>
                            <div id="pdf-desc" className="sr-only">
                                Gerar relatório em PDF da avaliação realizada
                            </div>
                        </div>

                        {/* Mensagem de sucesso */}
                        <div ref={successRef} className="sr-only" tabIndex="-1" role="status" aria-live="polite">
                            Avaliação processada com sucesso
                        </div>
                    </div>
                </main>

                {/* Botão de voltar ao topo */}
                {scrollPosition > 300 && (
                    <button
                        className="scroll-to-top"
                        onClick={scrollToTop}
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
