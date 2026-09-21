import {
	DOMParser as ProseMirrorDOMParser,
	type Schema,
	type StyleParseRule,
	type TagParseRule,
} from '@tiptap/pm/model';

/**
 * What the schema drops from `input`, given `normalized` (the same HTML after a round trip). A
 * textual diff of the two also flags every harmless rewrite the parser makes (`<b>` to `<strong>`,
 * reordered attributes, implied `<p>` and `<tbody>` wrappers, reserialized CSS), so this check is
 * asymmetric: only markup present on the way in and absent on the way out counts.
 *
 * Elements are compared by the schema type the parser assigns them, through the parser's own rules,
 * so tag aliases resolve for free. Each attribute must survive on some element of that type. An
 * element no rule claims is unwrapped, which loses nothing unless it carried attributes. Style
 * declarations a style rule claims turn into marks, so they are accounted for by that mark.
 *
 * Returns one entry per loss: the open tag reduced to what is lost, or `#text` for missing text.
 */
export function findMarkupLoss(input: string, normalized: string, schema: Schema): string[] {
	const rules = parseRules(schema);
	const before = parseBody(input);
	const after = parseBody(normalized);

	const survivors = Array.from(after.querySelectorAll('*')).map((el) => describe(el as HTMLElement, rules));
	const survivingTypes = new Set(survivors.flatMap((s) => [s.type, ...s.marks]));
	const lost: string[] = [];

	for (const node of Array.from(before.querySelectorAll('*'))) {
		const el = node as HTMLElement;
		const { type, attrs, marks } = describe(el, rules);

		for (const mark of marks) {
			if (!survivingTypes.has(mark)) lost.push(openTag(el, attrs));
		}

		if (attrs.size === 0) continue;

		if (type === null) {
			lost.push(openTag(el, attrs));
			continue;
		}

		const candidates = survivors.filter((s) => s.type === type);
		if (candidates.some((s) => isSubset(attrs, s.attrs))) continue;

		const missing = new Map(
			Array.from(attrs).filter(([name, value]) => !candidates.some((s) => s.attrs.get(name) === value)),
		);

		lost.push(openTag(el, missing.size > 0 ? missing : attrs));
	}

	if (visibleText(before) !== visibleText(after)) lost.push('#text');

	return lost;
}

type Rules = { tags: TagParseRule[]; styles: StyleParseRule[] };

type Description = {
	/** schema type the parser assigns, `null` when it unwraps the element */
	type: string | null;
	/** attributes the element carries; `style` is split per declaration under a `style:` prefix */
	attrs: Map<string, string>;
	/** mark types produced by style declarations a style rule claimed */
	marks: string[];
};

// the parser never treats these as content, so their text and attributes are not a loss
const NON_CONTENT_TAGS = ['head', 'meta', 'link', 'title', 'style', 'script', 'noscript'];

// includes the atoms the schema lifts out of a paragraph (image, media), which then split its text
const BLOCK_TAGS = new Set([
	'address',
	'article',
	'aside',
	'audio',
	'blockquote',
	'br',
	'dd',
	'details',
	'div',
	'dl',
	'dt',
	'figcaption',
	'figure',
	'footer',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'header',
	'hr',
	'iframe',
	'img',
	'li',
	'ol',
	'p',
	'pre',
	'section',
	'summary',
	'table',
	'tbody',
	'td',
	'tfoot',
	'th',
	'thead',
	'tr',
	'ul',
	'video',
]);

function parseRules(schema: Schema): Rules {
	const { rules } = ProseMirrorDOMParser.fromSchema(schema);
	return {
		tags: rules.filter((rule): rule is TagParseRule => 'tag' in rule && rule.tag !== undefined),
		styles: rules.filter((rule): rule is StyleParseRule => 'style' in rule && rule.style !== undefined),
	};
}

function parseBody(html: string): HTMLElement {
	const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
	for (const el of Array.from(body.querySelectorAll(NON_CONTENT_TAGS.join(',')))) el.remove();
	return body;
}

// mirrors the parser's matchTag: first rule whose selector fits and whose getAttrs does not refuse
function matchType(el: HTMLElement, rules: Rules): string | null {
	for (const rule of rules.tags) {
		if (rule.namespace && rule.namespace !== el.namespaceURI) continue;
		if (!el.matches(rule.tag)) continue;
		if (rule.getAttrs?.(el) === false) continue;
		if (rule.ignore || rule.skip) return null;
		return rule.node ?? rule.mark ?? null;
	}

	return null;
}

// mirrors the parser's matchStyle: `undefined` when no rule claims the declaration, otherwise the
// mark it produces (or `null` for a rule that only clears marks)
function matchStyle(property: string, value: string, rules: Rules): string | null | undefined {
	for (const rule of rules.styles) {
		const [ruleProperty, ruleValue] = rule.style.split('=');
		if (ruleProperty !== property) continue;
		if (ruleValue !== undefined && ruleValue !== value) continue;
		if (rule.getAttrs?.(value) === false) continue;
		return rule.mark ?? null;
	}

	return undefined;
}

function describe(el: HTMLElement, rules: Rules): Description {
	const attrs = new Map<string, string>();
	const marks: string[] = [];

	for (const { name, value } of Array.from(el.attributes)) {
		if (name === 'style' || value === '') continue;
		attrs.set(name, value);
	}

	// the DOM reserializes declarations for both sides, so `font-size:11pt` and `font-size: 11pt;` agree
	for (let i = 0; i < el.style.length; i++) {
		const property = el.style[i]!;
		const value = el.style.getPropertyValue(property);
		const mark = matchStyle(property, value, rules);

		if (mark === undefined) attrs.set(`style:${property}`, value);
		else if (mark !== null) marks.push(mark);
	}

	return { type: matchType(el, rules), attrs, marks };
}

function isSubset(subset: Map<string, string>, superset: Map<string, string>): boolean {
	return Array.from(subset).every(([name, value]) => superset.get(name) === value);
}

function openTag(el: HTMLElement, attrs: Map<string, string>): string {
	const plain = Array.from(attrs).filter(([name]) => !name.startsWith('style:'));
	const style = Array.from(attrs).filter(([name]) => name.startsWith('style:'));
	const parts = plain.map(([name, value]) => `${name}="${value}"`);
	if (style.length > 0) parts.push(`style="${style.map(([name, value]) => `${name.slice(6)}: ${value}`).join('; ')}"`);
	return `<${el.tagName.toLowerCase()}${parts.length > 0 ? ' ' + parts.join(' ') : ''}>`;
}

// block boundaries and <br> separate words; inline wrappers the parser unwraps must not
function visibleText(root: HTMLElement): string {
	const parts: string[] = [];

	const walk = (node: Node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			parts.push(node.textContent ?? '');
			return;
		}

		if (node.nodeType !== Node.ELEMENT_NODE) return;
		const block = BLOCK_TAGS.has((node as HTMLElement).tagName.toLowerCase());
		if (block) parts.push(' ');
		for (const child of Array.from(node.childNodes)) walk(child);
		if (block) parts.push(' ');
	};

	walk(root);
	return parts
		.join('')
		.replace(/[ \t\n\r\f]+/g, ' ')
		.trim();
}
