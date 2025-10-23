<script setup lang="ts">
import { initialValues, useFormFields } from '@/routes/setup/form';
import { validateItem } from '@/utils/validate-item';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import SetupForm from '@/routes/setup/form.vue';
import { useSettingsStore } from '@/stores/settings';
import { SetupForm as Form } from '@directus/types';
import { EMAIL_REGEX } from '@directus/constants';

const settingsStore = useSettingsStore();

const props = withDefaults(
	defineProps<{
		value?: string | null;
	}>(),
	{
		value: null,
	},
);

const { t } = useI18n();

const emit = defineEmits(['input']);

const errors = ref<Record<string, any>[]>([]);
const editing = ref(false);
const isSaveDisabled = computed(() => !form.value.email);

async function save() {
	errors.value = validateItem(form.value, unref(fields), true);

	if (!EMAIL_REGEX.test(form.value.email ?? '')) {
		errors.value.push({
			field: 'email',
			path: [],
			type: 'email',
		});
	}

	if (errors.value.length > 0) return;

	await settingsStore.setOwner(form.value);

	emit('input', form.value.email);

	editing.value = false;
}

const form = ref<Form>({ ...initialValues, email: props.value ?? '' });

const fields = useFormFields(false, form);
</script>

<template>
	<div class="system-owner">
		<v-input :model-value="value" type="text" disabled readonly>
			<template #append>
				<v-icon v-tooltip="t('interfaces.system-owner.edit')" name="edit" class="edit" clickable
					@click="editing = true" />
			</template>
		</v-input>
	</div>

	<v-drawer v-model="editing" :title="t('interfaces.system-owner.update')" icon="link" @cancel="editing = false"
		@apply="save">
		<template #actions>
			<v-button v-tooltip.bottom="t('save')" icon rounded :disabled="isSaveDisabled" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="drawer-content">
			<setup-form v-model="form" :errors="errors" :register="false" skip-license></setup-form>
		</div>
	</v-drawer>
</template>

<style lang="scss" scoped>
.v-icon.has-click.edit {
	color: var(--theme--foreground);

	&:hover {
		color: var(--theme--foreground-accent);
	}
}

.drawer-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>
