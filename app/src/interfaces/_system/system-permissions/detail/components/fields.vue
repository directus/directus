<script setup lang="ts">
import { useFieldTree, type FieldNode } from '@/composables/use-field-tree';
import { useSync } from '@directus/composables';
import type { Permission, Policy } from '@directus/types';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

const permissionSync = useSync(props, 'permission', emit);
const collection = computed(() => props.permission.collection);
const isReadAction = computed(() => props.permission.action === 'read');
const { treeList } = useFieldTree(collection, ref(null), () => true, false, isReadAction.value);

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
</script>

<template>
	<div>
		<v-notice>
			{{
				t('fields_for_policy', {
					policy: policy ? policy.name : t('public_label'),
					action: t(permission.action).toLowerCase(),
				})
			}}
		</v-notice>

		<label class="type-label">{{ t('field', 0) }}</label>

		<v-checkbox-tree
			class="permissions-field-tree"
			:model-value="selectedValues"
			:choices="treeFields"
			value-combining="indeterminate"
			@update:model-value="selectedValues = $event"
		/>

		<app-minimal :value="appMinimal" />
	</div>
</template>

<style lang="scss" scoped>
.type-label {
	margin-bottom: 8px;
}

.v-notice {
	margin-bottom: 36px;
}

.permissions-field-tree {
	--v-list-padding: 20px 4px;

	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--form--field--input--background);
}
</style>
