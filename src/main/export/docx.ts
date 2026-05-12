import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import fs from 'node:fs';
import { Resume } from '@shared/resume';
import { logger } from '../logger';

export async function exportToDocx(resume: Resume, outputPath: string): Promise<void> {
  const basics = resume.basics;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Name
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: basics.fullName, bold: true, size: 32 })],
          }),

          // Contact
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: [
                  basics.email,
                  basics.phone,
                  basics.location,
                  ...(basics.links?.map((l) => l.label) || []),
                ]
                  .filter(Boolean)
                  .join('  •  '),
                size: 20,
              }),
            ],
          }),

          // Summary
          ...(resume.summary
            ? [
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Summary', spacing: { before: 400 } }),
                new Paragraph({ text: resume.summary, spacing: { before: 200 } }),
              ]
            : []),

          // Experience
          ...(resume.experience.length > 0
            ? [
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Experience', spacing: { before: 400 } }),
                ...resume.experience.flatMap((item) => [
                  new Paragraph({
                    spacing: { before: 200 },
                    children: [
                      new TextRun({ text: item.company, bold: true }),
                      new TextRun({ text: `\t${item.startDate} – ${item.endDate || 'Present'}`, bold: true }),
                    ],
                    tabStops: [
                      {
                        type: 'right',
                        position: 9000,
                      },
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: item.role, italic: true })],
                  }),
                  ...item.bullets.map(
                    (bullet) =>
                      new Paragraph({
                        text: bullet.startsWith('-') ? bullet.substring(1).trim() : bullet,
                        bullet: { level: 0 },
                      }),
                  ),
                ]),
              ]
            : []),

          // Education
          ...(resume.education.length > 0
            ? [
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Education', spacing: { before: 400 } }),
                ...resume.education.flatMap((item) => [
                  new Paragraph({
                    spacing: { before: 200 },
                    children: [
                      new TextRun({ text: item.institution, bold: true }),
                      new TextRun({ text: `\t${item.endDate}`, bold: true }),
                    ],
                    tabStops: [
                      {
                        type: 'right',
                        position: 9000,
                      },
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: item.degree }),
                      ...(item.field ? [new TextRun({ text: `, ${item.field}` })] : []),
                    ],
                  }),
                ]),
              ]
            : []),

          // Skills
          ...(resume.skills.length > 0
            ? [
                new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Skills', spacing: { before: 400 } }),
                ...resume.skills.map(
                  (group) =>
                    new Paragraph({
                      spacing: { before: 100 },
                      children: [
                        new TextRun({ text: `${group.category}: `, bold: true }),
                        new TextRun({ text: group.items.join(', ') }),
                      ],
                    }),
                ),
              ]
            : []),
        ],
      },
    ],
  });

  try {
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    logger.info(`DOCX exported successfully to ${outputPath}`);
  } catch (e) {
    logger.error('Failed to export DOCX', e);
    throw e;
  }
}
