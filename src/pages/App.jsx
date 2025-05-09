import { Star, Dumbbell, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";

const App = () => {
  const navigate = useNavigate();

  const hoje = new Date();
  const opcoes = { day: "2-digit", month: "long", year: "numeric" };
  const diaSemana = hoje.toLocaleDateString("pt-BR", { weekday: "long" });
  const dataFormatada = hoje.toLocaleDateString("pt-BR", opcoes);

  return (
    <PageWrapper>
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">Exercícios</h1>
        </div>
        {/* Card principal como botão */}
        <button
          onClick={() => navigate("/registrar")}
          className="w-full text-left bg-blue-800 text-white p-4 rounded-xl mb-6 shadow-md"
        >
          <h2 className="text-lg font-semibold">
            TREINO HOJE 
          </h2>
          <p className="text-sm mt-2">
            <span className="underline">
              {dataFormatada} ({diaSemana})
            </span>
          </p>
        </button>

        {/* Próximo treino */}
        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Próximo treino</h3>

          {/* Card 1 */}
          <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg mb-2">
            <div>
              <p className="text-xs text-gray-500">2° dia do exercício</p>
              <p className="font-semibold">costas + ombros</p>
            </div>
            <div className="text-green-600 font-bold">100%</div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center justify-between p-3 bg-red-100 rounded-lg mb-2">
            <div>
              <p className="text-xs text-gray-500">3° dia do exercício</p>
              <p className="font-semibold">peitoral + tríceps</p>
            </div>
            <div className="text-red-600 font-bold">0%</div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">4° dia do exercício</p>
              <p className="font-semibold">pernas</p>
            </div>
            <Lock className="text-gray-500" size={18} />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default App;
