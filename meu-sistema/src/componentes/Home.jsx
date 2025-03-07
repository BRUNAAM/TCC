import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold">Bem-vindo à Página Inicial!</h2>
            <button
                className="bg-red-500 text-white p-2 rounded mt-4"
                onClick={() => navigate("/")}>
                Sair
            </button>
        </div>
    );
};

export default Home;
