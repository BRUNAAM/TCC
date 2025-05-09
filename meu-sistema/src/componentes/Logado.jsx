import "./Logado.css"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../config/firebase"
import { useUser } from "../context/UserContext"
import logo from "../assets/logo.svg"

const Logado = () => {
    const { usuario, setUsuario } = useUser()
    const navigate = useNavigate()

    // ✅ Proteção extra: redireciona se não estiver logado
    useEffect(() => {
        if (!usuario) {
            const nomeSalvo = localStorage.getItem("usuarioNome")
            if (nomeSalvo) {
                setUsuario({ nome: nomeSalvo }) // repõe o contexto
            } else {
                navigate("/login", { replace: true })
            }
        }
    }, [usuario, navigate, setUsuario])

    const handleLogout = async () => {
        try {
            await signOut(auth)
            setUsuario(null)
            localStorage.removeItem("usuarioNome") // ← remove nome salvo
            navigate("/login", { replace: true })
        } catch (error) {
            console.error("Erro ao sair:", error)
        }
    }

    // Ainda carregando contexto
    if (!usuario)
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Carregando...</p>
            </div>
        )

    return (
        <main className="logado-container">
            <div className="logado-box">
                <img src={logo || "/placeholder.svg"} alt="Logotipo do Coffee Grader" className="logado-logo" />

                <div className="welcome-section">
                    <h2 className="logado-h2">Bem-vindo(a)</h2>
                    <p className="user-name">{usuario.nome}!</p>
                </div>

                <nav className="botoes-container" aria-label="Menu de navegação">
                    <button onClick={() => navigate("/cob")} className="nav-button">
                        <span className="button-icon">☕</span>
                        <span className="button-text">Iniciar Avaliação COB</span>
                    </button>

                    <button onClick={() => navigate("/scaa")} className="nav-button">
                        <span className="button-icon">☕</span>
                        <span className="button-text">Iniciar Avaliação SCAA</span>
                    </button>

                    <button onClick={() => navigate("/fornecedores")} className="nav-button">
                        <span className="button-icon">👨‍🌾</span>
                        <span className="button-text">Cadastro de Produtores / Fornecedores</span>
                    </button>

                    <button onClick={() => navigate("/historico-cob")} className="nav-button">
                        <span className="button-icon">📋</span>
                        <span className="button-text">Histórico de Avaliações COB</span>
                    </button>

                    <button onClick={() => navigate("/historico-scaa")} className="nav-button">
                        <span className="button-icon">📊</span>
                        <span className="button-text">Histórico de Avaliações SCAA</span>
                    </button>
                </nav>

                <button className="logout-button" onClick={handleLogout}>
                    <span className="logout-icon">🚪</span>
                    <span>SAIR</span>
                </button>

                <div className="app-version">
                    <p>Coffee Grader v1.0</p>
                </div>
            </div>
        </main>
    )
}

export default Logado
