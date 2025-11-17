<script setup lang="ts">
import { useFieldTree, type FieldNode } from '@/composables/use-field-tree';
import { useSync } from '@directus/composables';
import type { Permission, Policy } from '@directus/types';
import { ref, computed, useId } from 'vue';
import AppMinimal from './app-minimal.vue';

type TreeChoice = {
	text: string;
	value: string;
	disabled: boolean;
	children?: TreeChoice[];
};

const props = defineProps<{
	permission: Permission;
	policy?: Policy;
	appMinimal?: Permission['fields'];
}>();

const emit = defineEmits(['update:permission']);

const labelId = useId();
const permissionSync = useSync(props, 'permission', emit);
const collection = computed(() => props.permission.collection);
const isReadAction = computed(() => props.permission.action === 'read');
const { treeList } = useFieldTree(collection, ref(null), () => true, false, isReadAction.value);
const { isExpandable, openGroups, expandAll, collapseAll } = useExpandCollapseAll();

const treeFields = computed<TreeChoice[]>(() => {
	const appMinimal = new Set(props.appMinimal ?? []);

	return treeList.value.map(fieldNodeToTreeChoice);

	function fieldNodeToTreeChoice(field: FieldNode): TreeChoice {
		return {
			text: field.name,
			disabled: appMinimal.has('*') || appMinimal.has(field.field),
			value: field.field,
			children: field.children?.map(fieldNodeToTreeChoice) ?? undefined,
		};
	}
});

const selectedValues = computed({
	get() {
		const fields = new Set([...(props.appMinimal ?? []), ...(permissionSync.value.fields ?? [])]);

		if (fields.has('*')) {
			fields.delete('*');
			selectAllFieldValues(treeFields.value);
		}

		return Array.from(fields);

		function selectAllFieldValues(fieldsArr: TreeChoice[]) {
			for (const field of fieldsArr) {
				fields.add(field.value);
				if (field.children) selectAllFieldValues(field.children);
			}
		}
	},
	set(newFields: string[] | null) {
		const fields: string[] = [];

		const appMinimal = new Set(props.appMinimal ?? []);
		const previousFields = new Set(permissionSync.value.fields ?? []);

		for (const field of newFields ?? []) {
			// Ignore fields coming from app minimal permissions only
			if (appMinimal.has(field) && !previousFields.has(field)) continue;
			fields.push(field);
		}

		if (fields.length > 0) {
			permissionSync.value = {
				...permissionSync.value,
				fields,
			};
		} else {
			permissionSync.value = {
				...permissionSync.value,
				fields: null,
			};
		}
	},
});

function useExpandCollapseAll() {
	const openGroups = ref<string[] | null>();

	const allGroupFields = computed(() => {
		const groupFields: string[] = [];
		addGroupFields(treeList.value);

		return groupFields;

		function addGroupFields(nodes: FieldNode[]) {
			nodes
				.filter((field) => field.group)
				.forEach((field) => {
					groupFields.push(field.field);
					if (field.children) addGroupFields(field.children);
				});
		}
	});

	const isExpandable = computed(() => allGroupFields.value.length);

	return {
		isExpandable,
		openGroups,
		expandAll,
		collapseAll,
	};

	function expandAll() {
		openGroups.value = allGroupFields.value;
	}

	function collapseAll() {
		openGroups.value = [];
	}
}
</script>

<template>
	<div>
		<v-notice>
			{{
				$t('fields_for_policy', {
					policy: policy ? policy.name : $t('public_label'),
					action: $t(permission.action).toLowerCase(),
				})
			}}
		</v-notice>

		<div class="label-wrapper">
			<div :id="labelId" class="type-label">{{ $t('field', 0) }}</div>

			<div v-if="isExpandable" class="expand-collapse-action">
				{{ $t('expand') }}
				<button type="button" @click="expandAll">{{ $t('all') }}</button>
				/
				<button type="button" @click="collapseAll">{{ $t('none') }}</button>
			</div>
		</div>

		<v-checkbox-tree
			class="permissions-field-tree"
			:model-value="selectedValues"
			:aria-labelledby="labelId"
			:choices="treeFields"
			value-combining="indeterminate"
			:open-groups="openGroups"
			@update:model-value="selectedValues = $event"
			@group-toggle="openGroups = null"
		/>

		<app-minimal :value="appMinimal" />
	</div>
</template>

<style lang="scss" scoped>
.v-notice {
	margin-block-end: 36px;
}

.label-wrapper {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
}

.type-label {
	margin-block-end: 8px;
}

.expand-collapse-action {
	color: var(--theme--foreground-subdued);

	button {
		color: var(--theme--foreground-subdued);
		transition: color var(--fast) var(--transition);
	}

	button:hover {
		color: var(--theme--foreground);
		transition: none;
	}
}

.permissions-field-tree {
	--v-list-padding: 20px 4px;

	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--form--field--input--background);
}
</style>
