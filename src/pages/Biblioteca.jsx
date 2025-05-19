import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { getUserData } from "../utils/storage";
import {
  BookOpen,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Maximize2,
  X,
  TrendingUp,
  Weight,
  Calendar,
  Info
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";

const gruposMusculares = {
  Peito: ["Supino Reto (Barra)", "Supino Reto (Halter)", "Supino Reto (Máquina)", "Supino Inclinado (Barra)",
          "Supino Inclinado (Halter)", "Supino Inclinado (Máquina)", "Peck Deck", "CrossOver (Polia Alta)",
          "CrossOver (Polia Baixa)"],
  Costas: ["Puxada Alta (Aberta)", "Puxada Alta (Supinada)", "Puxada Alta (Triângulo)", "Remada Serrote", "Remada Baixa", 
           "Remada Cavalo", "Remada Máquina", "Barra Fixa", "Face Pull"],
  Ombros: ["Desenvolvimento (Halter)", "Desenvolvimento (Máquina)", "Crucifixo Inverso", "Elevação Lateral", "Elevação Frontal"],
  Bíceps: ["Rosca Direta (Barra)", "Rosca Direta (Halter)", "Rosca Alternada", "Rosca Scott", "Rosca Martelo", "Rosca Concentrada"],
  Tríceps: ["Pulley (Corda)", "Pulley (Barra Reta)", "Pulley (Barra V)", "Testa (Polia)", "Testa (Barra)", "Testa (Halter)", 
            "Francês (Halter)", "Francês (Polia)", "Mergulho (Máquina)"],
  Antebraço: ["Rosca Inversa", "Rosca Punho", "Rosca Punho Inversa"],
  Quadríceps: ["Agachamento Smith", "Agachamento Hack", "Cadeira Extensora", "Leg Press", "Búlgaro (Quadríceps)"],
  Posterior: ["Stiff (Barra)", "Stiff (Halter)", "Cadeira Flexora", "Mesa Flexora", "Búlgaro (Posterior)", "Elevação Pélvica", "Coice Glúteo (Máquina)", "Coice Glúteo (Polia)"],
  Quadril: ["Cadeira Abdutora (Máquina)", "Cadeira Adutora (Máquina)", "Abdução (Polia)", "Adução (Polia)"],
  Abdomên: ["Crunch (Máquina)", "Crunch Inverso", "Elevação de Pernas", "Rotação Russa (Oblíquo)", "Lenhador (Polia)"],
  Panturrilha: ["Panturrilha em Pé (Máquina)", "Panturrilha em Pé (Smith)", "Panturrilha Leg Press"],
};

const Biblioteca = () => {
  const [exercicioSelecionado, setExercicioSelecionado] = useState(null);
  const [tipoGrafico, setTipoGrafico] = useState("ambos");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [buscaExercicio, setBuscaExercicio] = useState("");
  const [imagemModal, setImagemModal] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const toggleExercicio = (nome) => {
    setExercicioSelecionado(exercicioSelecionado === nome ? null : nome);
  };

  const buscarProgresso = (exercicio) => {
    if (!user?.uid) return [];
    
    const dados = getUserData("gymtracker_cargas", user.uid) || [];
    const progressoPorData = {};

    dados.forEach((item) => {
      if (item.exercicio === exercicio) {
        const data = item.data;

        if (!progressoPorData[data]) {
          progressoPorData[data] = {
            volumeTotal: 0,
            cargaMaxima: 0,
          };
        }

        item.series.forEach((serie) => {
          const carga = parseFloat(serie.carga || 0);
          const repeticoes = parseInt(serie.repeticoes || 0);
          const volume = carga * repeticoes;

          progressoPorData[data].volumeTotal += volume;
          if (carga > progressoPorData[data].cargaMaxima) {
            progressoPorData[data].cargaMaxima = carga;
          }
        });
      }
    });

    return Object.entries(progressoPorData)
      .map(([data, valores]) => ({
        data,
        volumeTotal: valores.volumeTotal,
        cargaMaxima: valores.cargaMaxima,
      }))
      .sort(
        (a, b) =>
          new Date(a.data.split("/").reverse()) -
          new Date(b.data.split("/").reverse())
      );
  };

  const grupoFiltrado = filtroGrupo
    ? { [filtroGrupo]: gruposMusculares[filtroGrupo] }
    : gruposMusculares;

  // Customização do tooltip do gráfico
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-700">
          <p className="text-gray-300 text-sm mb-1 font-medium">{`Data: ${label}`}</p>
          {payload.map((entry, index) => (
            <p 
              key={`item-${index}`} 
              className="text-sm" 
              style={{ color: entry.color }}
            >
              {entry.name === "volumeTotal" ? "Volume Total: " : "Carga Máxima: "}
              <span className="font-medium">{entry.value} kg</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <PageWrapper>
      <div 
        className={`pb-32 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="flex justify-between items-center mb-4 m-4">
          <div className="flex items-center">
            <BookOpen size={22} className="text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-white">Biblioteca de Exercícios</h1>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800 rounded-xl p-4 mb-4 m-4">
          <div className="flex items-center mb-2">
            <Filter size={16} className="text-blue-400 mr-2" />
            <p className="text-sm font-medium text-gray-300">Filtrar exercícios:</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <select
                className="w-full bg-slate-700 text-white border-none rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
              >
                <option value="">Todos os grupos musculares</option>
                {Object.keys(gruposMusculares).map((grupo) => (
                  <option key={grupo} value={grupo}>
                    {grupo}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar exercício"
                className="w-full bg-slate-700 text-white border-none rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={buscaExercicio}
                onChange={(e) => setBuscaExercicio(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de exercícios */}
        <div className="space-y-6 m-4">
          {Object.entries(grupoFiltrado).map(([grupo, exercicios], grupoIndex) => {
            const exerciciosFiltrados = exercicios.filter((ex) =>
              ex.toLowerCase().includes(buscaExercicio.toLowerCase())
            );

            if (exerciciosFiltrados.length === 0) return null;

            return (
              <div 
                key={grupo} 
                className="animate-fadeIn"
                style={{ animationDelay: `${grupoIndex * 100}ms` }}
              >
                <div className="flex items-center mb-3">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full mr-2"></div>
                  <h2 className="text-lg font-semibold text-blue-400">
                    {grupo}
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {exerciciosFiltrados.map((exercicio, exIndex) => (
                    <div
                      key={exercicio}
                      className="bg-slate-800 rounded-xl overflow-hidden shadow-lg animate-fadeIn"
                      style={{ animationDelay: `${exIndex * 50}ms` }}
                    >
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="relative group">
                              <img
                                src={`/imagens/${exercicio}.jpg`}
                                alt={`Imagem de ${exercicio}`}
                                className="w-20 h-20 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                                onClick={() => setImagemModal(`/imagens/${exercicio}.jpg`)}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/150?text=Sem+Imagem";
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 size={20} className="text-white bg-black/50 p-1 rounded-full" />
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{exercicio}</h3>
                              <span className="text-xs text-gray-400 bg-slate-700 px-2 py-0.5 rounded-full inline-block mt-1">
                                {grupo}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors"
                            onClick={() => toggleExercicio(exercicio)}
                          >
                            <BarChart2 size={16} className="mr-1.5" />
                            {exercicioSelecionado === exercicio ? "Ocultar Progresso" : "Ver Progresso"}
                          </button>
                        </div>
                      </div>

                      {exercicioSelecionado === exercicio && (
                        <div className="px-4 pb-4 animate-fadeIn">
                          <div className="h-px bg-slate-700 mb-4"></div>
                          
                          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
                            <TrendingUp size={16} className="text-blue-400 mr-2" />
                            Progresso ao Longo do Tempo
                          </h3>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {[
                              { id: "ambos", label: "Ambos", icon: <BarChart2 size={14} /> },
                              { id: "volume", label: "Volume", icon: <TrendingUp size={14} /> },
                              { id: "carga", label: "Carga", icon: <Weight size={14} /> }
                            ].map((tipo) => (
                              <button
                                key={tipo.id}
                                className={`px-3 py-1.5 rounded-lg text-xs flex items-center ${
                                  tipoGrafico === tipo.id
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                                } transition-colors`}
                                onClick={() => setTipoGrafico(tipo.id)}
                              >
                                <span className="mr-1.5">{tipo.icon}</span>
                                {tipo.label}
                              </button>
                            ))}
                          </div>

                          {buscarProgresso(exercicio).length > 0 ? (
                            <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
                              <div className="w-full h-60">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart 
                                    data={buscarProgresso(exercicio)}
                                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis 
                                      dataKey="data" 
                                      stroke="#9ca3af" 
                                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    />
                                    <YAxis 
                                      stroke="#9ca3af" 
                                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    {(tipoGrafico === "ambos" || tipoGrafico === "volume") && (
                                      <Line
                                        type="monotone"
                                        dataKey="volumeTotal"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        name="volumeTotal"
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                        activeDot={{ r: 6, fill: '#3b82f6' }}
                                      />
                                    )}
                                    {(tipoGrafico === "ambos" || tipoGrafico === "carga") && (
                                      <Line
                                        type="monotone"
                                        dataKey="cargaMaxima"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="cargaMaxima"
                                        dot={{ fill: '#ef4444', r: 4 }}
                                        activeDot={{ r: 6, fill: '#ef4444' }}
                                      />
                                    )}
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-700/50 rounded-lg p-6 mb-4 flex flex-col items-center justify-center text-center">
                              <Info size={24} className="text-gray-400 mb-2" />
                              <p className="text-gray-300">Nenhum progresso registrado ainda para este exercício.</p>
                              <p className="text-gray-400 text-sm mt-1">Registre seus treinos para começar a acompanhar seu progresso.</p>
                            </div>
                          )}

                          {buscarProgresso(exercicio).length > 0 && (
                            <div className="bg-slate-700/50 rounded-lg overflow-hidden">
                              <div className="p-3 bg-slate-700 flex items-center">
                                <Calendar size={14} className="text-blue-400 mr-2" />
                                <h4 className="text-sm font-medium text-white">Histórico de Treinos</h4>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-600 text-gray-400">
                                      <th className="py-2 px-3 text-left">Data</th>
                                      <th className="py-2 px-3 text-left">Volume Total</th>
                                      <th className="py-2 px-3 text-left">Carga Máxima</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {buscarProgresso(exercicio).map((item, index) => (
                                      <tr 
                                        key={index} 
                                        className={`border-b border-slate-600/50 ${index % 2 === 0 ? 'bg-slate-800/30' : ''}`}
                                      >
                                        <td className="py-2 px-3 text-gray-300">{item.data}</td>
                                        <td className="py-2 px-3">
                                          <span className="text-blue-400 font-medium">{item.volumeTotal} kg</span>
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className="text-red-400 font-medium">{item.cargaMaxima} kg</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Estado vazio */}
          {Object.values(grupoFiltrado).every(
            (exercicios) =>
              exercicios.filter((ex) =>
                ex.toLowerCase().includes(buscaExercicio.toLowerCase())
              ).length === 0
          ) && (
            <div className="bg-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center animate-fadeIn">
              <div className="bg-slate-700 p-4 rounded-full mb-3">
                <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-300 text-lg mb-1">
                Nenhum exercício encontrado
              </p>
              <p className="text-gray-400 text-sm">
                Tente mudar os filtros ou termos de busca
              </p>
            </div>
          )}
        </div>
        
        {/* Modal de imagem */}
        {imagemModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 animate-fadeIn"
            onClick={() => setImagemModal(null)}
          >
            <div className="relative max-w-[90%] max-h-[90%]">
              <button 
                className="absolute -top-10 right-0 bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-colors"
                onClick={() => setImagemModal(null)}
              >
                <X size={20} className="text-white" />
              </button>
              <img
                src={imagemModal}
                alt="Exercício"
                className="max-w-full max-h-[80vh] rounded-lg shadow-lg"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/400?text=Imagem+Não+Disponível";
                }}
              />
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
    </PageWrapper>
  );
};

export const exercicios = Object.entries(gruposMusculares).flatMap(
  ([grupoMuscular, nomes]) =>
    nomes.map((nome) => ({
      id: `${grupoMuscular}-${nome}`,
      nome,
      grupoMuscular,
    }))
);

export default Biblioteca;
