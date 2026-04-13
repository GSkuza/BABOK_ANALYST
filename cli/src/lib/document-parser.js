import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Parse a document file and extract text sections.
 * @param {string} filePath
 * @returns {Promise<{ fileName: string, fileType: string, sections: Array<{ content: string, pageOrSheet: string|number }>, rawText: string }>}
 */
export async function parseDocument(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  switch (ext) {
    case '.pdf':
      return parsePdf(filePath, fileName);
    case '.docx':
      return parseDocx(filePath, fileName);
    case '.xlsx':
      return parseXlsx(filePath, fileName);
    case '.csv':
      return parseCsv(filePath, fileName);
    case '.txt':
    case '.md':
      return parsePlainText(filePath, fileName, ext);
    default:
      throw new Error(
        `Unsupported file type: ${ext}. Supported types: .pdf, .docx, .xlsx, .csv, .txt, .md`
      );
  }
}

async function parsePdf(filePath, fileName) {
  let pdfParse;
  try {
    const mod = await import('pdf-parse');
    pdfParse = mod.default;
  } catch (err) {
    const isNotInstalled = err.code === 'MODULE_NOT_FOUND' || err.message.includes('Cannot find');
    throw new Error(isNotInstalled
      ? 'pdf-parse is not installed. Run: npm install pdf-parse'
      : `Failed to load pdf-parse: ${err.message}`
    );
  }

  const buffer = readFileSync(filePath);
  let result;
  try {
    result = await pdfParse(buffer);
  } catch (err) {
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }

  const rawText = result.text || '';
  // Build per-page sections when pdf-parse provides page data
  const sections = [];
  if (result.numpages && result.numpages > 1) {
    // Split text roughly by page — pdf-parse puts form feed chars between pages
    const pages = rawText.split(/\f/);
    pages.forEach((pageText, idx) => {
      if (pageText.trim()) {
        sections.push({ content: pageText.trim(), pageOrSheet: idx + 1 });
      }
    });
  }
  if (sections.length === 0) {
    sections.push({ content: rawText.trim(), pageOrSheet: 1 });
  }

  return { fileName, fileType: 'pdf', sections, rawText };
}

async function parseDocx(filePath, fileName) {
  let mammoth;
  try {
    const mod = await import('mammoth');
    mammoth = mod.default;
  } catch (err) {
    const isNotInstalled = err.code === 'MODULE_NOT_FOUND' || err.message.includes('Cannot find');
    throw new Error(isNotInstalled
      ? 'mammoth is not installed. Run: npm install mammoth'
      : `Failed to load mammoth: ${err.message}`
    );
  }

  let result;
  try {
    result = await mammoth.extractRawText({ path: filePath });
  } catch (err) {
    throw new Error(`Failed to parse DOCX: ${err.message}`);
  }

  const rawText = result.value || '';
  const sections = [{ content: rawText.trim(), pageOrSheet: 1 }];
  return { fileName, fileType: 'docx', sections, rawText };
}

async function parseXlsx(filePath, fileName) {
  let ExcelJS;
  try {
    const mod = await import('exceljs');
    ExcelJS = mod.default ?? mod;
  } catch (err) {
    const isNotInstalled = err.code === 'MODULE_NOT_FOUND' || err.message.includes('Cannot find');
    throw new Error(isNotInstalled
      ? 'exceljs is not installed. Run: npm install exceljs'
      : `Failed to load exceljs: ${err.message}`
    );
  }

  let workbook;
  try {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
  } catch (err) {
    throw new Error(`Failed to parse XLSX: ${err.message}`);
  }

  const sections = [];
  workbook.eachSheet((worksheet, sheetId) => {
    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const cells = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cells.push(cell.text ?? String(cell.value ?? ''));
      });
      rows.push(cells.join(','));
    });
    const csvText = rows.join('\n');
    if (csvText.trim()) {
      sections.push({ content: csvText.trim(), pageOrSheet: worksheet.name });
    }
  });

  if (sections.length === 0) {
    sections.push({ content: '', pageOrSheet: 1 });
  }

  const rawText = sections.map(s => `[Sheet: ${s.pageOrSheet}]\n${s.content}`).join('\n\n');
  return { fileName, fileType: 'xlsx', sections, rawText };
}

function parseCsv(filePath, fileName) {
  const rawText = readFileSync(filePath, 'utf-8');
  const sections = [{ content: rawText.trim(), pageOrSheet: 1 }];
  return Promise.resolve({ fileName, fileType: 'csv', sections, rawText });
}

function parsePlainText(filePath, fileName, ext) {
  const rawText = readFileSync(filePath, 'utf-8');
  const sections = [{ content: rawText.trim(), pageOrSheet: 1 }];
  const fileType = ext === '.md' ? 'md' : 'txt';
  return Promise.resolve({ fileName, fileType, sections, rawText });
}
