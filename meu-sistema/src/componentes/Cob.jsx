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
            {/* Cabeçalho */}
            <div className="cob-header">
                <h2>Avaliação COB</h2>
                <button className="close-button" onClick={handleFechar}>✖</button>
            </div>

            {/* Grupo: Identificação */}
            <div className="grupo-identificacao">
                <div className="cob-block">
                    <h3>1. Identificação</h3>
                    <div className="sub-block">
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
            </div>

            {/* Grupo: Classificação Física */}
            <div className="grupo-classificacao">
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
                                <label>Total Geral:</label>
                                <input type="number" readOnly value={totalGeral} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Grupo: Categoria / Subcategoria / Grupo / Classe */}
            <div className="grupo-categoria">
                {/* Coluna 1: Categoria */}
                <div className="categoria-col">
                    <h4>CATEGORIA</h4>
                    <label>Categoria:</label>
                    <input
                        type="text"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        placeholder="Ex: Tipo de Categoria"
                    />
                </div>
                
            {/* 2° parte Tabela 2x3 */}
            <div className="tabela-2x3">
                {/* Célula 1: SUBCATEGORIA: PENEIRA % */}
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

                {/* Célula 2: CHATO */}
                <div className="celula">
                    <h5>CHATO</h5>
                    {/* Exemplo: se quiser 3 radio para Graúdo, Médio, Miúdo */}
                    {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                        <label key={tamanho}>
                            <input
                                type="radio"
                                name="chatoTamanho"
                                value={tamanho}
                            // Se tiver um estado para "chato", ex: [chato, setChato]
                            // checked={chato === tamanho}
                            // onChange={(e) => setChato(e.target.value)}
                            />
                            {tamanho}
                        </label>
                    ))}
                </div>

                {/* Célula 3: MOCA */}
                <div className="celula">
                    <h5>MOCA</h5>
                    {["Graúdo", "Médio", "Miúdo"].map((tamanho) => (
                        <label key={tamanho}>
                            <input
                                type="radio"
                                name="mocaTamanho"
                                value={tamanho}
                            // Exemplo de estado "moca": [moca, setMoca]
                            // checked={moca === tamanho}
                            // onChange={(e) => setMoca(e.target.value)}
                            />
                            {tamanho}
                        </label>
                    ))}
                </div>

                {/* Célula 4: GRUPO I: ARÁBICA */}
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
                                    // Exemplo:
                                    setGrupoBebida("ARABICA");
                                    setSubClassificacaoBebida(e.target.value);
                                }}
                            />
                            {opcao}
                        </label>
                    ))}
                </div>

                {/* Célula 5: GRUPO II: ROBUSTA */}
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
                                    // Exemplo:
                                    setGrupoBebida("ROBUSTA");
                                    setSubClassificacaoBebida(e.target.value);
                                }}
                            />
                            {opcao}
                        </label>
                    ))}
                </div>

                {/* Célula 6: CLASSE */}
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




            {/* Grupo: Conclusão */ }
    <div className="grupo-conclusao">
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
    </div>

    {/* Grupo: Laudo de Classificação */ }
    <div className="grupo-laudo">
        <div className="cob-block">
            <h3>5. LAUDO DE CLASSIFICAÇÃO (Modelo/Verso)</h3>
            <div className="sub-block">
                <h4>CAFÉ Arábica / Café Robusta</h4>
                <p>
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
    </div>

    {/* Grupo: Botão Salvar */ }
    <div className="grupo-salvar">
        <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
    </div>
        </div >
    );
};

export default Cob;
