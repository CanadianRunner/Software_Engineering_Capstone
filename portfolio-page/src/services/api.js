// Every request to the backend goes through here. The base comes from the
// environment: https://localhost:5001 in development, empty in production so the
// browser calls /api/... on the same origin and Nginx forwards it.
const base = import.meta.env.VITE_API_BASE ?? '';

export const apiUrl = (path) => `${base}${path}`;

export const getCertifications = ({ cacheBust = false } = {}) =>
  fetch(apiUrl(`/api/Certifications${cacheBust ? `?timestamp=${Date.now()}` : ''}`), {
    headers: cacheBust ? { 'Cache-Control': 'no-cache' } : undefined,
  });

export const createCertification = (formData) =>
  fetch(apiUrl('/api/Certifications'), { method: 'POST', body: formData });

export const updateCertification = (id, formData) =>
  fetch(apiUrl(`/api/Certifications/${id}`), { method: 'PUT', body: formData });

export const deleteCertification = (id) =>
  fetch(apiUrl(`/api/Certifications/${id}`), { method: 'DELETE' });

export const login = (credentials) =>
  fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
