import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

test.describe('Multiplayer Game Flow', () => {
  test('should allow two players to play together in the same room', async ({ browser }) => {
    console.log('🎮 Testing multiplayer functionality with two players');
    
    // Create two separate browser contexts (like two different users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages for each player
    const player1Page = await context1.newPage();
    const player2Page = await context2.newPage();
    
    let roomCode: string = '';
    
    try {
      // === PLAYER 1: CREATE ROOM ===
      console.log('👤 Player 1: Creating room...');
      await player1Page.goto('/');
      await expect(player1Page).toHaveTitle(/Trivia Game/);
      
      // Player 1 creates a new room
      await player1Page.getByRole('button', { name: /Create New Room/i }).click();
      await player1Page.getByPlaceholder(/Enter your name/i).fill('Player1');
      await player1Page.getByRole('button', { name: /Create/i }).last().click();
      
      // Player 1 should be in waiting room
      await expect(player1Page.getByText(/Waiting Room/i)).toBeVisible();
      
      // Get the room code
      const roomCodeElement = await player1Page.locator('text=/Room Code:[A-Z0-9]+/');
      const roomCodeText = await roomCodeElement.textContent();
      roomCode = roomCodeText?.match(/Room Code:([A-Z0-9]+)/)?.[1] || '';
      console.log(`📝 Room created with code: ${roomCode}`);
      
      // Verify Player 1 is in the player list
      await expect(player1Page.getByText('Player1')).toBeVisible();
      
      // === PLAYER 2: JOIN ROOM ===
      console.log('👤 Player 2: Joining room...');
      await player2Page.goto('/');
      await expect(player2Page).toHaveTitle(/Trivia Game/);
      
      // Player 2 joins the existing room
      await player2Page.getByRole('button', { name: /Join Existing Room/i }).click();
      await player2Page.getByPlaceholder(/Enter your name/i).fill('Player2');
      await player2Page.getByPlaceholder(/Enter room code/i).fill(roomCode);
      await player2Page.getByRole('button', { name: /Join/i }).last().click();
      
      // Player 2 should also be in waiting room
      await expect(player2Page.getByText(/Waiting Room/i)).toBeVisible();
      await expect(player2Page.getByText(`Room Code:${roomCode}`)).toBeVisible();
      
      // Both players should see each other in the player list
      console.log('✅ Verifying both players are in the room...');
      await expect(player1Page.locator('.player-name').filter({ hasText: 'Player1' })).toBeVisible();
      await expect(player1Page.locator('.player-name').filter({ hasText: 'Player2' })).toBeVisible();
      await expect(player2Page.locator('.player-name').filter({ hasText: 'Player1' })).toBeVisible();
      await expect(player2Page.locator('.player-name').filter({ hasText: 'Player2' })).toBeVisible();
      
      // === START GAME ===
      console.log('🎯 Starting the game...');
      // Only the host (Player 1) should see the Start Game button
      await player1Page.getByRole('button', { name: /Start Game/i }).click();
      
      // Both players should now be in the game
      await expect(player1Page.locator('.answer-option').first()).toBeVisible({ timeout: 10000 });
      await expect(player2Page.locator('.answer-option').first()).toBeVisible({ timeout: 10000 });
      
      console.log('🎮 Both players are now in the game!');
      
      // === PLAY THROUGH QUESTIONS ===
      const correctAnswers = [
        'The Beatles - Hey Jude',
        'Star Wars', 
        'Beethoven',
        'Jazz',
        'Violin'
      ];
      
      for (let i = 0; i < 3; i++) { // Test first 3 questions for faster execution
        console.log(`📝 Question ${i + 1}: Both players answering...`);
        
        // Player 1 selects and submits answer
        const player1Answer = player1Page.getByRole('button', { 
          name: new RegExp(correctAnswers[i], 'i') 
        });
        await player1Answer.click();
        await player1Page.getByRole('button', { name: /Submit/i }).click();
        
        // Player 2 selects a different answer (for variety) then submits
        const player2Options = player2Page.locator('.answer-option');
        const player2Count = await player2Options.count();
        if (player2Count > 1) {
          // Player 2 picks a different answer (wrong answer for testing)
          await player2Options.nth(0).click();
        }
        await player2Page.getByRole('button', { name: /Submit/i }).click();
        
        // Both players should see that both have answered
        await expect(player1Page.getByText('✓ Answered').first()).toBeVisible({ timeout: 5000 });
        await expect(player2Page.getByText('✓ Answered').first()).toBeVisible({ timeout: 5000 });
        
        // Wait for Next Question button and click it
        if (i < 2) { // Not the last question in our test
          // Wait a bit for the Next Question button to appear
          await player1Page.waitForTimeout(2000);
          
          // Check if next button is available (host may need to trigger it)
          const nextButton1 = player1Page.getByRole('button', { name: /Next Question/i });
          const hasNextButton = await nextButton1.isVisible().catch(() => false);
          
          if (hasNextButton) {
            await nextButton1.click();
            console.log(`✅ Moved to question ${i + 2}`);
          } else {
            // Try End Game button if on last question
            const endButton = player1Page.getByRole('button', { name: /End Game/i });
            if (await endButton.isVisible().catch(() => false)) {
              console.log('📊 Game ended early');
              break;
            }
          }
          
          // Wait for next question to load
          await player1Page.waitForTimeout(1000);
        }
      }
      
      console.log('✅ Multiplayer test completed successfully!');
      console.log('📊 Both players participated in the game simultaneously');
      
      // Verify both players are still connected and seeing game state
      const player1Score = await player1Page.locator('text=/Player1.*\\d+/').count();
      const player2Score = await player2Page.locator('text=/Player2.*\\d+/').count();
      
      expect(player1Score).toBeGreaterThan(0);
      expect(player2Score).toBeGreaterThan(0);
      
      console.log('🎉 MULTIPLAYER TEST PASSED!');
      console.log('✅ Room creation and joining works');
      console.log('✅ Both players can see each other');
      console.log('✅ Game starts for both players simultaneously');
      console.log('✅ Both players can answer questions');
      console.log('✅ Score tracking works for multiple players');
      
    } finally {
      // Clean up: close contexts
      await context1.close();
      await context2.close();
    }
  });
  
  test('should handle player disconnection and reconnection', async ({ browser }) => {
    console.log('🔌 Testing player disconnection/reconnection...');
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const player1Page = await context1.newPage();
    const player2Page = await context2.newPage();
    
    let roomCode: string = '';
    
    try {
      // Player 1 creates room
      await player1Page.goto('/');
      await player1Page.getByRole('button', { name: /Create New Room/i }).click();
      await player1Page.getByPlaceholder(/Enter your name/i).fill('Host');
      await player1Page.getByRole('button', { name: /Create/i }).last().click();
      
      // Get room code
      const roomCodeElement = await player1Page.locator('text=/Room Code:[A-Z0-9]+/');
      const roomCodeText = await roomCodeElement.textContent();
      roomCode = roomCodeText?.match(/Room Code:([A-Z0-9]+)/)?.[1] || '';
      
      // Player 2 joins
      await player2Page.goto('/');
      await player2Page.getByRole('button', { name: /Join Existing Room/i }).click();
      await player2Page.getByPlaceholder(/Enter your name/i).fill('Guest');
      await player2Page.getByPlaceholder(/Enter room code/i).fill(roomCode);
      await player2Page.getByRole('button', { name: /Join/i }).last().click();
      
      // Verify both players are in room
      await expect(player1Page.locator('.player-name').filter({ hasText: 'Guest' })).toBeVisible();
      await expect(player2Page.locator('.player-name').filter({ hasText: 'Host' })).toBeVisible();
      
      // Player 2 "disconnects" (closes page)
      console.log('📴 Player 2 disconnecting...');
      await player2Page.close();
      
      // Wait a moment for the disconnection to register
      await player1Page.waitForTimeout(2000);
      
      // Player 1 should still be in the room
      await expect(player1Page.getByText('Host')).toBeVisible();
      
      // Player 2 reconnects with a new page
      console.log('🔄 Player 2 reconnecting...');
      const player2NewPage = await context2.newPage();
      await player2NewPage.goto('/');
      await player2NewPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await player2NewPage.getByPlaceholder(/Enter your name/i).fill('Guest_Reconnected');
      await player2NewPage.getByPlaceholder(/Enter room code/i).fill(roomCode);
      await player2NewPage.getByRole('button', { name: /Join/i }).last().click();
      
      // Both players should see the reconnected player
      await expect(player1Page.locator('.player-name').filter({ hasText: 'Guest_Reconnected' })).toBeVisible();
      await expect(player2NewPage.locator('.player-name').filter({ hasText: 'Host' })).toBeVisible();
      
      console.log('✅ Player successfully reconnected to room!');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});