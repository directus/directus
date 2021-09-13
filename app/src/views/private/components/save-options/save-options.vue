<template>
	<v-menu show-arrow :disabled="disabled">
		<template #activator="{ toggle }">
			<v-icon :class="{ disabled }" name="more_vert" clickable @click="toggle" />
		</template>

		<v-list>
			<v-list-item :disabled="disabled" clickable @click="$emit('save-and-stay')">
				<v-list-item-icon><v-icon name="check" /></v-list-item-icon>
				<v-list-item-content>{{ t('save_and_stay') }}</v-list-item-content>
				<v-list-item-hint>{{ translateShortcut(['meta', 's']) }}</v-list-item-hint>
			</v-list-item>
			<v-list-item :disabled="disabled" clickable @click="$emit('save-and-add-new')">
				<v-list-item-icon><v-icon name="add" /></v-list-item-icon>
				<v-list-item-content>{{ t('save_and_create_new') }}</v-list-item-content>
				<v-list-item-hint>{{ translateShortcut(['meta', 'shift', 's']) }}</v-list-item-hint>
			</v-list-item>
			<v-list-item :disabled="disabled" clickable @click="$emit('save-as-copy')">
				<v-list-item-icon><v-icon name="done_all" /></v-list-item-icon>
				<v-list-item-content>{{ t('save_as_copy') }}</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';
import translateShortcut from '@/utils/translate-shortcut';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['save-and-stay', 'save-and-add-new', 'save-as-copy'],
	setup() {
		const { t } = useI18n();

		return { t, translateShortcut };
	},
});
</script>

<style scoped>
:deep(.v-icon) {
	color: var(--foreground-subdued) !important;
}

:deep(.v-icon:hover:not(.disabled)) {
	color: var(--foreground-normal) !important;
}

:deep(.v-icon.disabled) {
	cursor: not-allowed;
}

.v-list-item {
	white-space: nowrap;
}
</style>
