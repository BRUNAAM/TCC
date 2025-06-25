"use client"

import { useState, useEffect } from "react"
import "./Fornecedores.css"
import { useData } from "../context/DataContext" // ✅ CORRIGIDO - removido import duplicado
import { db } from "../config/firebase" // ✅ ADICIONADO - import do Firebase
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore" // ✅ ADICIONADO
import { getAuth } from "firebase/auth" // ✅ ADICIONADO
import { useNavigate } from "react-router-dom" // ✅ ADICIONADO

function Fornecedores() {
    const [nome, setNome] = useState("")
    const [rua, setRua] = useState("")
    const [bairro, setBairro] = useState("")
    const [cidade, setCidade] = useState("")
    const [cep, setCep] = useState("")
    const [telefone, setTelefone] = useState("")
    const [idParaEditar, setIdParaEditar] = useState(null)
    const [salvando, setSalvando] = useState(false) // ✅ ADICIONADO

    const { fornecedores, loading } = useData()
    const navigate = useNavigate() // ✅ ADICIONADO

    useEffect(() => {
        // Bloquear voltar
        const bloquearVoltar = (e) => {
            e.preventDefault()
            window.history.pushState(null, null, window.location.href)
        }

        window.history.pushState(null, null, window.location.href)
        window.addEventListener("popstate", bloquearVoltar)

        return () => {
            window.removeEventListener("popstate", bloquearVoltar)
        }
    }, [])

    const handleCadastro = async (e) => {
        e.preventDefault()

        if (!nome.trim()) {
            alert("Por favor, preencha o nome do fornecedor.")
            return
        }

        setSalvando(true)

        try {
            const authInstance = getAuth()
            const user = authInstance.currentUser

            if (!user) {
                alert("Usuário não autenticado.")
                setSalvando(false)
                return
            }

            const fornecedorData = {
                nome: nome.trim(),
                rua: rua.trim(),
                bairro: bairro.trim(),
                cidade: cidade.trim(),
                cep: cep.trim(),
                telefone: telefone.trim(),
                dataCriacao: new Date().toISOString(),
                userId: user.uid,
            }

            if (idParaEditar) {
                // Atualizar fornecedor existente
                updateDoc(doc(db, "usuarios", user.uid, "fornecedores", idParaEditar), fornecedorData)
                    .then(() => {
                        alert("Fornecedor atualizado com sucesso!")
                        setIdParaEditar(null)
                    })
                    .catch((error) => {
                        console.error("Erro ao salvar fornecedor:", error)
                        alert("Erro ao salvar fornecedor. Tente novamente mais tarde.")
                    })
                    .finally(() => {
                        setSalvando(false)
                    })
            } else {
                // Adicionar novo fornecedor
                addDoc(collection(db, "usuarios", user.uid, "fornecedores"), fornecedorData)
                    .then(() => {
                        alert("Fornecedor cadastrado com sucesso!")
                    })
                    .catch((error) => {
                        console.error("Erro ao salvar fornecedor:", error)
                        alert("Erro ao salvar fornecedor. Tente novamente mais tarde.")
                    })
                    .finally(() => {
                        setSalvando(false)
                    })
            }

            // Limpar formulário
            setNome("")
            setRua("")
            setBairro("")
            setCidade("")
            setCep("")
            setTelefone("")
        } catch (error) {
            console.error("Erro ao salvar fornecedor:", error)
            alert("Erro ao salvar fornecedor. Tente novamente mais tarde.")
        }
    }

    const handleEditar = (fornecedor) => {
        setIdParaEditar(fornecedor.id)
        setNome(fornecedor.nome || "")
        setRua(fornecedor.rua || "")
        setBairro(fornecedor.bairro || "")
        setCidade(fornecedor.cidade || "")
        setCep(fornecedor.cep || "")
        setTelefone(fornecedor.telefone || "")

        // Scroll para o topo do formulário
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleExcluir = (fornecedor) => {
        const confirmar = window.confirm(`Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?`)

        if (confirmar) {
            // código de exclusão aqui
            const authInstance = getAuth()
            const user = authInstance.currentUser

            if (!user) {
                alert("Usuário não autenticado.")
                return
            }

            deleteDoc(doc(db, "usuarios", user.uid, "fornecedores", fornecedor.id))
                .then(() => {
                    alert("Fornecedor excluído com sucesso!")
                })
                .catch((error) => {
                    console.error("Erro ao excluir fornecedor:", error)
                    alert("Erro ao excluir fornecedor. Tente novamente mais tarde.")
                })
        }
    }

    const cancelarEdicao = () => {
        setIdParaEditar(null)
        setNome("")
        setRua("")
        setBairro("")
        setCidade("")
        setCep("")
        setTelefone("")
    }

    return (
        <div className="container-fornecedores">
            {/* Header com botão de fechar */}
            <div className="fornecedores-header">
                <h1>{idParaEditar ? "Editar Fornecedor" : "Cadastro de Fornecedores"}</h1>
                <button className="fechar" onClick={() => navigate("/logado")}>
                    ✖
                </button>
            </div>

            <form onSubmit={handleCadastro} className="form-fornecedores">
                <div className="form-group">
                    <label htmlFor="nome">Nome *:</label>
                    <input
                        type="text"
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Digite o nome do fornecedor"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="rua">Rua:</label>
                    <input type="text" id="rua" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Digite a rua" />
                </div>
                <div className="form-group">
                    <label htmlFor="bairro">Bairro:</label>
                    <input
                        type="text"
                        id="bairro"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        placeholder="Digite o bairro"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="cidade">Cidade:</label>
                    <input
                        type="text"
                        id="cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="Digite a cidade"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="cep">CEP:</label>
                    <input type="text" id="cep" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="Digite o CEP" />
                </div>
                <div className="form-group">
                    <label htmlFor="telefone">Telefone:</label>
                    <input
                        type="text"
                        id="telefone"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="Digite o telefone"
                    />
                </div>

                <div className="form-buttons">
                    <button type="submit" className="botao-cadastrar" disabled={salvando}>
                        {salvando ? "Salvando..." : idParaEditar ? "Atualizar Fornecedor" : "Cadastrar Fornecedor"}
                    </button>
                    {idParaEditar && (
                        <button type="button" className="botao-cancelar" onClick={cancelarEdicao}>
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            <h2>Lista de Fornecedores ({fornecedores.length})</h2>
            <div className="tabela-container">
                <table className="tabela-fornecedores">
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
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                                    🔄 Carregando fornecedores...
                                </td>
                            </tr>
                        ) : fornecedores.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                                    📝 Nenhum fornecedor cadastrado ainda
                                </td>
                            </tr>
                        ) : (
                            fornecedores.map((fornecedor) => (
                                <tr key={fornecedor.id}>
                                    <td>{fornecedor.nome}</td>
                                    <td>{fornecedor.rua || "-"}</td>
                                    <td>{fornecedor.bairro || "-"}</td>
                                    <td>{fornecedor.cidade || "-"}</td>
                                    <td>{fornecedor.cep || "-"}</td>
                                    <td>{fornecedor.telefone || "-"}</td>
                                    <td className="celula-acoes">
                                        <div className="acoes-botoes">
                                            <button
                                                className="botao-editar"
                                                onClick={() => handleEditar(fornecedor)}
                                                title="Editar fornecedor"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button
                                                className="botao-excluir"
                                                onClick={() => handleExcluir(fornecedor)}
                                                title="Excluir fornecedor"
                                            >
                                                <i className="bi bi-trash3"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Fornecedores
