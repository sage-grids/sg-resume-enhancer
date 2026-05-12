/**
 * A minimal mustache-like template engine.
 * Supports:
 * - {{ variable }}
 * - {{#if condition}} ... {{/if}}
 * - {{#each list as item}} ... {{/each}}
 */

export function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;

  // Handle #each blocks
  const eachRegex = /{{#each\s+(\S+)\s+as\s+(\S+)}}([\s\S]*?){{\/each}}/g;
  result = result.replace(eachRegex, (_, listPath, itemName, content) => {
    const list = getPath(data, listPath);
    if (!Array.isArray(list)) return '';

    return list
      .map((item) => {
        const itemData = { ...data, [itemName]: item };
        return renderTemplate(content, itemData);
      })
      .join('');
  });

  // Handle #if blocks
  const ifRegex = /{{#if\s+(\S+)}}([\s\S]*?){{\/if}}/g;
  result = result.replace(ifRegex, (_, conditionPath, content) => {
    const condition = getPath(data, conditionPath);
    if (condition) {
      return renderTemplate(content, data);
    }
    return '';
  });

  // Handle simple variables
  const varRegex = /{{\s*([\w.]+)\s*}}/g;
  result = result.replace(varRegex, (_, path) => {
    const val = getPath(data, path);
    return val === undefined || val === null ? '' : String(val);
  });

  return result;
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}
