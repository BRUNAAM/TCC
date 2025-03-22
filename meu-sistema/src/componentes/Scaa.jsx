import "./Scaa.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

const Scaa = () => {
    const [avaliador, setAvaliador] = useState("");
    const [data, setData] = useState("");
    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState("");
    const [numeroAmostra, setNumeroAmostra] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [torraSelecionada, setTorraSelecionada] = useState("");

    // Campo para armazenar as notas encontradas no café
    const [notasCafe, setNotasCafe] = useState("");

    // DRY e BREAK – sliders verticais (0..4)
    const [dry, setDry] = useState(2);
    const [breakValue, setBreakValue] = useState(2);

    // Controles verticais informativos para Nível de Acidez e Nível de Corpo (0..4)
    const [nivelAcidez, setNivelAcidez] = useState(2);
    const [nivelCorpo, setNivelCorpo] = useState(2);

    // Estado dos demais atributos (sliders 6..10) + arrays de xícaras
    // "avaliacaoPessoal" é o novo slider (6..10).
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

    // Estados para defeitos: checkbox + quantidade
    const [isLeve, setIsLeve] = useState(false);
    const [qtdLeve, setQtdLeve] = useState(0);

    const [isGrave, setIsGrave] = useState(false);
    const [qtdGrave, setQtdGrave] = useState(0);

    const navigate = useNavigate();

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
        const querySnapshot = await getDocs(collection(db, "fornecedores"));
        const listaFornecedores = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        setFornecedores(listaFornecedores);
    };

    // Atualiza sliders numéricos (6..10)
    const handleNotaChange = (categoria, valor) => {
        setNotas((prev) => ({ ...prev, [categoria]: parseFloat(valor) }));
    };

    // Alterna um checkbox de doçura, uniformidade ou xicaraLimpa
    const toggleCheckbox = (atributo, index) => {
        setNotas((prev) => {
            const newArray = [...prev[atributo]];
            newArray[index] = !newArray[index];
            return { ...prev, [atributo]: newArray };
        });
    };

    // Para cada atributo de xícaras, começa em 10 e subtrai 2 pontos por checkbox marcado
    const calcularPontuacaoXicara = (atributo) => {
        const marcados = notas[atributo].filter((v) => v).length;
        const score = 10 - marcados * 2;
        return score < 0 ? 0 : score;
    };

    // Soma as pontuações de doçura, uniformidade e limpeza (máx 30)
    const calcularPontuacaoXicaras = () => {
        const docura = calcularPontuacaoXicara("doçura");
        const uniformidade = calcularPontuacaoXicara("uniformidade");
        const limpeza = calcularPontuacaoXicara("xicaraLimpa");
        return docura + uniformidade + limpeza;
    };

    // Cálculo da pontuação final:
    // - Soma todos os sliders numéricos (6..10)
    // - Adiciona pontuação dos atributos de xícaras (doçura, uniformidade, limpeza)
    // - Subtrai defeitos leves (qtdLeve × 2) e graves (qtdGrave × 4), se checkbox marcado
    const calcularPontuacaoFinal = () => {
        let total = 0;

        // Soma todos os sliders fora de doçura, uniformidade, xicaraLimpa
        Object.keys(notas).forEach((key) => {
            if (!["doçura", "uniformidade", "xicaraLimpa"].includes(key)) {
                total += notas[key];
            }
        });

        // Soma xícaras
        total += calcularPontuacaoXicaras();

        // Defeitos leves e graves
        let subtracaoDefeitos = 0;
        if (isLeve) {
            subtracaoDefeitos += qtdLeve * 2;
        }
        if (isGrave) {
            subtracaoDefeitos += qtdGrave * 4;
        }
        total -= subtracaoDefeitos;

        return total.toFixed(2);
    };

    const handleSalvarAvaliacao = async () => {
        if (!fornecedorSelecionado || !numeroAmostra || !torraSelecionada) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const avaliacao = {
            avaliador,
            data,
            fornecedor: fornecedorSelecionado,
            numeroAmostra,
            torra: torraSelecionada,
            observacoes,
            notasCafe,
            dry,
            breakValue,
            nivelAcidez,
            nivelCorpo,
            notas,
            // Salva também as informações de defeitos
            defeitosLeves: isLeve ? qtdLeve : 0,
            defeitosGraves: isGrave ? qtdGrave : 0,
            pontuacaoFinal: calcularPontuacaoFinal(),
            userId: auth.currentUser.uid,
            dataCriacao: new Date().toISOString()
        };

        await addDoc(collection(db, "avaliacoes_scaa"), avaliacao);
        alert("Avaliação SCAA salva com sucesso!");
        navigate(-1);
    };

    // Rótulos invertidos nos sliders verticais (0..4)
    const intensidades = ["Baixo", "Médio Baixo", "Médio", "Médio Alto", "Alto"];


    return (
        <div className="scaa-container">
            <div className="scaa-header">
                <h2>Avaliação Sensorial de Café - SCAA</h2>
                <button className="close-button" onClick={() => navigate(-1)}>
                    ✖
                </button>
            </div>

            <div className="scaa-form">
                <label>Nome do Avaliador:</label>
                <input type="text" value={avaliador} disabled />

                <label>Data:</label>
                <input type="date" value={data} disabled />

                <label>Fornecedor:</label>
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

                {/* Seleção da Cor da Torra */}
                <div className="torra-container">
                    <h3>Selecione a Cor da Torra:</h3>
                    <div className="torra-options">
                        {[
                            { nome: "Torra Clara" },
                            { nome: "Torra Média Clara" },
                            { nome: "Torra Média" },
                            { nome: "Torra Escura" }
                        ].map((torra) => (
                            <div
                                key={torra.nome}
                                className={`torra-option ${torraSelecionada === torra.nome ? "selecionado" : ""
                                    }`}
                                onClick={() => setTorraSelecionada(torra.nome)}
                            >
                                {torra.nome}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sliders verticais para DRY e BREAK */}
                <div className="vertical-sliders-container">
                    <div className="vertical-slider-box">
                        <h4>Dry</h4>
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
                                {intensidades
                                    .slice()
                                    .reverse()
                                    .map((label, index) => (
                                        <span
                                            key={index}
                                            className={
                                                dry === intensidades.length - 1 - index ? "selected" : ""
                                            }
                                        >
                                            {label}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    </div>
                    <div className="vertical-slider-box">
                        <h4>Break</h4>
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
                                {intensidades
                                    .slice()
                                    .reverse()
                                    .map((label, index) => (
                                        <span
                                            key={index}
                                            className={
                                                breakValue === intensidades.length - 1 - index
                                                    ? "selected"
                                                    : ""
                                            }
                                        >
                                            {label}
                                        </span>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notas do Café */}
                <div className="nota-cafe-container">
                    <label>Notas:</label>
                    <textarea
                        value={notasCafe}
                        onChange={(e) => setNotasCafe(e.target.value)}
                        placeholder="Preencha as notas encontradas no café"
                    />
                </div>

                {/* Sliders horizontais (AromaFragrancia, Sabor, Finalização, etc.) */}
                <div className="nota-container">
                    <label>AromaFragrancia:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.5"
                        value={notas.AromaFragrancia}
                        onChange={(e) => handleNotaChange("AromaFragrancia", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((num) => (
                            <span
                                key={num}
                                className={num === notas.AromaFragrancia ? "selecionado" : ""}
                            >
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
                        step="0.5"
                        value={notas.sabor}
                        onChange={(e) => handleNotaChange("sabor", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((num) => (
                            <span
                                key={num}
                                className={num === notas.sabor ? "selecionado" : ""}
                            >
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
                        step="0.5"
                        value={notas.finalizacao}
                        onChange={(e) => handleNotaChange("finalizacao", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((num) => (
                            <span
                                key={num}
                                className={num === notas.finalizacao ? "selecionado" : ""}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Vertical slider único para Nível de Acidez */}
                <div className="vertical-sliders-container vertical-slider-single">
                    <h4>Nível de Acidez</h4>
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
                                    className={
                                        nivelAcidez === intensidades.length - 1 - index
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="nota-container">
                    <label>Acidez:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.5"
                        value={notas.acidez}
                        onChange={(e) => handleNotaChange("acidez", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((num) => (
                            <span
                                key={num}
                                className={num === notas.acidez ? "selecionado" : ""}
                            >
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
                                    className={
                                        nivelCorpo === intensidades.length - 1 - index
                                            ? "selected"
                                            : ""
                                    }
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
                        step="0.5"
                        value={notas.corpo}
                        onChange={(e) => handleNotaChange("corpo", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((num) => (
                            <span
                                key={num}
                                className={num === notas.corpo ? "selecionado" : ""}
                            >
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
                        step="0.5"
                        value={notas.equilibrio}
                        onChange={(e) => handleNotaChange("equilibrio", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((num) => (
                            <span
                                key={num}
                                className={num === notas.equilibrio ? "selecionado" : ""}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Slider de Avaliação Pessoal (6..10) */}
                <div className="nota-container">
                    <label>Avaliação Pessoal:</label>
                    <input
                        type="range"
                        min="6"
                        max="10"
                        step="0.5"
                        value={notas.avaliacaoPessoal}
                        onChange={(e) => handleNotaChange("avaliacaoPessoal", e.target.value)}
                    />
                    <div className="escala-notas">
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((num) => (
                            <span
                                key={num}
                                className={num === notas.avaliacaoPessoal ? "selecionado" : ""}
                            >
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Grupos de checkboxes para Doçura, Uniformidade e Limpeza da Xícara */}
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

                {/* Campos para defeitos leves e graves */}
                <div className="defeitos-container">
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                checked={isLeve}
                                onChange={(e) => setIsLeve(e.target.checked)}
                            />
                            Defeito Leve
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={qtdLeve}
                            onChange={(e) => setQtdLeve(parseInt(e.target.value) || 0)}
                            placeholder="Qtd"
                        />
                        <span>(cada um vale -2 pontos)</span>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                checked={isGrave}
                                onChange={(e) => setIsGrave(e.target.checked)}
                            />
                            Defeito Grave
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={qtdGrave}
                            onChange={(e) => setQtdGrave(parseInt(e.target.value) || 0)}
                            placeholder="Qtd"
                        />
                        <span>(cada um vale -4 pontos)</span>
                    </div>
                </div>

                {/* Exibição da pontuação dos atributos de xícaras */}
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

                {/* Pontuação Final */}
                <div className="pontuacao-final">
                    <h3>Pontuação Final: {calcularPontuacaoFinal()}</h3>
                </div>

                <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
            </div>
        </div>
    );
};

export default Scaa;
