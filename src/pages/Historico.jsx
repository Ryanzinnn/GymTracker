import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage"; // Certifique-se que saveUserData está exportado e importado
import { Trash2 } from "lucide-react"; // Ícone para o botão de limpar

const Historico = () => {
  const { user } = useAuth();
  const [registrosAgrupados, setRegistrosAgrupados] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  const [grupoSelecionado, setGrupoSelecionado] = useState("Todos");
  const [tituloSelecionado, setTituloSelecionado] = useState("Todos");

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
          new Date(dataB.split("/").reverse().join("-")) - new Date(dataA.split("/").reverse().join("-"))
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
    <div className="p-4 pb-24 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-black">Histórico de Treinos</h1>
        {Object.keys(registrosAgrupados).length > 0 && (
          <button
            onClick={handleLimparHistorico}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center"
            title="Limpar todo o histórico de treinos"
          >
            <Trash2 size={16} className="mr-1" /> Limpar Histórico
          </button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select
          value={grupoSelecionado}
          onChange={(e) => setGrupoSelecionado(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          disabled={gruposDisponiveis.length === 0}
        >
          <option value="Todos">Todos os grupos musculares</option>
          {gruposDisponiveis.map((grupo) => (
            <option key={grupo} value={grupo}>
              {grupo}
            </option>
          ))}
        </select>

        <select
          value={tituloSelecionado}
          onChange={(e) => setTituloSelecionado(e.target.value)}
          className="border rounded px-3 py-2 w-full"
          disabled={titulosDisponiveis.length === 0}
        >
          <option value="Todos">Todos os títulos de treino</option>
          {titulosDisponiveis.map((titulo) => (
            <option key={titulo} value={titulo}>
              {titulo}
            </option>
          ))}
        </select>
      </div>

      {Object.keys(registrosFiltrados).length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          Nenhum registro de treino encontrado{ (grupoSelecionado !== "Todos" || tituloSelecionado !== "Todos") && " para os filtros selecionados" }.
        </p>
      ) : (
        Object.entries(registrosFiltrados).map(([data, registros]) => (
          <div key={data} className="mb-6 border rounded p-4 bg-gray-50 shadow-md">
            <div
              className="cursor-pointer flex justify-between items-center py-2"
              onClick={() => toggleExpand(data)}
            >
              <h2 className="text-md font-semibold text-gray-800">
                {data} ({getDiaSemana(data)}) - {registros[0]?.tituloTreino || "Treino"} ({registros.length} {registros.length === 1 ? "exercício" : "exercícios"})
              </h2>
              <span className="text-blue-600 text-sm font-medium">
                {expandedDates[data] ? "Recolher ▲" : "Expandir ▼"}
              </span>
            </div>

            {expandedDates[data] && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                {registros.map((registro) => (
                  <div
                    key={registro.id}
                    className="bg-white rounded-lg shadow p-3 border border-gray-200"
                  >
                    <p className="font-semibold text-gray-700">{registro.exercicio}</p>
                    <p className="text-xs text-gray-500">
                      Grupo: {registro.grupoMuscular}
                    </p>
                    {registro.tituloTreino && (
                        <p className="text-xs text-gray-500">
                            Título: {registro.tituloTreino}
                        </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {registro.series.map((serie, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          Série {index + 1}: {serie.carga || "0"}kg x{" "}
                          {serie.repeticoes || "0"} repetições
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Historico;

