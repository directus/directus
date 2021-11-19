<template>
	<v-menu v-model="menuActive" attached>
		<template #activator="{ toggle }">
			<v-input :disabled="disabled">
				<template #input>
					<span
						ref="contentEl"
						class="content"
						:contenteditable="!disabled"
					>
						<span class="text" />
					</span>
					<span v-if="placeholder && !modelValue" class="placeholder">{{ placeholder }}</span>
				</template>

				<template #append>
					<v-icon name="add_box" outline clickable :disabled="disabled" @click="toggle" />
				</template>
			</v-input>
		</template>

		<v-list v-if="!disabled" :mandatory="false" @toggle="loadFieldRelations($event.value)">
			<field-list-item v-for="field in treeList" :key="field.field" :field="field" :depth="depth" @add="addField" />
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, toRefs, ref, watch, onMounted, onUnmounted, PropType } from 'vue';
import FieldListItem from './field-list-item.vue';
import { FieldTree } from './types';
import { Field, Relation } from '@directus/shared/types';
import { useFieldTree } from '@/composables/use-field-tree';
import useTemplate from '@/composables/use-template';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	components: { FieldListItem },
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		modelValue: {
			type: String,
			default: null,
		},
		nullable: {
			type: Boolean,
			default: true,
		},
		collection: {
			type: String,
			default: null,
		},
		depth: {
			type: Number,
			default: undefined,
		},
		placeholder: {
			type: String,
			default: null,
		},
		inject: {
			type: Object as PropType<{ fields: Field[]; relations: Relation[] }>,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const contentEl = ref<HTMLElement>();
		const text = useSync(props, 'modelValue', emit)

		const menuActive = ref(false);

		const { collection, inject } = toRefs(props);
		const { treeList, loadFieldRelations } = useFieldTree(collection, inject);

		const {addBlock} = useTemplate(contentEl, text, /(\{\{.*?\}\})/g, (blockText) => {
			const block = document.createElement('button')

			const fieldPath = blockText.replaceAll(/(\{|\})/g, '').split('.');

			for (let i = 0; i < fieldPath.length; i++) {
				loadFieldRelations(fieldPath.slice(0, i).join('.'));
			}

			const field = findTree(treeList.value, fieldPath);

			if (!field) return block;

			block.innerText = field.name

			return block
		})

		return { menuActive, treeList, contentEl, loadFieldRelations, addBlock, addField };

		function addField(fieldKey: string) {
			addBlock(`{{${fieldKey}}}`)
		}

		function findTree(tree: FieldTree[] | undefined, fieldSections: string[]): FieldTree | undefined {
			if (tree === undefined) return undefined;

			const fieldObject = tree.find((f) => f.field === fieldSections[0]);

			if (fieldObject === undefined) return undefined;
			if (fieldSections.length === 1) return fieldObject;
			return findTree(fieldObject.children, fieldSections.slice(1));
		}
	},
});
</script>

<style scoped>
.content {
	display: block;
	flex-grow: 1;
	height: 100%;
	padding: var(--input-padding) 0;
	overflow: hidden;
	font-size: 14px;
	font-family: var(--family-monospace);
	white-space: nowrap;
}

:deep(br) {
	display: none;
}

:deep(span) {
	min-width: 1px;
	min-height: 1em;
}

:deep(button) {
	margin: -1px 4px 0;
	padding: 2px 4px 0;
	color: var(--primary);
	background-color: var(--primary-alt);
	border-radius: var(--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: background-color, color;
	user-select: none;
}

:deep(button:not(:disabled):hover) {
	color: var(--white);
	background-color: var(--danger);
}

.placeholder {
	position: absolute;
	top: 50%;
	left: 14px;
	color: var(--foreground-subdued);
	transform: translateY(-50%);
	user-select: none;
	pointer-events: none;
}

.content > :deep(*) {
	display: inline-block;
	white-space: nowrap;
}
</style>
