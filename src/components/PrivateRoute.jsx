import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const { user, carregando } = useAuth();

  if (carregando) return <p className="text-center mt-10">Carregando...</p>;

  return user ? children : <Navigate to="/" />;
};

export default PrivateRoute;
