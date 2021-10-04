<template>
	<div class="link">
		<value-null v-if="value === null" />
		<template v-else>
			<a class="link-icon" :href="value" target="_blank" @click.stop>
				<v-icon v-tooltip="t('displays.link.tooltip')" name="open_in_new"></v-icon>
			</a>

			<span class="value">{{ parsedValue }}</span>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const parsedValue = computed(() => {
			if (typeof props.value === 'string') {
				return props.value.split('://')[1];
			}
			return props.value;
		});

		return { t, parsedValue };
	},
});
</script>

<style lang="scss" scoped>
.link {
	display: inline-flex;
	align-items: center;

	.value {
		display: inline-block;
		line-height: var(--v-icon-size);
	}

	.v-icon {
		margin-right: 4px;
		color: var(--foreground-subdued);
		transition: color var(--fast) var(--transition);

		&:hover {
			color: var(--foreground-normal-alt);
		}
	}
}
</style>
