import { test, expect } from '@playwright/test';
import path from 'path';

test('photo converter happy path - upload, convert and download', async ({ page }) => {
  // 1. Navigate to the application
  await page.goto('http://localhost:3001');

  // 2. Upload an image
  // Playwright needs an actual file to upload. 
  // We're assuming there's a sample image in a `fixtures` folder relative to this test.
  const sampleImagePath = path.join(__dirname, 'fixtures', 'sample-image.png');
  
  // Find the file input within the dropzone and attach the file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(sampleImagePath);

  // 3. Select an output format
  // Finding the main select dropdown and setting it to PNG
  const formatSelect = page.locator('select');
  await formatSelect.selectOption('image/png');

  // 4. Click the Convert button
  // Finding the primary submit/convert button. 
  // We locate it by checking for the primary button class or role.
  const convertBtn = page.locator('button.btn-primary');
  await expect(convertBtn).toBeEnabled();
  await convertBtn.click();

  // 5. Wait for conversion to complete and verify Download buttons
  // There are two download buttons: individual and global. We will wait for the global one to be enabled.
  const downloadAllBtn = page.locator('button.btn-secondary:has-text("Download")');
  
  // Wait until it becomes enabled after processing finishes
  await expect(downloadAllBtn).toBeEnabled({ timeout: 15000 });

  // 6. Complete the download
  // We have to wait for the download event when we click the button
  const downloadPromise = page.waitForEvent('download');
  await downloadAllBtn.click();
  const download = await downloadPromise;

  // Assert that the downloaded file is a PNG, based on the format we selected
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
});
