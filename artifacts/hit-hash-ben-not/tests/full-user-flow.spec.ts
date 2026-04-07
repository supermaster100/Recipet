/**
 * Full User-Flow Simulation — 32 tests covering all expense subjects.
 *
 * Subjects:
 *   Receipts · Hotel Nights · Currency Exchanges · ATM Withdrawals
 *   Money Transfers · Client Transfers · Export Flow · Form Validation
 *
 * Tests share one browser context so localStorage persists across tests.
 * The context-level dialog handler auto-accepts all browser dialogs.
 */

import { test, expect, Page, BrowserContext } from "@playwright/test";

const BASE_URL = `https://${process.env.REPLIT_DEV_DOMAIN}`;

// ── Page-action helpers ────────────────────────────────────────────────────

async function go(page: Page, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState("networkidle");
}

async function dismissDraft(page: Page) {
  await page.waitForTimeout(600);
  const btn = page.getByText("Discard").first();
  if (await btn.isVisible({ timeout: 1200 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

async function selectType(page: Page, from: string, to: string) {
  await page.getByText(from).first().click();
  await page.waitForTimeout(300);
  await page.getByText(to).first().click();
  await page.waitForTimeout(200);
}

async function fillAmount(page: Page, amount: string, nth = 0) {
  await page.getByPlaceholder("0.00").nth(nth).fill(amount);
}

async function clickSave(page: Page) {
  await page.getByText("Save").click();
}

async function assertToast(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 10000 });
}

async function assertUrlExcludes(page: Page, fragment: string) {
  await page.waitForTimeout(1800);
  expect(page.url()).not.toContain(fragment);
}

async function assertVisible(page: Page, text: string | RegExp) {
  await expect(
    typeof text === "string"
      ? page.getByText(text).first()
      : page.locator(`text=${text}`).first()
  ).toBeVisible({ timeout: 6000 });
}

async function navigateToTab(page: Page, tabPath: string) {
  await go(page, tabPath);
  await page.waitForTimeout(1800);
}

async function isDisabledBtn(page: Page, label: string): Promise<boolean> {
  const btn = page.getByText(label).locator("xpath=./..").first();
  return btn.evaluate((el: HTMLElement) => {
    return (
      el.getAttribute("disabled") !== null ||
      el.getAttribute("aria-disabled") === "true" ||
      (el as HTMLButtonElement).disabled === true
    );
  });
}

/** Inject a synthetic flight leg into localStorage so hotel-night form works. */
async function injectLeg(page: Page): Promise<number> {
  return page.evaluate(() => {
    const legsKey = "hhbn_legs";
    const seqKey = "hhbn_seq_legs";
    const existing: Array<{ id: number; deleted_at: null | string }> =
      JSON.parse(localStorage.getItem(legsKey) ?? "[]");
    const live = existing.find((l) => l.deleted_at == null);
    if (live) return live.id;
    const id = parseInt(localStorage.getItem(seqKey) ?? "0", 10) + 1;
    localStorage.setItem(seqKey, String(id));
    existing.push({
      id,
      type: "flight",
      status: "confirmed",
      departureDate: "2026-04-01",
      departureHour: "08:00",
      departureCountry: "IL",
      departureCity: "TLV",
      arrivalDate: "2026-04-03",
      arrivalHour: "10:00",
      arrivalCountry: "DE",
      arrivalCity: "BER",
      deleted_at: null,
    } as never);
    localStorage.setItem(legsKey, JSON.stringify(existing));
    return id;
  });
}

// ── Suite setup ────────────────────────────────────────────────────────────

test.describe("Full User-Flow Simulation", () => {
  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext({ ignoreHTTPSErrors: true });
    ctx.on("dialog", (dialog) => dialog.accept());
    page = await ctx.newPage();
    await go(page, "/");
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    await ctx.close();
  });

  // ── RECEIPTS ─────────────────────────────────────────────────────────────

  test("1. Add receipt (Hosting Myself, 45.50 ILS) → success toast", async () => {
    await go(page, "/add-expense");
    await dismissDraft(page);
    await expect(page.getByText("New Receipt")).toBeVisible({ timeout: 8000 });
    await fillAmount(page, "45.50");
    await page.getByPlaceholder("e.g. 1234").fill("1001");
    await clickSave(page);
    await assertToast(page, "Receipt added successfully!");
  });

  test("2. Add receipt (Taxi, 32.00 ILS) → success toast", async () => {
    await go(page, "/add-expense");
    await dismissDraft(page);
    await expect(page.getByText("New Receipt")).toBeVisible({ timeout: 8000 });
    await selectType(page, "Hosting Myself", "Taxi");
    await fillAmount(page, "32.00");
    const cc = page.getByPlaceholder("e.g. 1234");
    if (!(await cc.inputValue())) await cc.fill("1002");
    await clickSave(page);
    await assertToast(page, "Receipt added successfully!");
  });

  test("3. Add receipt (Overhead, 18.75 ILS) → success toast", async () => {
    await go(page, "/add-expense");
    await dismissDraft(page);
    await expect(page.getByText("New Receipt")).toBeVisible({ timeout: 8000 });
    await selectType(page, "Hosting Myself", "Overhead");
    await fillAmount(page, "18.75");
    await page.getByPlaceholder("e.g. 1234").fill("1003");
    await clickSave(page);
    await assertToast(page, "Receipt added successfully!");
  });

  test("4. Expenses list shows all 3 receipt amounts and currency", async () => {
    await navigateToTab(page, "/(tabs)/expenses");
    await expect(page.getByText("45.50")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("32.00")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("18.75")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("ILS").first()).toBeVisible({ timeout: 3000 });
  });

  test("5. Expenses list shows all 3 type labels", async () => {
    await navigateToTab(page, "/(tabs)/expenses");
    await expect(page.getByText("Hosting Myself").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Taxi").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Overhead").first()).toBeVisible({ timeout: 5000 });
  });

  test("6. Cancel adding receipt via X button → leaves add-expense screen", async () => {
    await go(page, "/add-expense");
    await dismissDraft(page);
    await expect(page.getByText("New Receipt")).toBeVisible({ timeout: 8000 });
    await fillAmount(page, "999");
    await page.locator('[aria-label="close"]').first().click();
    await assertUrlExcludes(page, "/add-expense");
  });

  // ── HOTEL NIGHTS ──────────────────────────────────────────────────────────

  test("7. Add hotel night (arbitrary location, 2 nights) → navigates back", async () => {
    await go(page, "/");
    const legId = await injectLeg(page);
    await go(page, `/add-hotel-night?legId=${legId}`);
    await expect(page.getByText("Add Hotel Night")).toBeVisible({ timeout: 8000 });

    await page.getByPlaceholder("1").fill("2");

    const sw = page.locator('[role="switch"]').first();
    if (await sw.isVisible({ timeout: 2000 }).catch(() => false)) {
      if ((await sw.getAttribute("aria-checked")) !== "true") await sw.click();
      await page.waitForTimeout(300);
    }

    await clickSave(page);
    await assertUrlExcludes(page, "/add-hotel-night");
  });

  test("8. Add hotel night (3 nights, 150 USD/night) → navigates back", async () => {
    await go(page, "/");
    const legId = await injectLeg(page);
    await go(page, `/add-hotel-night?legId=${legId}`);
    await expect(page.getByText("Add Hotel Night")).toBeVisible({ timeout: 8000 });

    await page.getByPlaceholder("1").fill("3");
    await fillAmount(page, "150");
    await page.getByText("USD").first().click();
    await page.waitForTimeout(200);

    await clickSave(page);
    await assertUrlExcludes(page, "/add-hotel-night");
  });

  test("9. Trip tab shows 2-night and 3-night entries with 150 USD/night rate", async () => {
    await navigateToTab(page, "/(tabs)/trip");
    await expect(page.getByText(/2 night/).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/3 night/).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/150.*USD.*night/).first()).toBeVisible({ timeout: 6000 });
  });

  // ── CURRENCY EXCHANGES ────────────────────────────────────────────────────

  test("10. Add exchange (100 ILS → 27.50 USD) → navigates back", async () => {
    await go(page, "/add-exchange");
    await dismissDraft(page);
    await expect(page.getByText("New Exchange")).toBeVisible({ timeout: 8000 });
    await fillAmount(page, "100", 0);
    await fillAmount(page, "27.50", 1);
    await clickSave(page);
    await assertUrlExcludes(page, "/add-exchange");
  });

  test("11. Add exchange (200 USD → 185 EUR) → navigates back", async () => {
    await go(page, "/add-exchange");
    await dismissDraft(page);
    await expect(page.getByText("New Exchange")).toBeVisible({ timeout: 8000 });
    await fillAmount(page, "200", 0);
    await fillAmount(page, "185", 1);
    await clickSave(page);
    await assertUrlExcludes(page, "/add-exchange");
  });

  test("12. Exchanges list shows both exchange records (amounts and received values)", async () => {
    await navigateToTab(page, "/(tabs)/exchanges");
    await expect(page.getByText("CURRENCY EXCHANGES")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("100.00").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("27.50").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("200.00").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("185.00").first()).toBeVisible({ timeout: 5000 });
  });

  test("13. Cancel adding exchange via X button → leaves add-exchange screen", async () => {
    await go(page, "/add-exchange");
    await dismissDraft(page);
    await expect(page.getByText("New Exchange")).toBeVisible({ timeout: 8000 });
    await fillAmount(page, "999", 0);
    await page.locator('[aria-label="close"]').first().click();
    await assertUrlExcludes(page, "/add-exchange");
  });

  // ── ATM WITHDRAWALS ───────────────────────────────────────────────────────

  test("14. Add ATM withdrawal (card 1234, 200 USD) → navigates back", async () => {
    await go(page, "/add-atm");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("ATM Withdrawal")).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder("1234").fill("1234");
    await fillAmount(page, "200");
    await clickSave(page);
    await assertUrlExcludes(page, "/add-atm");
  });

  test("15. Add ATM withdrawal (card 5678, 150 EUR) → navigates back", async () => {
    await go(page, "/add-atm");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("ATM Withdrawal")).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder("1234").fill("5678");
    await fillAmount(page, "150");
    await page.getByText("EUR").first().click();
    await clickSave(page);
    await assertUrlExcludes(page, "/add-atm");
  });

  test("16. ATM section shows card 1234 with 200.00", async () => {
    await navigateToTab(page, "/(tabs)/exchanges");
    await expect(page.getByText("ATM WITHDRAWALS")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Card ending.*1234/).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("200.00").first()).toBeVisible({ timeout: 5000 });
  });

  test("17. ATM section shows card 5678 with 150.00", async () => {
    await navigateToTab(page, "/(tabs)/exchanges");
    await expect(page.getByText(/Card ending.*5678/).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("150.00").first()).toBeVisible({ timeout: 5000 });
  });

  // ── MONEY TRANSFERS ───────────────────────────────────────────────────────

  test("18. Add money transfer (John Smith, 500 ILS) → navigates back", async () => {
    await go(page, "/add-money-transfer");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("New Money Transfer")).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder("Name on receipt").fill("John Smith");
    await page.getByPlaceholder("Giver's name").fill("Alice Johnson");
    await page.getByPlaceholder("Worker number").fill("12345");
    await fillAmount(page, "500");
    await clickSave(page);
    await assertUrlExcludes(page, "/add-money-transfer");
  });

  test("19. Money transfers list shows John Smith with 500.00", async () => {
    await navigateToTab(page, "/(tabs)/money-transfers");
    await expect(page.getByText("John Smith").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("500.00").first()).toBeVisible({ timeout: 5000 });
  });

  test("20. Cancel money transfer via X → leaves screen", async () => {
    await go(page, "/add-money-transfer");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("New Money Transfer")).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder("Name on receipt").fill("Test User");
    await page.locator('[aria-label="close"]').first().click();
    await assertUrlExcludes(page, "/add-money-transfer");
  });

  // ── CLIENT TRANSFERS ──────────────────────────────────────────────────────

  test("21. Add client transfer (Acme Corp, 250.00 USD) → navigates back", async () => {
    await go(page, "/add-client-transfer");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("New Client Transfer")).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder("Client's name").fill("Acme Corp");
    await page.getByPlaceholder("Giver's name").fill("Alice Johnson");
    await fillAmount(page, "250");
    await page.getByText("USD").first().click();
    await page.waitForTimeout(200);
    await clickSave(page);
    await assertUrlExcludes(page, "/add-client-transfer");
  });

  test("22. Client transfers list shows Acme Corp with 250.00", async () => {
    await navigateToTab(page, "/(tabs)/client-transfers");
    await expect(page.getByText("Acme Corp").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("250.00").first()).toBeVisible({ timeout: 5000 });
  });

  test("23. Cancel client transfer via X → leaves screen", async () => {
    await go(page, "/add-client-transfer");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("New Client Transfer")).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder("Client's name").fill("Test Client");
    await page.locator('[aria-label="close"]').first().click();
    await assertUrlExcludes(page, "/add-client-transfer");
  });

  // ── DELETE FLOW ───────────────────────────────────────────────────────────

  test("24. Add receipt to delete (Train, 77.00 ILS) → success toast", async () => {
    await go(page, "/add-expense");
    await dismissDraft(page);
    await expect(page.getByText("New Receipt")).toBeVisible({ timeout: 8000 });
    await selectType(page, "Hosting Myself", "Train");
    await fillAmount(page, "77.00");
    await page.getByPlaceholder("e.g. 1234").fill("9999");
    await clickSave(page);
    await assertToast(page, "Receipt added successfully!");
  });

  test("25. Delete receipt via edit screen → navigates away and 45.50 still present", async () => {
    await navigateToTab(page, "/(tabs)/expenses");
    await expect(page.getByText("77.00").first()).toBeVisible({ timeout: 5000 });

    await page.getByText("77.00").first().click();
    await page.waitForTimeout(1500);
    await expect(page.getByText("Edit Receipt")).toBeVisible({ timeout: 6000 });

    await page.locator('[aria-label="delete"]').first().click();
    await page.waitForTimeout(2000);

    expect(page.url()).not.toContain("/edit-expense");

    await navigateToTab(page, "/(tabs)/expenses");
    await expect(page.getByText("45.50")).toBeVisible({ timeout: 5000 });
  });

  // ── EXPORT FLOW ───────────────────────────────────────────────────────────

  test("26. Export screen shows all required UI elements", async () => {
    await go(page, "/export");
    await page.waitForTimeout(800);
    await expect(page.getByText("Export Options")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Recipient Email")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Export all?")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Clear all trip data after export")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Yes, Export")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Cancel")).toBeVisible({ timeout: 3000 });
  });

  test("27. Export toggles work: enabling Export all unlocks Clear data option", async () => {
    await go(page, "/export");
    await page.waitForTimeout(800);
    await expect(page.getByText(/CSV & Excel/)).toBeVisible({ timeout: 5000 });

    await page.getByText("Export all?").click();
    await page.waitForTimeout(400);
    const clearRow = page.getByText("Clear all trip data after export");
    await expect(clearRow).toBeVisible({ timeout: 3000 });
    await clearRow.click();
    await page.waitForTimeout(200);
    await page.getByText("Export all?").click();
    await page.waitForTimeout(200);
  });

  test("28. Yes Export is disabled when Export all not toggled", async () => {
    await go(page, "/export");
    await page.waitForTimeout(800);
    const disabled = await isDisabledBtn(page, "Yes, Export");
    expect(disabled).toBe(true);
  });

  test("29. Export summary shows item count > 0 after receipts were added", async () => {
    await go(page, "/export");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2500);
    const text = await page.locator("text=/will be exported to CSV/").textContent({ timeout: 8000 });
    const match = (text ?? "").match(/(\d+) items?/);
    const count = match ? parseInt(match[1], 10) : 0;
    expect(count).toBeGreaterThan(0);
  });

  test("30. Yes Export on web shows not-supported message via alert", async () => {
    await go(page, "/export");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.getByText("Export all?").click();
    await page.waitForTimeout(400);

    let alertMessage = "";
    await page.evaluate(() => {
      (window as Window & { __alertMessage?: string }).__alertMessage = "";
      const orig = window.alert.bind(window);
      window.alert = (msg: string) => {
        (window as Window & { __alertMessage?: string }).__alertMessage = msg;
        orig(msg);
      };
    });

    await page.getByText("Yes, Export").click();
    await page.waitForTimeout(1500);

    alertMessage = await page.evaluate(
      () => (window as Window & { __alertMessage?: string }).__alertMessage ?? ""
    );

    expect(alertMessage.length).toBeGreaterThan(0);
    expect(
      alertMessage.toLowerCase().includes("not supported") ||
      alertMessage.toLowerCase().includes("device") ||
      alertMessage.toLowerCase().includes("email") ||
      alertMessage.toLowerCase().includes("export")
    ).toBe(true);
  });

  test("31. Cancel on export screen navigates back", async () => {
    await navigateToTab(page, "/(tabs)/more");
    await page.getByText("Export to CSV").click();
    await page.waitForTimeout(700);
    await expect(page.getByText("Export Options")).toBeVisible({ timeout: 5000 });
    await page.getByText("Cancel").click();
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain("/export");
  });

  // ── FORM VALIDATION ───────────────────────────────────────────────────────

  test("32. Save is disabled when amount field is empty", async () => {
    await go(page, "/add-expense");
    await dismissDraft(page);
    await expect(page.getByText("New Receipt")).toBeVisible({ timeout: 8000 });
    await page.getByPlaceholder("0.00").first().fill("");
    await page.getByPlaceholder("e.g. 1234").fill("");
    await page.waitForTimeout(200);
    const disabled = await isDisabledBtn(page, "Save");
    expect(disabled).toBe(true);
  });
});
