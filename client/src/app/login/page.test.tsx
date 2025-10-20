import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "@/app/login/page";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API client
vi.mock("@/lib/api", () => ({
  apiClient: {
    login: vi.fn(),
    isAuthenticated: vi.fn(() => false),
  },
}));

// Mock hooks
vi.mock("@/hooks/useApi", () => ({
  useLogin: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      data: {
        token_pair: {
          access_token: "test-token",
          refresh_token: "test-refresh-token",
          expires_at: Date.now() + 3600000,
        },
        user: {
          id: 1,
          email: "test@example.com",
          role: "admin",
          two_fa_enabled: false,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        requires_2fa: false,
      },
    }),
    isPending: false,
  }),
  useVerify2FA: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form correctly", () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    expect(screen.getByText("EESigorta Portal")).toBeInTheDocument();
    expect(screen.getByText("Şube/Acente Yönetim Sistemi")).toBeInTheDocument();
    expect(screen.getByLabelText("E-posta")).toBeInTheDocument();
    expect(screen.getByLabelText("Şifre")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Giriş Yap" })
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const submitButton = screen.getByRole("button", { name: "Giriş Yap" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Geçerli bir e-posta adresi giriniz")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Şifre en az 6 karakter olmalıdır")
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid email", async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText("E-posta");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const submitButton = screen.getByRole("button", { name: "Giriş Yap" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Geçerli bir e-posta adresi giriniz")
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for short password", async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText("Şifre");
    fireEvent.change(passwordInput, { target: { value: "123" } });

    const submitButton = screen.getByRole("button", { name: "Giriş Yap" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Şifre en az 6 karakter olmalıdır")
      ).toBeInTheDocument();
    });
  });

  it("toggles password visibility", () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText("Şifre");
    const toggleButton = screen.getByRole("button", { name: "" }); // Eye icon button

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("submits form with valid data", async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      data: {
        token_pair: {
          access_token: "test-token",
          refresh_token: "test-refresh-token",
          expires_at: Date.now() + 3600000,
        },
        user: {
          id: 1,
          email: "test@example.com",
          role: "admin",
          two_fa_enabled: false,
          is_active: true,
          created_at: new Date().toISOString(),
        },
        requires_2fa: false,
      },
    });

    vi.mocked(require("@/hooks/useApi").useLogin).mockReturnValue({
      mutateAsync: mockLogin,
      isPending: false,
    });

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText("E-posta");
    const passwordInput = screen.getByLabelText("Şifre");
    const submitButton = screen.getByRole("button", { name: "Giriş Yap" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });
});
