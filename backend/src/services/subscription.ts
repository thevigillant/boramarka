import { prisma } from '../db';

export interface PlanLimitConfig {
  maxBookingsPerMonth: number;
  maxCustomers: number;
  maxEmployees: number;
  maxServices: number;
  maxLinks: number;
}

export const PLAN_LIMITS: Record<string, PlanLimitConfig> = {
  trialing: {
    maxBookingsPerMonth: 50,
    maxCustomers: 100,
    maxEmployees: 2,
    maxServices: 10,
    maxLinks: 2,
  },
  mensal: {
    maxBookingsPerMonth: 500,
    maxCustomers: 1500,
    maxEmployees: 5,
    maxServices: 30,
    maxLinks: 10,
  },
  anual: {
    maxBookingsPerMonth: 2500,
    maxCustomers: 8000,
    maxEmployees: 20,
    maxServices: 100,
    maxLinks: 30,
  },
  premium: {
    maxBookingsPerMonth: Infinity,
    maxCustomers: Infinity,
    maxEmployees: Infinity,
    maxServices: Infinity,
    maxLinks: Infinity,
  },
};

export async function checkAndUpdateSubscription(adminId: number) {
  let subscription = await prisma.subscription.findUnique({
    where: { adminId }
  });

  if (!subscription) {
    // If user has no subscription record, create a 7-day trial subscription
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    subscription = await prisma.subscription.create({
      data: {
        adminId,
        status: 'trialing',
        plan: 'mensal',
        trialEndsAt,
      }
    });
  }

  // Auto-expire trials
  if (subscription.status === 'trialing' && subscription.trialEndsAt && new Date() > subscription.trialEndsAt) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'inactive' }
    });
  }

  // Auto-expire active subscriptions
  if (subscription.status === 'active' && subscription.expiresAt && new Date() > subscription.expiresAt) {
    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'inactive' }
    });
  }

  return subscription;
}

export async function getUsageStats(adminId: number) {
  const subscription = await checkAndUpdateSubscription(adminId);
  const planKey = subscription.status === 'trialing' ? 'trialing' : (subscription.plan || 'mensal').toLowerCase();
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.mensal;

  // Calculate current month's start date
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Current month bookings count
  const monthlyBookingsCount = await prisma.booking.count({
    where: {
      timeSlot: {
        link: {
          adminId
        }
      },
      createdAt: {
        gte: startOfMonth
      }
    }
  });

  // 2. Customers count
  const customersCount = await prisma.customerContact.count({
    where: { adminId }
  });

  // 3. Employees count
  const employeesCount = await prisma.employee.count({
    where: { adminId, status: { not: 'DISMISSED' } }
  });

  // 4. Services count
  const servicesCount = await prisma.service.count({
    where: { adminId }
  });

  // 5. Scheduling Links count
  const linksCount = await prisma.schedulingLink.count({
    where: { adminId, deletedAt: null }
  });

  return {
    plan: subscription.plan,
    status: subscription.status,
    trialEndsAt: subscription.trialEndsAt,
    expiresAt: subscription.expiresAt,
    limits: {
      maxBookingsPerMonth: limits.maxBookingsPerMonth === Infinity ? null : limits.maxBookingsPerMonth,
      maxCustomers: limits.maxCustomers === Infinity ? null : limits.maxCustomers,
      maxEmployees: limits.maxEmployees === Infinity ? null : limits.maxEmployees,
      maxServices: limits.maxServices === Infinity ? null : limits.maxServices,
      maxLinks: limits.maxLinks === Infinity ? null : limits.maxLinks,
    },
    usage: {
      bookingsThisMonth: monthlyBookingsCount,
      customers: customersCount,
      employees: employeesCount,
      services: servicesCount,
      links: linksCount,
    }
  };
}

export async function checkQuota(
  adminId: number,
  resource: 'bookings' | 'customers' | 'employees' | 'services' | 'links'
): Promise<{ allowed: boolean; message?: string; limit?: number | null; current?: number }> {
  const stats = await getUsageStats(adminId);

  if (stats.status === 'inactive') {
    return {
      allowed: false,
      message: 'Sua assinatura ou período de testes está inativo. Por favor, assine um plano para continuar.'
    };
  }

  let limit: number | null = null;
  let current = 0;
  let resourceName = '';

  switch (resource) {
    case 'bookings':
      limit = stats.limits.maxBookingsPerMonth;
      current = stats.usage.bookingsThisMonth;
      resourceName = 'agendamentos mensais';
      break;
    case 'customers':
      limit = stats.limits.maxCustomers;
      current = stats.usage.customers;
      resourceName = 'clientes cadastrados';
      break;
    case 'employees':
      limit = stats.limits.maxEmployees;
      current = stats.usage.employees;
      resourceName = 'colaboradores na equipe';
      break;
    case 'services':
      limit = stats.limits.maxServices;
      current = stats.usage.services;
      resourceName = 'serviços cadastrados';
      break;
    case 'links':
      limit = stats.limits.maxLinks;
      current = stats.usage.links;
      resourceName = 'links de agendamento ativos';
      break;
  }

  if (limit !== null && current >= limit) {
    return {
      allowed: false,
      limit,
      current,
      message: `Limite de ${limit} ${resourceName} do seu plano atual (${stats.plan.toUpperCase()}) foi atingido. Faça upgrade para continuar liberando capacidade!`
    };
  }

  return { allowed: true };
}
