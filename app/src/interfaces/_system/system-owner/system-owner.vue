<script setup lang="ts">
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import { useFormFields, validate } from '@/routes/setup/form';
import SetupForm from '@/routes/setup/form.vue';
import { useSettingsStore } from '@/stores/settings';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { SetupForm as Form } from '@directus/types';
import { computed, ref } from 'vue';

const settingsStore = useSettingsStore();

const errors = ref<Record<string, any>[]>([]);
const editing = ref(false);
const isSaving = ref(false);

const form = ref<Partial<Form>>({});
const fields = useFormFields(false, form);

const isSaveAllowed = computed(
	() =>
		form.value.project_owner ||
		form.value.project_usage ||
		('product_updates' in form.value && form.value.product_updates !== initialValues.value.product_updates),
);

const initialValues = computed(() => ({
	project_owner: settingsStore.settings?.project_owner,
	project_usage: settingsStore.settings?.project_usage,
	org_name: settingsStore.settings?.org_name,
	product_updates: settingsStore.settings?.product_updates,
}));

async function save() {
	const value = { ...initialValues.value, ...form.value };

	errors.value = validate(value, fields);

	if (errors.value.length > 0) return;

	isSaving.value = true;
	await settingsStore.setOwner(value as Form);
	await settingsStore.hydrate();
	reset();
	isSaving.value = false;
}

async function reset() {
	form.value = {};
	editing.value = false;
	errors.value = [];
}
</script>

<template>
	<div class="system-owner">
		<VListItem type="text" block clickable @click="editing = true">
			{{ form.project_owner ?? initialValues.project_owner }}
			<div class="spacer" />
			<div class="item-actions">
				<VIcon v-tooltip="$t('interfaces.system-owner.edit')" name="edit" clickable />
			</div>
		</VListItem>
	</div>

	<VDrawer v-model="editing" :title="$t('interfaces.system-owner.update')" icon="link" @cancel="reset" @apply="save">
		<template #actions>
			<PrivateViewHeaderBarActionButton
				v-tooltip.bottom="$t('save')"
				:disabled="!isSaveAllowed"
				:loading="isSaving"
				icon="check"
				@click="save"
			/>
		</template>

		<div class="drawer-content">
			<SetupForm
				v-model="form"
				:initial-values="initialValues"
				:errors="errors"
				:register="false"
				skip-license
				utm-location="settings"
			></SetupForm>
		</div>
	</VDrawer>
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
