/**
 * Transform template variables by prefixing field keys with a path
 * 
 * This utility is used in relational displays/interfaces to transform template strings
 * when the data is nested under a path
 * 
 * @param template - The template string containing mustache variables (e.g., "{{name}}")
 * @param path - Array of path segments to prefix each variable with (e.g., ["tags_id"])
 * @returns Transformed template with prefixed variables (e.g., "{{tags_id.name}}")
 */
export function transformTemplateVariablesWithPath(template: string, path: string[]): string {
  if (!path) return template;

  const regex = /({{.*?}})/g;
  const parts = template.split(regex).filter((p) => p);
  let transformedTemplate = template;

  for (const part of parts) {
    if (!part.startsWith('{{')) continue;

    const key = part.replace(/{{/g, '').replace(/}}/g, '').trim();

    transformedTemplate = transformedTemplate.replace(part, `{{${[...path, key].join('.')}}}`);
  }

  return transformedTemplate;
}

