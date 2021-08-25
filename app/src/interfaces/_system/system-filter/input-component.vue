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
	<v-menu v-else :close-on-content-click="false" :show-arrow="true">
		<template #activator="{ toggle }">
			<div class="preview" @click="toggle">{{ value }}</div>
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
import { defineComponent, ref } from 'vue';

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
			type: [String, Number, Object, Boolean, Array],
			default: undefined,
		},
	},
	emits: ['input'],
	setup(props) {
		const active = ref(false);

		return { active };
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
}

.dialog {
	position: relative;
	min-width: 800px;
}
</style>
