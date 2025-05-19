import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage";
import {
  Trash2,
  History,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  Dumbbell,
  Tag,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";

const Historico = () => {
  const { user } = useAuth();
  const [registrosAgrupados, setRegistrosAgrupados] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  const [grupoSelecionado, setGrupoSelecionado] = useState("Todos");
  const [tituloSelecionado, setTituloSelecionado] = useState("Todos");
  const [isVisible, setIsVisible] = useState(false);

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const carregarHistorico = () => {
    if (!user?.uid) {
      setRegistrosAgrupados({}); // Limpa se não houver usuário
      return;
    }

    const registros = getUserData("gymtracker_cargas", user.uid) || [];

    const agrupados = registros.reduce((acc, registro) => {
      const data = registro.data;
      if (!acc[data]) acc[data] = [];
      acc[data].push(registro);
      return acc;
    }, {});

    const agrupadosOrdenados = Object.fromEntries(
      Object.entries(agrupados).sort(
        ([dataA], [dataB]) =>
          new Date(dataB.split("/").reverse().join("-")) -
          new Date(dataA.split("/").reverse().join("-"))
      )
    );
    setRegistrosAgrupados(agrupadosOrdenados);
    setExpandedDates({}); // Reseta os cards expandidos ao recarregar
  };

  useEffect(() => {
    carregarHistorico();
  }, [user]);

  const getDiaSemana = (dataString) => {
    const [dia, mes, ano] = dataString.split("/");
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return data.toLocaleDateString("pt-BR", { weekday: "long" });
  };

  const toggleExpand = (data) => {
    setExpandedDates((prev) => ({ ...prev, [data]: !prev[data] }));
  };

  const handleLimparHistorico = () => {
    if (!user?.uid) {
      alert("Você precisa estar logado para limpar o histórico.");
      return;
    }

    const confirmacao = window.confirm(
      "Tem certeza que deseja apagar todo o histórico de treinos? Esta ação não pode ser desfeita."
    );

    if (confirmacao) {
      saveUserData("gymtracker_cargas", user.uid, []); // Salva um array vazio
      carregarHistorico(); // Recarrega o histórico (que agora estará vazio)
      alert("Histórico de treinos apagado com sucesso.");
    }
  };

  const gruposDisponiveis = Array.from(
    new Set(
      Object.values(registrosAgrupados)
        .flat()
        .map((r) => r.grupoMuscular)
        .filter(Boolean) // Remove valores nulos ou undefined
    )
  );

  const titulosDisponiveis = Array.from(
    new Set(
      Object.values(registrosAgrupados)
        .flat()
        .map((r) => r.tituloTreino || "Sem título")
        .filter(Boolean)
    )
  );

  const registrosFiltrados = Object.entries(registrosAgrupados).reduce(
    (acc, [data, registros]) => {
      const filtrados = registros.filter(
        (r) =>
          (grupoSelecionado === "Todos" ||
            r.grupoMuscular === grupoSelecionado) &&
          (tituloSelecionado === "Todos" ||
            (r.tituloTreino || "Sem título") === tituloSelecionado)
      );

      if (filtrados.length > 0) acc[data] = filtrados;

      return acc;
    },
    {}
  );

  return (
    <PageWrapper>
      <div
        className={`pb-32 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="flex justify-between items-center mb-4 m-4">
          <div className="flex items-center">
            <History size={22} className="text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-white">
              Histórico de Treinos
            </h1>
          </div>
          {Object.keys(registrosAgrupados).length > 0 && (
            <button
              onClick={handleLimparHistorico}
              className="bg-red-500 text-white px-3 py-1.5 rounded-lg flex items-center text-sm hover:bg-red-600 transition-colors"
              title="Limpar todo o histórico de treinos"
            >
              <Trash2 size={16} className="mr-1" /> Limpar Histórico
            </button>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-4 mb-4 m-4">
          <div className="flex items-center mb-2">
            <Filter size={16} className="text-blue-400 mr-2" />
            <p className="text-sm font-medium text-gray-300">
              Filtrar histórico:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={grupoSelecionado}
                onChange={(e) => setGrupoSelecionado(e.target.value)}
                className="w-full bg-slate-700 text-white border-none rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={gruposDisponiveis.length === 0}
              >
                <option value="Todos">Todos os grupos musculares</option>
                {gruposDisponiveis.map((grupo) => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={tituloSelecionado}
                onChange={(e) => setTituloSelecionado(e.target.value)}
                className="w-full bg-slate-700 text-white border-none rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={titulosDisponiveis.length === 0}
              >
                <option value="Todos">Todos os títulos de treino</option>
                {titulosDisponiveis.map((titulo) => (
                  <option key={titulo} value={titulo}>
                    {titulo}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {Object.keys(registrosFiltrados).length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center m-4 animate-fadeIn">
            <div className="bg-slate-700 p-4 rounded-full mb-3">
              <History size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-300 text-lg mb-1">
              Nenhum registro de treino encontrado
            </p>
            <p className="text-gray-400 text-sm">
              {grupoSelecionado !== "Todos" || tituloSelecionado !== "Todos"
                ? "Tente mudar os filtros selecionados"
                : "Registre seus treinos para começar a construir seu histórico"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 m-4">
            {Object.entries(registrosFiltrados).map(
              ([data, registros], dateIndex) => (
                <div
                  key={data}
                  className="bg-slate-800 rounded-xl overflow-hidden shadow-lg animate-fadeIn"
                  style={{ animationDelay: `${dateIndex * 100}ms` }}
                >
                  <div
                    className="cursor-pointer flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors"
                    onClick={() => toggleExpand(data)}
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                        <Calendar size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-white font-semibold">
                          {data}{" "}
                          <span className="text-gray-400 font-normal">
                            ({getDiaSemana(data)})
                          </span>
                        </h2>
                        <p className="text-sm text-gray-400">
                          {registros[0]?.tituloTreino || "Treino"} •{" "}
                          {registros.length}{" "}
                          {registros.length === 1 ? "exercício" : "exercícios"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-1.5">
                      {expandedDates[data] ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedDates[data] && (
                    <div className="px-4 pb-4 space-y-3 animate-fadeIn">
                      {registros.map((registro, regIndex) => (
                        <div
                          key={registro.id}
                          className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30"
                          style={{ animationDelay: `${regIndex * 50}ms` }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <Dumbbell
                                size={16}
                                className="text-blue-400 mr-2"
                              />
                              <h3 className="font-medium text-white">
                                {registro.exercicio}
                              </h3>
                            </div>
                            <span className="text-xs text-gray-400 bg-slate-600/50 px-2 py-0.5 rounded-full">
                              {registro.grupoMuscular}
                            </span>
                          </div>

                          {registro.tituloTreino && (
                            <div className="flex items-center mb-3 text-xs text-gray-400">
                              <Tag size={12} className="mr-1" />
                              {registro.tituloTreino}
                            </div>
                          )}

                          <div className="space-y-2 mt-3">
                            {registro.series.map((serie, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-12 gap-2 items-center bg-slate-800/50 rounded-lg p-2"
                              >
                                <span className="col-span-1 text-xs font-medium text-gray-400 text-center">
                                  {index + 1}
                                </span>
                                <div className="col-span-5 text-sm text-white">
                                  <span className="text-gray-400 mr-1">
                                    Carga:
                                  </span>{" "}
                                  {serie.carga || "0"}kg
                                </div>
                                <div className="col-span-6 text-sm text-white">
                                  <span className="text-gray-400 mr-1">
                                    Reps:
                                  </span>{" "}
                                  {serie.repeticoes || "0"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Historico;
