<script setup lang="ts">
import { isValid } from 'date-fns';
import { computed, ref } from 'vue';
import { parseDate } from '@/utils/parse-date';
import UseDatetime, { type Props as UseDatetimeProps } from '@/components/use-datetime.vue';

interface Props extends Omit<UseDatetimeProps, 'value'> {
	value: string | null;
	disabled?: boolean;
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
			<v-input
				:active="active"
				clickable
				readonly
				:disabled="disabled"
				:placeholder="!isValidValue ? value : undefined"
				@click="toggle"
			>
				<template v-if="isValidValue" #prepend>
					<use-datetime v-slot="{ datetime }" v-bind="$props as UseDatetimeProps">
						{{ datetime }}
					</use-datetime>
				</template>
				<template v-if="!disabled" #append>
					<v-icon
						:name="value ? 'clear' : 'today'"
						:class="{ active, 'clear-icon': value, 'today-icon': !value }"
						v-on="{ click: value ? unsetValue : null }"
					/>
				</template>
			</v-input>
		</template>

		<v-date-picker
			:type="type"
			:disabled="disabled"
			:include-seconds="includeSeconds"
			:use-24="use24"
			:model-value="value"
			@update:model-value="$emit('input', $event)"
			@close="dateTimeMenu?.deactivate"
		/>
	</v-menu>
</template>

<style lang="scss" scoped>
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
