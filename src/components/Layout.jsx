// src/components/Layout.jsx
import { auth } from "../firebase";
import Navegacao from "./Navegacao";
import { useNavigate } from "react-router-dom";

const Layout = ({ children }) => {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <div className="pb-20 min-h-screen bg-gradient-to-br from-slate-900 to-gray-800 text-white">
      {user && (
        <header className="bg-slate-800/70 backdrop-blur-sm shadow-md p-4 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Foto do usuário"
                className="w-10 h-10 rounded-full border-2 border-blue-400/30"
              />
            )}
            <span className="font-semibold text-white">
              Olá, {user.displayName || "Usuário"}!
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Sair
          </button>
        </header>
      )}

      <main>{children}</main>

      {user && <Navegacao />}
    </div>
  );
};

export default Layout;
