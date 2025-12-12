import { diffArrays, diffJson, diffWordsWithSpace } from 'diff';
import { isEqual } from 'lodash';
import dompurify from 'dompurify';
import type { Field } from '@directus/types';
import { MIN_STRING_LENGTH_FOR_WORD_DIFF } from '@/constants/comparison-diff';

export type Change = {
	added?: boolean;
	removed?: boolean;
	updated?: boolean;
	count?: number;
	value: string | any;
	isHtml?: boolean;
};

const formattingTags = ['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

export function isHtmlString(value: any): boolean {
	if (typeof value !== 'string') return false;
	return /<[a-z][\s\S]*>/i.test(value);
}

function isFormattingElement(node: Node): boolean {
	if (node.nodeType !== Node.ELEMENT_NODE) return false;
	const tag = (node as HTMLElement).tagName;
	return formattingTags.includes(tag);
}

function hasInlineUnderline(element: HTMLElement): boolean {
	if (element.tagName === 'U') return true;

	const decoration = element.style.textDecoration || element.style.textDecorationLine;
	return decoration.toLowerCase().includes('underline');
}

function getFormattingSignature(textNode: Node): string {
	let current: Node | null = textNode.parentNode;
	const formatting = new Set<string>();

	while (current) {
		if (current.nodeType === Node.ELEMENT_NODE) {
			const element = current as HTMLElement;

			if (isFormattingElement(element)) {
				formatting.add(element.tagName);
			}

			if (hasInlineUnderline(element)) {
				formatting.add('U');
			}
		}

		current = current.parentNode;
	}

	return [...formatting].sort().join('|');
}

function getFormattingDiffRanges(
	baseContainer: HTMLElement,
	incomingContainer: HTMLElement,
): {
	base: { start: number; end: number }[];
	incoming: { start: number; end: number }[];
} {
	type TextNodeInfo = {
		node: Text;
		start: number;
		end: number;
		text: string;
		formatted: boolean;
		formattingSignature: string;
	};

	function collectTextNodes(node: Node, startOffset: number = 0): { nodes: TextNodeInfo[]; nextOffset: number } {
		const nodes: TextNodeInfo[] = [];

		function traverse(currentNode: Node, offset: number): number {
			if (currentNode.nodeType === Node.TEXT_NODE) {
				const text = currentNode.textContent || '';
				const trimmed = text.trim();
				const formattingSignature = getFormattingSignature(currentNode);
				const formatted = formattingSignature.length > 0;
				const start = offset;
				const end = offset + text.length;

				nodes.push({ node: currentNode as Text, start, end, text: trimmed, formatted, formattingSignature });
				return end;
			} else if (currentNode.nodeType === Node.ELEMENT_NODE) {
				let currentOffset = offset;

				Array.from(currentNode.childNodes).forEach((child) => {
					currentOffset = traverse(child, currentOffset);
				});

				return currentOffset;
			}

			return offset;
		}

		const nextOffset = traverse(node, startOffset);
		return { nodes, nextOffset };
	}

	const { nodes: baseTextNodes } = collectTextNodes(baseContainer);
	const { nodes: incomingTextNodes } = collectTextNodes(incomingContainer);

	const baseRanges: { start: number; end: number }[] = [];
	const incomingRanges: { start: number; end: number }[] = [];

	const incomingTextMap = new Map<string, TextNodeInfo>();

	for (const node of incomingTextNodes) {
		if (node.text && !incomingTextMap.has(node.text)) {
			incomingTextMap.set(node.text, node);
		}
	}

	const baseTextMap = new Map<string, TextNodeInfo>();

	for (const node of baseTextNodes) {
		if (node.text && !baseTextMap.has(node.text)) {
			baseTextMap.set(node.text, node);
		}
	}

	for (const baseNode of baseTextNodes) {
		if (!baseNode.text) continue;

		const matchingIncoming = incomingTextMap.get(baseNode.text) ?? null;

		const condition1 = baseNode.formatted && (!matchingIncoming || !matchingIncoming.formatted);

		const condition2 =
			baseNode.formatted &&
			matchingIncoming?.formatted &&
			baseNode.formattingSignature !== matchingIncoming.formattingSignature;

		const shouldHighlight = condition1 || condition2;

		if (shouldHighlight) {
			baseRanges.push({ start: baseNode.start, end: baseNode.end });
		}
	}

	for (const incomingNode of incomingTextNodes) {
		if (!incomingNode.text) continue;

		const matchingBase = baseTextMap.get(incomingNode.text) ?? null;

		const condition1 = incomingNode.formatted && (!matchingBase || !matchingBase.formatted);

		const condition2 =
			incomingNode.formatted &&
			matchingBase?.formatted &&
			incomingNode.formattingSignature !== matchingBase.formattingSignature;

		const shouldHighlight = condition1 || condition2;

		if (shouldHighlight) {
			incomingRanges.push({ start: incomingNode.start, end: incomingNode.end });
		}
	}

	for (const incomingNode of incomingTextNodes) {
		if (!incomingNode.text || !incomingNode.formatted) continue;

		const matchingBase = baseTextMap.get(incomingNode.text) ?? null;

		if (!matchingBase || !matchingBase.formatted) {
			for (const baseNode of baseTextNodes) {
				if (!baseNode.text || baseNode.formatted) continue;

				const baseText = baseNode.node.textContent || '';
				const incomingText = incomingNode.text.trim();

				if (incomingText && baseText.includes(incomingText)) {
					const index = baseText.indexOf(incomingText);
					const relativeStart = baseNode.start + index;
					const relativeEnd = relativeStart + incomingText.length;

					baseRanges.push({ start: relativeStart, end: relativeEnd });
					break;
				}
			}
		}
	}

	return { base: baseRanges, incoming: incomingRanges };
}

function computeHtmlDiff(baseValue: string, incomingValue: string): Change[] {
	const baseDiv = document.createElement('div');
	const incomingDiv = document.createElement('div');

	baseDiv.innerHTML = dompurify.sanitize(baseValue || '');
	incomingDiv.innerHTML = dompurify.sanitize(incomingValue || '');

	const baseText = baseDiv.textContent || '';
	const incomingText = incomingDiv.textContent || '';

	const textDiff = diffWordsWithSpace(baseText, incomingText);

	const formattingRanges = getFormattingDiffRanges(baseDiv, incomingDiv);

	const hasTextChange = textDiff.some((change) => change.added || change.removed);

	const hasFormattingChange = formattingRanges.base.length > 0 || formattingRanges.incoming.length > 0;

	if (!hasTextChange && !hasFormattingChange) {
		return [];
	}

	const baseHighlighted = applyTextDiffToHtml(baseDiv, textDiff, false, formattingRanges.base);
	const incomingHighlighted = applyTextDiffToHtml(incomingDiv, textDiff, true, formattingRanges.incoming);

	return [
		{
			removed: true,
			value: baseHighlighted,
			isHtml: true,
		},
		{
			added: true,
			value: incomingHighlighted,
			isHtml: true,
		},
	];
}

function applyTextDiffToHtml(
	container: HTMLElement,
	textDiff: Change[],
	isIncoming: boolean,
	formattingRanges: { start: number; end: number }[],
): string {
	const clone = container.cloneNode(true) as HTMLElement;
	const highlightClass = isIncoming ? 'diff-added' : 'diff-removed';

	function collectTextNodes(
		node: Node,
		startOffset: number = 0,
	): { nodes: { node: Text; start: number; end: number }[]; nextOffset: number } {
		const nodes: { node: Text; start: number; end: number }[] = [];

		function traverse(currentNode: Node, offset: number): number {
			if (currentNode.nodeType === Node.TEXT_NODE) {
				const text = currentNode.textContent || '';
				const start = offset;
				const end = offset + text.length;
				nodes.push({ node: currentNode as Text, start, end });
				return end;
			} else if (currentNode.nodeType === Node.ELEMENT_NODE) {
				let currentOffset = offset;

				Array.from(currentNode.childNodes).forEach((child) => {
					currentOffset = traverse(child, currentOffset);
				});

				return currentOffset;
			}

			return offset;
		}

		const nextOffset = traverse(node, startOffset);
		return { nodes, nextOffset };
	}

	const { nodes: textNodes } = collectTextNodes(clone);

	let currentOffset = 0;
	const highlightRanges: { start: number; end: number }[] = [];

	for (const change of textDiff) {
		if (isIncoming) {
			if (change.removed) {
				continue;
			}

			const changeText = String(change.value || '');
			const changeLength = changeText.length;
			const changeStart = currentOffset;
			const changeEnd = currentOffset + changeLength;

			if (change.added) {
				highlightRanges.push({ start: changeStart, end: changeEnd });
			}

			currentOffset = changeEnd;
		} else {
			if (change.added) {
				continue;
			}

			const changeText = String(change.value || '');
			const changeLength = changeText.length;
			const changeStart = currentOffset;
			const changeEnd = currentOffset + changeLength;

			if (change.removed) {
				highlightRanges.push({ start: changeStart, end: changeEnd });
			}

			currentOffset = changeEnd;
		}
	}

	highlightRanges.push(...formattingRanges);

	for (const textNodeInfo of textNodes) {
		const rangesForNode = highlightRanges.filter(
			(range) => range.start < textNodeInfo.end && range.end > textNodeInfo.start,
		);

		if (rangesForNode.length === 0) continue;

		const text = textNodeInfo.node.textContent || '';
		const parent = textNodeInfo.node.parentNode;
		if (!parent) continue;

		const fragments: Node[] = [];
		let lastIndex = 0;

		for (const range of rangesForNode) {
			const nodeStart = Math.max(0, range.start - textNodeInfo.start);
			const nodeEnd = Math.min(text.length, range.end - textNodeInfo.start);

			if (nodeStart > lastIndex) {
				const before = text.substring(lastIndex, nodeStart);

				if (before) {
					fragments.push(document.createTextNode(before));
				}
			}

			if (nodeStart < nodeEnd) {
				const highlight = text.substring(nodeStart, nodeEnd);

				if (highlight) {
					const highlightSpan = document.createElement('span');
					highlightSpan.className = highlightClass;
					highlightSpan.textContent = highlight;
					fragments.push(highlightSpan);
				}
			}

			lastIndex = nodeEnd;
		}

		if (lastIndex < text.length) {
			const after = text.substring(lastIndex);

			if (after) {
				fragments.push(document.createTextNode(after));
			}
		}

		if (fragments.length > 0) {
			fragments.forEach((fragment) => parent.insertBefore(fragment, textNodeInfo.node));
			parent.removeChild(textNodeInfo.node);
		}
	}

	return clone.innerHTML;
}

export function useComparisonDiff() {
	function computeDiff(baseValue: any, incomingValue: any, field?: Field): Change[] {
		let changes: Change[];

		if (isEqual(baseValue, incomingValue)) {
			if (field?.meta?.special && field.meta.special.includes('conceal')) {
				changes = [
					{
						updated: true,
						value: incomingValue,
					},
				];
			} else {
				return [];
			}
		} else if (
			typeof baseValue === 'string' &&
			typeof incomingValue === 'string' &&
			isHtmlString(baseValue) &&
			isHtmlString(incomingValue)
		) {
			changes = computeHtmlDiff(baseValue, incomingValue);
		} else if (
			typeof baseValue === 'string' &&
			typeof incomingValue === 'string' &&
			incomingValue.length > MIN_STRING_LENGTH_FOR_WORD_DIFF
		) {
			changes = diffWordsWithSpace(baseValue, incomingValue);
		} else if (Array.isArray(baseValue) && Array.isArray(incomingValue)) {
			changes = diffArrays(baseValue, incomingValue);
		} else if (
			baseValue &&
			incomingValue &&
			typeof baseValue === 'object' &&
			typeof incomingValue === 'object' &&
			!Array.isArray(baseValue) &&
			!Array.isArray(incomingValue)
		) {
			changes = diffJson(baseValue, incomingValue);
		} else {
			changes = [
				{
					removed: true,
					value: baseValue,
				},
				{
					added: true,
					value: incomingValue,
				},
			];
		}

		return changes;
	}

	return { computeDiff };
}
