<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { ApiOutput } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExtensionState, ExtensionType } from '../types';

const props = defineProps<{
	extension: ApiOutput;
	type: ExtensionType;
	state: ExtensionState;
	stateLocked: boolean;
}>();

defineEmits<{ toggleState: [enabled: boolean]; uninstall: []; reinstall: []; remove: [] }>();

const { t } = useI18n();

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
					v-tooltip.left="stateLocked ? $t('enabled_dev_tooltip') : null"
					:disabled="stateLocked"
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
						v-tooltip.left="uninstallLocked ? $t('uninstall_locked') : null"
						:disabled="uninstallLocked"
						class="uninstall"
						clickable
						@click="$emit('uninstall')"
					>
						<v-list-item-icon>
							<v-icon name="delete" />
						</v-list-item-icon>
						<v-list-item-content>
							{{ $t('uninstall') }}
						</v-list-item-content>
					</v-list-item>
				</template>
			</template>

			<template v-else>
				<template v-if="props.extension.meta.source === 'registry'">
					<v-list-item clickable @click="$emit('reinstall')">
						<v-list-item-icon>
							<v-icon name="download" />
						</v-list-item-icon>
						<v-list-item-content>
							{{ $t('reinstall') }}
						</v-list-item-content>
					</v-list-item>
					<v-divider />
				</template>
				<v-list-item clickable @click="$emit('remove')">
					<v-list-item-icon>
						<v-icon name="delete" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ $t('remove') }}
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
