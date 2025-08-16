import { test, expect } from '@playwright/test';

test.describe('Results Screen Debug', () => {
  test('should reach results screen after 5 questions', async ({ page }) => {
    console.log('Testing results screen after completing 5 questions');
    
    // Quick setup
    await page.goto('/');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByPlaceholder(/Enter your name/i).fill('ResultsTest');
    await page.getByRole('button', { name: /Create/i }).last().click();
    await page.getByRole('button', { name: /Start Game/i }).click();
    
    // Answer all 5 questions quickly
    for (let i = 0; i < 5; i++) {
      console.log(`Quick answer question ${i + 1}`);
      
      // Wait for any answer option to appear
      await expect(page.locator('.answer-option').first()).toBeVisible({ timeout: 8000 });
      
      // Click first answer and submit immediately
      await page.locator('.answer-option').first().click();
      await page.getByRole('button', { name: /Submit/i }).click();
      
      // If not last question, click next
      if (i < 4) {
        const nextButton = page.getByRole('button', { name: /Next Question/i });
        await expect(nextButton).toBeVisible({ timeout: 5000 });
        await nextButton.click();
        await page.waitForTimeout(200); // Minimal wait
      }
    }
    
    console.log('All 5 questions completed, checking what appears...');
    
    // Wait a moment for results to render
    await page.waitForTimeout(2000);
    
    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'results-debug.png', fullPage: true });
    
    // Log all text on the page
    const pageText = await page.textContent('body');
    console.log('Page text after completing 5 questions:', pageText);
    
    // Check what buttons are available
    const allButtons = await page.locator('button').allTextContents();
    console.log('Available buttons:', allButtons);
    
    // Try to find any results indicator
    const hasNewGame = await page.getByRole('button', { name: /New Game/i }).count();
    const hasPlayAgain = await page.getByRole('button', { name: /Play Again/i }).count();
    const hasResults = await page.getByText(/result/i).count();
    const hasGameOver = await page.getByText(/game over/i).count();
    
    console.log('Results indicators found:');
    console.log('- New Game button:', hasNewGame);
    console.log('- Play Again button:', hasPlayAgain);
    console.log('- Results text:', hasResults);
    console.log('- Game Over text:', hasGameOver);
    
    // The test passes if we got this far - we just want to see what's on the page
    expect(true).toBe(true);
  });
});