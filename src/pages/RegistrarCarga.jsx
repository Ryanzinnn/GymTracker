import { useState, useEffect, useRef } from "react";
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
  Circle,
  CircleArrowRight,
  CircleArrowDown,
  Timer,
  Pause,
  Play,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  PlusCircle,
  MinusCircle,
  Clock,
  Move,
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";

const CHAVE_REGISTRO_EM_ANDAMENTO = "gymtracker_registro_em_andamento";

// Componente do Cronômetro de Descanso
const CronometroDescanso = ({ onFechar, estaVisivel, setEstaVisivel }) => {
  const [tempoRestante, setTempoRestante] = useState(60); // Padrão: 1 minuto (60 segundos)
  const [tempoTotal, setTempoTotal] = useState(60);
  const [estaRodando, setEstaRodando] = useState(false);
  const [estaExpandido, setEstaExpandido] = useState(true);
  const [posicao, setPosicao] = useState({ x: 16, y: 16 }); // Posição inicial no canto superior direito
  const [arrastando, setArrastando] = useState(false);
  const [offsetArrasto, setOffsetArrasto] = useState({ x: 0, y: 0 });
  const refTemporizador = useRef(null);
  const refAudio = useRef(null);
  const refCronometro = useRef(null);
  const refResetAutomatico = useRef(null);

  // Inicializar o áudio
  useEffect(() => {
    refAudio.current = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3");
    return () => {
      if (refAudio.current) {
        refAudio.current.pause();
        refAudio.current = null;
      }
    };
  }, []);

  // Efeito para gerenciar o temporizador
  useEffect(() => {
    if (estaRodando) {
      refTemporizador.current = setInterval(() => {
        setTempoRestante((anterior) => {
          if (anterior <= 1) {
            // Quando o temporizador chegar a zero
            clearInterval(refTemporizador.current);
            setEstaRodando(false);
            // Tocar som de alerta
            if (refAudio.current) {
              refAudio.current.play().catch(e => console.error("Erro ao tocar áudio:", e));
            }
            
            // Configurar reset automático após 5 segundos
            refResetAutomatico.current = setTimeout(() => {
              setTempoRestante(tempoTotal);
            }, 5000);
            
            return 0;
          }
          return anterior - 1;
        });
      }, 1000);
      
      // Minimizar automaticamente ao iniciar
      if (estaExpandido) {
        setEstaExpandido(false);
      }
    } else if (refTemporizador.current) {
      clearInterval(refTemporizador.current);
    }

    return () => {
      if (refTemporizador.current) {
        clearInterval(refTemporizador.current);
      }
      if (refResetAutomatico.current) {
        clearTimeout(refResetAutomatico.current);
      }
    };
  }, [estaRodando, tempoTotal, estaExpandido]);

  // Efeito para adicionar evento de clique global para minimizar
  useEffect(() => {
    const handleClickFora = (e) => {
      if (refCronometro.current && 
          !refCronometro.current.contains(e.target) && 
          estaExpandido) {
        setEstaExpandido(false);
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [estaExpandido]);

  // Formatar o tempo para exibição (MM:SS)
  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, "0")}:${segundosRestantes.toString().padStart(2, "0")}`;
  };

  // Manipuladores de eventos
  const handleIniciarPausar = (e) => {
    e.stopPropagation(); // Impedir propagação para não interferir com outros eventos
    
    if (tempoRestante === 0) {
      // Se o temporizador estiver em zero, reinicie com o tempo configurado
      setTempoRestante(tempoTotal);
    }
    setEstaRodando(!estaRodando);
  };

  const handleReiniciar = (e) => {
    e.stopPropagation(); // Impedir propagação para não interferir com outros eventos
    
    setEstaRodando(false);
    setTempoRestante(tempoTotal);
    if (refResetAutomatico.current) {
      clearTimeout(refResetAutomatico.current);
    }
  };

  const handleAumentarTempo = (e) => {
    e.stopPropagation(); // Impedir propagação para não interferir com outros eventos
    
    const novoTempo = tempoTotal + 30;
    setTempoTotal(novoTempo);
    if (!estaRodando) {
      setTempoRestante(novoTempo);
    }
  };

  const handleDiminuirTempo = (e) => {
    e.stopPropagation(); // Impedir propagação para não interferir com outros eventos
    
    if (tempoTotal > 30) {
      const novoTempo = tempoTotal - 30;
      setTempoTotal(novoTempo);
      if (!estaRodando) {
        setTempoRestante(novoTempo);
      }
    }
  };

  const handleFechar = (e) => {
    e.stopPropagation(); // Impedir propagação para não interferir com outros eventos
    
    setEstaVisivel(false);
    if (onFechar) onFechar();
  };

  const handleToggleExpandir = (e) => {
    e.stopPropagation(); // Impedir propagação para não interferir com outros eventos
    setEstaExpandido(!estaExpandido);
  };

  // Funções para arrastar o cronômetro
  const iniciarArrasto = (e) => {
    e.stopPropagation(); // Impedir propagação para não interferir com outros eventos
    
    if (!estaExpandido) {
      setArrastando(true);
      
      // Calcular o offset do mouse em relação ao elemento
      const rect = e.currentTarget.getBoundingClientRect();
      setOffsetArrasto({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      
      // Prevenir comportamento padrão para evitar problemas em dispositivos touch
      e.preventDefault();
    }
  };

  const moverArrasto = (e) => {
    if (arrastando && !estaExpandido) {
      // Obter posição do mouse ou toque
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      if (clientX && clientY) {
        const novoX = clientX - offsetArrasto.x;
        const novoY = clientY - offsetArrasto.y;
        
        // Limitar dentro da janela
        const maxX = window.innerWidth - 64; // largura aproximada do cronômetro minimizado
        const maxY = window.innerHeight - 64; // altura aproximada do cronômetro minimizado
        
        setPosicao({
          x: Math.max(0, Math.min(novoX, maxX)),
          y: Math.max(0, Math.min(novoY, maxY))
        });
      }
      
      // Prevenir comportamento padrão para evitar problemas em dispositivos touch
      e.preventDefault();
    }
  };

  const pararArrasto = (e) => {
    if (arrastando) {
      setArrastando(false);
      
      // Se o movimento foi mínimo, considerar como um clique e expandir
      const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
      
      if (clientX && clientY) {
        const deltaX = Math.abs(clientX - (posicao.x + offsetArrasto.x));
        const deltaY = Math.abs(clientY - (posicao.y + offsetArrasto.y));
        
        // Se o movimento foi menor que 5px, considerar como um clique
        if (deltaX < 5 && deltaY < 5) {
          setEstaExpandido(true);
        }
      }
      
      // Prevenir comportamento padrão para evitar problemas em dispositivos touch
      e.preventDefault();
    }
  };

  // Adicionar eventos de arrasto ao documento
  useEffect(() => {
    const handleMouseMove = (e) => moverArrasto(e);
    const handleMouseUp = (e) => pararArrasto(e);
    const handleTouchMove = (e) => moverArrasto(e);
    const handleTouchEnd = (e) => pararArrasto(e);
    
    if (arrastando) {
      // Mouse events
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Touch events
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchcancel', handleTouchEnd);
    }
    
    return () => {
      // Mouse events
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Touch events
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [arrastando, posicao, offsetArrasto]);

  // Calcular a cor de fundo com base no tempo restante (vermelho quando próximo de zero)
  const obterCorFundo = () => {
    const porcentagem = (tempoRestante / tempoTotal) * 100;
    
    if (porcentagem <= 20) return "bg-red-500";
    if (porcentagem <= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!estaVisivel) return null;

  // Estilo para posicionamento quando arrastável
  const estiloArrasto = !estaExpandido ? {
    position: 'fixed',
    top: `${posicao.y}px`,
    left: `${posicao.x}px`,
    zIndex: 50,
    cursor: arrastando ? 'grabbing' : 'grab',
    touchAction: 'none' // Importante para dispositivos touch
  } : {};

  return (
    <div 
      ref={refCronometro}
      className={estaExpandido ? "fixed top-4 right-4 z-50 flex flex-col items-end" : ""}
      style={estiloArrasto}
      onMouseDown={!estaExpandido ? iniciarArrasto : undefined}
      onTouchStart={!estaExpandido ? iniciarArrasto : undefined}
    >
      <div className={`bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
        estaExpandido ? "w-64" : "w-16"
      }`}>
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-3 bg-slate-700">
          <div className="flex items-center">
            {!estaExpandido && <Move size={16} className="text-gray-400 mr-1" />}
            <Timer size={18} className="text-blue-400 mr-2" />
            {estaExpandido && (
              <h3 className="text-white font-medium text-sm">Cronômetro de Descanso</h3>
            )}
          </div>
          <div className="flex items-center">
            <button
              onClick={handleToggleExpandir}
              className="text-gray-400 hover:text-white p-1 rounded-full transition-colors"
            >
              {estaExpandido ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            {estaExpandido && (
              <button
                onClick={handleFechar}
                className="text-gray-400 hover:text-white p-1 rounded-full transition-colors ml-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Corpo do temporizador */}
        {estaExpandido ? (
          <>
            {/* Display do tempo */}
            <div className={`flex justify-center items-center py-6 ${obterCorFundo()} transition-colors ${tempoRestante <= 10 ? 'timer-pulse' : ''}`}>
              <span className="text-white text-3xl font-bold">
                {formatarTempo(tempoRestante)}
              </span>
            </div>

            {/* Controles de ajuste de tempo */}
            <div className="flex justify-between items-center p-3 bg-slate-700">
              <button
                onClick={handleDiminuirTempo}
                className="bg-slate-600 hover:bg-slate-500 text-white p-2 rounded-lg transition-colors"
                disabled={tempoTotal <= 30}
              >
                <MinusCircle size={20} />
              </button>
              
              <div className="text-center">
                <span className="text-white text-sm font-medium">Ajustar Tempo</span>
                <div className="text-gray-300 text-xs mt-1">
                  {formatarTempo(tempoTotal)} (±30s)
                </div>
              </div>
              
              <button
                onClick={handleAumentarTempo}
                className="bg-slate-600 hover:bg-slate-500 text-white p-2 rounded-lg transition-colors"
              >
                <PlusCircle size={20} />
              </button>
            </div>

            {/* Controles de iniciar/pausar e resetar */}
            <div className="flex justify-between p-3 bg-slate-800">
              <button
                onClick={handleIniciarPausar}
                className={`flex items-center justify-center rounded-lg px-4 py-2 text-white transition-colors ${
                  estaRodando ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {estaRodando ? <Pause size={16} className="mr-1" /> : <Play size={16} className="mr-1" />}
                {estaRodando ? "Pausar" : "Iniciar"}
              </button>
              <button
                onClick={handleReiniciar}
                className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 text-white transition-colors"
              >
                <RotateCcw size={16} className="mr-1" />
                Resetar
              </button>
            </div>
          </>
        ) : (
          // Versão minimizada
          <div 
            className={`flex justify-center items-center p-3 ${obterCorFundo()} transition-colors ${tempoRestante <= 10 ? 'timer-pulse' : ''}`}
            onClick={handleToggleExpandir}
          >
            <span className="text-white text-sm font-bold">
              {formatarTempo(tempoRestante)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const RegistrarCarga = () => {
  const { user } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);
  const [exercicios, setExercicios] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [cronometroVisivel, setCronometroVisivel] = useState(true);

  // Estados que serão persistidos
  const [tituloTreino, setTituloTreino] = useState("");
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);

  const [grupoSelecionadoModal, setGrupoSelecionadoModal] = useState("Todos"); // Estado para o filtro do modal

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
      
      <div
        className={`pb-32 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="flex justify-between items-center mb-4 ">
          <div className="flex items-center m-4">
            <BarChart3 size={22} className="text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-white">Registrar Carga</h1>
          </div>
          {(tituloTreino.trim() !== "" ||
            exerciciosSelecionados.length > 0) && (
            <button
              onClick={limparRegistroAtual}
              className="bg-red-500 text-white px-3 m-4 py-1.5 rounded-lg flex items-center text-sm hover:bg-red-600 transition-colors"
              title="Limpar treino atual"
            >
              <XCircle size={16} className="mr-1" /> Limpar Atual
            </button>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl overflow-hidden mb-4 m-4">
          <input
            type="text"
            placeholder="Título do treino (ex: Treino A - Peito e Tríceps)"
            value={tituloTreino}
            onChange={(e) => setTituloTreino(e.target.value)}
            className="w-full p-3.5 bg-slate-700 text-white border-none focus:outline-none"
          />

          <div className="flex flex-col sm:flex-row">
            <button
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3.5 flex items-center justify-center transition-colors"
              onClick={() => setModalAberto(true)}
            >
              <Dumbbell size={20} className="mr-2" />
              Adicionar Exercício
            </button>
            
            {!cronometroVisivel && (
              <button
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white p-3.5 flex items-center justify-center transition-colors sm:border-l border-indigo-600"
                onClick={() => setCronometroVisivel(true)}
              >
                <Clock size={20} className="mr-2" />
                Mostrar Cronômetro
              </button>
            )}
          </div>
        </div>

        {exerciciosSelecionados.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center m-4">
            <div className="bg-slate-700 p-4 rounded-full mb-3">
              <Dumbbell size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-300 text-lg mb-1">
              Nenhum exercício adicionado ainda.
            </p>
            <p className="text-gray-400 text-sm">
              Clique em "Adicionar Exercício" para começar seu treino.
            </p>
          </div>
        )}

        {exerciciosSelecionados.map((ex, exIndex) => (
          <div
            key={ex.id}
            className=" bg-slate-800 rounded-xl mb-4 overflow-hidden animate-fadeIn m-4"
            style={{ animationDelay: `${exIndex * 100}ms` }}
          >
            <div className="flex justify-between items-center p-4">
              <div>
                <p className="font-bold text-white text-lg">{ex.nome}</p>
                <p className="text-sm text-gray-400 bg-slate-700 px-2 py-0.5 rounded-full inline-block mt-1">
                  {ex.grupoMuscular}
                </p>
              </div>
              <button
                onClick={() => handleRemoverExercicio(exIndex)}
                className="bg-slate-900/50 hover:bg-red-500/20 text-red-400 hover:text-red-300 p-2 rounded-lg transition-colors"
                title="Remover Exercício"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="px-4 pb-2">
              <div className="grid grid-cols-12 gap-2 items-center text-sm font-medium text-gray-400 px-1 mb-2">
                <span className="col-span-1 text-center">Nº</span>
                <span className="col-span-5 pl-2">Carga (kg)</span>
                <span className="col-span-5 pl-2">Repetições</span>
                <span className="col-span-1"></span>
              </div>

              {ex.series.map((serie, serieIndex) => (
                <div
                  key={serieIndex}
                  className="grid grid-cols-12 gap-2 items-center mb-2 animate-fadeIn"
                  style={{ animationDelay: `${serieIndex * 50}ms` }}
                >
                  <span className="col-span-1 text-sm font-medium text-gray-400 text-center">
                    {serieIndex + 1}
                  </span>
                  <div className="col-span-5">
                    <input
                      type="number"
                      placeholder="Carga (kg)"
                      className="w-full bg-slate-700 text-white border-none rounded-md p-2.5 text-sm focus:outline-none"
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
                  </div>
                  <div className="col-span-5">
                    <input
                      type="number"
                      placeholder="Reps"
                      className="w-full bg-slate-700 text-white border-none rounded-md p-2.5 text-sm focus:outline-none"
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
                  <div className="col-span-1 flex justify-center">
                    {ex.series.length > 1 && (
                      <button
                        onClick={() => handleRemoverSerie(exIndex, serieIndex)}
                        className="bg-slate-900/50 text-red-400 hover:text-red-300 p-1 rounded-full transition-colors"
                        title="Remover esta série"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAdicionarSerie(exIndex)}
              className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 py-3 flex items-center justify-center transition-colors"
            >
              <Plus size={16} className="mr-1" /> Adicionar Série
            </button>
          </div>
        ))}

        {exerciciosSelecionados.length > 0 && (
          <div className="m-4">
            <button
              onClick={handleSalvar}
              className="bg-green-500 hover:bg-green-600 text-white p-3.5 rounded-xl flex items-center justify-center transition-colors w-full"
            >
              <Save size={18} className="mr-2" />
              Salvar Treino
            </button>
          </div>
        )}

        {modalAberto && (
          <div className="fixed m-2 inset-0 flex flex-col z-50 animate-fadeIn">
            <div
              className="bg-white rounded-xl overflow-hidden w-full mx-auto flex flex-col animate-scaleIn h-[calc(100vh-96px)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabeçalho do modal */}
              <div className="flex justify-between items-center p-4 bg-blue-500">
                <div className="flex items-center">
                  <Dumbbell size={20} className="text-white mr-2" />
                  <h2 className="text-xl font-bold text-white">
                    Escolha um Exercício
                  </h2>
                </div>
                <button
                  onClick={() => setModalAberto(false)}
                  className="bg-gray-900/50 text-white p-2 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Área de filtro */}
              <div className="p-4 bg-gray-100">
                <div className="flex items-center mb-2">
                  <Filter size={16} className="text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-700">
                    Filtrar por grupo muscular:
                  </label>
                </div>
                <select
                  value={grupoSelecionadoModal}
                  onChange={(e) => setGrupoSelecionadoModal(e.target.value)}
                  className="w-full border text-gray-800 border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:outline-none"
                >
                  {gruposDisponiveis.map((grupo) => (
                    <option key={grupo} value={grupo}>
                      {grupo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de exercícios */}
              <div className="overflow-y-auto flex-grow">
                {grupoSelecionadoModal !== "Todos" && (
                  <div className="flex items-center p-3 bg-blue-100/50">
                    <CircleArrowDown size={16} className="text-blue-500 mr-2" />
                    <span className="text-gray-800 font-medium">
                      {grupoSelecionadoModal}
                    </span>
                  </div>
                )}

                {Object.entries(exerciciosAgrupadosModal).map(
                  ([grupo, lista]) => (
                    <div key={grupo}>
                      {/* Título do grupo muscular (apenas se filtro for "Todos") */}
                      {grupoSelecionadoModal === "Todos" && (
                        <div className="p-3 flex items-center font-medium text-gray-800 bg-gray-50 sticky top-0">
                          <CircleArrowRight
                            size={16}
                            className="text-blue-500 mr-2"
                          />
                          <span className="text-gray-800 font-medium">
                            {grupo}
                          </span>
                        </div>
                      )}

                      {/* Lista de exercícios do grupo */}
                      <div>
                        {lista.map((exercicio) => (
                          <div
                            key={exercicio.id}
                            onClick={() => handleAdicionarExercicio(exercicio)}
                            className="p-3.5 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center"
                          >
                            <p className="font-medium text-gray-800">
                              {exercicio.nome}
                            </p>
                            <ChevronRight size={18} className="text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default RegistrarCarga;
