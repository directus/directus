<template>
	<value-null v-if="!displayValue" />
	<v-menu v-else-if="displayValue.length > 1" show-arrow>
		<template #activator="{ toggle }">
			<span @click.stop="toggle" class="toggle">
				<span class="label">
					{{ displayValue.length }}
					{{ t('items') }}
				</span>
			</span>
		</template>

		<v-list class="links">
			<v-list-item v-for="(item, index) in displayValue" :key="index">
				<v-list-item-content>
					{{ item }}
				</v-list-item-content>
			</v-list-item>
		</v-list>
	</v-menu>
	<span v-else>
		{{ displayValue[0] }}
	</span>
</template>

<script lang="ts">
import { render } from 'micromustache';
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		value: {
			type: [Object, Array],
			default: null,
		},
		format: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();
		const displayValue = computed(() => {
			if (!props.value) return null;

			try {
				if (Array.isArray(props.value)) {
					return props.value.map((item: any) => render(props.format || '', item));
				} else {
					return [render(props.format || '', props.value)];
				}
			} catch (error) {
				return null;
			}
		});

		return { displayValue, t };
	},
});
</script>
