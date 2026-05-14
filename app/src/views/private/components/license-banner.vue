<script setup lang="ts">
import type { SetupForm as Form } from '@directus/types';
import { useCookies } from '@vueuse/integrations/useCookies';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { defaultValues, useSetupFields, validate } from '@/routes/setup/form';
import SetupForm from '@/routes/setup/form.vue';
import { useSettingsStore } from '@/stores/settings';
import { notify } from '@/utils/notify';

const model = defineModel<boolean>();

const settingsStore = useSettingsStore();
const cookies = useCookies(['license-banner-dismissed']);
const { t } = useI18n();

const errors = ref<Record<string, any>[]>([]);

const form = ref<Form>(buildInitialForm());

const fields = useSetupFields(false);

function buildInitialForm(): Form {
	return {
		...defaultValues,
		owner: {
			...defaultValues.owner,
			project_usage: settingsStore.settings?.project_usage ?? null,
			org_name: settingsStore.settings?.org_name ?? null,
		},
	};
}

watch(model, (open) => {
	if (open) form.value = buildInitialForm();
});

const isSaveDisabled = computed(
	() =>
		!form.value.owner.project_owner ||
		!form.value.license ||
		(form.value.owner.project_usage === 'commercial' && !form.value.owner.org_name),
);

const isSaving = ref(false);

async function setOwner() {
	errors.value = validate({ project_owner: form.value.owner.project_owner }, fields);

	if (errors.value.length > 0) return;

	isSaving.value = true;

	await settingsStore.setOwner(form.value.owner);

	await settingsStore.hydrate();
	isSaving.value = false;
	model.value = false;
}

function remindLater() {
	// 30 days, will be deleted on logout / session end
	cookies.set('license-banner-dismissed', 'true', { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });
	notify({ title: t('license_banner.remind_next_login'), type: 'info' });
	model.value = false;
}
</script>

<template>
	<VDialog v-model="model">
		<VCard>
			<div class="inner">
				<VCardTitle>
					<span class="warning">
						{{ $t('license_banner.title') }}
						<VIcon name="warning" filled />
					</span>
				</VCardTitle>

				<VCardText>
					<div class="sub">{{ $t('license_banner.license') }}</div>
					<SetupForm v-model="form" :errors="errors" :register="false" utm-location="banner"></SetupForm>
				</VCardText>

				<VCardActions>
					<VButton secondary @click="remindLater">
						{{ $t('license_banner.remind_later') }}
					</VButton>
					<VButton :disabled="isSaveDisabled" :loading="isSaving" @click="setOwner">
						{{ $t('license_banner.set_owner') }}
					</VButton>
				</VCardActions>
			</div>
		</VCard>
	</VDialog>
</template>

<style scoped>
.v-card {
	max-inline-size: unset;
	inline-size: 30.375rem;
}

.v-card-title {
	color: var(--theme--danger);
}

.sub {
	margin-block-end: 1.375rem;
}

.v-card a {
	color: var(--theme--primary);
	text-decoration: underline;
	font-weight: 600;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}
</style>
