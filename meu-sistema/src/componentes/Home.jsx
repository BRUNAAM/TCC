import { useNavigate } from "react-router-dom";
import "./Home.css";
import logo from "../assets/logo.svg";

const Home = () => {
    const navigate = useNavigate();

    return (
        <main className="home-container">
            <section className="home-content">
                <img src={logo} alt="Logotipo do sistema Coffee Grader" className="home-logo" />
                <h1>Bem-vindo ao Coffee Grader</h1>
                <p>
                    O sistema que vai te ajudar a administrar<br />
                    com praticidade e organização<br />
                    suas avaliações.
                </p>
                <button
                    onClick={() => navigate("/login")}
                    className="home-button"
                    aria-label="Entrar no sistema">
                    Entrar no Sistema
                </button>
            </section>
        </main>
    );
};

export default Home;
