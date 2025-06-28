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
    const [carregando, setCarregando] = useState(false)
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)
    const [validacaoSenha, setValidacaoSenha] = useState({
        tamanho: false,
        letra: false,
        numero: false,
        confirmacao: false,
    })
    const [camposFocados, setCamposFocados] = useState({})
    const navegar = useNavigate()

    // Refs para gerenciamento de foco
    const refNome = useRef(null)
    const refEmail = useRef(null)
    const refSenha = useRef(null)
    const refConfirmarSenha = useRef(null)
    const refErro = useRef(null)
    const refPrincipal = useRef(null)
    const refSucesso = useRef(null)

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
            navegar("/logado", { replace: true })
        }
    }, [usuario, navegar])

    useEffect(() => {
        if (erro && refErro.current) {
            refErro.current.focus()
        }
    }, [erro])

    const pularParaPrincipal = (evento) => {
        evento.preventDefault()
        if (refPrincipal.current) {
            refPrincipal.current.focus()
        }
    }

    const validarCampos = () => {
        if (!nome.trim()) {
            refNome.current?.focus()
            return "Por favor, digite seu nome completo."
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            refEmail.current?.focus()
            return "Por favor, digite um e-mail válido."
        }

        if (!validacaoSenha.tamanho || !validacaoSenha.letra || !validacaoSenha.numero) {
            refSenha.current?.focus()
            return "A senha deve atender a todos os critérios de segurança."
        }

        if (!validacaoSenha.confirmacao) {
            refConfirmarSenha.current?.focus()
            return "As senhas não coincidem."
        }

        return null
    }

    const manipularCadastro = async (evento) => {
        evento.preventDefault()
        setErro("")
        setCarregando(true)

        const erroValidacao = validarCampos()
        if (erroValidacao) {
            setErro(erroValidacao)
            setCarregando(false)
            return
        }

        try {
            const credencialUsuario = await createUserWithEmailAndPassword(auth, email.trim(), senha)
            const usuario = credencialUsuario.user

            const nomeLimpo = nome.trim()
            const emailLimpo = email.trim()

            await updateProfile(usuario, { displayName: nomeLimpo })
            await sendEmailVerification(usuario)

            await setDoc(doc(db, "usuarios", usuario.uid), {
                nome: nomeLimpo,
                email: emailLimpo,
                dataCadastro: new Date().toISOString(),
            })

            setUsuario({ nome: nomeLimpo, email: emailLimpo, uid: usuario.uid })

            // Anunciar sucesso para leitores de tela
            anunciarParaLeitorTela(`Cadastro realizado com sucesso! Um e-mail de verificação foi enviado para ${emailLimpo}.`)

            // Mostrar mensagem de sucesso acessível
            if (refSucesso.current) {
                refSucesso.current.focus()
            }

            setTimeout(() => {
                navegar("/login")
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
            setCarregando(false)
        }
    }

    const alternarVisibilidadeSenha = () => {
        setMostrarSenha(!mostrarSenha)
        setTimeout(() => {
            refSenha.current?.focus()
        }, 0)
    }

    const alternarVisibilidadeConfirmarSenha = () => {
        setMostrarConfirmarSenha(!mostrarConfirmarSenha)
        setTimeout(() => {
            refConfirmarSenha.current?.focus()
        }, 0)
    }

    const manipularFechar = () => {
        navegar(-1)
    }

    const manipularFoco = (campo) => {
        setCamposFocados((anterior) => ({ ...anterior, [campo]: true }))
    }

    const manipularDesfoque = (campo) => {
        setCamposFocados((anterior) => ({ ...anterior, [campo]: false }))
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

    const obterForcaSenha = () => {
        const criterios = Object.values(validacaoSenha).filter(Boolean).length
        if (criterios === 0) return { nivel: 0, texto: "Muito fraca" }
        if (criterios === 1) return { nivel: 1, texto: "Fraca" }
        if (criterios === 2) return { nivel: 2, texto: "Regular" }
        if (criterios === 3) return { nivel: 3, texto: "Boa" }
        return { nivel: 4, texto: "Forte" }
    }

    const forcaSenha = obterForcaSenha()

    return (
        <>
            {/* Link para pular conteúdo */}
            <a href="#conteudo-principal" className="link-pular" onClick={pularParaPrincipal}>
                Pular para o formulário de cadastro
            </a>

            <div className="container-pagina">
                <header className="apenas-leitor-tela">
                    <h1>Coffee Grader - Cadastro de Nova Conta</h1>
                </header>

                <main
                    id="conteudo-principal"
                    className="container-cadastro"
                    ref={refPrincipal}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página de cadastro do Coffee Grader"
                >
                    <div className="caixa-cadastro" role="region" aria-labelledby="titulo-cadastro">
                        <div className="cabecalho-cadastro">
                            <button
                                className="botao-fechar"
                                onClick={manipularFechar}
                                aria-label="Fechar formulário de cadastro e voltar à página anterior"
                                type="button"
                            >
                                <X size={16} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="container-logo">
                            <img
                                src={logo || "/placeholder.svg?height=100&width=100"}
                                alt="Coffee Grader - Sistema de avaliação sensorial de cafés"
                                className="logo-cadastro"
                                width="100"
                                height="100"
                            />
                        </div>

                        <h1 id="titulo-cadastro" className="titulo-cadastro">
                            Criar Nova Conta
                        </h1>

                        <form onSubmit={manipularCadastro} className="formulario-cadastro" noValidate>
                            <div className="grupo-input">
                                <label htmlFor="nome" className="rotulo-input">
                                    Nome Completo *
                                </label>
                                <div className="wrapper-input">
                                    <User className="icone-input" aria-hidden="true" size={18} />
                                    <input
                                        ref={refNome}
                                        id="nome"
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        onFocus={() => manipularFoco("nome")}
                                        onBlur={() => manipularDesfoque("nome")}
                                        placeholder="Digite seu nome completo"
                                        className="input-cadastro"
                                        required
                                        autoComplete="name"
                                        aria-describedby="descricao-nome"
                                        aria-invalid={erro && erro.includes("nome") ? "true" : "false"}
                                    />
                                </div>
                                <div id="descricao-nome" className="apenas-leitor-tela">
                                    Digite seu nome completo como aparece em seus documentos
                                </div>
                            </div>

                            <div className="grupo-input">
                                <label htmlFor="email" className="rotulo-input">
                                    E-mail *
                                </label>
                                <div className="wrapper-input">
                                    <Mail className="icone-input" aria-hidden="true" size={18} />
                                    <input
                                        ref={refEmail}
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => manipularFoco("email")}
                                        onBlur={() => manipularDesfoque("email")}
                                        placeholder="Digite seu e-mail"
                                        className="input-cadastro"
                                        required
                                        autoComplete="email"
                                        aria-describedby="descricao-email"
                                        aria-invalid={erro && erro.includes("e-mail") ? "true" : "false"}
                                    />
                                </div>
                                <div id="descricao-email" className="apenas-leitor-tela">
                                    Digite um e-mail válido. Você receberá um link de verificação neste endereço
                                </div>
                            </div>

                            <div className="grupo-input">
                                <label htmlFor="senha" className="rotulo-input">
                                    Senha *
                                </label>
                                <div className="container-senha wrapper-input">
                                    <Lock className="icone-input" aria-hidden="true" size={18} />
                                    <input
                                        ref={refSenha}
                                        id="senha"
                                        type={mostrarSenha ? "text" : "password"}
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        onFocus={() => manipularFoco("senha")}
                                        onBlur={() => manipularDesfoque("senha")}
                                        placeholder="Crie uma senha segura"
                                        className="input-cadastro"
                                        required
                                        autoComplete="new-password"
                                        aria-describedby="criterios-senha forca-senha"
                                        aria-invalid={senha.length > 0 && !validacaoSenha.tamanho ? "true" : "false"}
                                    />
                                    <button
                                        type="button"
                                        className="botao-alternar-senha"
                                        onClick={alternarVisibilidadeSenha}
                                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                    >
                                        {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                    </button>
                                </div>

                                {/* Indicador de força da senha */}
                                {senha.length > 0 && (
                                    <div className="forca-senha" aria-live="polite">
                                        <div className="barra-forca">
                                            <div
                                                className={`preenchimento-forca forca-${forcaSenha.nivel}`}
                                                style={{ width: `${(forcaSenha.nivel / 4) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="texto-forca">Força: {forcaSenha.texto}</span>
                                    </div>
                                )}

                                {/* Critérios da senha */}
                                {(camposFocados.senha || senha.length > 0) && (
                                    <div id="criterios-senha" className="criterios-senha" role="group" aria-label="Critérios da senha">
                                        <p className="titulo-criterios">Sua senha deve conter:</p>
                                        <ul className="lista-criterios">
                                            <li className={validacaoSenha.tamanho ? "criterio-atendido" : "criterio-nao-atendido"}>
                                                {validacaoSenha.tamanho ? (
                                                    <CheckCircle size={14} aria-hidden="true" />
                                                ) : (
                                                    <AlertCircle size={14} aria-hidden="true" />
                                                )}
                                                <span>Pelo menos 6 caracteres</span>
                                            </li>
                                            <li className={validacaoSenha.letra ? "criterio-atendido" : "criterio-nao-atendido"}>
                                                {validacaoSenha.letra ? (
                                                    <CheckCircle size={14} aria-hidden="true" />
                                                ) : (
                                                    <AlertCircle size={14} aria-hidden="true" />
                                                )}
                                                <span>Pelo menos uma letra</span>
                                            </li>
                                            <li className={validacaoSenha.numero ? "criterio-atendido" : "criterio-nao-atendido"}>
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

                            <div className="grupo-input">
                                <label htmlFor="confirmarSenha" className="rotulo-input">
                                    Confirmar Senha *
                                </label>
                                <div className="container-senha wrapper-input">
                                    <Shield className="icone-input" aria-hidden="true" size={18} />
                                    <input
                                        ref={refConfirmarSenha}
                                        id="confirmarSenha"
                                        type={mostrarConfirmarSenha ? "text" : "password"}
                                        value={confirmarSenha}
                                        onChange={(e) => setConfirmarSenha(e.target.value)}
                                        onFocus={() => manipularFoco("confirmarSenha")}
                                        onBlur={() => manipularDesfoque("confirmarSenha")}
                                        placeholder="Confirme sua senha"
                                        className="input-cadastro"
                                        required
                                        autoComplete="new-password"
                                        aria-describedby="descricao-confirmar-senha"
                                        aria-invalid={confirmarSenha.length > 0 && !validacaoSenha.confirmacao ? "true" : "false"}
                                    />
                                    <button
                                        type="button"
                                        className="botao-alternar-senha"
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
                                <div id="descricao-confirmar-senha" className="apenas-leitor-tela">
                                    Digite novamente a mesma senha para confirmação
                                </div>

                                {/* Indicador de confirmação */}
                                {confirmarSenha.length > 0 && (
                                    <div
                                        className={`correspondencia-senha ${validacaoSenha.confirmacao ? "correspondencia-sucesso" : "correspondencia-erro"}`}
                                    >
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

                            <button
                                className={`botao-cadastro ${carregando ? "botao-cadastro-carregando" : ""}`}
                                type="submit"
                                disabled={carregando}
                                aria-describedby="descricao-botao-cadastro"
                            >
                                {carregando ? (
                                    <>
                                        <Loader2 className="icone-botao icone-carregando" aria-hidden="true" size={18} />
                                        <span>Cadastrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <User className="icone-botao" aria-hidden="true" size={18} />
                                        <span>Criar Conta</span>
                                    </>
                                )}
                            </button>

                            <div id="descricao-botao-cadastro" className="apenas-leitor-tela">
                                {carregando ? "Processando cadastro, aguarde..." : "Clique para criar sua conta no sistema"}
                            </div>
                        </form>

                        <div className="link-login">
                            <p>
                                Já tem uma conta?{" "}
                                <button
                                    type="button"
                                    onClick={() => navegar("/login")}
                                    className="botao-link-login"
                                    aria-describedby="descricao-link-login"
                                >
                                    <ArrowLeft size={14} aria-hidden="true" />
                                    Faça login
                                </button>
                            </p>
                            <div id="descricao-link-login" className="apenas-leitor-tela">
                                Clique para ir para a página de login
                            </div>
                        </div>

                        <footer className="versao-aplicativo" role="contentinfo">
                            <p>
                                <Coffee className="icone-versao" aria-hidden="true" size={14} />
                                Coffee Grader versão 1.0
                            </p>
                        </footer>
                    </div>

                    {/* Mensagem de sucesso */}
                    <div
                        ref={refSucesso}
                        className="mensagem-sucesso apenas-leitor-tela"
                        tabIndex="-1"
                        role="status"
                        aria-live="polite"
                    >
                        Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.
                    </div>
                </main>
            </div>
        </>
    )
}

export default Cadastro
