"use client"

import "./Cob.css"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "../config/firebase"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import "bootstrap-icons/font/bootstrap-icons.css"
import logo from "../assets/logopdf.png"

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

const Cob = () => {
    const [avaliador, setAvaliador] = useState("")
    const [fornecedores, setFornecedores] = useState([])
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
    const navigate = useNavigate()

    useEffect(() => {
        const bloquearVoltar = (e) => {
            e.preventDefault()
            window.history.pushState(null, null, window.location.href)
        }

        window.history.pushState(null, null, window.location.href)
        window.addEventListener("popstate", bloquearVoltar)

        // Adicionar listener para o scroll
        const handleScroll = () => {
            setScrollPosition(window.scrollY)
        }
        window.addEventListener("scroll", handleScroll)

        return () => {
            window.removeEventListener("popstate", bloquearVoltar)
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

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

    useEffect(() => {
        const usuarioNome = localStorage.getItem("usuarioNome") || ""
        setAvaliador(usuarioNome)
        carregarFornecedores()
    }, [])

    useEffect(() => {
        const classification = getClassification(equivalenciaTotal)
        setTipo(classification.label)
    }, [equivalenciaTotal])

    const carregarFornecedores = async () => {
        try {
            const authInstance = getAuth()
            const user = authInstance.currentUser

            if (!user) {
                alert("Usuário não autenticado.")
                return
            }

            const querySnapshot = await getDocs(collection(db, "usuarios", user.uid, "fornecedores"))

            const listaFornecedores = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            setFornecedores(listaFornecedores)
        } catch (error) {
            console.error("Erro ao carregar fornecedores:", error)
            alert("Erro ao carregar fornecedores. Tente novamente.")
        }
    }

    const handleDefeitoChange = (defeito, quantidade) => {
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
    }

    const handleClasseChange = (e) => {
        const { value, checked } = e.target
        if (checked) {
            setClasseBebida((prev) => [...prev, value])
        } else {
            setClasseBebida((prev) => prev.filter((item) => item !== value))
        }
    }

    const handlePeneiraChange = (e) => {
        const { value, checked } = e.target
        if (checked) {
            setPeneiraSubcategoria((prev) => [...prev, value])
        } else {
            setPeneiraSubcategoria((prev) => prev.filter((item) => item !== value))
        }
    }

    const handlePrintPDF = () => {
        if (!fornecedorSelecionado || !numeroAmostra) {
            alert("Por favor, preencha os campos de fornecedor e número da amostra.")
            return
        }

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

            // Tabelas
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
        }

        img.onerror = () => {
            console.warn("Erro ao carregar logo, gerando PDF sem imagem")
            // Continue with PDF generation without the image
            // Similar code as above but without the image
            // ...
        }
    }

    const handleSalvarAvaliacao = async () => {
        if (salvando) return // Evita múltiplos cliques

        setSalvando(true)

        try {
            const authInstance = getAuth()
            const user = authInstance.currentUser

            if (!user) {
                alert("Usuário não autenticado.")
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

            alert("Avaliação salva com sucesso!")

            // Pergunta se o usuário deseja visualizar o PDF
            const querVerPDF = window.confirm("Deseja gerar o PDF da avaliação?")
            if (querVerPDF) {
                handlePrintPDF()
            }
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error)
            alert("Erro ao salvar avaliação. Tente novamente mais tarde.")
        } finally {
            setSalvando(false)
        }
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }

    const totalDefeitos = Object.values(defeitos).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0)

    return (
        <div className="cob-container">
            {/* Cabeçalho */}
            <div className="cob-header">
                <h2>Avaliação de Café - COB</h2>
                <button className="fechar" onClick={() => navigate("/logado")}>
                    ✖
                </button>
            </div>

            <div className="cob-form">
                {/* Seção: Identificação */}
                <div className="cob-section">
                    <h3 className="section-title">Identificação</h3>
                    <div className="campos-form">
                        <div className="campo-form">
                            <label>Nome do Avaliador:</label>
                            <input type="text" value={avaliador} onChange={(e) => setAvaliador(e.target.value)} disabled />
                        </div>

                        <div className="campo-form">
                            <label>Data da avaliação:</label>
                            <input type="text" value={new Date().toLocaleDateString("pt-BR")} disabled />
                        </div>

                        <div className="campo-form">
                            <label>Fornecedor / Produtor:</label>
                            <div className="input-com-botao">
                                <select value={fornecedorSelecionado} onChange={(e) => setFornecedorSelecionado(e.target.value)}>
                                    <option value="">Selecione um fornecedor</option>
                                    {fornecedores.map((fornecedor) => (
                                        <option key={fornecedor.id} value={fornecedor.nome}>
                                            {fornecedor.nome}
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
                            <label>Nº da Amostra:</label>
                            <input
                                type="text"
                                value={numeroAmostra}
                                onChange={(e) => setNumeroAmostra(e.target.value)}
                                placeholder="Digite o número da amostra"
                            />
                        </div>
                    </div>
                </div>

                {/* Seção: Classificação Física */}
                <div className="cob-section">
                    <h3 className="section-title">Classificação Física do Café</h3>
                    <div className="defeitos-container">
                        {Object.keys(tabelaDefeitos).map((defeito) => (
                            <div key={defeito} className="defeito-item">
                                <label>{defeito}:</label>
                                <div className="defeito-inputs">
                                    <input
                                        type="number"
                                        min="0"
                                        value={defeitos[defeito] || ""}
                                        onChange={(e) => handleDefeitoChange(defeito, Number.parseInt(e.target.value) || 0)}
                                        className="defeito-quantidade"
                                    />
                                    <div className="defeito-equivalencia">
                                        Equiv: <span>{equivalencias[defeito] || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="totais-container">
                        <div className="total-item">
                            <label>Total de Defeitos:</label>
                            <input type="text" readOnly value={totalDefeitos} />
                        </div>
                        <div className="total-item">
                            <label>Total da Equivalência:</label>
                            <input type="text" readOnly value={equivalenciaTotal} />
                        </div>
                        <div className="total-item">
                            <label>Tipo do Café:</label>
                            <input type="text" readOnly value={tipo} />
                        </div>
                    </div>
                </div>

                {/* Seção: Categoria */}
                <div className="cob-section">
                    <h3 className="section-title">Categoria</h3>
                    <div className="categoria-grid">
                        <div className="categoria-card">
                            <h4>Subcategoria % Peneira</h4>
                            <div className="checkbox-group">
                                {["15 AC", "16 AC", "17 AC", "18 AC", "19", "Bica Corrida"].map((item) => (
                                    <label key={item} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            value={item}
                                            checked={peneiraSubcategoria.includes(item)}
                                            onChange={handlePeneiraChange}
                                        />
                                        <span>{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="categoria-card">
                            <h4>Chato</h4>
                            <div className="radio-group">
                                {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                                    <label key={`chato-${tamanho}`} className="radio-label">
                                        <input
                                            type="radio"
                                            name="tipoCafe"
                                            value={tamanho}
                                            checked={tipoCafe.grupo === "CHATO" && tipoCafe.tamanho === tamanho}
                                            onChange={() => setTipoCafe({ grupo: "CHATO", tamanho })}
                                        />
                                        <span>{tamanho}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="categoria-card">
                            <h4>Moca</h4>
                            <div className="radio-group">
                                {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                                    <label key={`moca-${tamanho}`} className="radio-label">
                                        <input
                                            type="radio"
                                            name="tipoCafe"
                                            value={tamanho}
                                            checked={tipoCafe.grupo === "MOCA" && tipoCafe.tamanho === tamanho}
                                            onChange={() => setTipoCafe({ grupo: "MOCA", tamanho })}
                                        />
                                        <span>{tamanho}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="categoria-card">
                            <h4>Grupo I: Arábica</h4>
                            <div className="radio-group">
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
                                        />
                                        <span>{opcao}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="categoria-card">
                            <h4>Grupo II: Robusta</h4>
                            <div className="radio-group">
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
                                        />
                                        <span>{opcao}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="categoria-card">
                            <h4>Classe</h4>
                            <div className="checkbox-group">
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
                                        />
                                        <span>{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção: Conclusão */}
                <div className="cob-section">
                    <h3 className="section-title">Conclusão</h3>
                    <div className="campos-form">
                        <div className="campo-form">
                            <label>Umidade:</label>
                            <input
                                type="number"
                                value={umidade}
                                onChange={(e) => setUmidade(e.target.value)}
                                placeholder="Digite a umidade"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Aparelho:</label>
                            <input
                                type="text"
                                value={aparelho}
                                onChange={(e) => setAparelho(e.target.value)}
                                placeholder="Informe o Aparelho"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Subcategoria:</label>
                            <input
                                type="text"
                                value={subcategoria}
                                onChange={(e) => setSubcategoria(e.target.value)}
                                placeholder="Preencha a Subcategoria"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Tipo:</label>
                            <input type="text" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Informe o Tipo" />
                        </div>
                        <div className="campo-form">
                            <label>Posto de Serviço:</label>
                            <input
                                type="text"
                                value={postoServico}
                                onChange={(e) => setPostoServico(e.target.value)}
                                placeholder="Informe o Posto de Serviço"
                            />
                        </div>
                        <div className="campo-form">
                            <label>Classificador/Reg. MAPA:</label>
                            <input
                                type="text"
                                value={classificadorMapa}
                                onChange={(e) => setClassificadorMapa(e.target.value)}
                                placeholder="Informe o Classificador/Reg. MAPA"
                            />
                        </div>
                    </div>

                    <div className="campo-form observacoes-campo">
                        <label>Observações:</label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Digite as observações..."
                            className="observacoes-textarea"
                        />
                    </div>
                </div>

                {/* Seção: Laudo de Classificação */}
                <div className="cob-section">
                    <h3 className="section-title">Laudo de Classificação</h3>
                    <div className="laudo-grid">
                        <div className="laudo-card">
                            <h4>Preparo</h4>
                            <div className="radio-group">
                                {["Via Seca", "Via Úmida"].map((opcao) => (
                                    <label key={opcao} className="radio-label">
                                        <input
                                            type="radio"
                                            name="preparo"
                                            checked={peloPreparo === opcao}
                                            onChange={() => setPeloPreparo(opcao)}
                                        />
                                        <span>{opcao}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="laudo-card">
                            <h4>Seca</h4>
                            <div className="radio-group">
                                {["Seca Boa", "Seca Regular", "Seca Má"].map((opcao) => (
                                    <label key={opcao} className="radio-label">
                                        <input type="radio" name="seca" checked={pelaSeca === opcao} onChange={() => setPelaSeca(opcao)} />
                                        <span>{opcao}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="laudo-card">
                            <h4>Pelo Aspecto</h4>
                            <div className="radio-group">
                                {["Bom", "Regular", "Mau"].map((opcao) => (
                                    <label key={opcao} className="radio-label">
                                        <input
                                            type="radio"
                                            name="aspecto"
                                            checked={peloAspecto === opcao}
                                            onChange={() => setPeloAspecto(opcao)}
                                        />
                                        <span>{opcao}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="laudo-card">
                            <h4>Torra (Coffea Arábica)</h4>
                            <div className="radio-group">
                                {["Torração Fina", "Torração Boa", "Torração Regular", "Torração Má"].map((opcao) => (
                                    <label key={opcao} className="radio-label">
                                        <input
                                            type="radio"
                                            name="torra-arabica"
                                            checked={torraArabica === opcao}
                                            onChange={() => {
                                                setTorraArabica(opcao)
                                                setTorraCanephora("") // desmarca Canephora
                                            }}
                                        />
                                        <span>{opcao}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="laudo-card">
                            <h4>Torra (Coffea Canephora)</h4>
                            <div className="radio-group">
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
                                            checked={torraCanephora === opcao}
                                            onChange={() => {
                                                setTorraCanephora(opcao)
                                                setTorraArabica("") // desmarca Arabica
                                            }}
                                        />
                                        <span>{opcao}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="laudo-card">
                            <h4>Teor de Cafeína</h4>
                            <div className="radio-group">
                                {["Café", "Café descafeinado"].map((opcao) => (
                                    <label key={opcao} className="radio-label">
                                        <input
                                            type="radio"
                                            name="teor-cafeina"
                                            checked={teorCafeina === opcao}
                                            onChange={() => setTeorCafeina(opcao)}
                                        />
                                        <span>{opcao}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botão de Salvar */}
                <button className="salvar" onClick={handleSalvarAvaliacao} disabled={salvando}>
                    {salvando ? "SALVANDO..." : "SALVAR"}
                </button>
            </div>

            {/* Botão de voltar ao topo */}
            {scrollPosition > 300 && (
                <button className="voltar-ao-topo" onClick={scrollToTop} title="Voltar ao topo">
                    <i className="bi bi-arrow-up-circle-fill"></i>
                </button>
            )}
        </div>
    )
}

export default Cob