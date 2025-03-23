import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import "./Cob.css";

const Cob = () => {
    // ==============================
    // Estados existentes
    // ==============================
    const [avaliador, setAvaliador] = useState("");
    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState("");
    const [numeroAmostra, setNumeroAmostra] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [defeitos, setDefeitos] = useState({});
    const [umidade, setUmidade] = useState("");
    const [equivalencias, setEquivalencias] = useState({});
    const [equivalenciaTotal, setEquivalenciaTotal] = useState(0);

    // ==============================
    // Estados do Bloco 3
    // ==============================
    const [categoria, setCategoria] = useState("");
    const [peneiraSubcategoria, setPeneiraSubcategoria] = useState([]); // SUBCATEGORIA: Peneira %
    const [grupoBebida, setGrupoBebida] = useState(""); // "ARABICA" ou "ROBUSTA"
    const [subClassificacaoBebida, setSubClassificacaoBebida] = useState(""); // Subgrupo
    const [classeBebida, setClasseBebida] = useState([]); // Várias opções (checkbox)

    // ==============================
    // Estados do Bloco 4: Conclusão
    // ==============================
    const [aparelho, setAparelho] = useState("");
    const [subcategoria, setSubcategoria] = useState("");
    const [tipo, setTipo] = useState("");
    const [postoServico, setPostoServico] = useState("");
    const [assinaturaAvaliador, setAssinaturaAvaliador] = useState("");
    const [classificadorMapa, setClassificadorMapa] = useState("");

    // ==============================
    // Estados do Bloco 5 (Laudo Modelo/Verso)
    // ==============================
    const [peloPreparo, setPeloPreparo] = useState("");   // "Via Seca" ou "Via Úmida"
    const [pelaSeca, setPelaSeca] = useState("");         // "Seca Boa", "Seca Regular", etc.
    const [peloAspecto, setPeloAspecto] = useState("");   // "Bom", "Regular", "Mau"
    const [torraArabica, setTorraArabica] = useState(""); // "Torração Fina", etc.
    const [torraCanephora, setTorraCanephora] = useState("");
    const [teorCafeina, setTeorCafeina] = useState("");   // "CAFÉ" ou "CAFÉ DESCAFEINADO"

    const navigate = useNavigate();

    // ==============================
    // Tabela de defeitos
    // ==============================
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

    // ==============================
    // useEffect para carregar dados
    // ==============================
    useEffect(() => {
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
        const querySnapshot = await getDocs(collection(db, "fornecedores"));
        const listaFornecedores = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setFornecedores(listaFornecedores);
    };

    // ==============================
    // Lida com defeitos
    // ==============================
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

    // ==============================
    // Checkboxes: Classe
    // ==============================
    const handleClasseChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setClasseBebida((prev) => [...prev, value]);
        } else {
            setClasseBebida((prev) => prev.filter((item) => item !== value));
        }
    };

    // ==============================
    // Checkboxes: Peneira Subcategoria
    // ==============================
    const handlePeneiraChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setPeneiraSubcategoria((prev) => [...prev, value]);
        } else {
            setPeneiraSubcategoria((prev) => prev.filter((item) => item !== value));
        }
    };

    // ==============================
    // Salvar Avaliação
    // ==============================
    const handleSalvarAvaliacao = async () => {
        if (!fornecedorSelecionado || !numeroAmostra || !umidade) {
            alert("Por favor, preencha todos os campos obrigatórios (Fornecedor, Nº Amostra, Umidade).");
            return;
        }
        if (!grupoBebida || !subClassificacaoBebida) {
            alert("Por favor, selecione o Grupo e a Subclassificação da Bebida.");
            return;
        }

        const avaliacao = {
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

        await addDoc(collection(db, "avaliacoes"), avaliacao);
        alert("Avaliação salva com sucesso!");
    };

    // ==============================
    // Navegação
    // ==============================
    const handleFechar = () => {
        navigate(-1);
    };

    // ==============================
    // Totais
    // ==============================
    const totalDefeitos = Object.values(defeitos).reduce((acc, val) => acc + val, 0);
    const totalGeral = totalDefeitos + equivalenciaTotal;

    return (
        <div className="cob-container">
            {/* ---------------------------------------------- */}
            {/* Cabeçalho */}
            {/* ---------------------------------------------- */}
            <div className="cob-header">
                <h2>Avaliação COB</h2>
                <button className="close-button" onClick={handleFechar}>
                    ✖
                </button>
            </div>

            {/* ---------------------------------------------- */}
            {/* BLOCO 1: Identificação */}
            {/* ---------------------------------------------- */}
            <div className="cob-block">
                <h3>1. Identificação</h3>
                <div className="sub-block">
                    <h4>Dados do Avaliador / Fornecedor / Amostra</h4>

                    <label>Avaliador:</label>
                    <input type="text" value={avaliador} disabled />

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

                    <label>N° da Amostra:</label>
                    <input
                        type="text"
                        value={numeroAmostra}
                        onChange={(e) => setNumeroAmostra(e.target.value)}
                        placeholder="Digite o número da amostra"
                    />
                </div>
            </div>

            {/* ---------------------------------------------- */}
            {/* BLOCO 2: CLASSIFICAÇÃO FÍSICA */}
            {/* ---------------------------------------------- */}
            <div className="cob-block">
                <h3>2. CLASSIFICAÇÃO FÍSICA</h3>
                <div className="sub-block">
                    <h4>Defeitos e Equivalências</h4>

                    <label>Defeitos Encontrados:</label>
                    <div className="defeitos-checkboxes">
                        {Object.keys(tabelaDefeitos).map((defeito) => (
                            <div key={defeito}>
                                <label>{defeito}:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={defeitos[defeito] || ""}
                                    onChange={(e) =>
                                        handleDefeitoChange(defeito, parseInt(e.target.value) || 0)
                                    }
                                />
                                <span> Equivalência: {equivalencias[defeito] || 0}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label>Total Defeitos:</label>
                            <input
                                type="number"
                                readOnly
                                value={totalDefeitos}
                                style={{ width: "80px" }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label>Total Equivalência:</label>
                            <input
                                type="number"
                                readOnly
                                value={equivalenciaTotal}
                                style={{ width: "80px" }}
                            />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <label>Total Geral:</label>
                            <input
                                type="number"
                                readOnly
                                value={totalGeral}
                                style={{ width: "80px" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------------------------------------------- */}
            {/* BLOCO 3: CATEGORIA / SUBCATEGORIA / GRUPO / CLASSE */}
            {/* ---------------------------------------------- */}
            <div className="cob-block">
                <h3>3. Categoria / Subcategoria / Grupo / Classe</h3>

                <div className="sub-block">
                    <h4>CATEGORIA</h4>
                    <label>Categoria:</label>
                    <input
                        type="text"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        placeholder="Ex: Tipo de Categoria"
                    />
                </div>

                <div className="sub-block">
                    <h4>SUBCATEGORIA: Peneira %</h4>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                        {["15 AC", "16 AC", "17 AC", "18 AC", "19", "Bica Corrida"].map((item) => (
                            <label key={item} style={{ minWidth: "100px" }}>
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
                </div>

                <div className="sub-block">
                    <h4>GRUPO e SUBGRUPO</h4>
                    {/* Grupo (Arábica / Robusta) */}
                    <div style={{ marginBottom: "15px" }}>
                        <label>
                            <input
                                type="radio"
                                name="grupoBebida"
                                value="ARABICA"
                                checked={grupoBebida === "ARABICA"}
                                onChange={(e) => {
                                    setGrupoBebida(e.target.value);
                                    setSubClassificacaoBebida("");
                                }}
                            />
                            <strong>GRUPO I: ARÁBICA</strong>
                        </label>
                    </div>
                    {grupoBebida === "ARABICA" && (
                        <div style={{ marginLeft: "20px", marginBottom: "15px" }}>
                            <p>SUBGRUPO:</p>
                            {[
                                "Estritamente Mole",
                                "Mole",
                                "Apenas Mole",
                                "Duro",
                                "Riado",
                                "Rio",
                                "Rio Zona",
                            ].map((opcao) => (
                                <label key={opcao} style={{ display: "block", marginLeft: "10px" }}>
                                    <input
                                        type="radio"
                                        name="subClassificacaoBebida"
                                        value={opcao}
                                        checked={subClassificacaoBebida === opcao}
                                        onChange={(e) => setSubClassificacaoBebida(e.target.value)}
                                    />
                                    {opcao}
                                </label>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: "15px", marginBottom: "15px" }}>
                        <label>
                            <input
                                type="radio"
                                name="grupoBebida"
                                value="ROBUSTA"
                                checked={grupoBebida === "ROBUSTA"}
                                onChange={(e) => {
                                    setGrupoBebida(e.target.value);
                                    setSubClassificacaoBebida("");
                                }}
                            />
                            <strong>GRUPO II: ROBUSTA</strong>
                        </label>
                    </div>
                    {grupoBebida === "ROBUSTA" && (
                        <div style={{ marginLeft: "20px", marginBottom: "15px" }}>
                            {["Excelente", "Regular", "Boa", "Anormal"].map((opcao) => (
                                <label key={opcao} style={{ display: "block", marginLeft: "10px" }}>
                                    <input
                                        type="radio"
                                        name="subClassificacaoBebida"
                                        value={opcao}
                                        checked={subClassificacaoBebida === opcao}
                                        onChange={(e) => setSubClassificacaoBebida(e.target.value)}
                                    />
                                    {opcao}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sub-block">
                    <h4>CLASSE</h4>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
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
                            <label key={item} style={{ minWidth: "120px" }}>
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

            {/* ---------------------------------------------- */}
            {/* BLOCO 4: Conclusão */}
            {/* ---------------------------------------------- */}
            <div className="cob-block">
                <h3>4. Conclusão</h3>
                <div className="sub-block">
                    <h4>Dados de Conclusão</h4>

                    <label>UMIDADE:</label>
                    <input
                        type="number"
                        value={umidade}
                        onChange={(e) => setUmidade(e.target.value)}
                        placeholder="Digite a umidade"
                    />

                    <label>APARELHO:</label>
                    <input
                        type="text"
                        value={aparelho}
                        onChange={(e) => setAparelho(e.target.value)}
                        placeholder="Informe o Aparelho"
                    />

                    <label>SUCATEGORIA:</label>
                    <input
                        type="text"
                        value={subcategoria}
                        onChange={(e) => setSubcategoria(e.target.value)}
                        placeholder="Preencha a Subcategoria"
                    />

                    <label>TIPO:</label>
                    <input
                        type="text"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        placeholder="Informe o Tipo"
                    />

                    <label>OBS.:</label>
                    <textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Digite as observações..."
                        rows="3"
                    />

                    <label>POSTO DE SERVIÇO DE CLASSIFICAÇÃO DE:</label>
                    <input
                        type="text"
                        value={postoServico}
                        onChange={(e) => setPostoServico(e.target.value)}
                        placeholder="Informe o Posto de Serviço"
                    />

                    <label>ASSINATURA DO AVALIADOR:</label>
                    <input
                        type="text"
                        value={assinaturaAvaliador}
                        onChange={(e) => setAssinaturaAvaliador(e.target.value)}
                        placeholder="Assinatura do Avaliador"
                    />

                    <label>CLASSIFICADOR/REG. MAPA NO:</label>
                    <input
                        type="text"
                        value={classificadorMapa}
                        onChange={(e) => setClassificadorMapa(e.target.value)}
                        placeholder="Informe o Classificador/Reg. MAPA"
                    />
                </div>
            </div>

            {/* ---------------------------------------------- */}
            {/* BLOCO 5: LAUDO DE CLASSIFICAÇÃO (MODELO/VERSO) */}
            {/* ---------------------------------------------- */}
            <div className="cob-block">
                <h3>5. LAUDO DE CLASSIFICAÇÃO (Modelo/Verso)</h3>
                <div className="sub-block">
                    <h4>CAFÉ Arábica / Café Robusta</h4>
                    <p>
                        {/* Apenas exemplo de rótulo, caso queira marcar ou não */}
                        ( ) Café Arábica &nbsp; ( ) Café Robusta
                    </p>

                    <div className="quad-box">
                        <div className="quad-header">PELO PREPARO:</div>
                        <div className="quad-content">
                            <label>
                                <input
                                    type="radio"
                                    name="peloPreparo2"
                                    value="Via Seca"
                                    checked={peloPreparo === "Via Seca"}
                                    onChange={(e) => setPeloPreparo(e.target.value)}
                                />
                                Via Seca
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="peloPreparo2"
                                    value="Via Úmida"
                                    checked={peloPreparo === "Via Úmida"}
                                    onChange={(e) => setPeloPreparo(e.target.value)}
                                />
                                Via Úmida
                            </label>
                        </div>
                    </div>

                    <div className="quad-box">
                        <div className="quad-header">PELA SECA:</div>
                        <div className="quad-content">
                            <label>
                                <input
                                    type="radio"
                                    name="pelaSeca2"
                                    value="Seca Boa"
                                    checked={pelaSeca === "Seca Boa"}
                                    onChange={(e) => setPelaSeca(e.target.value)}
                                />
                                Seca Boa
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pelaSeca2"
                                    value="Seca Regular"
                                    checked={pelaSeca === "Seca Regular"}
                                    onChange={(e) => setPelaSeca(e.target.value)}
                                />
                                Seca Regular
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pelaSeca2"
                                    value="Seca Má"
                                    checked={pelaSeca === "Seca Má"}
                                    onChange={(e) => setPelaSeca(e.target.value)}
                                />
                                Seca Má
                            </label>
                        </div>
                    </div>

                    <div className="quad-box">
                        <div className="quad-header">PELO ASPECTO:</div>
                        <div className="quad-content">
                            <label>
                                <input
                                    type="radio"
                                    name="peloAspecto2"
                                    value="Bom"
                                    checked={peloAspecto === "Bom"}
                                    onChange={(e) => setPeloAspecto(e.target.value)}
                                />
                                Bom
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="peloAspecto2"
                                    value="Regular"
                                    checked={peloAspecto === "Regular"}
                                    onChange={(e) => setPeloAspecto(e.target.value)}
                                />
                                Regular
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="peloAspecto2"
                                    value="Mau"
                                    checked={peloAspecto === "Mau"}
                                    onChange={(e) => setPeloAspecto(e.target.value)}
                                />
                                Mau
                            </label>
                        </div>
                    </div>

                    {/* PELA TORRAÇÃO Coffea arábica */}
                    <div className="quad-box">
                        <div className="quad-header">PELA TORRAÇÃO (Coffea arábica):</div>
                        <div className="quad-content">
                            {["Torração Fina", "Torração Boa", "Torração Regular", "Torração Má"].map((opcao) => (
                                <label key={opcao}>
                                    <input
                                        type="radio"
                                        name="torraArabica2"
                                        value={opcao}
                                        checked={torraArabica === opcao}
                                        onChange={(e) => setTorraArabica(e.target.value)}
                                    />
                                    {opcao}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* PELA TORRAÇÃO Coffea canephora */}
                    <div className="quad-box">
                        <div className="quad-header">PELA TORRAÇÃO (Coffea canephora):</div>
                        <div className="quad-content">
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
                                        type="radio"
                                        name="torraCanephora2"
                                        value={opcao}
                                        checked={torraCanephora === opcao}
                                        onChange={(e) => setTorraCanephora(e.target.value)}
                                    />
                                    {opcao}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* PELO TEOR DE CAFEÍNA */}
                    <div className="quad-box">
                        <div className="quad-header">PELO TEOR DE CAFEÍNA:</div>
                        <div className="quad-content">
                            <label>
                                <input
                                    type="radio"
                                    name="teorCafeina2"
                                    value="CAFÉ"
                                    checked={teorCafeina === "CAFÉ"}
                                    onChange={(e) => setTeorCafeina(e.target.value)}
                                />
                                CAFÉ
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="teorCafeina2"
                                    value="CAFÉ DESCAFEINADO"
                                    checked={teorCafeina === "CAFÉ DESCAFEINADO"}
                                    onChange={(e) => setTeorCafeina(e.target.value)}
                                />
                                CAFÉ DESCAFEINADO
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botão Final de Salvar */}
            <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
            </div>
        </div>
    );
};

export default Cob;
