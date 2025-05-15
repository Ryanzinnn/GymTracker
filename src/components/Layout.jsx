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
    <div className="pb-20 min-h-screen bg-gray-50">
      {user && (
        <header className="bg-white shadow p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Foto do usuário"
                className="w-10 h-10 rounded-full"
              />
            )}
            <span className="font-semibold text-gray-800">
              Olá, {user.displayName || "Usuário"}!
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sair
          </button>
        </header>
      )}

      <main className="p-4">{children}</main>

      {user && <Navegacao />}
    </div>
  );
};

export default Layout;
