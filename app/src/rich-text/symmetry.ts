import type { RichTextConfig } from '@directus/extensions';
import { createDocument, flattenExtensions, getHTMLFromFragment, getSchema, splitExtensions } from '@tiptap/core';
import type { MarkType, NodeType, Node as ProseMirrorNode, Schema } from '@tiptap/pm/model';
import { fieldEditorExtensions } from '@/interfaces/input-rich-text-html/extensions';

function nodeSample(schema: Schema, type: NodeType): ProseMirrorNode | null {
	const node = (type.isTextblock && type.createAndFill(null, schema.text('x'))) || type.createAndFill();
	if (!node) return null;

	const doc = schema.topNodeType;
	const paragraph = schema.nodes['paragraph']!;

	const wrapped = doc.createAndFill(null, node);
	if (wrapped) return wrapped;

	// inline content has to sit in a paragraph; a child-only type such as a list item has no sample
	const inParagraph = paragraph.createAndFill(null, node);
	return inParagraph ? doc.createAndFill(null, inParagraph) : null;
}

function markSample(schema: Schema, type: MarkType): ProseMirrorNode | null {
	const paragraph = schema.nodes['paragraph']!;
	if (!paragraph.allowsMarkType(type)) return null;

	return schema.topNodeType.createAndFill(null, paragraph.create(null, schema.text('x', [type.create()])));
}

/**
 * Serializes a default instance of the type, parses it back and serializes again. Default attributes
 * only, so an attribute whose own parseHTML and renderHTML disagree slips through.
 *
 * Checks the types as well as the HTML: markup a core rule claims first (an `<h6>` read as
 * `heading`) can serialize to the same HTML while the contributed type is gone. Attributes are left
 * out of the type check because PreservedAttributes picks up `data-*` names on parse that the sample
 * never had, without changing the HTML.
 */
function findMismatch(schema: Schema, sample: () => ProseMirrorNode | null): string | null {
	let doc: ProseMirrorNode | null;

	try {
		doc = sample();
	} catch {
		// ProseMirror throws when it cannot fill the type's content or marks: nothing to check
		return null;
	}

	if (!doc) return null;

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
 * A node or mark whose parseHTML does not read back what its renderHTML writes changes the content
 * on every parse, so every save of a field that enables it warns the user that saving alters the
 * content. That looks like a Directus bug, so tell the extension author. Runs in production builds
 * too, because authors build against a built Directus, not the app dev server.
 */
export function warnAsymmetricRichTexts(configs: RichTextConfig[]): void {
	for (const config of configs) {
		if (!config.extensions?.length) continue;

		try {
			// the same schema a field that enables only this extension builds
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
				const mismatch = findMismatch(schema, sample);
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
