import { test, expect } from "@playwright/test";

test("admin login works (dev bypass) and logout works", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByTestId("admin-login-email").fill("anything@example.com");
  await page.getByTestId("admin-login-password").fill("anything");
  await page.getByTestId("admin-login-submit").click();

  await page.waitForURL(/\/admin(\/)?$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByTestId("admin-logout").click();
  await page.waitForURL(/\/admin\/login/);
  await expect(page.getByText("Admin Login")).toBeVisible();
});

test("navigate and open key admin pages", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.goto("/admin/products");
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

  await page.goto("/admin/media");
  await expect(page.getByRole("heading", { name: "Media" })).toBeVisible();

  await page.goto("/admin/home");
  await expect(page.getByRole("heading", { name: "Home Builder" })).toBeVisible();

  await page.goto("/admin/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();
});

