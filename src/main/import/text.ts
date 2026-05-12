import fs from 'node:fs';
import { parseRawText } from './parser';
import { ImportCandidate } from '@shared/import';

export async function importFromText(filePath: string): Promise<ImportCandidate> {
  const text = fs.readFileSync(filePath, 'utf8');
  const { parsed, warnings } = parseRawText(text);
  
  return {
    rawText: text,
    parsed,
    warnings,
  };
}
