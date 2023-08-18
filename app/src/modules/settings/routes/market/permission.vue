<template>
	<v-list-item block clickable @click="open = !open">
		<div class="header">
			<v-checkbox :disabled="!optional" :model-value="enabled" @update:model-value="enabled = $event" />
			<div>{{ permission.permission }}</div>
			<div class="spacer" />
			<v-icon clickable :name="open ? 'expand_less' : 'expand_more'" />
		</div>
		<interface-input-code v-if="open" :value="options" :disabled="!optional" @click.stop @input="options = $event" />
	</v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ref } from 'vue';
import { Permission } from './extension.vue';

type Props = {
	permission: Permission;
	optional?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
	optional: false,
});

const emit = defineEmits(['update:permissions']);

const enabled = computed({
	get() {
		return props.permission.enabled;
	},
	set(value) {
		emit('update:permissions', {
			...props.permission,
			enabled: value,
		});
	},
});

const options = computed({
	get() {
		return props.permission.options;
	},
	set(value) {
		emit('update:permissions', {
			...props.permission,
			options: value,
		});
	},
});

const open = ref(false);
</script>

<style scoped lang="scss">
li.v-list-item.block {
	height: unset;
	min-height: var(--input-height);
	flex-flow: wrap;
	padding: calc(18px) var(--input-padding) calc(10px) var(--input-padding);
}

.header {
	display: flex;
	gap: 8px;
	width: 100%;
	margin-bottom: 8px;

	.spacer {
		flex: 1;
	}
}

.input-code {
	--input-height-tall: 1px;
}
</style>
