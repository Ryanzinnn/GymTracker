import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import App from "./pages/App";
import RegistrarCarga from "./pages/RegistrarCarga";
import Medicoes from "./pages/Medicoes";
import Historico from "./pages/Historico";
import Biblioteca from "./pages/Biblioteca";
import Login from "./pages/Login";

import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* Aqui */}
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/app"
            element={
              <PrivateRoute>
                <Layout>
                  <App />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/registrar"
            element={
              <PrivateRoute>
                <Layout>
                  <RegistrarCarga />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/medicoes"
            element={
              <PrivateRoute>
                <Layout>
                  <Medicoes />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/biblioteca"
            element={
              <PrivateRoute>
                <Layout>
                  <Biblioteca />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/historico"
            element={
              <PrivateRoute>
                <Layout>
                  <Historico />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
