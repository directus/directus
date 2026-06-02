<script setup lang="ts">
import { DIRECTUS_MSCL_URL, DIRECTUS_PRIVACY_URL } from '@directus/constants';
import { ValidationError as DirectusValidationError, SetupForm } from '@directus/types';
import { storeToRefs } from 'pinia';
import { computed, toRef } from 'vue';
import { I18nT } from 'vue-i18n';
import z from 'zod';
import { defaultValues, useSetupFields } from './form';
import VCheckbox from '@/components/v-checkbox.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { useServerStore } from '@/stores/server';
import { getDirectusUrlWithUtm } from '@/utils/directus-url';

const { info } = storeToRefs(useServerStore());

const props = withDefaults(
	defineProps<{
		register?: boolean;
		skipLicense?: boolean;
		modelValue?: Partial<SetupForm>;
		errors?: Record<string, any>[];
		initialValues?: Partial<SetupForm>;
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

const value = defineModel<Partial<SetupForm>>();

type AdminSlice = {
	first_name: string | null;
	last_name: string | null;
	project_owner: string | null;
	password: string | null;
	password_confirm: string | null;
};

const formSlice = computed({
	get: (): AdminSlice => ({
		first_name: value.value?.admin?.first_name ?? initialValues.value.admin?.first_name ?? null,
		last_name: value.value?.admin?.last_name ?? initialValues.value.admin?.last_name ?? null,
		project_owner: props.register
			? (value.value?.admin?.email ?? initialValues.value.admin?.email ?? null)
			: (value.value?.owner?.project_owner ?? initialValues.value.owner?.project_owner ?? null),
		password: value.value?.admin?.password ?? null,
		password_confirm: value.value?.password_confirm ?? null,
	}),
	set: (update: Partial<AdminSlice>) => {
		if (!value.value) return;
		const { password_confirm, project_owner, ...admin } = update;

		value.value = {
			...value.value,
			admin: {
				...value.value.admin,
				...(admin.first_name !== undefined && { first_name: admin.first_name }),
				...(admin.last_name !== undefined && { last_name: admin.last_name }),
				...(admin.password !== undefined && { password: admin.password }),
				...(props.register && project_owner !== undefined && { email: project_owner }),
			},
			...(password_confirm !== undefined && { password_confirm }),
			...(!props.register &&
				project_owner !== undefined && {
					owner: { ...value.value.owner, project_owner },
				}),
		};
	},
});

const license = computed({
	get: () => value.value?.license ?? initialValues.value.license,
	set: (val: boolean) => {
		if (value.value) value.value = { ...value.value, license: val };
	},
});

const product_updates = computed({
	get: () => value.value?.owner?.product_updates ?? initialValues.value.owner?.product_updates,
	set: (val: boolean) => {
		if (value.value) {
			value.value = {
				...value.value,
				owner: { ...value.value.owner, product_updates: val },
			};
		}
	},
});

const fields = useSetupFields(props.register);

const mergedErrors = computed<DirectusValidationError[]>(() => {
	const base = props.errors ?? [];

	if (!props.register) return base as unknown as DirectusValidationError[];

	const result = [...base];

	const email = value.value?.admin?.email;

	if (email && !z.email().safeParse(email).success) {
		result.push({ field: 'project_owner', type: 'email' });
	}

	const password = value.value?.admin?.password;
	const passwordConfirm = value.value?.password_confirm;

	if (!password || !passwordConfirm || password === passwordConfirm)
		return result as unknown as DirectusValidationError[];

	return [...result, { field: 'password_confirm', type: 'confirm_password' }] as unknown as DirectusValidationError[];
});
</script>

<template>
	<div class="setup-form" :class="{ skipLicense }">
		<VForm
			v-model="formSlice"
			:initial-values="initialValues"
			:validation-errors="mergedErrors"
			:show-validation-errors="false"
			:fields="fields"
			disabled-menu
		></VForm>
		<VNotice v-if="skipLicense">
			<I18nT keypath="setup_save_accept_license" tag="span">
				<template #directusMscl>
					<a
						:href="getDirectusUrlWithUtm(DIRECTUS_MSCL_URL, info.version, `${utmLocation}_mscl_1.0_gpl_link`)"
						target="_blank"
					>
						{{ $t('directus_mscl') }}
					</a>
				</template>
				<template #privacyPolicy>
					<a
						:href="getDirectusUrlWithUtm(DIRECTUS_PRIVACY_URL, info.version, `${utmLocation}_privacy_link`)"
						target="_blank"
					>
						{{ $t('privacy_policy') }}
					</a>
				</template>
			</I18nT>
		</VNotice>

		<div class="toggle-group">
			<VCheckbox v-if="!skipLicense" v-model="license">
				<I18nT keypath="setup_accept_license" tag="span">
					<template #directusMscl>
						<a :href="getDirectusUrlWithUtm(DIRECTUS_MSCL_URL, info.version, 'mscl_1.0_gpl_link')" target="_blank">
							{{ $t('directus_mscl') }}
						</a>
					</template>
					<template #privacyPolicy>
						<a :href="getDirectusUrlWithUtm(DIRECTUS_PRIVACY_URL, info.version, 'privacy_link')" target="_blank">
							{{ $t('privacy_policy') }}
						</a>
					</template>
				</I18nT>
			</VCheckbox>

			<VCheckbox v-model="product_updates">
				<span v-md="$t('setup_marketing_emails')"></span>
			</VCheckbox>
		</div>
	</div>
</template>

<style scoped>
.setup-form {
	display: grid;
	grid-template-columns: minmax(0, 1fr);

	&.skipLicense {
		.v-notice {
			grid-row: 1;
			margin-block: 0 1.125rem;
		}

		.v-checkbox {
			grid-row: 2;
			margin-block-end: 1.8125rem;
		}
	}
}

.v-form {
	--theme--form--row-gap: 1.8125rem;
}

.v-notice {
	margin-block: 1.8125rem;
}

.toggle-group {
	margin-block-start: 1.8125rem;
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.v-checkbox {
	block-size: auto;
	align-items: flex-start;

	span {
		font-weight: 600;
		white-space: normal;
	}
}

:deep(.v-notice a),
:deep(.v-checkbox a) {
	color: var(--theme--primary);
	text-decoration: underline;
}
</style>
