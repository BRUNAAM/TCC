import "./Scaa.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
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

    // Atualizamos o estado para incluir o slider "nível".
    // A ordem das propriedades define a ordem dos sliders:
    // Dry, Break, AromaFragrancia, sabor, finalizacao, intensidade, acidez, nível, corpo, equilíbrio, doçura, uniformidade, xicaraLimpa, avaliacaoGeral.
    const [notas, setNotas] = useState({
        Dry: 6,
        Break: 6,
        AromaFragrancia: 6,
        sabor: 6,
        finalizacao: 6,
        intensidade: 1, // Slider de Intensidade (0: Baixo, 1: Médio, 2: Alto)
        acidez: 6,
        nivel: 1, // Novo slider Nível (0: Baixo, 1: Médio, 2: Alto)
        corpo: 6,
        equilibrio: 6,
        doçura: 10,
        uniformidade: 10,
        xicaraLimpa: 10,
        avaliacaoGeral: 6
    });
    const [autoAroma, setAutoAroma] = useState(true);

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
        const listaFornecedores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFornecedores(listaFornecedores);
    };

    const handleNotaChange = (categoria, valor) => {
        if (categoria === "Dry" || categoria === "Break") {
            setNotas((prevNotas) => {
                const updatedNotas = { ...prevNotas, [categoria]: parseFloat(valor) };
                if (autoAroma) {
                    updatedNotas.AromaFragrancia = (updatedNotas.Dry + updatedNotas.Break) / 2;
                }
                return updatedNotas;
            });
        } else if (categoria === "AromaFragrancia") {
            // Ao alterar manualmente, desabilitamos o modo automático.
            setAutoAroma(false);
            setNotas((prevNotas) => ({ ...prevNotas, AromaFragrancia: parseFloat(valor) }));
        } else if (categoria === "intensidade" || categoria === "nivel") {
            // Para os sliders "intensidade" e "nível", utilizamos valores inteiros: 0, 1 ou 2.
            setNotas((prevNotas) => ({ ...prevNotas, [categoria]: parseInt(valor) }));
        } else {
            setNotas((prevNotas) => ({ ...prevNotas, [categoria]: parseFloat(valor) }));
        }
    };

    // Função para resetar o AromaFragrancia para o modo automático.
    const resetAromaFragrancia = () => {
        setAutoAroma(true);
        setNotas((prevNotas) => ({
            ...prevNotas,
            AromaFragrancia: (prevNotas.Dry + prevNotas.Break) / 2
        }));
    };

    const calcularPontuacaoFinal = () => {
        let total = Object.values(notas).reduce((acc, val) => acc + val, 0);
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
            notas,
            defeitosLeves,
            defeitosGraves,
            pontuacaoFinal: calcularPontuacaoFinal(),
            dataCriacao: new Date().toISOString()
        };

        await addDoc(collection(db, "avaliacoes_scaa"), avaliacao);
        alert("Avaliação SCAA salva com sucesso!");
        navigate(-1);
    };

    return (
        <div className="scaa-container">
            <div className="scaa-header">
                <h2>Avaliação Sensorial de Café - SCAA</h2>
                <button className="close-button" onClick={() => navigate(-1)}>✖</button>
            </div>

            <div className="scaa-form">
                <label>Nome do Avaliador:</label>
                <input type="text" value={avaliador} disabled />

                <label>Data:</label>
                <input type="date" value={data} disabled />

                <label>Fornecedor:</label>
                <select value={fornecedorSelecionado} onChange={(e) => setFornecedorSelecionado(e.target.value)}>
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.map(fornecedor => (
                        <option key={fornecedor.id} value={fornecedor.nome}>{fornecedor.nome}</option>
                    ))}
                </select>

                <label>N° da Amostra:</label>
                <input type="text" value={numeroAmostra} onChange={(e) => setNumeroAmostra(e.target.value)} placeholder="Digite o número da amostra" />

                <label>Observações:</label>
                <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Adicione observações..." />

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
                                className={`torra-option ${torraSelecionada === torra.nome ? "selecionado" : ""}`}
                                style={{
                                    backgroundColor: torra.cor,
                                    border: torraSelecionada === torra.nome ? "4px solid #FFD700" : "2px solid #ccc",
                                    cursor: "pointer"
                                }}
                                onClick={() => setTorraSelecionada(torra.nome)}
                            >
                                {torra.nome}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notas de Avaliação */}
                {Object.keys(notas).map((categoria) => (
                    <div key={categoria} className="nota-container">
                        <label>
                            {categoria === "intensidade"
                                ? "Intensidade"
                                : categoria === "nivel"
                                    ? "Nível"
                                    : categoria.replace(/([A-Z])/g, " $1").trim()}
                            :
                        </label>
                        {["intensidade", "nivel"].includes(categoria) ? (
                            <>
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="1"
                                    value={notas[categoria]}
                                    onChange={(e) => handleNotaChange(categoria, e.target.value)}
                                />
                                <div className="escala-notas">
                                    {["Baixo", "Médio", "Alto"].map((label, index) => (
                                        <span key={index} className={Number(notas[categoria]) === index ? "selecionado" : ""}>
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <input
                                    type="range"
                                    min="6"
                                    max="10"
                                    step="0.5"
                                    value={notas[categoria]}
                                    onChange={(e) => handleNotaChange(categoria, e.target.value)}
                                />
                                <div className="escala-notas">
                                    {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((num) => (
                                        <span key={num} className={num === notas[categoria] ? "selecionado" : ""}>
                                            {num}
                                        </span>
                                    ))}
                                </div>
                                {categoria === "AromaFragrancia" && !autoAroma && (
                                    <button type="button" onClick={resetAromaFragrancia}>
                                        Resetar para automático
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ))}

                {/* Defeitos */}
                <div className="defeitos">
                    <label>Defeitos Leves:</label>
                    <input type="number" min="0" value={defeitosLeves} onChange={(e) => setDefeitosLeves(parseInt(e.target.value) || 0)} />

                    <label>Defeitos Graves:</label>
                    <input type="number" min="0" value={defeitosGraves} onChange={(e) => setDefeitosGraves(parseInt(e.target.value) || 0)} />
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
