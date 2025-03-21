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
    const [defeitosLeves, setDefeitosLeves] = useState(0);
    const [defeitosGraves, setDefeitosGraves] = useState(0);
    const [torraSelecionada, setTorraSelecionada] = useState("");

    // Campo para armazenar as notas encontradas no café
    const [notasCafe, setNotasCafe] = useState("");

    // DRY e BREAK – sliders verticais (0 a 4)
    const [dry, setDry] = useState(2);
    const [breakValue, setBreakValue] = useState(2);

    // Controles verticais para Nível de Acidez e Nível de Corpo (0 a 4) – informativos
    const [nivelAcidez, setNivelAcidez] = useState(2);
    const [nivelCorpo, setNivelCorpo] = useState(2);

    // Estado dos demais atributos (sliders com escala de 6 a 10)
    // Para Doçura, Uniformidade e Limpeza da Xícara, usamos arrays de 5 booleans.
    const [notas, setNotas] = useState({
        AromaFragrancia: 6,
        sabor: 6,
        finalizacao: 6,
        acidez: 6,
        corpo: 6,
        equilibrio: 6,
        avaliacaoGeral: 6,
        doçura: [false, false, false, false, false],
        uniformidade: [false, false, false, false, false],
        xicaraLimpa: [false, false, false, false, false]
    });

    // Estado único para a severidade dos defeitos dos atributos de xícara
    // 2 para defeito leve, 4 para defeito grave.
    const [fatorDefeito, setFatorDefeito] = useState(2);

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

    // Atualiza os sliders dos atributos que usam escala de 6 a 10
    const handleNotaChange = (categoria, valor) => {
        setNotas((prev) => ({ ...prev, [categoria]: parseFloat(valor) }));
    };

    // Atualiza os checkboxes para os atributos: doçura, uniformidade e xicaraLimpa
    const toggleCheckbox = (categoria, index) => {
        setNotas((prev) => {
            const newArray = [...prev[categoria]];
            newArray[index] = !newArray[index];
            return { ...prev, [categoria]: newArray };
        });
    };

    // Calcula a pontuação para cada grupo de xícaras:
    // Se nenhuma caixa estiver marcada, pontua 10; caso contrário:
    // score = 10 - (número de xícaras marcadas × 2 × fatorDefeito)
    const calcularPontuacaoGrupo = (grupo) => {
        const count = notas[grupo].filter((v) => v).length;
        const score = 10 - count * 2 * fatorDefeito;
        return score < 0 ? 0 : score;
    };

    // Soma a pontuação dos três grupos de xícaras
    const calcularPontuacaoXicaras = () => {
        const scoreDoçura = calcularPontuacaoGrupo("doçura");
        const scoreUniformidade = calcularPontuacaoGrupo("uniformidade");
        const scoreXicara = calcularPontuacaoGrupo("xicaraLimpa");
        return scoreDoçura + scoreUniformidade + scoreXicara;
    };

    // Cálculo da pontuação final:
    // Soma os atributos numéricos do objeto "notas" (exceto os grupos de xícaras)
    // Acrescenta a pontuação dos atributos de xícaras (calculada separadamente)
    // Subtrai os pontos referentes a defeitos leves e graves
    const calcularPontuacaoFinal = () => {
        let total = 0;
        Object.keys(notas).forEach((key) => {
            if (["doçura", "uniformidade", "xicaraLimpa"].includes(key)) {
                // Ignorado aqui, pois será somado separadamente
            } else {
                total += notas[key];
            }
        });
        total += calcularPontuacaoXicaras();
        total -= defeitosLeves * 2;
        total -= defeitosGraves * 4;
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
            dry,         // 0..4
            breakValue,  // 0..4
            nivelAcidez, // 0..4 – informativo
            nivelCorpo,  // 0..4 – informativo
            notas,       // Inclui os sliders de AromaFragrancia, sabor, finalizacao, acidez, corpo, equilibrio, avaliacaoGeral, e os arrays de checkboxes
            defeitosLeves,
            defeitosGraves,
            pontuacaoFinal: calcularPontuacaoFinal(),
            userId: auth.currentUser.uid,
            dataCriacao: new Date().toISOString()
        };

        await addDoc(collection(db, "avaliacoes_scaa"), avaliacao);
        alert("Avaliação SCAA salva com sucesso!");
        navigate(-1);
    };

    // Array de labels para os controles verticais (0 a 4)
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
                            { nome: "Torra Clara", cor: "#c89f83" },
                            { nome: "Torra Média Clara", cor: "#9c6b4a" },
                            { nome: "Torra Média", cor: "#5d4037" },
                            { nome: "Torra Escura", cor: "#3e2723" }
                        ].map((torra) => (
                            <div
                                key={torra.nome}
                                className={`torra-option ${torraSelecionada === torra.nome ? "selecionado" : ""
                                    }`}
                                style={{
                                    backgroundColor: torra.cor,
                                    border:
                                        torraSelecionada === torra.nome
                                            ? "4px solid #FFD700"
                                            : "2px solid #ccc",
                                    cursor: "pointer"
                                }}
                                onClick={() => setTorraSelecionada(torra.nome)}
                            >
                                {torra.nome}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 1. Controles verticais para DRY e BREAK, lado a lado */}
                <div
                    className="vertical-sliders-container"
                    style={{
                        display: "flex",
                        gap: "2rem",
                        justifyContent: "center",
                        margin: "1rem 0"
                    }}
                >
                    {/* DRY */}
                    <div
                        className="vertical-slider-box"
                        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                        <h4>Dry</h4>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                            <input
                                type="range"
                                min="0"
                                max="4"
                                step="1"
                                value={dry}
                                onChange={(e) => setDry(parseInt(e.target.value))}
                                style={{
                                    transform: "rotate(-90deg)",
                                    transformOrigin: "50% 50%",
                                    width: "150px",
                                    height: "30px",
                                    marginRight: "1rem"
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    height: "150px"
                                }}
                            >
                                {intensidades.map((label, index) => (
                                    <span
                                        key={index}
                                        style={{ fontWeight: dry === index ? "bold" : "normal" }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* BREAK */}
                    <div
                        className="vertical-slider-box"
                        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                        <h4>Break</h4>
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                            <input
                                type="range"
                                min="0"
                                max="4"
                                step="1"
                                value={breakValue}
                                onChange={(e) => setBreakValue(parseInt(e.target.value))}
                                style={{
                                    transform: "rotate(-90deg)",
                                    transformOrigin: "50% 50%",
                                    width: "150px",
                                    height: "30px",
                                    marginRight: "1rem"
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between",
                                    height: "150px"
                                }}
                            >
                                {intensidades.map((label, index) => (
                                    <span
                                        key={index}
                                        style={{ fontWeight: breakValue === index ? "bold" : "normal" }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Espaço para as notas do café */}
                <div className="nota-cafe-container">
                    <label>Notas:</label>
                    <textarea
                        value={notasCafe}
                        onChange={(e) => setNotasCafe(e.target.value)}
                        placeholder="Preencha as notas encontradas no café"
                    />
                </div>

                {/* 3. Slider para AromaFragrancia */}
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
                            <span key={num} className={num === notas.AromaFragrancia ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 4. Slider para Sabor */}
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
                            <span key={num} className={num === notas.sabor ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 5. Slider para Finalização */}
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
                            <span key={num} className={num === notas.finalizacao ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 6. Controle vertical para Nível de Acidez */}
                <div
                    className="vertical-sliders-container"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "1rem 0" }}
                >
                    <h4>Nível de Acidez</h4>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        <input
                            type="range"
                            min="0"
                            max="4"
                            step="1"
                            value={nivelAcidez}
                            onChange={(e) => setNivelAcidez(parseInt(e.target.value))}
                            style={{
                                transform: "rotate(-90deg)",
                                transformOrigin: "50% 50%",
                                width: "150px",
                                height: "30px",
                                marginRight: "1rem"
                            }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "150px" }}>
                            {intensidades.map((label, index) => (
                                <span key={index} style={{ fontWeight: nivelAcidez === index ? "bold" : "normal" }}>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 7. Slider normal para Acidez */}
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
                            <span key={num} className={num === notas.acidez ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 8. Controle vertical para Nível de Corpo */}
                <div
                    className="vertical-sliders-container"
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "1rem 0" }}
                >
                    <h4>Nível de Corpo</h4>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        <input
                            type="range"
                            min="0"
                            max="4"
                            step="1"
                            value={nivelCorpo}
                            onChange={(e) => setNivelCorpo(parseInt(e.target.value))}
                            style={{
                                transform: "rotate(-90deg)",
                                transformOrigin: "50% 50%",
                                width: "150px",
                                height: "30px",
                                marginRight: "1rem"
                            }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "150px" }}>
                            {intensidades.map((label, index) => (
                                <span key={index} style={{ fontWeight: nivelCorpo === index ? "bold" : "normal" }}>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 9. Slider normal para Corpo */}
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
                            <span key={num} className={num === notas.corpo ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 10. Slider para Equilíbrio */}
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
                            <span key={num} className={num === notas.equilibrio ? "selecionado" : ""}>
                                {num}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 11. Grupo de checkboxes para Doçura, Uniformidade e Limpeza da Xícara */}
                <div className="nota-container">
                    <label>Doçura:</label>
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
                <div className="nota-container">
                    <label>Uniformidade:</label>
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
                <div className="nota-container">
                    <label>Limpeza da Xícara:</label>
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

                {/* 12. Grupo único para seleção da severidade (aplicada a todos os três atributos) */}
                <div className="nota-container">
                    <label>
                        Selecione a severidade dos defeitos (aplicada para Doçura, Uniformidade e Limpeza da Xícara):
                    </label>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                name="defeito_severity"
                                value="2"
                                checked={fatorDefeito === 2}
                                onChange={() => setFatorDefeito(2)}
                            />
                            Defeito Leve
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="defeito_severity"
                                value="4"
                                checked={fatorDefeito === 4}
                                onChange={() => setFatorDefeito(4)}
                            />
                            Defeito Grave
                        </label>
                    </div>
                </div>

                {/* Exibição do total de pontuação dos grupos de xícaras */}
                <div className="nota-container">
                    <label>Pontuação dos atributos de xícaras:</label>
                    <div className="nota-valor">
                        {(() => {
                            const scoreDoçura = Math.max(
                                10 - notas.doçura.filter(v => v).length * 2 * fatorDefeito,
                                0
                            );
                            const scoreUniformidade = Math.max(
                                10 - notas.uniformidade.filter(v => v).length * 2 * fatorDefeito,
                                0
                            );
                            const scoreXicara = Math.max(
                                10 - notas.xicaraLimpa.filter(v => v).length * 2 * fatorDefeito,
                                0
                            );
                            return (scoreDoçura + scoreUniformidade + scoreXicara).toFixed(2);
                        })()}
                    </div>
                </div>

                {/* 13. Defeitos */}
                <div className="defeitos">
                    <label>Defeitos Leves (2 pontos para defeitos leves):</label>
                    <input
                        type="number"
                        min="0"
                        value={defeitosLeves}
                        onChange={(e) => setDefeitosLeves(parseInt(e.target.value) || 0)}
                    />
                    <label>Defeitos Graves (4 pontos para defeitos graves):</label>
                    <input
                        type="number"
                        min="0"
                        value={defeitosGraves}
                        onChange={(e) => setDefeitosGraves(parseInt(e.target.value) || 0)}
                    />
                </div>

                {/* 14. Pontuação Final */}
                <div className="pontuacao-final">
                    <h3>Pontuação Final: {calcularPontuacaoFinal()}</h3>
                </div>

                <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
            </div>
        </div>
    );
};

export default Scaa;
