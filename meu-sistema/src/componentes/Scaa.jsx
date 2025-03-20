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

    const [notas, setNotas] = useState({
        fragrancia: 6,
        aroma: 6,
        sabor: 6,
        finalizacao: 6,
        acidez: 6,
        corpo: 6,
        equilibrio: 6,
        doçura: 10,
        uniformidade: 10,
        xicaraLimpa: 10,
        avaliacaoGeral: 6
    });

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
        setNotas((prevNotas) => ({ ...prevNotas, [categoria]: parseFloat(valor) }));
    };

    const calcularPontuacaoFinal = () => {
        let total = Object.values(notas).reduce((acc, val) => acc + val, 0);
        total -= defeitosLeves * 2; // Penaliza 2 pontos por defeito leve
        total -= defeitosGraves * 4; // Penaliza 4 pontos por defeito grave
        return total.toFixed(2);
    };

    const handleSalvarAvaliacao = async () => {
        if (!fornecedorSelecionado || !numeroAmostra) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        const avaliacao = {
            avaliador,
            data,
            fornecedor: fornecedorSelecionado,
            numeroAmostra,
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

                {/* Notas de Avaliação */}
                {Object.keys(notas).map((categoria) => (
                    <div key={categoria} className="nota-container">
                        <label>{categoria.replace(/([A-Z])/g, " $1").trim()}:</label>
                        <input
                            type="range"
                            min="6"
                            max="10"
                            step="0.5"
                            value={notas[categoria]}
                            onChange={(e) => handleNotaChange(categoria, e.target.value)}
                        />
                        <span className="nota-valor">{notas[categoria]}</span>
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
                    <p>
                        Qualidade do Café:{" "}
                        <strong>
                            {calcularPontuacaoFinal() > 85
                                ? "Estritamente Mole"
                                : calcularPontuacaoFinal() >= 80
                                    ? "Mole"
                                    : calcularPontuacaoFinal() >= 75
                                        ? "Apenas Mole"
                                        : "Dura"}
                        </strong>
                    </p>
                </div>

                <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
            </div>
        </div>
    );
};

export default Scaa;
