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
    const navigate = useNavigate()

    useEffect(() => {
        const bloquearVoltar = (e) => {
            e.preventDefault()
            window.history.pushState(null, null, window.location.href)
        }

        window.history.pushState(null, null, window.location.href)
        window.addEventListener("popstate", bloquearVoltar)

        return () => {
            window.removeEventListener("popstate", bloquearVoltar)
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

    // Função para gerar PDF sem tentar abrir ou salvar automaticamente
    const gerarPDFData = () => {
        return new Promise((resolve, reject) => {
            try {
                const docPDF = new jsPDF({ unit: "mm", format: "a4" })
                const img = new Image()
                img.src = logo
                img.crossOrigin = "anonymous"

                const gerarPDF = () => {
                    try {
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

                        try {
                            if (img.complete && img.naturalWidth > 0) {
                                docPDF.addImage(img, "PNG", startX, boxY, logoWidth, logoHeight)
                            }
                        } catch (err) {
                            console.warn("Logo não carregado, gerando sem imagem.")
                        }

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
                                    [
                                        "Total de Defeitos",
                                        Object.values(defeitos || {}).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0),
                                    ],
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

                        // Retorna o PDF como string base64
                        const pdfBase64 = docPDF.output("datauristring")
                        resolve(pdfBase64)
                    } catch (error) {
                        console.error("Erro ao gerar PDF:", error)
                        reject(error)
                    }
                }

                // Se a imagem já estiver carregada
                if (img.complete) {
                    gerarPDF()
                } else {
                    // Se a imagem ainda não estiver carregada
                    img.onload = gerarPDF
                    img.onerror = () => {
                        console.warn("Erro ao carregar logo, gerando PDF sem imagem")
                        gerarPDF()
                    }

                    // Timeout para caso a imagem demore muito para carregar
                    setTimeout(() => {
                        if (!img.complete) {
                            console.warn("Timeout ao carregar logo, gerando PDF sem imagem")
                            gerarPDF()
                        }
                    }, 3000)
                }
            } catch (error) {
                console.error("Erro ao iniciar geração do PDF:", error)
                reject(error)
            }
        })
    }

    // Função para mostrar o PDF em uma nova janela
    const mostrarPDF = async () => {
        try {
            const pdfData = await gerarPDFData()

            // Cria uma nova janela com o PDF incorporado
            const newWindow = window.open("", "_blank")
            if (newWindow) {
                newWindow.document.write(`
                    <html>
                        <head>
                            <title>Laudo COB</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                                body { margin: 0; padding: 0; height: 100vh; display: flex; flex-direction: column; }
                                .controls { padding: 10px; background: #f0f0f0; display: flex; justify-content: center; }
                                .controls button { margin: 0 10px; padding: 8px 16px; cursor: pointer; }
                                iframe { flex: 1; width: 100%; border: none; }
                            </style>
                        </head>
                        <body>
                            <div class="controls">
                                <button onclick="window.print()">Imprimir</button>
                                <button onclick="window.close()">Fechar</button>
                            </div>
                            <iframe src="${pdfData}" width="100%" height="100%"></iframe>
                        </body>
                    </html>
                `)
            } else {
                alert("Não foi possível abrir uma nova janela. Verifique se o bloqueador de pop-ups está ativado.")
            }
        } catch (error) {
            console.error("Erro ao mostrar PDF:", error)
            alert("Erro ao gerar o PDF. Por favor, tente novamente mais tarde.")
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
            const querVerPDF = window.confirm("Deseja visualizar o PDF da avaliação?")
            if (querVerPDF) {
                await mostrarPDF()
            }
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error)
            alert("Erro ao salvar avaliação. Tente novamente mais tarde.")
        } finally {
            setSalvando(false)
        }
    }

    const totalDefeitos = Object.values(defeitos).reduce((acc, val) => acc + (isNaN(val) ? 0 : val), 0)

    return (
        <div id="avaliacao-completa">
            <div className="cob-container">
                {/* Cabeçalho */}
                <header className="cob-header">
                    <h2 className="titulo-cabecalho">AVALIAÇÃO DE CAFÉ - COB</h2>
                    <button className="fechar" onClick={() => navigate("/logado", { replace: true })} aria-label="Fechar">
                        ✖
                    </button>
                </header>

                {/* Seção: Identificação */}
                <section className="section-identificacao">
                    <div className="cob-block">
                        <h3>Identificação</h3>
                        <div className="grid-identificacao">
                            <div className="campo">
                                <label htmlFor="avaliador">Nome do Avaliador:</label>
                                <input id="avaliador" type="text" value={avaliador} disabled />
                            </div>
                            <div className="campo">
                                <label htmlFor="data">Data da avaliação:</label>
                                <input id="data" type="text" value={new Date().toLocaleDateString("pt-BR")} disabled />
                            </div>
                            <div className="campo">
                                <label htmlFor="fornecedor">Fornecedor / Produtor:</label>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                                    <select
                                        id="fornecedor"
                                        value={fornecedorSelecionado}
                                        onChange={(e) => setFornecedorSelecionado(e.target.value)}
                                        style={{ flex: "1", minWidth: "150px" }}
                                    >
                                        <option value="">Selecione um fornecedor</option>
                                        {fornecedores.map((fornecedor) => (
                                            <option key={fornecedor.id} value={fornecedor.nome}>
                                                {fornecedor.nome}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/fornecedores")}
                                        className="botao-icone"
                                        style={{ whiteSpace: "nowrap" }}
                                    >
                                        <i className="bi bi-folder-plus"></i>
                                        Novo
                                    </button>
                                </div>
                            </div>

                            <div className="campo">
                                <label htmlFor="amostra">Nº da Amostra:</label>
                                <input
                                    id="amostra"
                                    type="text"
                                    value={numeroAmostra}
                                    onChange={(e) => setNumeroAmostra(e.target.value)}
                                    placeholder="Digite o número da amostra"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Seção: Classificação Física */}
                <section className="section-classificacao">
                    <div className="cob-block">
                        <h3>Classificação Física do Café</h3>
                        <div className="sub-block">
                            <section className="defeitos-grid">
                                {Object.keys(tabelaDefeitos).map((defeito) => (
                                    <div key={defeito} className="defeitos-checkbox">
                                        <label htmlFor={`defeito-${defeito}`}>{defeito}:</label>
                                        <input
                                            id={`defeito-${defeito}`}
                                            className="defeitos-input"
                                            type="number"
                                            min="0"
                                            value={defeitos[defeito] || ""}
                                            onChange={(e) => handleDefeitoChange(defeito, Number.parseInt(e.target.value) || 0)}
                                        />
                                        <span>Equivalência: {equivalencias[defeito] || 0}</span>
                                    </div>
                                ))}
                            </section>
                            <div className="total">
                                <div>
                                    <label htmlFor="total-defeitos">Total de Defeitos:</label>
                                    <input id="total-defeitos" type="number" readOnly value={totalDefeitos} />
                                </div>
                                <div>
                                    <label htmlFor="total-equivalencia">Total da Equivalência:</label>
                                    <input id="total-equivalencia" type="number" readOnly value={equivalenciaTotal} />
                                </div>
                                <div>
                                    <label htmlFor="tipo-cafe">Tipo do Café:</label>
                                    <input id="tipo-cafe" type="text" readOnly value={tipo} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Seção: Categoria */}
                <section className="section-categoria">
                    <div className="cob-block">
                        <h3>Categoria</h3>
                        <div className="categoria-topo"></div>
                        <div className="tabela-2x3">
                            <div className="celula">
                                <h5>SUBCATEGORIA % PENEIRA</h5>
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
                            <div className="celula">
                                <h5>CHATO</h5>
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
                            <div className="celula">
                                <h5>MOCA</h5>
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
                            <div className="celula">
                                <h5>GRUPO I: ARABICA</h5>
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
                            <div className="celula">
                                <h5>GRUPO II: ROBUSTA</h5>
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
                            <div className="celula">
                                <h5>CLASSE</h5>
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
                </section>

                {/* Seção: Conclusão e Laudo */}
                <section className="section-conclusao">
                    <div className="cob-block">
                        <h3>Conclusão</h3>
                        <div className="grid-conclusao">
                            <div className="campo">
                                <label htmlFor="umidade">Umidade:</label>
                                <input
                                    id="umidade"
                                    type="number"
                                    value={umidade}
                                    onChange={(e) => setUmidade(e.target.value)}
                                    placeholder="Digite a umidade"
                                />
                            </div>
                            <div className="campo">
                                <label htmlFor="aparelho">Aparelho:</label>
                                <input
                                    id="aparelho"
                                    type="text"
                                    value={aparelho}
                                    onChange={(e) => setAparelho(e.target.value)}
                                    placeholder="Informe o Aparelho"
                                />
                            </div>
                            <div className="campo">
                                <label htmlFor="subcategoria">Subcategoria:</label>
                                <input
                                    id="subcategoria"
                                    type="text"
                                    value={subcategoria}
                                    onChange={(e) => setSubcategoria(e.target.value)}
                                    placeholder="Preencha a Subcategoria"
                                />
                            </div>
                            <div className="campo">
                                <label htmlFor="tipo-input">Tipo:</label>
                                <input
                                    id="tipo-input"
                                    type="text"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    placeholder="Informe o Tipo"
                                />
                            </div>
                            <div className="campo">
                                <label htmlFor="posto-servico">Posto de Serviço:</label>
                                <input
                                    id="posto-servico"
                                    type="text"
                                    value={postoServico}
                                    onChange={(e) => setPostoServico(e.target.value)}
                                    placeholder="Informe o Posto de Serviço"
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="classificador-mapa">Classificador/Reg. MAPA:</label>
                                <input
                                    id="classificador-mapa"
                                    type="text"
                                    value={classificadorMapa}
                                    onChange={(e) => setClassificadorMapa(e.target.value)}
                                    placeholder="Informe o Classificador/Reg. MAPA"
                                />
                            </div>
                        </div>
                        <div className="campo campo-observacoes">
                            <label htmlFor="observacoes">Observações:</label>
                            <textarea
                                id="observacoes"
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                placeholder="Digite as observações..."
                                rows="4"
                            />
                        </div>

                        <div className="grupo-laudo">
                            <div className="cob-block">
                                <h3>Laudo de Classificação</h3>
                                <div className="grid-laudo">
                                    <div className="bloco-laudo">
                                        <h5>PREPARO</h5>
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
                                    <div className="bloco-laudo">
                                        <h5>SECA</h5>
                                        {["Seca Boa", "Seca Regular", "Seca Má"].map((opcao) => (
                                            <label key={opcao} className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="seca"
                                                    checked={pelaSeca === opcao}
                                                    onChange={() => setPelaSeca(opcao)}
                                                />
                                                <span>{opcao}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="bloco-laudo">
                                        <h5>PELO ASPECTO</h5>
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
                                    <div className="bloco-laudo">
                                        <h5>TORRA (COFFEA ARÁBICA)</h5>
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

                                    <div className="bloco-laudo">
                                        <h5>TORRA (COFFEA CANEPHORA)</h5>
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

                                    <div className="bloco-laudo">
                                        <h5>TEOR DE CAFEINA</h5>
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
                        <button className="salvar" onClick={handleSalvarAvaliacao} disabled={salvando}>
                            {salvando ? "SALVANDO..." : "SALVAR"}
                        </button>

                    </div>
                </section>
            </div>
        </div>
    )
}

export default Cob