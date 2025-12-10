<script setup lang="ts">
import UseDatetime, { type Props as UseDatetimeProps } from '@/components/use-datetime.vue';
import { parseDate } from '@/utils/parse-date';
import { isValid } from 'date-fns';
import { computed, ref } from 'vue';

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
	<v-menu ref="dateTimeMenu" :close-on-content-click="false" attached :disabled="disabled" full-height seamless>
		<template #activator="{ toggle, active }">
			<v-list-item block clickable :disabled :non-editable :active @click="toggle">
				<template v-if="isValidValue">
					<use-datetime v-slot="{ datetime }" v-bind="$props as UseDatetimeProps">
						{{ datetime }}
					</use-datetime>
				</template>

				<div class="spacer" />

				<template v-if="!disabled">
					<v-icon
						:name="value ? 'clear' : 'today'"
						:class="{ active, 'clear-icon': value, 'today-icon': !value }"
						clickable
						@click="value ? unsetValue($event) : undefined"
					/>
				</template>
			</v-list-item>
		</template>

		<v-date-picker
			:type
			:disabled
			:include-seconds
			:use-24
			:model-value="value"
			@update:model-value="$emit('input', $event)"
			@close="dateTimeMenu?.deactivate"
		/>
	</v-menu>
</template>

<style lang="scss" scoped>
.v-list-item {
	--v-list-item-color-active: var(--v-list-item-color);
	--v-list-item-background-color-active: var(
		--v-list-item-background-color,
		var(--v-list-background-color, var(--theme--form--field--input--background))
	);

	&.disabled:not(.non-editable) {
		--v-list-item-color: var(--theme--foreground-subdued);
		--v-list-item-background-color: var(--theme--form--field--input--background-subdued);
		--v-list-item-border-color: var(--v-input-border-color, var(--theme--form--field--input--border-color));
	}

	&.active:not(.disabled),
	&:focus-within:not(.disabled),
	&:focus-visible:not(.disabled) {
		--v-list-item-border-color: var(--v-input-border-color-focus, var(--theme--form--field--input--border-color-focus));
		--v-list-item-border-color-hover: var(--v-list-item-border-color);

		offset: 0;
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}
}

.v-icon {
	&.today-icon {
		&:hover,
		&.active {
			--v-icon-color: var(--theme--primary);
		}
	}

	&.clear-icon {
		&:hover,
		&.active {
			--v-icon-color: var(--theme--danger);
		}
	}
}
</style>
