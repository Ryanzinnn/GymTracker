import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Label
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
  TrendingUp,
  Weight,
  Calendar,
  Info,
  Image as ImageIcon,
  X as XIcon,
  Maximize2,
  Minimize2,
  ArrowRight,
  Flame,
  Sparkles,
  Eye,
  MousePointerClick,
  RotateCw // Ícone para animação
} from "lucide-react";
import PageWrapper from "../components/PageWrapper";

// Mapeamento de grupos musculares (mantido)
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

// Função para obter cor baseada no grupo muscular (mantida)
const getGrupoColor = (grupo) => {
  const cores = {
    "Peito": "#ec4899", // Rosa
    "Costas": "#3b82f6", // Azul
    "Pernas": "#f97316", // Laranja
    "Ombros": "#8b5cf6", // Roxo
    "Bíceps": "#10b981", // Verde
    "Tríceps": "#f59e0b", // Âmbar
    "Abdômen": "#ef4444", // Vermelho
    "Glúteos": "#6366f1", // Índigo
    "Panturrilha": "#14b8a6", // Turquesa
    "Antebraço": "#a855f7", // Púrpura
    "Quadríceps": "#22c55e", // Verde Esmeralda
    "Posterior": "#d946ef", // Fúcsia
    "Quadril": "#0ea5e9", // Azul Céu
  };
  return cores[grupo] || "#64748b"; // Cinza como cor padrão
};

const Biblioteca = () => {
  const [exercicioSelecionado, setExercicioSelecionado] = useState(null);
  const [tipoGrafico, setTipoGrafico] = useState("ambos");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [buscaExercicio, setBuscaExercicio] = useState("");
  const [imagemModal, setImagemModal] = useState(null); // Estado do modal (do código funcional)
  const [isVisible, setIsVisible] = useState(false);
  const [viewportPosition, setViewportPosition] = useState(0); // Estado para a posição da viewport (do código funcional)
  const [activeFilters, setActiveFilters] = useState(false);
  const [hoveredExercise, setHoveredExercise] = useState(null);
  const [isGraphLoading, setIsGraphLoading] = useState(false); // Estado para loading do gráfico
  const { user } = useAuth();

  // Animação de entrada da página
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Lógica para buscar progresso (mantida)
  const buscarProgresso = (exercicio) => {
    if (!user?.uid) return [];
    const dados = getUserData("gymtracker_cargas", user.uid) || [];
    const progressoPorData = {};
    dados.forEach((item) => {
      if (item.exercicio === exercicio) {
        const data = item.data;
        if (!progressoPorData[data]) {
          progressoPorData[data] = { volumeTotal: 0, cargaMaxima: 0 };
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
      .map(([data, valores]) => ({ data, ...valores }))
      .sort((a, b) => new Date(a.data.split("/").reverse()) - new Date(b.data.split("/").reverse()));
  };

  // Filtragem de exercícios (mantida e otimizada)
  const grupoFiltrado = filtroGrupo ? { [filtroGrupo]: gruposMusculares[filtroGrupo] } : gruposMusculares;
  const exerciciosFiltradosPorGrupo = Object.entries(grupoFiltrado).map(([grupo, exercicios]) => {
    const filtrados = exercicios.filter((ex) =>
      ex.toLowerCase().includes(buscaExercicio.toLowerCase())
    );
    return { grupo, exercicios: filtrados };
  }).filter(g => g.exercicios.length > 0);

  // Tooltip customizado para gráfico (mantido)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-slate-700 animate-fadeIn">
          <p className="text-gray-300 text-sm mb-2 font-medium flex items-center">
            <Calendar size={14} className="mr-1.5 text-blue-400" /> {label}
          </p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm flex items-center my-1" style={{ color: entry.color }}>
              {entry.name === "volumeTotal" ? 
                <TrendingUp size={14} className="mr-1.5" /> : 
                <Weight size={14} className="mr-1.5" />
              }
              {entry.name === "volumeTotal" ? "Volume: " : "Carga Máx: "}
              <span className="font-semibold ml-1">{entry.value} kg</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Lógica do Modal de Imagem Funcional (do pasted_content_2.txt)
  const abrirImagemModal = (exercicio) => {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const viewportCenter = scrollY + viewportHeight / 2;
    setViewportPosition(viewportCenter);
    setImagemModal(exercicio);
    document.body.style.overflow = "hidden";
  };

  const fecharImagemModal = () => {
    setImagemModal(null);
    document.body.style.overflow = "auto";
  };

  // Toggle do exercício selecionado com loading
  const toggleExercicio = (nome) => {
    if (exercicioSelecionado === nome) {
      setExercicioSelecionado(null);
    } else {
      setIsGraphLoading(true);
      setExercicioSelecionado(nome);
      // Simula um pequeno delay para o loading (opcional)
      setTimeout(() => setIsGraphLoading(false), 300);
    }
  };

  return (
    <PageWrapper>
      <div
        className={`pb-32 transform transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="p-4 max-w-screen-lg mx-auto space-y-8">
          {/* Cabeçalho Moderno com Animação (mantido) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 animate-slideInFromLeft" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl mr-4 shadow-lg transform hover:scale-105 transition-transform duration-300">
                <BookOpen size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Biblioteca</h1>
                <p className="text-sm text-gray-400 mt-1">Explore exercícios e visualize seu progresso.</p>
              </div>
            </div>
          </div>

          {/* Filtros Modernos com Animação (mantido) */}
          <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden animate-slideInFromRight" style={{ animationDelay: '200ms' }}>
            <div className="p-4">
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar exercício..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-700/60 text-white border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-500 hover:bg-slate-700"
                  value={buscaExercicio}
                  onChange={(e) => setBuscaExercicio(e.target.value)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveFilters(!activeFilters)}
                  className={`flex items-center text-sm ${activeFilters ? 'text-blue-400 font-medium' : 'text-gray-400'} hover:text-blue-300 transition-colors duration-200 group`}
                >
                  <Filter size={16} className="mr-1.5 group-hover:animate-spinOnce" />
                  Filtrar por Grupo
                  <ChevronDown size={16} className={`ml-1 transform transition-transform duration-300 ${activeFilters ? 'rotate-180' : ''}`} />
                </button>
                {filtroGrupo && (
                  <button
                    onClick={() => setFiltroGrupo("")}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md"
                  >
                    <XIcon size={14} className="mr-0.5" /> Limpar
                  </button>
                )}
              </div>
              
              {/* Filtro Dropdown Animado (mantido) */}
              <div className={`transition-all duration-300 ease-out overflow-hidden ${activeFilters ? 'max-h-40 mt-4' : 'max-h-0 mt-0'}`}>
                {activeFilters && (
                  <div className="animate-fadeIn">
                    <div className="relative">
                      <label className="block text-xs text-gray-400 mb-1 ml-1">Selecione o Grupo Muscular</label>
                      <div className="relative">
                        <select
                          className="w-full bg-slate-700/60 text-white border border-slate-600/50 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-slate-700"
                          value={filtroGrupo}
                          onChange={(e) => setFiltroGrupo(e.target.value)}
                        >
                          <option value="">Todos os grupos</option>
                          {Object.keys(gruposMusculares).sort().map((grupo) => (
                            <option key={grupo} value={grupo}>
                              {grupo}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <ChevronDown size={16} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Exercícios Moderna com Animações Staggered e Hover Aprimorado */}
          <div className="space-y-8">
            {exerciciosFiltradosPorGrupo.length > 0 ? (
              exerciciosFiltradosPorGrupo.map(({ grupo, exercicios }, grupoIndex) => (
                <div 
                  key={grupo} 
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${grupoIndex * 150}ms` }} // Atraso menor
                >
                  <div className="flex items-center mb-4 pl-1">
                    <div 
                      className="w-2.5 h-8 rounded-full mr-3 shadow-lg shadow-black/20 transition-colors duration-300"
                      style={{ background: `linear-gradient(to bottom, ${getGrupoColor(grupo)}, ${getGrupoColor(grupo)}99)` }}
                    ></div>
                    <h2 className="text-xl font-semibold text-white tracking-wide">
                      {grupo}
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {exercicios.map((exercicio, exIndex) => (
                      <div
                        key={exercicio}
                        className={`bg-gradient-to-br from-slate-800 to-slate-800/70 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] animate-fadeInUp border border-slate-700/50 relative group ${hoveredExercise === exercicio ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''}`}
                        style={{ 
                          animationDelay: `${exIndex * 50 + grupoIndex * 150}ms`, // Atraso menor
                          borderColor: hoveredExercise === exercicio ? getGrupoColor(grupo) : 'rgba(51, 65, 85, 0.5)', // slate-700/50
                          ringColor: getGrupoColor(grupo)
                        }}
                        onMouseEnter={() => setHoveredExercise(exercicio)}
                        onMouseLeave={() => setHoveredExercise(null)}
                      >
                        {/* Efeito de brilho no hover (mantido) */}
                        <div 
                          className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ background: `radial-gradient(circle at top left, ${getGrupoColor(grupo)}15, transparent 60%)` }}
                        ></div>
                        
                        <div className="p-4 relative z-10">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="relative group/image flex-shrink-0">
                              <img
                                src={`/imagens/${exercicio}.jpg`}
                                alt={`Imagem de ${exercicio}`}
                                className="w-20 h-20 object-cover rounded-lg cursor-pointer transition-all duration-300 group-hover/image:scale-105 shadow-md border-2 border-slate-700 group-hover/image:border-blue-500"
                                onClick={() => abrirImagemModal(exercicio)} // Chamada ajustada para a nova função
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "https://via.placeholder.com/150?text=Sem+Img";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <Eye size={24} className="text-white" />
                              </div>
                            </div>
                            <h3 className="font-semibold text-white flex-1 text-lg leading-tight">
                              {exercicio}
                            </h3>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span 
                              className="text-xs px-3 py-1 rounded-full font-medium flex items-center shadow-sm transition-colors duration-300"
                              style={{ 
                                background: `linear-gradient(to right, ${getGrupoColor(grupo)}30, ${getGrupoColor(grupo)}10)`,
                                color: getGrupoColor(grupo),
                                border: `1px solid ${getGrupoColor(grupo)}40`
                              }}
                            >
                              {grupo}
                            </span>
                            <button
                              className={`px-3 py-1.5 rounded-lg text-xs flex items-center transition-all duration-300 transform hover:scale-105 ${exercicioSelecionado === exercicio ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white'}`}
                              onClick={() => toggleExercicio(exercicio)}
                            >
                              <BarChart2 size={14} className="mr-1.5" />
                              {exercicioSelecionado === exercicio ? "Ocultar" : "Progresso"}
                            </button>
                          </div>
                        </div>

                        {/* Gráfico de Progresso Animado, Ajustado e com Loading (mantido) */}
                        <div className={`transition-all duration-500 ease-out overflow-hidden ${exercicioSelecionado === exercicio ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          {exercicioSelecionado === exercicio && (
                            <div className="px-4 pb-4 border-t border-slate-700/50 mt-3 pt-4 animate-fadeIn">
                              <h4 className="text-base font-semibold text-white mb-3 flex items-center">
                                <TrendingUp size={18} className="text-blue-400 mr-2" />
                                Seu Progresso
                              </h4>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {[
                                  { id: "ambos", label: "Ambos", icon: <BarChart2 size={14} /> },
                                  { id: "volume", label: "Volume", icon: <TrendingUp size={14} /> },
                                  { id: "carga", label: "Carga", icon: <Weight size={14} /> }
                                ].map((tipo) => (
                                  <button
                                    key={tipo.id}
                                    className={`px-3 py-1 rounded-lg text-xs flex items-center transition-all duration-200 transform hover:scale-105 ${tipoGrafico === tipo.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-600/50 text-gray-300 hover:bg-slate-600'}`}
                                    onClick={() => setTipoGrafico(tipo.id)}
                                  >
                                    <span className="mr-1.5">{tipo.icon}</span>
                                    {tipo.label}
                                  </button>
                                ))}
                              </div>

                              {isGraphLoading ? (
                                <div className="bg-slate-700/40 rounded-lg p-6 mb-2 flex flex-col items-center justify-center text-center shadow-inner border border-slate-600/30 h-56">
                                  <RotateCw size={28} className="text-blue-400 mb-3 animate-spin" />
                                  <p className="text-sm text-gray-400">Carregando dados...</p>
                                </div>
                              ) : buscarProgresso(exercicio).length > 0 ? (
                                <div className="bg-slate-700/40 rounded-lg p-3 mb-2 shadow-inner border border-slate-600/30">
                                  <div className="w-full h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart 
                                        data={buscarProgresso(exercicio)}
                                        margin={{ top: 10, right: 15, left: 5, bottom: 5 }} // Margens mantidas
                                      >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" strokeOpacity={0.5} />
                                        <XAxis 
                                          dataKey="data" 
                                          stroke="#9ca3af" 
                                          tick={{ fill: '#a1a1aa', fontSize: 11 }} 
                                          tickFormatter={(tick) => tick.substring(0, 5)} 
                                          axisLine={{ stroke: '#4b5563' }}
                                          tickLine={{ stroke: '#4b5563' }}
                                          padding={{ left: 10, right: 10 }} 
                                        />
                                        <YAxis 
                                          stroke="#9ca3af" 
                                          tick={{ fill: '#a1a1aa', fontSize: 11 }} 
                                          width={45} // Largura mantida
                                          axisLine={{ stroke: '#4b5563' }}
                                          tickLine={{ stroke: '#4b5563' }}
                                          domain={['auto', 'auto']} 
                                          allowDataOverflow={false}
                                        />
                                        <Tooltip 
                                          content={<CustomTooltip />} 
                                          cursor={{ fill: 'rgba(71, 85, 105, 0.2)', stroke: '#60a5fa', strokeWidth: 1 }}
                                          animationDuration={300}
                                        />
                                        {(tipoGrafico === "ambos" || tipoGrafico === "volume") && (
                                          <Line type="monotone" dataKey="volumeTotal" stroke="#60a5fa" strokeWidth={2.5} name="volumeTotal" dot={{ r: 4, fill: '#60a5fa', stroke: '#1e293b', strokeWidth: 1 }} activeDot={{ r: 6, strokeWidth: 2, stroke: 'white', fill: '#3b82f6' }} animationDuration={1000} animationEasing="ease-out" />
                                        )}
                                        {(tipoGrafico === "ambos" || tipoGrafico === "carga") && (
                                          <Line type="monotone" dataKey="cargaMaxima" stroke="#f87171" strokeWidth={2.5} name="cargaMaxima" dot={{ r: 4, fill: '#f87171', stroke: '#1e293b', strokeWidth: 1 }} activeDot={{ r: 6, strokeWidth: 2, stroke: 'white', fill: '#ef4444' }} animationDuration={1000} animationEasing="ease-out" />
                                        )}
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-slate-700/40 rounded-lg p-6 mb-2 flex flex-col items-center justify-center text-center shadow-inner border border-slate-600/30 h-56">
                                  <Info size={28} className="text-gray-500 mb-3" />
                                  <p className="text-sm text-gray-400">Sem dados de progresso registrados.</p>
                                  <p className="text-xs text-gray-500 mt-1">Comece a registrar seus treinos!</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Estado Vazio Moderno (mantido) */
              <div className="bg-slate-800 rounded-xl p-10 flex flex-col items-center justify-center text-center animate-fadeInUp mt-8 shadow-lg border border-slate-700/50">
                <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-5 rounded-full mb-4 shadow-md animate-pulse">
                  <Search size={40} className="text-gray-400" />
                </div>
                <p className="text-gray-300 text-xl font-semibold mb-2">
                  Nenhum exercício encontrado
                </p>
                <p className="text-gray-400 text-sm max-w-xs">
                  Parece que sua busca não retornou resultados. Tente ajustar os filtros ou o termo de busca.
                </p>
                {(filtroGrupo || buscaExercicio) && (
                  <button
                    onClick={() => { setFiltroGrupo(""); setBuscaExercicio(""); }}
                    className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm flex items-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <XIcon size={16} className="mr-1.5" /> Limpar Busca e Filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Imagem com Lógica Funcional (do pasted_content_2.txt) e Botão X */}
        {imagemModal && (
          <div 
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeInModal"
            onClick={fecharImagemModal} // Fecha ao clicar no overlay
          >
            {/* Container da imagem posicionado com base na viewport */}
            <div
              className="relative transition-transform duration-300 ease-out animate-zoomIn"
              style={{
                position: 'absolute', // Usar absoluto para posicionar com top
                top: `${viewportPosition}px`, // Posição vertical baseada no centro da viewport
                left: '50%', // Centraliza horizontalmente
                transform: 'translate(-50%, -50%)', // Ajusta para centralizar vertical e horizontalmente
                maxWidth: '120vw',
                maxHeight: '80vh', // Limita a altura para caber na tela
              }}
              onClick={(e) => e.stopPropagation()} // Impede que clique na imagem feche o modal
            >
              <img
                src={`/imagens/${imagemModal}.jpg`}
                alt={`Imagem ampliada de ${imagemModal}`}
                className="block object-contain rounded-xl shadow-2xl w-auto h-auto max-w-full max-h-full border-4 border-slate-600/50"
                style={{ maxHeight: 'inherit' }} // Garante que a imagem respeite a altura máxima do container
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/700x500?text=Imagem+Indispon%C3%ADvel";
                }}
              />
              {/* Botão X para fechar (mantido da versão anterior) */}
              <button 
                onClick={fecharImagemModal} 
                className="absolute -top-4 -right-4 bg-slate-700 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all duration-300 transform hover:scale-110 hover:rotate-90 z-10 border-2 border-slate-800"
                aria-label="Fechar imagem"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS para animações (mantido e aprimorado) */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes spinOnce {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; } /* Duração menor */
        .animate-slideInFromLeft { animation: slideInFromLeft 0.6s ease-out forwards; } /* Duração menor */
        .animate-slideInFromRight { animation: slideInFromRight 0.6s ease-out forwards; } /* Duração menor */
        .animate-fadeInModal { animation: fadeInModal 0.3s ease-out forwards; }
        .animate-zoomIn { animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .group:hover .animate-spinOnce { animation: spinOnce 0.5s ease-out; }
        
        /* Custom scrollbar (mantido) */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b; /* slate-800 */
        }
        ::-webkit-scrollbar-thumb {
          background-color: #475569; /* slate-600 */
          border-radius: 10px;
          border: 2px solid #1e293b; /* slate-800 */
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: #64748b; /* slate-500 */
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
