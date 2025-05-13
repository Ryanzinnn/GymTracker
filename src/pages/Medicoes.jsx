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

const Medicoes = () => {
  const [idade] = useState(20);
  const [altura] = useState(177);

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

  useEffect(() => {
    setPesos(JSON.parse(localStorage.getItem("medicoes_pesos")) || []);
    setGorduras(JSON.parse(localStorage.getItem("medicoes_gorduras")) || []);
    setMedicoes(JSON.parse(localStorage.getItem("medicoes_corpo")) || []);
  }, []);

  useEffect(() => {
    localStorage.setItem("medicoes_pesos", JSON.stringify(pesos));
  }, [pesos]);

  useEffect(() => {
    localStorage.setItem("medicoes_gorduras", JSON.stringify(gorduras));
  }, [gorduras]);

  useEffect(() => {
    localStorage.setItem("medicoes_corpo", JSON.stringify(medicoes));
  }, [medicoes]);

  const handleSubmitPeso = (e) => {
    e.preventDefault();
    const dataAtual = hojeFormatada(); // <- pega a data do dia
    setPesos([...pesos, { valor: parseFloat(peso), data: dataAtual }]);
    setPeso("");
    setDataPeso(dataAtual); // atualiza com a nova data para mostrar no input
  };

  const handleSubmitGordura = (e) => {
    e.preventDefault();
    const dataAtual = hojeFormatada(); // <- pega a data do dia
    setGorduras([...gorduras, { valor: parseFloat(gordura), data: dataAtual }]);
    setGordura("");
    setDataGordura(dataAtual); // atualiza com a nova data para mostrar no input
  };

  const calcularRCQ = (novaMedida) => {
    const { data } = novaMedida;

    const cintura =
      novaMedida.parte === "Cintura"
        ? novaMedida
        : medicoes.find((m) => m.parte === "Cintura" && m.data === data);

    const quadril =
      novaMedida.parte === "Quadril"
        ? novaMedida
        : medicoes.find((m) => m.parte === "Quadril" && m.data === data);

    if (cintura && quadril) {
      const rcq = cintura.valor / quadril.valor;

      const rcqJaRegistrado = medicoes.find(
        (m) => m.parte === "RC/Q" && m.data === data
      );

      if (!rcqJaRegistrado) {
        const novaLista = [
          ...medicoes,
          { parte: "RC/Q", valor: parseFloat(rcq.toFixed(2)), data },
        ];
        setMedicoes(novaLista);
        localStorage.setItem("medicoes_corpo", JSON.stringify(novaLista));
      }
    }
  };

  const handleSubmitMedida = (e) => {
    e.preventDefault();
    if (!parteSelecionada) return;

    const dataAtual = hojeFormatada();

    const novaMedida = {
      parte: parteSelecionada,
      valor: parseFloat(valor),
      data: dataAtual,
    };

    setMedicoes([...medicoes, novaMedida]);
    calcularRCQ(novaMedida);

    setValor("");
    setData(dataAtual);
    setParteSelecionada("");
    setModalAberto(false);
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
        tension: 0.3, // opcional: suaviza o gráfico
      },
    ],
  });

  const abrirModalGrafico = (parte) => {
    setParteSelecionada(parte);
    setModalGraficoAberto(true);
  };

  return (
    <div className="p-4 pb-24 max-w-screen-md mx-auto space-y-6">
      {/* Dados básicos */}
      <div className="bg-blue-100 p-4 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-1">Seus dados</h2>
        <p>
          Idade: <strong>{idade}</strong> anos
        </p>
        <p>
          Altura: <strong>{altura}</strong> cm
        </p>
        <p>
          Peso atual: <strong>{pesos.at(-1)?.valor || "—"} kg</strong>
        </p>
      </div>

      {/* Peso */}
      <form
        onSubmit={handleSubmitPeso}
        className="bg-white p-4 rounded-xl shadow space-y-3"
      >
        <h2 className="text-lg font-semibold">Peso Corporal</h2>
        <input
          type="number"
          placeholder="Peso em kg"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          value={dataPeso}
          onChange={(e) => setDataPeso(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Registrar Peso
        </button>
        {pesos.length > 0 ? (
          <>
            <Line data={gerarGrafico(pesos, "Peso (kg)", "#10B981")} />
            <p className="text-sm text-gray-500 mt-2">
              Última medição:{" "}
              {(() => {
                const ultimaData = pesos.at(-1)?.data;
                if (!ultimaData) return "—";
                const [ano, mes, dia] = ultimaData.split("-");
                return `${dia}/${mes}/${ano}`;
              })()}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Nenhuma medição registrada ainda.
          </p>
        )}
      </form>

      {/* Gordura */}
      <form
        onSubmit={handleSubmitGordura}
        className="bg-white p-4 rounded-xl shadow space-y-3"
      >
        <h2 className="text-lg font-semibold">Gordura Corporal (%)</h2>
        <input
          type="number"
          placeholder="Ex: 14.5"
          value={gordura}
          onChange={(e) => setGordura(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          value={dataGordura}
          onChange={(e) => setDataGordura(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Registrar Gordura
        </button>
        {gorduras.length > 0 ? (
          <>
            <Line data={gerarGrafico(gorduras, "Gordura (%)", "#F59E0B")} />
            <p className="text-sm text-gray-500 mt-2">
              Última medição:{" "}
              {(() => {
                const ultimaData = gorduras.at(-1)?.data;
                if (!ultimaData) return "—";
                const [ano, mes, dia] = ultimaData.split("-");
                return `${dia}/${mes}/${ano}`;
              })()}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Nenhuma medição registrada ainda.
          </p>
        )}
      </form>

      {/* Botão para abrir modal de medição corporal */}
      <div className="text-right">
        <button
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 mx-auto"
        >
          <Plus size={18} /> Nova Medição Corporal
        </button>
      </div>

      {/* Histórico por parte do corpo */}
      <div className="bg-white p-4 rounded-xl shadow space-y-2">
        <h3 className="text-lg font-semibold mb-2">Histórico de Medidas</h3>
        {partesCorpo.map((parte, i) => (
          <div
            key={i}
            className="flex justify-between items-center border-b py-2"
          >
            <p className="flex items-center gap-2 text-sm">
              <Ruler size={16} /> {parte}
            </p>
            <button
              onClick={() => abrirModalGrafico(parte)}
              className="text-blue-600 text-sm underline"
            >
              Ver Progresso
            </button>
          </div>
        ))}
      </div>

      {/* Modal para nova medição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">
              Registrar Medida Corporal
            </h3>
            <form onSubmit={handleSubmitMedida} className="space-y-3">
              <select
                value={parteSelecionada}
                onChange={(e) => setParteSelecionada(e.target.value)}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Selecione a parte do corpo</option>
                {partesCorpo
                  .filter((parte) => parte !== "RC/Q")
                  .map((parte, i) => (
                    <option key={i} value={parte}>
                      {parte}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                placeholder="Valor em cm"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal do gráfico de evolução */}
      {modalGraficoAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">
                Progresso: {parteSelecionada}
              </h3>
              <button
                onClick={() => setModalGraficoAberto(false)}
                className="text-red-600"
              >
                Fechar
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
                    `${parteSelecionada} (${
                      parteSelecionada === "RC/Q" ? "" : "cm"
                    })`,
                    "#3B82F6"
                  )}
                />
              ) : (
                <p className="text-sm text-gray-600">
                  Nenhuma medição encontrada para esta parte do corpo.
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
