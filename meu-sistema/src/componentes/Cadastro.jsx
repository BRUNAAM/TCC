"use client"

import "./Cadastro.css"
import { useEffect, useState, useRef } from "react"
import { auth, db } from "../config/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import { sendEmailVerification } from "firebase/auth"
import logo from "../assets/logo.svg"
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle,
    Loader2,
    X,
    Coffee,
    ArrowLeft,
    Shield,
} from "lucide-react"

const Cadastro = () => {
    const { setUsuario, usuario } = useUser()
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [confirmarSenha, setConfirmarSenha] = useState("")
    const [erro, setErro] = useState("")
    const [loading, setLoading] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
    const [validacaoSenha, setValidacaoSenha] = useState({
        tamanho: false,
        letra: false,
        numero: false,
        confirmacao: false,
    })
    const [camposFocados, setCamposFocados] = useState({})
    const navigate = useNavigate()

    // Refs para gerenciamento de foco
    const nomeRef = useRef(null)
    const emailRef = useRef(null)
    const senhaRef = useRef(null)
    const confirmarSenhaRef = useRef(null)
    const erroRef = useRef(null)
    const mainRef = useRef(null)
    const successRef = useRef(null)

    // Validação em tempo real da senha
    useEffect(() => {
        setValidacaoSenha({
            tamanho: senha.length >= 6,
            letra: /[a-zA-Z]/.test(senha),
            numero: /\d/.test(senha),
            confirmacao: senha === confirmarSenha && senha.length > 0,
        })
    }, [senha, confirmarSenha])

    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true })
        }
    }, [usuario, navigate])

    useEffect(() => {
        if (erro && erroRef.current) {
            erroRef.current.focus()
        }
    }, [erro])

    const skipToMain = (e) => {
        e.preventDefault()
        if (mainRef.current) {
            mainRef.current.focus()
        }
    }

    const validarCampos = () => {
        if (!nome.trim()) {
            nomeRef.current?.focus()
            return "Por favor, digite seu nome completo."
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailRef.current?.focus()
            return "Por favor, digite um e-mail válido."
        }
        if (!validacaoSenha.tamanho || !validacaoSenha.letra || !validacaoSenha.numero) {
            senhaRef.current?.focus()
            return "A senha deve atender a todos os critérios de segurança."
        }
        if (!validacaoSenha.confirmacao) {
            confirmarSenhaRef.current?.focus()
            return "As senhas não coincidem."
        }
        return null
    }

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
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), senha)
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

            // Anunciar sucesso para leitores de tela
            announceToScreenReader(`Cadastro realizado com sucesso! Um e-mail de verificação foi enviado para ${emailLimpo}.`)

            // Mostrar mensagem de sucesso acessível
            if (successRef.current) {
                successRef.current.focus()
            }

            setTimeout(() => {
                navigate("/login")
            }, 3000)

            // Limpa os campos
            setNome("")
            setEmail("")
            setSenha("")
            setConfirmarSenha("")
        } catch (error) {
            console.error("Erro no cadastro:", error)
            const mensagensErro = {
                "auth/email-already-in-use": "Este e-mail já está cadastrado. Faça login ou redefina sua senha.",
                "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
                "auth/invalid-email": "Digite um e-mail válido.",
                "auth/network-request-failed": "Erro de conexão. Verifique sua internet e tente novamente.",
            }
            setErro(mensagensErro[error.code] || "Ocorreu um erro inesperado. Tente novamente mais tarde.")
        } finally {
            setLoading(false)
        }
    }

    const alternarVisibilidadeSenha = () => {
        setMostrarSenha(!mostrarSenha)
        setTimeout(() => {
            senhaRef.current?.focus()
        }, 0)
    }

    const alternarVisibilidadeConfirmarSenha = () => {
        setMostrarConfirmarSenha(!mostrarConfirmarSenha)
        setTimeout(() => {
            confirmarSenhaRef.current?.focus()
        }, 0)
    }

    const handleClose = () => {
        navigate(-1)
    }

    const handleFocus = (campo) => {
        setCamposFocados((prev) => ({ ...prev, [campo]: true }))
    }

    const handleBlur = (campo) => {
        setCamposFocados((prev) => ({ ...prev, [campo]: false }))
    }

    const announceToScreenReader = (message) => {
        const announcement = document.createElement("div")
        announcement.setAttribute("aria-live", "polite")
        announcement.setAttribute("aria-atomic", "true")
        announcement.className = "sr-only"
        announcement.textContent = message
        document.body.appendChild(announcement)
        setTimeout(() => {
            document.body.removeChild(announcement)
        }, 1000)
    }

    const getPasswordStrength = () => {
        const criteria = Object.values(validacaoSenha).filter(Boolean).length
        if (criteria === 0) return { level: 0, text: "Muito fraca" }
        if (criteria === 1) return { level: 1, text: "Fraca" }
        if (criteria === 2) return { level: 2, text: "Regular" }
        if (criteria === 3) return { level: 3, text: "Boa" }
        return { level: 4, text: "Forte" }
    }

    const passwordStrength = getPasswordStrength()

    return (
        <>
            {/* Skip Link */}
            <a href="#main-content" className="skip-link" onClick={skipToMain}>
                Pular para o formulário de cadastro
            </a>

            <div className="page-wrapper">
                <header className="sr-only">
                    <h1>Coffee Grader - Cadastro de Nova Conta</h1>
                </header>

                <main
                    id="main-content"
                    className="cadastro-container"
                    ref={mainRef}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página de cadastro do Coffee Grader"
                >
                    <div className="cadastro-box" role="region" aria-labelledby="cadastro-title">
                        <div className="cadastro-header">
                            <button
                                className="fechar"
                                onClick={handleClose}
                                aria-label="Fechar formulário de cadastro e voltar à página anterior"
                                type="button"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="logo-container">
                            <img
                                src={logo || "/placeholder.svg?height=100&width=100"}
                                alt="Coffee Grader - Sistema de avaliação sensorial de cafés"
                                className="cadastro-logo"
                                width="100"
                                height="100"
                            />
                        </div>

                        <h1 id="cadastro-title" className="cadastro-title">
                            Criar Nova Conta
                        </h1>

                        <form onSubmit={handleCadastro} className="cadastro-form" noValidate>
                            <div className="input-group">
                                <label htmlFor="nome" className="input-label">
                                    Nome Completo *
                                </label>
                                <div className="input-wrapper">
                                    <User className="input-icon" aria-hidden="true" size={18} />
                                    <input
                                        ref={nomeRef}
                                        id="nome"
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        onFocus={() => handleFocus("nome")}
                                        onBlur={() => handleBlur("nome")}
                                        placeholder="Digite seu nome completo"
                                        className="cadastro-input"
                                        required
                                        autoComplete="name"
                                        aria-describedby="nome-desc"
                                        aria-invalid={erro && erro.includes("nome") ? "true" : "false"}
                                    />
                                </div>
                                <div id="nome-desc" className="sr-only">
                                    Digite seu nome completo como aparece em seus documentos
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="email" className="input-label">
                                    E-mail *
                                </label>
                                <div className="input-wrapper">
                                    <Mail className="input-icon" aria-hidden="true" size={18} />
                                    <input
                                        ref={emailRef}
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => handleFocus("email")}
                                        onBlur={() => handleBlur("email")}
                                        placeholder="Digite seu e-mail"
                                        className="cadastro-input"
                                        required
                                        autoComplete="email"
                                        aria-describedby="email-desc"
                                        aria-invalid={erro && erro.includes("e-mail") ? "true" : "false"}
                                    />
                                </div>
                                <div id="email-desc" className="sr-only">
                                    Digite um e-mail válido. Você receberá um link de verificação neste endereço
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="senha" className="input-label">
                                    Senha *
                                </label>
                                <div className="senha-container input-wrapper">
                                    <Lock className="input-icon" aria-hidden="true" size={18} />
                                    <input
                                        ref={senhaRef}
                                        id="senha"
                                        type={mostrarSenha ? "text" : "password"}
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        onFocus={() => handleFocus("senha")}
                                        onBlur={() => handleBlur("senha")}
                                        placeholder="Crie uma senha segura"
                                        className="cadastro-input"
                                        required
                                        autoComplete="new-password"
                                        aria-describedby="senha-criterios senha-forca"
                                        aria-invalid={senha.length > 0 && !validacaoSenha.tamanho ? "true" : "false"}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-senha-btn"
                                        onClick={alternarVisibilidadeSenha}
                                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                    </button>
                                </div>

                                {/* Indicador de força da senha */}
                                {senha.length > 0 && (
                                    <div className="password-strength" aria-live="polite">
                                        <div className="strength-bar">
                                            <div
                                                className={`strength-fill strength-${passwordStrength.level}`}
                                                style={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="strength-text">Força: {passwordStrength.text}</span>
                                    </div>
                                )}

                                {/* Critérios da senha */}
                                {(camposFocados.senha || senha.length > 0) && (
                                    <div id="senha-criterios" className="password-criteria" role="group" aria-label="Critérios da senha">
                                        <p className="criteria-title">Sua senha deve conter:</p>
                                        <ul className="criteria-list">
                                            <li className={validacaoSenha.tamanho ? "criteria-met" : "criteria-unmet"}>
                                                {validacaoSenha.tamanho ? (
                                                    <CheckCircle size={14} aria-hidden="true" />
                                                ) : (
                                                    <AlertCircle size={14} aria-hidden="true" />
                                                )}
                                                <span>Pelo menos 6 caracteres</span>
                                            </li>
                                            <li className={validacaoSenha.letra ? "criteria-met" : "criteria-unmet"}>
                                                {validacaoSenha.letra ? (
                                                    <CheckCircle size={14} aria-hidden="true" />
                                                ) : (
                                                    <AlertCircle size={14} aria-hidden="true" />
                                                )}
                                                <span>Pelo menos uma letra</span>
                                            </li>
                                            <li className={validacaoSenha.numero ? "criteria-met" : "criteria-unmet"}>
                                                {validacaoSenha.numero ? (
                                                    <CheckCircle size={14} aria-hidden="true" />
                                                ) : (
                                                    <AlertCircle size={14} aria-hidden="true" />
                                                )}
                                                <span>Pelo menos um número</span>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="input-group">
                                <label htmlFor="confirmarSenha" className="input-label">
                                    Confirmar Senha *
                                </label>
                                <div className="senha-container input-wrapper">
                                    <Shield className="input-icon" aria-hidden="true" size={18} />
                                    <input
                                        ref={confirmarSenhaRef}
                                        id="confirmarSenha"
                                        type={mostrarConfirmarSenha ? "text" : "password"}
                                        value={confirmarSenha}
                                        onChange={(e) => setConfirmarSenha(e.target.value)}
                                        onFocus={() => handleFocus("confirmarSenha")}
                                        onBlur={() => handleBlur("confirmarSenha")}
                                        placeholder="Confirme sua senha"
                                        className="cadastro-input"
                                        required
                                        autoComplete="new-password"
                                        aria-describedby="confirmar-senha-desc"
                                        aria-invalid={confirmarSenha.length > 0 && !validacaoSenha.confirmacao ? "true" : "false"}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-senha-btn"
                                        onClick={alternarVisibilidadeConfirmarSenha}
                                        aria-label={mostrarConfirmarSenha ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                                    >
                                        {mostrarConfirmarSenha ? (
                                            <EyeOff size={18} aria-hidden="true" />
                                        ) : (
                                            <Eye size={18} aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                                <div id="confirmar-senha-desc" className="sr-only">
                                    Digite novamente a mesma senha para confirmação
                                </div>

                                {/* Indicador de confirmação */}
                                {confirmarSenha.length > 0 && (
                                    <div className={`password-match ${validacaoSenha.confirmacao ? "match-success" : "match-error"}`}>
                                        {validacaoSenha.confirmacao ? (
                                            <>
                                                <CheckCircle size={14} aria-hidden="true" />
                                                <span>Senhas coincidem</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={14} aria-hidden="true" />
                                                <span>Senhas não coincidem</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {erro && (
                                <div
                                    ref={erroRef}
                                    id="error-message"
                                    className="erro-container"
                                    role="alert"
                                    aria-live="assertive"
                                    tabIndex="-1"
                                >
                                    <AlertCircle className="erro-icon" aria-hidden="true" size={18} />
                                    <p className="erro-mensagem">{erro}</p>
                                </div>
                            )}

                            <button
                                className={`cadastro-button ${loading ? "cadastro-button-loading" : ""}`}
                                type="submit"
                                disabled={loading}
                                aria-describedby="cadastro-button-desc"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="button-icon loading-icon" aria-hidden="true" size={18} />
                                        <span>Cadastrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <User className="button-icon" aria-hidden="true" size={18} />
                                        <span>Criar Conta</span>
                                    </>
                                )}
                            </button>

                            <div id="cadastro-button-desc" className="sr-only">
                                {loading ? "Processando cadastro, aguarde..." : "Clique para criar sua conta no sistema"}
                            </div>
                        </form>

                        <div className="login-link">
                            <p>
                                Já tem uma conta?{" "}
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="login-link-button"
                                    aria-describedby="login-link-desc"
                                >
                                    <ArrowLeft size={14} aria-hidden="true" />
                                    Faça login
                                </button>
                            </p>
                            <div id="login-link-desc" className="sr-only">
                                Clique para ir para a página de login
                            </div>
                        </div>

                        <footer className="app-version" role="contentinfo">
                            <p>
                                <Coffee className="version-icon" aria-hidden="true" size={14} />
                                Coffee Grader versão 1.0
                            </p>
                        </footer>
                    </div>

                    {/* Mensagem de sucesso */}
                    <div ref={successRef} className="success-message sr-only" tabIndex="-1" role="status" aria-live="polite">
                        Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.
                    </div>
                </main>
            </div>
        </>
    )
}

export default Cadastro
