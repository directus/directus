<script setup lang="ts">
import { FancySelectItem } from '@/components/v-fancy-select.vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';



defineProps<{
	/** The list of possible items to display */
	items: FancySelectItem[];
	/** Used to model the current selected item */
	value?: string | number | null;
	/** Disable selecting / deselecting a value */
	disabled?: boolean;
	/** What key in items to use to display text */
	itemText?: string;
	/** What key in items to use to model the selected item */
	itemValue?: string;
	/** What key in items to use to display a description */
	itemDescription?: string;
}>()

const emit = defineEmits<{
	input: [value: string];
}>();

const { t } = useI18n();

</script>

<template>
	<v-fancy-select :model-value="value" :items="items" @update:model-value="emit('input', $event)">
	</v-fancy-select>
</template>
