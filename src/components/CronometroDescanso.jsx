import { useState, useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Timer,
  Pause,
  Play,
  RotateCcw,
  ChevronDown,
  PlusCircle,
  MinusCircle,
  Move,
  AlertCircle,
  Bell // Ícone para solicitar permissão
} from "lucide-react";

// --- Variantes de Animação (sem alterações) ---
const containerVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (tempoAcabou) => ({
    opacity: 1, 
    scale: 1,
    boxShadow: tempoAcabou 
      ? ["0 10px 25px rgba(0,0,0,0.2)", "0 15px 35px rgba(239, 68, 68, 0.4)", "0 10px 25px rgba(0,0,0,0.2)"] 
      : "0 10px 25px rgba(0,0,0,0.2)",
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30,
      delayChildren: 0.2,
      staggerChildren: 0.1,
      boxShadow: {
        duration: 0.8, 
        repeat: tempoAcabou ? Infinity : 0, 
        repeatType: "reverse" 
      }
    }
  }),
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { 
      duration: 0.3,
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 }
  },
  exit: { 
    y: -10, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const minimizedVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 500, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 }
  },
  drag: {
    scale: 1.05,
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
    transition: { duration: 0.2 }
  }
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" }
  }
};

const iconVariants = {
  hover: { rotate: 15, scale: 1.1 },
  tap: { rotate: 0, scale: 1 },
  pulse: { 
    rotate: [0, 15, -15, 15, 0],
    transition: { duration: 1.5, repeat: Infinity, repeatDelay: 3 }
  },
  spin: {
    rotate: 360,
    transition: { duration: 2, repeat: Infinity, ease: "linear" }
  }
};
// --- Fim das Variantes de Animação ---

const CronometroDescanso = ({ onFechar, estaVisivel, setEstaVisivel }) => {
  const [tempoRestante, setTempoRestante] = useState(60); 
  const [tempoTotal, setTempoTotal] = useState(60);
  const [estaRodando, setEstaRodando] = useState(false);
  const [estaExpandido, setEstaExpandido] = useState(true);
  const [posicao, setPosicao] = useState({ x: 16, y: 16 }); 
  const [arrastando, setArrastando] = useState(false);
  const [mostrarConfete, setMostrarConfete] = useState(false); 
  const [tempoAcabou, setTempoAcabou] = useState(false); 
  const [portalNode, setPortalNode] = useState(null);
  const [permissaoNotificacao, setPermissaoNotificacao] = useState("default"); // Estado para permissão
  
  const refTemporizador = useRef(null);
  const refAudio = useRef(null);
  const refCronometro = useRef(null); 
  const refResetAutomatico = useRef(null);
  const refMinimizacaoAutomatica = useRef(false); 

  // Criar o nó do portal ao montar
  useEffect(() => {
    let node = document.getElementById("cronometro-portal-container");
    if (!node) {
        node = document.createElement("div");
        node.id = "cronometro-portal-container";
        document.body.appendChild(node);
    }
    setPortalNode(node);
  }, []);

  // Inicializar o áudio
  useEffect(() => {
    refAudio.current = new Audio(
      "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
    );
    return () => {
      if (refAudio.current) {
        refAudio.current.pause();
        refAudio.current = null;
      }
    };
  }, []);

  // Verificar permissão de notificação ao montar
  useEffect(() => {
    if ("Notification" in window) {
      setPermissaoNotificacao(Notification.permission);
    }
  }, []);

  // Função para solicitar permissão de notificação
  const solicitarPermissaoNotificacao = () => {
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações.");
      return;
    }
    if (permissaoNotificacao === "granted") {
        // Já tem permissão, talvez informar o usuário?
        console.log("Permissão de notificação já concedida.");
        return;
    }
    if (permissaoNotificacao !== "denied") {
      Notification.requestPermission().then((permission) => {
        setPermissaoNotificacao(permission);
        if (permission === "granted") {
          console.log("Permissão de notificação concedida!");
          // Opcional: Mostrar uma notificação de teste
          // new Notification("Notificações Ativadas!", { body: "Você será notificado quando o descanso acabar." });
        } else {
          console.log("Permissão de notificação negada.");
        }
      });
    }
  };

  // Função para enviar notificação
  const enviarNotificacao = () => {
    if (permissaoNotificacao === "granted") {
      try {
        // Tentar criar a notificação
        const notification = new Notification("Tempo de Descanso Finalizado!", {
          body: "Seu descanso acabou. Hora de voltar ao treino!",
          icon: "/icons/icon-192x192.png", // Opcional: adicione um ícone
          vibrate: [200, 100, 200], // Opcional: padrão de vibração
          tag: "cronometro-descanso" // Evita notificações duplicadas se o timer acabar várias vezes rapidamente
        });
        
        // Fechar a notificação após alguns segundos (opcional)
        setTimeout(notification.close.bind(notification), 7000);

      } catch (error) {
        console.error("Erro ao enviar notificação:", error);
        // Pode acontecer se o Service Worker não estiver ativo ou outras restrições
      }
    } else {
        console.log("Tentativa de notificação, mas permissão não concedida.");
    }
  };

  // Efeito para gerenciar o temporizador (ADICIONADO envio de notificação)
  useEffect(() => {
    if (estaRodando) {
      refTemporizador.current = setInterval(() => {
        setTempoRestante((anterior) => {
          if (anterior <= 1) {
            clearInterval(refTemporizador.current);
            setEstaRodando(false);
            setTempoAcabou(true);
            setMostrarConfete(true);
            
            // Tocar som
            if (refAudio.current) {
              refAudio.current.play().catch((e) => console.error("Erro ao tocar áudio:", e));
            }
            
            // Tentar enviar notificação
            enviarNotificacao();

            // Reset automático
            refResetAutomatico.current = setTimeout(() => {
              setTempoRestante(tempoTotal);
              setTempoAcabou(false);
              setMostrarConfete(false);
            }, 5000);
            return 0;
          }
          return anterior - 1;
        });
      }, 1000);

      // Minimizar automaticamente ao iniciar
      if (estaExpandido && !refMinimizacaoAutomatica.current) {
        setEstaExpandido(false);
        refMinimizacaoAutomatica.current = true;
        setTimeout(() => {
          refMinimizacaoAutomatica.current = false;
        }, 500);
      }
    } else if (refTemporizador.current) {
      clearInterval(refTemporizador.current);
    }

    return () => {
      if (refTemporizador.current) clearInterval(refTemporizador.current);
      if (refResetAutomatico.current) clearTimeout(refResetAutomatico.current);
    };
  }, [estaRodando, tempoTotal, estaExpandido, permissaoNotificacao]); // Adicionado permissaoNotificacao como dependência

  // Efeito para adicionar evento de clique global para minimizar
  useEffect(() => {
    const handleClickFora = (e) => {
      if (!estaExpandido || arrastando) return;
      if (refCronometro.current && !refCronometro.current.contains(e.target)) {
         setTimeout(() => {
            if (estaExpandido && !arrastando) {
                 setEstaExpandido(false);
            }
         }, 50); 
      }
    };

    document.addEventListener("mousedown", handleClickFora);
    document.addEventListener("touchstart", handleClickFora, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickFora);
      document.removeEventListener("touchstart", handleClickFora);
    };
  }, [estaExpandido, arrastando]); 

  // Formatar o tempo
  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, "0")}:${segundosRestantes.toString().padStart(2, "0")}`;
  };

  // --- Manipuladores de Eventos ---
  const handleIniciarPausar = (e) => {
    e.stopPropagation();
    // Solicitar permissão ao iniciar pela primeira vez, se necessário
    if (!estaRodando && permissaoNotificacao === "default") {
        solicitarPermissaoNotificacao();
    }
    if (tempoRestante === 0) {
      setTempoRestante(tempoTotal);
      setTempoAcabou(false);
      setMostrarConfete(false);
    }
    setEstaRodando(!estaRodando);
  };

  const handleReiniciar = (e) => {
    e.stopPropagation();
    setEstaRodando(false);
    setTempoRestante(tempoTotal);
    setTempoAcabou(false);
    setMostrarConfete(false);
    if (refResetAutomatico.current) clearTimeout(refResetAutomatico.current);
  };

  const handleAumentarTempo = (e) => {
    e.stopPropagation();
    const novoTempo = tempoTotal + 30;
    setTempoTotal(novoTempo);
    if (!estaRodando) setTempoRestante(novoTempo);
  };

  const handleDiminuirTempo = (e) => {
    e.stopPropagation();
    if (tempoTotal > 30) {
      const novoTempo = tempoTotal - 30;
      setTempoTotal(novoTempo);
      if (!estaRodando) setTempoRestante(novoTempo);
    }
  };

  const handleFechar = (e) => {
    e.stopPropagation();
    setEstaVisivel(false);
    if (onFechar) onFechar();
  };
  // --- Fim dos Manipuladores de Eventos ---

  // Função para MINIMIZAR
  const minimizarCronometro = (e) => {
    if (e) e.stopPropagation();
    setEstaExpandido(false);
  };

  // Função para EXPANDIR
  const expandirCronometro = (e) => {
    if (e) {
        e.stopPropagation(); 
    }
    setEstaExpandido(true);
  };

  // --- Funções de Arrastar ---
  const iniciarArrasto = (e, info) => {
    if (estaExpandido) return;
    setArrastando(true);
  };

  const pararArrasto = (e, info) => {
    setArrastando(false);
  };
  
  const handleTapMinimizado = (e, info) => {
      expandirCronometro(e);
  }
  // --- Fim das Funções de Arrastar ---

  // Calcular cor de fundo
  const obterCorFundo = () => {
    const porcentagem = (tempoRestante / tempoTotal) * 100;
    if (porcentagem <= 20) return "from-red-500 to-red-600";
    if (porcentagem <= 50) return "from-yellow-500 to-yellow-600";
    return "from-green-500 to-green-600";
  };

  // Calcular progresso
  const calcularProgresso = () => (tempoTotal > 0 ? (tempoRestante / tempoTotal) * 100 : 0);

  // Componente de Confete
  const Confete = () => {
    return (
      <div className="confetti-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 60 }}>
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="confetti"
            initial={{ 
              position: 'absolute',
              top: "-10%", 
              left: `${Math.random() * 100}%`,
              backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              borderRadius: Math.random() > 0.5 ? "50%" : "0"
            }}
            animate={{
              top: "110%", 
              rotate: Math.random() * 720 - 360, 
              x: Math.random() * 200 - 100 
            }}
            transition={{
              duration: Math.random() * 3 + 3, 
              ease: "linear" 
            }}
          />
        ))}
      </div>
    );
  };

  if (!estaVisivel || !portalNode) return null;

  // Estilo para posicionamento
  const estiloPosicao = estaExpandido
    ? { position: "fixed", top: "8rem", right: "1rem", zIndex: 1050 } 
    : { 
        position: "fixed", 
        top: `${posicao.y}px`, 
        left: `${posicao.x}px`, 
        zIndex: 1050, 
        cursor: arrastando ? "grabbing" : "grab",
      }; 

  // Conteúdo do Cronômetro (JSX)
  const cronometroContent = (
    <AnimatePresence mode="wait"> 
      {estaVisivel && (
        <motion.div
          key={estaExpandido ? "expanded-outer" : "minimized-outer"} 
          ref={refCronometro} 
          style={estiloPosicao} 
          initial="hidden"
          animate="visible"
          exit="exit"
          layout 
        >
          {estaExpandido ? (
            <motion.div
              key="expanded-inner" 
              variants={containerVariants}
              initial="hidden" 
              animate="visible" 
              exit="exit" 
              custom={tempoAcabou} 
              className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl overflow-hidden w-72 backdrop-blur-sm"
            >
              {mostrarConfete && <Confete />} 
              {/* Cabeçalho */}
              <motion.div 
                className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-700 to-slate-800 border-b border-slate-700/30"
              >
                <div className="flex items-center">
                  <motion.div variants={iconVariants} whileHover="hover" whileTap="tap" animate={estaRodando ? "spin" : "pulse"}>
                    <Timer size={20} className="text-blue-400 mr-2" />
                  </motion.div>
                  <motion.h3 className="text-white font-medium text-sm" initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    Cronômetro de Descanso
                  </motion.h3>
                </div>
                <div className="flex items-center">
                  {/* Botão para solicitar permissão de notificação (se necessário) */}
                  {permissaoNotificacao === "default" && (
                    <motion.button
                      onClick={solicitarPermissaoNotificacao}
                      className="text-yellow-400 hover:text-yellow-300 p-1.5 rounded-full transition-colors hover:bg-slate-700/50 mr-1"
                      title="Ativar notificações"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Bell size={16} />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={minimizarCronometro} 
                    className="text-gray-400 hover:text-white p-1.5 rounded-full transition-colors hover:bg-slate-700/50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronDown size={16} />
                  </motion.button>
                  <motion.button
                    onClick={handleFechar}
                    className="text-gray-400 hover:text-white p-1.5 rounded-full transition-colors hover:bg-slate-700/50 ml-1"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9, rotate: 0 }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              </motion.div>

              {/* Display do tempo */}
              <motion.div
                className={`relative flex justify-center items-center py-8 bg-gradient-to-r ${obterCorFundo()} transition-all duration-500`}
                animate={tempoRestante <= 10 && tempoRestante > 0 ? { scale: [1, 1.02, 1], transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" } } : {}}
              >
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={283} 
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * calcularProgresso() / 100) }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
                  />
                </svg>
                <motion.div className="relative z-10 flex flex-col items-center" animate={tempoAcabou ? { y: [0, -5, 0], transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" } } : {}}>
                  <motion.span className="text-white text-4xl font-bold" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }}>
                    {formatarTempo(tempoRestante)}
                  </motion.span>
                  {tempoAcabou && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center mt-2 bg-white/20 px-3 py-1 rounded-full">
                      <AlertCircle size={14} className="text-white mr-1" />
                      <span className="text-white text-xs font-medium">Tempo finalizado!</span>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>

              {/* Controles de ajuste de tempo */}
              <motion.div className="flex justify-center items-center gap-4 p-4 bg-gradient-to-r from-slate-700 to-slate-800">
                <motion.button onClick={handleDiminuirTempo} className="flex justify-center items-center bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 w-full text-white p-2.5 rounded-lg transition-all duration-300 shadow-md" disabled={tempoTotal <= 30} variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <motion.div variants={iconVariants} whileHover="hover" whileTap="tap"><MinusCircle size={20} /></motion.div>
                </motion.button>
                <motion.button onClick={handleAumentarTempo} className="flex justify-center items-center bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 w-full text-white p-2.5 rounded-lg transition-all duration-300 shadow-md" variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <motion.div variants={iconVariants} whileHover="hover" whileTap="tap"><PlusCircle size={20} /></motion.div>
                </motion.button>
              </motion.div>

              {/* Controles de iniciar/pausar e resetar */}
              <motion.div className="flex justify-between p-4 bg-gradient-to-br from-slate-800 to-slate-900">
                <motion.button onClick={handleIniciarPausar} className={`flex items-center justify-center rounded-lg px-4 py-2.5 text-white transition-all duration-300 shadow-lg ${estaRodando ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700" : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"}`} variants={buttonVariants} whileHover="hover" whileTap="tap" animate={tempoAcabou && !estaRodando ? "pulse" : ""}>
                  <motion.div className="mr-2" variants={iconVariants} whileHover="hover" whileTap="tap" animate={tempoAcabou && !estaRodando ? "pulse" : ""}>
                    {estaRodando ? <Pause size={18} /> : <Play size={18} />}
                  </motion.div>
                  {estaRodando ? "Pausar" : "Iniciar"}
                </motion.button>
                <motion.button onClick={handleReiniciar} className="flex items-center justify-center bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-lg px-4 py-2.5 text-white transition-all duration-300 shadow-lg" variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <motion.div className="mr-2" variants={iconVariants} whileHover="hover" whileTap="tap" >
                    <RotateCcw size={18} />
                  </motion.div>
                  Resetar
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            // Versão minimizada
            <motion.div
              key="minimized-inner" 
              variants={minimizedVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileDrag="drag"
              drag 
              dragConstraints={{ left: 0, right: (typeof window !== 'undefined' ? window.innerWidth : 1000) - 70, top: 0, bottom: (typeof window !== 'undefined' ? window.innerHeight : 800) - 70 }} 
              dragMomentum={false} 
              onDragStart={iniciarArrasto} 
              onDragEnd={pararArrasto}
              onTap={handleTapMinimizado} 
              className="flex flex-col bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden shadow-lg cursor-grab"
              style={{ width: "70px" }} 
            >
              {/* Barra superior com ícones */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-gradient-to-r from-slate-700 to-slate-800 border-b border-slate-700/30 pointer-events-none"> 
                <motion.div>
                  <Move size={16} className="text-gray-400" /> 
                </motion.div>
                <motion.div
                  animate={estaRodando ? { rotate: 360 } : { rotate: [0, 15, -15, 15, 0] }}
                  transition={estaRodando ? { duration: 3, repeat: Infinity, ease: "linear" } : { duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Timer size={20} className="text-blue-400" /> 
                </motion.div>
              </div>
              
              {/* Área do tempo */}
              <motion.div
                className={`w-full flex justify-center items-center p-3.5 bg-gradient-to-r ${obterCorFundo()} transition-all duration-500 focus:outline-none pointer-events-none`} 
                animate={tempoRestante <= 10 && tempoRestante > 0 ? { scale: [1, 1.05, 1], transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" } } : {}}
              >
                <motion.span 
                  className="text-white text-base font-bold"
                  animate={tempoAcabou ? { scale: [1, 1.1, 1], transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" } } : {}}
                >
                  {formatarTempo(tempoRestante)}
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Renderizar o conteúdo no portal
  return ReactDOM.createPortal(cronometroContent, portalNode);
};

// Estilos CSS (sem alterações)
const style = document.createElement('style');
style.textContent = `
  .confetti-container {
    /* Estilos movidos para inline no componente Confete */
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .timer-pulse {
    animation: pulse 0.5s infinite alternate;
  }
`;
if (!document.getElementById('cronometro-descanso-styles')) {
    style.id = 'cronometro-descanso-styles';
    document.head.appendChild(style);
}

export default CronometroDescanso;
