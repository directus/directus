<script setup lang="ts">
import { isPlainObject } from 'lodash';
import { computed, ref } from 'vue';
import SystemThemeOverridesRule from './system-theme-overrides-rule.vue';
import type { SetValueFn } from './types.js';
import TransitionExpand from '@/components/transition/expand.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineOptions({
	name: 'SystemThemeOverridesGroup',
});

const props = defineProps<{
	rules: Record<string, unknown>;
	group?: string;
	root?: boolean;
	value: Record<string, unknown> | undefined;
	path: string[];
	set: SetValueFn;
}>();

const collapsed = ref(true);

const rulesGrouped = computed(() => {
	if (!props.root) return props.rules;

	return {
		$root: Object.fromEntries(Object.entries(props.rules).filter(([_key, value]) => isPlainObject(value) === false)),
		...Object.fromEntries(Object.entries(props.rules).filter(([_key, value]) => isPlainObject(value))),
	};
});

const hasValue = computed(() => {
	return !!props.value && (isPlainObject(props.value) ? Object.keys(props.value).length > 0 : true);
});
</script>

<template>
	<div class="theme-overrides-group" :class="{ root }">
		<button
			v-if="!root"
			class="group-toggle"
			:class="{ collapsed, 'has-value': hasValue }"
			@click="collapsed = !collapsed"
		>
			<span>{{ group ?? 'globals' }}</span>
			<VIcon class="icon" name="expand_more" small />
		</button>

		<TransitionExpand>
			<div v-if="root || !collapsed" class="group-contents">
				<template v-for="(ruleValue, ruleKey) in rulesGrouped" :key="ruleKey">
					<SystemThemeOverridesGroup
						v-if="isPlainObject(ruleValue)"
						:group="ruleKey === '$root' ? undefined : ruleKey"
						:rules="ruleValue as Record<string, unknown>"
						:value="ruleKey === '$root' ? value : (value?.[ruleKey] as Record<string, unknown> | undefined)"
						:set="set"
						:path="ruleKey === '$root' ? path : [...path, ruleKey]"
					/>

					<SystemThemeOverridesRule
						v-else
						:rule="ruleKey"
						type="color"
						:set="set"
						:default-value="ruleValue"
						:value="value?.[ruleKey]"
						:path="[...path, ruleKey]"
					/>
				</template>
			</div>
		</TransitionExpand>
	</div>
</template>

<style scoped lang="scss">
.theme-overrides-group {
	&:not(.root) {
		.group-contents {
			padding-inline-start: 2ch;
			border-inline-start: 1px solid var(--theme--border-color-subdued);
		}
	}
}

.group-toggle {
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--form--field--input--foreground);
	inline-size: calc(100% + 16px);
	text-align: start;
	padding-inline: 8px;
	margin-inline-start: -8px;

	&.has-value {
		position: relative;

		&::before {
			content: '';
			inline-size: 4px;
			block-size: 4px;
			background-color: var(--theme--form--field--input--foreground-subdued);
			border-radius: 4px;
			position: absolute;
			inset-block-start: 11px;
			inset-inline-start: -1px;
			display: block;
		}
	}

	&:hover {
		background-color: var(--theme--form--field--input--background-subdued);
		border-radius: var(--theme--border-radius);
	}

	.icon {
		rotate: 0deg;
		transition: rotate var(--fast) var(--transition);
	}

	&.collapsed {
		.icon {
			rotate: -90deg;
		}
	}
}
</style>
