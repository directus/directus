<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import type { PrimaryKey } from '@directus/types';
import { computed, onMounted, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

import { useAiStore } from '../stores/use-ai';
import AiInput from './ai-input.vue';
import AiMessageList from './ai-message-list.vue';

const props = defineProps<{
	collection: string;
	primaryKey: PrimaryKey;
}>();

const { t } = useI18n();

const title = computed(() => t('ai_copilot'));

useGroupable({
	value: title.value,
	group: 'sidebar-detail',
});

const { collection, primaryKey } = toRefs(props);

const { chat } = useAiStore();

// Add sample messages for testing different UIMessage part types
onMounted(() => {
	chat.messages = [
		{
			id: 'sample-1',
			role: 'user',
			parts: [{ type: 'text', text: 'What are the key features of this collection?' }],
		},
		{
			id: 'sample-2',
			role: 'assistant',
			parts: [
				{
					type: 'text',
					text: 'Based on the collection schema, here are the key features:\n\n1. **Field Types**: Multiple field types including text, numbers, dates\n2. **Relationships**: Support for M2O, O2M, and M2M relationships\n3. **Validations**: Built-in validation rules',
					state: 'done',
				},
			],
		},
		{
			id: 'sample-3',
			role: 'user',
			parts: [
				{ type: 'text', text: 'Here is the schema diagram' },
				{
					type: 'file',
					mediaType: 'image/png',
					filename: 'schema-diagram.png',
					url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
				},
			],
		},
		{
			id: 'sample-4',
			role: 'assistant',
			parts: [
				{
					type: 'reasoning',
					text: 'Let me analyze the database structure and relationships...',
					state: 'done',
				},
				{
					type: 'text',
					text: 'The schema shows a well-normalized structure with proper foreign key constraints.',
					state: 'done',
				},
			],
		},
		{
			id: 'sample-5',
			role: 'user',
			parts: [{ type: 'text', text: 'Can you query the database for the total record count?' }],
		},
		{
			id: 'sample-6',
			role: 'assistant',
			parts: [
				{
					type: 'text',
					text: "I'll query the database for you.",
				},
				{
					type: 'tool-queryDatabase',
					toolCallId: 'call-123',
					state: 'output-available',
					input: { collection: collection.value, query: 'count' },
					output: { count: 1523, query_time_ms: 42 },
				} as any,
				{
					type: 'text',
					text: 'The database contains **1,523 records** in this collection. Query completed in 42ms.',
				},
			],
		},
		{
			id: 'sample-7',
			role: 'user',
			parts: [{ type: 'text', text: 'Can you try to update that record with invalid data?' }],
		},
		{
			id: 'sample-8',
			role: 'assistant',
			parts: [
				{
					type: 'text',
					text: "I'll attempt to update the record.",
				},
				{
					type: 'tool-updateRecord',
					toolCallId: 'call-456',
					state: 'output-error',
					input: { id: primaryKey.value, data: { invalid_field: 'test' } },
					errorText: 'Field "invalid_field" does not exist in collection schema',
				} as any,
				{
					type: 'text',
					text: "I encountered an error - the field doesn't exist in your collection schema.",
				},
			],
		},
		{
			id: 'sample-9',
			role: 'assistant',
			parts: [
				{
					type: 'text',
					text: 'According to the Directus documentation, collections are the foundation of your data model.',
				},
				{
					type: 'source-url',
					sourceId: 'docs-1',
					url: 'https://docs.directus.io/app/data-model/collections.html',
					title: 'Collections - Directus Docs',
				},
			],
		},
	];
});

function addMessage(message: string) {
	chat.sendMessage({ text: message });
}
</script>

<template>
	<sidebar-detail :title icon="smart_toy" class="ai-sidebar">
		<div class="ai-sidebar-content">
			<div class="messages-container">
				<AiMessageList
					:messages="chat.messages"
					:status="chat.status"
					:user-config="{ variant: 'primary', side: 'right', avatar: { icon: 'person' } }"
					:assistant-config="{ variant: 'subdued', side: 'left', avatar: { icon: 'smart_toy' } }"
					should-auto-scroll
					should-scroll-to-bottom
				/>
			</div>

			<div class="ai-sidebar-footer">
				<v-progress-linear v-if="chat.status === 'streaming' || chat.status === 'submitted'" indeterminate />

				<ai-input :collection="collection" :primary-key="primaryKey" @send="addMessage" />
			</div>
		</div>
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.ai-sidebar {
	:deep(.content) {
		padding: 0;
		display: flex;
		flex-direction: column;
		height: 100%;
	}
}

.ai-sidebar-content {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
}

.messages-container {
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	padding-bottom: 0;
	min-height: 0;
}

.ai-sidebar-footer {
	flex-shrink: 0;
	padding-top: 0;
}

.v-progress-linear {
	margin-bottom: var(--content-padding);
}
</style>
