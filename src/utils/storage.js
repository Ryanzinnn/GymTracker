// Em utils/storage.js
export function getUserData(key, uid) {
  const item = localStorage.getItem(`${key}_${uid}`);
  if (item === null) {
    return null; // Retorna null se nada for encontrado
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    console.error("Erro ao parsear dado do localStorage:", e, item);
    return null; // Retorna null se houver erro no parse
  }
}

// Sua saveUserData parece estar ok:
export function saveUserData(key, uid, newData) {
  localStorage.setItem(`${key}_${uid}`, JSON.stringify(newData));
}
