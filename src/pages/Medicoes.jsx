import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Pencil,
  Trash2,
  Ruler,
  Plus,
  Calendar,
  Activity,
  Weight,
  Percent,
  TrendingDown,
  Info,
  BarChart2,
  ChevronDown,
  ArrowRight,
  Award,
  Zap,
  Droplet,
  Target,
  Flame,
  Heart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage";
import PageWrapper from "../components/PageWrapper";
import Navegacao from "../components/Navegacao";

// Adicionar estilos CSS customizados - CORRIGIDO para Figma
const customSliderStyles = `
.navigation-wrapper-mobile {
  position: relative;
  width: 100%;
  padding: 0rem 2.5rem; /* Espaçamento vertical */
  overflow: hidden; /* Esconder overflow do slider */
  border-radius: 9999px; /* Arredondamento da barra inteira */
  background: linear-gradient(to right, #38bdf8, #3b82f6); /* Gradiente azul do Figma */
}

.keen-slider-container {
  /* Não precisa de position relative aqui, o wrapper já tem */
  /* O padding horizontal será controlado pelo wrapper ou pelos slides */
}

.keen-slider__slide {
  /* Remover transição de opacidade daqui, será controlada pelo wrapper do botão */
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 100px; /* Ajustar conforme necessário para caber 2 + preview */
  /* Remover padding interno, será no botão */
}

/* Estilos para o botão dentro do slide */
.slide-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.25rem; /* Espaçamento interno do botão */
  border-radius: 0.5rem; /* Arredondamento leve */
  transition: opacity 0.3s ease-out, transform 0.2s ease-out;
  width: 100%;
  height: 100%;
  cursor: pointer;
  background-color: transparent !important; /* Garantir fundo transparente */
}

.slide-button:hover {
  transform: scale(1.03);
}

/* Estilo da Pílula Ativa */
.pill-active {
  background-color: white;
  border-radius: 9999px;
  padding: 0.3rem; /* Espaçamento interno da pílula */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.25rem; /* Espaço entre pílula e texto */
  transition: background-color 0.3s ease-out;
}

/* Estilo do Ícone dentro da Pílula Ativa */
.icon-active {
  color: #3b82f6; /* Cor azul do Figma para ícone ativo */
  margin-left: 0.85rem; /* Espaço entre ícone e texto */
  margin-right: 0.85rem; /* Espaço entre ícone e texto */
}

/* Estilo do Ícone Inativo */
.icon-inactive {
  color: rgba(255, 255, 255, 0.8);
  padding: 0.1rem; /* Adicionar padding para alinhar com o ativo */
  margin-bottom: 0.25rem; /* Espaço entre ícone e texto */
  transition: color 0.3s ease-out;
}
.slide-button:hover .icon-inactive {
 color: white;
}

/* Estilo do Texto Ativo */
.text-active {
  color: white;
  font-weight: 600; /* Semibold */
  font-size: 0.9rem; /* Tamanho pequeno */
  line-height: 1;
}

/* Estilo do Texto Inativo */
.text-inactive {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500; /* Medium */
  font-size: 0.9rem; /* Tamanho pequeno */
  line-height: 1;
  transition: color 0.3s ease-out;
}
.slide-button:hover .text-inactive {
 color: rgba(255, 255, 255, 0.9);
}

/* Estilos das Setas - CORRIGIDO */
.arrow-figma {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10; /* Acima de tudo */
  cursor: pointer;
  padding: 1rem; /* Área de clique maior */
  transition: opacity 0.2s ease-out;
  background-color: transparent; /* Fundo transparente */
}

.arrow-figma--left {
  left: 5px; /* Posição da seta esquerda */
}

.arrow-figma--right {
  right: 5px; /* Posição da seta direita */
}

.arrow-figma--disabled {
  opacity: 0.2;
  cursor: not-allowed;
}
`;

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend
);

const MODAL_VERTICAL_OFFSET = -150;

const MUSCLE_COLORS = {
  "Perímetro Punho": "#22d3ee",
  Antebraço: "#60a5fa",
  Braço: "#38bdf8",
  Cintura: "#0ea5e9",
  Abdômen: "#06b6d4",
  Quadril: "#3b82f6",
  Coxa: "#2563eb",
  Panturrilha: "#0ea5e9",
  "RC/Q": "#0284c7",
};

const BODY_PART_ICONS = {
  "Perímetro Punho": <Ruler size={18} className="mr-2" />,
  Antebraço: <Ruler size={18} className="mr-2" />,
  Braço: <Ruler size={18} className="mr-2" />,
  Cintura: <Ruler size={18} className="mr-2" />,
  Abdômen: <Ruler size={18} className="mr-2" />,
  Quadril: <Ruler size={18} className="mr-2" />,
  Coxa: <Ruler size={18} className="mr-2" />,
  Panturrilha: <Ruler size={18} className="mr-2" />,
  "RC/Q": <Activity size={18} className="mr-2" />,
};

const partesCorpo = [
  "Perímetro Punho",
  "Antebraço",
  "Braço",
  "Cintura",
  "Abdômen",
  "Quadril",
  "Coxa",
  "Panturrilha",
  "RC/Q",
];

const hojeFormatada = () => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};

const calcularIdade = (nascimento) => {
  if (!nascimento || typeof nascimento !== "string" || nascimento.trim() === "")
    return null;
  const nascDate = new Date(nascimento.trim());
  if (isNaN(nascDate.getTime())) {
    return null;
  }
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascDate.getFullYear();
  const m = hoje.getMonth() - nascDate.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascDate.getDate())) {
    idade--;
  }
  return idade < 0 ? null : idade;
};

const getClassificacaoIMC = (imc) => {
  if (imc === null || imc === undefined || isNaN(imc) || imc === "—") return "";
  const valorIMC = parseFloat(imc);
  if (valorIMC < 18.5) return "Abaixo do peso";
  if (valorIMC >= 18.5 && valorIMC <= 24.9) return "Peso normal";
  if (valorIMC >= 25 && valorIMC <= 29.9) return "Sobrepeso";
  if (valorIMC >= 30 && valorIMC <= 34.9) return "Obesidade grau I";
  if (valorIMC >= 35 && valorIMC <= 39.9) return "Obesidade grau II";
  if (valorIMC >= 40) return "Obesidade grau III";
  return "";
};

const getCorClassificacaoIMC = (imc) => {
  if (imc === null || imc === undefined || isNaN(imc) || imc === "—")
    return "text-slate-400";
  const valorIMC = parseFloat(imc);
  if (valorIMC < 18.5) return "text-yellow-400";
  if (valorIMC >= 18.5 && valorIMC <= 24.9) return "text-green-400";
  if (valorIMC >= 25 && valorIMC <= 29.9) return "text-yellow-400";
  if (valorIMC >= 30 && valorIMC <= 34.9) return "text-orange-400";
  if (valorIMC >= 35 && valorIMC <= 39.9) return "text-red-400";
  if (valorIMC >= 40) return "text-red-600";
  return "text-slate-400";
};

const CHAVE_BASE_CONSUMO_AGUA = "gymtracker_consumo_agua";

const calcularVariacao = (historico) => {
  if (!historico || historico.length < 2) return null;
  const ordenado = [...historico].sort(
    (a, b) => new Date(a.data) - new Date(b.data)
  );
  const ultimo = ordenado[ordenado.length - 1];
  const penultimo = ordenado[ordenado.length - 2];

  if (
    !ultimo ||
    !penultimo ||
    ultimo.valor === null ||
    ultimo.valor === undefined ||
    penultimo.valor === null ||
    penultimo.valor === undefined ||
    isNaN(parseFloat(ultimo.valor)) ||
    isNaN(parseFloat(penultimo.valor)) ||
    parseFloat(penultimo.valor) <= 0
  ) {
    return null;
  }

  const ultimoValor = parseFloat(ultimo.valor);
  const penultimoValor = parseFloat(penultimo.valor);

  const diferenca = ultimoValor - penultimoValor;
  const diferencaAbsoluta = Math.abs(diferenca);
  const percentual = Math.abs((diferenca / penultimoValor) * 100);
  const sinal = diferenca >= 0 ? "+" : "-";

  let texto, cor, corBg, icone;
  if (diferenca > 0.05) {
    texto = "Aumento";
    cor = "text-red-400";
    corBg = "bg-red-500/10";
    icone = <ArrowUpRight size={14} className="inline-block mr-0.5" />;
  } else if (diferenca < -0.05) {
    texto = "Redução";
    cor = "text-green-400";
    corBg = "bg-green-500/10";
    icone = <ArrowDownRight size={14} className="inline-block mr-0.5" />;
  } else {
    texto = "Estável";
    cor = "text-blue-400";
    corBg = "bg-blue-500/10";
    icone = <ArrowRight size={14} className="inline-block mr-0.5" />;
    return {
      texto,
      cor,
      corBg,
      icone,
      diferencaAbsoluta: 0,
      percentual: 0,
      sinal: "",
      isEstavel: true,
    };
  }

  return {
    diferencaAbsoluta,
    percentual,
    sinal,
    texto,
    cor,
    corBg,
    icone,
    isEstavel: false,
  };
};

const tabs = [
  { id: "dados", label: "Seus Dados", icon: Info },
  { id: "peso", label: "Peso", icon: Weight },
  { id: "gordura", label: "% Gordura", icon: Percent },
  { id: "medidas", label: "Medidas", icon: Ruler },
];

// Componente de Seta Personalizado para KeenSlider (Estilo Figma - CORRIGIDO)
const ArrowFigma = ({ disabled, left, onClick }) => {
  const classes = `arrow-figma ${
    left ? "arrow-figma--left" : "arrow-figma--right"
  } ${disabled ? "arrow-figma--disabled" : ""}`;
  const icon = left ? (
    <ChevronLeft size={38} className="text-white" />
  ) : (
    <ChevronRight size={38} className="text-white" />
  );

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {icon}
    </button>
  );
};

const Medicoes = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const [dataNascimento, setDataNascimento] = useState("");
  const [mostraInputNascimento, setMostraInputNascimento] = useState(true);
  const [idade, setIdade] = useState(null);

  const [altura, setAltura] = useState("");
  const [mostraInputAltura, setMostraInputAltura] = useState(true);

  const [peso, setPeso] = useState("");
  const [dataPeso, setDataPeso] = useState(hojeFormatada);
  const [pesos, setPesos] = useState([]);

  const [gordura, setGordura] = useState("");
  const [dataGordura, setDataGordura] = useState(hojeFormatada);
  const [gorduras, setGorduras] = useState([]);

  const [medicoes, setMedicoes] = useState([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalGraficoAberto, setModalGraficoAberto] = useState(false);
  const [parteSelecionada, setParteSelecionada] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hojeFormatada);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hoveredParte, setHoveredParte] = useState(null);
  const [activeTab, setActiveTab] = useState("dados");

  const mainContainerRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slideOpacities, setSlideOpacities] = useState([]); // Estado para opacidades

  // Keen Slider Ref e Instância - CORRIGIDO para Figma
  const [sliderRef, instanceRef] = useKeenSlider({
    initial: tabs.findIndex((tab) => tab.id === activeTab),
    slides: {
      perView: 2.7, // Mostrar 2 itens + preview
      spacing: 1, // Espaçamento entre slides
      origin: "center", // Centralizar os slides
    },
    mode: "free-snap",
    slideChanged(s) {
      const newIndex = s.track.details.rel;
      setCurrentSlide(newIndex);
      if (tabs[newIndex]) {
        setActiveTab(tabs[newIndex].id);
      }
      updateSlideOpacities(s); // Atualiza opacidades ao mudar slide
    },
    created(s) {
      setLoaded(true);
      updateSlideOpacities(s); // Atualiza opacidades na criação
      const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
      if (activeIndex > 0) {
        setTimeout(() => s.moveToIdx(activeIndex, true, { duration: 0 }), 50);
      }
    },
    detailsChanged(s) {
      updateSlideOpacities(s); // Atualiza opacidades em qualquer mudança
    },
    dragSpeed: 0.8,
    rubberband: true,
  });

  // Função para calcular e atualizar opacidades dos slides - CORRIGIDO
  const updateSlideOpacities = useCallback((sliderInstance) => {
    if (!sliderInstance?.track?.details?.slides) return;

    const slidesDetails = sliderInstance.track.details.slides;
    const newOpacities = slidesDetails.map((slide) => {
      const portion = slide.portion;
      // Totalmente visível: opacidade 1
      if (portion >= 0.98) return 1;
      // Preview (parcialmente visível): opacidade 0.3
      if (portion > 0.05 && portion < 0.98) return 0.3;
      // Quase invisível: opacidade 0.1 (ou 0 para esconder completamente)
      return 0.1;
    });
    setSlideOpacities(newOpacities);
  }, []);

  // Atualiza o slider quando a tab ativa muda externamente
  useEffect(() => {
    if (instanceRef.current && !isDesktop) {
      const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
      if (
        activeIndex !== -1 &&
        instanceRef.current.track.details.rel !== activeIndex
      ) {
        instanceRef.current.moveToIdx(activeIndex);
      }
    }
  }, [activeTab, instanceRef, isDesktop]);

  // Atualiza o slider no resize
  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.update();
      // Recalcular opacidades após update
      updateSlideOpacities(instanceRef.current);
    }
  }, [isDesktop, instanceRef, updateSlideOpacities]);

  // Lógica de resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Chamar na montagem inicial
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lógica de visibilidade inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Lógica de bloqueio de scroll em modal
  useEffect(() => {
    if (modalAberto || modalGraficoAberto) {
      const scrollY = window.scrollY;
      setScrollPosition(scrollY);
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.paddingRight = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }
  }, [modalAberto, modalGraficoAberto]);

  // Carregar dados do usuário
  const carregarDadosDoUsuario = useCallback(() => {
    if (user) {
      const nascimentoSalvo = getUserData("medicoes_dataNascimento", user.uid);
      const idadeCalculada = calcularIdade(nascimentoSalvo);
      if (
        nascimentoSalvo &&
        typeof nascimentoSalvo === "string" &&
        nascimentoSalvo.trim() !== "" &&
        idadeCalculada !== null
      ) {
        setDataNascimento(nascimentoSalvo.trim());
        setIdade(idadeCalculada);
        setMostraInputNascimento(false);
      } else {
        setDataNascimento("");
        setIdade(null);
        setMostraInputNascimento(true);
      }

      const alturaSalva = getUserData("medicoes_altura", user.uid);
      const alturaTrimmed =
        typeof alturaSalva === "string"
          ? alturaSalva.trim()
          : typeof alturaSalva === "number"
          ? String(alturaSalva)
          : "";
      const alturaNum =
        alturaTrimmed !== "" ? parseInt(alturaTrimmed, 10) : NaN;
      if (alturaTrimmed !== "" && !isNaN(alturaNum)) {
        setAltura(alturaNum);
        setMostraInputAltura(false);
      } else {
        setAltura("");
        setMostraInputAltura(true);
      }

      setPesos(getUserData("medicoes_pesos_historico", user.uid) || []);
      setGorduras(getUserData("medicoes_gorduras_historico", user.uid) || []);
      setMedicoes(getUserData("medicoes_corpo_historico", user.uid) || []);
    } else {
      setDataNascimento("");
      setIdade(null);
      setMostraInputNascimento(true);
      setAltura("");
      setMostraInputAltura(true);
      setPesos([]);
      setGorduras([]);
      setMedicoes([]);
    }
  }, [user]);

  useEffect(() => {
    carregarDadosDoUsuario();
  }, [user, carregarDadosDoUsuario]);

  // Salvar dados do usuário
  const salvarDadosUsuario = () => {
    if (!user) {
      alert("Você precisa estar logado para salvar os dados.");
      return;
    }
    let algoSalvoComSucesso = false;
    const dataNascimentoTrimmed = dataNascimento.trim();
    const idadeAoSalvar = calcularIdade(dataNascimentoTrimmed);

    if (dataNascimentoTrimmed !== "" && idadeAoSalvar !== null) {
      saveUserData("medicoes_dataNascimento", user.uid, dataNascimentoTrimmed);
      setIdade(idadeAoSalvar);
      setMostraInputNascimento(false);
      algoSalvoComSucesso = true;
    } else if (dataNascimentoTrimmed === "") {
      saveUserData("medicoes_dataNascimento", user.uid, "");
      setDataNascimento("");
      setIdade(null);
      setMostraInputNascimento(true);
    } else {
      alert("Data de nascimento fornecida é inválida. Não foi salva.");
      setMostraInputNascimento(true);
    }

    const alturaStrTrimmed = String(altura).trim();
    const alturaNumParaSalvar =
      alturaStrTrimmed !== "" ? Number(alturaStrTrimmed) : NaN;

    if (alturaStrTrimmed !== "" && !isNaN(alturaNumParaSalvar)) {
      saveUserData("medicoes_altura", user.uid, String(alturaNumParaSalvar));
      setAltura(alturaNumParaSalvar);
      setMostraInputAltura(false);
      algoSalvoComSucesso = true;
    } else if (alturaStrTrimmed === "") {
      saveUserData("medicoes_altura", user.uid, "");
      setAltura("");
      setMostraInputAltura(true);
    } else {
      alert("Altura fornecida é inválida. Não foi salva.");
      setMostraInputAltura(true);
    }
  };

  // Submit Peso
  const handleSubmitPeso = (e) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para registrar o peso.");
      return;
    }
    if (!peso || isNaN(parseFloat(peso))) {
      alert("Por favor, insira um valor de peso válido.");
      return;
    }
    const dataAtualPeso = dataPeso || hojeFormatada();
    const novoHistoricoPesos = [
      ...pesos,
      { valor: parseFloat(peso), data: dataAtualPeso },
    ];
    setPesos(novoHistoricoPesos);
    saveUserData("medicoes_pesos_historico", user.uid, novoHistoricoPesos);
    setPeso("");
  };

  // Submit Gordura
  const handleSubmitGordura = (e) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para registrar a gordura.");
      return;
    }
    if (!gordura || isNaN(parseFloat(gordura))) {
      alert("Por favor, insira um valor de gordura válido.");
      return;
    }
    const dataAtualGordura = dataGordura || hojeFormatada();
    const novoHistoricoGorduras = [
      ...gorduras,
      { valor: parseFloat(gordura), data: dataAtualGordura },
    ];
    setGorduras(novoHistoricoGorduras);
    saveUserData(
      "medicoes_gorduras_historico",
      user.uid,
      novoHistoricoGorduras
    );
    setGordura("");
  };

  // Submit Medida
  const handleSubmitMedida = (e) => {
    e.preventDefault();
    if (!user) {
      alert("Você precisa estar logado para registrar medições.");
      return;
    }
    if (!parteSelecionada || !valor || isNaN(parseFloat(valor))) {
      alert("Selecione a parte do corpo e insira um valor válido.");
      return;
    }
    const dataMedida = data || hojeFormatada();
    const novaMedida = {
      parte: parteSelecionada,
      valor: parseFloat(valor),
      data: dataMedida,
    };
    let medicoesTemp = [...medicoes, novaMedida];
    if (parteSelecionada === "Cintura" || parteSelecionada === "Quadril") {
      const cinturaEntry = medicoesTemp.find(
        (m) => m.parte === "Cintura" && m.data === dataMedida
      );
      const quadrilEntry = medicoesTemp.find(
        (m) => m.parte === "Quadril" && m.data === dataMedida
      );
      if (
        cinturaEntry &&
        quadrilEntry &&
        cinturaEntry.valor > 0 &&
        quadrilEntry.valor > 0
      ) {
        const rcqValor = cinturaEntry.valor / quadrilEntry.valor;
        const rcqIndex = medicoesTemp.findIndex(
          (m) => m.parte === "RC/Q" && m.data === dataMedida
        );
        if (rcqIndex !== -1) {
          medicoesTemp[rcqIndex] = {
            ...medicoesTemp[rcqIndex],
            valor: parseFloat(rcqValor.toFixed(2)),
          };
        } else {
          medicoesTemp.push({
            parte: "RC/Q",
            valor: parseFloat(rcqValor.toFixed(2)),
            data: dataMedida,
          });
        }
      }
    }
    setMedicoes(medicoesTemp);
    saveUserData("medicoes_corpo_historico", user.uid, medicoesTemp);
    setValor("");
    setParteSelecionada("");
    setModalAberto(false);
  };

  // Limpar Dados
  const handleLimparTodosOsDados = () => {
    if (!user) {
      alert("Você precisa estar logado para limpar os dados.");
      return;
    }
    const confirmacao = window.confirm(
      "Tem certeza que deseja apagar todos os seus dados de medições? Esta ação não pode ser desfeita e também limpará seu registro de consumo de água do dia."
    );
    if (confirmacao) {
      saveUserData("medicoes_pesos_historico", user.uid, []);
      saveUserData("medicoes_gorduras_historico", user.uid, []);
      saveUserData("medicoes_corpo_historico", user.uid, []);
      const hojeISO = new Date().toISOString().split("T")[0];
      saveUserData(CHAVE_BASE_CONSUMO_AGUA, user.uid, {
        data: hojeISO,
        consumo: 0,
        meta: 2000,
        ultimoRegistroHora: null,
      });
      carregarDadosDoUsuario();
      alert(
        "Todos os seus dados de medições e o consumo de água do dia foram apagados."
      );
    }
  };

  // Gerar Gráfico
  const gerarGrafico = (dados, label, cor) => {
    return {
      labels: dados.map((item) => {
        const [ano, mes, dia] = item.data.split("-");
        return `${dia}/${mes}/${ano}`;
      }),
      datasets: [
        {
          label,
          data: dados.map((item) => item.valor),
          backgroundColor: cor,
          borderColor: cor,
          tension: 0.3,
          pointBackgroundColor: cor,
          pointBorderColor: "#0f172a",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: cor,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  // Opções do Gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: "rgba(51, 65, 85, 0.5)",
        },
        ticks: {
          color: "rgba(203, 213, 225, 0.8)",
        },
      },
      y: {
        grid: {
          color: "rgba(51, 65, 85, 0.5)",
        },
        ticks: {
          color: "rgba(203, 213, 225, 0.8)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "rgba(203, 213, 225, 0.8)",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#fff",
        bodyColor: "#e2e8f0",
        borderColor: "rgba(59, 130, 246, 0.5)",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: function (tooltipItems) {
            return tooltipItems[0].label;
          },
        },
      },
    },
  };

  // Funções de Modal
  const abrirModal = () => {
    const scrollY = window.scrollY;
    setScrollPosition(scrollY);
    setParteSelecionada("");
    setValor("");
    setData(hojeFormatada());
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  const abrirModalGrafico = (parte) => {
    const scrollY = window.scrollY;
    setScrollPosition(scrollY);
    setParteSelecionada(parte);
    setModalGraficoAberto(true);
  };

  const fecharModalGrafico = () => {
    setModalGraficoAberto(false);
  };

  // Cálculos derivados
  const ultimoPesoValido =
    pesos.length > 0 && pesos.at(-1)?.valor ? pesos.at(-1).valor : null;
  const ultimaGorduraValida =
    gorduras.length > 0 && gorduras.at(-1)?.valor
      ? gorduras.at(-1).valor
      : null;
  const alturaValida = altura && !isNaN(Number(altura)) ? Number(altura) : null;
  const imcCalculado =
    ultimoPesoValido && alturaValida
      ? (ultimoPesoValido / (alturaValida / 100) ** 2).toFixed(1)
      : "—";
  const classificacaoIMC = getClassificacaoIMC(imcCalculado);
  const corClassificacaoIMC = getCorClassificacaoIMC(imcCalculado);

  const variacaoPeso = calcularVariacao(pesos);
  const variacaoGordura = calcularVariacao(gorduras);

  // Renderização Condicional de Login
  if (!user) {
    return (
      <div className="p-4 text-center text-white">
        <div className="bg-slate-800/70 rounded-xl p-8 shadow-lg border border-slate-700/50 backdrop-blur-sm">
          <Info size={48} className="text-cyan-400 mx-auto mb-4" />
          <p className="text-lg text-slate-100">
            Por favor, faça login para acessar e registrar suas medições.
          </p>
        </div>
      </div>
    );
  }

  // Renderização Principal
  return (
    <PageWrapper>
      {/* Inject custom styles */}
      <style>{customSliderStyles}</style>
      <div
        ref={mainContainerRef}
        className={`pb-32 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Cabeçalho */}
        <div
          className="p-3 max-w-screen-lg mx-auto space-y-8t border-b border-slate-700/50"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center mb-3 sm:mb-0">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl mr-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
              <Activity size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Medições e Progresso
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Acompanhe sua evolução corporal.
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Navegação Responsiva - CORRIGIDA */}
        <div className="py-3 border-b border-slate-700/50 overflow-hidden px-3">
          {" "}
          {/* Padding horizontal para não colar nas bordas */}
          {isDesktop ? (
            // Layout Desktop: Flex container simples
            <div className="flex justify-center space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center ${
                      activeTab === tab.id
                        ? "bg-cyan-500/20 text-cyan-400 shadow-inner"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <Icon size={16} className="mr-1.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : (
            // Layout Mobile: Keen-Slider com estilo Figma CORRIGIDO
            <div className="navigation-wrapper-mobile">
              {" "}
              {/* Wrapper com gradiente, borda e mask */}
              <div
                ref={sliderRef}
                className="keen-slider keen-slider-container"
              >
                {" "}
                {/* Container do slider */}
                {tabs.map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const opacity =
                    slideOpacities[idx] !== undefined ? slideOpacities[idx] : 1;

                  return (
                    <div
                      key={tab.id}
                      className="keen-slider__slide"
                      style={{ opacity: opacity }} // Aplicar opacidade ao slide inteiro
                    >
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`slide-button`} // Usar classe CSS para estilo base
                      >
                        {/* Ícone com ou sem pílula */}
                        <div className={isActive ? "pill-active" : ""}>
                          <Icon
                            size={28}
                            className={
                              isActive ? "icon-active" : "icon-inactive"
                            }
                          />
                        </div>
                        {/* Texto */}
                        <span
                          className={isActive ? "text-active" : "text-inactive"}
                        >
                          {tab.label}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Setas de Navegação (fora do slider, dentro do wrapper) */}
              {loaded && instanceRef.current && (
                <>
                  <ArrowFigma
                    left
                    onClick={(e) => {
                      e.stopPropagation();
                      instanceRef.current?.prev();
                    }}
                    disabled={currentSlide === 0}
                  />
                  <ArrowFigma
                    onClick={(e) => {
                      e.stopPropagation();
                      instanceRef.current?.next();
                    }}
                    disabled={
                      currentSlide >=
                      instanceRef.current.track.details.slides.length -
                        Math.floor(
                          instanceRef.current.options.slides.perView - 0.1
                        ) // Ajuste para desabilitar corretamente com perView fracionado
                    }
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Conteúdo da Tab Ativa */}
        <div className="p-4 space-y-6">
          {/* Tab: Seus Dados */}
          {activeTab === "dados" && (
            <div className="space-y-5 animate-fadeIn ">
              {/* ... (conteúdo da tab dados - inalterado) ... */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Info size={18} className="text-cyan-400 mr-2" />
                  Seus Dados Pessoais
                </h2>
                <button
                  onClick={handleLimparTodosOsDados}
                  className="group flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-all duration-200 hover:bg-slate-700/50 hover:text-white active:scale-95"
                  title="Limpar todos os dados de medições e consumo de água do dia"
                >
                  <Trash2
                    size={16}
                    className="text-slate-400 transition-colors group-hover:text-red-400"
                  />
                  <span className="hidden sm:inline">Limpar Tudo</span>
                </button>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-5 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl mr-4 shadow-md">
                    <Heart size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Perfil de Saúde</h3>
                    <p className="text-slate-400 text-sm">
                      Seus dados biométricos
                    </p>
                  </div>
                </div>
                {mostraInputNascimento ? (
                  <div className="space-y-2 mb-4">
                    <label
                      htmlFor="dataNascimentoInput"
                      className="block text-sm font-medium text-slate-300 flex items-center"
                    >
                      <Calendar size={16} className="text-cyan-400 mr-2" />
                      Data de Nascimento:
                    </label>
                    <input
                      id="dataNascimentoInput"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 placeholder-slate-500 hover:bg-slate-700"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-700/40 p-3 rounded-lg mb-4 hover:bg-slate-700/60 transition-all duration-200">
                    <div className="flex items-center">
                      <Calendar size={18} className="text-cyan-400 mr-2" />
                      <p className="text-slate-300">
                        Idade:{" "}
                        <span className="text-white font-medium">
                          {idade !== null ? `${idade} anos` : "Não informada"}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setMostraInputNascimento(true)}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors p-1 rounded-full hover:bg-cyan-500/10"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
                {mostraInputAltura ? (
                  <div className="space-y-2 mb-4">
                    <label
                      htmlFor="alturaInput"
                      className="block text-sm font-medium text-slate-300 flex items-center"
                    >
                      <Ruler size={16} className="text-cyan-400 mr-2" />
                      Altura (cm):
                    </label>
                    <input
                      id="alturaInput"
                      type="number"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 placeholder-slate-500 hover:bg-slate-700"
                      placeholder="Altura (cm)"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-700/40 p-3 rounded-lg mb-4 hover:bg-slate-700/60 transition-all duration-200">
                    <div className="flex items-center">
                      <Ruler size={18} className="text-cyan-400 mr-2" />
                      <p className="text-slate-300">
                        Altura:{" "}
                        <span className="text-white font-medium">
                          {alturaValida
                            ? `${(alturaValida / 100).toFixed(2)} m`
                            : "Não informada"}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => setMostraInputAltura(true)}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors p-1 rounded-full hover:bg-cyan-500/10"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
                {(mostraInputNascimento || mostraInputAltura) && (
                  <button
                    onClick={salvarDadosUsuario}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg transition-all flex items-center justify-center transform hover:scale-[1.02] duration-200 shadow-md"
                  >
                    <Zap size={18} className="mr-2" />
                    Salvar Dados Pessoais
                  </button>
                )}
                <div className="bg-slate-700/40 p-4 rounded-xl flex items-center border border-slate-700/30 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] mt-4">
                  <div className="bg-cyan-500/20 p-2 rounded-full mr-3">
                    <Activity size={18} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">IMC</p>
                    <div>
                      <span
                        className={`font-medium text-lg ${corClassificacaoIMC}`}
                      >
                        {imcCalculado}
                      </span>
                      {classificacaoIMC && (
                        <span className="ml-2 text-xs text-slate-400">
                          ({classificacaoIMC})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Peso */}
          {activeTab === "peso" && (
            <div className="space-y-6 animate-fadeIn">
              {/* ... (conteúdo da tab peso - inalterado) ... */}
              {ultimoPesoValido !== null && (
                <div className="bg-slate-800/50 rounded-xl p-5 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-cyan-500/20 p-3 rounded-full mr-4">
                        <Weight size={24} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Peso atual</p>
                        <p className="text-white font-semibold text-2xl">
                          {ultimoPesoValido} kg
                        </p>
                      </div>
                    </div>
                    {variacaoPeso ? (
                      <div className="text-right">
                        <p
                          className={`text-xs ${variacaoPeso.cor} mb-0.5 flex items-center justify-end`}
                        >
                          {variacaoPeso.icone}
                          {variacaoPeso.texto}
                        </p>
                        {!variacaoPeso.isEstavel && (
                          <p className="text-white text-sm font-medium">
                            {variacaoPeso.sinal}
                            {variacaoPeso.diferencaAbsoluta.toFixed(1)} kg
                            <span className="text-slate-400 text-xs ml-1">
                              ({variacaoPeso.sinal}
                              {variacaoPeso.percentual.toFixed(1)}%)
                            </span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Registre mais pesos para ver a variação.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-slate-800/50 rounded-xl p-5 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Plus size={18} className="text-cyan-400 mr-2" />
                  Registrar Novo Peso
                </h3>
                <form onSubmit={handleSubmitPeso} className="space-y-4">
                  <div>
                    <label
                      htmlFor="pesoInput"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Peso (kg):
                    </label>
                    <input
                      id="pesoInput"
                      type="number"
                      step="0.1"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 placeholder-slate-500 hover:bg-slate-700"
                      placeholder="Ex: 75.5"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dataPesoInput"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Data:
                    </label>
                    <input
                      id="dataPesoInput"
                      type="date"
                      value={dataPeso}
                      onChange={(e) => setDataPeso(e.target.value)}
                      className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 placeholder-slate-500 hover:bg-slate-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg transition-all flex items-center justify-center transform hover:scale-[1.02] duration-200 shadow-md"
                  >
                    <Plus size={18} className="mr-2" />
                    Salvar Peso
                  </button>
                </form>
              </div>
              {pesos.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-5 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <BarChart2 size={18} className="text-cyan-400 mr-2" />
                    Histórico de Peso
                  </h3>
                  <div className="h-64 w-full">
                    <Line
                      data={gerarGrafico(pesos, "Peso (kg)", "#22d3ee")}
                      options={chartOptions}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Gordura */}
          {activeTab === "gordura" && (
            <div className="space-y-6 animate-fadeIn">
              {/* ... (conteúdo da tab gordura - inalterado) ... */}
              {ultimaGorduraValida !== null && (
                <div className="bg-slate-800/50 rounded-xl p-5 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-cyan-500/20 p-3 rounded-full mr-4">
                        <Percent size={24} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">
                          % Gordura atual
                        </p>
                        <p className="text-white font-semibold text-2xl">
                          {ultimaGorduraValida} %
                        </p>
                      </div>
                    </div>
                    {variacaoGordura ? (
                      <div className="text-right">
                        <p
                          className={`text-xs ${variacaoGordura.cor} mb-0.5 flex items-center justify-end`}
                        >
                          {variacaoGordura.icone}
                          {variacaoGordura.texto}
                        </p>
                        {!variacaoGordura.isEstavel && (
                          <p className="text-white text-sm font-medium">
                            {variacaoGordura.sinal}
                            {variacaoGordura.diferencaAbsoluta.toFixed(1)} %
                            <span className="text-slate-400 text-xs ml-1">
                              ({variacaoGordura.sinal}
                              {variacaoGordura.percentual.toFixed(1)}%)
                            </span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        Registre mais % de gordura para ver a variação.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="bg-slate-800/50 rounded-xl p-5 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Plus size={18} className="text-cyan-400 mr-2" />
                  Registrar Novo % Gordura
                </h3>
                <form onSubmit={handleSubmitGordura} className="space-y-4">
                  <div>
                    <label
                      htmlFor="gorduraInput"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Gordura (%):
                    </label>
                    <input
                      id="gorduraInput"
                      type="number"
                      step="0.1"
                      value={gordura}
                      onChange={(e) => setGordura(e.target.value)}
                      className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 placeholder-slate-500 hover:bg-slate-700"
                      placeholder="Ex: 15.2"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="dataGorduraInput"
                      className="block text-sm font-medium text-slate-300 mb-1"
                    >
                      Data:
                    </label>
                    <input
                      id="dataGorduraInput"
                      type="date"
                      value={dataGordura}
                      onChange={(e) => setDataGordura(e.target.value)}
                      className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 placeholder-slate-500 hover:bg-slate-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg transition-all flex items-center justify-center transform hover:scale-[1.02] duration-200 shadow-md"
                  >
                    <Plus size={18} className="mr-2" />
                    Salvar % Gordura
                  </button>
                </form>
              </div>
              {gorduras.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-5 shadow-lg border border-slate-700/50 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <BarChart2 size={18} className="text-cyan-400 mr-2" />
                    Histórico de % Gordura
                  </h3>
                  <div className="h-64 w-full">
                    <Line
                      data={gerarGrafico(gorduras, "% Gordura", "#60a5fa")}
                      options={chartOptions}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Medidas */}
          {activeTab === "medidas" && (
            <div className="space-y-6 animate-fadeIn">
              {/* ... (conteúdo da tab medidas - corrigido, inalterado aqui) ... */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Ruler size={18} className="text-cyan-400 mr-2" />
                  Medidas Corporais
                </h2>
                <button
                  onClick={abrirModal}
                  className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 px-3 py-1.5 text-sm text-white transition-all duration-200 active:scale-95 shadow-md"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Adicionar Medida</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {partesCorpo.map((parte) => {
                  const historicoParte = medicoes
                    .filter((m) => m.parte === parte)
                    .sort((a, b) => new Date(a.data) - new Date(b.data));
                  const ultimaMedida =
                    historicoParte[historicoParte.length - 1];
                  const variacaoParte = calcularVariacao(historicoParte);
                  const cor = MUSCLE_COLORS[parte] || "#64748b";
                  const IconeParte = BODY_PART_ICONS[parte] || (
                    <Ruler size={18} className="mr-2" />
                  );
                  if (!React.isValidElement(IconeParte)) {
                    console.error(`Ícone inválido para a parte: ${parte}`);
                    return (
                      <div key={parte} className="text-red-500">
                        Erro no ícone para {parte}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={parte}
                      className="bg-slate-800/50 rounded-xl p-4 shadow-lg border border-slate-700/50 backdrop-blur-sm transition-all duration-300 hover:shadow-cyan-500/10 hover:border-slate-600/70 transform hover:-translate-y-1"
                      onMouseEnter={() => setHoveredParte(parte)}
                      onMouseLeave={() => setHoveredParte(null)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {React.cloneElement(IconeParte, {
                            style: { color: cor },
                          })}
                          <h4 className="text-sm font-medium text-slate-200">
                            {parte}
                          </h4>
                        </div>
                        {historicoParte.length > 0 && (
                          <button
                            onClick={() => abrirModalGrafico(parte)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors p-1 rounded-full hover:bg-cyan-500/10"
                            title={`Ver histórico de ${parte}`}
                          >
                            <BarChart2 size={16} />
                          </button>
                        )}
                      </div>
                      {ultimaMedida ? (
                        <div className="flex items-end justify-between">
                          <p className="text-xl font-semibold text-white">
                            {typeof ultimaMedida.valor === "number"
                              ? ultimaMedida.valor.toFixed(
                                  parte === "RC/Q" ? 2 : 1
                                )
                              : "--"}
                            <span className="text-sm text-slate-400 ml-1">
                              {parte === "RC/Q" ? "" : "cm"}
                            </span>
                          </p>
                          {variacaoParte && !variacaoParte.isEstavel && (
                            <div className="text-right">
                              <p
                                className={`text-xs ${variacaoParte.cor} mb-0.5 flex items-center justify-end`}
                              >
                                {variacaoParte.icone}
                                {variacaoParte.texto}
                              </p>
                              <p className="text-xs text-slate-400">
                                {variacaoParte.sinal}
                                {variacaoParte.diferencaAbsoluta.toFixed(1)}
                                {parte === "RC/Q" ? "" : "cm"}
                              </p>
                            </div>
                          )}
                          {variacaoParte && variacaoParte.isEstavel && (
                            <p
                              className={`text-xs ${variacaoParte.cor} flex items-center`}
                            >
                              {variacaoParte.icone}
                              {variacaoParte.texto}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">
                          Nenhuma medida registrada.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Adicionar Medida */}
        {modalAberto && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={fecharModal}
          >
            <div
              className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700/50 relative animate-slideUp"
              style={{ top: `${MODAL_VERTICAL_OFFSET}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmitMedida} className="p-6 space-y-5">
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                  <Plus size={20} className="text-cyan-400 mr-2" />
                  Adicionar Nova Medida
                </h3>
                <div>
                  <label
                    htmlFor="parteCorpoSelect"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Parte do Corpo:
                  </label>
                  <select
                    id="parteCorpoSelect"
                    value={parteSelecionada}
                    onChange={(e) => setParteSelecionada(e.target.value)}
                    className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 hover:bg-slate-700 appearance-none pr-8 bg-no-repeat bg-right"
                    style={{
                      backgroundImage:
                        'url(\'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"%3E%3Cpath stroke="%2394a3b8" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 8l4 4 4-4"/%3E%3C/svg%3E\')',
                      backgroundPosition: "right 0.5rem center",
                      backgroundSize: "1.5em 1.5em",
                    }}
                  >
                    <option value="" disabled>
                      Selecione...
                    </option>
                    {partesCorpo
                      .filter((p) => p !== "RC/Q")
                      .map((parte) => (
                        <option key={parte} value={parte}>
                          {parte}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="valorMedidaInput"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Valor (cm):
                  </label>
                  <input
                    id="valorMedidaInput"
                    type="number"
                    step="0.1"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 placeholder-slate-500 hover:bg-slate-700"
                    placeholder="Ex: 35.5"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dataMedidaInput"
                    className="block text-sm font-medium text-slate-300 mb-1"
                  >
                    Data:
                  </label>
                  <input
                    id="dataMedidaInput"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full p-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 placeholder-slate-500 hover:bg-slate-700"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-200 shadow-md flex items-center"
                  >
                    <Plus size={16} className="mr-1.5" />
                    Salvar Medida
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Gráfico */}
        {modalGraficoAberto && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={fecharModalGrafico}
          >
            <div
              className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-700/50 relative animate-slideUp"
              style={{ top: `${MODAL_VERTICAL_OFFSET}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <BarChart2
                      size={20}
                      className="mr-2"
                      style={{ color: MUSCLE_COLORS[parteSelecionada] }}
                    />
                    Histórico - {parteSelecionada}
                  </h3>
                  <button
                    onClick={fecharModalGrafico}
                    className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="h-72 w-full">
                  <Line
                    data={gerarGrafico(
                      medicoes
                        .filter((m) => m.parte === parteSelecionada)
                        .sort((a, b) => new Date(a.data) - new Date(b.data)),
                      `${parteSelecionada} (${
                        parteSelecionada === "RC/Q" ? "" : "cm"
                      })`,
                      MUSCLE_COLORS[parteSelecionada] || "#64748b"
                    )}
                    options={chartOptions}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Navegacao />
    </PageWrapper>
  );
};

export default Medicoes;
