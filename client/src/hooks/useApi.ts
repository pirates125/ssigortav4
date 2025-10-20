import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  apiClient,
  Customer,
  CustomerRequest,
  LoginRequest,
  TwoFARequest,
} from "@/lib/api";
import { toast } from "react-hot-toast";

// Auth hooks
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => apiClient.login(credentials),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Giriş başarılı!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Giriş başarısız");
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.clear();
      toast.success("Çıkış yapıldı");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Çıkış başarısız");
    },
  });
};

export const useVerify2FA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TwoFARequest) => apiClient.verify2FA(data.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("2FA doğrulaması başarılı!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "2FA doğrulaması başarısız");
    },
  });
};

export const useEnable2FA = () => {
  return useMutation({
    mutationFn: (password: string) => apiClient.enable2FA(password),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "2FA etkinleştirme başarısız");
    },
  });
};

export const useVerify2FASetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => apiClient.verify2FASetup(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("2FA başarıyla etkinleştirildi!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "2FA kurulumu başarısız");
    },
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.getMe(),
    enabled: true, // Enable fetching
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Customer hooks
export const useCustomers = (params?: {
  query?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => apiClient.getCustomers(params),
    enabled: true, // Enable fetching
  });
};

export const useCustomer = (id: number) => {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => apiClient.getCustomer(id),
    enabled: apiClient.isAuthenticated() && !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customer: CustomerRequest) =>
      apiClient.createCustomer(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Müşteri başarıyla oluşturuldu!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Müşteri oluşturma başarısız");
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, customer }: { id: number; customer: CustomerRequest }) =>
      apiClient.updateCustomer(id, customer),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      toast.success("Müşteri başarıyla güncellendi!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Müşteri güncelleme başarısız"
      );
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Müşteri başarıyla silindi!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Müşteri silme başarısız");
    },
  });
};

// Branch hooks
export const useBranches = (params?: {
  query?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["branches", params],
    queryFn: () => apiClient.getBranches(params),
    enabled: apiClient.isAuthenticated(),
  });
};

export const useBranch = (id: number) => {
  return useQuery({
    queryKey: ["branch", id],
    queryFn: () => apiClient.getBranch(id),
    enabled: apiClient.isAuthenticated() && !!id,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (branch: any) => apiClient.createBranch(branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Şube başarıyla oluşturuldu!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Şube oluşturma başarısız");
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, branch }: { id: number; branch: any }) =>
      apiClient.updateBranch(id, branch),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      queryClient.invalidateQueries({ queryKey: ["branch", id] });
      toast.success("Şube başarıyla güncellendi!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Şube güncelleme başarısız");
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Şube başarıyla silindi!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Şube silme başarısız");
    },
  });
};

// Agent hooks
export const useAgents = (params?: {
  query?: string;
  branchId?: number;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["agents", params],
    queryFn: () => apiClient.getAgents(params),
    enabled: apiClient.isAuthenticated(),
  });
};

export const useAgent = (id: number) => {
  return useQuery({
    queryKey: ["agent", id],
    queryFn: () => apiClient.getAgent(id),
    enabled: apiClient.isAuthenticated() && !!id,
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agent: any) => apiClient.createAgent(agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Acente başarıyla oluşturuldu!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Acente oluşturma başarısız");
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, agent }: { id: number; agent: any }) =>
      apiClient.updateAgent(id, agent),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
      toast.success("Acente başarıyla güncellendi!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Acente güncelleme başarısız");
    },
  });
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deleteAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Acente başarıyla silindi!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Acente silme başarısız");
    },
  });
};

// Policy hooks
export const usePolicies = (params?: {
  query?: string;
  customerId?: number;
  agentId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ["policies", params],
    queryFn: () => apiClient.getPolicies(params),
    enabled: apiClient.isAuthenticated(),
  });
};

export const usePolicy = (id: number) => {
  return useQuery({
    queryKey: ["policy", id],
    queryFn: () => apiClient.getPolicy(id),
    enabled: apiClient.isAuthenticated() && !!id,
  });
};

export const useCreatePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policy: any) => apiClient.createPolicy(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Poliçe başarıyla oluşturuldu!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Poliçe oluşturma başarısız");
    },
  });
};

export const useUpdatePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, policy }: { id: number; policy: any }) =>
      apiClient.updatePolicy(id, policy),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      queryClient.invalidateQueries({ queryKey: ["policy", id] });
      toast.success("Poliçe başarıyla güncellendi!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Poliçe güncelleme başarısız");
    },
  });
};

export const useDeletePolicy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      toast.success("Poliçe başarıyla silindi!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Poliçe silme başarısız");
    },
  });
};

// Report hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiClient.getDashboardStats(),
    enabled: apiClient.isAuthenticated(),
  });
};

export const usePolicyStats = () => {
  return useQuery({
    queryKey: ["policy-stats"],
    queryFn: () => apiClient.getPolicyStats(),
    enabled: apiClient.isAuthenticated(),
  });
};

export const useMonthlyStats = () => {
  return useQuery({
    queryKey: ["monthly-stats"],
    queryFn: () => apiClient.getMonthlyStats(),
    enabled: apiClient.isAuthenticated(),
  });
};

export const useBranchStats = () => {
  return useQuery({
    queryKey: ["branch-stats"],
    queryFn: () => apiClient.getBranchStats(),
    enabled: apiClient.isAuthenticated(),
  });
};

export const useAgentStats = () => {
  return useQuery({
    queryKey: ["agent-stats"],
    queryFn: () => apiClient.getAgentStats(),
    enabled: apiClient.isAuthenticated(),
  });
};

// Quote hooks
export const useQuote = (id: number) => {
  return useQuery({
    queryKey: ["quote", id],
    queryFn: async () => {
      try {
        return await apiClient.getQuote(id);
      } catch (error) {
        // Fallback mock data for demo
        console.log("Using mock data for quote");
        return {
          data: {
            id: id,
            customer_id: 1,
            customer: {
              id: 1,
              name: "Ali Veli",
              email: "ali.veli@email.com",
              phone: "0555 123 45 67",
            },
            product_id: 1,
            product: {
              id: 1,
              name: "Kasko Sigortası",
              type: "motor",
            },
            vehicle_brand: "Toyota",
            vehicle_model: "Corolla",
            vehicle_year: 2020,
            vehicle_plate: "34 ABC 123",
            status: "active",
            created_at: new Date().toISOString(),
          },
        };
      }
    },
    enabled: !!id,
  });
};

export const useScrapedQuotes = (quoteId: number) => {
  return useQuery({
    queryKey: ["scraped-quotes", quoteId],
    queryFn: async () => {
      try {
        return await apiClient.getScrapedQuotes(quoteId);
      } catch (error) {
        // Fallback mock data for demo
        console.log("Using mock data for scraped quotes");
        return {
          data: [
            {
              id: 1,
              quote_id: quoteId,
              company_name: "Anadolu Sigorta",
              company_logo: "https://placehold.co/100x100/0066CC/FFFFFF?text=AS",
              premium: 1500,
              coverage_amount: 50000,
              discount: 150,
              final_price: 1350,
              status: "scraped",
              scraped_at: new Date().toISOString(),
            },
            {
              id: 2,
              quote_id: quoteId,
              company_name: "Allianz",
              company_logo: "https://placehold.co/100x100/FF6600/FFFFFF?text=AL",
              premium: 1400,
              coverage_amount: 50000,
              discount: 140,
              final_price: 1260,
              status: "scraped",
              scraped_at: new Date().toISOString(),
            },
            {
              id: 3,
              quote_id: quoteId,
              company_name: "Aksigorta",
              company_logo: "https://placehold.co/100x100/00AA00/FFFFFF?text=AK",
              premium: 1450,
              coverage_amount: 50000,
              discount: 145,
              final_price: 1305,
              status: "scraped",
              scraped_at: new Date().toISOString(),
            },
            {
              id: 4,
              quote_id: quoteId,
              company_name: "Mapfre",
              company_logo: "https://placehold.co/100x100/CC0000/FFFFFF?text=MF",
              premium: 1600,
              coverage_amount: 50000,
              discount: 160,
              final_price: 1440,
              status: "scraped",
              scraped_at: new Date().toISOString(),
            },
            {
              id: 5,
              quote_id: quoteId,
              company_name: "Axa Sigorta",
              company_logo: "https://placehold.co/100x100/9900CC/FFFFFF?text=AX",
              premium: 1550,
              coverage_amount: 50000,
              discount: 155,
              final_price: 1395,
              status: "scraped",
              scraped_at: new Date().toISOString(),
            },
          ],
        };
      }
    },
    enabled: !!quoteId,
  });
};
