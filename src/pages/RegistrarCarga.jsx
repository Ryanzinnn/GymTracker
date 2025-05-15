import { useState, useEffect } from "react";
import { exercicios as exerciciosDaBiblioteca } from "./Biblioteca";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage";

const RegistrarCarga = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [exercicios, setExercicios] = useState([]);
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState("Todos");
  const [tituloTreino, setTituloTreino] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    setExercicios(exerciciosDaBiblioteca);
  }, []);

  const handleAdicionarExercicio = (exercicio) => {
    setExerciciosSelecionados((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        nome: exercicio.nome,
        grupoMuscular: exercicio.grupoMuscular,
        series: [{ carga: "", repeticoes: "" }],
      },
    ]);
    setModalAberto(false);
  };

  const handleAlterarSerie = (exIndex, serieIndex, campo, valor) => {
    setExerciciosSelecionados((prev) =>
      prev.map((exercicio, i) =>
        i === exIndex
          ? {
              ...exercicio,
              series: exercicio.series.map((serie, j) =>
                j === serieIndex ? { ...serie, [campo]: valor } : serie
              ),
            }
          : exercicio
      )
    );
  };

  const handleAdicionarSerie = (exIndex) => {
    setExerciciosSelecionados((prev) =>
      prev.map((exercicio, i) => {
        if (i !== exIndex) return exercicio;

        const seriesExistentes = exercicio.series;
        const ultimaSerie = seriesExistentes[seriesExistentes.length - 1];
        const novaSerie = { ...ultimaSerie }; // Copia os valores da última

        return {
          ...exercicio,
          series: [...seriesExistentes, novaSerie],
        };
      })
    );
  };

  const handleRemoverExercicio = (exIndex) => {
    const novaLista = [...exerciciosSelecionados];
    novaLista.splice(exIndex, 1);
    setExerciciosSelecionados(novaLista);
  };

  const handleSalvar = () => {
    if (!tituloTreino.trim()) {
      return alert("Digite um título para o treino.");
    }

    if (exerciciosSelecionados.length === 0)
      return alert("Adicione ao menos um exercício.");

    const registrosSalvos = getUserData("gymtracker_cargas", user?.uid);

    const dataAtual = new Date().toLocaleDateString();

    const novosRegistros = exerciciosSelecionados.map((ex) => ({
      id: Date.now() + Math.random(),
      tituloTreino: tituloTreino.trim(),
      exercicio: ex.nome,
      grupoMuscular: ex.grupoMuscular,
      data: dataAtual,
      series: ex.series,
    }));

    localStorage.setItem(
      "gymtracker_cargas",
      JSON.stringify([...registrosSalvos, ...novosRegistros])
    );

    alert("Registros salvos com sucesso!");
    
    saveUserData("gymtracker_cargas", user?.uid, [...registrosSalvos, ...novosRegistros]);
    setTituloTreino("");
    setExerciciosSelecionados([]);
  };

  const gruposDisponiveis = [
    "Todos",
    ...new Set(exercicios.map((e) => e.grupoMuscular)),
  ];

  const exerciciosFiltrados =
    grupoSelecionado === "Todos"
      ? exercicios
      : exercicios.filter((e) => e.grupoMuscular === grupoSelecionado);

  const exerciciosAgrupados = exerciciosFiltrados.reduce((acc, exercicio) => {
    const grupo = exercicio.grupoMuscular;
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(exercicio);
    return acc;
  }, {});

  return (
    <div className="p-4 pb-24 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Registrar Carga</h1>
      <input
        type="text"
        placeholder="Título do treino"
        value={tituloTreino}
        onChange={(e) => setTituloTreino(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => setModalAberto(true)}
      >
        Adicionar exercício
      </button>

      {exerciciosSelecionados.map((ex, exIndex) => (
        <div key={ex.id} className="mb-6 p-4 bg-gray-100 rounded shadow">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="font-bold text-gray-800">{ex.nome}</p>
              <p className="text-sm text-gray-600">{ex.grupoMuscular}</p>
            </div>
            <button
              onClick={() => handleRemoverExercicio(exIndex)}
              className="text-red-500 text-sm"
            >
              Remover
            </button>
          </div>

          {ex.series.map((serie, serieIndex) => (
            <div key={serieIndex} className="grid grid-cols-2 gap-4 mb-2">
              <input
                type="number"
                placeholder="Carga (kg)"
                className="border rounded px-3 py-2"
                value={serie.carga}
                onChange={(e) =>
                  handleAlterarSerie(
                    exIndex,
                    serieIndex,
                    "carga",
                    e.target.value
                  )
                }
              />
              <input
                type="number"
                placeholder="Repetições"
                className="border rounded px-3 py-2"
                value={serie.repeticoes}
                onChange={(e) =>
                  handleAlterarSerie(
                    exIndex,
                    serieIndex,
                    "repeticoes",
                    e.target.value
                  )
                }
              />
            </div>
          ))}

          <button
            onClick={() => handleAdicionarSerie(exIndex)}
            className="text-blue-500 text-sm underline"
          >
            Adicionar série
          </button>
        </div>
      ))}

      {exerciciosSelecionados.length > 0 && (
        <button
          onClick={handleSalvar}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Salvar Todos os Registros
        </button>
      )}

      {/* Modal de Exercícios */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Escolha um exercício</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por grupo muscular:
              </label>
              <select
                value={grupoSelecionado}
                onChange={(e) => setGrupoSelecionado(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {gruposDisponiveis.map((grupo) => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
              </select>
            </div>

            {Object.entries(exerciciosAgrupados).map(([grupo, lista]) => (
              <div key={grupo} className="mb-4">
                <h3 className="text-md font-semibold text-gray-800 mb-2">
                  {grupo}
                </h3>
                {lista.map((exercicio) => (
                  <div
                    key={exercicio.id}
                    onClick={() => handleAdicionarExercicio(exercicio)}
                    className="p-3 border rounded cursor-pointer hover:bg-blue-100 mb-2"
                  >
                    <p className="font-semibold text-gray-800">
                      {exercicio.nome}
                    </p>
                    <p className="text-sm text-gray-500">
                      {exercicio.grupoMuscular}
                    </p>
                  </div>
                ))}
              </div>
            ))}

            <button
              onClick={() => setModalAberto(false)}
              className="mt-4 text-sm text-blue-600 underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarCarga;
