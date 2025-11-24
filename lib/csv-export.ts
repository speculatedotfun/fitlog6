// Safe CSV export utilities
// Handles commas, quotes, and newlines in data

/**
 * Escape a CSV field value
 * Wraps in quotes if contains comma, quote, or newline
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Create a CSV row from an array of values
 */
export function createCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCsvField).join(',');
}

/**
 * Create CSV content from headers and rows
 */
export function createCsvContent(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const headerRow = createCsvRow(headers);
  const dataRows = rows.map(row => createCsvRow(row));
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file with BOM for Hebrew support
 */
export function downloadCsv(
  content: string,
  filename: string
): void {
  // Add BOM for Hebrew support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

