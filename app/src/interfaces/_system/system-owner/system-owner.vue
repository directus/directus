<script setup lang="ts">
import { initialValues, useFormFields } from '@/routes/setup/form';
import { validateItem } from '@/utils/validate-item';
import { computed, inject, Ref, ref, unref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SetupForm from '@/routes/setup/form.vue';
import { useSettingsStore } from '@/stores/settings';
import { SetupForm as Form } from '@directus/types';
import { email } from 'zod';

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

	if (email().safeParse(form.value.email).success) {
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

const values = inject<Ref<Record<string, any>>>('values')!;

const form = ref<Form>({
	...initialValues,
	email: props.value ?? '',
});

watch(
	() => values,
	() => {
		form.value = {
			...form.value,
			project_usage: values.value.project_usage,
			org_name: values.value.org_name,
			product_updates: values.value.product_updates,
		};
	},
	{ immediate: true },
);

const fields = useFormFields(false, form);
</script>

<template>
	<div class="system-owner">
		<v-input :model-value="value" type="text" disabled readonly>
			<template #append>
				<v-icon
					v-tooltip="t('interfaces.system-owner.edit')"
					name="edit"
					class="edit"
					clickable
					@click="editing = true"
				/>
			</template>
		</v-input>
	</div>

	<v-drawer
		v-model="editing"
		:title="t('interfaces.system-owner.update')"
		icon="link"
		@cancel="editing = false"
		@apply="save"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('save')" icon rounded :disabled="isSaveDisabled" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="drawer-content">
			<setup-form v-model="form" :errors="errors" :register="false" skip-license utm-location="settings"></setup-form>
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
