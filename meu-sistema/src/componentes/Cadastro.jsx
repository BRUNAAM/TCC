import "./Cadastro.css"
import { useEffect, useState } from "react"
import { auth, db } from "../config/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import { sendEmailVerification } from "firebase/auth"
import logo from "../assets/logo.svg"

const Cadastro = () => {
    const { setUsuario, usuario } = useUser()
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [confirmarSenha, setConfirmarSenha] = useState("")
    const [erro, setErro] = useState("")
    const [loading, setLoading] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const navigate = useNavigate()

    const validarCampos = () => {
        if (!nome.trim()) return "O nome não pode estar vazio."
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Digite um e-mail válido."
        if (!/(?=.*\d)(?=.*[a-zA-Z]).{6,}/.test(senha)) {
            return "A senha deve conter pelo menos 6 caracteres, incluindo letras e números."
        }
        if (senha !== confirmarSenha) {
            return "As senhas não coincidem."
        }
        return null // ← ESSENCIAL!
    }

    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true }) // impede voltar
        }
    }, [usuario, navigate])

    const handleCadastro = async (e) => {
        e.preventDefault()
        setErro("")
        setLoading(true)

        const erroValidacao = validarCampos()
        if (erroValidacao) {
            setErro(erroValidacao)
            setLoading(false)
            return
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha)
            const user = userCredential.user

            const nomeLimpo = nome.trim()
            const emailLimpo = email.trim()

            await updateProfile(user, { displayName: nomeLimpo })
            await sendEmailVerification(user)

            await setDoc(doc(db, "usuarios", user.uid), {
                nome: nomeLimpo,
                email: emailLimpo,
                dataCadastro: new Date().toISOString(),
            })

            setUsuario({ nome: nomeLimpo, email: emailLimpo, uid: user.uid })

            setTimeout(() => {
                alert("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.")
                navigate("/login")
            }, 300)

            // Limpa os campos
            setNome("")
            setEmail("")
            setSenha("")
            setConfirmarSenha("")
        } catch (error) {
            console.error("Erro no cadastro:", error)
            switch (error.code) {
                case "auth/email-already-in-use":
                    setErro("Este e-mail já está cadastrado. Faça login ou redefina sua senha.")
                    break
                case "auth/weak-password":
                    setErro("A senha deve ter pelo menos 6 caracteres.")
                    break
                case "auth/invalid-email":
                    setErro("Digite um e-mail válido.")
                    break
                default:
                    setErro("Ocorreu um erro inesperado. Tente novamente mais tarde.")
            }
        } finally {
            setLoading(false)
        }
    }

    const alternarVisibilidadeSenha = () => {
        setMostrarSenha(!mostrarSenha)
    }

    const handleClose = () => navigate(-1)

    return (
        <div className="cadastro-container">
            <div className="cadastro-box">
                <div className="cadastro-header">
                    <button className="fechar" onClick={handleClose} aria-label="Fechar">
                        ✖
                    </button>
                </div>

                <div className="logo-container">
                    <img src={logo || "/placeholder.svg"} alt="Logotipo do Coffee Grader" className="cadastro-logo" />
                </div>

                <h2 className="cadastro-title">CADASTRO</h2>

                <form onSubmit={handleCadastro} className="cadastro-form">
                    <div className="input-group">
                        <label htmlFor="nome" className="input-label">
                            Nome
                        </label>
                        <div className="input-wrapper">
                            <span className="input-icon">👤</span>
                            <input
                                id="nome"
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Digite seu nome completo"
                                className="cadastro-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Email
                        </label>
                        <div className="input-wrapper">
                            <span className="input-icon">✉️</span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Digite seu e-mail"
                                className="cadastro-input"
                                required
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
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="Crie uma senha segura"
                                className="cadastro-input"
                                required
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

                    <div className="input-group">
                        <label htmlFor="confirmarSenha" className="input-label">
                            Confirmar Senha
                        </label>
                        <div className="senha-container input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input
                                id="confirmarSenha"
                                type={mostrarSenha ? "text" : "password"}
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                placeholder="Confirme sua senha"
                                className="cadastro-input"
                                required
                            />
                        </div>
                    </div>

                    {erro && (
                        <div className="erro-container" aria-live="assertive">
                            <span className="erro-icon">⚠️</span>
                            <p className="erro-mensagem">{erro}</p>
                        </div>
                    )}

                    <button
                        className={`cadastro-button ${loading ? "cadastro-button-loading" : ""}`}
                        type="submit"
                        disabled={loading}
                    >
                        <span className="button-icon" style={{ opacity: loading ? 0 : 1 }}>
                            📝
                        </span>
                        <span>{loading ? "Cadastrando..." : "CADASTRAR"}</span>
                        {loading && <div className="loading-spinner"></div>}
                    </button>
                </form>

                <div className="login-link">
                    <p>
                        Já tem uma conta?{" "}
                        <button type="button" onClick={() => navigate("/login")} className="login-link-button">
                            Faça login
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

export default Cadastro
