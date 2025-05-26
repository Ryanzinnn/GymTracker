import { Link, useLocation } from "react-router-dom";
import {
  Dumbbell,
  Ruler,
  History,
  Book
} from "lucide-react";
import { motion } from "framer-motion"; // Importar motion

const Navegacao = () => {
  const location = useLocation();

  const tabs = [
    { label: "Exercícios", path: "/app", icon: Dumbbell },
    { label: "Medições", path: "/medicoes", icon: Ruler },
    { label: "Histórico", path: "/historico", icon: History },
    { label: "Biblioteca", path: "/biblioteca", icon: Book },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/20 bg-gradient-to-t from-gray-950 via-gray-900/95 to-gray-900/90 backdrop-blur-lg shadow-lg">
      {/* Centraliza e limita a largura */}
      <div className="mx-auto flex h-24 max-w-md items-stretch justify-around pb-5 pt-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`group relative flex flex-1 flex-col items-center justify-center p-2 text-xs outline-none transition-colors duration-200 ease-out
                ${isActive
                  ? "text-cyan-300 hover:text-cyan-300" // Cor ativa mais brilhante
                  : "text-gray-400 hover:text-gray-100"
                }`} 
            >
              {/* Wrapper para animação de hover/tap com Framer Motion */}
              <motion.div
                className="relative flex flex-col items-center"
                whileHover={{ y: -4, scale: 1.05 }} // Efeito de elevação e escala no hover
                whileTap={{ scale: 0.95 }} // Efeito de clique
                transition={{ type: "spring", stiffness: 400, damping: 15 }} // Transição elástica
              >
                <Icon
                  size={24}
                  className={`transition-transform duration-300 ease-out ${isActive ? "scale-110" : "group-hover:scale-105"}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="mt-1 font-medium tracking-tight">{tab.label}</span>
              </motion.div>

              {/* Indicador Ativo Animado com Framer Motion */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator" // Chave para a animação de layout
                  className="absolute inset-x-2 bottom-1 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  // style={{ borderRadius: 9999 }} // Framer Motion pode precisar disso para animações suaves de borda
                  transition={{ type: "spring", stiffness: 350, damping: 30 }} // Transição elástica para o indicador
                ></motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navegacao;