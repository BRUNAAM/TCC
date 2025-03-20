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
    const [notas, setNotas] = useState({
        fragrancia: 6,
        aroma: 6,
        sabor: 6,
        saborResidual: 6,
        acidez: 6,
        doçura: 6,
        sensacaoBoca: 6,
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
        setNotas((prevNotas) => ({ ...prevNotas, [categoria]: parseInt(valor) }));
    };

    const calcularPontuacaoFinal = () => {
        return Object.values(notas).reduce((acc, val) => acc + val, 0);
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
                <div className="correlacao-scaa-cob">
                    <h3>Correlação SCAA-COB</h3>
                    <ul>
                        <li><strong>&gt; 85 pontos SCAA</strong> - Estritamente Mole</li>
                        <li><strong>80 a 84 pontos SCAA</strong> - Mole</li>
                        <li><strong>75 a 79 pontos SCAA</strong> - Apenas Mole</li>
                        <li><strong>&lt; 74 pontos SCAA</strong> - Dura</li>
                    </ul>
                </div>
                <br /><br />
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

                {/* Notas de Avaliação com Escala */}
                {Object.keys(notas).map((categoria) => (
                    <div key={categoria} className="nota-container">
                        <label>{categoria.replace(/([A-Z])/g, " $1").trim()}:</label>
                        <input
                            type="range"
                            min="6"
                            max="10"
                            value={notas[categoria]}
                            onChange={(e) => handleNotaChange(categoria, e.target.value)}
                        />
                        <div className="escala-notas">
                            {[6, 7, 8, 9, 10].map((num) => (
                                <span key={num} className={num === notas[categoria] ? "selecionado" : ""}>{num}</span>
                            ))}
                        </div>
                        <span className="nota-valor">Nota: {notas[categoria]}</span>
                    </div>
                ))}

                {/* Pontuação Final */}
                <p>Pontuação Final: {calcularPontuacaoFinal()}</p>

                <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
            </div>
        </div>
    );
};

export default Scaa;
