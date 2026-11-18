import { DOMSerializer, type Fragment, type Schema } from '@tiptap/pm/model';

export type SerializerHook = (
	dom: HTMLElement | DocumentFragment,
	fragment: Fragment,
	target: HTMLElement | DocumentFragment | undefined,
) => void;

class HookedSerializer extends DOMSerializer {
	readonly hooks: SerializerHook[] = [];

	constructor(schema: Schema) {
		super(DOMSerializer.nodesFromSchema(schema), DOMSerializer.marksFromSchema(schema));
	}

	override serializeFragment(
		fragment: Fragment,
		options?: { document?: Document },
		target?: HTMLElement | DocumentFragment,
	): HTMLElement | DocumentFragment {
		const dom = super.serializeFragment(fragment, options, target);
		for (const hook of this.hooks) hook(dom, fragment, target);
		return dom;
	}
}

/** A schema caches one serializer, so every extension that post-processes output must add a hook in `onBeforeCreate`. */
export function addSerializerHook(schema: Schema, hook: SerializerHook): void {
	let serializer = schema.cached['domSerializer'];

	if (!(serializer instanceof HookedSerializer)) {
		serializer = new HookedSerializer(schema);
		schema.cached['domSerializer'] = serializer;
	}

	(serializer as HookedSerializer).hooks.push(hook);
}
