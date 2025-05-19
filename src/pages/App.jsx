import {
  Star,
  Dumbbell,
  Lock,
  RefreshCw,
  BarChart3,
  Droplet,
  TrendingUp,
  Activity,
  Info,
  ArrowRight,
  Zap,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage";

const CHAVE_REGISTRO_EM_ANDAMENTO = "gymtracker_registro_em_andamento";
// Usaremos uma chave base e a função getUserData/saveUserData cuidará de adicionar o UID.
const CHAVE_BASE_CONSUMO_AGUA = "gymtracker_consumo_agua";

const calcularIMC = (peso, alturaCm) => {
  if (
    !peso ||
    !alturaCm ||
    alturaCm === 0 ||
    isNaN(Number(peso)) ||
    isNaN(Number(alturaCm))
  )
    return null;
  const alturaM = Number(alturaCm) / 100;
  return (Number(peso) / (alturaM * alturaM)).toFixed(1);
};

const getDiaSemana = (dataString) => {
  if (!dataString) return "";
  const partes = dataString.split("/");
  if (partes.length !== 3) return "";
  const data = new Date(
    Number(partes[2]),
    Number(partes[1]) - 1,
    Number(partes[0])
  );
  if (isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", { weekday: "long" });
};

const calcularIdadeAtual = (dataNascimento) => {
  if (!dataNascimento || typeof dataNascimento !== "string") return null;
  const nascDate = new Date(dataNascimento.trim());
  if (isNaN(nascDate.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascDate.getFullYear();
  const m = hoje.getMonth() - nascDate.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascDate.getDate())) {
    idade--;
  }
  return idade < 0 ? null : idade;
};

const calcularMetaAguaIdeal = (idade, pesoKg) => {
  if (
    idade === null ||
    pesoKg === null ||
    isNaN(Number(pesoKg)) ||
    Number(pesoKg) <= 0
  )
    return 2000;

  const peso = Number(pesoKg);
  let multiplicador;

  if (idade <= 17) {
    multiplicador = 40;
  } else if (idade >= 18 && idade <= 55) {
    multiplicador = 35;
  } else if (idade > 55 && idade <= 65) {
    multiplicador = 30;
  } else {
    multiplicador = 25;
  }
  return Math.round(peso * multiplicador);
};

// --- Componente Principal ---
const App = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [temRegistroEmAndamento, setTemRegistroEmAndamento] = useState(false);

  const [resumoMedicoes, setResumoMedicoes] = useState({
    peso: null,
    gordura: null,
    imc: null,
    idade: null,
  });
  const [ultimoTreino, setUltimoTreino] = useState(null);

  const [consumoAguaHoje, setConsumoAguaHoje] = useState(0);
  const [metaAgua, setMetaAgua] = useState(2000);
  const [ultimoRegistroAgua, setUltimoRegistroAgua] = useState(null);
  const [mostrarModalAgua, setMostrarModalAgua] = useState(false);
  const [quantidadeAguaModal, setQuantidadeAguaModal] = useState(250);
  const [tipoEntradaAgua, setTipoEntradaAgua] = useState("ml");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Ativa a animação de entrada após um pequeno atraso para o efeito ser visível
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const carregarDadosApp = useCallback(() => {
    if (user && user.uid) {
      const hojeISO = new Date().toISOString().split("T")[0];

      // Registro em andamento
      const registroSalvoAndamento = getUserData(
        CHAVE_REGISTRO_EM_ANDAMENTO,
        user.uid
      );
      if (
        registroSalvoAndamento &&
        typeof registroSalvoAndamento === "object" &&
        !Array.isArray(registroSalvoAndamento)
      ) {
        setTemRegistroEmAndamento(
          (registroSalvoAndamento.tituloTreino &&
            registroSalvoAndamento.tituloTreino.trim() !== "") ||
            (registroSalvoAndamento.exerciciosSelecionados &&
              registroSalvoAndamento.exerciciosSelecionados.length > 0)
        );
      } else {
        setTemRegistroEmAndamento(false);
        if (registroSalvoAndamento)
          saveUserData(CHAVE_REGISTRO_EM_ANDAMENTO, user.uid, null); // Limpa se for formato inválido
      }

      // Medições
      const dataNascimentoSalva = getUserData(
        "medicoes_dataNascimento",
        user.uid
      );
      const idadeAtual = calcularIdadeAtual(dataNascimentoSalva);
      const pesosData = getUserData("medicoes_pesos_historico", user.uid) || [];
      const ultimoPeso =
        pesosData.length > 0 ? pesosData[pesosData.length - 1].valor : null;
      const gordurasData =
        getUserData("medicoes_gorduras_historico", user.uid) || [];
      const ultimaGordura =
        gordurasData.length > 0
          ? gordurasData[gordurasData.length - 1].valor
          : null;
      const alturaSalva = getUserData("medicoes_altura", user.uid);
      const imcCalc = calcularIMC(ultimoPeso, alturaSalva);
      setResumoMedicoes({
        peso: ultimoPeso,
        gordura: ultimaGordura,
        imc: imcCalc,
        idade: idadeAtual,
      });

      // Histórico de Treinos
      const historicoTreinos = getUserData("gymtracker_cargas", user.uid) || [];
      if (historicoTreinos.length > 0) {
        const treinosOrdenados = [...historicoTreinos].sort((a, b) => {
          const dataA = new Date(a.data.split("/").reverse().join("-"));
          const dataB = new Date(b.data.split("/").reverse().join("-"));
          if (dataB.getTime() !== dataA.getTime())
            return dataB.getTime() - dataA.getTime();
          return (b.id || 0) - (a.id || 0);
        });
        const ultimoReg = treinosOrdenados[0];
        const treinosDoUltimoDia = treinosOrdenados.filter(
          (t) =>
            t.data === ultimoReg.data &&
            t.tituloTreino === ultimoReg.tituloTreino
        );
        setUltimoTreino({
          titulo: ultimoReg.tituloTreino,
          data: ultimoReg.data,
          exercicios: treinosDoUltimoDia.map((t) => ({
            nome: t.exercicio,
            series: t.series.length,
          })),
        });
      } else {
        setUltimoTreino(null);
      }

      // Medidor de Água - Usando getUserData e saveUserData corrigidos
      const metaIdealCalculada = calcularMetaAguaIdeal(idadeAtual, ultimoPeso);
      const dadosAguaStorage = getUserData(CHAVE_BASE_CONSUMO_AGUA, user.uid);

      let newConsumo = 0;
      let newUltimoRegistro = null;
      let newMeta = metaIdealCalculada;
      let precisaSalvarStorageInicial = false;

      if (
        dadosAguaStorage &&
        typeof dadosAguaStorage === "object" &&
        dadosAguaStorage.data
      ) {
        if (dadosAguaStorage.data === hojeISO) {
          newConsumo = Number(dadosAguaStorage.consumo) || 0;
          newUltimoRegistro = dadosAguaStorage.ultimoRegistroHora || null;
          newMeta = Number(dadosAguaStorage.meta) || metaIdealCalculada;

          if (newMeta !== metaIdealCalculada) {
            newMeta = metaIdealCalculada;
            saveUserData(CHAVE_BASE_CONSUMO_AGUA, user.uid, {
              data: hojeISO,
              consumo: newConsumo,
              meta: newMeta,
              ultimoRegistroHora: newUltimoRegistro,
            });
          }
        } else {
          precisaSalvarStorageInicial = true;
        }
      } else {
        precisaSalvarStorageInicial = true;
        if (dadosAguaStorage) {
          // Se existia mas era formato inválido (ex: []), limpa.
          saveUserData(CHAVE_BASE_CONSUMO_AGUA, user.uid, null);
        }
      }

      if (precisaSalvarStorageInicial) {
        saveUserData(CHAVE_BASE_CONSUMO_AGUA, user.uid, {
          data: hojeISO,
          consumo: 0,
          meta: metaIdealCalculada,
          ultimoRegistroHora: null,
        });
      }

      setConsumoAguaHoje(newConsumo);
      setUltimoRegistroAgua(newUltimoRegistro);
      setMetaAgua(newMeta);
    } else {
      setConsumoAguaHoje(0);
      setUltimoRegistroAgua(null);
      setMetaAgua(2000);
      setTemRegistroEmAndamento(false);
      setResumoMedicoes({ peso: null, gordura: null, imc: null, idade: null });
      setUltimoTreino(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.uid) {
      carregarDadosApp();
    } else {
      setConsumoAguaHoje(0);
      setUltimoRegistroAgua(null);
      setMetaAgua(2000);
      setTemRegistroEmAndamento(false);
      setResumoMedicoes({ peso: null, gordura: null, imc: null, idade: null });
      setUltimoTreino(null);
    }
  }, [user, carregarDadosApp]);

  const handleRegistrarAgua = () => {
    if (!user || !user.uid) {
      alert(
        "Erro: Usuário não identificado. Não é possível registrar o consumo de água."
      );
      return;
    }

    const hojeISO = new Date().toISOString().split("T")[0];
    const agora = new Date();
    const horaFormatada = `${String(agora.getHours()).padStart(
      2,
      "0"
    )}:${String(agora.getMinutes()).padStart(2, "0")}`;

    let quantidadeMl =
      tipoEntradaAgua === "copos"
        ? quantidadeAguaModal * 250
        : parseInt(quantidadeAguaModal, 10);
    if (isNaN(quantidadeMl) || quantidadeMl <= 0) {
      alert("Por favor, insira uma quantidade válida.");
      return;
    }

    const novoConsumo = consumoAguaHoje + quantidadeMl;

    setConsumoAguaHoje(novoConsumo);
    setUltimoRegistroAgua(horaFormatada);

    const dadosParaSalvar = {
      data: hojeISO,
      consumo: novoConsumo,
      meta: metaAgua,
      ultimoRegistroHora: horaFormatada,
    };
    saveUserData(CHAVE_BASE_CONSUMO_AGUA, user.uid, dadosParaSalvar);

    setMostrarModalAgua(false);
    setQuantidadeAguaModal(tipoEntradaAgua === "copos" ? 1 : 250);
  };

  const dataAtualFormatada = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const diaSemanaAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
  });
  const progressoAguaPercentual =
    metaAgua > 0 ? (consumoAguaHoje / metaAgua) * 100 : 0;

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-800 text-white">
        {/* Elementos decorativos de fundo */}
        <div className="fixed top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="fixed top-1/2 right-1/4 w-32 h-32 bg-teal-400 rounded-full mix-blend-screen filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
        <div className="fixed bottom-1/4 left-1/3 w-32 h-32 bg-indigo-500 rounded-full mix-blend-screen filter blur-xl opacity-10 animate-blob"></div>

        <div
          className={`p-4 sm:p-6 md:p-8 max-w-screen-md mx-auto space-y-6 pb-24 transform transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Cabeçalho com logo */}
          <div className="text-center mb-6 mt-4">
            <div className="flex justify-center items-center">
              <Zap className="text-blue-400 animate-pulse w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="ml-2 text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-green-400">
                GymTracker
              </h1>
            </div>
            <p className="text-gray-300 text-sm mt-1">
              Monitore seu progresso, supere seus limites
            </p>
          </div>

          {/* Botão principal de registro */}
          <button
            onClick={() => navigate("/registrar")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-blue-900/20 hover:shadow-xl"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">REGISTRAR TREINO HOJE</h2>
              <div className="bg-white/20 p-2 rounded-xl">
                <Dumbbell size={24} className="text-white" />
              </div>
            </div>
            <p className="text-sm mt-1 text-blue-100">
              {dataAtualFormatada} ({diaSemanaAtual})
            </p>
          </button>

          {/* Botão de continuar registro (condicional) */}
          {temRegistroEmAndamento && (
            <button
              onClick={() => navigate("/registrar")}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-3 rounded-xl shadow-md flex items-center transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-green-900/20 hover:shadow-lg"
            >
              <div className="bg-white/20 p-1.5 rounded-lg mr-3">
                <RefreshCw size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-md font-medium">
                  CONTINUAR REGISTRO PENDENTE
                </h2>
                <p className="text-xs mt-0.5 text-green-100">
                  Você tem um treino não finalizado
                </p>
              </div>
            </button>
          )}

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card de Medições */}
            <div
              onClick={() => navigate("/medicoes")}
              className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-blue-900/20 border border-slate-700/50"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-semibold text-white flex items-center">
                  <BarChart3 size={18} className="text-indigo-400 mr-2" />
                  Minhas Medições
                </h3>
                <div className="bg-indigo-500/20 p-1 rounded-lg">
                  <ArrowRight size={16} className="text-indigo-400" />
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center">
                  <div className="w-24 text-gray-400 text-sm">Idade:</div>
                  <div className="font-medium">
                    {resumoMedicoes.idade !== null ? (
                      `${resumoMedicoes.idade} anos`
                    ) : (
                      <span className="text-xs py-0.5 px-2 bg-orange-500/20 text-orange-300 rounded-full">
                        Registre a idade
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-gray-400 text-sm">Peso:</div>
                  <div className="font-medium">
                    {resumoMedicoes.peso ? (
                      `${resumoMedicoes.peso} kg`
                    ) : (
                      <span className="text-xs py-0.5 px-2 bg-orange-500/20 text-orange-300 rounded-full">
                        Registre o peso
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-gray-400 text-sm">Gordura:</div>
                  <div className="font-medium">
                    {resumoMedicoes.gordura ? (
                      `${resumoMedicoes.gordura}%`
                    ) : (
                      <span className="text-xs py-0.5 px-2 bg-orange-500/20 text-orange-300 rounded-full">
                        Registre a gordura
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-gray-400 text-sm">IMC:</div>
                  <div className="font-medium">
                    {resumoMedicoes.imc ? (
                      resumoMedicoes.imc
                    ) : (
                      <span className="text-xs py-0.5 px-2 bg-orange-500/20 text-orange-300 rounded-full">
                        Registre altura e peso
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Último Treino */}
            <div
              onClick={() => navigate("/historico")}
              className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-green-900/20 border border-slate-700/50"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-semibold text-white flex items-center">
                  <Activity size={18} className="text-green-400 mr-2" />
                  Último Treino
                </h3>
                <div className="bg-green-500/20 p-1 rounded-lg">
                  <ArrowRight size={16} className="text-green-400" />
                </div>
              </div>
              {ultimoTreino ? (
                <div className="space-y-2.5">
                  <div className="flex items-center">
                    <div className="w-24 text-gray-400 text-sm">Título:</div>
                    <div
                      className="font-medium truncate"
                      title={ultimoTreino.titulo}
                    >
                      {ultimoTreino.titulo}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-gray-400 text-sm">Data:</div>
                    <div className="font-medium">
                      {ultimoTreino.data}{" "}
                      <span className="text-gray-400 text-xs">
                        ({getDiaSemana(ultimoTreino.data)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 text-gray-400 text-sm">
                      Exercícios:
                    </div>
                    <div className="font-medium flex items-center">
                      <span className="bg-green-500/20 text-green-300 py-0.5 px-2 rounded-full text-sm mr-2">
                        {ultimoTreino.exercicios.length}
                      </span>
                      <Award size={14} className="text-green-400" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 text-gray-400">
                  <p className="text-center">Nenhum treino registrado ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Card de Consumo de Água */}
          <div className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-slate-700/50 mt-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <Droplet size={20} className="text-blue-400 mr-2" />
                <h3 className="text-md font-semibold text-white">
                  Consumo de Água
                </h3>
              </div>
              <div
                className="text-xs text-gray-300 flex items-center bg-blue-500/10 py-1 px-2 rounded-full"
                title="Meta calculada com base na sua idade e peso"
              >
                <Info size={12} className="mr-1 text-blue-400" /> Meta Ideal
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <div className="flex items-center">
                  <span className="text-xl font-semibold text-white">
                    {consumoAguaHoje}
                  </span>
                  <span className="ml-1">ml</span>
                </div>
                <div className="flex items-center">
                  <span>Meta: </span>
                  <span className="ml-1 font-medium text-white">
                    {metaAgua} ml
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(progressoAguaPercentual, 100)}%`,
                  }}
                ></div>
              </div>

              {ultimoRegistroAgua && (
                <p className="text-xs text-gray-400 mt-1.5 flex items-center">
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1.5"></span>
                  Último registro às {ultimoRegistroAgua}
                </p>
              )}

              {(resumoMedicoes.idade === null ||
                resumoMedicoes.peso === null) && (
                <p className="text-xs text-orange-300 mt-1.5 flex items-center">
                  <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1.5"></span>
                  Registre sua idade e peso para uma meta personalizada
                </p>
              )}
            </div>

            {/* Botão de registro */}
            <button
              onClick={() => setMostrarModalAgua(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-blue-900/20 hover:shadow-lg"
            >
              <Droplet size={18} className="mr-2" />
              Registrar Água
            </button>
          </div>
        </div>

        {/* Modal de Registro de Água */}
        {mostrarModalAgua && (
          <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div
              className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-semibold mb-5 text-center text-white flex items-center justify-center">
                <Droplet size={20} className="text-blue-400 mr-2" />
                Adicionar Água
              </h4>

              <div className="mb-6 flex justify-center">
                <button
                  onClick={() => {
                    setTipoEntradaAgua("ml");
                    setQuantidadeAguaModal(250);
                  }}
                  className={`px-5 py-2.5 text-sm rounded-l-xl transition-all duration-200 ${
                    tipoEntradaAgua === "ml"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  ml
                </button>
                <button
                  onClick={() => {
                    setTipoEntradaAgua("copos");
                    setQuantidadeAguaModal(1);
                  }}
                  className={`px-5 py-2.5 text-sm rounded-r-xl transition-all duration-200 ${
                    tipoEntradaAgua === "copos"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                  }`}
                >
                  Copos (250ml)
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
                  Quantidade (
                  {tipoEntradaAgua === "ml"
                    ? "mililitros"
                    : tipoEntradaAgua === "copos"
                    ? "copos"
                    : ""}
                  ):
                </label>
                <input
                  type="number"
                  value={quantidadeAguaModal}
                  onChange={(e) =>
                    setQuantidadeAguaModal(
                      Math.max(
                        0,
                        parseInt(e.target.value, 10) ||
                          (tipoEntradaAgua === "copos" ? 1 : 0)
                      )
                    )
                  }
                  className="w-full p-3 border border-slate-600 bg-slate-700 rounded-xl text-center text-xl focus:ring-blue-500 focus:border-blue-500 text-white"
                  placeholder={tipoEntradaAgua === "ml" ? "Ex: 500" : "Ex: 2"}
                />
              </div>

              <div className="flex justify-between gap-3 mt-6">
                <button
                  onClick={() => setMostrarModalAgua(false)}
                  className="px-5 py-3 text-sm font-medium text-gray-300 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all duration-200 w-full"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegistrarAgua}
                  className="px-5 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all duration-200 w-full"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default App;
