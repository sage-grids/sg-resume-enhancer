import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';

test('shows both top-level tabs on launch', async () => {
  const app = await electron.launch({
    args: [path.join(__dirname, '../../out/main/index.js')],
  });
  const window = await app.firstWindow();

  await expect(window.getByRole('link', { name: 'Resumes' })).toBeVisible();
  await expect(window.getByRole('link', { name: 'AI Settings' })).toBeVisible();

  await app.close();
});
