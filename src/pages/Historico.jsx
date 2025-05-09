import { useEffect, useState } from "react";

const Historico = () => {
  const [registrosAgrupados, setRegistrosAgrupados] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  const [grupoSelecionado, setGrupoSelecionado] = useState("Todos");
  const [tituloSelecionado, setTituloSelecionado] = useState("Todos");

  // Obter dia da semana
  const getDiaSemana = (dataString) => {
    const [dia, mes, ano] = dataString.split("/");
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia)); // mês - 1
    return data.toLocaleDateString("pt-BR", { weekday: "long" });
  };

  // Expandir ou recolher seção de um dia
  const toggleExpand = (data) => {
    setExpandedDates((prev) => ({ ...prev, [data]: !prev[data] }));
  };

  useEffect(() => {
    const registros = JSON.parse(
      localStorage.getItem("gymtracker_cargas") || "[]"
    );

    const agrupados = registros.reduce((acc, registro) => {
      const data = registro.data;
      if (!acc[data]) acc[data] = [];
      acc[data].push(registro);
      return acc;
    }, {});

    const agrupadosOrdenados = Object.fromEntries(
      Object.entries(agrupados).sort(
        ([dataA], [dataB]) =>
          new Date(dataB.split("/").reverse()) -
          new Date(dataA.split("/").reverse())
      )
    );

    setRegistrosAgrupados(agrupadosOrdenados);
  }, []);

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
        .map((r) => r.tituloTreino || "Sem Título")
    )
  );

  const limparRegistros = () => {
    if (confirm("Tem certeza que deseja apagar todos os registros?")) {
      localStorage.removeItem("gymtracker_cargas");
      setRegistrosAgrupados({});
    }
  };

  return (
    <div className="p-4 pb-24 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Histórico de Cargas</h1>

      <div className="flex flex-wrap items-center gap-4">
        <select
          value={grupoSelecionado}
          onChange={(e) => setGrupoSelecionado(e.target.value)}
          className="border rounded p-2 flex-1 min-w-[140px]"
        >
          <option value="Todos">Todos os Grupos</option>
          {gruposDisponiveis.map((grupo) => (
            <option key={grupo} value={grupo}>
              {grupo}
            </option>
          ))}
        </select>

        <select
          value={tituloSelecionado}
          onChange={(e) => setTituloSelecionado(e.target.value)}
          className="border rounded p-2 flex-1 min-w-[140px]"
        >
          <option value="Todos">Todos os Títulos</option>
          {titulosDisponiveis.map((titulo) => (
            <option key={titulo} value={titulo}>
              {titulo}
            </option>
          ))}
        </select>
      </div>

      {/* Botão abaixo */}
      <div className="mt-4 pb-4">
        <button
          onClick={limparRegistros}
          className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 w-full sm:w-auto "
        >
          Limpar Histórico
        </button>
      </div>

      {Object.keys(registrosAgrupados).length === 0 ? (
        <p className="text-gray-600">Nenhum registro encontrado.</p>
      ) : (
        Object.entries(registrosAgrupados).map(([data, registros]) => {
          const registrosFiltrados = registros.filter((r) => {
            const grupoOK =
              grupoSelecionado === "Todos" ||
              r.grupoMuscular === grupoSelecionado;
            const tituloOK =
              tituloSelecionado === "Todos" ||
              (r.tituloTreino || "Sem Título") === tituloSelecionado;
            return grupoOK && tituloOK;
          });

          if (registrosFiltrados.length === 0) return null;

          const diaSemana = getDiaSemana(data);
          const tituloTreino =
            registros[0]?.tituloTreino || "Treino sem título";

          return (
            <div key={data} className="mb-6 border rounded shadow">
              <button
                onClick={() => toggleExpand(data)}
                className="w-full text-left p-3 bg-gray-200 hover:bg-gray-300 flex justify-between items-center"
              >
                <span className="font-semibold">
                  {tituloTreino} — {data} ({diaSemana})
                </span>
                <span className="text-xl">
                  {expandedDates[data] ? "▲" : "▼"}
                </span>
              </button>

              {expandedDates[data] && (
                <div className="p-4 bg-white">
                  {registrosFiltrados.map((registro) => (
                    <div
                      key={registro.id}
                      className="bg-gray-100 rounded p-4 shadow mb-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-bold text-gray-800">
                            {registro.exercicio}
                          </p>
                          <p className="text-sm text-gray-600">
                            Grupo: {registro.grupoMuscular}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {registro.series.map((serie, index) => (
                          <p key={index} className="text-sm text-gray-700">
                            Série {index + 1}: {serie.carga} kg x{" "}
                            {serie.repeticoes} reps
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Historico;
