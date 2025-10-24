<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { initialValues, useFormFields } from './form';
import { SetupForm } from '@directus/types';

const { t } = useI18n();

const props = withDefaults(
	defineProps<{
		register?: boolean;
		skipLicense?: boolean;
		modelValue?: SetupForm;
		errors?: Record<string, any>[];
	}>(),
	{
		register: true,
		skipLicense: false,
		modelValue: () => initialValues,
	},
);

const value = defineModel<SetupForm>();

const license = computed({
	get: () => value.value?.license ?? false,
	set: (val: boolean) => {
		if (value.value) {
			value.value.license = val;
		}
	},
});

const product_updates = computed({
	get: () => value.value?.product_updates ?? false,
	set: (val: boolean) => {
		if (value.value) {
			value.value.product_updates = val;
		}
	},
});

const fields = useFormFields(props.register, value);
</script>

<template>
	<div class="setup-form" :class="{ skipLicense }">
		<template v-if="register">
			<h1>{{ t('setup_welcome') }}</h1>
			<p>{{ t('setup_info') }}</p>
		</template>
		<v-form
			v-model="value"
			:initial-values="initialValues"
			:validation-errors="errors"
			:show-validation-errors="false"
			:fields="fields"
			disabled-menu
		></v-form>
		<v-notice><span v-md="t(skipLicense ? 'edit_license_notice' : 'setup_license_notice')"></span></v-notice>

		<v-checkbox v-if="!skipLicense" v-model="license">
			<span v-md="t('setup_accept_license')"></span>
		</v-checkbox>
		<v-checkbox v-model="product_updates">
			<span v-md="t('setup_marketing_emails')"></span>
		</v-checkbox>
	</div>
</template>

<style lang="scss" scoped>
.setup-form {
	display: grid;

	&.skipLicense {
		.v-notice {
			grid-row: 1;
			margin-block: 0 20px;
		}

		.v-checkbox {
			grid-row: 2;
			margin-block-end: 32px;
		}
	}
}

h1 {
	color: var(--theme--foreground-accent);
	font-size: 40px;
	font-weight: 600;
	line-height: 48px;

	margin-block-end: 24px;
}

p {
	font-size: 14px;
	font-weight: 500;
	line-height: 20px;
	margin-block-end: 32px;
}

.v-notice {
	margin-block: var(--theme--form--row-gap);
}

.v-checkbox {
	block-size: 32px;

	span {
		font-weight: 600;
	}
}

:deep(.v-notice a),
:deep(.v-checkbox a) {
	color: var(--theme--primary);
	text-decoration: underline;
}
</style>
