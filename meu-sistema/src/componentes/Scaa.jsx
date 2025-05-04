import "./Scaa.css";
import { getAuth } from "firebase/auth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import GraoCafe from "./GraoCafe";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "bootstrap-icons/font/bootstrap-icons.css";
import logo from "../assets/logopdf.png"; // Adicione no topo do seu arquivo, igual no Scaa




const Scaa = () => {
    const [mostrarPdf, setMostrarPdf] = useState(false);
    const [avaliador, setAvaliador] = useState("");
    const [data, setData] = useState("");
    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState("");
    const [numeroAmostra, setNumeroAmostra] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [torraSelecionada, setTorraSelecionada] = useState("");
    const [mostrarTiposAcidez, setMostrarTiposAcidez] = useState(false);
    const [obsAcidez, setObsAcidez] = useState("");
    const [notasSensorias, setnotasSensoriais] = useState("");
    const [dry, setDry] = useState(2);
    const [breakValue, setBreakValue] = useState(2);
    const [nivelAcidez, setNivelAcidez] = useState(2);
    const [nivelCorpo, setNivelCorpo] = useState(2);
    const [notas, setNotas] = useState({
        AromaFragrancia: 6,
        sabor: 6,
        finalizacao: 6,
        acidez: 6,
        corpo: 6,
        equilibrio: 6,
        avaliacaoPessoal: 6,
        doçura: [false, false, false, false, false],
        uniformidade: [false, false, false, false, false],
        xicaraLimpa: [false, false, false, false, false]
    });
    const [qtdLeve, setQtdLeve] = useState(0);
    const [qtdGrave, setQtdGrave] = useState(0);
    const totalDescontos = qtdLeve * 2 + qtdGrave * 4;
    const navigate = useNavigate();

    useEffect(() => {
        window.history.pushState(null, null, window.location.href);
        const bloquearVoltar = () => {
            window.history.pushState(null, null, window.location.href);
        };
        window.addEventListener("popstate", bloquearVoltar);

        return () => window.removeEventListener("popstate", bloquearVoltar);
    }, []);


    useEffect(() => {
        setData(new Date().toISOString().split("T")[0]);
        carregarAvaliador();
        carregarFornecedores();
    }, []);

    const carregarAvaliador = () => {
        const usuarioNome = localStorage.getItem("usuarioNome");
        if (usuarioNome) {
            setAvaliador(usuarioNome);
        }
    };

    const carregarFornecedores = async () => {
        try {
            const authInstance = getAuth(); // cria instância do auth
            const user = authInstance.currentUser; // pega o usuário logado

            if (!user) {
                alert("Usuário não autenticado.");
                return;
            }

            const querySnapshot = await getDocs(
                collection(db, "usuarios", user.uid, "fornecedores")
            );

            const listaFornecedores = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            setFornecedores(listaFornecedores);
        } catch (error) {
            console.error("Erro ao carregar fornecedores:", error);
            alert("Erro ao carregar fornecedores. Tente novamente.");
        }
    };


    const handleNotaChange = (categoria, valor) => {
        setNotas((prev) => ({ ...prev, [categoria]: parseFloat(valor) }));
    };

    const toggleCheckbox = (atributo, index) => {
        setNotas((prev) => {
            const newArray = [...prev[atributo]];
            newArray[index] = !newArray[index];
            return { ...prev, [atributo]: newArray };
        });
    };

    const calcularPontuacaoXicara = (atributo) => {
        const marcados = notas[atributo].filter((v) => v).length;
        const score = 10 - marcados * 2;
        return score < 0 ? 0 : score;
    };

    const calcularPontuacaoXicaras = () => {
        return (
            calcularPontuacaoXicara("doçura") +
            calcularPontuacaoXicara("uniformidade") +
            calcularPontuacaoXicara("xicaraLimpa")
        );
    };

    const calcularPontuacaoFinal = () => {
        let total = 0;
        Object.keys(notas).forEach((key) => {
            if (!["doçura", "uniformidade", "xicaraLimpa"].includes(key)) {
                total += notas[key];
            }
        });
        total += calcularPontuacaoXicaras();
        total -= qtdLeve * 2;
        total -= qtdGrave * 4;
        return total.toFixed(2);
    };

    const handleSalvarAvaliacao = async () => {
        if (!fornecedorSelecionado || !numeroAmostra || !torraSelecionada) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const authInstance = getAuth(); // 👈 aqui você cria uma instância
        const user = authInstance.currentUser; // 👈 aqui obtém o usuário autenticado

        if (!user) {
            alert("Usuário não autenticado.");
            return;
        }

        const avaliacao = {
            avaliador,
            data,
            fornecedor: fornecedorSelecionado,
            numeroAmostra,
            torra: torraSelecionada,
            observacoes,
            notasSensorias,
            obsAcidez,
            dry,
            breakValue,
            nivelAcidez,
            nivelCorpo,
            notas,
            defeitosLeves: qtdLeve,
            defeitosGraves: qtdGrave,
            pontuacaoFinal: calcularPontuacaoFinal(),
            totalDescontos, // <- adicionado aqui
            userId: user.uid,
            dataCriacao: new Date().toISOString()
        };

        try {
            await addDoc(collection(db, "usuarios", user.uid, "avaliacoes_scaa"), avaliacao);
            alert("Avaliação salva com sucesso!");
            handlePrintPDF();
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error);
            alert("Erro ao salvar avaliação. Tente novamente mais tarde.");
        }
    };


    const handlePrintPDF = () => {
        const docPDF = new jsPDF({ unit: "mm", format: "a4" });
        const img = new Image();
        img.src = logo;

        img.onload = () => {
            const pageWidth = docPDF.internal.pageSize.getWidth();
            const pageHeight = docPDF.internal.pageSize.getHeight();
            const marginX = 20;
            const boxY = 10;
            const logoWidth = 25;
            const logoHeight = 25;
            const spacing = 5;
            const titulo = "Avaliação Sensorial de Café - Método SCAA";
            const tituloWidth = docPDF.getTextWidth(titulo);
            const startX = (pageWidth - (logoWidth + spacing + tituloWidth)) / 2;

            docPDF.addImage(img, "PNG", startX, boxY, logoWidth, logoHeight);
            docPDF.setFont("times", "bold");
            docPDF.setFontSize(14);
            docPDF.text(titulo, startX + logoWidth + spacing, boxY + 16);

            const autoTableOptions = (config) => ({
                ...config,
                theme: "grid",
                margin: { left: marginX, right: marginX },
                startY: docPDF.lastAutoTable ? docPDF.lastAutoTable.finalY + 10 : boxY + logoHeight + 10,
                headStyles: {
                    fillColor: [3, 43, 67],
                    textColor: 255,
                    fontStyle: "bold",
                    font: "times"
                },
                bodyStyles: {
                    font: "times",
                    textColor: 0
                },
                didDrawPage: (data) => {
                    const pageCount = docPDF.internal.getNumberOfPages();
                    docPDF.setFontSize(10);
                    docPDF.setTextColor(150);
                    docPDF.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth - marginX, pageHeight - 10, { align: "right" });
                    docPDF.text(`Laudo Técnico - ${new Date().toLocaleDateString("pt-BR")}`, marginX, pageHeight - 10);
                }
            });

            const corpoNotas = [
                ["Aroma / Fragrância", notas.AromaFragrancia],
                ["Sabor", notas.sabor],
                ["Finalização", notas.finalizacao],
                ["Acidez", notas.acidez]
            ];

            if (obsAcidez) corpoNotas.push(["Tipo de Acidez", obsAcidez]);

            corpoNotas.push(
                ["Corpo", notas.corpo],
                ["Equilíbrio", notas.equilibrio],
                ["Avaliação Pessoal", notas.avaliacaoPessoal]
            );

            const descontos = qtdLeve * 2 + qtdGrave * 4;
            const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"];

            autoTable(docPDF, autoTableOptions({
                head: [["Identificação", "Valor"]],
                body: [
                    ["Avaliador", avaliador || "—"],
                    ["Data", new Date(data).toLocaleDateString("pt-BR")],
                    ["Fornecedor", fornecedorSelecionado || "—"],
                    ["Nº Amostra", numeroAmostra || "—"],
                    ["Torra", torraSelecionada || "—"],
                    [{ content: "Pontuação Final", styles: { fontStyle: "bold" } }, { content: calcularPontuacaoFinal(), styles: { fontStyle: "bold" } }],
                    [{ content: "Notas Sensoriais", styles: { fontStyle: "bold" } }, { content: notasSensorias || "—", styles: { fontStyle: "bold" } }]
                ]
            }));

            autoTable(docPDF, autoTableOptions({
                head: [["Atributo Sensorial", "Nota"]],
                body: corpoNotas
            }));

            autoTable(docPDF, autoTableOptions({
                head: [["Critério", "Valor"]],
                body: [
                    ["Dry", intensidades[dry] || "—"],
                    ["Break", intensidades[breakValue] || "—"],
                    ["Nível de Acidez", intensidades[nivelAcidez] || "—"],
                    ["Nível de Corpo", intensidades[nivelCorpo] || "—"],
                    ["Defeitos Leves", `-${qtdLeve * 2}`],
                    ["Defeitos Graves", `-${qtdGrave * 4}`],
                    ["Total de Pontos Descontados", `-${descontos}`]
                ]
            }));

            autoTable(docPDF, autoTableOptions({
                head: [["Observações", "Conteúdo"]],
                body: [["Observações Gerais", observacoes || "—"]]
            }));

            const assinaturaY = docPDF.lastAutoTable.finalY + 30;
            const linhaLargura = 80;
            const linhaInicioX = (pageWidth - linhaLargura) / 2;

            docPDF.line(linhaInicioX, assinaturaY, linhaInicioX + linhaLargura, assinaturaY);
            docPDF.setFont("times", "normal");
            docPDF.setFontSize(12);
            docPDF.text(`Avaliador: ${avaliador || "—"}`, pageWidth / 2, assinaturaY + 7, { align: "center" });
            docPDF.save(`laudo_scaa_${new Date().toISOString().split("T")[0]}.pdf`);

        };
    };



    const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"];

    return (
        <div className="scaa-container">
            <div className="scaa-header">
                <h2>Avaliação Sensorial de Café - SCAA</h2>
                <button className="fechar" onClick={() => navigate("/logado")}>
                    ✖
                </button>
            </div>

            <div className="pdf-float-container">
                <button
                    className="botao-flutuante-pdf"
                    onClick={() => setMostrarPdf(!mostrarPdf)}
                    title={mostrarPdf ? "Fechar PDF" : "Abrir PF"}
                >
                    📄
                </button>

                {mostrarPdf && (
                    <div className="pdf-janela">
                        <iframe
                            src="/documentos/roda de sabores.pdf"
                            title="Manual SCAA"
                            width="400"
                            height="600"
                        ></iframe>
                    </div>
                )}
            </div>

            <div className="scaa-form">
                <label>Nome do Avaliador:</label>
                <input type="text" value={avaliador} disabled />

                <label>Data:</label>
                <input type="date" value={data} disabled />

                <label>Fornecedor:</label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <select
                        value={fornecedorSelecionado}
                        onChange={(e) => setFornecedorSelecionado(e.target.value)}
                    >
                        <option value="">Selecione um fornecedor</option>
                        {fornecedores.map((f) => (
                            <option key={f.id} value={f.nome}>
                                {f.nome}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => navigate("/fornecedores")}
                        className="botao-icone"
                    >
                        <i className="bi bi-folder-plus"></i>
                        Novo
                    </button>
                </div>


                <label>N° da Amostra:</label>
                <input
                    type="text"
                    value={numeroAmostra}
                    onChange={(e) => setNumeroAmostra(e.target.value)}
                    placeholder="Digite o número da amostra"
                />

                <label>Observações:</label>
                <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione observações..."
                />

                {/* Selecao da Cor da Torra */}
                <div className="torra-container">
                    <h3>Selecione a Cor da Torra:</h3>
                    <div className="torra-options">
                        {[
                            { nome: "Torra Clara", cor: "#a57b70" },
                            { nome: "Torra Média Clara", cor: "#704e44" },
                            { nome: "Torra Média", cor: "#553026" },
                            { nome: "Torra Escura", cor: "#3b1e17" }
                        ].map((torra) => (
                            <div
                                key={torra.nome}
                                className={`torra-option ${torraSelecionada === torra.nome ? "selecionado" : ""}`}
                                onClick={() => setTorraSelecionada(torra.nome)}
                            >
                                <GraoCafe cor={torra.cor} />
                                <span>{torra.nome}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sliders verticais (DRY, BREAK) */}
                <div className="vertical-sliders-container">
                    <div className="vertical-slider-box">
                        <h4>Dry</h4>
                        <div className="slider-row-with-note">
                            <div className="slider-row">
                                <input
                                    type="range"
                                    className="vertical-slider"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={dry}
                                    onChange={(e) => setDry(parseInt(e.target.value))}
                                />
                                <div className="slider-labels">
                                    {intensidades.slice().reverse().map((label, index) => (
                                        <span
                                            key={index}
                                            className={dry === intensidades.length - 1 - index ? "selected" : ""}
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                className="slider-lateral-note"
                                placeholder="Observações Dry"
                            />
                        </div>
                    </div>

                    <div className="vertical-slider-box">
                        <h4>Break</h4>
                        <div className="slider-row-with-note">
                            <div className="slider-row">
                                <input
                                    type="range"
                                    className="vertical-slider"
                                    min="0"
                                    max="4"
                                    step="1"
                                    value={breakValue}
                                    onChange={(e) => setBreakValue(parseInt(e.target.value))}
                                />
                                <div className="slider-labels">
                                    {intensidades.slice().reverse().map((label, index) => (
                                        <span
                                            key={index}
                                            className={breakValue === intensidades.length - 1 - index ? "selected" : ""}
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                className="slider-lateral-note"
                                placeholder="Observações Break"
                            />
                        </div>
                    </div>
                </div>


                {/* Notas do Café */}
                <div className="nota-cafe-container">
                    <label>Notas:</label>
                    <textarea
                        value={notasSensorias}
                        onChange={(e) => setnotasSensoriais(e.target.value)}
                        placeholder="Preencha as notas encontradas no café"
                    />
                </div>

                {/* Sliders horizontais (AromaFragrancia, Sabor, Finalização, etc.) */}
                <div className="nota-container">
                    <label>Aroma / Fragrancia:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={notas.AromaFragrancia}
                        onChange={(e) => handleNotaChange("AromaFragrancia", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 7, 7.25, 7.5, 8, 8.25, 8.5, 9, 9.25, 9.5, 10].map((num) => (
                            <span key={num} className={num === notas.AromaFragrancia ? "selecionado" : ""}>
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
                        value={notas.sabor}
                        onChange={(e) => handleNotaChange("sabor", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 7, 7.25, 7.5, 8, 8.25, 8.5, 9, 9.25, 9.5, 10].map((num) => (
                            <span key={num} className={num === notas.sabor ? "selecionado" : ""}>
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
                        value={notas.finalizacao}
                        onChange={(e) => handleNotaChange("finalizacao", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 7, 7.25, 7.5, 8, 8.25, 8.5, 9, 9.25, 9.5, 10].map((num) => (
                            <span key={num} className={num === notas.finalizacao ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Vertical slider único para Nível de Acidez */}
                <div className="vertical-sliders-container vertical-slider-single">
                    <div className="titulo-acidez-com-botao">
                        <h4>Nível de Acidez</h4>
                        <button
                            className="botao-info-acidez"
                            onClick={() => setMostrarTiposAcidez(!mostrarTiposAcidez)}
                            title="Ver tipos de acidez"
                        >
                            <i className="bi bi-info-circle-fill"></i>
                        </button>
                    </div>

                    {mostrarTiposAcidez && (
                        <div className="caixa-tipos-acidez">
                            <p><strong>Acidez Cítrica:</strong> Limão, laranja, lima, abacaxi. Bastante desejável.</p>
                            <p><strong>Acidez Fosfórica:</strong> Presente em refrigerantes tipo cola, lembra espumante.</p>
                            <p><strong>Acidez Málica:</strong> Como a da maçã. Comum em cafés de altitude, especialmente na América Central.</p>
                            <p><strong>Acidez Lática:</strong> Derivados do leite. Rara no café.</p>
                            <p><strong>Acidez Tartárica:</strong> Comum nos vinhos, vinda da videira.</p>
                            <p><strong>Acidez Acética:</strong> Acidez do vinagre. Considerado defeito no café.</p>
                        </div>
                    )}
                    <div className="slider-row-with-note">
                        <div className="slider-row">
                            <input
                                type="range"
                                className="vertical-slider"
                                min="0"
                                max="4"
                                step="1"
                                value={nivelAcidez}
                                onChange={(e) => setNivelAcidez(parseInt(e.target.value))}
                            />
                            <div className="slider-labels">
                                {intensidades.slice().reverse().map((label, index) => (
                                    <span
                                        key={index}
                                        className={nivelAcidez === intensidades.length - 1 - index ? "selected" : ""}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <textarea
                            className="slider-lateral-note"
                            placeholder="Observações Acidez"
                            value={obsAcidez}
                            onChange={(e) => setObsAcidez(e.target.value)}
                        />
                    </div>
                </div>


                <div className="nota-container">
                    <label>Acidez:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={notas.acidez}
                        onChange={(e) => handleNotaChange("acidez", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 7, 7.25, 7.5, 8, 8.25, 8.5, 9, 9.25, 9.5, 10].map((num) => (
                            <span key={num} className={num === notas.acidez ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Vertical slider único para Nível de Corpo */}
                <div className="vertical-sliders-container vertical-slider-single">
                    <h4>Nível de Corpo</h4>
                    <div className="slider-row">
                        <input
                            type="range"
                            className="vertical-slider"
                            min="0"
                            max="4"
                            step="1"
                            value={nivelCorpo}
                            onChange={(e) => setNivelCorpo(parseInt(e.target.value))}
                        />
                        <div className="slider-labels">
                            {intensidades.slice().reverse().map((label, index) => (
                                <span
                                    key={index}
                                    className={nivelCorpo === intensidades.length - 1 - index ? "selected" : ""}
                                >
                                    {label}
                                </span>
                            ))}
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
                        value={notas.corpo}
                        onChange={(e) => handleNotaChange("corpo", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 7, 7.25, 7.5, 8, 8.25, 8.5, 9, 9.25, 9.5, 10].map((num) => (
                            <span key={num} className={num === notas.corpo ? "selecionado" : ""}>
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
                        value={notas.equilibrio}
                        onChange={(e) => handleNotaChange("equilibrio", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 7, 7.25, 7.5, 8, 8.25, 8.5, 9, 9.25, 9.5, 10].map((num) => (
                            <span key={num} className={num === notas.equilibrio ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Avaliação Pessoal (6..10) */}
                <div className="nota-container">
                    <label>Avaliação Pessoal:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.25"
                        value={notas.avaliacaoPessoal}
                        onChange={(e) => handleNotaChange("avaliacaoPessoal", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.25, 6.5, 7, 7.25, 7.5, 8, 8.25, 8.5, 9, 9.25, 9.5, 10].map((num) => (
                            <span key={num} className={num === notas.avaliacaoPessoal ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Pontuação das xícaras */}
                <div className="nota-container">
                    <label>Pontuação dos atributos de xícaras:</label>
                    <div className="nota-valor">
                        {(() => {
                            const docura = calcularPontuacaoXicara("doçura");
                            const uniformidade = calcularPontuacaoXicara("uniformidade");
                            const limpeza = calcularPontuacaoXicara("xicaraLimpa");
                            return (docura + uniformidade + limpeza).toFixed(2);
                        })()}
                    </div>
                </div>
                {/* Checkboxes: Doçura, Uniformidade, Limpeza */}
                <div className="xicaras-container">
                    <div className="xicaras-group">
                        <label>Doçura</label>
                        <div className="checkbox-group">
                            {notas.doçura.map((valor, index) => (
                                <input
                                    key={index}
                                    type="checkbox"
                                    checked={valor}
                                    onChange={() => toggleCheckbox("doçura", index)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="xicaras-group">
                        <label>Uniformidade</label>
                        <div className="checkbox-group">
                            {notas.uniformidade.map((valor, index) => (
                                <input
                                    key={index}
                                    type="checkbox"
                                    checked={valor}
                                    onChange={() => toggleCheckbox("uniformidade", index)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="xicaras-group">
                        <label>Limpeza da Xícara</label>
                        <div className="checkbox-group">
                            {notas.xicaraLimpa.map((valor, index) => (
                                <input
                                    key={index}
                                    type="checkbox"
                                    checked={valor}
                                    onChange={() => toggleCheckbox("xicaraLimpa", index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Defeitos - sem checkbox, só input */}
                <div className="defeitos-container">
                    <div>
                        <label>Defeito Leve (-2):</label>
                        <input
                            type="number"
                            min="0"
                            value={qtdLeve}
                            onChange={(e) => setQtdLeve(parseInt(e.target.value) || 0)}
                            placeholder="# cups"
                        />
                        <span> = {qtdLeve * 2}</span>
                    </div>
                    <br />
                    <div>
                        <label>Defeito Grave (-4):</label>
                        <input
                            type="number"
                            min="0"
                            value={qtdGrave}
                            onChange={(e) => setQtdGrave(parseInt(e.target.value) || 0)}
                            placeholder="# cups"
                        />
                        <span> = {qtdGrave * 4}</span>
                    </div>
                </div>

                {/* Pontuação Final */}
                <div className="pontuacao-final">
                    <h3>Pontuação Final: {calcularPontuacaoFinal()}</h3>
                    <p>Descontos Totais: {totalDescontos}</p>
                </div>


                <button
                    className="salvar"
                    onClick={() => {
                        handleSalvarAvaliacao();
                    }}
                >
                    SALVAR
                </button>

            </div>
        </div>
    );

};

export default Scaa;
