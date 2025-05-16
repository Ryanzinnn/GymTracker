// src/pages/Login.jsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { login, user } = useAuth();

  if (user) return <Navigate to="/app" />;

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6 text-black">GymTracker</h1>
        <button
          onClick={login}
          className="bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600"
        >
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
