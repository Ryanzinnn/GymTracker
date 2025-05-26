// src/components/Layout.jsx
import { auth } from "../firebase";
import Navegacao from "./Navegacao";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react"; // Importar o ícone LogOut

const Layout = ({ children }) => {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Adicionar feedback para o usuário se necessário
    }
  };

  return (
    // Fundo geral ligeiramente mais escuro e padding inferior ajustado para navbar
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-gray-900 pb-24 text-white">
      {user && (
        // Header com glassmorphism aprimorado, sombra suave e padding responsivo
        <header className="sticky top-0 z-40 bg-slate-900/75 backdrop-blur-lg shadow-xl shadow-black/25 border-b border-slate-700/20 px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Informações do usuário com avatar estilizado */}
            <div className="flex items-center gap-3 sm:gap-4">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt="Foto do usuário"
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-cyan-500/50 object-cover transition-transform duration-200 hover:scale-105 hover:ring-2 hover:ring-cyan-400/30"
                />
              )}
              <span className="font-medium text-sm sm:text-base text-white truncate max-w-[150px] sm:max-w-xs">
                Olá, {user.displayName || "Usuário"}!
              </span>
            </div>
            {/* Botão de Logout estilo ghost com ícone */}
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-all duration-200 hover:bg-slate-700/50 hover:text-white active:scale-95"
            >
              <LogOut size={16} className="text-slate-400 transition-colors group-hover:text-red-400" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>
      )}

      {/* Conteúdo principal com padding consistente */}
      <main className="p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Navegação inferior (mantida) */}
      {user && <Navegacao />}
    </div>
  );
};

export default Layout;

