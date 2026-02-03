<script setup lang="ts">
import type { SetupForm as Form } from '@directus/types';
import { useCookies } from '@vueuse/integrations/useCookies';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { defaultValues, useFormFields, validate } from '@/routes/setup/form';
import SetupForm from '@/routes/setup/form.vue';
import { useSettingsStore } from '@/stores/settings';
import { notify } from '@/utils/notify';

const settingsStore = useSettingsStore();
const cookies = useCookies(['license-banner-dismissed']);
const { t } = useI18n();

const errors = ref<Record<string, any>[]>([]);

const isSaveDisabled = computed(
	() =>
		!form.value.project_owner ||
		!form.value.license ||
		(form.value.project_usage === 'commercial' && !form.value.org_name),
);

const isSaving = ref(false);

async function setOwner() {
	errors.value = validate(form.value, fields);

	if (errors.value.length > 0) return;

	isSaving.value = true;
	await settingsStore.setOwner(form.value);
	await settingsStore.hydrate();
	isSaving.value = false;
}

async function remindLater() {
	// 30 days, will be deleted on logout / session end
	cookies.set('license-banner-dismissed', 'true', { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });
	notify({ title: t('bsl_banner.remind_next_login'), type: 'info' });
}

const form = ref<Form>(defaultValues);

const fields = useFormFields(false, form);
</script>

<template>
	<VDialog>
		<VCard>
			<div class="inner">
				<VCardTitle>
					<span class="warning">
						{{ $t('bsl_banner.title') }}
						<VIcon name="warning" filled />
					</span>
				</VCardTitle>

				<VCardText>
					<div class="sub">{{ $t('bsl_banner.license') }}</div>
					<SetupForm v-model="form" :errors="errors" :register="false" utm-location="banner"></SetupForm>
				</VCardText>

				<VCardActions>
					<VButton secondary @click="remindLater">
						{{ $t('bsl_banner.remind_later') }}
					</VButton>
					<VButton :disabled="isSaveDisabled" :loading="isSaving" @click="setOwner">
						{{ $t('bsl_banner.set_owner') }}
					</VButton>
				</VCardActions>
			</div>
		</VCard>
	</VDialog>
</template>

<style scoped>
.v-card {
	max-inline-size: unset;
	inline-size: 540px;
}

.v-card-title {
	color: var(--theme--danger);
}

.sub {
	margin-block-end: 24px;
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
