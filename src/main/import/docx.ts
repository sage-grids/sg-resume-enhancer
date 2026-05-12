import mammoth from 'mammoth';
import { parseRawText } from './parser';
import { ImportCandidate } from '@shared/import';

export async function importFromDocx(filePath: string): Promise<ImportCandidate> {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  const { parsed, warnings } = parseRawText(text);
  
  return {
    rawText: text,
    parsed,
    warnings: [...warnings, ...result.messages.map(m => m.message)],
  };
}
