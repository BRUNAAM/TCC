import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./Cob.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Função para gerar PDF da tela
const gerarPDF = () => {
    const elemento = document.getElementById("avaliacao-completa");
    html2canvas(elemento).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save("avaliacao-cafe-cob.pdf");
    });
};

// ********************************************************************
// Tabela de classificação conforme a Instrução Normativa
// Cada objeto contém o valor máximo de equivalência (defeitos) e o rótulo a ser exibido
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
    { defeitos: Infinity, label: "Fora de Tipo" },
];

// Função que, dado o valor de equivalência (total de defeitos), retorna o rótulo da classificação.
// Ela percorre o array e mantém o último registro cujo valor de defeitos seja menor ou igual ao valor informado.
function getClassification(defeitosValue) {
    let result = classificationTable[0];
    for (let i = 0; i < classificationTable.length; i++) {
        if (classificationTable[i].defeitos <= defeitosValue) {
            result = classificationTable[i];
        } else {
            break;
        }
    }
    return result;
}
// ********************************************************************

const Cob = () => {
    const [avaliador, setAvaliador] = useState("");
    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState("");
    const [numeroAmostra, setNumeroAmostra] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [defeitos, setDefeitos] = useState({});
    const [umidade, setUmidade] = useState("");
    const [equivalencias, setEquivalencias] = useState({});
    const [equivalenciaTotal, setEquivalenciaTotal] = useState(0);
    // "tipo" será definido automaticamente com base na equivalência calculada
    const [tipo, setTipo] = useState("");
    const [categoria, setCategoria] = useState("");
    const [peneiraSubcategoria, setPeneiraSubcategoria] = useState([]);
    const [grupoBebida, setGrupoBebida] = useState("");
    const [subClassificacaoBebida, setSubClassificacaoBebida] = useState("");
    const [classeBebida, setClasseBebida] = useState([]);
    const [aparelho, setAparelho] = useState("");
    const [subcategoria, setSubcategoria] = useState("");
    const [postoServico, setPostoServico] = useState("");
    const [assinaturaAvaliador, setAssinaturaAvaliador] = useState("");
    const [classificadorMapa, setClassificadorMapa] = useState("");
    const [peloPreparo, setPeloPreparo] = useState("");
    const [pelaSeca, setPelaSeca] = useState("");
    const [peloAspecto, setPeloAspecto] = useState("");
    const [torraArabica, setTorraArabica] = useState("");
    const [torraCanephora, setTorraCanephora] = useState("");
    const [teorCafeina, setTeorCafeina] = useState("");

    const navigate = useNavigate();

    // Tabela de defeitos para cálculo de equivalência
    const tabelaDefeitos = {
        "Grão Preto": { quantidade: 1, equivalencia: 1 },
        "Grão Ardido": { quantidade: 2, equivalencia: 1 },
        "Concha": { quantidade: 3, equivalencia: 1 },
        "Grãos Verdes": { quantidade: 5, equivalencia: 1 },
        "Grãos Quebrados": { quantidade: 5, equivalencia: 1 },
        "Grãos Brocados": { quantidade: 2, equivalencia: 1 },
        "Grãos Mal Granados ou Chocho": { quantidade: 5, equivalencia: 1 },
        "Coco": { quantidade: 1, equivalencia: 1 },
        "Marinheiro": { quantidade: 2, equivalencia: 1 },
        "Pau, Pedra, Torrão Grande": { quantidade: 1, equivalencia: 5 },
        "Pau, Pedra, Torrão Regular": { quantidade: 1, equivalencia: 2 },
        "Pau, Pedra, Torrão Pequeno": { quantidade: 1, equivalencia: 1 },
        "Casca Grande": { quantidade: 1, equivalencia: 1 },
        "Casca Pequena": { quantidade: 2, equivalencia: 1 },
        "Brocado Sujo": { quantidade: 3, equivalencia: 1 },
        "Brocado Rendado": { quantidade: 2, equivalencia: 1 },
        "Brocado Limpo": { quantidade: 5, equivalencia: 1 },
        "Grão Esmagado": { quantidade: 5, equivalencia: 1 },
    };

    useEffect(() => {
        carregarAvaliador();
        carregarFornecedores();
    }, []);

    // Sempre que a equivalência total for atualizada, recalcula o tipo de defeito usando a tabela de classificação.
    useEffect(() => {
        const classification = getClassification(equivalenciaTotal);
        setTipo(classification.label);
    }, [equivalenciaTotal]);

    const carregarAvaliador = () => {
        const usuarioNome = localStorage.getItem("usuarioNome");
        if (usuarioNome) {
            setAvaliador(usuarioNome);
        }
    };

    const carregarFornecedores = async () => {
        const querySnapshot = await getDocs(collection(db, "fornecedores"));
        const listaFornecedores = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setFornecedores(listaFornecedores);
    };

    const handleDefeitoChange = (defeito, quantidade) => {
        const updatedDefeitos = { ...defeitos, [defeito]: quantidade };
        setDefeitos(updatedDefeitos);

        let totalEquivalencia = 0;
        let updatedEquivalencias = {};

        for (const [key, value] of Object.entries(updatedDefeitos)) {
            if (tabelaDefeitos[key]) {
                const equivalencia =
                    Math.floor(value / tabelaDefeitos[key].quantidade) *
                    tabelaDefeitos[key].equivalencia;
                updatedEquivalencias[key] = equivalencia;
                totalEquivalencia += equivalencia;
            }
        }
        setEquivalencias(updatedEquivalencias);
        setEquivalenciaTotal(totalEquivalencia);
    };

    const handleClasseChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setClasseBebida((prev) => [...prev, value]);
        } else {
            setClasseBebida((prev) => prev.filter((item) => item !== value));
        }
    };

    const handlePeneiraChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setPeneiraSubcategoria((prev) => [...prev, value]);
        } else {
            setPeneiraSubcategoria((prev) => prev.filter((item) => item !== value));
        }
    };

    const handleSalvarAvaliacao = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert("Usuário não autenticado.");
            return;
        }

        if (!fornecedorSelecionado || !numeroAmostra || !umidade) {
            alert("Preencha todos os campos obrigatórios (Fornecedor, Nº Amostra, Umidade).");
            return;
        }

        if (!grupoBebida || !subClassificacaoBebida) {
            alert("Selecione o Grupo e a Subclassificação da Bebida.");
            return;
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
            postoServico,
            assinaturaAvaliador,
            classificadorMapa,
            peloPreparo,
            pelaSeca,
            peloAspecto,
            torraArabica,
            torraCanephora,
            teorCafeina,
            data: new Date().toISOString(),
        };

        try {
            await addDoc(collection(db, "avaliacoes_cob"), avaliacao);
            alert("Avaliação salva com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar avaliação:", error);
            alert("Erro ao salvar avaliação. Tente novamente mais tarde.");
        }
    };

    const handleFechar = () => {
        navigate(-1);
    };

    // Soma dos grãos defeituosos digitados (para exibição)
    const totalDefeitos = Object.values(defeitos).reduce((acc, val) => acc + val, 0);

    return (
        <div id="avaliacao-completa">
            <div className="cob-container">
                {/* Cabeçalho */}
                <div className="cob-header">
                    <h2 className="titulo-cabecalho">AVALIAÇÃO DE CAFÉ - COB</h2>
                    <button className="close-button" onClick={handleFechar}>
                        ✖
                    </button>
                </div>

                {/* Grupo identificação */}
                <div className="grupo-identificacao">
                    <div className="cob-block">
                        <h3>IDENTIFICAÇÃO</h3>
                        <div className="linha-identificacao">
                            <div className="campo">
                                <label>Nome do Avaliador:</label>
                                <input type="text" value={avaliador} disabled />
                            </div>

                            <div className="campo">
                                <label>Data:</label>
                                <input type="text" value={new Date().toLocaleDateString("pt-BR")} disabled />
                            </div>

                            <div className="campo">
                                <label>Fornecedor:</label>
                                <select
                                    value={fornecedorSelecionado}
                                    onChange={(e) => setFornecedorSelecionado(e.target.value)}
                                >
                                    <option value="">Selecione um fornecedor</option>
                                    {fornecedores.map((fornecedor) => (
                                        <option key={fornecedor.id} value={fornecedor.nome}>
                                            {fornecedor.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="campo">
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
                </div>

                {/* Grupo: Classificação Física */}
                <div className="grupo-classificacao">
                    <div className="cob-block">
                        <h3>CLASSIFICAÇÃO FÍSICA</h3>
                        <div className="sub-block">
                            <h4 className="def">DEFEITOS E EQUIVALÊNCIA</h4>
                            <section className="defeitos-grid">
                                {Object.keys(tabelaDefeitos).map((defeito) => (
                                    <div key={defeito} className="defeitos-checkbox">
                                        <label>{defeito}:</label>
                                        <input
                                            className="defeitos-input"
                                            type="text"
                                            min="0"
                                            value={defeitos[defeito] || ""}
                                            onChange={(e) =>
                                                handleDefeitoChange(defeito, parseInt(e.target.value) || 0)
                                            }
                                        />
                                        <span> Equivalência: {equivalencias[defeito] || 0}</span>
                                    </div>
                                ))}
                            </section>

                            <div className="total">
                                <div>
                                    <label>Total Defeitos:</label>
                                    <input type="number" readOnly value={totalDefeitos} />
                                </div>
                                <div>
                                    <label>Total Equivalência:</label>
                                    <input type="number" readOnly value={equivalenciaTotal} />
                                </div>
                                <div>
                                    <label>Tipo de Defeito:</label>
                                    <input type="text" readOnly value={tipo} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grupo Categoria */}
                <div className="grupo-categoria">
                    <div className="categoria-topo">
                        <h3>CATEGORIA</h3>
                        <label>Categoria:</label>
                        <input
                            type="text"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            placeholder="Ex: Tipo de Categoria"
                        />
                    </div>
                    <div className="tabela-2x3">
                        <div className="celula">
                            <h5>SUBCATEGORIA: PENEIRA %</h5>
                            {["15 AC", "16 AC", "17 AC", "18 AC", "19", "Bica Corrida"].map((item) => (
                                <label key={item}>
                                    <input
                                        type="checkbox"
                                        value={item}
                                        checked={peneiraSubcategoria.includes(item)}
                                        onChange={handlePeneiraChange}
                                    />
                                    {item}
                                </label>
                            ))}
                        </div>

                        <div className="celula">
                            <h5>CHATO</h5>
                            {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                                <label key={tamanho}>
                                    <input
                                        type="radio"
                                        name="chatoTamanho"
                                        value={tamanho}
                                    />
                                    {tamanho}
                                </label>
                            ))}
                        </div>

                        <div className="celula">
                            <h5>MOCA</h5>
                            {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                                <label key={tamanho}>
                                    <input
                                        type="radio"
                                        name="mocaTamanho"
                                        value={tamanho}
                                    />
                                    {tamanho}
                                </label>
                            ))}
                        </div>

                        <div className="celula">
                            <h5>GRUPO I: ARÁBICA</h5>
                            {[
                                "Estritamente Mole",
                                "Mole",
                                "Apenas Mole",
                                "Duro",
                                "Riado",
                                "Rio",
                                "Rio Zona",
                            ].map((opcao) => (
                                <label key={opcao}>
                                    <input
                                        type="radio"
                                        name="subClassificacaoArabica"
                                        value={opcao}
                                        checked={grupoBebida === "ARABICA" && subClassificacaoBebida === opcao}
                                        onChange={(e) => {
                                            setGrupoBebida("ARABICA");
                                            setSubClassificacaoBebida(e.target.value);
                                        }}
                                    />
                                    {opcao}
                                </label>
                            ))}
                        </div>

                        <div className="celula">
                            <h5>GRUPO II: ROBUSTA</h5>
                            {["Excelente", "Regular", "Boa", "Anormal"].map((opcao) => (
                                <label key={opcao}>
                                    <input
                                        type="radio"
                                        name="subClassificacaoRobusta"
                                        value={opcao}
                                        checked={grupoBebida === "ROBUSTA" && subClassificacaoBebida === opcao}
                                        onChange={(e) => {
                                            setGrupoBebida("ROBUSTA");
                                            setSubClassificacaoBebida(e.target.value);
                                        }}
                                    />
                                    {opcao}
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
                                <label key={item}>
                                    <input
                                        type="checkbox"
                                        value={item}
                                        checked={classeBebida.includes(item)}
                                        onChange={handleClasseChange}
                                    />
                                    {item}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grupo Conclusão */}
                <div className="grupo-conclusao">
                    <div className="cob-block">
                        <h3>CONCLUSÃO</h3>
                        <div className="linha-identificacao">
                            <div className="campo">
                                <label>UMIDADE:</label>
                                <input
                                    type="number"
                                    value={umidade}
                                    onChange={(e) => setUmidade(e.target.value)}
                                    placeholder="Digite a umidade"
                                />
                            </div>

                            <div className="campo">
                                <label>APARELHO:</label>
                                <input
                                    type="text"
                                    value={aparelho}
                                    onChange={(e) => setAparelho(e.target.value)}
                                    placeholder="Informe o Aparelho"
                                />
                            </div>

                            <div className="campo">
                                <label>SUBCATEGORIA:</label>
                                <input
                                    type="text"
                                    value={subcategoria}
                                    onChange={(e) => setSubcategoria(e.target.value)}
                                    placeholder="Preencha a Subcategoria"
                                />
                            </div>

                            <div className="campo">
                                <label>TIPO:</label>
                                <input
                                    type="text"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    placeholder="Informe o Tipo"
                                />
                            </div>

                            <div className="campo">
                                <label>POSTO DE SERVIÇO DE CLASSIFICAÇÃO DE:</label>
                                <input
                                    type="text"
                                    value={postoServico}
                                    onChange={(e) => setPostoServico(e.target.value)}
                                    placeholder="Informe o Posto de Serviço"
                                />
                            </div>

                            <div className="campo">
                                <label>ASSINATURA DO AVALIADOR:</label>
                                <input
                                    type="text"
                                    value={assinaturaAvaliador}
                                    onChange={(e) => setAssinaturaAvaliador(e.target.value)}
                                    placeholder="Assinatura do Avaliador"
                                />
                            </div>

                            <div className="campo">
                                <label>CLASSIFICADOR/REG. MAPA NO:</label>
                                <input
                                    type="text"
                                    value={classificadorMapa}
                                    onChange={(e) => setClassificadorMapa(e.target.value)}
                                    placeholder="Informe o Classificador/Reg. MAPA"
                                />
                            </div>

                            <div className="campo campo-observacoes">
                                <label>OBSERVAÇÕES:</label>
                                <textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    placeholder="Digite as observações..."
                                    rows="4"
                                />
                            </div>

                            <div className="grupo-laudo">
                                <div className="cob-block">
                                    <h3>LAUDO DE CLASSIFICAÇÃO</h3>
                                    <div className="linha-laudo">
                                        <div className="bloco-laudo">
                                            <h4>PELO PREPARO</h4>
                                            {["Via Seca", "Via Úmida"].map((opcao) => (
                                                <label key={opcao}>
                                                    <input
                                                        type="checkbox"
                                                        checked={peloPreparo === opcao}
                                                        onChange={() => setPeloPreparo(opcao)}
                                                    />
                                                    {opcao}
                                                </label>
                                            ))}
                                        </div>

                                        <div className="bloco-laudo">
                                            <h4>PELA SECA</h4>
                                            {["Seca Boa", "Seca Regular", "Seca Má"].map((opcao) => (
                                                <label key={opcao}>
                                                    <input
                                                        type="checkbox"
                                                        checked={pelaSeca === opcao}
                                                        onChange={() => setPelaSeca(opcao)}
                                                    />
                                                    {opcao}
                                                </label>
                                            ))}
                                        </div>

                                        <div className="bloco-laudo">
                                            <h4>PELO ASPECTO</h4>
                                            {["Bom", "Regular", "Mau"].map((opcao) => (
                                                <label key={opcao}>
                                                    <input
                                                        type="checkbox"
                                                        checked={peloAspecto === opcao}
                                                        onChange={() => setPeloAspecto(opcao)}
                                                    />
                                                    {opcao}
                                                </label>
                                            ))}
                                        </div>

                                        <div className="bloco-laudo">
                                            <h4>TORRAÇÃO (Coffea arábica)</h4>
                                            {["Torração Fina", "Torração Boa", "Torração Regular", "Torração Má"].map((opcao) => (
                                                <label key={opcao}>
                                                    <input
                                                        type="checkbox"
                                                        checked={torraArabica === opcao}
                                                        onChange={() => setTorraArabica(opcao)}
                                                    />
                                                    {opcao}
                                                </label>
                                            ))}
                                        </div>

                                        <div className="bloco-laudo">
                                            <h4>TORRAÇÃO (Coffea canephora)</h4>
                                            {[
                                                "Torração Excelente",
                                                "Torração Quase Excelente",
                                                "Torração Muito Boa",
                                                "Torração Boa",
                                                "Torração Regular",
                                                "Torração Má",
                                            ].map((opcao) => (
                                                <label key={opcao}>
                                                    <input
                                                        type="checkbox"
                                                        checked={torraCanephora === opcao}
                                                        onChange={() => setTorraCanephora(opcao)}
                                                    />
                                                    {opcao}
                                                </label>
                                            ))}
                                        </div>

                                        <div className="bloco-laudo">
                                            <h4>TEOR DE CAFEÍNA</h4>
                                            {["CAFÉ", "CAFÉ DESCAFEINADO"].map((opcao) => (
                                                <label key={opcao}>
                                                    <input
                                                        type="checkbox"
                                                        checked={teorCafeina === opcao}
                                                        onChange={() => setTeorCafeina(opcao)}
                                                    />
                                                    {opcao}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grupo-salvar">
                                <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
                                <button onClick={gerarPDF}>📄 Gerar PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cob;
