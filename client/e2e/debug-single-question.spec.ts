import { test, expect } from '@playwright/test';

test.describe('Debug Single Question', () => {
  test('should complete exactly one question and show results', async ({ page }) => {
    console.log('Starting debug test - single question only');
    
    // Start at the lobby
    await page.goto('/');
    await expect(page).toHaveTitle(/Trivia Game/);
    
    // Create room
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByPlaceholder(/Enter your name/i).fill('DebugPlayer');
    await page.getByRole('button', { name: /Create/i }).last().click();
    
    // Start game
    await expect(page.getByText(/Waiting Room/i)).toBeVisible();
    await page.getByRole('button', { name: /Start Game/i }).click();
    
    // Wait for first question
    await expect(page.getByText(/Question 1/i)).toBeVisible({ timeout: 15000 });
    console.log('Question 1 loaded successfully');
    
    // Skip audio interactions for now - just select first answer
    const firstAnswer = page.locator('.answer-option').first();
    await expect(firstAnswer).toBeVisible({ timeout: 10000 });
    await firstAnswer.click();
    
    // Submit answer
    const submitButton = page.getByRole('button', { name: /Submit/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    console.log('Answer submitted');
    
    // Wait for results to appear
    await page.waitForTimeout(2000);
    
    // Look for any results indicators
    const nextButton = page.getByRole('button', { name: /Next Question/i });
    const gameOverText = page.getByText(/Game Over/i);
    
    // Check what appears - either next question or game over
    try {
      await expect(nextButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Next Question button found - single question flow working');
    } catch {
      try {
        await expect(gameOverText).toBeVisible({ timeout: 5000 });
        console.log('✅ Game Over found - game ended after one question');
      } catch {
        console.log('❌ Neither Next Question nor Game Over found');
        
        // Debug: take screenshot and log what's on page
        await page.screenshot({ path: 'debug-state.png', fullPage: true });
        const pageContent = await page.textContent('body');
        console.log('Page content:', pageContent);
        
        throw new Error('Could not find expected results state');
      }
    }
    
    console.log('Debug test completed successfully');
  });
});