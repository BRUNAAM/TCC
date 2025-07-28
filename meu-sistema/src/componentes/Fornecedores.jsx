"use client"
import { useState, useEffect } from "react"
import "./Fornecedores.css"
import { useData } from "../context/DataContext"
import { db } from "../config/firebase"
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { useNavigate } from "react-router-dom"

function Fornecedores() {
    const [nome, setNome] = useState("")
    const [rua, setRua] = useState("")
    const [bairro, setBairro] = useState("")
    const [cidade, setCidade] = useState("")
    const [cep, setCep] = useState("")
    const [telefone, setTelefone] = useState("")
    const [idParaEditar, setIdParaEditar] = useState(null)
    const [salvando, setSalvando] = useState(false)
    const [filtro, setFiltro] = useState("")
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { fornecedores, loading } = useData()
    const navigate = useNavigate()

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
                await updateDoc(doc(db, "usuarios", user.uid, "fornecedores", idParaEditar), fornecedorData)
                alert("Fornecedor atualizado com sucesso!")
                setIdParaEditar(null)
            } else {
                // Adicionar novo fornecedor
                await addDoc(collection(db, "usuarios", user.uid, "fornecedores"), fornecedorData)
                alert("Fornecedor cadastrado com sucesso!")
            }

            // Limpar formulário
            setNome("")
            setRua("")
            setBairro("")
            setCidade("")
            setCep("")
            setTelefone("")
            setMostrarFormulario(false)
        } catch (error) {
            console.error("Erro ao salvar fornecedor:", error)
            alert("Erro ao salvar fornecedor. Tente novamente mais tarde.")
        } finally {
            setSalvando(false)
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
        setMostrarFormulario(true)
        // Scroll para o topo do formulário
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleExcluir = async (fornecedor) => {
        const confirmar = window.confirm(`Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?`)
        if (confirmar) {
            try {
                const authInstance = getAuth()
                const user = authInstance.currentUser
                if (!user) {
                    alert("Usuário não autenticado.")
                    return
                }

                await deleteDoc(doc(db, "usuarios", user.uid, "fornecedores", fornecedor.id))
                alert("Fornecedor excluído com sucesso!")
            } catch (error) {
                console.error("Erro ao excluir fornecedor:", error)
                alert("Erro ao excluir fornecedor. Tente novamente mais tarde.")
            }
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
        setMostrarFormulario(false)
    }

    const formatarTelefone = (valor) => {
        const numeros = valor.replace(/\D/g, "")
        if (numeros.length <= 10) {
            return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
        } else {
            return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
        }
    }

    const formatarCEP = (valor) => {
        const numeros = valor.replace(/\D/g, "")
        return numeros.replace(/(\d{5})(\d{3})/, "$1-$2")
    }

    const fornecedoresFiltrados = fornecedores.filter(
        (fornecedor) =>
            fornecedor.nome.toLowerCase().includes(filtro.toLowerCase()) ||
            fornecedor.cidade?.toLowerCase().includes(filtro.toLowerCase()) ||
            fornecedor.telefone?.includes(filtro),
    )

    return (
        <div className="fornecedores-container">
            {/* Header fixo */}
            <div className="fornecedores-header">
                <div className="header-content">
                    <h1>
                        <span className="icon">🏢</span>
                        Fornecedores
                    </h1>
                    <div className="header-actions">
                        <button className="btn-novo" onClick={() => setMostrarFormulario(!mostrarFormulario)}>
                            <span className="icon">➕</span>
                            {mostrarFormulario ? "Ocultar" : "Novo"}
                        </button>
                        <button className="btn-fechar" onClick={() => navigate("/logado")}>
                            <span className="icon">✖</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="fornecedores-content">
                {/* Formulário colapsável */}
                {mostrarFormulario && (
                    <div className="form-container">
                        <div className="form-header">
                            <h2>
                                <span className="icon">{idParaEditar ? "✏️" : "➕"}</span>
                                {idParaEditar ? "Editar Fornecedor" : "Novo Fornecedor"}
                            </h2>
                        </div>

                        <form onSubmit={handleCadastro} className="fornecedor-form">
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="nome">
                                        <span className="icon">👤</span>
                                        Nome do Fornecedor *
                                    </label>
                                    <input
                                        type="text"
                                        id="nome"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        placeholder="Digite o nome completo"
                                        required
                                        className="input-destaque"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="telefone">
                                        <span className="icon">📞</span>
                                        Telefone
                                    </label>
                                    <input
                                        type="text"
                                        id="telefone"
                                        value={telefone}
                                        onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                                        placeholder="(11) 99999-9999"
                                        maxLength="15"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="cep">
                                        <span className="icon">📮</span>
                                        CEP
                                    </label>
                                    <input
                                        type="text"
                                        id="cep"
                                        value={cep}
                                        onChange={(e) => setCep(formatarCEP(e.target.value))}
                                        placeholder="12345-678"
                                        maxLength="9"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="rua">
                                        <span className="icon">🏠</span>
                                        Endereço
                                    </label>
                                    <input
                                        type="text"
                                        id="rua"
                                        value={rua}
                                        onChange={(e) => setRua(e.target.value)}
                                        placeholder="Rua, número"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="bairro">
                                        <span className="icon">🏘️</span>
                                        Bairro
                                    </label>
                                    <input
                                        type="text"
                                        id="bairro"
                                        value={bairro}
                                        onChange={(e) => setBairro(e.target.value)}
                                        placeholder="Nome do bairro"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="cidade">
                                        <span className="icon">🏙️</span>
                                        Cidade
                                    </label>
                                    <input
                                        type="text"
                                        id="cidade"
                                        value={cidade}
                                        onChange={(e) => setCidade(e.target.value)}
                                        placeholder="Nome da cidade"
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-salvar" disabled={salvando}>
                                    <span className="icon">{salvando ? "⏳" : "💾"}</span>
                                    {salvando ? "Salvando..." : idParaEditar ? "Atualizar" : "Cadastrar"}
                                </button>
                                {idParaEditar && (
                                    <button type="button" className="btn-cancelar" onClick={cancelarEdicao}>
                                        <span className="icon">❌</span>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de fornecedores */}
                <div className="lista-container">
                    <div className="lista-header">
                        <h2>
                            <span className="icon">📋</span>
                            Fornecedores Cadastrados ({fornecedoresFiltrados.length})
                        </h2>
                        <div className="filtro-container">
                            <input
                                type="text"
                                placeholder="🔍 Buscar por nome, cidade ou telefone..."
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value)}
                                className="input-filtro"
                            />
                        </div>
                    </div>

                    <div className="fornecedores-grid">
                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Carregando fornecedores...</p>
                            </div>
                        ) : fornecedoresFiltrados.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📝</span>
                                <h3>Nenhum fornecedor encontrado</h3>
                                <p>{filtro ? "Tente ajustar os filtros de busca" : "Cadastre seu primeiro fornecedor"}</p>
                            </div>
                        ) : (
                            fornecedoresFiltrados.map((fornecedor) => (
                                <div key={fornecedor.id} className="fornecedor-card">
                                    <div className="card-header">
                                        <h3>
                                            <span className="icon">🏢</span>
                                            {fornecedor.nome}
                                        </h3>
                                        <div className="card-actions">
                                            <button className="btn-editar" onClick={() => handleEditar(fornecedor)} title="Editar fornecedor">
                                                <span className="icon">✏️</span>
                                            </button>
                                            <button
                                                className="btn-excluir"
                                                onClick={() => handleExcluir(fornecedor)}
                                                title="Excluir fornecedor"
                                            >
                                                <span className="icon">🗑️</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        {fornecedor.telefone && (
                                            <div className="info-item">
                                                <span className="icon">📞</span>
                                                <span>{fornecedor.telefone}</span>
                                            </div>
                                        )}
                                        {(fornecedor.rua || fornecedor.bairro || fornecedor.cidade) && (
                                            <div className="info-item">
                                                <span className="icon">📍</span>
                                                <span>{[fornecedor.rua, fornecedor.bairro, fornecedor.cidade].filter(Boolean).join(", ")}</span>
                                            </div>
                                        )}
                                        {fornecedor.cep && (
                                            <div className="info-item">
                                                <span className="icon">📮</span>
                                                <span>{fornecedor.cep}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Fornecedores
