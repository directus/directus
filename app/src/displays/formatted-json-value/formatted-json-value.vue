<script setup lang="ts">
import { render } from 'micromustache';
import { computed } from 'vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import ValueNull from '@/views/private/components/value-null.vue';

const props = withDefaults(
	defineProps<{
		value?: Record<string, any> | Record<string, any>[] | null;
		format?: string | null;
	}>(),
	{
		value: null,
		format: null,
	},
);

const displayValue = computed(() => {
	if (!props.value) return null;

	try {
		if (Array.isArray(props.value)) {
			return props.value.map((item: any) => renderValue(item));
		} else {
			return [renderValue(props.value)];
		}
	} catch {
		return null;
	}
});

function renderValue(input: Record<string, any> | Record<string, any>[]) {
	if (props.format) {
		return render(props.format, input);
	} else {
		return render('{{ value }}', { value: input });
	}
}
</script>

<template>
	<ValueNull v-if="!displayValue" />
	<VMenu v-else-if="displayValue.length > 1" show-arrow>
		<template #activator="{ toggle }">
			<span class="toggle" @click.stop="toggle">
				<span class="label">
					{{ displayValue.length }}
					{{ $t('items') }}
				</span>
			</span>
		</template>

		<VList class="links">
			<VListItem v-for="(item, index) in displayValue" :key="index">
				<VListItemContent>
					{{ item }}
				</VListItemContent>
			</VListItem>
		</VList>
	</VMenu>
	<span v-else>
		{{ displayValue[0] }}
	</span>
</template>
