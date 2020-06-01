<template>
	<div class="setup-actions">
		<v-button secondary @click="$emit('cancel')">
			{{ $t('cancel') }}
		</v-button>
		<div class="spacer" />
		<v-button @click="previous" secondary :disabled="previousDisabled">
			{{ $t('previous') }}
		</v-button>
		<v-button v-if="currentTabIndex < tabs.length - 1" @click="next" :disabled="nextDisabled">
			{{ $t('next') }}
		</v-button>
		<v-button v-else :disabled="saveDisabled" @click="$emit('save')" :loading="saving">
			{{ $t('save') }}
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRefs } from '@vue/composition-api';
import { LocalType, Tab } from './types';
import useSync from '@/composables/use-sync';
import useValidation from './use-validation';
import { Field } from '@/stores/fields/types';

export default defineComponent({
	props: {
		tabs: {
			type: Array as PropType<Tab[]>,
			required: true,
		},
		currentTab: {
			type: Array as PropType<string[]>,
			required: true,
		},
		saving: {
			type: Boolean,
			default: false,
		},
		localType: {
			type: String as PropType<LocalType>,
			default: null,
		},
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		isNew: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const _currentTab = useSync(props, 'currentTab', emit);

		const { field, localType } = toRefs(props);
		const { fieldComplete, relationComplete, interfaceComplete, displayComplete, advancedComplete } = useValidation(
			field,
			localType
		);

		const currentTabIndex = computed(() => props.tabs.findIndex((tab) => tab.value === props.currentTab[0]));

		const previousDisabled = computed(() => {
			return currentTabIndex.value === 0;
		});

		const nextDisabled = computed(() => {
			if (props.isNew === false) return false;

			switch (props.currentTab[0]) {
				case 'field':
					return fieldComplete.value === false;
				case 'relationship':
					return relationComplete.value === false;
				case 'interface':
					return interfaceComplete.value === false;
				case 'display':
					return displayComplete.value === false;
				default:
					return false;
			}
		});

		const saveDisabled = computed(() => {
			return advancedComplete.value === false;
		});

		return { previous, next, currentTabIndex, previousDisabled, nextDisabled, saveDisabled };

		function previous() {
			const previousTabValue = props.tabs[currentTabIndex.value - 1].value;
			_currentTab.value = [previousTabValue];
		}

		function next() {
			const nextTabValue = props.tabs[currentTabIndex.value + 1].value;
			_currentTab.value = [nextTabValue];
		}
	},
});
</script>

<style lang="scss" scoped>
.setup-actions {
	display: flex;
	align-items: center;
	width: 100%;

	.v-button:not(:last-child) {
		margin-right: 8px;
	}
}

.spacer {
	flex-grow: 1;
}
</style>
