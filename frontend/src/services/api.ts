const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // If unauthorized, clear token and redirect
    if (response.status === 401 && window.location.pathname.startsWith('/dashboard')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(data.error || data.message || 'Erro desconhecido');
  }

  return data as T;
}

export const api = {
  // ═══ Auth ═══
  checkAccount: () =>
    request<{ hasAccount: boolean }>('/auth/check'),

  register: (data: {
    username: string;
    password: string;
    businessName?: string;
    cnpj?: string;
    phone?: string;
    description?: string;
    photoUrl?: string;
    address?: string;
    operatingHours?: string;
  }) =>
    request<{ token: string; username: string; businessName: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // ═══ Profile ═══
  getProfile: () =>
    request<{
      username: string;
      businessName: string;
      cnpj: string;
      phone: string;
      description: string;
      photoUrl: string;
      address: string;
      operatingHours: string;
    }>('/admin/profile'),

  updateProfile: (data: {
    username?: string;
    businessName?: string;
    cnpj?: string;
    phone?: string;
    description?: string;
    photoUrl?: string;
    address?: string;
    operatingHours?: string;
  }) =>
    request('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // ═══ Stats ═══
  getStats: () =>
    request<{ totalLinks: number; totalSlots: number; totalBookings: number; availableSlots: number }>('/admin/stats'),

  // ═══ Links ═══
  getLinks: () =>
    request<Array<{
      id: number;
      token: string;
      title: string;
      createdAt: string;
      totalSlots: number;
      availableSlots: number;
      bookedSlots: number;
    }>>('/admin/links'),

  createLink: (title: string, serviceId?: number) =>
    request('/admin/links', { method: 'POST', body: JSON.stringify({ title, serviceId }) }),

  getDeletedLinks: () =>
    request<Array<{
      id: number;
      token: string;
      title: string;
      createdAt: string;
      deletedAt: string;
      service: { name: string; price: number } | null;
    }>>('/admin/links/deleted'),

  deleteLink: (id: number) =>
    request(`/admin/links/${id}`, { method: 'DELETE' }),

  restoreLink: (id: number) =>
    request(`/admin/links/${id}/restore`, { method: 'PUT' }),

  deleteLinkPermanent: (id: number) =>
    request(`/admin/links/${id}/permanent`, { method: 'DELETE' }),

  regenerateLink: (id: number) =>
    request(`/admin/links/${id}/regenerate`, { method: 'PUT' }),

  // ═══ Slots ═══
  getSlots: (linkId: number) =>
    request<Array<{
      id: number;
      date: string;
      time: string;
      isAvailable: boolean;
      booking: { id: number; clientName: string; clientPhone: string; createdAt: string } | null;
    }>>(`/admin/slots?linkId=${linkId}`),

  createSlots: (linkId: number, slots: { date: string; time: string }[]) =>
    request<{ count: number; skipped: number }>('/admin/slots', {
      method: 'POST',
      body: JSON.stringify({ linkId, slots }),
    }),

  deleteSlot: (id: number) =>
    request(`/admin/slots/${id}`, { method: 'DELETE' }),

  // ═══ Services ═══
  getServices: () =>
    request<Array<{
      id: number;
      name: string;
      description: string | null;
      price: number;
      duration: number;
      createdAt: string;
    }>>('/services'),

  createService: (data: { name: string; description?: string; price: number; duration: number }) =>
    request('/services', { method: 'POST', body: JSON.stringify(data) }),

  updateService: (id: number, data: { name?: string; description?: string; price?: number; duration?: number }) =>
    request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteService: (id: number) =>
    request(`/services/${id}`, { method: 'DELETE' }),

  // ═══ Bookings ═══
  getBookings: (linkId?: number) =>
    request<Array<{
      id: number;
      clientName: string;
      clientPhone: string;
      status: string;
      createdAt: string;
      timeSlot: {
        date: string;
        time: string;
        link: {
          title: string;
          token: string;
          service: {
            id: number;
            name: string;
            price: number;
            duration: number;
          } | null;
        };
      };
    }>>(`/admin/bookings${linkId ? `?linkId=${linkId}` : ''}`),

  confirmBooking: (id: number) =>
    request(`/admin/bookings/${id}/confirm`, { method: 'PUT' }),

  createManualBooking: (data: {
    linkId: number;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
  }) =>
    request('/admin/bookings/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancelBooking: (id: number) =>
    request(`/admin/bookings/${id}`, { method: 'DELETE' }),

  // ═══ Finance ═══
  getFinanceStats: () =>
    request<{
      totalReceivable: number;
      totalPayable: number;
      receivedAmount: number;
      paidAmount: number;
      pendingReceivable: number;
      pendingPayable: number;
      balance: number;
    }>('/finance/stats'),

  getTransactions: (params?: { type?: 'receivable' | 'payable'; paid?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.paid !== undefined) query.append('paid', params.paid.toString());
    return request<Array<{
      id: number;
      type: 'receivable' | 'payable';
      description: string;
      amount: number;
      dueDate: string;
      paid: boolean;
      paidAt: string | null;
      clientName: string;
      category: string;
      notes: string;
      createdAt: string;
    }>>(`/finance/transactions?${query.toString()}`);
  },

  createTransaction: (data: {
    type: 'receivable' | 'payable';
    description: string;
    amount: number;
    dueDate: string;
    clientName?: string;
    category?: string;
    notes?: string;
    paid?: boolean;
  }) =>
    request('/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleTransactionPaid: (id: number) =>
    request(`/finance/transactions/${id}/toggle`, { method: 'PUT' }),

  deleteTransaction: (id: number) =>
    request(`/finance/transactions/${id}`, { method: 'DELETE' }),

  // ═══ Schedule (Public) ═══
  getPublicProfile: (username: string) =>
    request<{
      businessName: string;
      description: string;
      photoUrl: string;
      links: Array<{
        id: number;
        token: string;
        title: string;
        service: {
          name: string;
          price: number;
          duration: number;
          description: string | null;
        } | null;
      }>;
    }>(`/schedule/p/${username}`),

  getSchedule: (token: string) =>
    request<{
      title: string;
      dates: string[];
      slotsByDate: Record<string, { id: number; time: string }[]>;
    }>(`/schedule/${token}`),

  bookSlot: (token: string, data: { timeSlotId: number; clientName: string; clientPhone: string }) =>
    request<{
      booking: { id: number; clientName: string; clientPhone: string; date: string; time: string };
      whatsapp: { success: boolean; method: 'api' | 'link'; link?: string };
    }>(`/schedule/${token}/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ═══ Billing (Assinaturas) ═══
  getSubscriptionStatus: () =>
    request<{
      id: number;
      plan: 'mensal' | 'anual';
      status: 'active' | 'inactive' | 'pending';
      expiresAt: string | null;
    }>('/billing/status'),

  createCheckout: (plan: 'mensal' | 'anual') =>
    request<{ init_point: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),
};
