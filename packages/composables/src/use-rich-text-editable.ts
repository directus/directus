import { RICHTEXT_EDITABLE_INJECT } from '@directus/constants';
import { computed, inject, type Ref } from 'vue';

/**
 * Whether the rich text field that renders a node view accepts edits. A richtext extension node view
 * reads this to hide its own edit controls: `editor.isEditable` is not reactive, so it does not
 * change when the field turns readonly, disabled or locked after the view mounted.
 *
 * Returns `true` outside the rich text interface.
 */
export function useRichTextEditable(): Readonly<Ref<boolean>> {
	const editable = inject<Readonly<Ref<boolean>> | null>(RICHTEXT_EDITABLE_INJECT, null);

	return computed(() => editable?.value ?? true);
}
