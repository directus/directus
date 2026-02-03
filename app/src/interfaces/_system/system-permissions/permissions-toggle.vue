<script setup lang="ts">
import { Collection, Permission, PermissionsAction } from '@directus/types';
import { computed, ref, toRefs } from 'vue';
import VChip from '@/components/v-chip.vue';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';

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
			(appMinimal && $t('required_for_app_access')) || $t(`permissionsLevel.${permissionLevel}`, { action: $t(action) })
		"
		:class="[{ 'has-app-minimal': !!appMinimal }, appMinimalLevel]"
	>
		<VChip v-if="appMinimalLevel === 'full'" small class="toggle all">{{ $t(action) }}</VChip>

		<VMenu v-else show-arrow>
			<template #activator="{ toggle, active }">
				<VChip small clickable class="toggle" :class="[permissionLevel, { active }]" @click="toggle">
					<VProgressCircular v-if="loading || saving" indeterminate small />
					<template v-else>{{ $t(action) }}</template>
				</VChip>
			</template>

			<VList>
				<VListItem :disabled="permissionLevel === 'all'" clickable @click="emit('setFullAccess')">
					<VListItemIcon>
						<VIcon name="check" />
					</VListItemIcon>
					<VListItemContent>
						{{ $t('all_access') }}
					</VListItemContent>
				</VListItem>

				<VListItem
					v-if="!!appMinimalLevel === false"
					:disabled="permissionLevel === 'none'"
					clickable
					@click="emit('setNoAccess')"
				>
					<VListItemIcon>
						<VIcon name="block" />
					</VListItemIcon>
					<VListItemContent>
						{{ $t('no_access') }}
					</VListItemContent>
				</VListItem>

				<VDivider />

				<VListItem clickable @click="emit('edit')">
					<VListItemIcon>
						<VIcon name="rule" />
					</VListItemIcon>
					<VListItemContent>
						{{ $t('use_custom') }}
					</VListItemContent>
					<VListItemIcon>
						<VIcon name="launch" />
					</VListItemIcon>
				</VListItem>
			</VList>
		</VMenu>
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
