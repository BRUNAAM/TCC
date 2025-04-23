import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import "./Fornecedores.css";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

const Fornecedores = () => {
    const [fornecedores, setFornecedores] = useState([]);
    const [nome, setNome] = useState("");
    const [rua, setRua] = useState("");
    const [bairro, setBairro] = useState("");
    const [cidade, setCidade] = useState("");
    const [cep, setCep] = useState("");
    const [telefone, setTelefone] = useState("");
    const [idEdicao, setIdEdicao] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        carregarFornecedores();
    }, []);

    const carregarFornecedores = async () => {
        const querySnapshot = await getDocs(collection(db, "fornecedores"));
        setFornecedores(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const handleCadastro = async (e) => {
        e.preventDefault();

        if (idEdicao) {
            const fornecedorRef = doc(db, "fornecedores", idEdicao);
            await updateDoc(fornecedorRef, { nome, rua, bairro, cidade, cep, telefone });
        } else {
            await addDoc(collection(db, "fornecedores"), {
                nome,
                rua,
                bairro,
                cidade,
                cep,
                telefone
            });

            navigate("/cob", { state: { fornecedorRecemCadastrado: nome } });
        }

        limparCampos();
        carregarFornecedores();
    };

    const handleEditar = (fornecedor) => {
        setIdEdicao(fornecedor.id);
        setNome(fornecedor.nome);
        setRua(fornecedor.rua);
        setBairro(fornecedor.bairro);
        setCidade(fornecedor.cidade);
        setCep(fornecedor.cep);
        setTelefone(fornecedor.telefone);
    };

    const handleExcluir = async (id) => {
        if (window.confirm("Deseja realmente excluir este fornecedor?")) {
            await deleteDoc(doc(db, "fornecedores", id));
            carregarFornecedores();
        }
    };

    const limparCampos = () => {
        setIdEdicao(null);
        setNome("");
        setRua("");
        setBairro("");
        setCidade("");
        setCep("");
        setTelefone("");
    };

    return (
        <div className="fornecedores-container">
            <div className="historico-header">
                <h2>Cadastro de Produtores / Fornecedores</h2>
                <div className="botoes-topo">
                    <button className="botao-voltar" onClick={() => navigate(-1)} title="Voltar">
                        <i className="bi bi-arrow-return-left"></i>
                    </button>
                </div>
            </div>

            <form onSubmit={handleCadastro} className="fornecedor-form">
                <input type="text" placeholder="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
                <input type="text" placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)} required />
                <input type="text" placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} required />
                <input type="text" placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} required />
                <input type="text" placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} required />
                <input type="text" placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
                <div className="form-actions">
                    <button type="submit">{idEdicao ? "ATUALIZAR" : "CADASTRAR"}</button>
                    {idEdicao && <button type="button" className="cancelar" onClick={limparCampos}>CANCELAR</button>}
                </div>
            </form>

            <div className="tabela-responsiva">
                <table className="fornecedores-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Rua</th>
                            <th>Bairro</th>
                            <th>Cidade</th>
                            <th>CEP</th>
                            <th>Telefone</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fornecedores.map((fornecedor) => (
                            <tr key={fornecedor.id}>
                                <td>{fornecedor.nome}</td>
                                <td>{fornecedor.rua}</td>
                                <td>{fornecedor.bairro}</td>
                                <td>{fornecedor.cidade}</td>
                                <td>{fornecedor.cep}</td>
                                <td>{fornecedor.telefone}</td>
                                <td className="celula-acoes">
                                    <div className="acoes-botoes">
                                        <button className="botao-editar" onClick={() => handleEditar(fornecedor)} title="Editar fornecedor">
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button className="botao-excluir" onClick={() => handleExcluir(fornecedor.id)} title="Excluir fornecedor">
                                            <i className="bi bi-trash3"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Fornecedores;
