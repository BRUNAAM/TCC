import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./Cob.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    const [categoria, setCategoria] = useState("");
    const [peneiraSubcategoria, setPeneiraSubcategoria] = useState([]);
    const [grupoBebida, setGrupoBebida] = useState("");
    const [subClassificacaoBebida, setSubClassificacaoBebida] = useState("");
    const [classeBebida, setClasseBebida] = useState([]);
    const [aparelho, setAparelho] = useState("");
    const [subcategoria, setSubcategoria] = useState("");
    const [tipo, setTipo] = useState("");
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

    const totalDefeitos = Object.values(defeitos).reduce((acc, val) => acc + val, 0);
    const totalGeral = totalDefeitos + equivalenciaTotal;

    return (
        <div id="avaliacao-completa">
            {<div className="cob-container">
                {/* Cabeçalho */}
                <div className="cob-header">
                    <h2 className="titulo-cabecalho">AVALIAÇÃO DE CAFÉ - COB</h2>
                    <button className="close-button" onClick={handleFechar}>✖</button>
                </div>

                {/*Grupo identificação*/}
                <div className="grupo-identificacao">
                    <div className="cob-block">
                        <h3>1. Identificação</h3>
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

                <div className="grupo-categoria">
                    {/* Campo de Categoria acima da tabela */}
                    <div className="categoria-topo">
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
                {/*4 Grupo Conclusão*/}
                <div className="grupo-conclusao">
                    <div className="cob-block">
                        <h3>4. Conclusão</h3>
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
                                    <h3>5. LAUDO DE CLASSIFICAÇÃO (Modelo/Verso)</h3>
                                    <div className="linha-laudo">
                                        {/* PELO PREPARO */}
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

                                        {/* PELA SECA */}
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

                                        {/* PELO ASPECTO */}
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

                                        {/* TORRAÇÃO ARÁBICA */}
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

                                        {/* TORRAÇÃO CANEPHORA */}
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

                                        {/* TEOR DE CAFEÍNA */}
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

                            {/* Grupo: Botão Salvar*/}
                            <div className="grupo-salvar">
                                <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
                                <button onClick={gerarPDF}>📄 Gerar PDF</button>
                            </div>
                            {/* Espaço para Assinatura do Avaliador */}
                            <div className="espaco-assinatura">
                                <p>Assinatura do Avaliador:</p>
                                <div className="linha-assinatura"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >}
        </div>
    );
};

export default Cob;


