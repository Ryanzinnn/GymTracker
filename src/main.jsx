import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./pages/App";
import RegistrarCarga from "./pages/RegistrarCarga";
import Medicoes from "./pages/Medicoes";
import Historico from "./pages/Historico";
import Layout from "./components/Layout";
import Biblioteca from "./pages/Biblioteca";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" />} />
        <Route
          path="/app"
          element={
            <Layout>
              <App />
            </Layout>
          }
        />
        <Route
          path="/registrar"
          element={
            <Layout>
              <RegistrarCarga />
            </Layout>
          }
        />
        <Route
          path="/medicoes"
          element={
            <Layout>
              <Medicoes />
            </Layout>
          }
        />
        <Route
          path="/biblioteca"
          element={
            <Layout>
              <Biblioteca />
            </Layout>
          }
        />
        <Route
          path="/historico"
          element={
            <Layout>
              <Historico />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
