import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { escapeHtml } from './escape-html.util';

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

function resolveTemplatePath(templateFileName: string): string {
  const candidates = [
    join(__dirname, '..', 'templates', templateFileName),
    join(process.cwd(), 'dist', 'src', 'email', 'templates', templateFileName),
    join(process.cwd(), 'src', 'email', 'templates', templateFileName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Template file not found: ${templateFileName}`);
}

export function compileEmailTemplate(
  templateFileName: string,
  variables: Record<string, string>,
): string {
  const templatePath = resolveTemplatePath(templateFileName);
  const source = readFileSync(templatePath, 'utf-8');

  const unresolvedKeys = new Set<string>();
  const compiled = source.replace(PLACEHOLDER_PATTERN, (_match, key: string) => {
    const value = variables[key];
    if (value == null) {
      unresolvedKeys.add(key);
      return '';
    }

    return escapeHtml(value);
  });

  if (unresolvedKeys.size > 0) {
    throw new Error(
      `Missing template variables: ${[...unresolvedKeys].sort().join(', ')}`,
    );
  }

  return compiled;
}
