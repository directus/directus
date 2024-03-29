<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExtensionState, ExtensionType } from '../types';
import { APP_OR_HYBRID_EXTENSION_TYPES, ApiOutput } from '@directus/extensions';

const props = defineProps<{
	extension: ApiOutput;
	type: ExtensionType;
	state: ExtensionState;
	children: ApiOutput[];
}>();

defineEmits<{ toggleState: [enabled: boolean]; uninstall: []; reinstall: []; remove: [] }>();

const { t } = useI18n();

const isOrHasAppExtension = computed(() => {
	if (props.type === 'bundle') return props.children.some((extension) => isAppExtension(extension.schema?.type));

	return isAppExtension(props.type);
});

const disableLocked = computed(() => import.meta.env.DEV && isOrHasAppExtension.value);
const uninstallLocked = computed(() => props.extension.meta.source !== 'registry');

const stateActions = computed(() => {
	const enabled = props.state === 'enabled';

	if (props.type !== 'bundle') return [{ text: enabled ? t('disable') : t('enable'), enabled }];

	if (props.state !== 'partial') return [{ text: enabled ? t('disable_all') : t('enable_all'), enabled }];

	return [
		{ text: t('enable_all'), enabled: false },
		{ text: t('disable_all'), enabled: true },
	];
});

function isAppExtension(type?: ExtensionType) {
	if (!type) return false;
	return (APP_OR_HYBRID_EXTENSION_TYPES as readonly string[]).includes(type);
}
</script>

<template>
	<v-menu placement="bottom-start" show-arrow>
		<template #activator="{ toggle }">
			<v-icon name="more_vert" clickable class="menu-toggle" @click.prevent="toggle" />
		</template>
		<v-list>
			<template v-if="type !== 'missing'">
				<v-list-item
					v-for="(action, index) in stateActions"
					:key="index"
					v-tooltip.left="disableLocked ? t('enabled_dev_tooltip') : null"
					:disabled="disableLocked"
					clickable
					@click="$emit('toggleState', action.enabled)"
				>
					<v-list-item-icon>
						<v-icon name="mode_off_on" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ action.text }}
					</v-list-item-content>
				</v-list-item>
				<template v-if="!extension.bundle">
					<v-divider />
					<v-list-item
						v-tooltip.left="uninstallLocked ? t('uninstall_locked') : null"
						:disabled="uninstallLocked"
						class="uninstall"
						clickable
						@click="$emit('uninstall')"
					>
						<v-list-item-icon>
							<v-icon name="delete" />
						</v-list-item-icon>
						<v-list-item-content>
							{{ t('uninstall') }}
						</v-list-item-content>
					</v-list-item>
				</template>
			</template>

			<template v-else>
				<v-list-item v-if="props.extension.meta.source === 'registry'" clickable @click="$emit('reinstall')">
					<v-list-item-icon>
						<v-icon name="download" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ t('reinstall') }}
					</v-list-item-content>
				</v-list-item>
				<v-divider v-if="props.extension.meta.source === 'registry'" />
				<v-list-item clickable @click="$emit('remove')">
					<v-list-item-icon>
						<v-icon name="delete" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ t('remove') }}
					</v-list-item-content>
				</v-list-item>
			</template>
		</v-list>
	</v-menu>
</template>

<style lang="scss" scoped>
.menu-toggle {
	--v-icon-color: var(--theme--foreground-subdued);

	&:hover {
		--v-icon-color: var(--theme--foreground);
	}
}
</style>
