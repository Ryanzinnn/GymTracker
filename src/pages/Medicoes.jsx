import { useState, useEffect } from "react";
import { Pencil, Trash2, Ruler, Plus } from "lucide-react";
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
import { useAuth } from "../context/AuthContext"; // Ajuste o caminho se necessário
import { getUserData, saveUserData } from "../utils/storage"; // Ajuste o caminho se necessário

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
  if (!nascimento || typeof nascimento !== 'string' || nascimento.trim() === '') return null;
  const nascDate = new Date(nascimento.trim());
  if (isNaN(nascDate.getTime())) { // Verifica se a data é válida
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
  return ""; // Caso não se encaixe em nenhuma faixa (improvável com as checagens anteriores)
};

const Medicoes = () => {
  const { user } = useAuth();

  const [dataNascimento, setDataNascimento] = useState("");
  const [mostraInputNascimento, setMostraInputNascimento] = useState(true);
  const [idade, setIdade] = useState(null);

  const [altura, setAltura] = useState(""); // Pode ser string do input ou número do estado
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

  // Função para carregar/resetar dados do usuário
  const carregarDadosDoUsuario = () => {
    if (user) {
      const nascimentoSalvo = getUserData("medicoes_dataNascimento", user.uid);
      const idadeCalculada = calcularIdade(nascimentoSalvo);
      if (nascimentoSalvo && typeof nascimentoSalvo === 'string' && nascimentoSalvo.trim() !== '' && idadeCalculada !== null) {
        setDataNascimento(nascimentoSalvo.trim());
        setIdade(idadeCalculada);
        setMostraInputNascimento(false);
      } else {
        setDataNascimento("");
        setIdade(null);
        setMostraInputNascimento(true);
      }

      const alturaSalva = getUserData("medicoes_altura", user.uid);
      const alturaTrimmed = typeof alturaSalva === 'string' ? alturaSalva.trim() : (typeof alturaSalva === 'number' ? String(alturaSalva) : '');
      const alturaNum = alturaTrimmed !== '' ? parseInt(alturaTrimmed, 10) : NaN;
      if (alturaTrimmed !== '' && !isNaN(alturaNum)) {
        setAltura(alturaNum); // Armazena como número
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
    const alturaNumParaSalvar = alturaStrTrimmed !== "" ? Number(alturaStrTrimmed) : NaN;

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
    const novoHistoricoPesos = [...pesos, { valor: parseFloat(peso), data: dataAtualPeso }];
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
    const novoHistoricoGorduras = [...gorduras, { valor: parseFloat(gordura), data: dataAtualGordura }];
    setGorduras(novoHistoricoGorduras);
    saveUserData("medicoes_gorduras_historico", user.uid, novoHistoricoGorduras);
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
      const cinturaEntry = medicoesTemp.find(m => m.parte === "Cintura" && m.data === dataMedida);
      const quadrilEntry = medicoesTemp.find(m => m.parte === "Quadril" && m.data === dataMedida);
      if (cinturaEntry && quadrilEntry && cinturaEntry.valor > 0 && quadrilEntry.valor > 0) {
        const rcqValor = cinturaEntry.valor / quadrilEntry.valor;
        const rcqIndex = medicoesTemp.findIndex(m => m.parte === "RC/Q" && m.data === dataMedida);
        if (rcqIndex !== -1) {
          medicoesTemp[rcqIndex] = { ...medicoesTemp[rcqIndex], valor: parseFloat(rcqValor.toFixed(2)) };
        } else {
          medicoesTemp.push({ parte: "RC/Q", valor: parseFloat(rcqValor.toFixed(2)), data: dataMedida });
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
    const confirmacao = window.confirm("Tem certeza que deseja apagar todos os seus dados de medições? Esta ação não pode ser desfeita.");
    if (confirmacao) {
      saveUserData("medicoes_pesos_historico", user.uid, []);
      saveUserData("medicoes_gorduras_historico", user.uid, []);
      saveUserData("medicoes_corpo_historico", user.uid, []);

      carregarDadosDoUsuario(); 
      alert("Todos os seus dados de medições foram apagados.");
    }
  };

  const gerarGrafico = (dados, label, cor) => ({
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
      },
    ],
  });

  const abrirModalGrafico = (parte) => {
    setParteSelecionada(parte);
    setModalGraficoAberto(true);
  };

  // Renderização condicional se não houver usuário
  if (!user) {
    return (
      <div className="p-4 text-center">
        <p>Por favor, faça login para acessar e registrar suas medições.</p>
      </div>
    );
  }

  const ultimoPesoValido = pesos.length > 0 && pesos.at(-1)?.valor ? pesos.at(-1).valor : null;
  const alturaValida = altura && !isNaN(Number(altura)) ? Number(altura) : null;
  const imcCalculado = ultimoPesoValido && alturaValida ? (ultimoPesoValido / (alturaValida / 100) ** 2).toFixed(1) : "—";
  const classificacaoIMC = getClassificacaoIMC(imcCalculado);

  return (
    <div className="p-4 pb-24 max-w-screen-md mx-auto space-y-6">
      <div className="bg-blue-100 p-4 rounded-xl shadow space-y-2">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Seus dados</h2>
          <button
            onClick={handleLimparTodosOsDados}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center"
            title="Limpar todos os dados de medições"
          >
            <Trash2 size={16} className="mr-1" /> Limpar Tudo
          </button>
        </div>

        {mostraInputNascimento ? (
          <div className="space-y-1">
            <label htmlFor="dataNascimentoInput" className="block text-sm font-medium text-gray-700">Data de Nascimento:</label>
            <input
              id="dataNascimentoInput"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p>
              Idade: <strong>{idade !== null ? `${idade} anos` : "Não informada"}</strong>
            </p>
            <button
              onClick={() => setMostraInputNascimento(true)}
              className="text-sm text-blue-600 underline"
            >
              Alterar
            </button>
          </div>
        )}

        {mostraInputAltura ? (
          <div className="space-y-1 mt-2">
             <label htmlFor="alturaInput" className="block text-sm font-medium text-gray-700">Altura (cm):</label>
            <input
              id="alturaInput"
              type="number"
              value={altura} 
              onChange={(e) => setAltura(e.target.value)} 
              className="w-full p-2 border rounded"
              placeholder="Altura (cm)"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between mt-2">
            <p>
              Altura: <strong>{alturaValida ? `${(alturaValida / 100).toFixed(2)} m` : "Não informada"}</strong>
            </p>
            <button
              onClick={() => setMostraInputAltura(true)}
              className="text-sm text-blue-600 underline"
            >
              Alterar
            </button>
          </div>
        )}

        {(mostraInputNascimento || mostraInputAltura) && (
          <button
            onClick={salvarDadosUsuario}
            className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
          >
            Salvar Dados Pessoais
          </button>
        )}

        <p className="mt-2">
          Peso atual:{" "}
          <strong>
            {ultimoPesoValido ? `${ultimoPesoValido} kg` : "—"}
          </strong>
        </p>
        <p>
          IMC:{" "}
          <strong>
            {imcCalculado}
          </strong>
          {classificacaoIMC && <span className="ml-2 text-sm">({classificacaoIMC})</span>}
        </p>
      </div>

      {/* Formulário de Peso */}
      <form
        onSubmit={handleSubmitPeso}
        className="bg-white p-4 rounded-xl shadow space-y-3"
      >
        <h2 className="text-lg font-semibold">Peso Corporal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pesoInput" className="block text-sm font-medium text-gray-700">Peso (kg):</label>
            <input
              id="pesoInput"
              type="number"
              step="0.1"
              placeholder="Ex: 70.5"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label htmlFor="dataPesoInput" className="block text-sm font-medium text-gray-700">Data do Registro:</label>
            <input
              id="dataPesoInput"
              type="date"
              value={dataPeso}
              onChange={(e) => setDataPeso(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
            />
          </div>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto">
          Registrar Peso
        </button>
        {pesos.length > 0 ? (
          <>
            <div className="mt-3">
              <Line data={gerarGrafico(pesos, "Peso (kg)", "#10B981")} />
            </div>
            <p className="text-sm text-gray-500 mt-2">
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
          <p className="text-sm text-gray-600 mt-2">
            Nenhuma medição de peso registrada ainda.
          </p>
        )}
      </form>

      {/* Formulário de Gordura */}
      <form
        onSubmit={handleSubmitGordura}
        className="bg-white p-4 rounded-xl shadow space-y-3"
      >
        <h2 className="text-lg font-semibold">Gordura Corporal (%)</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="gorduraInput" className="block text-sm font-medium text-gray-700">Gordura (%):</label>
            <input
              id="gorduraInput"
              type="number"
              step="0.1"
              placeholder="Ex: 14.5"
              value={gordura}
              onChange={(e) => setGordura(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label htmlFor="dataGorduraInput" className="block text-sm font-medium text-gray-700">Data do Registro:</label>
            <input
              id="dataGorduraInput"
              type="date"
              value={dataGordura}
              onChange={(e) => setDataGordura(e.target.value)}
              required
              className="w-full p-2 border rounded mt-1"
            />
          </div>
        </div>
        <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded w-full sm:w-auto">
          Registrar Gordura
        </button>
        {gorduras.length > 0 ? (
          <>
            <div className="mt-3">
              <Line data={gerarGrafico(gorduras, "Gordura (%)", "#F59E0B")} />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Última medição:{" "}
              {(() => {
                const ultimaRegGordura = gorduras.at(-1);
                if (!ultimaRegGordura?.data) return "—";
                const [ano, mes, dia] = ultimaRegGordura.data.split("-");
                return `${dia}/${mes}/${ano} (${ultimaRegGordura.valor}%)`;
              })()}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600 mt-2">
            Nenhuma medição de gordura registrada ainda.
          </p>
        )}
      </form>

      {/* Medições Corporais */}
      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="text-lg font-semibold">Medidas Corporais</h2>
        <div className="text-center sm:text-right">
          <button
            onClick={() => setModalAberto(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 mx-auto sm:mx-0 sm:ml-auto"
          >
            <Plus size={18} /> Nova Medição Corporal
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-md font-semibold mb-2">Histórico de Medidas</h3>
          {partesCorpo.map((parte, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b py-2 last:border-b-0"
            >
              <p className="flex items-center gap-2 text-sm">
                <Ruler size={16} className="text-gray-600" /> {parte}
              </p>
              <button
                onClick={() => abrirModalGrafico(parte)}
                className="text-blue-600 text-sm underline hover:text-blue-800"
              >
                Ver Progresso
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para nova medição corporal*/}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Registrar Medida Corporal
            </h3>
            <form onSubmit={handleSubmitMedida} className="space-y-4">
              <div>
                <label htmlFor="parteCorpoSelect" className="block text-sm font-medium text-gray-700 mb-1">Parte do Corpo:</label>
                <select
                  id="parteCorpoSelect"
                  value={parteSelecionada}
                  onChange={(e) => setParteSelecionada(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  {partesCorpo
                    .filter((p) => p !== "RC/Q")
                    .map((p, i) => (
                      <option key={i} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="valorMedidaInput" className="block text-sm font-medium text-gray-700 mb-1">Valor (cm):</label>
                <input
                  id="valorMedidaInput"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 35.5"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="dataMedidaInput" className="block text-sm font-medium text-gray-700 mb-1">Data da Medição:</label>
                <input
                  id="dataMedidaInput"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Registrar Medida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal do gráfico de evolução */}
      {modalGraficoAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Progresso: {parteSelecionada}
              </h3>
              <button
                onClick={() => setModalGraficoAberto(false)}
                className="text-red-500 hover:text-red-700 text-2xl"
              >
                &times;
              </button>
            </div>
            {(() => {
              const dadosParte = medicoes.filter(
                (m) => m.parte === parteSelecionada
              );
              return dadosParte.length > 0 ? (
                <Line
                  data={gerarGrafico(
                    dadosParte,
                    `${parteSelecionada} (${parteSelecionada === "RC/Q" ? "Índice" : "cm"})`,
                    "#3B82F6"
                  )}
                />
              ) : (
                <p className="text-sm text-gray-600 text-center py-5">
                  Nenhuma medição encontrada para "{parteSelecionada}" ainda.
                </p>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicoes;

