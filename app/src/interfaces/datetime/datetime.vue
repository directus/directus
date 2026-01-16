<script setup lang="ts">
import { isValid } from 'date-fns';
import { computed, ref } from 'vue';
import UseDatetime, { type Props as UseDatetimeProps } from '@/components/use-datetime.vue';
import VDatePicker from '@/components/v-date-picker.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VMenu from '@/components/v-menu.vue';
import VRemove from '@/components/v-remove.vue';
import { parseDate } from '@/utils/parse-date';

interface Props extends Omit<UseDatetimeProps, 'value'> {
	value: string | null;
	disabled?: boolean;
	nonEditable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	use24: true,
	format: 'long',
	relative: false,
	strict: false,
	round: 'round',
	suffix: true,
});

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const dateTimeMenu = ref();

const isValidValue = computed(() => (props.value ? isValid(parseDate(props.value, props.type)) : false));

function unsetValue(e: any) {
	e.preventDefault();
	e.stopPropagation();
	emit('input', null);
}
</script>

<template>
	<VMenu ref="dateTimeMenu" :close-on-content-click="false" attached :disabled full-height seamless>
		<template #activator="{ toggle, active }">
			<VListItem block clickable :disabled :non-editable :active @click="toggle">
				<template v-if="isValidValue">
					<UseDatetime v-slot="{ datetime }" v-bind="$props as UseDatetimeProps">
						{{ datetime }}
					</UseDatetime>
				</template>

				<div class="spacer" />

				<div v-if="!nonEditable" class="item-actions">
					<VRemove v-if="value" :disabled deselect class="clear-icon" @action="unsetValue($event)" />

					<VIcon v-else name="today" class="today-icon" :class="{ active, disabled }" />
				</div>
			</VListItem>
		</template>

		<VDatePicker
			:type
			:disabled
			:include-seconds
			:use-24
			:model-value="value"
			@update:model-value="$emit('input', $event)"
			@close="dateTimeMenu?.deactivate"
		/>
	</VMenu>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-list-item {
	--v-list-item-color-active: var(--v-list-item-color);
	--v-list-item-background-color-active: var(
		--v-list-item-background-color,
		var(--v-list-background-color, var(--theme--form--field--input--background))
	);

	&.disabled:not(.non-editable) {
		--v-list-item-background-color: var(--theme--form--field--input--background-subdued);
	}

	&.active:not(.disabled),
	&:focus-within,
	&:focus-visible {
		--v-list-item-border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus));
		--v-list-item-border-color-hover: var(--v-list-item-border-color);

		offset: 0;
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}

.today-icon:not(.disabled) {
	&:hover,
	&.active {
		--v-icon-color: var(--theme--primary);
	}
}

.item-actions {
	@include mixins.list-interface-item-actions;
}
</style>
