import { describe, it, expect } from 'vitest';

/**
 * Isolated unit tests for Directus query sort direction string parsing.
 */

function parseSortDirection(field: string): { field: string; direction: 'asc' | 'desc' } {
  if (!field) return { field: '', direction: 'asc' };
  const trimmed = field.trim();
  if (trimmed.startsWith('-')) {
    return { field: trimmed.substring(1), direction: 'desc' };
  }
  return { field: trimmed, direction: 'asc' };
}

describe('Query Sort Direction Normalization', () => {
  it('should parse descending fields prefixed with minus', () => {
    expect(parseSortDirection('-created_at')).toEqual({ field: 'created_at', direction: 'desc' });
  });

  it('should parse ascending standard fields without prefix', () => {
    expect(parseSortDirection('user_name')).toEqual({ field: 'user_name', direction: 'asc' });
  });

  it('should trim surrounding whitespace before parsing', () => {
    expect(parseSortDirection('  -status  ')).toEqual({ field: 'status', direction: 'desc' });
  });
});
