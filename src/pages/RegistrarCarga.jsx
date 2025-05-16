import { useState, useEffect } from "react";
import { exercicios as exerciciosDaBiblioteca } from "./Biblioteca";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage";
import { XCircle } from "lucide-react"; // Ícone para limpar registro

const CHAVE_REGISTRO_EM_ANDAMENTO = "gymtracker_registro_em_andamento";

const RegistrarCarga = () => {
  const { user } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);
  const [exercicios, setExercicios] = useState([]);
  
  // Estados que serão persistidos
  const [tituloTreino, setTituloTreino] = useState("");
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
  
  const [grupoSelecionadoModal, setGrupoSelecionadoModal] = useState("Todos"); // Estado para o filtro do modal

  // Carregar dados da biblioteca de exercícios
  useEffect(() => {
    setExercicios(exerciciosDaBiblioteca);
  }, []);

  // Carregar registro em andamento do localStorage ao montar
  useEffect(() => {
    if (user?.uid) {
      const chaveStorage = `${CHAVE_REGISTRO_EM_ANDAMENTO}_${user.uid}`;
      const registroSalvo = localStorage.getItem(chaveStorage);
      if (registroSalvo) {
        try {
          const dados = JSON.parse(registroSalvo);
          setTituloTreino(dados.tituloTreino || "");
          setExerciciosSelecionados(dados.exerciciosSelecionados || []);
        } catch (error) {
          console.error("Erro ao carregar registro em andamento:", error);
          localStorage.removeItem(chaveStorage); // Remove dados inválidos
        }
      }
    }
  }, [user]);

  // Salvar registro em andamento no localStorage quando houver alterações
  useEffect(() => {
    if (user?.uid) {
      const chaveStorage = `${CHAVE_REGISTRO_EM_ANDAMENTO}_${user.uid}`;
      // Salva apenas se houver título ou algum exercício selecionado
      if (tituloTreino.trim() !== "" || exerciciosSelecionados.length > 0) {
        const dadosParaSalvar = {
          tituloTreino,
          exerciciosSelecionados,
        };
        localStorage.setItem(chaveStorage, JSON.stringify(dadosParaSalvar));
      } else {
        // Se ambos estiverem vazios, remove o rascunho para não mostrar "Continuar Registro"
        localStorage.removeItem(chaveStorage);
      }
    }
  }, [tituloTreino, exerciciosSelecionados, user]);

  const handleAdicionarExercicio = (exercicio) => {
    setExerciciosSelecionados((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(), // ID único para o item na lista atual
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
        const ultimaSerie = seriesExistentes.length > 0 ? seriesExistentes[seriesExistentes.length - 1] : { carga: "", repeticoes: "" };
        const novaSerie = { ...ultimaSerie };
        return {
          ...exercicio,
          series: [...seriesExistentes, novaSerie],
        };
      })
    );
  };

  const handleRemoverExercicio = (exIndex) => {
    setExerciciosSelecionados((prev) => prev.filter((_, i) => i !== exIndex));
  };
  
  const handleRemoverSerie = (exIndex, serieIndex) => {
    setExerciciosSelecionados((prev) =>
      prev.map((exercicio, i) => {
        if (i === exIndex) {
          // Não permite remover a última série, apenas limpa ela ou informa o usuário
          if (exercicio.series.length === 1) {
            alert("Cada exercício deve ter pelo menos uma série. Você pode alterar os valores ou remover o exercício inteiro.");
            return exercicio; 
          }
          return {
            ...exercicio,
            series: exercicio.series.filter((_, j) => j !== serieIndex),
          };
        }
        return exercicio;
      })
    );
  };

  const limparRegistroAtual = () => {
    setTituloTreino("");
    setExerciciosSelecionados([]);
    if (user?.uid) {
      localStorage.removeItem(`${CHAVE_REGISTRO_EM_ANDAMENTO}_${user.uid}`);
    }
    alert("Registro atual limpo.");
  };

  const handleSalvar = () => {
    if (!user?.uid) return alert("Faça login para salvar.");
    if (!tituloTreino.trim()) return alert("Digite um título para o treino.");
    if (exerciciosSelecionados.length === 0) return alert("Adicione ao menos um exercício.");

    // Validação de séries preenchidas
    for (const ex of exerciciosSelecionados) {
      for (const serie of ex.series) {
        if (serie.carga.trim() === "" || serie.repeticoes.trim() === "") {
          alert(`Preencha todas as cargas e repetições para o exercício: ${ex.nome}`);
          return;
        }
      }
    }

    const registrosSalvos = getUserData("gymtracker_cargas", user.uid) || [];
    const dataAtual = new Date().toLocaleDateString("pt-BR");

    const novosRegistros = exerciciosSelecionados.map((ex) => ({
      id: Date.now() + Math.random(), // ID único para o registro salvo
      tituloTreino: tituloTreino.trim(),
      exercicio: ex.nome,
      grupoMuscular: ex.grupoMuscular,
      data: dataAtual,
      series: ex.series.map(s => ({ carga: parseFloat(s.carga) || 0, repeticoes: parseInt(s.repeticoes) || 0 })),
    }));

    saveUserData("gymtracker_cargas", user.uid, [...registrosSalvos, ...novosRegistros]);
    
    // Limpar localStorage do registro em andamento
    localStorage.removeItem(`${CHAVE_REGISTRO_EM_ANDAMENTO}_${user.uid}`);
    
    alert("Treino salvo com sucesso!");
    setTituloTreino("");
    setExerciciosSelecionados([]);
  };

  const gruposDisponiveis = [
    "Todos",
    ...new Set(exercicios.map((e) => e.grupoMuscular)),
  ];

  const exerciciosFiltradosModal =
    grupoSelecionadoModal === "Todos"
      ? exercicios
      : exercicios.filter((e) => e.grupoMuscular === grupoSelecionadoModal);

  const exerciciosAgrupadosModal = exerciciosFiltradosModal.reduce((acc, exercicio) => {
    const grupo = exercicio.grupoMuscular;
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(exercicio);
    return acc;
  }, {});

  return (
    <div className="p-4 pb-24 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Registrar Carga</h1>
        {(tituloTreino.trim() !== "" || exerciciosSelecionados.length > 0) && (
          <button
            onClick={limparRegistroAtual}
            className="text-red-500 hover:text-red-700 flex items-center text-sm"
            title="Limpar treino atual"
          >
            <XCircle size={18} className="mr-1" /> Limpar Atual
          </button>
        )}
      </div>
      <input
        type="text"
        placeholder="Título do treino (ex: Treino A - Peito e Tríceps)"
        value={tituloTreino}
        onChange={(e) => setTituloTreino(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 w-full sm:w-auto"
        onClick={() => setModalAberto(true)}
      >
        Adicionar Exercício
      </button>

      {exerciciosSelecionados.length === 0 && (
        <p className="text-gray-500 text-center my-6">Nenhum exercício adicionado ainda.</p>
      )}

      {exerciciosSelecionados.map((ex, exIndex) => (
        <div key={ex.id} className="mb-6 p-4 bg-gray-50 rounded-lg shadow-md border">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-bold text-gray-800">{ex.nome}</p>
              <p className="text-sm text-gray-600">{ex.grupoMuscular}</p>
            </div>
            <button
              onClick={() => handleRemoverExercicio(exIndex)}
              className="text-red-500 hover:text-red-700 text-sm p-1"
            >
              Remover Exercício
            </button>
          </div>

          {ex.series.map((serie, serieIndex) => (
            <div key={serieIndex} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <span className="col-span-1 text-sm text-gray-600 text-right">{serieIndex + 1}°</span>
              <div className="col-span-5">
                <input
                  type="number"
                  placeholder="Carga (kg)"
                  className="border rounded px-3 py-2 w-full text-sm"
                  value={serie.carga}
                  onChange={(e) =>
                    handleAlterarSerie(exIndex, serieIndex, "carga", e.target.value)
                  }
                />
              </div>
              <div className="col-span-5">
                <input
                  type="number"
                  placeholder="Reps"
                  className="border rounded px-3 py-2 w-full text-sm"
                  value={serie.repeticoes}
                  onChange={(e) =>
                    handleAlterarSerie(exIndex, serieIndex, "repeticoes", e.target.value)
                  }
                />
              </div>
              <div className="col-span-1 flex justify-center">
                {ex.series.length > 1 && (
                    <button 
                        onClick={() => handleRemoverSerie(exIndex, serieIndex)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="Remover esta série"
                    >
                        <XCircle size={16}/>
                    </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => handleAdicionarSerie(exIndex)}
            className="text-blue-500 hover:text-blue-700 text-sm underline mt-1"
          >
            + Adicionar Série
          </button>
        </div>
      ))}

      {exerciciosSelecionados.length > 0 && (
        <button
          onClick={handleSalvar}
          className="bg-green-600 text-white px-4 py-2 rounded w-full mt-6"
        >
          Salvar Treino
        </button>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 pt-10 sm:pt-20 px-4">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg shadow-xl max-h-[85vh] flex flex-col">
            <h2 className="text-lg font-bold mb-4">Escolha um Exercício</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por grupo muscular:
              </label>
              <select
                value={grupoSelecionadoModal} // Usar estado do modal
                onChange={(e) => setGrupoSelecionadoModal(e.target.value)} // Atualizar estado do modal
                className="w-full border rounded px-3 py-2 bg-white"
              >
                {gruposDisponiveis.map((grupo) => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-y-auto flex-grow pr-2">
              {Object.entries(exerciciosAgrupadosModal).map(([grupo, lista]) => (
                <div key={grupo} className="mb-4">
                  <h3 className="text-md font-semibold text-gray-700 mb-2 sticky top-0 bg-white py-1">{grupo}</h3>
                  {lista.map((exercicio) => (
                    <div
                      key={exercicio.id}
                      onClick={() => handleAdicionarExercicio(exercicio)}
                      className="p-3 border rounded cursor-pointer hover:bg-blue-50 mb-2 transition-colors duration-150"
                    >
                      <p className="font-medium text-gray-800">{exercicio.nome}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button
              onClick={() => setModalAberto(false)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline self-start"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarCarga;

