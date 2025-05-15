import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserData } from "../utils/storage";

const Historico = () => {
  const { user } = useAuth();
  const [registrosAgrupados, setRegistrosAgrupados] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  const [grupoSelecionado, setGrupoSelecionado] = useState("Todos");
  const [tituloSelecionado, setTituloSelecionado] = useState("Todos");

  const getDiaSemana = (dataString) => {
    const [dia, mes, ano] = dataString.split("/");
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return data.toLocaleDateString("pt-BR", { weekday: "long" });
  };

  const toggleExpand = (data) => {
    setExpandedDates((prev) => ({ ...prev, [data]: !prev[data] }));
  };

  useEffect(() => {
    if (!user?.uid) return;

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
          new Date(dataB.split("/").reverse()) - new Date(dataA.split("/").reverse())
      )
    );

    setRegistrosAgrupados(agrupadosOrdenados);
  }, [user]);

  const gruposDisponiveis = Array.from(
    new Set(
      Object.values(registrosAgrupados)
        .flat()
        .map((r) => r.grupoMuscular)
    )
  );

  const titulosDisponiveis = Array.from(
    new Set(
      Object.values(registrosAgrupados)
        .flat()
        .map((r) => r.tituloTreino || "Sem título")
    )
  );

  const registrosFiltrados = Object.entries(registrosAgrupados).reduce(
    (acc, [data, registros]) => {
      const filtrados = registros.filter(
        (r) =>
          (grupoSelecionado === "Todos" ||
            r.grupoMuscular === grupoSelecionado) &&
          (tituloSelecionado === "Todos" ||
            r.tituloTreino === tituloSelecionado)
      );

      if (filtrados.length > 0) acc[data] = filtrados;

      return acc;
    },
    {}
  );

  return (
    <div className="p-4 pb-24 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Histórico de Treinos</h1>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select
          value={grupoSelecionado}
          onChange={(e) => setGrupoSelecionado(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="Todos">Todos os grupos</option>
          {gruposDisponiveis.map((grupo) => (
            <option key={grupo} value={grupo}>
              {grupo}
            </option>
          ))}
        </select>

        <select
          value={tituloSelecionado}
          onChange={(e) => setTituloSelecionado(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="Todos">Todos os títulos</option>
          {titulosDisponiveis.map((titulo) => (
            <option key={titulo} value={titulo}>
              {titulo}
            </option>
          ))}
        </select>
      </div>

      {Object.keys(registrosFiltrados).length === 0 ? (
        <p className="text-gray-500 text-center mt-6">
          Nenhum registro encontrado.
        </p>
      ) : (
        Object.entries(registrosFiltrados).map(([data, registros]) => (
          <div key={data} className="mb-6 border rounded p-4 bg-gray-50 shadow">
            <div
              className="cursor-pointer flex justify-between items-center"
              onClick={() => toggleExpand(data)}
            >
              <h2 className="text-md font-bold text-gray-800">
                {data} ({getDiaSemana(data)})
              </h2>
              <span className="text-blue-600 text-sm">
                {expandedDates[data] ? "Recolher ▲" : "Expandir ▼"}
              </span>
            </div>

            {expandedDates[data] && (
              <div className="mt-4 space-y-4">
                {registros.map((registro) => (
                  <div
                    key={registro.id}
                    className="bg-white rounded shadow p-3 border"
                  >
                    <p className="font-semibold">{registro.exercicio}</p>
                    <p className="text-sm text-gray-600">
                      Grupo: {registro.grupoMuscular}
                    </p>
                    <p className="text-sm text-gray-600">
                      Título: {registro.tituloTreino || "Sem título"}
                    </p>
                    <div className="mt-2 space-y-1">
                      {registro.series.map((serie, index) => (
                        <p key={index} className="text-sm">
                          Série {index + 1}: {serie.carga}kg x{" "}
                          {serie.repeticoes} repetições
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
