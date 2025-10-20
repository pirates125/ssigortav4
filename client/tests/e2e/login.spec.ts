import { test, expect } from "@playwright/test";

test.describe("EESigorta Portal E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:3000");
  });

  test("should redirect to login page", async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator("h1")).toContainText("EESigorta Portal");
  });

  test("should show login form validation errors", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(
      page.locator("text=Geçerli bir e-posta adresi giriniz")
    ).toBeVisible();
    await expect(
      page.locator("text=Şifre en az 6 karakter olmalıdır")
    ).toBeVisible();
  });

  test("should show invalid email error", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Enter invalid email
    await page.fill('input[type="email"]', "invalid-email");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Check for email validation error
    await expect(
      page.locator("text=Geçerli bir e-posta adresi giriniz")
    ).toBeVisible();
  });

  test("should show short password error", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Enter short password
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "123");
    await page.click('button[type="submit"]');

    // Check for password validation error
    await expect(
      page.locator("text=Şifre en az 6 karakter olmalıdır")
    ).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator(
      'button[aria-label="Toggle password visibility"]'
    );

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click toggle button
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("should attempt login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Fill in valid credentials
    await page.fill('input[type="email"]', "admin@eesigorta.com");
    await page.fill('input[type="password"]', "Pass123!");

    // Mock the API response
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token_pair: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
          user: {
            id: 1,
            email: "admin@eesigorta.com",
            role: "admin",
            two_fa_enabled: false,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          requires_2fa: false,
        }),
      });
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should show 2FA form when required", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    // Fill in credentials
    await page.fill('input[type="email"]', "admin@eesigorta.com");
    await page.fill('input[type="password"]', "Pass123!");

    // Mock API response requiring 2FA
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token_pair: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
          user: {
            id: 1,
            email: "admin@eesigorta.com",
            role: "admin",
            two_fa_enabled: true,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          requires_2fa: true,
        }),
      });
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Should show 2FA form
    await expect(page.locator("text=2FA Doğrulaması")).toBeVisible();
    await expect(page.locator('input[placeholder="123456"]')).toBeVisible();
  });

  test("should navigate to customers page", async ({ page }) => {
    // Mock authentication
    await page.goto("http://localhost:3000/login");

    // Mock API responses
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token_pair: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
          user: {
            id: 1,
            email: "admin@eesigorta.com",
            role: "admin",
            two_fa_enabled: false,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          requires_2fa: false,
        }),
      });
    });

    await page.route("**/api/v1/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          email: "admin@eesigorta.com",
          role: "admin",
          two_fa_enabled: false,
          is_active: true,
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.route("**/api/v1/customers**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          total: 0,
          page: 1,
          page_size: 20,
          total_pages: 0,
        }),
      });
    });

    // Login
    await page.fill('input[type="email"]', "admin@eesigorta.com");
    await page.fill('input[type="password"]', "Pass123!");
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);

    // Click on customers menu item
    await page.click("text=Müşteriler");

    // Should navigate to customers page
    await expect(page).toHaveURL(/.*customers/);
    await expect(page.locator("h1")).toContainText("Müşteriler");
  });

  test("should create new customer", async ({ page }) => {
    // Mock authentication and API responses
    await page.goto("http://localhost:3000/login");

    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token_pair: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expires_at: Date.now() + 3600000,
          },
          user: {
            id: 1,
            email: "admin@eesigorta.com",
            role: "admin",
            two_fa_enabled: false,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          requires_2fa: false,
        }),
      });
    });

    await page.route("**/api/v1/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          email: "admin@eesigorta.com",
          role: "admin",
          two_fa_enabled: false,
          is_active: true,
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.route("**/api/v1/customers**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            tc_vkn: "12345678901",
            name: "Test Customer",
            email: "test@example.com",
            phone: "0555 123 45 67",
            city: "İstanbul",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [],
            total: 0,
            page: 1,
            page_size: 20,
            total_pages: 0,
          }),
        });
      }
    });

    // Login
    await page.fill('input[type="email"]', "admin@eesigorta.com");
    await page.fill('input[type="password"]', "Pass123!");
    await page.click('button[type="submit"]');

    // Navigate to customers
    await page.click("text=Müşteriler");

    // Click "Yeni Müşteri" button
    await page.click("text=Yeni Müşteri");

    // Fill customer form
    await page.fill('input[name="tc_vkn"]', "12345678901");
    await page.fill('input[name="name"]', "Test Customer");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="phone"]', "0555 123 45 67");
    await page.fill('input[name="city"]', "İstanbul");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(
      page.locator("text=Müşteri başarıyla oluşturuldu!")
    ).toBeVisible();
  });
});
