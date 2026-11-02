import type { AnyExtension } from '@tiptap/vue-3';
import { buildCustomFormats, type CustomFormat } from './custom-formats';
import { buildLinkProtocolSchema } from './link-protocols';

export type InstanceSchemaOptions = { customFormats?: unknown; linkProtocols?: unknown };

/** The field options that change what the editor parses, so every round-trip check sees one schema. */
export function buildInstanceSchema(options: InstanceSchemaOptions): {
	extensions: AnyExtension[];
	formats: CustomFormat[];
	linkProtocols: string[];
	key: string;
} {
	const formats = buildCustomFormats(options.customFormats);
	const links = buildLinkProtocolSchema(options.linkProtocols);

	return {
		extensions: [...formats.extensions, ...links.extensions],
		formats: formats.formats,
		linkProtocols: links.protocols,
		key: `${formats.key}\u0000${links.key}`,
	};
}
