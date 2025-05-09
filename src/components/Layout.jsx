import Navegacao from "./Navegacao";

const Layout = ({ children }) => {
  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {children}
      <Navegacao />
    </div>
  );
};

export default Layout;
