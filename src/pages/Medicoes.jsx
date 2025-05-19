import { useState, useEffect } from "react";
import { Pencil, Trash2, Ruler, Plus, Calendar, Activity, Weight, Percent, TrendingDown, Info, BarChart2, ChevronDown } from "lucide-react";
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
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage";
import PageWrapper from "../components/PageWrapper";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend
);

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
    // Verifica se a data é válida
    return null;
  }
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascDate.getFullYear();
  const m = hoje.getMonth() - nascDate.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascDate.getDate())) {
    idade--;
  }
  return idade < 0 ? null : idade; // Idade não pode ser negativa e retorna null se inválida
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
  if (imc === null || imc === undefined || isNaN(imc) || imc === "—") return "text-gray-400";
  const valorIMC = parseFloat(imc);
  if (valorIMC < 18.5) return "text-yellow-400";
  if (valorIMC >= 18.5 && valorIMC <= 24.9) return "text-green-400";
  if (valorIMC >= 25 && valorIMC <= 29.9) return "text-yellow-400";
  if (valorIMC >= 30 && valorIMC <= 34.9) return "text-orange-400";
  if (valorIMC >= 35 && valorIMC <= 39.9) return "text-red-400";
  if (valorIMC >= 40) return "text-red-600";
  return "text-gray-400";
};

const CHAVE_BASE_CONSUMO_AGUA = "gymtracker_consumo_agua"; // Chave base para o consumo de água

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

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Função para carregar/resetar dados do usuário
  const carregarDadosDoUsuario = () => {
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
  };

  useEffect(() => {
    carregarDadosDoUsuario();
  }, [user]);

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

    if (algoSalvoComSucesso) {
      alert("Dados salvos com sucesso!");
    }
  };

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
        meta: 2000, // Meta padrão, será recalculada se peso/idade existirem
        ultimoRegistroHora: null,
      });

      carregarDadosDoUsuario();
      alert(
        "Todos os seus dados de medições e o consumo de água do dia foram apagados."
      );
    }
  };

  const gerarGrafico = (dados, label, cor) => {
    // Configuração de cores para tema escuro
    const gridColor = 'rgba(75, 85, 99, 0.3)';
    const textColor = 'rgba(229, 231, 235, 0.8)';
    
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
          pointBorderColor: '#1e293b',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: cor,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: 'rgba(229, 231, 235, 0.8)',
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: 'rgba(229, 231, 235, 0.8)',
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(229, 231, 235, 0.8)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          }
        }
      }
    }
  };

  const abrirModalGrafico = (parte) => {
    setParteSelecionada(parte);
    setModalGraficoAberto(true);
  };

  // Renderização condicional se não houver usuário
  if (!user) {
    return (
      <div className="p-4 text-center text-white">
        <div className="bg-slate-800 rounded-xl p-8 shadow-lg">
          <Info size={48} className="text-blue-400 mx-auto mb-4" />
          <p className="text-lg">Por favor, faça login para acessar e registrar suas medições.</p>
        </div>
      </div>
    );
  }

  const ultimoPesoValido =
    pesos.length > 0 && pesos.at(-1)?.valor ? pesos.at(-1).valor : null;
  const alturaValida = altura && !isNaN(Number(altura)) ? Number(altura) : null;
  const imcCalculado =
    ultimoPesoValido && alturaValida
      ? (ultimoPesoValido / (alturaValida / 100) ** 2).toFixed(1)
      : "—";
  const classificacaoIMC = getClassificacaoIMC(imcCalculado);
  const corClassificacaoIMC = getCorClassificacaoIMC(imcCalculado);

  return (
    <PageWrapper>
      <div 
        className={`pb-32 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="p-4 max-w-screen-md mx-auto space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center mb-4">
            <Activity size={24} className="text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-white">Medições e Progresso</h1>
          </div>

          {/* Dados Pessoais */}
          <div className="bg-slate-800 p-5 rounded-xl shadow-lg space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Info size={18} className="text-blue-400 mr-2" />
                Seus Dados
              </h2>
              <button
                onClick={handleLimparTodosOsDados}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors"
                title="Limpar todos os dados de medições e consumo de água do dia"
              >
                <Trash2 size={16} className="mr-1.5" /> Limpar Tudo
              </button>
            </div>

            {mostraInputNascimento ? (
              <div className="space-y-2">
                <label
                  htmlFor="dataNascimentoInput"
                  className="block text-sm font-medium text-gray-300"
                >
                  Data de Nascimento:
                </label>
                <input
                  id="dataNascimentoInput"
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Calendar size={18} className="text-blue-400 mr-2" />
                  <p className="text-gray-300">
                    Idade:{" "}
                    <span className="text-white font-medium">
                      {idade !== null ? `${idade} anos` : "Não informada"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setMostraInputNascimento(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </div>
            )}

            {mostraInputAltura ? (
              <div className="space-y-2">
                <label
                  htmlFor="alturaInput"
                  className="block text-sm font-medium text-gray-300"
                >
                  Altura (cm):
                </label>
                <input
                  id="alturaInput"
                  type="number"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Altura (cm)"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
                <div className="flex items-center">
                  <Ruler size={18} className="text-blue-400 mr-2" />
                  <p className="text-gray-300">
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
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </div>
            )}

            {(mostraInputNascimento || mostraInputAltura) && (
              <button
                onClick={salvarDadosUsuario}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center"
              >
                Salvar Dados Pessoais
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-700/50 p-3 rounded-lg flex items-center">
                <Weight size={18} className="text-blue-400 mr-2" />
                <p className="text-gray-300">
                  Peso atual:{" "}
                  <span className="text-white font-medium">
                    {ultimoPesoValido ? `${ultimoPesoValido} kg` : "—"}
                  </span>
                </p>
              </div>
              
              <div className="bg-slate-700/50 p-3 rounded-lg flex items-center">
                <Activity size={18} className="text-blue-400 mr-2" />
                <p className="text-gray-300">
                  IMC:{" "}
                  <span className={`font-medium ${corClassificacaoIMC}`}>
                    {imcCalculado}
                  </span>
                  {classificacaoIMC && (
                    <span className="ml-2 text-xs text-gray-400">({classificacaoIMC})</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Formulário de Peso */}
          <form
            onSubmit={handleSubmitPeso}
            className="bg-slate-800 p-5 rounded-xl shadow-lg space-y-4 animate-fadeIn"
            style={{ animationDelay: '100ms' }}
          >
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Weight size={18} className="text-blue-400 mr-2" />
              Peso Corporal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="pesoInput"
                  className="block text-sm font-medium text-gray-300"
                >
                  Peso (kg):
                </label>
                <input
                  id="pesoInput"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 70.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="dataPesoInput"
                  className="block text-sm font-medium text-gray-300"
                >
                  Data do Registro:
                </label>
                <input
                  id="dataPesoInput"
                  type="date"
                  value={dataPeso}
                  onChange={(e) => setDataPeso(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus size={18} className="mr-1.5" /> Registrar Peso
            </button>
            
            {pesos.length > 0 ? (
              <>
                <div className="mt-4 bg-slate-700/30 p-3 rounded-lg h-60">
                  <Line 
                    data={gerarGrafico(pesos, "Peso (kg)", "#10B981")} 
                    options={chartOptions}
                  />
                </div>
                <p className="text-sm text-gray-400 flex items-center">
                  <Calendar size={14} className="mr-1.5" />
                  Última medição:{" "}
                  {(() => {
                    const ultimoRegPeso = pesos.at(-1);
                    if (!ultimoRegPeso?.data) return "—";
                    const [ano, mes, dia] = ultimoRegPeso.data.split("-");
                    return `${dia}/${mes}/${ano} (${ultimoRegPeso.valor} kg)`;
                  })()}
                </p>
              </>
            ) : (
              <div className="mt-4 bg-slate-700/30 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                <BarChart2 size={32} className="text-gray-500 mb-2" />
                <p className="text-gray-400">Nenhum registro de peso encontrado.</p>
                <p className="text-sm text-gray-500 mt-1">Adicione seu primeiro registro para visualizar o gráfico.</p>
              </div>
            )}
          </form>

          {/* Formulário de Gordura */}
          <form
            onSubmit={handleSubmitGordura}
            className="bg-slate-800 p-5 rounded-xl shadow-lg space-y-4 animate-fadeIn"
            style={{ animationDelay: '200ms' }}
          >
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Percent size={18} className="text-blue-400 mr-2" />
              Percentual de Gordura
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="gorduraInput"
                  className="block text-sm font-medium text-gray-300"
                >
                  Gordura (%):
                </label>
                <input
                  id="gorduraInput"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 15.3"
                  value={gordura}
                  onChange={(e) => setGordura(e.target.value)}
                  className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="dataGorduraInput"
                  className="block text-sm font-medium text-gray-300"
                >
                  Data do Registro:
                </label>
                <input
                  id="dataGorduraInput"
                  type="date"
                  value={dataGordura}
                  onChange={(e) => setDataGordura(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus size={18} className="mr-1.5" /> Registrar Gordura
            </button>
            
            {gorduras.length > 0 ? (
              <>
                <div className="mt-4 bg-slate-700/30 p-3 rounded-lg h-60">
                  <Line 
                    data={gerarGrafico(gorduras, "Gordura (%)", "#F59E0B")} 
                    options={chartOptions}
                  />
                </div>
                <p className="text-sm text-gray-400 flex items-center">
                  <Calendar size={14} className="mr-1.5" />
                  Última medição:{" "}
                  {(() => {
                    const ultimoRegGordura = gorduras.at(-1);
                    if (!ultimoRegGordura?.data) return "—";
                    const [ano, mes, dia] = ultimoRegGordura.data.split("-");
                    return `${dia}/${mes}/${ano} (${ultimoRegGordura.valor}%)`;
                  })()}
                </p>
              </>
            ) : (
              <div className="mt-4 bg-slate-700/30 p-6 rounded-lg flex flex-col items-center justify-center text-center">
                <BarChart2 size={32} className="text-gray-500 mb-2" />
                <p className="text-gray-400">Nenhum registro de gordura encontrado.</p>
                <p className="text-sm text-gray-500 mt-1">Adicione seu primeiro registro para visualizar o gráfico.</p>
              </div>
            )}
          </form>

          {/* Medidas Corporais */}
          <div 
            className="bg-slate-800 p-5 rounded-xl shadow-lg space-y-4 animate-fadeIn"
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Ruler size={18} className="text-blue-400 mr-2" />
                Medidas Corporais
              </h2>
              <button
                onClick={() => {
                  setParteSelecionada("");
                  setValor("");
                  setData(hojeFormatada());
                  setModalAberto(true);
                }}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors"
              >
                <Plus size={16} className="mr-1.5" /> Adicionar Medida
              </button>
            </div>
            
            <div className="space-y-2">
              {partesCorpo.map((parte, index) => {
                const historicoParte = medicoes.filter((m) => m.parte === parte);
                const ultimaMedida =
                  historicoParte.length > 0
                    ? historicoParte.sort(
                        (a, b) => new Date(b.data) - new Date(a.data)
                      )[0]
                    : null;
                return (
                  <div
                    key={parte}
                    className="bg-slate-700/50 p-3 rounded-lg flex justify-between items-center animate-fadeIn"
                    style={{ animationDelay: `${index * 50 + 300}ms` }}
                  >
                    <span className="text-gray-300 flex items-center">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full mr-2"></div>
                      {parte}:
                    </span>
                    <div className="flex items-center">
                      <span className="text-white font-medium mr-3">
                        {ultimaMedida
                          ? `${ultimaMedida.valor}${
                              parte === "RC/Q" ? "" : " cm"
                            } (${new Date(
                              ultimaMedida.data + "T00:00:00"
                            ).toLocaleDateString("pt-BR")})`
                          : "N/A"}
                      </span>
                      {historicoParte.length > 0 && (
                        <button
                          onClick={() => abrirModalGrafico(parte)}
                          className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1 rounded-lg transition-colors"
                        >
                          Ver Histórico
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal para adicionar medida */}
          {modalAberto && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-md border border-slate-700 animate-fadeIn">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <Ruler size={20} className="text-blue-400 mr-2" />
                  Adicionar Medida Corporal
                </h3>
                <form onSubmit={handleSubmitMedida} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="parteCorpoSelect"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Parte do Corpo:
                    </label>
                    <div className="relative">
                      <select
                        id="parteCorpoSelect"
                        value={parteSelecionada}
                        onChange={(e) => setParteSelecionada(e.target.value)}
                        className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione...</option>
                        {partesCorpo
                          .filter((p) => p !== "RC/Q")
                          .map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="valorMedidaInput"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Valor ({parteSelecionada === "RC/Q" ? "" : "cm"}):
                    </label>
                    <input
                      id="valorMedidaInput"
                      type="number"
                      step="0.1"
                      placeholder={
                        parteSelecionada === "RC/Q"
                          ? "Calculado automaticamente"
                          : "Ex: 35.5"
                      }
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={parteSelecionada === "RC/Q"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="dataMedidaInput"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Data da Medição:
                    </label>
                    <input
                      id="dataMedidaInput"
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="w-full p-2.5 bg-slate-700 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalAberto(false)}
                      className="px-4 py-2 text-sm text-gray-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Salvar Medida
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal para gráfico de medidas corporais */}
          {modalGraficoAberto && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 p-6 rounded-xl shadow-xl w-full max-w-lg border border-slate-700 animate-fadeIn">
                <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <BarChart2 size={20} className="text-blue-400 mr-2" />
                  Histórico de {parteSelecionada}
                </h3>
                <div className="bg-slate-700/30 p-3 rounded-lg" style={{ height: "300px" }}>
                  <Line
                    data={gerarGrafico(
                      medicoes
                        .filter((m) => m.parte === parteSelecionada)
                        .sort((a, b) => new Date(a.data) - new Date(b.data)),
                      `${parteSelecionada} (${
                        parteSelecionada === "RC/Q" ? "" : "cm"
                      })`,
                      "#3B82F6"
                    )}
                    options={chartOptions}
                  />
                </div>
                <div className="text-right mt-4">
                  <button
                    onClick={() => setModalGraficoAberto(false)}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CSS para animações */}
        <style jsx global>{`
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </PageWrapper>
  );
};

export default Medicoes;
