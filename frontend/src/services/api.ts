const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
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
    if (response.status === 401 && (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/superadmin'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
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
    email?: string;
    password: string;
    businessName?: string;
    cnpj?: string;
    phone?: string;
    description?: string;
    photoUrl?: string;
    address?: string;
    operatingHours?: string;
  }) =>
    request<{ token: string; username: string; businessName: string; role?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (username: string, password: string) =>
    request<{ token: string; username: string; role?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),


  // ═══ Profile ═══
  getProfile: () =>
    request<{
      username: string;
      email?: string;
      businessName: string;
      cnpj: string;
      phone: string;
      description: string;
      photoUrl: string;
      address: string;
      operatingHours: string;
      mpAccessToken?: string;
      accentColor?: string;
      secondaryColor?: string;
      publicTheme?: string;
      bannerUrl?: string;
      customDomain?: string;
    }>('/admin/profile'),

  updateProfile: (data: {
    username?: string;
    email?: string;
    businessName?: string;
    cnpj?: string;
    phone?: string;
    description?: string;
    photoUrl?: string;
    address?: string;
    operatingHours?: string;
    mpAccessToken?: string;
    accentColor?: string;
    secondaryColor?: string;
    publicTheme?: string;
    bannerUrl?: string;
    customDomain?: string | null;
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
      bookingFeeEnabled: boolean;
      bookingFeeAmount: number;
      service: { id: number; name: string; price: number } | null;
    }>>('/admin/links'),

  createLink: (title: string, serviceId?: number | null, bookingFeeEnabled?: boolean, bookingFeeAmount?: number) =>
    request('/admin/links', { method: 'POST', body: JSON.stringify({ title, serviceId, bookingFeeEnabled, bookingFeeAmount }) }),

  updateLink: (id: number, data: { title?: string; serviceId?: number | null; bookingFeeEnabled?: boolean; bookingFeeAmount?: number }) =>
    request(`/admin/links/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

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
      phone: string;
      address: string;
      isInactive?: boolean;
      accentColor?: string;
      secondaryColor?: string;
      publicTheme?: string;
      bannerUrl?: string;
      services: Array<{
        id: number;
        name: string;
        price: number;
        duration: number;
        description: string | null;
      }>;
    }>(`/schedule/p/${username}`),

  getPublicProfileByHost: (host: string) =>
    request<{
      businessName: string;
      description: string;
      photoUrl: string;
      phone: string;
      address: string;
      isInactive?: boolean;
      accentColor?: string;
      secondaryColor?: string;
      publicTheme?: string;
      bannerUrl?: string;
      services: Array<{
        id: number;
        name: string;
        price: number;
        duration: number;
        description: string | null;
      }>;
    }>(`/schedule/by-host?host=${encodeURIComponent(host)}`),

  getSchedule: (token: string) =>
    request<{
      title: string;
      dates: string[];
      slotsByDate: Record<string, { id: number; time: string }[]>;
      bookingFeeEnabled: boolean;
      bookingFeeAmount: number;
      serviceName: string;
      servicePrice: number;
      activeCoupons?: Array<{
        code: string;
        discountType: 'percentage' | 'fixed';
        discountValue: number;
      }>;
      accentColor?: string;
      secondaryColor?: string;
      publicTheme?: string;
    }>(`/schedule/${token}`),

  bookSlot: (token: string, data: { timeSlotId: number; clientName: string; clientPhone: string; payFullPrice?: boolean }) =>
    request<{
      booking: { id: number; clientName: string; clientPhone: string; date: string; time: string };
      whatsapp: { success: boolean; method: 'api' | 'link'; link?: string };
      paymentRequired?: boolean;
      paymentAmount?: number;
      payFullPrice?: boolean;
      paymentUrl?: string;
    }>(`/schedule/${token}/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirmSimulationBooking: (id: number, payFullPrice?: boolean) =>
    request<{ success: boolean; booking: any }>(`/schedule/booking/${id}/confirm-simulation`, {
      method: 'POST',
      body: JSON.stringify({ payFullPrice }),
    }),

  getPublicBookingDetails: (id: number) =>
    request<{
      id: number;
      clientName: string;
      clientPhone: string;
      date: string;
      time: string;
      businessName: string;
      businessPhone: string;
      businessUsername: string;
      serviceName: string;
      price: number;
    }>(`/schedule/booking/${id}`),

  cancelPublicBooking: (id: number) =>
    request<{ success: boolean }>(`/schedule/booking/${id}/cancel`, {
      method: 'POST'
    }),

  reschedulePublicBooking: (id: number, newTimeSlotId: number) =>
    request<{ success: boolean }>(`/schedule/booking/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ newTimeSlotId })
    }),

  // ═══ Billing (Assinaturas) ═══
  getSubscriptionStatus: () =>
    request<{
      id: number;
      plan: 'mensal' | 'anual' | 'premium';
      status: 'active' | 'inactive' | 'pending' | 'trialing';
      expiresAt: string | null;
      trialEndsAt: string | null;
    }>('/billing/status'),

  createCheckout: (plan: 'mensal' | 'anual' | 'premium') =>
    request<{ init_point: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  // ═══ Super Admin ═══
  getSuperAdminStats: () =>
    request<{
      totalUsers: number;
      totalBookings: number;
      activeSubscriptions: number;
      trialingSubscriptions: number;
      estimatedMonthlyRevenue: number;
    }>('/superadmin/stats'),

  getSuperAdminUsers: () =>
    request<Array<{
      id: number;
      username: string;
      businessName: string;
      cnpj: string;
      phone: string;
      createdAt: string;
      bookingsCount: number;
      subscription: {
        plan: string;
        status: string;
        expiresAt: string | null;
        trialEndsAt: string | null;
      } | null;
      _count: {
        links: number;
        services: number;
      }
    }>>('/superadmin/users'),

  updateUserSubscription: (id: number, data: { plan?: string; status?: string; expiresAt?: string | null }) =>
    request(`/superadmin/users/${id}/subscription`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: number) =>
    request<{ success: boolean; message: string }>(`/superadmin/users/${id}`, {
      method: 'DELETE',
    }),

  // ═══ Coupons ═══
  getCoupons: () =>
    request<Array<{
      id: number;
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      active: boolean;
      createdAt: string;
    }>>('/admin/coupons'),

  createCoupon: (data: { code: string; discountType: 'percentage' | 'fixed'; discountValue: number }) =>
    request('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteCoupon: (id: number) =>
    request(`/admin/coupons/${id}`, {
      method: 'DELETE',
    }),

  validateCoupon: (token: string, code: string) =>
    request<{
      valid: boolean;
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
    }>(`/schedule/${token}/validate-coupon?code=${code}`),

  // ═══ Google Calendar ═══
  getGoogleCalendarStatus: () =>
    request<{ connected: boolean; email: string }>('/admin/google-calendar/status'),

  disconnectGoogleCalendar: () =>
    request('/admin/google-calendar/disconnect', {
      method: 'POST',
    }),

  // ═══ Memberships ═══
  getMembershipPlans: () =>
    request<Array<{
      id: number;
      name: string;
      description: string;
      price: number;
      interval: 'monthly' | 'yearly';
      active: boolean;
      _count?: { subscriptions: number };
    }>>('/admin/memberships/plans'),

  createMembershipPlan: (data: { name: string; description?: string; price: number; interval: 'monthly' | 'yearly' }) =>
    request('/admin/memberships/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteMembershipPlan: (id: number) =>
    request(`/admin/memberships/plans/${id}`, {
      method: 'DELETE',
    }),

  getClientSubscriptions: () =>
    request<Array<{
      id: number;
      clientName: string;
      clientPhone: string;
      status: string;
      expiresAt: string;
      createdAt: string;
      plan: { name: string; interval: string; price: number };
    }>>('/admin/memberships/subscriptions'),

  createClientSubscription: (data: { clientName: string; clientPhone: string; planId: number }) =>
    request('/admin/memberships/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteClientSubscription: (id: number) =>
    request(`/admin/memberships/subscriptions/${id}`, {
      method: 'DELETE',
    }),

  validateClientSubscription: (token: string, phone: string) =>
    request<{
      active: boolean;
      clientName?: string;
      planName?: string;
      expiresAt?: string;
    }>(`/schedule/${token}/validate-subscription?phone=${phone}`),

  // ═══ Client CRM (History & Notes) ═══
  getClientHistory: (phone: string) =>
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
          service?: { name: string; price: number };
        };
      };
    }>>(`/admin/clients/${phone}/history`),

  getClientNotes: (phone: string) =>
    request<Array<{
      id: number;
      clientPhone: string;
      content: string;
      createdAt: string;
    }>>(`/admin/clients/${phone}/notes`),

  createClientNote: (phone: string, content: string) =>
    request(`/admin/clients/${phone}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  deleteClientNote: (id: number) =>
    request(`/admin/clients/notes/${id}`, {
      method: 'DELETE',
    }),

  // ═══ Social Networking & Chat ═══
  exploreProfessionals: (search?: string) =>
    request<Array<{
      id: number;
      username: string;
      businessName: string;
      description: string;
      photoUrl: string;
      address: string;
      phone: string;
      accentColor?: string;
      secondaryColor?: string;
    }>>(`/admin/social/explore${search ? `?q=${encodeURIComponent(search)}` : ''}`),

  getChatsInbox: () =>
    request<Array<{
      partner: { id: number; username: string; businessName: string; photoUrl: string };
      lastMessage: string;
      timestamp: string;
    }>>('/admin/social/chats'),

  getChatMessages: (partnerId: number) =>
    request<Array<{
      id: number;
      content: string;
      createdAt: string;
      senderId: number;
      receiverId: number;
    }>>(`/admin/social/chats/${partnerId}`),

  sendChatMessage: (receiverId: number, content: string) =>
    request(`/admin/social/chats/${receiverId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // ═══ Employees / RH ═══
  getEmployees: (params?: { status?: string; pendingType?: string; pendingResolved?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.pendingType) query.append('pendingType', params.pendingType);
    if (params?.pendingResolved !== undefined) query.append('pendingResolved', params.pendingResolved.toString());
    return request<Array<{
      id: number;
      name: string;
      role: string;
      phone: string;
      email: string;
      cpf: string;
      rg: string;
      birthDate: string;
      admissionDate: string;
      salary: number;
      commission: number;
      workingHours: string;
      status: 'ACTIVE' | 'DISMISSED' | 'ARCHIVED';
      dismissalDate: string;
      dismissalReason: string;
      dismissalNotes: string;
      pendingType: string;
      pendingResolved: boolean;
      pendingNotes: string;
      createdAt: string;
      documents?: Array<{
        id: number;
        title: string;
        category: string;
        fileUrl: string;
        fileName: string;
        fileSize: string;
        expiryDate: string;
        notes: string;
        createdAt: string;
      }>;
    }>>(`/admin/employees?${query.toString()}`);
  },

  createEmployee: (data: {
    name: string;
    role: string;
    phone?: string;
    email?: string;
    cpf?: string;
    rg?: string;
    birthDate?: string;
    admissionDate?: string;
    salary?: number;
    commission?: number;
    workingHours?: string;
  }) =>
    request('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEmployee: (id: number, data: any) =>
    request(`/admin/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  dismissEmployee: (id: number, data: {
    dismissalDate?: string;
    dismissalReason?: string;
    dismissalNotes?: string;
    pendingType?: string;
    pendingNotes?: string;
    pendingResolved?: boolean;
  }) =>
    request(`/admin/employees/${id}/dismiss`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resolveEmployeePending: (id: number, resolved = true) =>
    request(`/admin/employees/${id}/resolve-pending`, {
      method: 'PUT',
      body: JSON.stringify({ resolved }),
    }),

  archiveEmployee: (id: number) =>
    request(`/admin/employees/${id}/archive`, {
      method: 'PUT',
    }),

  restoreEmployee: (id: number) =>
    request(`/admin/employees/${id}/restore`, {
      method: 'PUT',
    }),

  deleteEmployee: (id: number) =>
    request(`/admin/employees/${id}`, {
      method: 'DELETE',
    }),

  getEmployeeDocuments: (employeeId: number) =>
    request<Array<{
      id: number;
      title: string;
      category: string;
      fileUrl: string;
      fileName: string;
      fileSize: string;
      expiryDate: string;
      notes: string;
      createdAt: string;
    }>>(`/admin/employees/${employeeId}/documents`),

  addEmployeeDocument: (employeeId: number, data: {
    title: string;
    category?: string;
    fileUrl: string;
    fileName?: string;
    fileSize?: string;
    expiryDate?: string;
    notes?: string;
  }) =>
    request(`/admin/employees/${employeeId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteEmployeeDocument: (documentId: number) =>
    request(`/admin/employees/documents/${documentId}`, {
      method: 'DELETE',
    }),

  impersonateUser: (id: number) =>
    request<{ token: string; username: string }>(`/superadmin/users/${id}/impersonate`, {
      method: 'POST',
    }),

  impersonateSelf: () =>
    request<{ token: string; username: string }>('/superadmin/impersonate-self', {
      method: 'POST',
    }),

  getAuditLogs: (params?: { search?: string; entity?: string; action?: string; severity?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.entity) query.append('entity', params.entity);
    if (params?.action) query.append('action', params.action);
    if (params?.severity) query.append('severity', params.severity);
    return request<Array<{
      id: number;
      action: string;
      entity: string;
      entityId: string;
      details: string;
      ipAddress: string;
      userAgent: string;
      deviceInfo: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
      userName: string;
      userRole: string;
      createdAt: string;
    }>>(`/admin/audit-logs?${query.toString()}`);
  },
};
