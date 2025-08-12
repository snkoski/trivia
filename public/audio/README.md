# Adding Audio Files to Your Music Trivia Game

## How to Add Your Own Audio Files

1. **Add audio files to this folder** (`public/audio/`)
   - Supported formats: MP3, WAV, OGG, M4A
   - Name your files: `song1.mp3`, `song2.mp3`, etc.
   - Or use custom names and update the paths in the code

2. **Update the questions in the code** (`src/App.tsx`)
   - Find the `mockQuestions` array (line 12)
   - Update the `audioUrl` paths to match your files
   - Change the question text and answer options

## Example Audio File Structure
```
public/audio/
├── song1.mp3    # Question 1 audio
├── song2.mp3    # Question 2 audio
├── song3.mp3    # Question 3 audio
├── song4.mp3    # Question 4 audio
└── song5.mp3    # Question 5 audio
```

## Tips for Audio Files

- **Keep files under 5MB** for faster loading
- **Use consistent volume levels** across all files
- **Trim silence** from the beginning/end
- **Consider using short clips** (15-30 seconds) for better gameplay

## Where to Get Audio

### Free Resources
- YouTube Audio Library (free music and sound effects)
- Freesound.org (creative commons audio)
- Incompetech.com (royalty-free music)
- Your own recordings

### Creating Clips from Existing Audio
- Use Audacity (free, cross-platform)
- Use GarageBand (Mac)
- Use online tools like AudioTrimmer.com

## Updating Questions in Code

In `src/App.tsx`, modify the questions like this:

```typescript
const mockQuestions: Question[] = [
  {
    id: 1,
    question: "Your question here",
    audioUrl: "/audio/your-file.mp3",
    options: ["Option 1", "Option 2", "Option 3", "Option 4"],
    correctAnswer: 0  // Index of correct option (0-3)
  },
  // ... more questions
]
```

## Testing Your Audio
1. Add your audio files to this folder
2. Update the code with your file paths
3. Run `yarn dev` to test
4. Check browser console for any loading errors