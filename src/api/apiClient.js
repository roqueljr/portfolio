const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  const { method = 'GET', body, formData, headers = {} } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: formData ? headers : { 'Content-Type': 'application/json', ...headers },
    body: formData || (body === undefined ? undefined : JSON.stringify(body)),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof data === 'object' ? (data.error || data.message) : data;
    throw new ApiError(message || `Request failed (${response.status})`, response.status, data);
  }
  return data;
}

function requireEntityId(id, action, entityName) {
  if (id === undefined || id === null || id === '') {
    throw new ApiError(`Cannot ${action} ${entityName}: missing record ID.`, 400, {
      error: 'Missing record ID.',
      entity: entityName,
      action,
    });
  }
  return id;
}

function entityHandler(name) {
  return {
    list(sort, limit, skip, fields) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      if (skip) params.set('skip', String(skip));
      if (fields) params.set('fields', Array.isArray(fields) ? fields.join(',') : fields);
      const qs = params.toString();
      return request(`/entities/${encodeURIComponent(name)}${qs ? `?${qs}` : ''}`);
    },
    filter(query, sort, limit, skip, fields) {
      const params = new URLSearchParams();
      params.set('q', JSON.stringify(query || {}));
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      if (skip) params.set('skip', String(skip));
      if (fields) params.set('fields', Array.isArray(fields) ? fields.join(',') : fields);
      return request(`/entities/${encodeURIComponent(name)}?${params}`);
    },
    get(id) {
      const safeId = requireEntityId(id, 'get', name);
      return request(`/entities/${encodeURIComponent(name)}/${encodeURIComponent(safeId)}`);
    },
    create(data) {
      return request(`/entities/${encodeURIComponent(name)}`, { method: 'POST', body: data });
    },
    update(id, data) {
      const safeId = requireEntityId(id, 'update', name);
      return request(`/entities/${encodeURIComponent(name)}/${encodeURIComponent(safeId)}`, { method: 'PUT', body: data });
    },
    delete(id) {
      const safeId = requireEntityId(id, 'delete', name);
      return request(`/entities/${encodeURIComponent(name)}/${encodeURIComponent(safeId)}`, { method: 'DELETE' });
    },
  };
}

export const api = {
  entities: new Proxy({}, {
    get(_target, name) {
      if (typeof name !== 'string') return undefined;
      return entityHandler(name);
    },
  }),
  auth: {
    me: () => request('/auth/me'),
    loginViaEmailPassword: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    register: (data) => request('/auth/register', { method: 'POST', body: data }),
    verifyOtp: (data) => request('/auth/verify-otp', { method: 'POST', body: data }),
    resendOtp: (email) => request('/auth/resend-otp', { method: 'POST', body: { email } }),
    resetPasswordRequest: (email) => request('/auth/password-reset/request', { method: 'POST', body: { email } }),
    resetPassword: (data) => request('/auth/password-reset', { method: 'POST', body: data }),
    setToken: () => {},
    redirectToLogin: (returnTo = window.location.pathname + window.location.search) => {
      const qs = returnTo && returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
      window.location.href = `/login${qs}`;
    },
    loginWithProvider: (provider, returnTo = '/') => {
      if (provider !== 'google') throw new Error(`Unsupported provider: ${provider}`);
      window.location.href = `${API_BASE}/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`;
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const form = new FormData();
        form.append('file', file);
        return request('/uploads', { method: 'POST', formData: form });
      },
    },
  },
  functions: {
    invoke(name, body) {
      if (name === 'submitContact') return request('/contact', { method: 'POST', body });
      throw new Error(`Unknown function: ${name}`);
    },
  },
};
