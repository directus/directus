<script setup lang="ts">
import { Collection, Permission } from '@directus/types';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	collection: Collection;
	action: 'create' | 'read' | 'update' | 'delete' | 'share';
	permission?: Permission;
	loading?: boolean;
	appMinimal?: Partial<Permission>;
}>();

const emit = defineEmits<{
	setFullAccess: [];
	setNoAccess: [];
	edit: [];
}>();

const { t } = useI18n();

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
		v-tooltip="appMinimal && t('required_for_app_access')"
		class="permissions-overview-toggle"
		:class="[{ 'has-app-minimal': !!appMinimal }, permissionLevel, appMinimalLevel]"
	>
		<v-icon v-if="appMinimalLevel === 'full'" name="check" class="all app-minimal" />

		<v-menu v-else show-arrow>
			<template #activator="{ toggle }">
				<div>
					<v-progress-circular v-if="loading || saving" indeterminate small />
					<v-icon v-else-if="permissionLevel === 'all'" clickable name="check" @click="toggle" />
					<v-icon
						v-else-if="appMinimalLevel === 'partial' || permissionLevel === 'custom'"
						clickable
						name="rule"
						@click="toggle"
					/>
					<v-icon v-else-if="permissionLevel === 'none'" clickable name="block" @click="toggle" />
				</div>
			</template>

			<v-list>
				<v-list-item :disabled="permissionLevel === 'all'" clickable @click="emit('setFullAccess')">
					<v-list-item-icon>
						<v-icon name="check" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ t('all_access') }}
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
						{{ t('no_access') }}
					</v-list-item-content>
				</v-list-item>

				<v-divider />

				<v-list-item clickable @click="emit('edit')">
					<v-list-item-icon>
						<v-icon name="rule" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ t('use_custom') }}
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
.permissions-overview-toggle {
	position: relative;

	&::before {
		position: absolute;
		top: -4px;
		left: -4px;
		width: calc(100% + 8px);
		height: calc(100% + 8px);
		background-color: var(--background-highlight);
		border-radius: 50%;
		opacity: 0;
		transition: opacity var(--slow) var(--transition);
		content: '';
	}

	&:hover::before,
	&.has-app-minimal::before {
		opacity: 1;
	}
}

.none {
	--v-icon-color: var(--theme--danger);
	--v-icon-color-hover: var(--theme--danger);

	&::before {
		background-color: var(--danger-10);
	}
}

.partial,
.custom {
	--v-icon-color: var(--theme--warning);
	--v-icon-color-hover: var(--theme--warning);

	&::before {
		background-color: var(--warning-10);
	}
}

.all {
	--v-icon-color: var(--theme--success);
	--v-icon-color-hover: var(--theme--success);

	&::before {
		background-color: var(--success-10);
	}
}

.has-app-minimal {
	&::before {
		background-color: var(--background-highlight) !important;
	}
}

.app-minimal {
	cursor: not-allowed;
}
</style>
