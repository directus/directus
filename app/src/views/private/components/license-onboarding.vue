<script setup lang="ts">
import type { SetupForm as Form } from '@directus/types';
import { useCookies } from '@vueuse/integrations/useCookies';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import { defaultValues } from '@/routes/setup/form';
import LicenseForm from '@/routes/setup/license.vue';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { notify } from '@/utils/notify';

const model = defineModel<boolean>();

const settingsStore = useSettingsStore();
const serverStore = useServerStore();
const cookies = useCookies(['license-onboarding-dismissed']);
const { t } = useI18n();

const form = ref<Form>({ ...defaultValues });
const isSaving = ref(false);

async function save() {
	isSaving.value = true;

	try {
		await settingsStore.setOwner(form.value);
		await serverStore.hydrate();
		model.value = false;
	} finally {
		isSaving.value = false;
	}
}

function dismiss() {
	cookies.set('license-onboarding-dismissed', 'true', { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });
	notify({ title: t('remind_next_login'), type: 'info' });
	model.value = false;
}
</script>

<template>
	<VDialog v-model="model">
		<VCard>
			<div class="inner">
				<VCardTitle>{{ $t('setup_license_title') }}</VCardTitle>
				<VCardText>
					<LicenseForm v-model="form" />
				</VCardText>
				<VCardActions>
					<VButton secondary @click="dismiss">{{ $t('remind_later') }}</VButton>
					<VButton :loading="isSaving" @click="save">{{ $t('save') }}</VButton>
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
</style>
