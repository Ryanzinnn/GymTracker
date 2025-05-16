// src/pages/Login_moderno.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"; // Presumo que o caminho está correto
import { Navigate } from "react-router-dom";
import { LogIn, Zap } from "lucide-react"; // Ícones para um toque moderno

export default function LoginModerno() {
  const { login, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Ativa a animação de entrada após um pequeno atraso para o efeito ser visível
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (user) return <Navigate to="/app" />;

  return (
    // Aumentado o padding geral da página, especialmente o horizontal, para dar mais respiro em telas menores
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-800 flex flex-col items-center justify-center p-6 sm:p-4 overflow-hidden">
      <div 
        className={`transform transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* O padding interno do card (p-8 sm:p-10) já é generoso, o problema era o espaço externo. */}
        <div className="bg-slate-800 bg-opacity-50 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border border-slate-700">
          <div className="mb-8 flex justify-center items-center">
            <Zap size={48} className="text-blue-400 animate-pulse" />
            <h1 className="ml-3 text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-300 to-green-400">
              GymTracker
            </h1>
          </div>

          <p className="text-gray-300 mb-10 text-lg">
            Monitore seu progresso, supere seus limites.
          </p>

          <button
            onClick={login}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold px-8 py-4 rounded-xl hover:from-blue-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center shadow-lg"
          >
            <LogIn size={22} className="mr-3" />
            Entrar com Google
          </button>

          <p className="mt-12 text-xs text-slate-500">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
      
      {/* Elementos decorativos animados (opcional) */}
      <div className={`absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-0 animate-blob animation-delay-2000 ${isVisible ? "opacity-20" : "opacity-0"}`}></div>
      <div className={`absolute top-1/2 left-3/4 w-32 h-32 bg-teal-400 rounded-full mix-blend-screen filter blur-xl opacity-0 animate-blob animation-delay-4000 ${isVisible ? "opacity-20" : "opacity-0"}`}></div>
      <div className={`absolute bottom-1/4 left-1/3 w-32 h-32 bg-green-400 rounded-full mix-blend-screen filter blur-xl opacity-0 animate-blob ${isVisible ? "opacity-20" : "opacity-0"}`}></div>

      {/* Adicionar CSS para animação de blob se não estiver no seu CSS global */}
      <style jsx global>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% {
            transform: scale(1) translate(0px, 0px);
          }
          33% {
            transform: scale(1.1) translate(30px, -50px);
          }
          66% {
            transform: scale(0.9) translate(-20px, 20px);
          }
          100% {
            transform: scale(1) translate(0px, 0px);
          }
        }
      `}</style>
    </div>
  );
}

