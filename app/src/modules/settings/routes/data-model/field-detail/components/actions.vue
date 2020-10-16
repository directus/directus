<template>
	<div class="actions">
		<v-button
			v-if="!isExisting && currentTabIndex < tabs.length - 1"
			@click="nextTab"
			:disabled="nextDisabled"
			icon
			rounded
			v-tooltip.bottom="$t('next')"
		>
			<v-icon name="arrow_forward" />
		</v-button>

		<v-button v-else @click="$emit('save')" :loading="saving" icon rounded v-tooltip.bottom="$t('save')">
			<v-icon name="check" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import useSync from '@/composables/use-sync';

type Tab = {
	text: string;
	value: string;
	disabled: boolean;
};

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		current: {
			type: Array,
			required: true,
		},
		tabs: {
			type: Array as PropType<Tab[]>,
			required: true,
		},
		saving: {
			type: Boolean,
			default: false,
		},
		isExisting: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const _currentTab = useSync(props, 'current', emit);

		const currentTabIndex = computed(() => props.tabs.findIndex((tab) => tab.value === props.current[0]));

		const previousDisabled = computed(() => {
			return currentTabIndex.value === 0;
		});

		const nextDisabled = computed(() => {
			const nextTab = props.tabs[currentTabIndex.value + 1];

			if (nextTab) {
				return nextTab.disabled;
			}

			return true;
		});

		return { _currentTab, previousDisabled, previousTab, nextDisabled, nextTab, currentTabIndex };

		function previousTab() {
			const previousTab = props.tabs[currentTabIndex.value - 1];

			if (previousTab) {
				_currentTab.value = [previousTab.value];
			}
		}

		function nextTab() {
			const nextTab = props.tabs[currentTabIndex.value + 1];

			if (nextTab) {
				_currentTab.value = [nextTab.value];
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.actions {
	display: contents;
}

.spacer {
	flex-grow: 1;
}

.v-button:not(:last-child) {
	margin-right: 8px;
}
</style>
