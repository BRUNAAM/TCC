"use client"

import "./Home.css"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo.svg"
import { useUser } from "../context/UserContext"
import { useEffect, useRef, useState } from "react"
import { Key, Coffee, Loader2 } from "lucide-react"

const Home = () => {
    const { usuario } = useUser()
    const navegar = useNavigate()
    const refPrincipal = useRef(null)

    // ✅ NOVOS ESTADOS para melhor UX
    const [logoCarregado, setLogoCarregado] = useState(false)
    const [logoErro, setLogoErro] = useState(false)
    const [navegando, setNavegando] = useState(false)
    const [animacaoCompleta, setAnimacaoCompleta] = useState(false)

    useEffect(() => {
        if (usuario) {
            navegar("/logado", { replace: true })
        }
    }, [usuario, navegar])

    // ✅ NOVO: Controle de animação
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimacaoCompleta(true)
        }, 800) // Tempo da animação fadeInUp

        return () => clearTimeout(timer)
    }, [])

    // ✅ NOVO: Função para navegar com feedback visual
    const handleNavegar = async () => {
        try {
            setNavegando(true)
            // Pequeno delay para mostrar o estado de loading
            await new Promise((resolve) => setTimeout(resolve, 300))
            navegar("/login")
        } catch (error) {
            console.error("Erro ao navegar:", error)
            setNavegando(false)
        }
    }

    // ✅ NOVO: Handlers para o logo
    const handleLogoLoad = () => {
        setLogoCarregado(true)
        setLogoErro(false)
    }

    const handleLogoError = () => {
        setLogoErro(true)
        setLogoCarregado(false)
        console.warn("Erro ao carregar logo, usando fallback")
    }

    // ✅ NOVO: Detectar se é dispositivo móvel
    const isMobile = () => {
        return (
            window.innerWidth <= 768 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        )
    }

    // ✅ NOVO: Função para otimizar performance em mobile
    useEffect(() => {
        if (isMobile()) {
            // Reduzir animações em dispositivos móveis mais antigos
            document.documentElement.style.setProperty("--transicao-padrao", "all 0.2s ease")
        }
    }, [])

    return (
        <>
            <div className="container-pagina">
                <header className="apenas-leitor-tela">
                    <h1>Coffee Grader - Sistema de Avaliação Sensorial de Cafés</h1>
                </header>

                <main
                    id="conteudo-principal"
                    className="container-inicio"
                    ref={refPrincipal}
                    tabIndex="-1"
                    role="main"
                    aria-label="Página inicial do Coffee Grader"
                >
                    <section
                        className={`conteudo-inicio ${animacaoCompleta ? "animacao-completa" : ""}`}
                        aria-labelledby="titulo-boas-vindas"
                    >
                        {/* ✅ MELHORADO: Container do logo com estados */}
                        <div className="container-logo">
                            {!logoCarregado && !logoErro && (
                                <div className="logo-loading" aria-label="Carregando logo">
                                    <div className="logo-skeleton"></div>
                                </div>
                            )}

                            {logoErro ? (
                                <div className="logo-fallback" aria-label="Logo Coffee Grader">
                                    <Coffee size={80} className="icone-logo-fallback" />
                                    <span className="texto-logo-fallback">Coffee Grader</span>
                                </div>
                            ) : (
                                <img
                                    src={logo || "/placeholder.svg?height=180&width=180"}
                                    alt="Coffee Grader - Logotipo do sistema de avaliação sensorial de cafés"
                                    className={`logo-inicio ${logoCarregado ? "logo-carregado" : "logo-carregando"}`}
                                    width="180"
                                    height="180"
                                    onLoad={handleLogoLoad}
                                    onError={handleLogoError}
                                    loading="eager" // Prioridade alta para logo
                                />
                            )}
                        </div>

                        <div className="conteudo-boas-vindas">
                            <h1 id="titulo-boas-vindas" className="titulo-inicio">
                                Bem-vindo ao Coffee Grader
                            </h1>

                            <div className="caixa-descricao" role="region" aria-label="Descrição do sistema">
                                <p className="descricao-inicio">
                                    O sistema que vai te ajudar a administrar com praticidade e organização suas avaliações sensoriais de
                                    café.
                                </p>
                            </div>

                            {/* ✅ MELHORADO: Botão com estados de loading */}
                            <button
                                onClick={handleNavegar}
                                className={`botao-inicio ${navegando ? "navegando" : ""}`}
                                type="button"
                                aria-describedby="descricao-botao"
                                disabled={navegando}
                            >
                                {navegando ? (
                                    <>
                                        <Loader2 className="icone-botao icone-loading" aria-hidden="true" size={18} />
                                        <span>Entrando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Key className="icone-botao" aria-hidden="true" size={18} />
                                        <span>Entrar no Sistema</span>
                                    </>
                                )}
                            </button>

                            <div id="descricao-botao" className="apenas-leitor-tela">
                                {navegando
                                    ? "Redirecionando para a página de login"
                                    : "Clique para acessar a página de login do sistema"}
                            </div>
                        </div>

                        <footer className="versao-aplicativo" role="contentinfo">
                            <p>
                                <Coffee className="icone-versao" aria-hidden="true" size={14} />
                                <span>Coffee Grader versão 1.0</span>
                            </p>
                        </footer>
                    </section>
                </main>
            </div>

            {/* ✅ NOVO: Preloader para melhor UX */}
            {!animacaoCompleta && (
                <div className="preloader" aria-hidden="true">
                    <div className="preloader-content">
                        <Coffee className="preloader-icon" size={40} />
                        <span className="preloader-text">Carregando...</span>
                    </div>
                </div>
            )}
        </>
    )
}

export default Home
