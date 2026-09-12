import { DiffKind } from '@directus/types';
import type { Diff } from 'deep-diff';
import { describe, expect, it } from 'vitest';
import { isDeletedEntity, isNewEntity } from './diff-helpers.js';

describe('diff-helpers', () => {
	describe('isNewEntity', () => {
		it('returns true for root-level additions without a path', () => {
			const diff: Diff<any>[] = [{ kind: DiffKind.NEW, rhs: { collection: 'articles' } }];
			expect(isNewEntity(diff)).toBe(true);
		});

		it('returns false for property additions that have a path', () => {
			const diff: Diff<any>[] = [{ kind: DiffKind.NEW, path: ['meta', 'status'], rhs: 'draft' }];
			expect(isNewEntity(diff)).toBe(false);
		});

		it('returns false for root-level deletions', () => {
			const diff: Diff<any>[] = [{ kind: DiffKind.DELETE, lhs: { collection: 'articles' } }];
			expect(isNewEntity(diff)).toBe(false);
		});

		it('returns false for edits', () => {
			const diff: Diff<any>[] = [{ kind: DiffKind.EDIT, path: ['meta', 'icon'], lhs: 'a', rhs: 'b' }];
			expect(isNewEntity(diff)).toBe(false);
		});

		it('returns false for empty or undefined diffs', () => {
			expect(isNewEntity([])).toBe(false);
			expect(isNewEntity(undefined)).toBe(false);
		});
	});

	describe('isDeletedEntity', () => {
		it('returns true for root-level deletions without a path', () => {
			const diff: Diff<any>[] = [{ kind: DiffKind.DELETE, lhs: { collection: 'articles' } }];
			expect(isDeletedEntity(diff)).toBe(true);
		});

		it('returns false for property deletions that have a path', () => {
			const diff: Diff<any>[] = [{ kind: DiffKind.DELETE, path: ['meta', 'status'], lhs: 'draft' }];
			expect(isDeletedEntity(diff)).toBe(false);
		});

		it('returns false for root-level additions', () => {
			const diff: Diff<any>[] = [{ kind: DiffKind.NEW, rhs: { collection: 'articles' } }];
			expect(isDeletedEntity(diff)).toBe(false);
		});

		it('returns false for edits', () => {
			const diff: Diff<any>[] = [{ kind: DiffKind.EDIT, path: ['meta', 'icon'], lhs: 'a', rhs: 'b' }];
			expect(isDeletedEntity(diff)).toBe(false);
		});

		it('returns false for empty or undefined diffs', () => {
			expect(isDeletedEntity([])).toBe(false);
			expect(isDeletedEntity(undefined)).toBe(false);
		});
	});
});
