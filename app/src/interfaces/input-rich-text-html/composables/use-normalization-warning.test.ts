import { afterEach, beforeEach, expect, test } from 'vitest';
import { nextTick, ref } from 'vue';
import { NORMALIZATION_WARNING_DISMISSED, useNormalizationWarning } from './use-normalization-warning';

beforeEach(() => {
	localStorage.removeItem(NORMALIZATION_WARNING_DISMISSED);
});

afterEach(() => {
	localStorage.removeItem(NORMALIZATION_WARNING_DISMISSED);
});

function setup(initialValue: string | null) {
	const value = ref<string | null>(initialValue);
	const usable = useNormalizationWarning(value);
	usable.checkValue();
	return { value, ...usable };
}

const LOSSY = '<marquee>a</marquee>';

test('clean content does not lock the editor', () => {
	const { normalizationLocked } = setup('<p>hello <strong>world</strong></p>');

	expect(normalizationLocked.value).toBe(false);
});

test('unsupported markup locks the editor', () => {
	const { normalizationLocked } = setup(LOSSY);

	expect(normalizationLocked.value).toBe(true);
});

test('clicking a locked editor opens the warning with a diff', () => {
	const { normalizationWarningOpen, normalizationWarningDiff, onLockedClick } = setup(LOSSY);

	onLockedClick();

	expect(normalizationWarningOpen.value).toBe(true);
	expect(normalizationWarningDiff.value.length).toBeGreaterThan(0);
});

test('clicking an unlocked editor opens nothing', () => {
	const { normalizationWarningOpen, onLockedClick } = setup('<p>hello</p>');

	onLockedClick();

	expect(normalizationWarningOpen.value).toBe(false);
});

test('page-break storage markers do not lock the editor', () => {
	const { normalizationLocked } = setup('<p>a</p><!-- pagebreak --><p>b</p>');

	expect(normalizationLocked.value).toBe(false);
});

test('an empty value does not lock; a re-check after async load does', () => {
	const { normalizationLocked, value, checkValue } = setup(null);

	expect(normalizationLocked.value).toBe(false);

	value.value = LOSSY;
	checkValue();

	expect(normalizationLocked.value).toBe(true);
});

test('confirm closes the warning and unlocks the editor', () => {
	const { normalizationLocked, normalizationWarningOpen, onLockedClick, confirmNormalizationWarning } = setup(LOSSY);

	onLockedClick();
	confirmNormalizationWarning();

	expect(normalizationWarningOpen.value).toBe(false);
	expect(normalizationLocked.value).toBe(false);
});

test('cancel keeps the editor locked and the warning reopens on the next click', () => {
	const { normalizationLocked, normalizationWarningOpen, onLockedClick, cancelNormalizationWarning } = setup(LOSSY);

	onLockedClick();
	cancelNormalizationWarning();

	expect(normalizationWarningOpen.value).toBe(false);
	expect(normalizationLocked.value).toBe(true);

	onLockedClick();

	expect(normalizationWarningOpen.value).toBe(true);
});

test('a re-check after an external value change re-locks even after confirm', () => {
	const { normalizationLocked, value, checkValue, onLockedClick, confirmNormalizationWarning } = setup(LOSSY);

	onLockedClick();
	confirmNormalizationWarning();
	expect(normalizationLocked.value).toBe(false);

	value.value = '<blink>b</blink>';
	checkValue();

	expect(normalizationLocked.value).toBe(true);
});

test('confirm without the checkbox does not persist the opt-out', async () => {
	const { onLockedClick, confirmNormalizationWarning } = setup(LOSSY);

	onLockedClick();
	confirmNormalizationWarning();
	await nextTick();

	expect(localStorage.getItem(NORMALIZATION_WARNING_DISMISSED)).not.toBe('true');
});

test('confirm with "don\'t show again" persists the opt-out and future instances never lock', async () => {
	const first = setup(LOSSY);

	first.onLockedClick();
	first.dontShowAgain.value = true;
	first.confirmNormalizationWarning();
	await nextTick();

	expect(localStorage.getItem(NORMALIZATION_WARNING_DISMISSED)).toBe('true');

	const second = setup(LOSSY);
	expect(second.normalizationLocked.value).toBe(false);
});

test('cancel with "don\'t show again" persists the opt-out and unlocks instead of bricking the field', async () => {
	const { normalizationLocked, onLockedClick, dontShowAgain, cancelNormalizationWarning } = setup(LOSSY);

	onLockedClick();
	dontShowAgain.value = true;
	cancelNormalizationWarning();
	await nextTick();

	expect(localStorage.getItem(NORMALIZATION_WARNING_DISMISSED)).toBe('true');
	expect(normalizationLocked.value).toBe(false);
});
