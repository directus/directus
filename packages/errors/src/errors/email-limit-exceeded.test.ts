import { expect, test } from 'vitest';
import { messageConstructor } from './email-limit-exceeded.js';

test('Constructs message without options', () => {
	expect(messageConstructor({})).toBe('Email sending limit exceeded.');
});

test('Constructs message ignoring points without duration', () => {
	expect(messageConstructor({ points: 100 })).toBe('Email sending limit exceeded.');
});

test('Constructs message ignoring duration without points', () => {
	expect(messageConstructor({ duration: 1 })).toBe('Email sending limit exceeded.');
});

test('Constructs message with only a custom message', () => {
	expect(messageConstructor({ message: '' })).toBe('Email sending limit exceeded.');
});

test('Constructs message with points and duration', () => {
	expect(
		messageConstructor({
			points: 100,
			duration: 1,
		}),
	).toBe('Email sending limit exceeded. Limit of 100 emails every 1 second.');
});

test('Constructs message with only a custom message', () => {
	expect(
		messageConstructor({
			message: 'CUSTOM MESSAGE',
		}),
	).toBe('Email sending limit exceeded. CUSTOM MESSAGE');
});

test('Constructs message with all options', () => {
	expect(
		messageConstructor({
			points: 100,
			duration: 1,
			message: 'CUSTOM MESSAGE',
		}),
	).toBe('Email sending limit exceeded. Limit of 100 emails every 1 second. CUSTOM MESSAGE');
});
