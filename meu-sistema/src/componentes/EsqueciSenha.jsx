"use client"

import "./EsqueciSenha.css"
import { useState, useEffect, useRef } from "react"
import { auth } from "../config/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import logo from "../assets/logo.svg"
import { Mail, AlertCircle, CheckCircle, Loader2, X, Coffee, ArrowLeft, RefreshCw, Info, Clock } from "lucide-react"

const EsqueciSenha = () => {
    const { usuario } = useUser()
    const [email, setEmail] = useState("")
    const [mensagem, setMensagem] = useState("")
    const [erro, setErro] = useState("")
    const [carregando, setCarregando] = useState(false)
    const [emailEnviado, setEmailEnviado] = useState(false)
    const [contadorRegressivo, setContadorRegressivo] = useState(0)
    const navegar = useNavigate()

    // Refs para gerenciamento de foco
    const refEmail = useRef(null)
    const refErro = useRef(null)
    const refSucesso = useRef(null)
    const refPrincipal = useRef(null)

    // Impede usuários logados de acessar
    useEffect(() => {
        if (usuario) {
            navegar("/logado", { replace: true })
        }
    }, [usuario, navegar])

    // Foca no erro quando aparece
    useEffect(() => {
        if (erro && refErro.current) {
            refErro.current.focus()
        }
    }, [erro])

    // Foca na mensagem de sucesso quando aparece
    useEffect(() => {
        if (mensagem && refSucesso.current) {
            refSucesso.current.focus()
        }
    }, [mensagem])

    // Countdown para redirecionamento
    useEffect(() => {
        let intervalo = null
        if (emailEnviado && contadorRegressivo > 0) {
            intervalo = setInterval(() => {
                setContadorRegressivo((anterior) => anterior - 1)
            }, 1000)
        } else if (contadorRegressivo === 0 && emailEnviado) {
            navegar("/login")
        }

        return () => {
            if (intervalo) clearInterval(intervalo)
        }
    }, [contadorRegressivo, emailEnviado, navegar])

    const pularParaPrincipal = (evento) => {
        evento.preventDefault()
        if (refPrincipal.current) {
            refPrincipal.current.focus()
        }
    }

    const validarEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email)
    }

    const manipularRedefinirSenha = async (evento) => {
        evento.preventDefault()
        setMensagem("")
        setErro("")
        setCarregando(true)

        const emailLimpo = email.trim()

        // Validação de email
        if (!emailLimpo) {
            setErro("Por favor, digite seu e-mail.")
            refEmail.current?.focus()
            setCarregando(false)
            return
        }

        if (!validarEmail(emailLimpo)) {
            setErro("Por favor, digite um e-mail válido.")
            refEmail.current?.focus()
            setCarregando(false)
            return
        }

        try {
            await sendPasswordResetEmail(auth, emailLimpo)
            setMensagem(
                `Um link para redefinir sua senha foi enviado para ${emailLimpo}. Verifique sua caixa de entrada e spam.`,
            )
            setEmailEnviado(true)
            setContadorRegressivo(5) // 5 segundos para redirecionamento

            // Anunciar sucesso para leitores de tela
            anunciarParaLeitorTela(
                `E-mail de recuperação enviado com sucesso para ${emailLimpo}. Você será redirecionado para a página de login em 5 segundos.`,
            )
        } catch (error) {
            console.error("Erro ao enviar email de recuperação:", error)
            const mensagensErro = {
                "auth/user-not-found": "Este e-mail não está cadastrado em nosso sistema.",
                "auth/invalid-email": "Por favor, digite um e-mail válido.",
                "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
                "auth/network-request-failed": "Erro de conexão. Verifique sua internet e tente novamente.",
            }

            setErro(mensagensErro[error.code] || "Erro inesperado ao enviar e-mail. Tente novamente mais tarde.")
        } finally {
            setCarregando(false)
        }
    }

    const manipularFechar = () => {
        navegar("/login")
    }

    const anunciarParaLeitorTela = (mensagem) => {
        const anuncio = document.createElement("div")
        anuncio.setAttribute("aria-live", "polite")
        anuncio.setAttribute("aria-atomic", "true")
        anuncio.className = "apenas-leitor-tela"
        anuncio.textContent = mensagem
        document.body.appendChild(anuncio)

        setTimeout(() => {
            document.body.removeChild(anuncio)
        }, 1000)
    }

    return (
        <>
            {/* Link para pular conteúdo */}
            <a href="#conteudo-principal" className="link-pular" onClick={pularParaPrincipal}>
                Pular para o formulário de recuperação de senha
            </a>

            <div className="container-pagina">
                <header className="apenas-leitor-tela">
                    <h1>Coffee Grader - Recuperação de Senha</h1>
                </header>

                <main
                    id="conteudo-principal"
                    className="container-esqueci"
                    ref={refPrincipal}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página de recuperação de senha do Coffee Grader"
                >
                    <div className="caixa-esqueci" role="region" aria-labelledby="titulo-esqueci">
                        <div className="cabecalho-esqueci">
                            <button
                                className="botao-fechar"
                                onClick={manipularFechar}
                                aria-label="Fechar formulário de recuperação e voltar ao login"
                                type="button"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="container-logo">
                            <img
                                src={logo || "/placeholder.svg?height=100&width=100"}
                                alt="Coffee Grader - Sistema de avaliação sensorial de cafés"
                                className="logo-esqueci"
                                width="100"
                                height="100"
                            />
                        </div>

                        <h1 id="titulo-esqueci" className="titulo-esqueci">
                            Recuperar Senha
                        </h1>

                        {/* Informações sobre o processo */}
                        <div className="caixa-info" role="region" aria-label="Informações sobre recuperação de senha">
                            <Info className="icone-info" aria-hidden="true" size={18} />
                            <p className="texto-info">
                                Digite seu e-mail cadastrado e enviaremos um link seguro para redefinir sua senha.
                            </p>
                        </div>

                        <form onSubmit={manipularRedefinirSenha} className="formulario-esqueci" noValidate>
                            <div className="grupo-input">
                                <label htmlFor="email" className="rotulo-input">
                                    E-mail Cadastrado *
                                </label>
                                <div className="wrapper-input">
                                    <Mail className="icone-input" aria-hidden="true" size={18} />
                                    <input
                                        ref={refEmail}
                                        id="email"
                                        type="email"
                                        placeholder="Digite seu e-mail cadastrado"
                                        className="input-esqueci"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        aria-describedby="descricao-email"
                                        aria-invalid={erro && erro.includes("e-mail") ? "true" : "false"}
                                        disabled={emailEnviado}
                                    />
                                </div>
                                <div id="descricao-email" className="apenas-leitor-tela">
                                    Digite o e-mail que você usou para criar sua conta
                                </div>
                            </div>

                            {erro && (
                                <div
                                    ref={refErro}
                                    id="mensagem-erro"
                                    className="container-erro"
                                    role="alert"
                                    aria-live="assertive"
                                    tabIndex="-1"
                                >
                                    <AlertCircle className="icone-erro" aria-hidden="true" size={18} />
                                    <p className="mensagem-erro">{erro}</p>
                                </div>
                            )}

                            {mensagem && (
                                <div
                                    ref={refSucesso}
                                    id="mensagem-sucesso"
                                    className="container-sucesso"
                                    role="status"
                                    aria-live="polite"
                                    tabIndex="-1"
                                >
                                    <CheckCircle className="icone-sucesso" aria-hidden="true" size={18} />
                                    <div className="conteudo-sucesso">
                                        <p className="mensagem-sucesso">{mensagem}</p>
                                        {contadorRegressivo > 0 && (
                                            <div className="contador-regressivo" aria-live="polite">
                                                <Clock className="icone-contador" aria-hidden="true" size={14} />
                                                <span>Redirecionando em {contadorRegressivo} segundos...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                className={`botao-esqueci ${carregando ? "botao-esqueci-carregando" : ""}`}
                                type="submit"
                                disabled={carregando || emailEnviado}
                                aria-describedby="descricao-botao"
                            >
                                {carregando ? (
                                    <>
                                        <Loader2 className="icone-botao icone-carregando" aria-hidden="true" size={18} />
                                        <span>Enviando...</span>
                                    </>
                                ) : emailEnviado ? (
                                    <>
                                        <CheckCircle className="icone-botao" aria-hidden="true" size={18} />
                                        <span>E-mail Enviado</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="icone-botao" aria-hidden="true" size={18} />
                                        <span>Enviar Link de Recuperação</span>
                                    </>
                                )}
                            </button>

                            <div id="descricao-botao" className="apenas-leitor-tela">
                                {carregando
                                    ? "Enviando e-mail de recuperação, aguarde..."
                                    : emailEnviado
                                        ? "E-mail de recuperação enviado com sucesso"
                                        : "Clique para enviar o link de recuperação para seu e-mail"}
                            </div>
                        </form>

                        {/* Instruções adicionais */}
                        <div className="instrucoes" role="region" aria-label="Instruções adicionais">
                            <h2 className="titulo-instrucoes">Próximos passos:</h2>
                            <ol className="lista-instrucoes">
                                <li>Verifique sua caixa de entrada</li>
                                <li>Procure também na pasta de spam</li>
                                <li>Clique no link recebido</li>
                                <li>Defina uma nova senha segura</li>
                            </ol>
                        </div>

                        <div className="link-login">
                            <p>
                                Lembrou sua senha?{" "}
                                <button
                                    type="button"
                                    onClick={() => navegar("/login")}
                                    className="botao-link-login"
                                    aria-describedby="descricao-link-login"
                                >
                                    <ArrowLeft size={14} aria-hidden="true" />
                                    Voltar para login
                                </button>
                            </p>
                            <div id="descricao-link-login" className="apenas-leitor-tela">
                                Clique para voltar à página de login
                            </div>
                        </div>

                        <footer className="versao-aplicativo" role="contentinfo">
                            <p>
                                <Coffee className="icone-versao" aria-hidden="true" size={14} />
                                Coffee Grader versão 1.0
                            </p>
                        </footer>
                    </div>
                </main>
            </div>
        </>
    )
}

export default EsqueciSenha
