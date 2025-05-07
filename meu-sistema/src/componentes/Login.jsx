"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../config/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import "./Login.css"
import logo from "../assets/logo.svg"
import { useUser } from "../context/UserContext"

const Login = () => {
    const { usuario, setUsuario } = useUser()
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [erro, setErro] = useState("")
    const [loading, setLoading] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const navigate = useNavigate()

    // ⛔ Redireciona se já estiver logado
    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true })
        }
    }, [usuario, navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!email || !senha) {
            setErro("Preencha todos os campos.")
            return
        }
        if (loading) return

        setErro("")
        setLoading(true)

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, senha)
            const user = userCredential.user

            let usuarioNome = user.displayName || ""

            const userDoc = await getDoc(doc(db, "usuarios", user.uid))
            if (userDoc.exists()) {
                usuarioNome = userDoc.data().nome
            }

            localStorage.setItem("usuarioNome", usuarioNome)
            setUsuario({ nome: usuarioNome, email: user.email })

            navigate("/logado", { replace: true }) // ← Impede botão voltar
        } catch (error) {
            const mensagensErro = {
                "auth/user-not-found": "Usuário não encontrado. Verifique o e-mail.",
                "auth/wrong-password": "Senha incorreta. Tente novamente.",
                "auth/invalid-email": "Formato de e-mail inválido.",
                "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
                "auth/network-request-failed": "Erro de rede. Verifique sua conexão.",
            }
            setErro(mensagensErro[error.code] || "Erro ao fazer login. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    const alternarVisibilidadeSenha = () => {
        setMostrarSenha(!mostrarSenha)
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <img src={logo || "/placeholder.svg"} alt="Logotipo do Coffee Grader" className="login-logo" />
                </div>

                <h2 className="login-title">FAÇA SEU LOGIN</h2>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Email
                        </label>
                        <div className="input-wrapper">
                            <span className="input-icon">✉️</span>
                            <input
                                autoFocus
                                id="email"
                                type="email"
                                placeholder="Digite seu email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value.trim())}
                                className="login-input"
                                required
                                aria-label="Digite seu e-mail"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="senha" className="input-label">
                            Senha
                        </label>
                        <div className="senha-container input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                id="senha"
                                type={mostrarSenha ? "text" : "password"}
                                placeholder="Digite sua senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value.trim())}
                                className="login-input"
                                required
                                aria-label="Digite sua senha"
                            />
                            <button
                                type="button"
                                className="toggle-senha-btn"
                                onClick={alternarVisibilidadeSenha}
                                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                            >
                                <i className={`bi ${mostrarSenha ? "bi-eye-slash" : "bi-eye"}`}></i>
                            </button>
                        </div>
                    </div>

                    {erro && (
                        <div className="erro-container" aria-live="assertive">
                            <span className="erro-icon">⚠️</span>
                            <p className="login-erro">{erro}</p>
                        </div>
                    )}

                    <div className="buttons-container">
                        <button
                            className={`login-button ${loading ? "login-button-loading" : ""}`}
                            type="submit"
                            disabled={loading}
                        >
                            <span className="button-icon" style={{ opacity: loading ? 0 : 1 }}>
                                🔑
                            </span>
                            <span>{loading ? "Entrando..." : "FAZER LOGIN"}</span>
                            {loading && <div className="loading-spinner"></div>}
                        </button>

                        <button className="register-button" onClick={() => navigate("/cadastro")} type="button">
                            <span className="button-icon">📝</span>
                            <span>CRIAR CONTA</span>
                        </button>
                    </div>

                    <div className="forgot-password">
                        <button className="forgot-password-link" onClick={() => navigate("/esquecisenha")} type="button">
                            Esqueci minha senha!
                        </button>
                    </div>
                </form>

                <div className="app-version">
                    <p>Coffee Grader v1.0</p>
                </div>
            </div>
        </div>
    )
}

export default Login
