import fs from 'fs';
import path from 'path';
import mjml from 'mjml';

type TemplateVars = Record<string, string>;

const TEMPLATES_DIR = path.join(__dirname, '..', 'email-templates');
const CACHE = new Map<string, string>();

function loadTemplate(name: string): string {
  if (CACHE.has(name)) return CACHE.get(name)!;
  const filePath = path.join(TEMPLATES_DIR, `${name}.mjml`);
  const content = fs.readFileSync(filePath, 'utf-8');
  CACHE.set(name, content);
  return content;
}

function fillVariables(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) {
      console.warn(`[EmailTemplate] Variable "{{${key}}}" not provided`);
      return `{{${key}}}`;
    }
    return vars[key] ?? `{{${key}}}`;
  });
}

export async function renderTemplate(name: string, vars: TemplateVars): Promise<{ html: string; text: string }> {
  const raw = loadTemplate(name);
  const filled = fillVariables(raw, vars);
  const { html, errors } = await mjml(filled, { beautify: true });

  if (errors && errors.length > 0) {
    console.error(`[EmailTemplate] MJML errors for "${name}":`, errors);
  }

  return {
    html,
    text: filled.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
  };
}

export function clearTemplateCache() {
  CACHE.clear();
}
