import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const TOKEN_KEY = 'breathe_better_locality_token';
const USER_KEY = 'breathe_better_locality_user';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // no-op
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // no-op
  }
}

export function clearLocalityAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // no-op
  }
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/locality`,
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function signup({ username, email, password }) {
  const { data } = await api.post('/auth/signup', { username, email, password });
  if (data?.token) {
    setStoredToken(data.token);
    setStoredUser(data.user);
  }
  return data;
}

export async function login({ identifier, password }) {
  const { data } = await api.post('/auth/login', { identifier, password });
  if (data?.token) {
    setStoredToken(data.token);
    setStoredUser(data.user);
  }
  return data;
}

export async function googleAuth({ credential, googleId, email, name }) {
  const { data } = await api.post('/auth/google', { credential, googleId, email, name });
  if (data?.token) {
    setStoredToken(data.token);
    setStoredUser(data.user);
  }
  return data;
}

export async function completeGoogleSignup({ googleId, email, username }) {
  const { data } = await api.post('/auth/google/complete', { googleId, email, username });
  if (data?.token) {
    setStoredToken(data.token);
    setStoredUser(data.user);
  }
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  if (data?.user) {
    setStoredUser(data.user);
  }
  return data;
}

export async function setupLocality({ localityName, latitude, longitude, radiusKm }) {
  const { data } = await api.post('/setup', { localityName, latitude, longitude, radiusKm });
  return data;
}

export async function getThreads({ latitude, longitude, radiusKm }) {
  const { data } = await api.get('/threads', {
    params: { latitude, longitude, radiusKm },
  });
  return data;
}

export async function createThread({ title, description, latitude, longitude }) {
  const { data } = await api.post('/threads', { title, description, latitude, longitude });
  return data;
}

export async function deleteThread(threadId) {
  const { data } = await api.delete(`/threads/${threadId}`);
  return data;
}

export async function notifyResolved(threadId, note) {
  const { data } = await api.post(`/threads/${threadId}/resolve-notify`, { note });
  return data;
}

export async function getMyThreads() {
  const { data } = await api.get('/my-threads');
  return data;
}

export async function getThreadMessages(threadId) {
  const { data } = await api.get(`/threads/${threadId}/messages`);
  return data;
}

export async function postThreadMessage(threadId, message) {
  const { data } = await api.post(`/threads/${threadId}/messages`, { message });
  return data;
}
