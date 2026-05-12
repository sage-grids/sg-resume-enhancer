import * as pdfjsLib from 'pdfjs-dist';
import fs from 'node:fs';
import { parseRawText } from './parser';
import { ImportCandidate } from '@shared/import';

export async function importFromPdf(filePath: string): Promise<ImportCandidate> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({
    data,
    useNodeCanvas: false,
    stopAtErrors: true,
  });
  
  const pdf = await loadingTask.promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => (item as { str: string }).str);
    fullText += strings.join(' ') + '\n';
  }
  
  const { parsed, warnings } = parseRawText(fullText);
  
  return {
    rawText: fullText,
    parsed,
    warnings,
  };
}
