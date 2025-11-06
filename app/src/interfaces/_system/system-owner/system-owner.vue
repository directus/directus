<script setup lang="ts">
import { useFormFields, validate } from '@/routes/setup/form';
import SetupForm from '@/routes/setup/form.vue';
import { useSettingsStore } from '@/stores/settings';
import { SetupForm as Form } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const settingsStore = useSettingsStore();

const { t } = useI18n();

const errors = ref<Record<string, any>[]>([]);
const editing = ref(false);

const allowSave = computed(
	() =>
		form.value.project_owner ||
		form.value.project_usage ||
		form.value.org_name ||
		('product_updates' in form.value && form.value.product_updates !== initialValues.value.product_updates),
);

async function save() {
	const value = { ...initialValues.value, ...form.value };

	errors.value = validate(value, fields);

	if (errors.value.length > 0) return;

	await settingsStore.setOwner(value as Form);
	await settingsStore.hydrate();
	editing.value = false;
}

const initialValues = computed(() => ({
	project_owner: settingsStore.settings?.project_owner,
	project_usage: settingsStore.settings?.project_usage,
	org_name: settingsStore.settings?.org_name,
	product_updates: settingsStore.settings?.product_updates,
}));

const form = ref<Partial<Form>>({});

const fields = useFormFields(false, form);
</script>

<template>
	<div class="system-owner">
		<v-list-item type="text" block clickable @click="editing = true">
			{{ form.project_owner ?? initialValues.project_owner }}
			<div class="spacer" />
			<div class="item-actions">
				<v-icon v-tooltip="t('interfaces.system-owner.edit')" name="edit" clickable />
			</div>
		</v-list-item>
	</div>

	<v-drawer
		v-model="editing"
		:title="t('interfaces.system-owner.update')"
		icon="link"
		@cancel="editing = false"
		@apply="save"
	>
		<template #actions>
			<v-button v-tooltip.bottom="t('save')" icon rounded :disabled="!allowSave" @click="save">
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="drawer-content">
			<setup-form
				v-model="form"
				:initial-values="initialValues"
				:errors="errors"
				:register="false"
				skip-license
				utm-location="settings"
			></setup-form>
		</div>
	</v-drawer>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.item-actions {
	@include mixins.list-interface-item-actions($item-link: true);

	.add:hover {
		--v-icon-color: var(--theme--primary);
	}
}

.drawer-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>
