<script setup lang="ts">
import type { OwnerInformation } from '@directus/types';
import { SetupForm as Form } from '@directus/types';
import { computed, ref } from 'vue';
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import { useSetupFields, validate } from '@/routes/setup/form';
import SetupForm from '@/routes/setup/form.vue';
import { useSettingsStore } from '@/stores/settings';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

const settingsStore = useSettingsStore();

const errors = ref<Record<string, any>[]>([]);
const editing = ref(false);
const isSaving = ref(false);

const form = ref<Partial<Form>>({});
const fields = useSetupFields(false);

const initialValues = computed<Partial<Form>>(() => ({
	owner: {
		project_owner: settingsStore.settings?.project_owner ?? null,
		project_usage: settingsStore.settings?.project_usage ?? null,
		org_name: settingsStore.settings?.org_name ?? null,
		product_updates: settingsStore.settings?.product_updates ?? false,
	},
}));

const isSaveAllowed = computed(() => {
	const owner = form.value.owner;
	if (!owner) return false;

	const initialOwner = initialValues.value.owner;

	return (
		(owner.project_owner !== undefined && owner.project_owner !== initialOwner?.project_owner) ||
		(owner.project_usage !== undefined && owner.project_usage !== initialOwner?.project_usage) ||
		(owner.org_name !== undefined && owner.org_name !== initialOwner?.org_name) ||
		(owner.product_updates !== undefined && owner.product_updates !== initialOwner?.product_updates)
	);
});

async function save() {
	const owner: OwnerInformation = {
		project_owner: initialValues.value.owner?.project_owner ?? null,
		project_usage: initialValues.value.owner?.project_usage ?? null,
		org_name: initialValues.value.owner?.org_name ?? null,
		product_updates: initialValues.value.owner?.product_updates ?? false,
		...form.value.owner,
	};

	errors.value = validate({ project_owner: owner.project_owner }, fields);

	if (errors.value.length > 0) return;

	isSaving.value = true;
	await settingsStore.setOwner(owner);
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
			{{ form.owner?.project_owner ?? initialValues.owner?.project_owner }}
			<div class="spacer" />
			<div class="item-actions">
				<VIcon v-tooltip="$t('interfaces.system-owner.edit')" name="edit" clickable />
			</div>
		</VListItem>
	</div>

	<VDrawer v-model="editing" :title="$t('interfaces.system-owner.update')" icon="link" @cancel="reset" @apply="save">
		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				:label="$t('save')"
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
