import { Star, Dumbbell, Lock, RefreshCw, BarChart3, Droplet, TrendingUp, Activity, Info, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserData, saveUserData } from "../utils/storage";

const CHAVE_REGISTRO_EM_ANDAMENTO = "gymtracker_registro_em_andamento";
// Usaremos uma chave base e a função getUserData/saveUserData cuidará de adicionar o UID.
const CHAVE_BASE_CONSUMO_AGUA = "gymtracker_consumo_agua"; 

const calcularIMC = (peso, alturaCm) => {
  if (!peso || !alturaCm || alturaCm === 0 || isNaN(Number(peso)) || isNaN(Number(alturaCm))) return null;
  const alturaM = Number(alturaCm) / 100;
  return (Number(peso) / (alturaM * alturaM)).toFixed(1);
};

const getDiaSemana = (dataString) => {
  if (!dataString) return "";
  const partes = dataString.split("/");
  if (partes.length !== 3) return "";
  const data = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
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
  if (idade === null || pesoKg === null || isNaN(Number(pesoKg)) || Number(pesoKg) <= 0) return 2000; 

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

  const [resumoMedicoes, setResumoMedicoes] = useState({ peso: null, gordura: null, imc: null, idade: null });
  const [ultimoTreino, setUltimoTreino] = useState(null);

  const [consumoAguaHoje, setConsumoAguaHoje] = useState(0);
  const [metaAgua, setMetaAgua] = useState(2000); 
  const [ultimoRegistroAgua, setUltimoRegistroAgua] = useState(null);
  const [mostrarModalAgua, setMostrarModalAgua] = useState(false);
  const [quantidadeAguaModal, setQuantidadeAguaModal] = useState(250);
  const [tipoEntradaAgua, setTipoEntradaAgua] = useState("ml");

  const carregarDadosApp = useCallback(() => {
    if (user && user.uid) {
      const hojeISO = new Date().toISOString().split("T")[0];

      // Registro em andamento
      const registroSalvoAndamento = getUserData(CHAVE_REGISTRO_EM_ANDAMENTO, user.uid);
      if (registroSalvoAndamento && typeof registroSalvoAndamento === 'object' && !Array.isArray(registroSalvoAndamento)) {
          setTemRegistroEmAndamento((registroSalvoAndamento.tituloTreino && registroSalvoAndamento.tituloTreino.trim() !== "") || (registroSalvoAndamento.exerciciosSelecionados && registroSalvoAndamento.exerciciosSelecionados.length > 0));
      } else {
        setTemRegistroEmAndamento(false);
        if(registroSalvoAndamento) saveUserData(CHAVE_REGISTRO_EM_ANDAMENTO, user.uid, null); // Limpa se for formato inválido
      }

      // Medições
      const dataNascimentoSalva = getUserData("medicoes_dataNascimento", user.uid);
      const idadeAtual = calcularIdadeAtual(dataNascimentoSalva);
      const pesosData = getUserData("medicoes_pesos_historico", user.uid) || [];
      const ultimoPeso = pesosData.length > 0 ? pesosData[pesosData.length - 1].valor : null;
      const gordurasData = getUserData("medicoes_gorduras_historico", user.uid) || [];
      const ultimaGordura = gordurasData.length > 0 ? gordurasData[gordurasData.length - 1].valor : null;
      const alturaSalva = getUserData("medicoes_altura", user.uid);
      const imcCalc = calcularIMC(ultimoPeso, alturaSalva);
      setResumoMedicoes({ peso: ultimoPeso, gordura: ultimaGordura, imc: imcCalc, idade: idadeAtual });
      
      // Histórico de Treinos
      const historicoTreinos = getUserData("gymtracker_cargas", user.uid) || [];
      if (historicoTreinos.length > 0) {
        const treinosOrdenados = [...historicoTreinos].sort((a, b) => {
          const dataA = new Date(a.data.split("/").reverse().join("-"));
          const dataB = new Date(b.data.split("/").reverse().join("-"));
          if (dataB.getTime() !== dataA.getTime()) return dataB.getTime() - dataA.getTime();
          return (b.id || 0) - (a.id || 0);
        });
        const ultimoReg = treinosOrdenados[0];
        const treinosDoUltimoDia = treinosOrdenados.filter(t => t.data === ultimoReg.data && t.tituloTreino === ultimoReg.tituloTreino);
        setUltimoTreino({ titulo: ultimoReg.tituloTreino, data: ultimoReg.data, exercicios: treinosDoUltimoDia.map(t => ({ nome: t.exercicio, series: t.series.length })) });
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

      if (dadosAguaStorage && typeof dadosAguaStorage === 'object' && dadosAguaStorage.data) { 
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
              ultimoRegistroHora: newUltimoRegistro
            });
          }
        } else {
          precisaSalvarStorageInicial = true;
        }
      } else {
        precisaSalvarStorageInicial = true;
        if (dadosAguaStorage) { // Se existia mas era formato inválido (ex: []), limpa.
            saveUserData(CHAVE_BASE_CONSUMO_AGUA, user.uid, null);
        }
      }

      if (precisaSalvarStorageInicial) {
        saveUserData(CHAVE_BASE_CONSUMO_AGUA, user.uid, {
          data: hojeISO,
          consumo: 0,
          meta: metaIdealCalculada,
          ultimoRegistroHora: null
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
      alert("Erro: Usuário não identificado. Não é possível registrar o consumo de água.");
      return;
    }

    const hojeISO = new Date().toISOString().split("T")[0];
    const agora = new Date();
    const horaFormatada = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    let quantidadeMl = tipoEntradaAgua === "copos" ? quantidadeAguaModal * 250 : parseInt(quantidadeAguaModal, 10);
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

  const dataAtualFormatada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const diaSemanaAtual = new Date().toLocaleDateString("pt-BR", { weekday: "long" });
  const progressoAguaPercentual = metaAgua > 0 ? (consumoAguaHoje / metaAgua) * 100 : 0;

  return (
    <PageWrapper>
      <div className="p-1 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto space-y-6 pb-24">
        <div className="text-center ">
          <h1 className="text-2xl font-bold text-gray-800">Gym Tracker</h1>
        </div>
        
        <button onClick={() => navigate("/registrar")} className="w-full text-left bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105">
          <div className="flex justify-between items-center"><h2 className="text-lg font-semibold">REGISTRAR TREINO HOJE</h2><Dumbbell size={24} /></div>
          <p className="text-sm mt-1">{dataAtualFormatada} ({diaSemanaAtual})</p>
        </button>

        {temRegistroEmAndamento && (
          <button onClick={() => navigate("/registrar")} className="w-full text-left bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl shadow-md flex items-center transition-all duration-200 ease-in-out transform hover:scale-105">
            <RefreshCw size={20} className="mr-3" />
            <div><h2 className="text-md font-medium">CONTINUAR REGISTRO PENDENTE</h2><p className="text-xs mt-1">Você tem um treino não finalizado.</p></div>
          </button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate("/medicoes")}>
            <div className="flex justify-between items-center mb-2"><h3 className="text-md font-semibold text-gray-700">Minhas Medições</h3><BarChart3 size={20} className="text-indigo-500"/></div>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">Idade: <span className="font-medium">{resumoMedicoes.idade !== null ? `${resumoMedicoes.idade} anos` : <label className="text-xs text-orange-600 mt-1">Registre a idade</label>}</span></p>
              <p className="text-gray-600">Peso: <span className="font-medium">{resumoMedicoes.peso ? `${resumoMedicoes.peso} kg` : <label className="text-xs text-orange-600 mt-1">Registre o peso</label>}</span></p>
              <p className="text-gray-600">Gordura: <span className="font-medium">{resumoMedicoes.gordura ? `${resumoMedicoes.gordura}%` : <label className="text-xs text-orange-600 mt-1">Registre a gordura(%)</label>}</span></p>
              <p className="text-gray-600">IMC: <span className="font-medium">{resumoMedicoes.imc || <label className="text-xs text-orange-600 mt-1">Registre a idade e o peso</label>}</span></p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => navigate("/historico")}>
            <div className="flex justify-between items-center mb-2"><h3 className="text-md font-semibold text-gray-700">Último Treino</h3><Activity size={20} className="text-green-500"/></div>
            {ultimoTreino ? (
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">Título: <span className="font-medium truncate" title={ultimoTreino.titulo}>{ultimoTreino.titulo}</span></p>
                <p className="text-gray-600">Data: <span className="font-medium">{ultimoTreino.data} ({getDiaSemana(ultimoTreino.data)})</span></p>
                <p className="text-gray-600">Exercícios: <span className="font-medium">{ultimoTreino.exercicios.length}</span></p>
              </div>
            ) : <p className="text-sm text-gray-500">Nenhum treino registrado.</p>}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center"><Droplet size={22} className="text-blue-500 mr-2"/><h3 className="text-md font-semibold text-gray-700">Consumo de Água</h3></div>
                <div className="text-xs text-gray-600 flex items-center" title="Meta calculada com base na sua idade e peso. Para atualizar, registre seus dados em 'Minhas Medições'.">
                    <Info size={12} className="mr-1 text-blue-500"/> Meta Ideal
                </div>
            </div>
            <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{consumoAguaHoje}ml</span>
                    <span>Meta: {metaAgua}ml</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.min(progressoAguaPercentual, 100)}%` }}></div>
                </div>
                {ultimoRegistroAgua && <p className="text-xs text-gray-500 mt-1">Último registro às {ultimoRegistroAgua}</p>}
                {(resumoMedicoes.idade === null || resumoMedicoes.peso === null) && 
                    <p className="text-xs text-orange-600 mt-1">Registre sua idade e peso em "Minhas Medições" para uma meta de água personalizada.</p>}
            </div>
            <button onClick={() => setMostrarModalAgua(true)} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors">
                <TrendingUp size={18} className="mr-2"/> Registrar Água
            </button>
        </div>
        
        {mostrarModalAgua && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-xl w-full max-w-xs sm:max-w-sm">
                    <h4 className="text-lg font-semibold mb-5 text-center text-gray-800">Adicionar Água</h4>
                    <div className="mb-5 flex justify-center">
                        <button onClick={() => {setTipoEntradaAgua("ml"); setQuantidadeAguaModal(250);}} className={`px-4 py-2 text-sm rounded-l-md ${tipoEntradaAgua === "ml" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-200 hover:bg-gray-300"} transition-all`}>ml</button>
                        <button onClick={() => {setTipoEntradaAgua("copos"); setQuantidadeAguaModal(1);}} className={`px-4 py-2 text-sm rounded-r-md ${tipoEntradaAgua === "copos" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-200 hover:bg-gray-300"} transition-all`}>Copos (250ml)</button>
                    </div>
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">
                            Quantidade ({tipoEntradaAgua === "ml" ? "mililitros" : tipoEntradaAgua === "copos" ? "copos" : "" }):
                        </label>
                        <input type="number" value={quantidadeAguaModal} onChange={(e) => setQuantidadeAguaModal(Math.max(0, parseInt(e.target.value,10) || (tipoEntradaAgua === "copos" ? 1 : 0) ))} className="w-full p-2.5 border border-gray-300 rounded-md text-center text-xl focus:ring-blue-500 focus:border-blue-500" placeholder={tipoEntradaAgua === "ml" ? "Ex: 500" : "Ex: 2"}/>
                    </div>
                    <div className="flex justify-between gap-3 mt-6">
                        <button onClick={() => setMostrarModalAgua(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full">Cancelar</button>
                        <button onClick={handleRegistrarAgua} className="px-5 py-2.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors w-full">Registrar</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default App;

