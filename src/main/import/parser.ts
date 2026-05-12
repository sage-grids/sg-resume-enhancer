import { Resume, ExperienceItem } from '@shared/resume';
import { nanoid } from 'nanoid';

export function parseRawText(text: string): { parsed: Partial<Resume>; warnings: string[] } {
  const lines = text.split('\n').map((l) => l.trim());
  const warnings: string[] = [];
  const parsed: Partial<Resume> = {
    schemaVersion: 1,
    basics: { fullName: '', links: [] },
    experience: [],
    education: [],
    skills: [],
  };

  const sections: Record<string, string[]> = {
    basics: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
  };

  let currentSection = 'basics';

  const sectionHeaders: Record<string, RegExp> = {
    summary: /^(summary|profile|professional summary|about me)$/i,
    experience: /^(experience|employment|work history|professional experience)$/i,
    education: /^(education|academic background)$/i,
    skills: /^(skills|competencies|technical skills|expertise)$/i,
  };

  for (const line of lines) {
    if (!line) continue;

    let foundHeader = false;
    for (const [key, regex] of Object.entries(sectionHeaders)) {
      if (regex.test(line)) {
        currentSection = key;
        foundHeader = true;
        break;
      }
    }

    if (!foundHeader) {
      sections[currentSection].push(line);
    }
  }

  // Parse Basics
  const basicLines = sections['basics'];
  if (basicLines.length > 0) {
    parsed.basics!.fullName = basicLines[0];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

    for (let i = 1; i < basicLines.length; i++) {
      const line = basicLines[i];
      const emailMatch = line.match(emailRegex);
      if (emailMatch) parsed.basics!.email = emailMatch[0];

      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch) parsed.basics!.phone = phoneMatch[0];

      if (!parsed.basics!.headline && i === 1 && !emailMatch && !phoneMatch) {
        parsed.basics!.headline = line;
      }
    }
  }

  // Parse Summary
  if (sections['summary'].length > 0) {
    parsed.summary = sections['summary'].join(' ');
  } else {
    warnings.push('Could not detect Summary section');
  }

  // Parse Experience (Very basic heuristic)
  if (sections['experience'].length > 0) {
    let currentItem: Partial<ExperienceItem> | null = null;
    for (const line of sections['experience']) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        if (currentItem) {
          currentItem.bullets!.push(line.replace(/^[•\-*]\s*/, ''));
        }
      } else {
        if (currentItem) parsed.experience!.push(currentItem as ExperienceItem);
        currentItem = {
          id: nanoid(),
          company: line,
          role: '',
          startDate: '',
          endDate: null,
          bullets: [],
        };
      }
    }
    if (currentItem) parsed.experience!.push(currentItem as ExperienceItem);
  } else {
    warnings.push('Could not detect Experience section');
  }

  // Parse Education
  if (sections['education'].length > 0) {
    for (const line of sections['education']) {
      parsed.education!.push({
        id: nanoid(),
        institution: line,
        degree: '',
        startDate: '',
        endDate: '',
      });
    }
  } else {
    warnings.push('Could not detect Education section');
  }

  // Parse Skills
  if (sections['skills'].length > 0) {
    parsed.skills!.push({
      id: nanoid(),
      category: 'General',
      items: sections['skills'].flatMap(s => s.split(/[,|/]/)).map(s => s.trim()).filter(Boolean),
    });
  } else {
    warnings.push('Could not detect Skills section');
  }

  return { parsed, warnings };
}
