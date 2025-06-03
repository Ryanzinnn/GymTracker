import { useState, useEffect, useRef } from "react"; // Adicionado useRef
import { motion, AnimatePresence } from "framer-motion";
import { exercicios as exerciciosDaBiblioteca } from "./Biblioteca";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage";
import {
  XCircle,
  Plus,
  Trash2,
  Dumbbell,
  Save,
  Filter,
  X,
  ChevronRight,
  BarChart3,
  CircleArrowRight,
  CircleArrowDown,
  Clock,
  Sparkles,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";
import CronometroDescanso from "../components/CronometroDescanso";

const CHAVE_REGISTRO_EM_ANDAMENTO = "gymtracker_registro_em_andamento";

// Variantes de animação para framer-motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

const RegistrarCarga = () => {
  const { user } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);
  const [exercicios, setExercicios] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [cronometroVisivel, setCronometroVisivel] = useState(true);
  const [animateButton, setAnimateButton] = useState(false);

  // Estados que serão persistidos
  const [tituloTreino, setTituloTreino] = useState("");
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);

  const [grupoSelecionadoModal, setGrupoSelecionadoModal] = useState("Todos"); // Estado para o filtro do modal

  // Ref para o último exercício adicionado
  const ultimoExercicioRef = useRef(null);

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

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

  // Efeito para rolar para o último exercício adicionado
  useEffect(() => {
    if (ultimoExercicioRef.current) {
      // Usar setTimeout para garantir que o DOM foi atualizado após a adição
      setTimeout(() => {
        ultimoExercicioRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100); // Pequeno delay pode ser necessário
    }
  }, [exerciciosSelecionados.length]); // Disparar quando o número de exercícios mudar

  const handleAdicionarExercicio = (exercicio) => {
    const novoExercicio = {
      id: Date.now() + Math.random(), // ID único para o item na lista atual
      nome: exercicio.nome,
      grupoMuscular: exercicio.grupoMuscular,
      series: [{ carga: "", repeticoes: "" }],
    };
    setExerciciosSelecionados((prev) => [
      ...prev,
      novoExercicio
    ]);
    setModalAberto(false);
    
    // Animar botão de salvar
    setAnimateButton(true);
    setTimeout(() => setAnimateButton(false), 1000);
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
        const ultimaSerie =
          seriesExistentes.length > 0
            ? seriesExistentes[seriesExistentes.length - 1]
            : { carga: "", repeticoes: "" };
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
            alert(
              "Cada exercício deve ter pelo menos uma série. Você pode alterar os valores ou remover o exercício inteiro."
            );
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
    if (window.confirm("Tem certeza que deseja limpar o treino atual?")) {
      setTituloTreino("");
      setExerciciosSelecionados([]);
      if (user?.uid) {
        localStorage.removeItem(`${CHAVE_REGISTRO_EM_ANDAMENTO}_${user.uid}`);
      }
    }
  };

  const handleSalvar = () => {
    if (!user?.uid) return alert("Faça login para salvar.");
    if (!tituloTreino.trim()) return alert("Digite um título para o treino.");
    if (exerciciosSelecionados.length === 0)
      return alert("Adicione ao menos um exercício.");

    // Validação de séries preenchidas
    for (const ex of exerciciosSelecionados) {
      for (const serie of ex.series) {
        if (serie.carga.trim() === "" || serie.repeticoes.trim() === "") {
          alert(
            `Preencha todas as cargas e repetições para o exercício: ${ex.nome}`
          );
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
      series: ex.series.map((s) => ({
        carga: parseFloat(s.carga) || 0,
        repeticoes: parseInt(s.repeticoes) || 0,
      })),
    }));

    saveUserData("gymtracker_cargas", user.uid, [
      ...registrosSalvos,
      ...novosRegistros,
    ]);

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

  const exerciciosAgrupadosModal = exerciciosFiltradosModal.reduce(
    (acc, exercicio) => {
      const grupo = exercicio.grupoMuscular;
      if (!acc[grupo]) acc[grupo] = [];
      acc[grupo].push(exercicio);
      return acc;
    },
    {}
  );

  return (
    <PageWrapper>
      {/* Componente do cronômetro de descanso integrado diretamente */}
      <CronometroDescanso
        estaVisivel={cronometroVisivel}
        setEstaVisivel={setCronometroVisivel}
        onFechar={() => setCronometroVisivel(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        // Adicionado padding-bottom para compensar a navbar (ajuste o valor conforme necessário)
        className="p-1 max-w-screen-md mx-auto space-y-6 pb-24" // Ex: pb-24 (96px)
      >
        <motion.div 
          className="flex justify-between items-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center m-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 15,
                delay: 0.3
              }}
            >
              <BarChart3 size={24} className="text-blue-500 mr-2" />
            </motion.div>
            <motion.h1 
              className="text-xl font-bold text-white"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Registrar Carga
            </motion.h1>
          </div>
          
          <AnimatePresence>
            {(tituloTreino.trim() !== "" || exerciciosSelecionados.length > 0) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={limparRegistroAtual}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 m-4 py-1.5 rounded-lg flex items-center text-sm hover:shadow-lg transition-all duration-300"
                title="Limpar treino atual"
              >
                <XCircle size={16} className="mr-1" /> Limpar Atual
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Input de Título e Botão Adicionar Exercício (Inicial) */}
        <motion.div 
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden mb-4 m-4 shadow-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)" }}
        >
          <motion.input
            type="text"
            placeholder="Título do treino (ex: Treino A - Peito e Tríceps)"
            value={tituloTreino}
            onChange={(e) => setTituloTreino(e.target.value)}
            className="w-full p-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
            whileFocus={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />

          {/* Botão Adicionar Exercício - Visível apenas se NÃO houver exercícios */}
          {exerciciosSelecionados.length === 0 && (
            <div className="flex flex-col sm:flex-row">
              <motion.button
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 flex items-center justify-center transition-all duration-300"
                onClick={() => setModalAberto(true)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
                >
                  <Dumbbell size={20} className="mr-2" />
                </motion.div>
                Adicionar Exercício
              </motion.button>

              {!cronometroVisivel && (
                <motion.button
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white p-4 flex items-center justify-center transition-all duration-300 sm:border-l border-indigo-600"
                  onClick={() => setCronometroVisivel(true)}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock size={20} className="mr-2" />
                  </motion.div>
                  Mostrar Cronômetro
                </motion.button>
              )}
            </div>
          )}
        </motion.div>

        {/* Mensagem de Nenhum Exercício */}
        <AnimatePresence>
          {exerciciosSelecionados.length === 0 && (
            <motion.div 
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 flex flex-col items-center justify-center text-center m-4 shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <motion.div 
                className="bg-gradient-to-br from-slate-700 to-slate-800 p-5 rounded-full mb-4 shadow-inner"
                initial={{ y: 10 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <Dumbbell size={36} className="text-blue-400" />
              </motion.div>
              <motion.p 
                className="text-gray-200 text-lg mb-2 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Nenhum exercício adicionado ainda.
              </motion.p>
              <motion.p 
                className="text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Clique em "Adicionar Exercício" para começar seu treino.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de Exercícios Selecionados */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <AnimatePresence>
            {exerciciosSelecionados.map((ex, exIndex) => (
              <motion.div
                // Adiciona a ref ao último elemento da lista
                ref={exIndex === exerciciosSelecionados.length - 1 ? ultimoExercicioRef : null}
                key={ex.id}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl mb-4 overflow-hidden m-4 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ originY: 0 }}
              >
                {/* Cabeçalho do Exercício */}
                <motion.div 
                  className="flex justify-between items-center p-4 border-b border-slate-700/50"
                  whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <motion.p 
                      className="font-bold text-white text-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {ex.nome}
                    </motion.p>
                    <motion.p 
                      className="text-xs text-blue-400 uppercase tracking-wider"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {ex.grupoMuscular}
                    </motion.p>
                  </div>
                  <motion.button
                    onClick={() => handleRemoverExercicio(exIndex)}
                    className="bg-slate-900/70 text-red-400 hover:text-red-300 p-2 rounded-full transition-all duration-300"
                    title="Remover exercício"
                    whileHover={{ scale: 1.2, rotate: 15, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                    whileTap={{ scale: 0.9, rotate: -15 }}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </motion.div>

                {/* Séries do Exercício */}
                <div className="p-4 space-y-3">
                  <AnimatePresence>
                    {ex.series.map((serie, serieIndex) => (
                      <motion.div
                        key={serieIndex} // Usar index como chave aqui é aceitável se a ordem não muda drasticamente
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30, delay: serieIndex * 0.05 }}
                        className="grid grid-cols-12 gap-2 items-center mb-3"
                      >
                        <motion.span 
                          className="col-span-1 text-sm font-medium text-blue-400 text-center bg-slate-800/50 rounded-full h-6 w-6 flex items-center justify-center mx-auto"
                          whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                        >
                          {serieIndex + 1}
                        </motion.span>
                        <motion.div 
                          className="col-span-5"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <input
                            type="number"
                            placeholder="Carga (kg)"
                            className="w-full bg-slate-700 text-white border-none rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
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
                        </motion.div>
                        <motion.div 
                          className="col-span-5"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <input
                            type="number"
                            placeholder="Reps"
                            className="w-full bg-slate-700 text-white border-none rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
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
                        </motion.div>
                        <div className="col-span-1 flex justify-center">
                          {ex.series.length > 1 && (
                            <motion.button
                              onClick={() => handleRemoverSerie(exIndex, serieIndex)}
                              className="bg-slate-900/70 text-red-400 hover:text-red-300 p-1.5 rounded-full transition-all duration-300"
                              title="Remover esta série"
                              whileHover={{ scale: 1.2, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X size={14} />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Botão Adicionar Série */}
                <motion.button
                  onClick={() => handleAdicionarSerie(exIndex)}
                  className="w-full bg-gradient-to-r from-blue-900/30 to-blue-800/30 hover:from-blue-800/40 hover:to-blue-700/40 text-blue-300 py-3 flex items-center justify-center transition-all duration-300"
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 0, 180, 180, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <Plus size={16} className="mr-1" />
                  </motion.div>
                  Adicionar Série
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Botões Adicionar Exercício (quando já existem exercícios) e Salvar Treino */}
        <AnimatePresence>
          {exerciciosSelecionados.length > 0 && (
            <motion.div 
              className="m-4 space-y-4" // Adicionado space-y-4 para espaçar os botões
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
            >
              {/* Botão Adicionar Exercício - Visível APENAS se JÁ houver exercícios */}
              <motion.button
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md"
                onClick={() => setModalAberto(true)}
                whileHover={{ y: -2, boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ y: 0 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
                >
                  <Dumbbell size={20} className="mr-2" />
                </motion.div>
                Adicionar Mais Exercícios
              </motion.button>

              {/* Botão Salvar Treino */}
              <motion.button
                onClick={handleSalvar}
                className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-xl flex items-center justify-center transition-all duration-300 w-full shadow-lg ${
                  animateButton ? "animate-pulse" : ""
                }`}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(34, 197, 94, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                animate={animateButton ? 
                  { scale: [1, 1.05, 1] } : 
                  { scale: 1 }
                }
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 15, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
                >
                  <Save size={20} className="mr-2" />
                </motion.div>
                Salvar Treino
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Seleção de Exercício */}
        <AnimatePresence>
          {modalAberto && (
            <motion.div 
              // Adicionado padding-bottom para compensar a navbar (ajuste conforme necessário)
              className="fixed inset-0 flex flex-col z-50 bg-black/70 backdrop-blur-sm p-4 pb-24" // Ex: pb-24
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setModalAberto(false)} // Fechar ao clicar fora
            >
              <motion.div
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden w-full max-w-2xl mx-auto my-auto flex flex-col shadow-2xl"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()} // Evitar fechar ao clicar dentro
              >
                {/* Cabeçalho do modal */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center">
                    <motion.div
                      initial={{ rotate: -30, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <Dumbbell size={22} className="text-white mr-2" />
                    </motion.div>
                    <motion.h2 
                      className="text-xl font-bold text-white"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Escolha um Exercício
                    </motion.h2>
                  </div>
                  <motion.button
                    onClick={() => setModalAberto(false)}
                    className="bg-black/20 hover:bg-black/40 text-white p-2 rounded-lg transition-all duration-300"
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={18} />
                  </motion.button>
                </div>

                {/* Área de filtro */}
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                  <div className="flex items-center mb-2">
                    <Filter size={16} className="text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-gray-300">
                      Filtrar por grupo muscular:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gruposDisponiveis.map((grupo) => (
                      <motion.button
                        key={grupo}
                        onClick={() => setGrupoSelecionadoModal(grupo)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                          grupoSelecionadoModal === grupo
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                            : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {grupo}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Lista de exercícios - Ajustada altura máxima e padding */}
                <div className="flex-1 overflow-y-auto p-2 max-h-[calc(100vh-20rem)]"> {/* Ajuste dinâmico da altura máxima, considere cabeçalho, filtro e padding */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {Object.entries(exerciciosAgrupadosModal).map(
                      ([grupo, exerciciosDoGrupo], groupIndex) => (
                        <motion.div 
                          key={grupo}
                          variants={itemVariants}
                          className="mb-4"
                          custom={groupIndex}
                        >
                          <motion.div 
                            className="flex items-center mb-2 px-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * groupIndex }}
                          >
                            <ChevronRight size={16} className="text-blue-400 mr-1" />
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                              {grupo}
                            </h3>
                          </motion.div>
                          <div className="space-y-1">
                            {exerciciosDoGrupo.map((exercicio, exIndex) => (
                              <motion.button
                                key={exercicio.nome}
                                onClick={() => handleAdicionarExercicio(exercicio)}
                                className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-between transition-all duration-300"
                                variants={itemVariants}
                                custom={exIndex}
                                whileHover={{ 
                                  x: 5, 
                                  backgroundColor: "rgba(59, 130, 246, 0.2)",
                                  transition: { duration: 0.2 }
                                }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <span>{exercicio.nome}</span>
                                <motion.div
                                  whileHover={{ scale: 1.2, x: -5 }}
                                  className="text-blue-400"
                                >
                                  <CircleArrowRight size={16} />
                                </motion.div>
                              </motion.button>
                            ))}
                          </div>
                        </motion.div>
                      )
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PageWrapper>
  );
};

export default RegistrarCarga;

