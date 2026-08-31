// js/api.js — tiny fetch wrapper + auth-state helpers shared by every page.
// The backend is served from the same origin (Express serves this frontend),
// so relative URLs like '/api/...' work whether you run this on localhost
// or deploy it behind your own domain.

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('ss_token');
}
function getUser() {
  const raw = localStorage.getItem('ss_user');
  return raw ? JSON.parse(raw) : null;
}
function setSession(token, user) {
  localStorage.setItem('ss_token', token);
  localStorage.setItem('ss_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('ss_token');
  localStorage.removeItem('ss_user');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }

  if (!res.ok) {
    const message = (data && data.error) || 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  return data;
}

// ---- Header: renders logged-in / logged-out state on every page that includes it ----
function renderAuthHeader() {
  const loggedOut = document.getElementById('loggedOutActions');
  const loggedIn = document.getElementById('loggedInActions');
  if (!loggedOut || !loggedIn) return;

  const user = getUser();
  if (user) {
    loggedOut.style.display = 'none';
    loggedIn.style.display = 'flex';
    const avatar = document.getElementById('userAvatar');
    const name = document.getElementById('userName');
    if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
    if (name) name.innerHTML = user.name + '<small>' + user.role + '</small>';
  } else {
    loggedOut.style.display = 'flex';
    loggedIn.style.display = 'none';
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', renderAuthHeader);
