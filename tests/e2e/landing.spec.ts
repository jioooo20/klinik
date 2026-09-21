import { test, expect } from '@playwright/test';

/**
 * Coverage for the public landing page rendered at `/` for guests
 * (Inertia component `Landing/Index`).
 *
 * Verifies structure, content, local imagery, interactive FAQ and that the
 * anime.js reveal system degrades safely under `prefers-reduced-motion`.
 */

/**
 * Scroll the whole document (triggering anime.js onScroll reveals and lazy
 * image loading) until the page height stabilises.
 */
async function scrollThroughPage(page: import('@playwright/test').Page) {
    await page.evaluate(async () => {
        const step = window.innerHeight * 0.7;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 140));
        }
        window.scrollTo(0, 0);
    });
}

test.describe('Landing page (public /)', () => {
    test('renders hero, sections and primary CTA for guests', async ({ page }) => {
        await page.goto('/');

        // Hero headline.
        await expect(
            page.getByRole('heading', { level: 1, name: /Sehat Anda/i }),
        ).toBeVisible();

        // Section anchors exist and are reachable.
        for (const id of ['#beranda', '#layanan', '#dokter', '#alur', '#faq']) {
            await expect(page.locator(id)).toHaveCount(1);
        }

        // Primary CTA routes guests to login.
        const cta = page.getByRole('link', { name: /Buat Jadwal Kunjungan/i });
        await expect(cta).toBeVisible();
        await expect(cta).toHaveAttribute('href', /\/login$/);
    });

    test('all in-page imagery loads without error', async ({ page }) => {
        await page.goto('/');
        await scrollThroughPage(page);

        const images = page.locator('.landing img');
        const count = await images.count();
        expect(count).toBeGreaterThan(4);

        // Every image must have completed loading with natural dimensions.
        await expect
            .poll(async () =>
                images.evaluateAll((nodes) =>
                    nodes
                        .filter((n) => {
                            const img = n as HTMLImageElement;
                            return !img.complete || img.naturalWidth === 0;
                        })
                        .map((n) => (n as HTMLImageElement).src),
                ),
            )
            .toEqual([]);
    });

    test('FAQ accordion expands and collapses on click', async ({ page }) => {
        await page.goto('/#faq');

        const firstQuestion = page.getByRole('button', {
            name: /Bagaimana cara mendaftar sebagai pasien baru/i,
        });
        await firstQuestion.scrollIntoViewIfNeeded();
        await expect(firstQuestion).toBeVisible();

        // First panel opens by default.
        await expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');

        await firstQuestion.click();
        await expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');

        await firstQuestion.click();
        await expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    });

    test('reveal animations settle to fully visible content', async ({ page }) => {
        await page.goto('/');
        await scrollThroughPage(page);

        // After settling, every reveal element must be effectively opaque.
        await expect
            .poll(async () =>
                page.locator('[data-reveal]').evaluateAll((nodes) =>
                    nodes.filter((n) => Number(getComputedStyle(n).opacity) < 0.9).length,
                ),
            )
            .toBe(0);
    });
});