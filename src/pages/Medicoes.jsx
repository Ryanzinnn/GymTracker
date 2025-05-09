import { useState, useEffect } from "react";
import { Pencil, Trash2, Ruler } from "lucide-react";

const LOCAL_STORAGE_KEY = "gymtracker_medicoes";

const Medicoes = () => {
  const [parte, setParte] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [medicoes, setMedicoes] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) setMedicoes(JSON.parse(data));
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(medicoes));
  }, [medicoes]);

  const resetForm = () => {
    setParte("");
    setValor("");
    setData("");
    setEditIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const novaMedicao = { parte, valor, data };

    if (editIndex !== null) {
      const atualizadas = [...medicoes];
      atualizadas[editIndex] = novaMedicao;
      setMedicoes(atualizadas);
    } else {
      setMedicoes([...medicoes, novaMedicao]);
    }

    resetForm();
  };

  const handleEdit = (index) => {
    const item = medicoes[index];
    setParte(item.parte);
    setValor(item.valor);
    setData(item.data);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    const atualizadas = medicoes.filter((_, i) => i !== index);
    setMedicoes(atualizadas);
    resetForm();
  };

  return (
    <div className="p-4 pb-24 sm:p-6 md:p-8 lg:p-10 max-w-screen-md mx-auto">
      <h1 className="text-xl font-bold text-center mb-4">Medições Corporais</h1>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium">Parte do Corpo</label>
          <input
            type="text"
            value={parte}
            onChange={(e) => setParte(e.target.value)}
            required
            className="w-full p-2 border rounded-md mt-1"
            placeholder="Ex: Braço esquerdo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Valor (cm)</label>
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            className="w-full p-2 border rounded-md mt-1"
            placeholder="Ex: 35"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="w-full p-2 border rounded-md mt-1"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
        >
          {editIndex !== null ? "Atualizar Medição" : "Registrar Medição"}
        </button>
      </form>

      {/* Lista de medições */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Histórico de Medições</h2>
        {medicoes.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma medição registrada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {medicoes.map((item, index) => (
              <li
                key={index}
                className="bg-gray-100 p-3 rounded-lg flex justify-between items-center shadow-sm"
              >
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Ruler size={16} /> {item.parte}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.valor} cm em {item.data}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Medicoes;
