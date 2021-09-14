<template>
	<template v-if="type === 'geometry' || type === 'json'">
		<v-icon class="preview" :name="type === 'json' ? 'integration_instructions' : 'map'" @click="active = true" />
		<v-dialog v-model="active">
			<div class="dialog">
				<component :is="is" small :type="type" :value="value" @input="$emit('input', $event)"></component>
			</div>
		</v-dialog>
	</template>
	<span v-else-if="type === 'boolean'" class="preview" @click="$emit('input', !value)">{{ value }}</span>
	<input
		v-else-if="is === 'interface-input'"
		:value="value"
		:style="{ width }"
		placeholder="--"
		@input="$emit('input', $event.target.value)"
	/>
	<v-menu v-else :close-on-content-click="false" :show-arrow="true" seamless>
		<template #activator="{ toggle }">
			<div class="preview" @click="toggle">{{ displayValue }}</div>
		</template>
		<div class="input" :class="type">
			<component
				:is="is"
				class="input-component"
				small
				:type="type"
				:value="value"
				@input="$emit('input', $event)"
			></component>
		</div>
	</v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue';

export default defineComponent({
	props: {
		is: {
			type: String,
			default: undefined,
		},
		type: {
			type: String,
			default: undefined,
		},
		value: {
			type: [String, Number, Object, Boolean, Array] as PropType<string | number | Record<string, any> | boolean>,
			default: undefined,
		},
	},
	emits: ['input'],
	setup(props) {
		const active = ref(false);

		const displayValue = computed(() => (props.value === null ? '--' : props.value));

		const width = computed(() => {
			if (props.is === 'interface-input' && typeof props.value === 'string') {
				return (props.value?.length >= 3 ? props.value.length + 1 : 3) + 'ch';
			}
			return 3 + 'ch';
		});

		return { active, displayValue, width };
	},
});
</script>

<style lang="scss" scoped>
.preview {
	display: flex;
	justify-content: center;
	color: var(--primary);
	font-family: var(--family-monospace);
	cursor: pointer;
}

.input {
	&.date,
	&.timestamp,
	&.time,
	&.dateTime {
		min-width: 250px;
	}

	:deep(.v-input .input) {
		border: none;
	}
}

input {
	color: var(--primary);
	font-family: var(--family-monospace);
	border: none;

	&::placeholder {
		color: var(--primary);
		font-weight: 500;
		font-family: var(--family-monospace);
	}
}

.dialog {
	position: relative;
	min-width: 800px;
}
</style>
