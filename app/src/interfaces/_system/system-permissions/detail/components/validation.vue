<script setup lang="ts">
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { DeepPartial, Field, Permission, Policy } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppMinimal from './app-minimal.vue';

const props = defineProps<{
	permission: Permission;
	policy?: Policy;
	appMinimal?: Permission['validation'];
}>();

const emit = defineEmits(['update:permission']);

const { t } = useI18n();

const permissionLocal = ref({ validation: props.permission.validation });
const permissionInitial = permissionLocal.value;

const permissionSync = computed({
	get() {
		return permissionLocal.value;
	},
	set(value) {
		permissionLocal.value = value;

		emit('update:permission', {
			...props.permission,
			validation: value.validation !== undefined ? value.validation : permissionInitial.validation,
		});
	},
});

const fields = computed<DeepPartial<Field>[]>(() => [
	{
		field: 'validation',
		name: t('rule'),
		type: 'json',
		meta: {
			interface: 'system-filter',
			options: {
				collectionName: props.permission.collection,
				includeValidation: true,
				includeRelations: false,
				rawFieldNames: true,
			},
		},
	},
]);
</script>

<template>
	<div>
		<VNotice>
			{{
				t('validation_for_policy', {
					action: t(permission.action).toLowerCase(),
					policy: policy ? policy.name : t('public_label'),
				})
			}}
		</VNotice>

		<VForm v-model="permissionSync" :initial-values="permissionInitial" :fields="fields" />

		<AppMinimal :value="appMinimal" />
	</div>
</template>

<style scoped>
.v-notice {
	margin-block-end: 36px;
}
</style>
