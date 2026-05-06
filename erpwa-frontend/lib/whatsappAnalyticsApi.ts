import api from "./api";

export const whatsappAnalyticsAPI = {
  // Full billing summary
  getBillingSummary: (vendorId: string) =>
    api.get(`/analytics/whatsapp/vendor/${vendorId}`),

  // Dashboard quick stats
  getDashboardSummary: (vendorId: string) =>
    api.get(`/analytics/whatsapp/vendor/${vendorId}/summary`),

  // Wallet balance + transaction history
  getWallet: (vendorId: string, limit = 50, offset = 0) =>
    api.get(`/analytics/whatsapp/vendor/${vendorId}/wallet`, {
      params: { limit, offset },
    }),

  // Conversations list (paginated)
  getConversations: (
    vendorId: string,
    params?: { limit?: number; offset?: number; category?: string }
  ) =>
    api.get(`/analytics/whatsapp/vendor/${vendorId}/conversations`, {
      params,
    }),

  // Messages list (paginated)
  getMessages: (
    vendorId: string,
    params?: {
      limit?: number;
      offset?: number;
      from?: string;
      to?: string;
      direction?: string;
    }
  ) =>
    api.get(`/analytics/whatsapp/vendor/${vendorId}/messages`, {
      params,
    }),
};
