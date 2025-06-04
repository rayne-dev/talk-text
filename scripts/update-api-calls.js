// Update API calls to include authentication headers
const fs = require("fs")
const path = require("path")

// Update the transcribe API call in recording-page.tsx
const recordingPagePath = path.join(__dirname, "../components/recording-page.tsx")
let recordingPageContent = fs.readFileSync(recordingPagePath, "utf8")

// Add headers to the transcribe API call
recordingPageContent = recordingPageContent.replace(
  /const response = await fetch$$'\/api\/transcribe', \{[\s\S]*?\}$$/,
  `const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'x-gemini-key': localStorage.getItem('gemini-api-key') || '',
        },
        body: formData,
      })`,
)

fs.writeFileSync(recordingPagePath, recordingPageContent)

// Update the notion API call in results page
const resultsPagePath = path.join(__dirname, "../app/results/page.tsx")
let resultsPageContent = fs.readFileSync(resultsPagePath, "utf8")

// Add headers to the notion API call
resultsPageContent = resultsPageContent.replace(
  /const response = await fetch$$'\/api\/notion', \{[\s\S]*?\}$$/,
  `const response = await fetch('/api/notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-notion-token': localStorage.getItem('notion-token') || '',
          'x-notion-db-id': localStorage.getItem('notion-db-id') || '',
        },
        body: JSON.stringify({
          text: result.text,
          category: selectedCategory,
          mode: result.mode,
          timestamp: result.timestamp,
        }),
      })`,
)

fs.writeFileSync(resultsPagePath, resultsPageContent)

console.log("API calls updated with authentication headers")
