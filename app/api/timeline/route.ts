import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { TimelineData, TimelineEvent } from '@/types/timeline';

// Helper function to extract hyperlink from grid data
function getHyperlinkFromCell(gridData: any, rowIndex: number, colIndex: number): string | undefined {
  try {
    const row = gridData?.[rowIndex];
    const cell = row?.values?.[colIndex];
    return cell?.hyperlink;
  } catch {
    return undefined;
  }
}

// Helper function to extract URL and display text from HYPERLINK formula or grid data
function extractUrlAndText(
  formula: string | undefined,
  displayValue: string | undefined,
  gridData: any,
  rowIndex: number,
  colIndex: number
): { url?: string; text?: string } {
  // First, check if there's a hyperlink in the grid data (from Insert > Link)
  const hyperlinkUrl = getHyperlinkFromCell(gridData, rowIndex, colIndex);
  if (hyperlinkUrl) {
    return {
      url: hyperlinkUrl,
      text: displayValue
    };
  }

  // Next, check if it's a HYPERLINK formula
  if (formula) {
    const hyperlinkMatch = formula.match(/=HYPERLINK\("([^"]+)"(?:,\s*"([^"]+)")?\)/i);
    if (hyperlinkMatch) {
      return {
        url: hyperlinkMatch[1],
        text: hyperlinkMatch[2] || displayValue
      };
    }
  }

  // If neither, return the display value as URL
  return { url: displayValue, text: undefined };
}

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

    if (!apiKey || !sheetId) {
      return NextResponse.json(
        { error: 'Missing Google Sheets configuration. Please set GOOGLE_SHEETS_API_KEY and GOOGLE_SHEET_ID in .env.local' },
        { status: 500 }
      );
    }

    const sheets = google.sheets({ version: 'v4', auth: apiKey });

    // Fetch spreadsheet data with hyperlinks and formulas
    const [valuesResponse, formulasResponse, spreadsheetResponse] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:H`,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:H`,
        valueRenderOption: 'FORMULA',
      }),
      sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        ranges: [`${sheetName}!A:H`],
        includeGridData: true,
      }),
    ]);

    const rows = valuesResponse.data.values;
    const formulas = formulasResponse.data.values;
    const gridData = spreadsheetResponse.data.sheets?.[0]?.data?.[0]?.rowData;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the spreadsheet' },
        { status: 404 }
      );
    }

    // Skip header row and map to TimelineEvent objects
    // Expected columns: DateTime | Approx | Title | Description | Category | Actor(s) | Source | Media (optional)
    // Filter out rows without a datetime
    const events: TimelineEvent[] = rows
      .slice(1)
      .map((row, originalIndex) => ({ row, originalIndex })) // Track original index before filtering
      .filter(({ row }) => row[0]) // Skip rows without datetime
      .map(({ row, originalIndex }, eventIndex) => {
        const formulaRow = formulas?.[originalIndex + 1]; // +1 because we skip header
        const gridRowIndex = originalIndex + 1; // +1 because we skip header

        const sourceData = extractUrlAndText(formulaRow?.[6], row[6], gridData, gridRowIndex, 6);
        const mediaData = extractUrlAndText(formulaRow?.[7], row[7], gridData, gridRowIndex, 7);

        return {
          id: `event-${eventIndex}`,
          datetime: row[0],
          approx: row[1] || undefined,
          title: row[2] || '',
          description: row[3] || '',
          category: row[4] || undefined,
          actors: row[5] || undefined,
          source: sourceData.url,
          sourceText: sourceData.text,
          media: mediaData.url,
          mediaText: mediaData.text,
        };
      });

    // Sort events by datetime (chronological order)
    events.sort((a, b) => {
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return dateA - dateB;
    });

    const timelineData: TimelineData = {
      title: rows[0][1] || 'Timeline',
      description: rows[0][2] || undefined,
      events,
    };

    return NextResponse.json(timelineData);
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const revalidate = 300; // Revalidate every 5 minutes
