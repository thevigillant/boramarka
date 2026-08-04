const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_URL = rawApiUrl.replace(/\/+$/, '');

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

  let response: Response;
  try {
    // Timeout de 15 segundos para evitar requests pendurados
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (networkError: any) {
    // Erro de rede — servidor indisponível, sem internet, timeout, etc.
    if (networkError.name === 'AbortError') {
      throw new Error('O servidor demorou muito para responder. Tente novamente em alguns instantes.');
    }
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente em instantes.');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // Handle 502/503/504 — servidor temporariamente indisponível
  if (response.status >= 502 && response.status <= 504) {
    throw new Error('O servidor está temporariamente indisponível. Tente novamente em alguns minutos.');
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

  sendVerificationCode: (email: string, username?: string) =>
    request<{ success: boolean; message: string; devCode?: string }>('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email, username }),
    }),

  verifyEmailCode: (email: string, code: string) =>
    request<{ verified: boolean; message: string }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

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
    category?: string;
  }) =>
    request<{ token: string; username: string; businessName: string; role?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (username: string, password: string, companyUsername?: string) =>
    request<{ token: string; username: string; role?: string; businessName?: string; roleTitle?: string; permissions?: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, companyUsername }),
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
      pixKey?: string;
      accentColor?: string;
      secondaryColor?: string;
      publicTheme?: string;
      bannerUrl?: string;
      customDomain?: string;
      reminderEnabled?: boolean;
      reminderHours?: string;
      reminderChannels?: string;
      isOperator?: boolean;
      currentOperator?: any;
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
    pixKey?: string;
    accentColor?: string;
    secondaryColor?: string;
    publicTheme?: string;
    bannerUrl?: string;
    customDomain?: string | null;
    reminderEnabled?: boolean;
    reminderHours?: string;
    reminderChannels?: string;
  }) =>
    request('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // ═══ Stats ═══
  getStats: () =>
    request<{ totalLinks: number; totalSlots: number; totalBookings: number; availableSlots: number }>('/admin/stats'),

  // ═══ WhatsApp Integration ═══
  getWhatsAppStatus: () =>
    request<{ isConfigured: boolean; provider: 'meta' | 'gateway' | 'none'; details?: string }>('/admin/whatsapp/status'),

  sendWhatsAppTest: (phone: string, message?: string) =>
    request<{ success: boolean; method: 'meta' | 'gateway' | 'link'; link?: string; error?: string }>('/admin/whatsapp/test', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    }),

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
      isUpsellable?: boolean;
      upsellDiscount?: number;
      createdAt: string;
      mainUpsells?: Array<{
        id: number;
        addonService: {
          id: number;
          name: string;
          price: number;
          duration: number;
          description?: string;
        };
      }>;
    }>>('/services'),

  createService: (data: {
    name: string;
    description?: string;
    price: number;
    duration: number;
    isUpsellable?: boolean;
    upsellDiscount?: number;
    addonServiceIds?: number[];
  }) =>
    request('/services', { method: 'POST', body: JSON.stringify(data) }),

  updateService: (
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
      isUpsellable?: boolean;
      upsellDiscount?: number;
      addonServiceIds?: number[];
    }
  ) =>
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
      notes?: string;
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

  updateBookingStatus: (id: number, status: string) =>
    request(`/admin/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  updateBookingNotes: (id: number, notes: string) =>
    request(`/admin/bookings/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),

  rescheduleBooking: (id: number, data: { newTimeSlotId?: number; newDate?: string; newTime?: string }) =>
    request(`/admin/bookings/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

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

  getRevenueReport: (startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return request<{
      period: { startDate: string | null; endDate: string | null };
      summary: {
        totalRevenue: number;
        pendingRevenue: number;
        totalCompletedBookings: number;
        averageTicket: number;
      };
      byService: Array<{
        serviceId: number | null;
        serviceName: string;
        totalBookings: number;
        completedBookings: number;
        totalRevenue: number;
        pendingRevenue: number;
        avgTicket: number;
        percentageOfTotal: number;
      }>;
    }>(`/finance/revenue-report?${query.toString()}`);
  },

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
      availableUpsells?: Array<{
        id: number;
        name: string;
        price: number;
        duration: number;
        description?: string;
        upsellDiscount?: number;
      }>;
      accentColor?: string;
      secondaryColor?: string;
      publicTheme?: string;
    }>(`/schedule/${token}`),

  bookSlot: (token: string, data: { timeSlotId: number; clientName: string; clientPhone: string; payFullPrice?: boolean; addonIds?: number[] }) =>
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
      paidAmount?: number;
      status?: string;
      cancellationCode?: string;
      refundStatus?: string;
      selectedAddons?: string;
      totalAmount?: number;
    }>(`/schedule/booking/${id}`),

  cancelPublicBooking: (id: number, code?: string) =>
    request<{ success: boolean; refundPending?: boolean; refundAmount?: number; message?: string }>(`/schedule/booking/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ code })
    }),

  reschedulePublicBooking: (id: number, newTimeSlotId: number) =>
    request<{ success: boolean }>(`/schedule/booking/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ newTimeSlotId })
    }),

  getRefundRequests: () =>
    request<any[]>('/admin/bookings/refunds'),

  processRefund: (id: number) =>
    request<{ success: boolean; message: string }>(`/admin/bookings/${id}/refund`, {
      method: 'POST'
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

  createCheckout: (plan: 'mensal' | 'anual' | 'premium', recurring = true) =>
    request<{ init_point: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan, recurring }),
    }),

  cancelSubscription: () =>
    request<{ success: boolean; message: string }>('/billing/cancel-subscription', {
      method: 'POST',
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

  getSuperAdminMe: () =>
    request<{
      id: number;
      username: string;
      businessName: string;
      role: string;
      permissions: {
        canManageUsers: boolean;
        canManageSubscriptions: boolean;
        canManageSuperAdmins: boolean;
        canAccessSupport: boolean;
        canViewFinancials: boolean;
      };
    }>('/superadmin/me'),

  getSuperAdminAdmins: () =>
    request<Array<{
      id: number;
      username: string;
      businessName: string;
      phone: string;
      email: string;
      role: string;
      createdAt: string;
      parsedPermissions?: {
        canManageUsers: boolean;
        canManageSubscriptions: boolean;
        canManageSuperAdmins: boolean;
        canAccessSupport: boolean;
        canViewFinancials: boolean;
      };
    }>>('/superadmin/admins'),

  createSuperAdminAccount: (data: {
    username: string;
    password: string;
    businessName?: string;
    phone?: string;
    email?: string;
    permissions?: {
      canManageUsers?: boolean;
      canManageSubscriptions?: boolean;
      canManageSuperAdmins?: boolean;
      canAccessSupport?: boolean;
      canViewFinancials?: boolean;
    };
  }) =>
    request<{ id: number; username: string; businessName: string; role: string }>('/superadmin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSuperAdminPermissions: (id: number, permissions: Record<string, boolean>) =>
    request<{ id: number; username: string }>(`/superadmin/admins/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  createProfessionalUser: (data: { username: string; password: string; businessName: string; phone?: string; email?: string; plan?: string; isFullAccess?: boolean }) =>
    request<{ id: number; username: string; businessName: string }>('/superadmin/create-user', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  grantTrialToUser: (id: number) =>
    request<{ status: string; expiresAt: string }>(`/superadmin/users/${id}/grant-trial`, {
      method: 'POST',
    }),

  // ═══ Support Chat & Helpdesk ═══
  createSupportTicket: (data: { subject: string; category?: string; message: string }) =>
    request<{
      id: number;
      subject: string;
      category: string;
      status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
      createdAt: string;
      updatedAt: string;
    }>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSupportTickets: () =>
    request<Array<{
      id: number;
      adminId: number;
      subject: string;
      category: string;
      status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
      priority: string;
      createdAt: string;
      updatedAt: string;
      admin?: {
        id: number;
        username: string;
        businessName: string;
        phone: string;
        email: string;
      };
      messages?: Array<{
        id: number;
        ticketId: number;
        senderRole: 'USER' | 'SUPERADMIN';
        senderName: string;
        message: string;
        createdAt: string;
      }>;
    }>>('/support/tickets'),

  getTicketDetails: (id: number) =>
    request<{
      id: number;
      adminId: number;
      subject: string;
      category: string;
      status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
      priority: string;
      createdAt: string;
      updatedAt: string;
      admin?: {
        id: number;
        username: string;
        businessName: string;
        phone: string;
        email: string;
      };
      messages: Array<{
        id: number;
        ticketId: number;
        senderRole: 'USER' | 'SUPERADMIN';
        senderName: string;
        message: string;
        createdAt: string;
      }>;
    }>(`/support/tickets/${id}`),

  sendTicketMessage: (id: number, message: string) =>
    request<{
      id: number;
      ticketId: number;
      senderRole: 'USER' | 'SUPERADMIN';
      senderName: string;
      message: string;
      createdAt: string;
    }>(`/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  updateTicketStatus: (id: number, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') =>
    request<{
      id: number;
      status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    }>(`/support/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
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

  // ═══ Employee Portal & RH Management ═══
  resetEmployeePassword: (id: number, password: string) =>
    request<{ success: boolean; message: string }>(`/admin/employees/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  toggleEmployeePortal: (id: number, portalActive: boolean) =>
    request(`/admin/employees/${id}/toggle-portal`, {
      method: 'PUT',
      body: JSON.stringify({ portalActive }),
    }),

  generateEmployeePortalLink: (id: number) =>
    request<{ token: string; employeeId: number; employeeName: string }>(`/admin/employees/${id}/generate-portal-link`, {
      method: 'POST',
    }),

  getEmployeeAccessLogs: (id: number) =>
    request<Array<{ id: number; ipAddress: string; userAgent: string; action: string; createdAt: string }>>(`/admin/employees/${id}/access-logs`),

  getEmployeePaystubs: () =>
    request<Array<{
      id: number;
      referenceMonth: string;
      grossSalary: number;
      netSalary: number;
      discounts: number;
      fileUrl: string;
      fileName: string;
      notes: string;
      signed: boolean;
      signedAt?: string;
      signatureIp?: string;
      createdAt: string;
      employee?: { id: number; name: string; role: string; cpf: string };
    }>>('/admin/employees/paystubs'),

  createEmployeePaystub: (data: {
    employeeId: number;
    referenceMonth: string;
    grossSalary?: number;
    netSalary?: number;
    discounts?: number;
    fileUrl?: string;
    fileName?: string;
    notes?: string;
  }) =>
    request('/admin/employees/paystubs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteEmployeePaystub: (id: number) =>
    request(`/admin/employees/paystubs/${id}`, {
      method: 'DELETE',
    }),

  getEmployeeAnnouncements: () =>
    request<Array<{
      id: number;
      title: string;
      content: string;
      targetGroup: string;
      priority: string;
      createdAt: string;
      _count?: { reads: number };
    }>>('/admin/employees/announcements'),

  createEmployeeAnnouncement: (data: {
    title: string;
    content: string;
    targetGroup?: string;
    priority?: string;
  }) =>
    request('/admin/employees/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteEmployeeAnnouncement: (id: number) =>
    request(`/admin/employees/announcements/${id}`, {
      method: 'DELETE',
    }),

  getEmployeeVacationRequests: () =>
    request<Array<{
      id: number;
      type: string;
      startDate: string;
      endDate: string;
      daysCount: number;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      reason: string;
      adminNotes: string;
      createdAt: string;
      employee?: { id: number; name: string; role: string };
    }>>('/admin/employees/vacation-requests'),

  updateEmployeeVacationStatus: (id: number, status: 'APPROVED' | 'REJECTED', adminNotes?: string) =>
    request(`/admin/employees/vacation-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    }),

  getEmployeeProfileRequests: () =>
    request<Array<{
      id: number;
      phone: string;
      email: string;
      address: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      createdAt: string;
      employee?: { id: number; name: string; phone: string; email: string; address: string };
    }>>('/admin/employees/profile-requests'),

  updateEmployeeProfileRequest: (id: number, status: 'APPROVED' | 'REJECTED', adminNotes?: string) =>
    request(`/admin/employees/profile-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    }),

  getEmployeeTimeRegisters: (employeeId: number) =>
    request<Array<{
      id: number;
      date: string;
      entry1: string;
      exit1: string;
      entry2: string;
      exit2: string;
      totalHours: number;
      extraHours: number;
      delayMinutes: number;
      absence: boolean;
      absenceReason: string;
      status: string;
      notes: string;
    }>>(`/admin/employees/${employeeId}/time-registers`),

  saveEmployeeTimeRegister: (employeeId: number, data: any) =>
    request(`/admin/employees/${employeeId}/time-registers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ═══ Employee Portal Endpoints ═══
  portalLogin: (data: { token?: string; login?: string; password?: string }) =>
    request<{ token: string; employee: any }>('/portal/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPortalMe: () =>
    request<any>('/portal/me'),

  getPortalTimeRegisters: () =>
    request<{
      timeRegisters: Array<any>;
      summary: { totalWorkedHours: number; totalExtraHours: number; totalDelayMinutes: number; totalAbsences: number };
    }>('/portal/time-registers'),

  punchPortalTimeRegister: () =>
    request<{ message: string; register: any }>('/portal/time-registers/punch', {
      method: 'POST',
    }),

  getPortalPaystubs: () =>
    request<Array<any>>('/portal/paystubs'),

  signPortalPaystub: (id: number) =>
    request<{ success: boolean; message: string; paystub: any }>(`/portal/paystubs/${id}/sign`, {
      method: 'POST',
    }),

  getPortalDocuments: () =>
    request<Array<any>>('/portal/documents'),

  signPortalDocument: (id: number, action: 'SIGN' | 'REJECT', rejectionReason?: string) =>
    request<{ success: boolean; message: string; document: any }>(`/portal/documents/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify({ action, rejectionReason }),
    }),

  getPortalVacations: () =>
    request<Array<any>>('/portal/vacations'),

  requestPortalVacation: (data: { type?: string; startDate: string; endDate: string; daysCount?: number; reason?: string }) =>
    request<{ message: string; vacationRequest: any }>('/portal/vacations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPortalAnnouncements: () =>
    request<Array<any>>('/portal/announcements'),

  requestPortalProfileUpdate: (data: { phone?: string; email?: string; address?: string }) =>
    request<{ message: string; request: any }>('/portal/profile-request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  impersonateUser: (id: number) =>
    request<{ token: string; username: string }>(`/superadmin/users/${id}/impersonate`, {
      method: 'POST',
    }),

  impersonateSelf: () =>
    request<{ token: string; username: string }>('/superadmin/impersonate-self', {
      method: 'POST',
    }),

  grantFullAccessToUser: (userId: number) =>
    request(`/superadmin/users/${userId}/grant-full-access`, { method: 'POST' }),

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

  // ═══ Reminders ═══
  getReminderLogs: (limit = 50, offset = 0) =>
    request<{
      logs: Array<{
        id: number;
        bookingId: number;
        channel: string;
        status: string;
        message: string;
        hoursLabel: string;
        clientName: string;
        clientPhone: string;
        createdAt: string;
      }>;
      total: number;
    }>(`/admin/reminders/log?limit=${limit}&offset=${offset}`),

  // ═══ Push Notifications (Public) ═══
  getVapidKey: () =>
    request<{ vapidPublicKey: string; configured: boolean }>('/schedule/vapid-key'),

  subscribeToPush: (token: string, subscription: PushSubscriptionJSON, clientPhone: string) =>
    request<{ success: boolean }>('/schedule/push-subscribe', {
      method: 'POST',
      body: JSON.stringify({ token, subscription, clientPhone }),
    }),

  subscribeAdminPush: (subscription: PushSubscriptionJSON) =>
    request<{ success: boolean }>('/schedule/push-subscribe-admin', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    }),

  // ═══ Cartões de Fidelidade ═══
  getLoyaltyConfig: () =>
    request<{
      loyaltyEnabled: boolean;
      loyaltyTarget: number;
      loyaltyRewardType: string;
      loyaltyRewardValue: number;
    }>('/loyalty/config'),

  updateLoyaltyConfig: (data: {
    loyaltyEnabled?: boolean;
    loyaltyTarget?: number;
    loyaltyRewardType?: string;
    loyaltyRewardValue?: number;
  }) =>
    request<{
      loyaltyEnabled: boolean;
      loyaltyTarget: number;
      loyaltyRewardType: string;
      loyaltyRewardValue: number;
    }>('/loyalty/config', { method: 'PUT', body: JSON.stringify(data) }),

  getLoyaltyCards: () =>
    request<Array<{
      id: number;
      clientPhone: string;
      clientName: string;
      stampsCount: number;
      rewardsEarned: number;
      rewardCouponCode: string;
      createdAt: string;
      updatedAt: string;
    }>>('/loyalty/cards'),

  updateLoyaltyStamp: (data: { clientPhone: string; clientName?: string; action: 'add' | 'remove' | 'reset' }) =>
    request<{ success: boolean; message: string }>('/loyalty/stamp', { method: 'POST', body: JSON.stringify(data) }),

  getPublicLoyaltyStatus: (username: string, clientPhone: string) =>
    request<{
      enabled: boolean;
      target?: number;
      rewardType?: string;
      rewardValue?: number;
      stampsCount?: number;
      rewardsEarned?: number;
      rewardCouponCode?: string;
    }>(`/loyalty/public/${username}/${clientPhone}`),

  // Security & User Permissions Module
  getSecurityPermissions: () =>
    request<UserPermissionItem[]>('/security/permissions'),

  createSecurityPermission: (data: Partial<UserPermissionItem>) =>
    request<UserPermissionItem>('/security/permissions', { method: 'POST', body: JSON.stringify(data) }),

  updateSecurityPermission: (id: number, data: Partial<UserPermissionItem>) =>
    request<UserPermissionItem>(`/security/permissions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSecurityPermission: (id: number) =>
    request<{ success: boolean; message: string }>(`/security/permissions/${id}`, { method: 'DELETE' }),

  // CRM Chat & Customer Service Module
  getCrmContacts: (params?: { q?: string; status?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.append('q', params.q);
    if (params?.status) search.append('status', params.status);
    const queryStr = search.toString() ? `?${search.toString()}` : '';
    return request<CustomerContactItem[]>(`/admin/crm-chat/contacts${queryStr}`);
  },

  createCrmContact: (data: { name: string; phone: string; email?: string; status?: string; notes?: string; tags?: string[]; avatarUrl?: string }) =>
    request<CustomerContactItem>('/admin/crm-chat/contacts', { method: 'POST', body: JSON.stringify(data) }),

  updateCrmContact: (id: number, data: Omit<Partial<CustomerContactItem>, 'tags'> & { tags?: string[] | string }) =>
    request<CustomerContactItem>(`/admin/crm-chat/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCrmContact: (id: number) =>
    request<{ success: boolean; message: string }>(`/admin/crm-chat/contacts/${id}`, { method: 'DELETE' }),

  getCrmMessages: (contactId: number) =>
    request<ClientChatMessageItem[]>(`/admin/crm-chat/contacts/${contactId}/messages`),

  sendCrmMessage: (contactId: number, data: { content?: string; messageType?: string; mediaUrl?: string; mediaName?: string; mediaDuration?: number }) =>
    request<ClientChatMessageItem>(`/admin/crm-chat/contacts/${contactId}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  simulateClientReply: (contactId: number, data: { content?: string; messageType?: string; mediaUrl?: string; mediaName?: string; mediaDuration?: number }) =>
    request<ClientChatMessageItem>(`/admin/crm-chat/contacts/${contactId}/simulate-client-reply`, { method: 'POST', body: JSON.stringify(data) }),

  getCrmTemplates: () =>
    request<QuickReplyTemplateItem[]>('/admin/crm-chat/templates'),

  createCrmTemplate: (data: { shortcut: string; title: string; content: string; category?: string }) =>
    request<QuickReplyTemplateItem>('/admin/crm-chat/templates', { method: 'POST', body: JSON.stringify(data) }),

  updateCrmTemplate: (id: number, data: Partial<QuickReplyTemplateItem>) =>
    request<QuickReplyTemplateItem>(`/admin/crm-chat/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCrmTemplate: (id: number) =>
    request<{ success: boolean; message: string }>(`/admin/crm-chat/templates/${id}`, { method: 'DELETE' }),

  getSubscriptionUsage: () =>
    request<SubscriptionUsageData>('/billing/usage'),

  // ═══ Analytics ═══
  getAnalytics: () =>
    request<AnalyticsData>('/admin/analytics'),
};

export interface AnalyticsData {
  revenueByMonth: { month: string; total: number }[];
  bookingsByWeekday: { day: number; count: number }[];
  topServices: { name: string; count: number; revenue: number }[];
  statusDistribution: Record<string, number>;
  trends: {
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueChangePercent: number;
  };
}

export interface SubscriptionUsageData {
  plan: string;
  status: string;
  trialEndsAt?: string;
  expiresAt?: string;
  limits: {
    maxBookingsPerMonth: number | null;
    maxCustomers: number | null;
    maxEmployees: number | null;
    maxServices: number | null;
    maxLinks: number | null;
  };
  usage: {
    bookingsThisMonth: number;
    customers: number;
    employees: number;
    services: number;
    links: number;
  };
}

export interface UserPermissionItem {
  id: number;
  userName: string;
  email: string;
  password?: string;
  roleTitle: string;
  
  // Módulo: Operacional
  canAgendamentos?: boolean;
  canEstornos?: boolean;
  canClientes?: boolean;
  canHorarios?: boolean;

  // Módulo: Comercial
  canServicos?: boolean;
  canLinks?: boolean;
  canCupons?: boolean;
  canMemberships?: boolean;

  // Módulo: Gestão & Finanças
  canFinanceiro?: boolean;
  canRh?: boolean;
  canFaturamento?: boolean;

  // Módulo: Sistema & Ajustes
  canSeguranca?: boolean;
  canPersonalizar?: boolean;
  canSocial?: boolean;
  canAudit?: boolean;
  canTrash?: boolean;

  // Legacy
  canViewBookings?: boolean;
  canManageBookings?: boolean;
  canViewFinance?: boolean;
  canManageFinance?: boolean;
  canManageServices?: boolean;
  canViewClients?: boolean;
  canManageClients?: boolean;
  canManageLoyalty?: boolean;
  canManageStaff?: boolean;
  canManageSettings?: boolean;
  canViewAuditLogs?: boolean;

  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerContactItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  status: string;
  notes: string;
  tags: string; // JSON string
  lastInteraction: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  messages?: ClientChatMessageItem[];
}

export interface ClientChatMessageItem {
  id: number;
  contactId: number;
  senderType: 'STAFF' | 'CLIENT';
  senderName: string;
  messageType: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'TEMPLATE';
  content: string;
  mediaUrl: string;
  mediaName: string;
  mediaDuration: number;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  whatsappLink?: string;
  whatsappMethod?: 'api' | 'link';
}

export interface QuickReplyTemplateItem {
  id: number;
  shortcut: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

