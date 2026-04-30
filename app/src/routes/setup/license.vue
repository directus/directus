<script setup lang="ts">
import { SetupForm } from '@directus/types';
import { defaultValues, useLicenseFields } from './form';
import VButton from '@/components/v-button.vue';
import VDivider from '@/components/v-divider.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

withDefaults(
	defineProps<{
		register?: boolean;
		modelValue?: Partial<SetupForm>;
		initialValues?: SetupForm;
	}>(),
	{
		register: true,
		initialValues: () => defaultValues,
		modelValue: () => ({}),
	},
);

const value = defineModel<SetupForm>();

const fields = useLicenseFields();
</script>

<template>
	<div class="license-form">
		<VForm
			v-model="value"
			:initial-values="initialValues"
			:show-validation-errors="false"
			:fields="fields"
			disabled-menu
		></VForm>

		<VDivider center>
			<span class="license-key-or">{{ $t('or') }}</span>
		</VDivider>

		<div class="get-license-key">
			{{ $t('no_license_key') }}
			<VButton secondary>
				<VIcon name="key"></VIcon>
				{{ $t('get_license_key') }}
			</VButton>
		</div>
	</div>
</template>

<style scoped>
.license-form {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
}

.v-form {
	--theme--form--row-gap: 1.8125rem;
}

.v-divider {
	margin-block: 1.8125rem;
}

.license-key-or {
	color: var(--theme--foreground-subdued);
	text-transform: lowercase;
	font-weight: 500;
}

.get-license-key {
	display: flex;
	font-weight: 600;
	align-items: center;
	justify-content: space-between;
	padding: 1.8125rem;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);

	.v-button {
		--v-button-background-color: var(--theme--background-accent);
		--v-button-background-color-hover: var(--theme--background-normal);

		.v-icon {
			margin-inline-end: 0.6875rem;
		}
	}
}
</style>
