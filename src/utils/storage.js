// utils/storage.js
export function getUserData(key, uid) {
  const data = JSON.parse(localStorage.getItem(`${key}_${uid}`)) || [];
  return data;
}

export function saveUserData(key, uid, newData) {
  localStorage.setItem(`${key}_${uid}`, JSON.stringify(newData));
}
