<template>
	<v-menu show-arrow :disabled="disabled">
		<template #activator="{ toggle }">
			<v-icon :class="{ disabled }" name="more_vert" @click="toggle" />
		</template>

		<v-list>
			<v-list-item :disabled="disabled" @click="$emit('save-and-stay')">
				<v-list-item-icon><v-icon name="check" /></v-list-item-icon>
				<v-list-item-content>{{ $t('save_and_stay') }}</v-list-item-content>
				<v-list-item-hint>{{ translateShortcut(['meta', 's']) }}</v-list-item-hint>
			</v-list-item>
			<v-list-item :disabled="disabled" @click="$emit('save-and-add-new')">
				<v-list-item-icon><v-icon name="add" /></v-list-item-icon>
				<v-list-item-content>{{ $t('save_and_create_new') }}</v-list-item-content>
				<v-list-item-hint>{{ translateShortcut(['meta', 'shift', 's']) }}</v-list-item-hint>
			</v-list-item>
			<v-list-item :disabled="disabled" @click="$emit('save-as-copy')">
				<v-list-item-icon><v-icon name="done_all" /></v-list-item-icon>
				<v-list-item-content>{{ $t('save_as_copy') }}</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import translateShortcut from '@/utils/translate-shortcut';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		return { translateShortcut };
	},
});
</script>

<style lang="scss" scoped>
.v-icon {
	color: var(--foreground-subdued);

	&:hover:not(.disabled) {
		color: var(--foreground-normal);
	}

	&.disabled {
		cursor: not-allowed;
	}
}

.v-list-item {
	white-space: nowrap;
}
</style>
