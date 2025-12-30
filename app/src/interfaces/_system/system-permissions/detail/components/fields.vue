<script setup lang="ts">
import AppMinimal from './app-minimal.vue';
import VCheckboxTree from '@/components/v-checkbox-tree/v-checkbox-tree.vue';
import VNotice from '@/components/v-notice.vue';
import { type FieldNode, useFieldTree } from '@/composables/use-field-tree';
import { useSync } from '@directus/composables';
import type { Permission, Policy } from '@directus/types';
import { computed, ref, useId } from 'vue';

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
		<VNotice>
			{{
				$t('fields_for_policy', {
					policy: policy ? policy.name : $t('public_label'),
					action: $t(permission.action).toLowerCase(),
				})
			}}
		</VNotice>

		<div class="label-wrapper">
			<div :id="labelId" class="type-label">{{ $t('field', 0) }}</div>

			<div v-if="isExpandable" class="expand-collapse-action">
				{{ $t('expand') }}
				<button type="button" @click="expandAll">{{ $t('all') }}</button>
				/
				<button type="button" @click="collapseAll">{{ $t('none') }}</button>
			</div>
		</div>

		<VCheckboxTree
			class="permissions-field-tree"
			:model-value="selectedValues"
			:aria-labelledby="labelId"
			:choices="treeFields"
			value-combining="indeterminate"
			:open-groups="openGroups"
			@update:model-value="selectedValues = $event"
			@group-toggle="openGroups = null"
		/>

		<AppMinimal :value="appMinimal" />
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
