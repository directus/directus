<script setup lang="ts">
import VCheckbox from '@/components/v-checkbox.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { useServerStore } from '@/stores/server';
import { SetupForm } from '@directus/types';
import { storeToRefs } from 'pinia';
import { computed, toRef } from 'vue';
import { I18nT } from 'vue-i18n';
import { defaultValues, useFormFields } from './form';

const { info } = storeToRefs(useServerStore());

const props = withDefaults(
	defineProps<{
		register?: boolean;
		skipLicense?: boolean;
		modelValue?: Partial<SetupForm>;
		errors?: Record<string, any>[];
		initialValues?: SetupForm;
		utmLocation?: string;
	}>(),
	{
		register: true,
		skipLicense: false,
		utmLocation: '',
		initialValues: () => defaultValues,
		modelValue: () => ({}),
	},
);

const initialValues = toRef(props, 'initialValues');

const value = defineModel<SetupForm>();

const license = computed({
	get: () => value.value?.license ?? initialValues.value.license,
	set: (val: boolean) => {
		if (value.value) {
			value.value.license = val;
		}
	},
});

const product_updates = computed({
	get: () => value.value?.product_updates ?? initialValues.value.product_updates,
	set: (val: boolean) => {
		if (value.value) {
			value.value.product_updates = val;
		}
	},
});

const fields = useFormFields(props.register, value, initialValues);
</script>

<template>
	<div class="setup-form" :class="{ skipLicense }">
		<template v-if="register">
			<h1>{{ $t('setup_welcome') }}</h1>
			<p>{{ $t('setup_info') }}</p>
		</template>
		<v-form
			v-model="value"
			:initial-values="initialValues"
			:validation-errors="errors"
			:show-validation-errors="false"
			:fields="fields"
			disabled-menu
		></v-form>
		<v-notice>
			<span v-md="$t('setup_license_notice')"></span>
			<br />
			<i18n-t keypath="setup_license_follow_up" tag="span">
				<template #contactOurTeam>
					<a
						:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${info.version}&utm_content=${utmLocation}_contact_our_team_link`"
						target="_blank"
					>
						{{ $t('contact_our_team') }}
					</a>
				</template>
			</i18n-t>
			<br />
			<span v-if="skipLicense">
				<br />
				<i18n-t v-if="skipLicense" keypath="setup_save_accept_license" tag="span">
					<template #directusBsl>
						<a
							:href="`https://directus.io/bsl?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${info.version}&utm_content=${utmLocation}_bsl_1.1_link`"
							target="_blank"
						>
							{{ $t('directus_bsl') }}
						</a>
					</template>
					<template #privacyPolicy>
						<a
							:href="`https://directus.io/privacy?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${info.version}&utm_content=${utmLocation}_privacy_link`"
							target="_blank"
						>
							{{ $t('privacy_policy') }}
						</a>
					</template>
				</i18n-t>
			</span>
		</v-notice>

		<v-checkbox v-if="!skipLicense" v-model="license">
			<i18n-t keypath="setup_accept_license" tag="span">
				<template #directusBsl>
					<a
						:href="`https://directus.io/bsl?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${info.version}&utm_content=bsl_1.1_link`"
						target="_blank"
					>
						{{ $t('directus_bsl') }}
					</a>
				</template>
				<template #privacyPolicy>
					<a
						:href="`https://directus.io/privacy?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${info.version}&utm_content=privacy_link`"
						target="_blank"
					>
						{{ $t('privacy_policy') }}
					</a>
				</template>
			</i18n-t>
		</v-checkbox>
		<v-checkbox v-model="product_updates">
			<span v-md="$t('setup_marketing_emails')"></span>
		</v-checkbox>
	</div>
</template>

<style scoped>
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

.v-form {
	--theme--form--row-gap: 32px;
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
	margin-block: 32px;
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
