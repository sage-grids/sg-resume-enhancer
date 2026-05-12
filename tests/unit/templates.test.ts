import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../../src/main/templates/engine';

describe('Template Engine', () => {
  it('renders simple variables', () => {
    const template = 'Hello {{ name }}!';
    const data = { name: 'World' };
    expect(renderTemplate(template, data)).toBe('Hello World!');
  });

  it('renders nested variables', () => {
    const template = 'Hello {{ person.name }}!';
    const data = { person: { name: 'Alice' } };
    expect(renderTemplate(template, data)).toBe('Hello Alice!');
  });

  it('handles #if blocks (true)', () => {
    const template = '{{#if show}}Visible{{/if}}';
    const data = { show: true };
    expect(renderTemplate(template, data)).toBe('Visible');
  });

  it('handles #if blocks (false)', () => {
    const template = '{{#if show}}Visible{{/if}}';
    const data = { show: false };
    expect(renderTemplate(template, data)).toBe('');
  });

  it('handles #each blocks', () => {
    const template = '{{#each items as item}}{{ item }}, {{/each}}';
    const data = { items: ['A', 'B', 'C'] };
    expect(renderTemplate(template, data)).toBe('A, B, C, ');
  });

  it('handles nested #each and variables', () => {
    const template = '{{#each people as p}}{{ p.name }} ({{ p.age }}), {{/each}}';
    const data = {
      people: [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ],
    };
    expect(renderTemplate(template, data)).toBe('Alice (30), Bob (25), ');
  });
});
