<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useServerStore } from '@/stores/server';
import { computed, ref, unref } from 'vue';
import { validateItem } from '@/utils/validate-item';
import { Form, initialValues, useFormFields } from '@/routes/setup/form';
import SetupForm from '@/routes/setup/form.vue';
import { useCookies } from '@vueuse/integrations/useCookies'

const serverStore = useServerStore()
const cookies = useCookies(['license-banner-dismissed'])
const { t } = useI18n();

const errors = ref<Record<string, any>[]>([])
const isSaveDisabled = computed(() => !form.value.email || !form.value.license);

async function setOwner() {
	errors.value = validateItem(form.value, unref(fields), true)

	await serverStore.setOwner(form.value.email!)
	await serverStore.hydrate()
}

async function remindLater() {
	// 30 days, will be deleted on logout / session end
	cookies.set('license-banner-dismissed', 'true', { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) })
}


const form = ref<Form>(initialValues)

const fields = useFormFields(false, form)

</script>

<template>
	<v-dialog>
		<v-card>
			<div class="inner">
				<v-card-title>
					<span class="warning">{{ t('bsl_banner.title') }} <v-icon name="warning" filled /></span>
				</v-card-title>

				<v-card-text>
					<div class="sub">{{ t('bsl_banner.license') }}</div>
					<setup-form v-model="form" :errors="errors" :register="false"></setup-form>
				</v-card-text>

				<v-card-actions>
					<v-button secondary @click="remindLater">
						{{ t('bsl_banner.remind_later') }}
					</v-button>
					<v-button :disabled="isSaveDisabled" @click="setOwner">
						{{ t('bsl_banner.set_owner') }}
					</v-button>
				</v-card-actions>

			</div>
		</v-card>
	</v-dialog>
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
