import type { RichTextConfig } from '@directus/extensions';
import { createDocument, flattenExtensions, getHTMLFromFragment, getSchema, splitExtensions } from '@tiptap/core';
import type { MarkType, NodeType, Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import { fieldEditorExtensions } from '@/interfaces/input-rich-text-html/extensions';

function inParagraphDoc(schema: Schema, content: ProseMirrorNode): ProseMirrorNode | null {
	const inParagraph = schema.nodes['paragraph']!.createAndFill(null, content);
	return inParagraph ? schema.topNodeType.createAndFill(null, inParagraph) : null;
}

function nodeSample(schema: Schema, type: NodeType): ProseMirrorNode | null {
	const node = (type.isTextblock && type.createAndFill(null, schema.text('x'))) || type.createAndFill();
	if (!node) return null;

	// inline content has to sit in a paragraph; a child-only type such as a list item has no sample
	return schema.topNodeType.createAndFill(null, node) ?? inParagraphDoc(schema, node);
}

function markSample(schema: Schema, type: MarkType): ProseMirrorNode | null {
	if (!schema.nodes['paragraph']!.allowsMarkType(type)) return null;
	return inParagraphDoc(schema, schema.text('x', [type.create()]));
}

/**
 * Compares types as well as HTML: markup a core rule claims first (an `<h6>` read as `heading`) can
 * serialize to the same HTML while the contributed type is gone. Attributes stay out of the type
 * comparison because PreservedAttributes adds `data-*` names on parse without changing the HTML.
 */
function findMismatch(schema: Schema, doc: ProseMirrorNode): string | null {
	const html = getHTMLFromFragment(doc.content, schema);
	const parsed = createDocument(html, schema);

	if (parsed.toString() !== doc.toString()) {
		return `renderHTML writes ${html}, which parses back as ${parsed.toString()} instead of ${doc.toString()}`;
	}

	const reserialized = getHTMLFromFragment(parsed.content, schema);
	if (reserialized !== html) return `renderHTML writes ${html}, which saves back as ${reserialized}`;

	return null;
}

/**
 * Runs in production builds too, because authors build against a built Directus, not the app dev
 * server.
 *
 * Best effort: only default attribute values are sampled, and types with no standalone sample
 * (child-only nodes, marks a paragraph refuses) are skipped silently.
 */
export function warnAsymmetricRichTexts(configs: RichTextConfig[]): void {
	for (const config of configs) {
		if (!config.extensions?.length) continue;

		try {
			// each extension alone, so a clash between two extensions enabled on one field is not caught
			const schema = getSchema(fieldEditorExtensions(config.extensions));
			const { nodeExtensions, markExtensions } = splitExtensions(flattenExtensions(config.extensions));

			const checks = [
				...nodeExtensions.map(({ name }) => ({
					label: `node "${name}"`,
					sample: () => nodeSample(schema, schema.nodes[name]!),
				})),
				...markExtensions.map(({ name }) => ({
					label: `mark "${name}"`,
					sample: () => markSample(schema, schema.marks[name]!),
				})),
			];

			for (const { label, sample } of checks) {
				let mismatch: string | null;

				try {
					const doc = sample();
					mismatch = doc && findMismatch(schema, doc);
				} catch {
					// ProseMirror throws when it cannot fill a type, and a throwing renderHTML must not hide later types
					continue;
				}

				if (!mismatch) continue;

				// eslint-disable-next-line no-console
				console.warn(
					`Richtext extension "${config.id}": ${label} does not survive a round trip. ` +
						`${mismatch}. ` +
						`Every save of a field that uses it will warn that saving alters the content. ` +
						`Make parseHTML match the markup renderHTML writes, and raise its priority if a core rule claims that markup.`,
				);
			}
		} catch {
			// the check is advisory; the validator already reports extensions that break the schema
		}
	}
}
