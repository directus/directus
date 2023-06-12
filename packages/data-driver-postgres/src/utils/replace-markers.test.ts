import { test, expect } from 'vitest';
import { replaceMarkers } from './replace-markers.js';

test('Replaces all instances of `?` with Postgres parameter markers', () => {
	expect(replaceMarkers('LIMIT ?')).toBe('LIMIT $1');
	expect(replaceMarkers('VALUES(?,?,?,?,?)')).toBe('VALUES($1,$2,$3,$4,$5)');
	expect(replaceMarkers('VALUES(?,?,?,?,?) LIMIT ?')).toBe('VALUES($1,$2,$3,$4,$5) LIMIT $6');
});
