import "./EsqueciSenha.css"
import { useState, useEffect } from "react"
import { auth } from "../config/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import logo from "../assets/logo.svg"

const EsqueciSenha = () => {
    const { usuario } = useUser()
    const [email, setEmail] = useState("")
    const [mensagem, setMensagem] = useState("")
    const [erro, setErro] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    // ✅ Impede usuários logados de acessar
    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true })
        }
    }, [usuario, navigate])

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setMensagem("")
        setErro("")
        setLoading(true)

        if (!email.includes("@")) {
            setErro("Digite um e-mail válido.")
            setLoading(false)
            return
        }

        try {
            await sendPasswordResetEmail(auth, email)
            setMensagem("Um link para redefinir sua senha foi enviado para o seu e-mail.")
            setTimeout(() => navigate("/login"), 3000)
        } catch (error) {
            if (error.code === "auth/user-not-found") {
                setErro("Este e-mail não está cadastrado.")
            } else if (error.code === "auth/invalid-email") {
                setErro("Digite um e-mail válido.")
            } else {
                setErro("Erro ao enviar e-mail. Tente novamente mais tarde.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="esqueci-container">
            <div className="esqueci-box">
                <div className="esqueci-header">
                    <button className="fechar" onClick={() => navigate("/login")} aria-label="Fechar">
                        ✖
                    </button>
                </div>

                <div className="logo-container">
                    <img src={logo || "/placeholder.svg"} alt="Logotipo do Coffee Grader" className="esqueci-logo" />
                </div>

                <h2 className="esqueci-title">RECUPERAR SENHA</h2>

                <form onSubmit={handleResetPassword} className="esqueci-form">
                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Email
                        </label>
                        <div className="input-wrapper">
                            <span className="input-icon">✉️</span>
                            <input
                                id="email"
                                type="email"
                                placeholder="Digite seu email cadastrado"
                                className="esqueci-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                aria-label="Digite seu e-mail"
                            />
                        </div>
                    </div>

                    {erro && (
                        <div className="erro-container" aria-live="assertive">
                            <span className="erro-icon">⚠️</span>
                            <p className="erro-mensagem">{erro}</p>
                        </div>
                    )}

                    {mensagem && (
                        <div className="sucesso-container" aria-live="assertive">
                            <span className="sucesso-icon">✅</span>
                            <p className="sucesso-mensagem">{mensagem}</p>
                        </div>
                    )}

                    <button
                        className={`esqueci-botao ${loading ? "esqueci-botao-loading" : ""}`}
                        type="submit"
                        disabled={loading}
                    >
                        <span className="button-icon" style={{ opacity: loading ? 0 : 1 }}>
                            🔄
                        </span>
                        <span>{loading ? "ENVIANDO..." : "ENVIAR LINK DE RECUPERAÇÃO"}</span>
                        {loading && <div className="loading-spinner"></div>}
                    </button>
                </form>

                <div className="login-link">
                    <p>
                        Lembrou sua senha?{" "}
                        <button type="button" onClick={() => navigate("/login")} className="login-link-button">
                            Voltar para login
                        </button>
                    </p>
                </div>

                <div className="app-version">
                    <p>Coffee Grader v1.0</p>
                </div>
            </div>
        </div>
    )
}

export default EsqueciSenha
