import axios, { AxiosInstance, AxiosResponse } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token_pair: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  user: {
    id: number;
    email: string;
    role: string;
    two_fa_enabled: boolean;
    is_active: boolean;
    created_at: string;
  };
  requires_2fa: boolean;
}

export interface TwoFARequest {
  code: string;
}

export interface Customer {
  id: number;
  tc_vkn: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postal_code: string;
  birth_date: string;
  gender: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerRequest {
  tc_vkn: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  postal_code?: string;
  birth_date?: string;
  gender?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: string;
}

export interface SuccessResponse {
  message: string;
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Load tokens from localStorage
    this.loadTokens();

    // Request interceptor to add auth header
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.refreshToken) {
            try {
              const response = await this.refreshAccessToken();
              this.setTokens(
                response.data.access_token,
                response.data.refresh_token
              );
              originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
              return this.client(originalRequest);
            } catch (refreshError) {
              this.clearTokens();
              window.location.href = "/login";
              return Promise.reject(refreshError);
            }
          } else {
            this.clearTokens();
            window.location.href = "/login";
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private loadTokens() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
      this.refreshToken = localStorage.getItem("refresh_token");
    }
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  // Auth methods
  async login(
    credentials: LoginRequest
  ): Promise<AxiosResponse<LoginResponse>> {
    const response = await this.client.post<LoginResponse>(
      "/auth/login",
      credentials
    );
    this.setTokens(
      response.data.token_pair.access_token,
      response.data.token_pair.refresh_token
    );
    return response;
  }

  async refreshAccessToken(): Promise<
    AxiosResponse<{ access_token: string; refresh_token: string }>
  > {
    return this.client.post("/auth/refresh", {
      refresh_token: this.refreshToken,
    });
  }

  async logout(): Promise<AxiosResponse<SuccessResponse>> {
    const response = await this.client.post<SuccessResponse>("/auth/logout");
    this.clearTokens();
    return response;
  }

  async verify2FA(code: string): Promise<AxiosResponse<LoginResponse>> {
    return this.client.post<LoginResponse>("/auth/2fa/login", { code });
  }

  async enable2FA(
    password: string
  ): Promise<AxiosResponse<{ secret: string; qr_code_url: string }>> {
    return this.client.post("/auth/2fa/enable", { password });
  }

  async verify2FASetup(code: string): Promise<AxiosResponse<SuccessResponse>> {
    return this.client.post<SuccessResponse>("/auth/2fa/verify", { code });
  }

  async getMe(): Promise<AxiosResponse<LoginResponse["user"]>> {
    return this.client.get("/me");
  }

  // Customer methods
  async getCustomers(params?: {
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<PaginationResponse<Customer>>> {
    return this.client.get<PaginationResponse<Customer>>("/customers", {
      params,
    });
  }

  async getCustomer(id: number): Promise<AxiosResponse<Customer>> {
    return this.client.get<Customer>(`/customers/${id}`);
  }

  async createCustomer(
    customer: CustomerRequest
  ): Promise<AxiosResponse<Customer>> {
    return this.client.post<Customer>("/customers", customer);
  }

  async updateCustomer(
    id: number,
    customer: CustomerRequest
  ): Promise<AxiosResponse<Customer>> {
    return this.client.put<Customer>(`/customers/${id}`, customer);
  }

  async deleteCustomer(id: number): Promise<AxiosResponse<SuccessResponse>> {
    return this.client.delete<SuccessResponse>(`/customers/${id}`);
  }

  // Branch methods
  async getBranches(params?: {
    query?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<PaginationResponse<any>>> {
    return this.client.get<PaginationResponse<any>>("/branches", {
      params,
    });
  }

  async getBranch(id: number): Promise<AxiosResponse<any>> {
    return this.client.get<any>(`/branches/${id}`);
  }

  async createBranch(branch: any): Promise<AxiosResponse<any>> {
    return this.client.post<any>("/branches", branch);
  }

  async updateBranch(id: number, branch: any): Promise<AxiosResponse<any>> {
    return this.client.put<any>(`/branches/${id}`, branch);
  }

  async deleteBranch(id: number): Promise<AxiosResponse<SuccessResponse>> {
    return this.client.delete<SuccessResponse>(`/branches/${id}`);
  }

  // Agent methods
  async getAgents(params?: {
    query?: string;
    branchId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<PaginationResponse<any>>> {
    return this.client.get<PaginationResponse<any>>("/agents", {
      params,
    });
  }

  async getAgent(id: number): Promise<AxiosResponse<any>> {
    return this.client.get<any>(`/agents/${id}`);
  }

  async createAgent(agent: any): Promise<AxiosResponse<any>> {
    return this.client.post<any>("/agents", agent);
  }

  async updateAgent(id: number, agent: any): Promise<AxiosResponse<any>> {
    return this.client.put<any>(`/agents/${id}`, agent);
  }

  async deleteAgent(id: number): Promise<AxiosResponse<SuccessResponse>> {
    return this.client.delete<SuccessResponse>(`/agents/${id}`);
  }

  // Policy methods
  async getPolicies(params?: {
    query?: string;
    customerId?: number;
    agentId?: number;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AxiosResponse<PaginationResponse<any>>> {
    return this.client.get<PaginationResponse<any>>("/policies", {
      params,
    });
  }

  async getPolicy(id: number): Promise<AxiosResponse<any>> {
    return this.client.get<any>(`/policies/${id}`);
  }

  async createPolicy(policy: any): Promise<AxiosResponse<any>> {
    return this.client.post<any>("/policies", policy);
  }

  async updatePolicy(id: number, policy: any): Promise<AxiosResponse<any>> {
    return this.client.put<any>(`/policies/${id}`, policy);
  }

  async deletePolicy(id: number): Promise<AxiosResponse<SuccessResponse>> {
    return this.client.delete<SuccessResponse>(`/policies/${id}`);
  }

  // Report methods
  async getDashboardStats(): Promise<AxiosResponse<any>> {
    return this.client.get<any>("/reports/dashboard");
  }

  async getPolicyStats(): Promise<AxiosResponse<any>> {
    return this.client.get<any>("/reports/policy-stats");
  }

  async getMonthlyStats(): Promise<AxiosResponse<any>> {
    return this.client.get<any>("/reports/monthly-stats");
  }

  async getBranchStats(): Promise<AxiosResponse<any>> {
    return this.client.get<any>("/reports/branch-stats");
  }

  async getAgentStats(): Promise<AxiosResponse<any>> {
    return this.client.get<any>("/reports/agent-stats");
  }

  async exportPolicies(params?: {
    startDate?: string;
    endDate?: string;
    branchId?: number;
    agentId?: number;
    format?: string;
  }): Promise<AxiosResponse<any>> {
    return this.client.get<any>("/reports/export/policies", {
      params,
    });
  }

  async exportCustomers(params?: {
    startDate?: string;
    endDate?: string;
    format?: string;
  }): Promise<AxiosResponse<any>> {
    return this.client.get<any>("/reports/export/customers", {
      params,
    });
  }

  // Quote methods
  async getQuote(id: number): Promise<AxiosResponse<any>> {
    return this.client.get<any>(`/quotes/${id}`);
  }

  async getScrapedQuotes(quoteId: number): Promise<AxiosResponse<any[]>> {
    return this.client.get<any[]>(`/quotes/${quoteId}/scraped`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
