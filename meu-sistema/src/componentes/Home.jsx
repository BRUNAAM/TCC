import "./Home.css"
import { useNavigate } from "react-router-dom"
import logo from "../assets/logo.svg"
import { useUser } from "../context/UserContext"
import { useEffect } from "react"

const Home = () => {
    const { usuario } = useUser()
    const navigate = useNavigate()

    useEffect(() => {
        if (usuario) {
            navigate("/logado", { replace: true }) // impede voltar
        }
    }, [usuario, navigate])

    return (
        <main className="home-container">
            <section className="home-content">
                <div className="logo-container">
                    <img src={logo || "/placeholder.svg"} alt="Logotipo do sistema Coffee Grader" className="home-logo" />
                </div>

                <div className="welcome-content">
                    <h1 className="home-title">Bem-vindo ao Coffee Grader</h1>

                    <div className="description-box">
                        <p className="home-p">
                            O sistema que vai te ajudar a administrar
                            <br />
                            com praticidade e organização
                            <br />
                            suas avaliações.
                        </p>
                    </div>

                    <button onClick={() => navigate("/login")} className="home-button" aria-label="Entrar no sistema">
                        <span className="button-icon">🔑</span>
                        <span>ENTRAR NO SISTEMA</span>
                    </button>
                </div>

                <div className="app-version">
                    <p>Coffee Grader v1.0</p>
                </div>
            </section>
        </main>
    )
}

export default Home
