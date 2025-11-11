<script setup lang="ts">
import VChip from '@/components/v-chip.vue';
import { Collection, Permission, PermissionsAction } from '@directus/types';
import { computed, ref, toRefs } from 'vue';

const props = defineProps<{
	collection: Collection;
	action: PermissionsAction;
	permission?: Permission;
	loading?: boolean;
	appMinimal?: Partial<Permission>;
}>();

const emit = defineEmits<{
	setFullAccess: [];
	setNoAccess: [];
	edit: [];
}>();


const { permission } = toRefs(props);

const permissionLevel = computed<'all' | 'none' | 'custom'>(() => {
	if (permission.value === undefined) return 'none';

	if (
		permission.value.fields?.includes('*') &&
		Object.keys(permission.value.permissions || {}).length === 0 &&
		Object.keys(permission.value.validation || {}).length === 0
	) {
		return 'all';
	}

	return 'custom';
});

const saving = ref(false);

const appMinimalLevel = computed(() => {
	if (!props.appMinimal) return null;

	if (
		props.appMinimal.fields?.includes('*') &&
		Object.keys(props.appMinimal.permissions || {}).length === 0 &&
		Object.keys(props.appMinimal.validation || {}).length === 0
	)
		return 'full';

	return 'partial';
});
</script>

<template>
	<div
		v-tooltip="
			(appMinimal && t('required_for_app_access')) || t(`permissionsLevel.${permissionLevel}`, { action: t(action) })
		"
		:class="[{ 'has-app-minimal': !!appMinimal }, appMinimalLevel]"
	>
		<v-chip v-if="appMinimalLevel === 'full'" small class="toggle all">{{ $$t(action) }}</v-chip>

		<v-menu v-else show-arrow>
			<template #activator="{ toggle, active }">
				<v-chip small clickable class="toggle" :class="[permissionLevel, { active }]" @click="toggle">
					<v-progress-circular v-if="loading || saving" indeterminate small />
					<template v-else>{{ $$t(action) }}</template>
				</v-chip>
			</template>

			<v-list>
				<v-list-item :disabled="permissionLevel === 'all'" clickable @click="emit('setFullAccess')">
					<v-list-item-icon>
						<v-icon name="check" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $$t('all_access') }}
					</v-list-item-content>
				</v-list-item>

				<v-list-item
					v-if="!!appMinimalLevel === false"
					:disabled="permissionLevel === 'none'"
					clickable
					@click="emit('setNoAccess')"
				>
					<v-list-item-icon>
						<v-icon name="block" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $$t('no_access') }}
					</v-list-item-content>
				</v-list-item>

				<v-divider />

				<v-list-item clickable @click="emit('edit')">
					<v-list-item-icon>
						<v-icon name="rule" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $$t('use_custom') }}
					</v-list-item-content>
					<v-list-item-icon>
						<v-icon name="launch" />
					</v-list-item-icon>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<style lang="scss" scoped>
.toggle {
	--v-chip-font-family: var(--theme--fonts--monospace--font-family);

	&.all {
		--v-chip-color: var(--theme--background);
		--v-chip-color-hover: var(--theme--background);
		--v-chip-background-color: var(--theme--primary);
		--v-chip-background-color-hover: var(--theme--primary);
		--v-chip-border-color: transparent;
		--v-chip-border-color-hover: var(--theme--primary-subdued);

		&.active {
			--v-chip-color: var(--theme--background);
			--v-chip-background-color: var(--theme--primary);
			--v-chip-border-color: var(--theme--primary-accent);
		}
	}

	&.partial,
	&.custom {
		--v-chip-color: var(--theme--primary);
		--v-chip-color-hover: var(--theme--primary);
		--v-chip-background-color: var(--theme--primary-background);
		--v-chip-background-color-hover: var(--theme--primary-background);
		--v-chip-border-color: transparent;
		--v-chip-border-color-hover: var(--theme--primary);

		&.active {
			--v-chip-color: var(--theme--primary);
			--v-chip-background-color: var(--theme--primary-background);
			--v-chip-border-color: var(--theme--primary);
		}
	}

	&.none {
		--v-chip-color: var(--theme--foreground-subdued);
		--v-chip-color-hover: var(--theme--foreground);
		--v-chip-background-color: transparent;
		--v-chip-background-color-hover: transparent;
		--v-chip-border-color: var(--theme--border-color-subdued);
		--v-chip-border-color-hover: var(--theme--border-color-accent);

		&.active {
			--v-chip-color: var(--theme--foreground);
			--v-chip-background-color: transparent;
			--v-chip-border-color: var(--theme--border-color);
		}
	}
}
</style>
