<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { runContextCommand, type TableAction, tableActionGroups } from './table-actions';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	editor: Editor | undefined;
}>();

const { t } = useI18n();

const menuEl = ref<HTMLElement | null>(null);

// 'top' → card sits above the table (arrow points down); 'bottom' → it flipped below (arrow points up).
const placement = ref<'top' | 'bottom'>('top');

/** The table element wrapping the current selection — used to anchor the popup to the whole table. */
function tableElement(): HTMLElement | null {
	const editor = props.editor;
	if (!editor) return null;
	const { node } = editor.view.domAtPos(editor.state.selection.from);
	const el = node instanceof HTMLElement ? node : node.parentElement;
	return el?.closest('table') ?? null;
}

/** Show only while editing inside a table. */
function shouldShow(): boolean {
	const editor = props.editor;
	return !!editor && editor.isEditable && editor.isActive('table');
}

function getReferencedVirtualElement(): { getBoundingClientRect: () => DOMRect } | null {
	const table = tableElement();
	if (!table) return null;
	return { getBoundingClientRect: () => table.getBoundingClientRect() };
}

/** After Floating UI positions the card, point the arrow at the table whether we landed above or below it. */
function syncPlacement(): void {
	const card = menuEl.value;
	const table = tableElement();
	if (!card || !table) return;
	placement.value = card.getBoundingClientRect().top < table.getBoundingClientRect().top ? 'top' : 'bottom';
}

// Place above the table; flip below when there isn't room (i.e. it would collide with the toolbar at the top).
const options = computed(() => ({
	placement: 'top' as const,
	offset: 8,
	flip: props.editor ? { boundary: props.editor.view.dom, padding: 8 } : true,
	onShow: syncPlacement,
	onUpdate: syncPlacement,
}));

function isEnabled(action: TableAction): boolean {
	return props.editor ? action.isEnabled(props.editor) : false;
}

// Gating logic is exposed for unit testing without mounting the Floating UI plugin.
defineExpose({ shouldShow, getReferencedVirtualElement });
</script>

<template>
	<!-- BubbleMenu detaches its own root element on mount (el.remove() in @tiptap/vue-3), so this component's
	root must be a stable attached element — otherwise Vue resolves patch containers/anchors from the detached
	node and crashes mid-patch, leaving the editor half-rendered (only the toolbar visible). -->
	<div class="table-bubble-menu-anchor">
		<BubbleMenu
			v-if="editor"
			:editor="editor"
			plugin-key="tableBubbleMenu"
			:should-show="shouldShow"
			:get-referenced-virtual-element="getReferencedVirtualElement"
			:options="options"
		>
			<div ref="menuEl" class="table-bubble-menu" :class="`placement-${placement}`">
				<template v-for="(group, groupIndex) in tableActionGroups" :key="groupIndex">
					<div v-if="groupIndex > 0" class="separator" />
					<VButton
						v-for="action in group"
						:key="action.label"
						v-tooltip="t(`wysiwyg_options.${action.label}`)"
						class="toolbar-button"
						ghost
						small
						icon
						:disabled="!isEnabled(action)"
						@click="runContextCommand(editor, action.command)"
					>
						<VIcon :name="action.icon" />
					</VButton>
				</template>
			</div>
		</BubbleMenu>
	</div>
</template>

<style lang="scss" scoped>
.table-bubble-menu-anchor {
	display: contents;
}

.table-bubble-menu {
	position: relative;
	display: flex;
	align-items: center;
	gap: 0.125rem;
	padding: 0.25rem;
	color: var(--theme--popover--menu--foreground);
	background-color: var(--theme--popover--menu--background);
	border-radius: var(--theme--popover--menu--border-radius);
	box-shadow: var(--theme--popover--menu--box-shadow);

	// Arrow pointing at the table.
	&::after {
		content: '';
		position: absolute;
		inset-inline-start: 50%;
		inline-size: 0.625rem;
		block-size: 0.625rem;
		background-color: var(--theme--popover--menu--background);
		transform: translateX(-50%) rotate(45deg);
		pointer-events: none; // never intercept clicks/hover on the button it overlaps
	}

	&.placement-top::after {
		inset-block-end: -0.25rem;
	}

	&.placement-bottom::after {
		inset-block-start: -0.25rem;
	}
}

.separator {
	flex: 0 0 auto;
	align-self: center;
	block-size: 1.25rem;
	margin-inline: 0.125rem;
	border-inline-end: var(--theme--border-width) solid var(--theme--border-color-accent);
}
</style>
