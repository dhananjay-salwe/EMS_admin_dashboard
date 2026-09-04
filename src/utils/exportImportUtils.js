/**
 * exportImportUtils.js
 * 
 * Reusable utility for exporting and importing data in CSV, Excel (XLS), and JSON formats.
 * Designed to be modular and reusable across all management and reporting pages.
 */

/**
 * Format the current date-time for file naming (e.g. YYYY-MM-DD_HH-mm)
 */
export const getFormattedTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}`;
};

/**
 * Trigger download of a Blob file in the browser
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Clean and escape values for CSV
 */
const formatCSVCell = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If string contains comma, quote, or newline, escape quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Extract column value from an item row
 */
const getCellValue = (item, col, index) => {
  if (typeof col.key === 'function') {
    return col.key(item, index);
  }
  return item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '';
};

/**
 * Export data array to CSV format
 * 
 * @param {Object} options
 * @param {Array} options.data - Array of row objects to export
 * @param {Array} options.columns - Array of column definitions: [{ key: 'state_name' | (row, idx) => ..., label: 'State' }]
 * @param {string} [options.filename] - Base filename without extension
 * @param {string} [options.title] - Optional title header in CSV
 */
export const exportToCSV = ({ data = [], columns = [], filename = 'export', title = '' }) => {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  const rows = [];

  // Optional title header
  if (title) {
    rows.push(`"${title.replace(/"/g, '""')}"`);
    rows.push(`"Generated on: ${new Date().toLocaleString()}"`);
    rows.push(''); // blank line
  }

  // Header row
  const headerLabels = columns.map(c => formatCSVCell(c.label));
  rows.push(headerLabels.join(','));

  // Data rows
  data.forEach((item, index) => {
    const rowValues = columns.map(col => {
      const val = getCellValue(item, col, index);
      return formatCSVCell(val);
    });
    rows.push(rowValues.join(','));
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel correctly recognizes UTF-8 characters and formatting
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fullFilename = `${filename}_${getFormattedTimestamp()}.csv`;

  downloadBlob(blob, fullFilename);
  return fullFilename;
};

/**
 * Export data array to structured Excel Spreadsheet format (.xls)
 * Uses structured XML-based / HTML spreadsheet table format supported natively by Excel and Sheets.
 * 
 * @param {Object} options
 * @param {Array} options.data - Array of row objects to export
 * @param {Array} options.columns - Array of column definitions: [{ key: '...', label: '...' }]
 * @param {string} [options.filename] - Base filename without extension
 * @param {string} [options.sheetName] - Worksheet title
 * @param {string} [options.title] - Top title in the spreadsheet
 */
export const exportToExcel = ({ data = [], columns = [], filename = 'export', sheetName = 'Sheet1', title = '' }) => {
  if (!data || data.length === 0) {
    throw new Error('No data available to export');
  }

  const tableRows = [];

  // Top title / metadata if provided
  if (title) {
    tableRows.push(`
      <tr>
        <th colspan="${columns.length}" style="background-color: #556ee6; color: #ffffff; font-size: 16px; font-weight: bold; text-align: left; padding: 12px; height: 35px;">
          ${title}
        </th>
      </tr>
      <tr>
        <td colspan="${columns.length}" style="color: #666666; font-size: 11px; padding: 6px; font-style: italic;">
          Generated on: ${new Date().toLocaleString()} | Total Records: ${data.length}
        </td>
      </tr>
      <tr><td colspan="${columns.length}" style="height: 10px;"></td></tr>
    `);
  }

  // Header row
  const headerCells = columns.map(c => `
    <th style="background-color: #2b3a4a; color: #ffffff; font-weight: 600; font-size: 12px; text-align: left; padding: 10px 14px; border: 1px solid #d1d5db;">
      ${c.label}
    </th>
  `).join('');
  tableRows.push(`<tr>${headerCells}</tr>`);

  // Data rows
  data.forEach((item, index) => {
    const isEven = index % 2 === 0;
    const bg = isEven ? '#ffffff' : '#f9fafb';
    const cells = columns.map(col => {
      const val = getCellValue(item, col, index);
      const displayVal = val === null || val === undefined ? '' : String(val);
      return `
        <td style="background-color: ${bg}; color: #374151; font-size: 12px; padding: 8px 14px; border: 1px solid #e5e7eb; vertical-align: middle;">
          ${displayVal.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </td>
      `;
    }).join('');
    tableRows.push(`<tr>${cells}</tr>`);
  });

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${sheetName}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          th, td { mso-number-format: "\\@"; } /* Treat as text to preserve leading zeros in codes */
        </style>
      </head>
      <body>
        <table>
          ${tableRows.join('')}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const fullFilename = `${filename}_${getFormattedTimestamp()}.xls`;

  downloadBlob(blob, fullFilename);
  return fullFilename;
};

/**
 * Simple CSV parser for future Import functionality
 * Parses CSV text into an array of objects based on header row
 * 
 * @param {string} csvText - Raw CSV content
 * @returns {Array<Object>}
 */
export const parseCSV = (csvText) => {
  if (!csvText || !csvText.trim()) return [];

  // Remove BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '');

  // Split lines accounting for possible \r\n
  const lines = [];
  let currentRow = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || '';
    });
    results.push(obj);
  }

  return results;
};

/**
 * Read uploaded CSV file in browser
 * 
 * @param {File} file - Browser File object
 * @returns {Promise<Array<Object>>}
 */
export const readCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCSV(text);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
};
