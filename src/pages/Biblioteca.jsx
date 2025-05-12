import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const gruposMusculares = {
  Peito: ["Supino Reto (Barra)", "Supino Reto (Halter)", "Supino Reto (Máquina)", "Supino Inclinado (Barra)",
          "Supino Inclinado (Halter)", "Supino Inclinado (Máquina)", "Peck Deck", "CrossOver (Polia Alta)",
          "CrossOver (Polia Baixa)"],
  Costas: ["Puxada Alta (Aberta)", "Puxada Alta (Supinada)", "Puxada Alta (Triângulo)", "Remada Serrote", "Remada Baixa", 
           "Remada Cavalo", "Remada Máquina", "Barra Fixa", "Face Pull"],
  Bíceps: ["Rosca Direta (Barra)", "Rosca Direta (Halter)", "Rosca Alternada", "Rosca Scott", "Rosca Martelo", "Rosca Concentrada"],
  Tríceps: ["Pulley (Corda)", "Pulley (Barra Reta)", "Pulley (Barra V)", "Testa (Polia)", "Testa (Barra)", "Testa (Halter)", 
            "Francês (Halter)", "Francês (Polia)", "Mergulho (Máquina)"],
  Antebraço: ["Rosca Inversa", "Rosca Punho", "Rosca Punho Inversa"],
  Ombros: ["Desenvolvimento (Halter)", "Desenvolvimento (Máquina)", "Crucifixo Inverso", "Elevação Lateral", "Elevação Frontal"],
  Quadríceps: ["Agachamento Smith", "Agachamento Hack", "Cadeira Extensora", "Leg Press", "Búlgaro (Quadríceps)"],
  Posterior: ["Stiff (Barra)", "Stiff (Halter)", "Cadeira Flexora", "Mesa Flexora", "Búlgaro (Posterior)", "Elevação Pélvica", "Glúteo Máquina", "Glúteo Polia"],
  Abdomên: ["Abdominal Máquina", "Prancha", "Elevação de Pernas", "Crunch", "Abdominal Oblíquo", "Prancha Lateral"],
  Panturrilha: ["Panturrilha em Pé (Máquina)", "Panturrilha em Pé (Smith)", "Panturrilha Leg Press"],
};

const Biblioteca = () => {
  const [exercicioSelecionado, setExercicioSelecionado] = useState(null);
  const [tipoGrafico, setTipoGrafico] = useState("ambos");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [buscaExercicio, setBuscaExercicio] = useState("");
  const [imagemModal, setImagemModal] = useState(null);

  const toggleExercicio = (nome) => {
    setExercicioSelecionado(exercicioSelecionado === nome ? null : nome);
  };

  const buscarProgresso = (exercicio) => {
    const dados = JSON.parse(localStorage.getItem("gymtracker_cargas") || "[]");
    const progressoPorData = {};

    dados.forEach((item) => {
      if (item.exercicio === exercicio) {
        const data = item.data;

        if (!progressoPorData[data]) {
          progressoPorData[data] = {
            volumeTotal: 0,
            cargaMaxima: 0,
          };
        }

        item.series.forEach((serie) => {
          const carga = parseFloat(serie.carga || 0);
          const repeticoes = parseInt(serie.repeticoes || 0);
          const volume = carga * repeticoes;

          progressoPorData[data].volumeTotal += volume;
          if (carga > progressoPorData[data].cargaMaxima) {
            progressoPorData[data].cargaMaxima = carga;
          }
        });
      }
    });

    return Object.entries(progressoPorData)
      .map(([data, valores]) => ({
        data,
        volumeTotal: valores.volumeTotal,
        cargaMaxima: valores.cargaMaxima,
      }))
      .sort(
        (a, b) =>
          new Date(a.data.split("/").reverse()) -
          new Date(b.data.split("/").reverse())
      );
  };

  const grupoFiltrado = filtroGrupo
    ? { [filtroGrupo]: gruposMusculares[filtroGrupo] }
    : gruposMusculares;

  return (
    <div className="p-4 pb-24 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto">
      <h1 className="text-xl font-bold text-black mb-4">
        Biblioteca de Exercícios
      </h1>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value)}
        >
          <option value="">Todos os grupos</option>
          {Object.keys(gruposMusculares).map((grupo) => (
            <option key={grupo} value={grupo}>
              {grupo}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Buscar exercício"
          className="border rounded px-2 py-1 text-sm"
          value={buscaExercicio}
          onChange={(e) => setBuscaExercicio(e.target.value)}
        />
      </div>

      {/* Lista de exercícios */}
      {Object.entries(grupoFiltrado).map(([grupo, exercicios]) => {
        const exerciciosFiltrados = exercicios.filter((ex) =>
          ex.toLowerCase().includes(buscaExercicio.toLowerCase())
        );

        if (exerciciosFiltrados.length === 0) return null;

        return (
          <div key={grupo} className="mb-6">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">
              {grupo}
            </h2>
            <div className="space-y-2">
              {exerciciosFiltrados.map((exercicio) => (
                <div
                  key={exercicio}
                  className="bg-white text-black p-4 rounded-xl shadow-md"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <img
                        src={`/imagens/${exercicio}.jpg`}
                        alt={`Imagem de ${exercicio}`}
                        className="w-24 h-24 object-cover rounded-md cursor-pointer"
                        onClick={() =>
                          setImagemModal(`/imagens/${exercicio}.jpg`)
                        }
                      />
                      <span className="font-medium">{exercicio}</span>
                    </div>
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => toggleExercicio(exercicio)}
                    >
                      {exercicioSelecionado === exercicio
                        ? "Fechar"
                        : "Ver Progresso"}
                    </button>
                  </div>

                  {exercicioSelecionado === exercicio && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">Progresso</h3>
                      <div className="flex gap-2 mb-2">
                        {["ambos", "volume", "carga"].map((tipo) => (
                          <button
                            key={tipo}
                            className={`px-2 py-1 rounded text-sm ${
                              tipoGrafico === tipo
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200"
                            }`}
                            onClick={() => setTipoGrafico(tipo)}
                          >
                            {tipo === "ambos"
                              ? "📈 Ambos"
                              : tipo === "volume"
                              ? "🟦 Volume"
                              : "🟥 Carga"}
                          </button>
                        ))}
                      </div>

                      <div className="w-full h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={buscarProgresso(exercicio)}>
                            <XAxis dataKey="data" />
                            <YAxis />
                            <Tooltip
                              formatter={(value, name) =>
                                name === "volumeTotal"
                                  ? [`${value} kg`, "Volume Total"]
                                  : [`${value} kg`, "Carga Máxima"]
                              }
                              labelFormatter={(label) => `Data: ${label}`}
                            />
                            {(tipoGrafico === "ambos" ||
                              tipoGrafico === "volume") && (
                              <Line
                                type="monotone"
                                dataKey="volumeTotal"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Volume Total"
                              />
                            )}
                            {(tipoGrafico === "ambos" ||
                              tipoGrafico === "carga") && (
                              <Line
                                type="monotone"
                                dataKey="cargaMaxima"
                                stroke="#ef4444"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Carga Máxima"
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-4">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="border-b text-gray-600">
                              <th className="py-1">Data</th>
                              <th className="py-1">Volume Total (kg)</th>
                              <th className="py-1">Carga Máxima (kg)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {buscarProgresso(exercicio).map((item, index) => (
                              <tr key={index} className="border-b">
                                <td className="py-1">{item.data}</td>
                                <td className="py-1">{item.volumeTotal} kg</td>
                                <td className="py-1">{item.cargaMaxima} kg</td>
                              </tr>
                            ))}
                            {buscarProgresso(exercicio).length === 0 && (
                              <tr>
                                <td
                                  colSpan="3"
                                  className="py-2 text-gray-400 text-center"
                                >
                                  Nenhum progresso registrado ainda.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {imagemModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setImagemModal(null)}
        >
          <img
            src={imagemModal}
            alt="Exercício"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export const exercicios = Object.entries(gruposMusculares).flatMap(
  ([grupoMuscular, nomes]) =>
    nomes.map((nome) => ({
      id: `${grupoMuscular}-${nome}`,
      nome,
      grupoMuscular,
    }))
);

export default Biblioteca;
