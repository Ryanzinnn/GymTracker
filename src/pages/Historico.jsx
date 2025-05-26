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
  Clock,
  BarChart2,
  Award,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  Search,
  X,
  Bookmark,
  Star,
  ArrowRight,
  Repeat,
  Flame,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";

const Historico = () => {
  const { user } = useAuth();
  const [registrosAgrupados, setRegistrosAgrupados] = useState({});
  const [expandedDates, setExpandedDates] = useState({});
  const [grupoSelecionado, setGrupoSelecionado] = useState("Todos");
  const [tituloSelecionado, setTituloSelecionado] = useState("Todos");
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hoveredExercise, setHoveredExercise] = useState(null);
  const [animateStats, setAnimateStats] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Animação das estatísticas
  useEffect(() => {
    if (showStats) {
      const timer = setTimeout(() => {
        setAnimateStats(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAnimateStats(false);
    }
  }, [showStats]);

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

  // Função para filtrar registros com base em todos os critérios
  const filtrarRegistros = () => {
    return Object.entries(registrosAgrupados).reduce(
      (acc, [data, registros]) => {
        const filtrados = registros.filter(
          (r) =>
            // Filtro de grupo muscular
            (grupoSelecionado === "Todos" ||
              r.grupoMuscular === grupoSelecionado) &&
            // Filtro de título de treino
            (tituloSelecionado === "Todos" ||
              (r.tituloTreino || "Sem título") === tituloSelecionado) &&
            // Filtro de busca por texto
            (searchTerm === "" ||
              r.exercicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (r.tituloTreino || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              (r.grupoMuscular || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))
        );

        if (filtrados.length > 0) acc[data] = filtrados;

        return acc;
      },
      {}
    );
  };

  const registrosFiltrados = filtrarRegistros();

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const todosRegistros = Object.values(registrosAgrupados).flat();

    // Total de treinos (dias únicos)
    const totalTreinos = Object.keys(registrosAgrupados).length;

    // Total de exercícios
    const totalExercicios = todosRegistros.length;

    // Grupo muscular mais treinado
    const gruposPorFrequencia = todosRegistros.reduce((acc, reg) => {
      if (reg.grupoMuscular) {
        acc[reg.grupoMuscular] = (acc[reg.grupoMuscular] || 0) + 1;
      }
      return acc;
    }, {});

    let grupoMaisTreinado = { nome: "Nenhum", contagem: 0 };
    Object.entries(gruposPorFrequencia).forEach(([grupo, contagem]) => {
      if (contagem > grupoMaisTreinado.contagem) {
        grupoMaisTreinado = { nome: grupo, contagem };
      }
    });

    // Exercício mais realizado
    const exerciciosPorFrequencia = todosRegistros.reduce((acc, reg) => {
      acc[reg.exercicio] = (acc[reg.exercicio] || 0) + 1;
      return acc;
    }, {});

    let exercicioMaisRealizado = { nome: "Nenhum", contagem: 0 };
    Object.entries(exerciciosPorFrequencia).forEach(([exercicio, contagem]) => {
      if (contagem > exercicioMaisRealizado.contagem) {
        exercicioMaisRealizado = { nome: exercicio, contagem };
      }
    });

    // Carga máxima levantada
    let cargaMaxima = { exercicio: "Nenhum", valor: 0 };
    todosRegistros.forEach((reg) => {
      reg.series.forEach((serie) => {
        const carga = parseFloat(serie.carga) || 0;
        if (carga > cargaMaxima.valor) {
          cargaMaxima = { exercicio: reg.exercicio, valor: carga };
        }
      });
    });

    return {
      totalTreinos,
      totalExercicios,
      grupoMaisTreinado,
      exercicioMaisRealizado,
      cargaMaxima,
    };
  };

  const estatisticas = calcularEstatisticas();

  // Função para obter cor baseada no grupo muscular
  const getGrupoColor = (grupo) => {
    const cores = {
      Peito: "#ec4899", // Rosa
      Costas: "#3b82f6", // Azul
      Pernas: "#f97316", // Laranja
      Ombros: "#8b5cf6", // Roxo
      Bíceps: "#10b981", // Verde
      Tríceps: "#f59e0b", // Âmbar
      Abdômen: "#ef4444", // Vermelho
      Glúteos: "#6366f1", // Índigo
      Panturrilha: "#14b8a6", // Turquesa
      Antebraço: "#a855f7", // Púrpura
    };

    return cores[grupo] || "#64748b"; // Cinza como cor padrão
  };

  // Função para formatar data
  const formatarData = (dataString) => {
    const [dia, mes, ano] = dataString.split("/");
    return `${dia}/${mes}/${ano}`;
  };

  // Função para verificar se este registro representa um progresso de carga
  const verificarProgressoReal = (registro, data) => {
    const todosRegistros = Object.entries(registrosAgrupados)
      .flatMap(([dataReg, regs]) =>
        regs.map((r) => ({ ...r, dataCompleta: dataReg }))
      )
      .filter((r) => r.exercicio === registro.exercicio);

    todosRegistros.sort((a, b) => {
      const dataA = new Date(a.dataCompleta.split("/").reverse().join("-"));
      const dataB = new Date(b.dataCompleta.split("/").reverse().join("-"));
      return dataA - dataB;
    });

    const indexAtual = todosRegistros.findIndex(
      (r) => r.dataCompleta === data && r.id === registro.id
    );

    if (indexAtual <= 0) return null; // primeiro registro ou não encontrado

    const registroAnterior = todosRegistros[indexAtual - 1];

    // Carga máxima
    const cargaMaximaAtual = Math.max(
      ...registro.series.map((s) => parseFloat(s.carga) || 0)
    );
    const cargaMaximaAnterior = Math.max(
      ...registroAnterior.series.map((s) => parseFloat(s.carga) || 0)
    );

    // Volume total
    const volumeAtual = registro.series.reduce(
      (acc, s) =>
        acc + (parseFloat(s.carga) || 0) * (parseInt(s.repeticoes) || 0),
      0
    );
    const volumeAnterior = registroAnterior.series.reduce(
      (acc, s) =>
        acc + (parseFloat(s.carga) || 0) * (parseInt(s.repeticoes) || 0),
      0
    );

    const diferencaCarga = cargaMaximaAtual - cargaMaximaAnterior;
    const diferencaVolume = volumeAtual - volumeAnterior;

    return {
      diferencaCarga,
      diferencaVolume,
      cargaAnterior: cargaMaximaAnterior,
      cargaAtual: cargaMaximaAtual,
      volumeAnterior,
      volumeAtual,
    };
  };

  return (
    <PageWrapper>
      <div
        className={`pb-32 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center">
            <History size={24} className="text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-white">
              Histórico de Treinos
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="bg-blue-500/10 text-blue-400 p-1.5 rounded-full hover:bg-blue-500/20 transition-all duration-200"
              title={
                showStats ? "Ocultar estatísticas" : "Mostrar estatísticas"
              }
            >
              <BarChart2 size={20} />
            </button>
            {Object.keys(registrosAgrupados).length > 0 && (
              <button
                onClick={handleLimparHistorico}
                className="bg-red-500/10 text-red-400 p-1.5 rounded-full hover:bg-red-500/20 transition-all duration-200"
                title="Limpar todo o histórico de treinos"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
        <div className="p-1 max-w-screen-md mx-auto space-y-6">
          {/* Painel de estatísticas */}
          {showStats && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-800/80 p-4 border-b border-slate-700 animate-fadeIn">
              <div className="flex items-center mb-3">
                <Award size={18} className="text-blue-400 mr-2" />
                <h2 className="text-white font-medium">
                  Estatísticas de Treino
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-3 transform hover:scale-105 transition-all duration-300">
                  <div className="text-xs text-gray-400 mb-1">
                    Total de treinos
                  </div>
                  <div
                    className={`text-xl font-bold text-white ${
                      animateStats ? "animate-countUp" : ""
                    }`}
                  >
                    {estatisticas.totalTreinos}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 transform hover:scale-105 transition-all duration-300">
                  <div className="text-xs text-gray-400 mb-1">
                    Exercícios realizados
                  </div>
                  <div
                    className={`text-xl font-bold text-white ${
                      animateStats ? "animate-countUp" : ""
                    }`}
                  >
                    {estatisticas.totalExercicios}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 transform hover:scale-105 transition-all duration-300">
                  <div className="text-xs text-gray-400 mb-1">
                    Grupo mais treinado
                  </div>
                  <div className="text-lg font-bold text-white truncate">
                    {estatisticas.grupoMaisTreinado.nome}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 transform hover:scale-105 transition-all duration-300">
                  <div className="text-xs text-gray-400 mb-1">Carga máxima</div>
                  <div className="text-lg font-bold text-white flex items-center">
                    <span
                      className={`${animateStats ? "animate-countUp" : ""}`}
                    >
                      {estatisticas.cargaMaxima.valor}
                    </span>
                    <span className="text-sm ml-1">kg</span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {estatisticas.cargaMaxima.exercicio}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barra de pesquisa e filtros */}
          <div className="p-4 border-b border-slate-700">
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar exercício, grupo muscular ou título..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveFilters(!activeFilters)}
                className={`flex items-center text-sm ${
                  activeFilters ? "text-blue-400" : "text-gray-400"
                } hover:text-blue-300 transition-colors`}
              >
                <Filter size={16} className="mr-1.5" />
                Filtros avançados
                <ChevronDown
                  size={16}
                  className={`ml-1 transform transition-transform duration-300 ${
                    activeFilters ? "rotate-180" : ""
                  }`}
                />
              </button>

              {(grupoSelecionado !== "Todos" ||
                tituloSelecionado !== "Todos" ||
                searchTerm) && (
                <button
                  onClick={() => {
                    setGrupoSelecionado("Todos");
                    setTituloSelecionado("Todos");
                    setSearchTerm("");
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {activeFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-fadeIn">
                <div className="relative">
                  <label className="block text-xs text-gray-400 mb-1 ml-1">
                    Grupo Muscular
                  </label>
                  <div className="relative">
                    <select
                      value={grupoSelecionado}
                      onChange={(e) => setGrupoSelecionado(e.target.value)}
                      className="w-full bg-slate-700 text-white border-none rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs text-gray-400 mb-1 ml-1">
                    Título do Treino
                  </label>
                  <div className="relative">
                    <select
                      value={tituloSelecionado}
                      onChange={(e) => setTituloSelecionado(e.target.value)}
                      className="w-full bg-slate-700 text-white border-none rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resultados da busca */}
          {Object.keys(registrosFiltrados).length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center animate-fadeIn">
              <div className="bg-slate-700/50 p-4 rounded-full mb-3">
                <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-300 text-lg mb-1">
                Nenhum registro de treino encontrado
              </p>
              <p className="text-gray-400 text-sm">
                {grupoSelecionado !== "Todos" ||
                tituloSelecionado !== "Todos" ||
                searchTerm
                  ? "Tente mudar os filtros ou termos de busca"
                  : "Registre seus treinos para começar a construir seu histórico"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(registrosFiltrados).map(
                ([data, registros], dateIndex) => (
                  <div
                    key={data}
                    className={`bg-slate-800 rounded-xl overflow-hidden shadow-lg animate-fadeIn transform transition-all duration-300 ${
                      hoveredDate === data ? "scale-[1.01] shadow-xl" : ""
                    }`}
                    style={{ animationDelay: `${dateIndex * 100}ms` }}
                    onMouseEnter={() => setHoveredDate(data)}
                    onMouseLeave={() => setHoveredDate(null)}
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
                          <h2 className="text-white font-semibold flex items-center">
                            {formatarData(data)}{" "}
                            <span className="text-gray-400 font-normal ml-2 text-sm capitalize">
                              ({getDiaSemana(data)})
                            </span>
                          </h2>
                          <div className="flex items-center text-sm text-gray-400">
                            <Bookmark size={14} className="mr-1" />
                            <span className="mr-2">
                              {registros[0]?.tituloTreino || "Treino"}
                            </span>
                            <span className="mx-1">•</span>
                            <Dumbbell size={14} className="mx-1" />
                            <span>
                              {registros.length}{" "}
                              {registros.length === 1
                                ? "exercício"
                                : "exercícios"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`bg-slate-700 rounded-lg p-1.5 transform transition-transform duration-300 ${
                          expandedDates[data] ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown size={18} className="text-gray-400" />
                      </div>
                    </div>

                    {expandedDates[data] && (
                      <div className="px-4 pb-4 space-y-3 animate-fadeIn">
                        {registros.map((registro, regIndex) => {
                          // Verificar se este registro representa um progresso real
                          const progressoReal = verificarProgressoReal(
                            registro,
                            data
                          );

                          return (
                            <div
                              key={registro.id}
                              className={`bg-slate-700/50 rounded-lg p-4 border-l-4 transform transition-all duration-300 ${
                                hoveredExercise === registro.id
                                  ? "scale-[1.02] shadow-md"
                                  : ""
                              }`}
                              style={{
                                animationDelay: `${regIndex * 50}ms`,
                                borderLeftColor: getGrupoColor(
                                  registro.grupoMuscular
                                ),
                              }}
                              onMouseEnter={() =>
                                setHoveredExercise(registro.id)
                              }
                              onMouseLeave={() => setHoveredExercise(null)}
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
                                <div
                                  className="text-xs px-2 py-0.5 rounded-full flex items-center"
                                  style={{
                                    backgroundColor: `${getGrupoColor(
                                      registro.grupoMuscular
                                    )}20`,
                                    color: getGrupoColor(
                                      registro.grupoMuscular
                                    ),
                                  }}
                                >
                                  {registro.grupoMuscular}
                                </div>
                              </div>

                              {registro.tituloTreino && (
                                <div className="flex items-center mb-3 text-xs text-gray-400">
                                  <Tag size={12} className="mr-1" />
                                  {registro.tituloTreino}
                                </div>
                              )}

                              {/* Progresso de carga - mostrado APENAS quando há progresso real */}
                              {progressoReal && (
                                <div
                                  className={`mb-3 text-xs ${
                                    progressoReal.diferencaCarga > 0
                                      ? "text-green-400"
                                      : progressoReal.diferencaCarga < 0
                                      ? "text-red-400"
                                      : progressoReal.diferencaVolume > 0
                                      ? "text-green-400"
                                      : progressoReal.diferencaVolume < 0
                                      ? "text-red-400"
                                      : "text-gray-400"
                                  } bg-slate-800/50 rounded-lg p-2 flex items-center`}
                                >
                                  {progressoReal.diferencaCarga > 0 ? (
                                    <>
                                      <TrendingUp size={14} className="mr-1" />
                                      <span>
                                        Progresso de carga: +
                                        {progressoReal.diferencaCarga.toFixed(
                                          1
                                        )}{" "}
                                        kg
                                      </span>
                                    </>
                                  ) : progressoReal.diferencaCarga < 0 ? (
                                    <>
                                      <TrendingUp
                                        size={14}
                                        className="mr-1 transform rotate-180"
                                      />
                                      <span>
                                        Redução de carga:{" "}
                                        {progressoReal.diferencaCarga.toFixed(
                                          1
                                        )}{" "}
                                        kg
                                      </span>
                                    </>
                                  ) : progressoReal.diferencaVolume > 0 ? (
                                    <>
                                      <TrendingUp size={14} className="mr-1" />
                                      <span>
                                        Progresso de volume: +
                                        {progressoReal.diferencaVolume.toFixed(
                                          1
                                        )}{" "}
                                        kg x reps
                                      </span>
                                    </>
                                  ) : progressoReal.diferencaVolume < 0 ? (
                                    <>
                                      <TrendingUp
                                        size={14}
                                        className="mr-1 transform rotate-180"
                                      />
                                      <span>
                                        Redução de volume:{" "}
                                        {progressoReal.diferencaVolume.toFixed(
                                          1
                                        )}{" "}
                                        kg x reps
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Info size={14} className="mr-1" />
                                      <span>
                                        Sem alteração na carga ou volume
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}

                              <div className="space-y-2 mt-3">
                                {registro.series.map((serie, index) => (
                                  <div
                                    key={index}
                                    className="grid grid-cols-12 gap-2 items-center bg-slate-800/70 rounded-lg p-2 hover:bg-slate-800 transition-colors"
                                  >
                                    <div className="col-span-1">
                                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                                        <span className="text-xs font-medium text-gray-300">
                                          {index + 1}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-span-5 text-sm">
                                      <div className="flex items-center">
                                        <span className="text-gray-400 mr-1 text-xs">
                                          Carga:
                                        </span>{" "}
                                        <span className="text-white font-medium">
                                          {serie.carga || "0"}
                                          <span className="text-xs ml-0.5">
                                            kg
                                          </span>
                                        </span>
                                      </div>
                                    </div>
                                    <div className="col-span-6 text-sm">
                                      <div className="flex items-center">
                                        <span className="text-gray-400 mr-1 text-xs">
                                          Reps:
                                        </span>{" "}
                                        <span className="text-white font-medium">
                                          {serie.repeticoes || "0"}
                                        </span>
                                        {index === 0 &&
                                          serie.repeticoes >= 12 && (
                                            <span className="ml-1.5 text-xs text-yellow-400 flex items-center">
                                              <Flame
                                                size={10}
                                                className="mr-0.5"
                                              />{" "}
                                              max
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* Dica de treino */}
          {Object.keys(registrosFiltrados).length > 0 && (
            <div className="bg-blue-500/10 p-4 rounded-xl flex items-start text-sm text-blue-300 animate-pulse mt-4">
              <div className="bg-blue-500/20 p-2 rounded-full mr-3 mt-0.5">
                <Zap size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-blue-400 mb-1">Dica de treino</p>
                <p>
                  Acompanhe seu progresso regularmente e aumente gradualmente a
                  carga para maximizar seus ganhos!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Historico;
