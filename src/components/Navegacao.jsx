import { Link, useLocation } from "react-router-dom";
import {
  Dumbbell,
  ClipboardList,
  Ruler,
  History,
  Book // Importando o ícone Book
} from "lucide-react";

const Navegacao = () => {
  const location = useLocation();

  const tabs = [
    { label: "Exercícios", path: "/app", icon: <Dumbbell size={25} /> },
    { label: "Medições", path: "/medicoes", icon: <Ruler size={25} /> },
    { label: "Histórico", path: "/historico", icon: <History size={25} /> },
    { label: "Biblioteca", path: "/biblioteca", icon: <Book size={25} /> }, // Novo item adicionado
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-md border-t border-slate-700/50 shadow-lg z-50">
      <div className="flex justify-around items-center h-24 pb-5">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`group flex flex-col items-center justify-center text-xs transition-all duration-300 ${
                isActive ? "text-blue-300 font-bold hover:text-blue-300" : "text-gray-300 hover:text-gray-200"
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div className={`transition-all duration-300 transform ${isActive ? "scale-110 text-blue-300" : "text-gray-300"}`}>
                  {tab.icon}
                </div>
                <span className="mt-1">{tab.label}</span>
                <span
                  className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1 w-1.5 rounded-full transition-all duration-300 ${
                    isActive ? "w-5 bg-blue-300" : "w-0"
                  }`}
                ></span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navegacao;
