# Timeline Website

A beautiful, narrative-driven vertical timeline website that pulls data from Google Sheets. Perfect for storytelling over extended periods with daily events.

## Features

- Vertical scrolling timeline with alternating layout
- Google Sheets integration for easy content updates
- Responsive design with dark mode support
- Beautiful gradient styling and smooth animations
- Support for images, categories, and locations
- Automatic date sorting and formatting

## Setup Instructions

### 1. Set Up Google Sheets

1. Create a new Google Spreadsheet
2. Set up your sheet with the following columns (in order):
   - **Column A**: DateTime (e.g., "2024-01-15 14:30" or "January 15, 2024 2:30 PM")
   - **Column B**: Approx (optional - for approximate times like "morning", "evening")
   - **Column C**: Title
   - **Column D**: Description
   - **Column E**: Category (optional)
   - **Column F**: Actor(s) (optional - people involved in the event)
   - **Column G**: Source (optional - citation or URL)
   - **Column H**: Media (optional - image URL)

3. The first row should contain your headers. Your data starts from row 2.

4. Make the spreadsheet public:
   - Click "Share" in the top right
   - Change "Restricted" to "Anyone with the link"
   - Set permission to "Viewer"

### 2. Get Google Sheets API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### 3. Configure Environment Variables

1. Copy `.env.local` and update it with your values:

```bash
GOOGLE_SHEETS_API_KEY=your_actual_api_key_here
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SHEET_NAME=Sheet1
```

To find your Sheet ID:

- Open your Google Sheet
- Look at the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
- Copy the long string between `/d/` and `/edit`

### 4. Install Dependencies and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your timeline.

## Project Structure

```plaintext
app/
├── api/
│   └── timeline/
│       └── route.ts          # API endpoint for fetching Google Sheets data
├── components/
│   ├── Timeline.tsx          # Main timeline container component
│   └── TimelineEvent.tsx     # Individual event component
└── page.tsx                  # Home page
types/
└── timeline.ts               # TypeScript type definitions
```

## Customization

### Styling

The timeline uses Tailwind CSS. You can customize colors, spacing, and styles in:

- [Timeline.tsx](app/components/Timeline.tsx) - Main container and layout
- [TimelineEvent.tsx](app/components/TimelineEvent.tsx) - Individual event cards

### Data Refresh

The timeline data is revalidated every 5 minutes by default. To change this, edit the `revalidate` value in [app/api/timeline/route.ts](app/api/timeline/route.ts).

## Example Google Sheet Format

| DateTime            | Approx   | Title              | Description                    | Category   | Actor(s)        | Source      | Media (optional) |
|--------------------|---------|--------------------|--------------------------------|------------|----------------|-------------|------------------|
| 2024-01-01 12:00 AM | midnight | New Year Event    | The year begins with hope...   | Milestone  | John Doe       | News Report | https://...      |
| 2024-01-15 2:30 PM |          | Important Meeting | A crucial decision was made... | Meeting    | Jane Smith     | https://... |                  |
| 2024-02-14 6:00 PM | evening  | Valentine's Day   | A day of celebration...        | Holiday    | Multiple       | Public      | https://...      |

## Deploy on Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/new)
3. Import your repository
4. Add your environment variables in the Vercel dashboard
5. Deploy

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Tailwind CSS](https://tailwindcss.com/docs)
