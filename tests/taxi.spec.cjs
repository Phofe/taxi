const { test, expect } = require("@playwright/test");

test.describe("Taxi Moto QR — parcours conducteur", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("http://127.0.0.1:4174");
  });

  test("validation des champs obligatoires", async ({ page }) => {
    await page.getByRole("button", { name: "Créer le profil et le QR" }).click();
    await expect(page.getByLabel("Nom complet *")).toBeInvalid();
    await expect(page.getByLabel("Ville *")).toBeInvalid();
    await expect(page.getByLabel("Identifiant conducteur *")).toBeInvalid();
  });

  test("création du profil, QR code et téléchargement", async ({ page }) => {
    await page.getByLabel("Nom complet *").fill("Koffi Mensah");
    await page.getByLabel("Ville *").fill("Cotonou");
    await page.getByLabel("Identifiant conducteur *").fill("TM-024");
    await page.getByLabel("Type de moto").selectOption("Moto électrique");
    await page.getByRole("button", { name: "Créer le profil et le QR" }).click();

    await expect(page.getByRole("heading", { name: "Koffi Mensah" })).toBeVisible();
    await expect(page.getByText("Ville : Cotonou")).toBeVisible();
    await expect(page.getByText("Identifiant : TM-024 · Moto électrique")).toBeVisible();
    await expect(page.locator("#notice")).toContainText("Aucune donnée n’a été envoyée à un serveur");
    await expect(page.locator("#profile")).toBeVisible();
    await expect.poll(() => page.locator("#qr canvas, #qr img").count(), { timeout: 15000 }).toBeGreaterThan(0);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Télécharger le QR (PNG)" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("taxi-moto-qr.png");
  });

  test("le bouton Effacer réinitialise les champs", async ({ page }) => {
    await page.getByLabel("Nom complet *").fill("Test Conducteur");
    await page.getByLabel("Ville *").fill("Porto-Novo");
    await page.getByLabel("Identifiant conducteur *").fill("TM-100");
    await page.getByRole("button", { name: "Effacer" }).click();
    await expect(page.getByLabel("Nom complet *")).toHaveValue("");
    await expect(page.getByLabel("Ville *")).toHaveValue("");
    await expect(page.getByLabel("Identifiant conducteur *")).toHaveValue("");
  });

  test("mise en page mobile sans débordement horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  });
});
