import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { resolveProjectId, getProjectDir } from '../project.js';
import { readJournal } from '../journal.js';
import { header, keyValue, line } from '../display.js';

// Dynamic imports for heavy libraries
let Document, Packer, Paragraph, TextRun, HeadingLevel, TableCell, TableRow, Table, WidthType, AlignmentType, BorderStyle, PageBreak, convertInchesToTwip;
let puppeteer;
let marked;

/**
 * Professional CSS styles for PDF export - Executive/CEO presentation quality
 */
const PDF_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@400;700&display=swap');

:root {
  --primary-color: #1a365d;
  --secondary-color: #2c5282;
  --accent-color: #3182ce;
  --success-color: #38a169;
  --warning-color: #d69e2e;
  --danger-color: #e53e3e;
  --text-color: #2d3748;
  --text-muted: #718096;
  --border-color: #e2e8f0;
  --bg-light: #f7fafc;
  --bg-accent: #ebf8ff;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11pt;
  line-height: 1.7;
  color: var(--text-color);
  max-width: 100%;
  margin: 0;
  padding: 40px 50px;
  background: #fff;
}

/* Page Header */
.page-header {
  border-bottom: 3px solid var(--primary-color);
  padding-bottom: 20px;
  margin-bottom: 30px;
}

/* Main Title */
h1 {
  font-family: 'Merriweather', Georgia, serif;
  font-size: 24pt;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 10px 0;
  padding-bottom: 15px;
  border-bottom: 3px solid var(--primary-color);
  page-break-after: avoid;
}

h2 {
  font-family: 'Merriweather', Georgia, serif;
  font-size: 16pt;
  font-weight: 700;
  color: var(--secondary-color);
  margin: 35px 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--accent-color);
  page-break-after: avoid;
}

h3 {
  font-size: 13pt;
  font-weight: 600;
  color: var(--primary-color);
  margin: 25px 0 12px 0;
  page-break-after: avoid;
}

h4 {
  font-size: 11pt;
  font-weight: 600;
  color: var(--secondary-color);
  margin: 20px 0 10px 0;
  page-break-after: avoid;
}

/* Paragraphs */
p {
  margin: 0 0 12px 0;
  text-align: justify;
  hyphens: auto;
}

/* Strong/Bold Text */
strong {
  font-weight: 600;
  color: var(--primary-color);
}

/* Executive Summary Box */
h2:first-of-type + p,
.executive-summary {
  background: linear-gradient(135deg, var(--bg-accent) 0%, #ffffff 100%);
  border-left: 4px solid var(--accent-color);
  padding: 20px;
  margin: 20px 0;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Tables - Professional Corporate Style */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 10pt;
  page-break-inside: avoid;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

thead {
  background: linear-gradient(180deg, var(--primary-color) 0%, var(--secondary-color) 100%);
}

th {
  color: #ffffff;
  font-weight: 600;
  text-align: left;
  padding: 14px 12px;
  border: none;
  font-size: 10pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

td {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: top;
}

tr:nth-child(even) {
  background-color: var(--bg-light);
}

tr:hover {
  background-color: var(--bg-accent);
}

/* Lists */
ul, ol {
  margin: 12px 0;
  padding-left: 25px;
}

li {
  margin: 6px 0;
  line-height: 1.6;
}

li::marker {
  color: var(--accent-color);
  font-weight: bold;
}

/* Nested lists */
ul ul, ol ol, ul ol, ol ul {
  margin: 5px 0;
}

/* Checkboxes in lists */
li input[type="checkbox"] {
  margin-right: 8px;
  accent-color: var(--accent-color);
}

/* Code blocks */
code {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  background: var(--bg-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9pt;
  color: var(--secondary-color);
}

pre {
  background: #1a202c;
  color: #e2e8f0;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 9pt;
  line-height: 1.5;
  margin: 15px 0;
}

pre code {
  background: transparent;
  color: inherit;
  padding: 0;
}

/* Blockquotes */
blockquote {
  border-left: 4px solid var(--accent-color);
  margin: 20px 0;
  padding: 15px 20px;
  background: var(--bg-light);
  font-style: italic;
  color: var(--text-muted);
}

/* Status indicators */
.status-approved, 
*:contains("✅"),
*[class*="approved"] {
  color: var(--success-color);
}

.status-pending,
*:contains("🔄") {
  color: var(--warning-color);
}

.status-rejected,
*:contains("❌") {
  color: var(--danger-color);
}

/* Horizontal rule */
hr {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, var(--border-color) 0%, var(--accent-color) 50%, var(--border-color) 100%);
  margin: 30px 0;
}

/* Key-Value pairs styling */
p strong:first-child {
  display: inline-block;
  min-width: 120px;
}

/* Emoji styling */
h2::before {
  margin-right: 10px;
}

/* Footer styling */
.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid var(--border-color);
  font-size: 9pt;
  color: var(--text-muted);
  text-align: center;
}

/* Print optimizations */
@media print {
  body {
    padding: 0;
  }
  
  h1, h2, h3, h4 {
    page-break-after: avoid;
  }
  
  table, figure, img {
    page-break-inside: avoid;
  }
  
  tr {
    page-break-inside: avoid;
  }
}

/* Page numbers */
@page {
  margin: 2cm;
  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-size: 9pt;
    color: var(--text-muted);
  }
}

/* Cover page styling */
.cover-page {
  text-align: center;
  padding: 100px 50px;
  page-break-after: always;
}

.cover-page h1 {
  font-size: 32pt;
  border: none;
  margin-bottom: 30px;
}

.cover-page .subtitle {
  font-size: 14pt;
  color: var(--text-muted);
  margin-bottom: 50px;
}

.cover-page .metadata {
  font-size: 11pt;
  color: var(--text-color);
  line-height: 2;
}
`;

/**
 * Load required dependencies dynamically
 */
async function loadDocxDependencies() {
  if (!Document) {
    try {
      const docx = await import('docx');
      Document = docx.Document;
      Packer = docx.Packer;
      Paragraph = docx.Paragraph;
      TextRun = docx.TextRun;
      HeadingLevel = docx.HeadingLevel;
      TableCell = docx.TableCell;
      TableRow = docx.TableRow;
      Table = docx.Table;
      WidthType = docx.WidthType;
      AlignmentType = docx.AlignmentType;
      BorderStyle = docx.BorderStyle;
      PageBreak = docx.PageBreak;
      convertInchesToTwip = docx.convertInchesToTwip;
    } catch (err) {
      console.error(chalk.red('Error: docx library not installed.'));
      console.log(chalk.yellow('Run: npm install docx'));
      process.exit(1);
    }
  }
}

async function loadPdfDependencies() {
  if (!puppeteer) {
    try {
      puppeteer = (await import('puppeteer')).default;
    } catch (err) {
      console.error(chalk.red('Error: puppeteer library not installed.'));
      console.log(chalk.yellow('Run: npm install puppeteer'));
      process.exit(1);
    }
  }
  if (!marked) {
    try {
      marked = (await import('marked')).marked;
    } catch (err) {
      console.error(chalk.red('Error: marked library not installed.'));
      console.log(chalk.yellow('Run: npm install marked'));
      process.exit(1);
    }
  }
}

/**
 * Parse markdown content to extract structure
 */
function parseMarkdown(content) {
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = '';
  let inTable = false;
  let tableRows = [];
  let listItems = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push({ type: 'code', content: codeBlockContent.trim() });
        codeBlockContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }
    
    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator rows
      if (!line.match(/^\|[\s\-:|]+\|$/)) {
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      elements.push({ type: 'table', rows: tableRows });
      inTable = false;
      tableRows = [];
    }
    
    // Lists
    if (line.match(/^[\s]*[-*+]\s/) || line.match(/^[\s]*\d+\.\s/) || line.match(/^[\s]*\[[ x]\]/i)) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(line.replace(/^[\s]*[-*+]\s/, '').replace(/^[\s]*\d+\.\s/, '').replace(/^[\s]*\[[ x]\]\s*/i, '').trim());
      continue;
    } else if (inList && line.trim() !== '') {
      elements.push({ type: 'list', items: listItems });
      inList = false;
      listItems = [];
    }
    
    // Headers
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', content: line.substring(2).trim() });
    } else if (line.startsWith('## ')) {
      elements.push({ type: 'h2', content: line.substring(3).trim() });
    } else if (line.startsWith('### ')) {
      elements.push({ type: 'h3', content: line.substring(4).trim() });
    } else if (line.startsWith('#### ')) {
      elements.push({ type: 'h4', content: line.substring(5).trim() });
    } else if (line.startsWith('---') || line.startsWith('***')) {
      elements.push({ type: 'hr' });
    } else if (line.trim() !== '') {
      elements.push({ type: 'paragraph', content: line });
    }
  }
  
  // Flush remaining elements
  if (inList && listItems.length > 0) {
    elements.push({ type: 'list', items: listItems });
  }
  if (inTable && tableRows.length > 0) {
    elements.push({ type: 'table', rows: tableRows });
  }
  
  return elements;
}

/**
 * Create professional DOCX document
 */
async function createDocx(content, metadata) {
  await loadDocxDependencies();
  
  const elements = parseMarkdown(content);
  const children = [];
  
  // Corporate color scheme
  const primaryColor = '1A365D';
  const accentColor = '3182CE';
  
  for (const el of elements) {
    switch (el.type) {
      case 'h1':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: el.content,
                bold: true,
                size: 48,
                color: primaryColor,
                font: 'Georgia',
              }),
            ],
            spacing: { before: 400, after: 200 },
            border: {
              bottom: { color: primaryColor, space: 1, style: BorderStyle.SINGLE, size: 12 },
            },
          })
        );
        break;
        
      case 'h2':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: el.content,
                bold: true,
                size: 32,
                color: primaryColor,
                font: 'Georgia',
              }),
            ],
            spacing: { before: 350, after: 150 },
            border: {
              bottom: { color: accentColor, space: 1, style: BorderStyle.SINGLE, size: 6 },
            },
          })
        );
        break;
        
      case 'h3':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: el.content,
                bold: true,
                size: 26,
                color: primaryColor,
              }),
            ],
            spacing: { before: 300, after: 100 },
          })
        );
        break;
        
      case 'h4':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: el.content,
                bold: true,
                size: 22,
                color: '2C5282',
              }),
            ],
            spacing: { before: 250, after: 80 },
          })
        );
        break;
        
      case 'paragraph':
        // Handle bold text in paragraphs
        const textRuns = parseTextWithFormatting(el.content);
        children.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 120 },
          })
        );
        break;
        
      case 'list':
        for (const item of el.items) {
          const itemRuns = parseTextWithFormatting(item);
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: '• ', bold: true, color: accentColor }),
                ...itemRuns,
              ],
              spacing: { after: 60 },
              indent: { left: convertInchesToTwip(0.3) },
            })
          );
        }
        break;
        
      case 'table':
        if (el.rows.length > 0) {
          const tableRows = el.rows.map((row, rowIndex) => {
            const isHeader = rowIndex === 0;
            return new TableRow({
              children: row.map(cell => 
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell,
                          bold: isHeader,
                          color: isHeader ? 'FFFFFF' : '2D3748',
                          size: 20,
                        }),
                      ],
                    }),
                  ],
                  shading: isHeader ? { fill: primaryColor } : (rowIndex % 2 === 0 ? { fill: 'F7FAFC' } : {}),
                  margins: {
                    top: 100,
                    bottom: 100,
                    left: 150,
                    right: 150,
                  },
                })
              ),
            });
          });
          
          children.push(
            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
          children.push(new Paragraph({ spacing: { after: 200 } }));
        }
        break;
        
      case 'code':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: el.content,
                font: 'Consolas',
                size: 18,
                color: '4A5568',
              }),
            ],
            shading: { fill: 'F7FAFC' },
            spacing: { before: 150, after: 150 },
            indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
          })
        );
        break;
        
      case 'hr':
        children.push(
          new Paragraph({
            border: {
              bottom: { color: 'E2E8F0', space: 1, style: BorderStyle.SINGLE, size: 6 },
            },
            spacing: { before: 300, after: 300 },
          })
        );
        break;
    }
  }
  
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
          },
        },
      },
      children: children,
    }],
  });
  
  return Packer.toBuffer(doc);
}

/**
 * Parse text with **bold** and other formatting
 */
function parseTextWithFormatting(text) {
  const runs = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.substring(lastIndex, match.index) }));
    }
    // Add bold text
    runs.push(new TextRun({ text: match[1], bold: true, color: '1A365D' }));
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.substring(lastIndex) }));
  }
  
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }
  
  return runs;
}

/**
 * Create professional PDF document
 */
async function createPdf(content, metadata) {
  await loadPdfDependencies();
  
  // Convert markdown to HTML
  const htmlContent = marked(content);
  
  // Create full HTML document with styles
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title || 'BABOK Analysis Document'}</title>
  <style>${PDF_STYLES}</style>
</head>
<body>
  <div class="document">
    ${htmlContent}
  </div>
  <div class="footer">
    <p><strong>BABOK Agent Analysis</strong> | Project: ${metadata.projectId || 'N/A'} | Generated: ${new Date().toISOString().split('T')[0]}</p>
    <p style="font-size: 8pt; color: #a0aec0;">Confidential - For Internal Use Only</p>
  </div>
</body>
</html>
`;
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '25mm',
      left: '20mm',
      right: '20mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 9px; color: #718096; width: 100%; text-align: center; padding: 5px 20px;">
        <span style="font-weight: 600;">${metadata.title || 'BABOK Analysis'}</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 9px; color: #718096; width: 100%; display: flex; justify-content: space-between; padding: 5px 20mm;">
        <span>Project: ${metadata.projectId || 'N/A'}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
  });
  
  await browser.close();
  return pdfBuffer;
}

/**
 * Find stage files in project
 */
function findStageFiles(projectDir) {
  const outputsDir = path.join(projectDir, 'outputs');
  const files = [];
  
  // Check outputs directory first
  if (fs.existsSync(outputsDir)) {
    const outputFiles = fs.readdirSync(outputsDir);
    for (const file of outputFiles) {
      if (file.endsWith('.md') && file.startsWith('STAGE_')) {
        files.push({
          name: file,
          path: path.join(outputsDir, file),
          stage: parseInt(file.match(/STAGE_(\d+)/)?.[1] || '0'),
        });
      }
    }
  }
  
  // Also check project root
  const rootFiles = fs.readdirSync(projectDir);
  for (const file of rootFiles) {
    if (file.endsWith('.md') && file.startsWith('STAGE_')) {
      const filePath = path.join(projectDir, file);
      if (!files.find(f => f.name === file)) {
        files.push({
          name: file,
          path: filePath,
          stage: parseInt(file.match(/STAGE_(\d+)/)?.[1] || '0'),
        });
      }
    }
  }
  
  return files.sort((a, b) => a.stage - b.stage);
}

/**
 * Main DOCX export command
 */
export async function makeDocx(partialId, options = {}) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(chalk.red(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided. Usage: babok make docx <project_id> [--stage <N>]'
    ));
    process.exit(1);
  }
  
  const journal = readJournal(projectId);
  const projectDir = getProjectDir(projectId);
  const stageFiles = findStageFiles(projectDir);
  
  if (stageFiles.length === 0) {
    console.error(chalk.red('Error: No stage files found in project.'));
    console.log(chalk.yellow('Complete at least one stage to generate documents.'));
    process.exit(1);
  }
  
  // Filter by stage if specified
  let filesToProcess = stageFiles;
  if (options.stage) {
    filesToProcess = stageFiles.filter(f => f.stage === parseInt(options.stage));
    if (filesToProcess.length === 0) {
      console.error(chalk.red(`Error: Stage ${options.stage} file not found.`));
      process.exit(1);
    }
  }
  
  const outputDir = options.output || path.join(projectDir, 'exports');
  fs.mkdirSync(outputDir, { recursive: true });
  
  console.log('');
  console.log(chalk.bold.cyan('📄 GENERATING DOCX DOCUMENTS'));
  console.log(chalk.dim(line()));
  keyValue('Project:', journal.project_id);
  keyValue('Name:', journal.project_name || 'N/A');
  keyValue('Files:', `${filesToProcess.length} stage file(s)`);
  console.log(chalk.dim(line()));
  
  const generatedFiles = [];
  
  for (const file of filesToProcess) {
    process.stdout.write(chalk.gray(`  Generating ${file.name}... `));
    
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const buffer = await createDocx(content, {
        title: file.name.replace('.md', ''),
        projectId: journal.project_id,
        projectName: journal.project_name,
      });
      
      const outputPath = path.join(outputDir, file.name.replace('.md', '.docx'));
      fs.writeFileSync(outputPath, buffer);
      generatedFiles.push(outputPath);
      
      console.log(chalk.green('✓'));
    } catch (err) {
      console.log(chalk.red('✗'));
      console.error(chalk.red(`    Error: ${err.message}`));
    }
  }
  
  console.log('');
  console.log(chalk.bold.green('✅ DOCX GENERATION COMPLETE'));
  console.log(chalk.dim(line()));
  keyValue('Output:', outputDir);
  keyValue('Generated:', `${generatedFiles.length} file(s)`);
  console.log(chalk.dim(line()));
  
  for (const file of generatedFiles) {
    console.log(chalk.gray(`  📄 ${path.basename(file)}`));
  }
  console.log('');
}

/**
 * Main PDF export command
 */
export async function makePdf(partialId, options = {}) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(chalk.red(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided. Usage: babok make pdf <project_id> [--stage <N>]'
    ));
    process.exit(1);
  }
  
  const journal = readJournal(projectId);
  const projectDir = getProjectDir(projectId);
  const stageFiles = findStageFiles(projectDir);
  
  if (stageFiles.length === 0) {
    console.error(chalk.red('Error: No stage files found in project.'));
    console.log(chalk.yellow('Complete at least one stage to generate documents.'));
    process.exit(1);
  }
  
  // Filter by stage if specified
  let filesToProcess = stageFiles;
  if (options.stage) {
    filesToProcess = stageFiles.filter(f => f.stage === parseInt(options.stage));
    if (filesToProcess.length === 0) {
      console.error(chalk.red(`Error: Stage ${options.stage} file not found.`));
      process.exit(1);
    }
  }
  
  const outputDir = options.output || path.join(projectDir, 'exports');
  fs.mkdirSync(outputDir, { recursive: true });
  
  console.log('');
  console.log(chalk.bold.magenta('📑 GENERATING PDF DOCUMENTS'));
  console.log(chalk.dim(line()));
  keyValue('Project:', journal.project_id);
  keyValue('Name:', journal.project_name || 'N/A');
  keyValue('Files:', `${filesToProcess.length} stage file(s)`);
  console.log(chalk.dim(line()));
  
  const generatedFiles = [];
  
  for (const file of filesToProcess) {
    process.stdout.write(chalk.gray(`  Generating ${file.name}... `));
    
    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const buffer = await createPdf(content, {
        title: file.name.replace('.md', '').replace(/_/g, ' '),
        projectId: journal.project_id,
        projectName: journal.project_name,
      });
      
      const outputPath = path.join(outputDir, file.name.replace('.md', '.pdf'));
      fs.writeFileSync(outputPath, buffer);
      generatedFiles.push(outputPath);
      
      console.log(chalk.green('✓'));
    } catch (err) {
      console.log(chalk.red('✗'));
      console.error(chalk.red(`    Error: ${err.message}`));
    }
  }
  
  console.log('');
  console.log(chalk.bold.green('✅ PDF GENERATION COMPLETE'));
  console.log(chalk.dim(line()));
  keyValue('Output:', outputDir);
  keyValue('Generated:', `${generatedFiles.length} file(s)`);
  console.log(chalk.dim(line()));
  
  for (const file of generatedFiles) {
    console.log(chalk.gray(`  📑 ${path.basename(file)}`));
  }
  console.log('');
}

/**
 * Combined make command
 */
export async function makeCommand(format, partialId, options = {}) {
  const formatLower = format?.toLowerCase();
  
  if (formatLower === 'docx') {
    await makeDocx(partialId, options);
  } else if (formatLower === 'pdf') {
    await makePdf(partialId, options);
  } else if (formatLower === 'all') {
    await makeDocx(partialId, options);
    await makePdf(partialId, options);
  } else {
    console.error(chalk.red(`Error: Unknown format '${format}'`));
    console.log(chalk.yellow('Available formats: docx, pdf, all'));
    process.exit(1);
  }
}
