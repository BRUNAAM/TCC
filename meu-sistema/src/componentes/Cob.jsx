import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import "./Cob.css";

const Cob = () => {
    const [avaliador, setAvaliador] = useState("");
    const [fornecedores, setFornecedores] = useState([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState("");
    const [numeroAmostra, setNumeroAmostra] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [defeitos, setDefeitos] = useState({});
    const [classificacaoBebida, setClassificacaoBebida] = useState("");
    const [umidade, setUmidade] = useState("");
    const [equivalencias, setEquivalencias] = useState({});
    const [equivalenciaTotal, setEquivalenciaTotal] = useState(0);
    const navigate = useNavigate(); // Para navegação

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
        "Casca Pequena": { quantidade: 2, equivalencia: 1 }
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
        const listaFornecedores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFornecedores(listaFornecedores);
    };

    const handleDefeitoChange = (defeito, quantidade) => {
        const updatedDefeitos = { ...defeitos, [defeito]: quantidade };
        setDefeitos(updatedDefeitos);

        let totalEquivalencia = 0;
        let updatedEquivalencias = {};
        for (const [key, value] of Object.entries(updatedDefeitos)) {
            if (tabelaDefeitos[key]) {
                const equivalencia = Math.floor(value / tabelaDefeitos[key].quantidade) * tabelaDefeitos[key].equivalencia;
                updatedEquivalencias[key] = equivalencia;
                totalEquivalencia += equivalencia;
            }
        }
        setEquivalencias(updatedEquivalencias);
        setEquivalenciaTotal(totalEquivalencia);
    };

    const handleSalvarAvaliacao = async () => {
        if (!fornecedorSelecionado || !numeroAmostra || !classificacaoBebida || !umidade) {
            alert("Por favor, preencha todos os campos obrigatórios.");
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
            classificacaoBebida,
            umidade,
            data: new Date().toISOString()
        };

        await addDoc(collection(db, "avaliacoes"), avaliacao);
        alert("Avaliação salva com sucesso!");
    };

    const handleFechar = () => {
        navigate(-1); // Volta para a tela anterior
    };

    return (
        <div className="cob-container">
            {/* Botão de Fechar */}
            <div className="cob-header">
                <h2>Avaliação COB</h2>
                <button className="close-button" onClick={handleFechar}>✖</button>
            </div>

            <div className="cob-form">
                <label>Avaliador:</label>
                <input type="text" value={avaliador} disabled />

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

                <label>Defeitos Encontrados:</label>
                <div className="defeitos-checkboxes">
                    {Object.keys(tabelaDefeitos).map(defeito => (
                        <div key={defeito}>
                            <label>{defeito}:</label>
                            <input type="number" min="0" value={defeitos[defeito] || ""} onChange={(e) => handleDefeitoChange(defeito, parseInt(e.target.value) || 0)} />
                            <span> Equivalência: {equivalencias[defeito] || 0}</span>
                        </div>
                    ))}
                </div>

                <p>Equivalência Total de Defeitos: {equivalenciaTotal}</p>

                <label>Classificação da Bebida:</label>
                <select value={classificacaoBebida} onChange={(e) => setClassificacaoBebida(e.target.value)}>
                    <option value="">Selecione uma classificação</option>
                    {"Estritamente Mole,Mole,Duro,Riado,Rio".split(",").map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                </select>

                <label>Umidade (%):</label>
                <input type="number" value={umidade} onChange={(e) => setUmidade(e.target.value)} placeholder="Digite a umidade" />

                <button onClick={handleSalvarAvaliacao}>Salvar Avaliação</button>
            </div>
        </div>
    );
};

export default Cob;
