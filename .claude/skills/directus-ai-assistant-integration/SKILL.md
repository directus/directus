---
name: "Directus AI Assistant Integration"
description: "Build AI-powered features in Directus: chat interfaces, content generation, smart suggestions, and copilot functionality"
version: 1.0.0
author: "Directus Development System"
tags: ["directus", "ai", "openai", "anthropic", "chat", "assistant", "websocket", "real-time", "rag"]
---

# Directus AI Assistant Integration

## Overview

This skill provides comprehensive guidance for integrating AI assistants into Directus applications. Build intelligent chat interfaces, content generation systems, context-aware suggestions, and copilot features using OpenAI, Anthropic Claude, and other AI providers. Implement real-time communication, vector search, RAG (Retrieval Augmented Generation), and natural language interfaces.

## When to Use This Skill

- Building AI chat interfaces in Directus panels
- Implementing content generation workflows
- Creating smart autocomplete and suggestions
- Adding natural language query interfaces
- Building AI-powered content moderation
- Implementing semantic search with embeddings
- Creating AI copilot features for users
- Setting up RAG systems with vector databases
- Building conversational interfaces
- Implementing AI-driven automation

## Architecture Overview

### AI Integration Stack

```
┌─────────────────────────────────────┐
│         Directus Frontend           │
│    (Vue 3 Chat Components)          │
└────────────┬────────────────────────┘
             │ WebSocket / REST
┌────────────▼────────────────────────┐
│       Directus Backend              │
│   (AI Service Layer)                │
├─────────────────────────────────────┤
│  • Request Queue                    │
│  • Context Management               │
│  • Token Optimization               │
│  • Response Streaming               │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│        AI Providers                 │
├─────────────────────────────────────┤
│  • OpenAI (GPT-4, Embeddings)      │
│  • Anthropic (Claude)               │
│  • Cohere (Reranking)               │
│  • Hugging Face (Open Models)      │
└─────────────────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      Vector Database                │
│   (Pinecone/Weaviate/pgvector)     │
└─────────────────────────────────────┘
```

## Process: Building AI Chat Interface

### Step 1: Create Chat Panel Extension

```vue
<!-- src/ai-chat-panel.vue -->
<template>
  <div class="ai-chat-panel">
    <div class="chat-header">
      <div class="chat-title">
        <v-icon name="smart_toy" />
        <span>AI Assistant</span>
      </div>
      <div class="chat-actions">
        <v-button
          v-tooltip="'Clear conversation'"
          icon
          x-small
          @click="clearChat"
        >
          <v-icon name="clear_all" />
        </v-button>
        <v-button
          v-tooltip="'Export conversation'"
          icon
          x-small
          @click="exportChat"
        >
          <v-icon name="download" />
        </v-button>
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <transition-group name="message-fade">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="message.role"
        >
          <div class="message-avatar">
            <v-icon
              :name="message.role === 'user' ? 'person' : 'smart_toy'"
            />
          </div>
          <div class="message-content">
            <div class="message-text" v-html="renderMarkdown(message.content)"></div>
            <div class="message-metadata">
              <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              <span v-if="message.tokens" class="message-tokens">
                {{ message.tokens }} tokens
              </span>
            </div>
            <div v-if="message.suggestions" class="message-suggestions">
              <v-chip
                v-for="suggestion in message.suggestions"
                :key="suggestion"
                clickable
                @click="sendMessage(suggestion)"
              >
                {{ suggestion }}
              </v-chip>
            </div>
          </div>
        </div>
      </transition-group>

      <div v-if="isTyping" class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div v-if="streamingResponse" class="streaming-message">
        <div class="message-content">
          <div class="message-text" v-html="renderMarkdown(streamingResponse)"></div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <div class="input-container">
        <v-textarea
          v-model="inputMessage"
          placeholder="Type your message..."
          :disabled="isProcessing"
          @keydown.enter.prevent="handleEnter"
          auto-grow
          :rows="1"
          :max-rows="4"
        />
        <div class="input-actions">
          <v-menu placement="top">
            <template #activator="{ toggle }">
              <v-button
                v-tooltip="'Add context'"
                icon
                x-small
                @click="toggle"
              >
                <v-icon name="attach_file" />
              </v-button>
            </template>
            <v-list>
              <v-list-item
                v-for="ctx in contextOptions"
                :key="ctx.value"
                clickable
                @click="addContext(ctx)"
              >
                <v-list-item-icon>
                  <v-icon :name="ctx.icon" />
                </v-list-item-icon>
                <v-list-item-content>{{ ctx.label }}</v-list-item-content>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-button
            v-tooltip="'Voice input'"
            icon
            x-small
            @click="startVoiceInput"
            :disabled="!speechRecognitionSupported"
          >
            <v-icon :name="isRecording ? 'mic' : 'mic_none'" />
          </v-button>
        </div>
      </div>
      <v-button
        @click="sendMessage()"
        :loading="isProcessing"
        :disabled="!inputMessage.trim()"
        icon
      >
        <v-icon name="send" />
      </v-button>
    </div>

    <div v-if="activeContext.length > 0" class="context-display">
      <div class="context-header">Active Context:</div>
      <div class="context-items">
        <v-chip
          v-for="(ctx, index) in activeContext"
          :key="index"
          closable
          @close="removeContext(index)"
        >
          <v-icon :name="ctx.icon" x-small />
          {{ ctx.label }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
  suggestions?: string[];
  context?: any[];
}

interface Props {
  collection?: string;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const props = withDefaults(defineProps<Props>(), {
  model: 'gpt-4-turbo-preview',
  maxTokens: 2000,
  temperature: 0.7,
});

// Composables
const api = useApi();
const { useItemsStore, useCollectionsStore } = useStores();

// State
const messages = ref<Message[]>([]);
const inputMessage = ref('');
const isProcessing = ref(false);
const isTyping = ref(false);
const streamingResponse = ref('');
const messagesContainer = ref<HTMLElement>();
const activeContext = ref<any[]>([]);
const socket = ref<Socket | null>(null);
const isRecording = ref(false);
const speechRecognition = ref<any>(null);

// Computed
const speechRecognitionSupported = computed(() => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
});

const contextOptions = computed(() => [
  { label: 'Current Collection', value: 'collection', icon: 'folder' },
  { label: 'Selected Items', value: 'items', icon: 'check_box' },
  { label: 'Current View', value: 'view', icon: 'visibility' },
  { label: 'User Profile', value: 'profile', icon: 'person' },
  { label: 'Schema Info', value: 'schema', icon: 'schema' },
]);

// WebSocket Setup
function initializeWebSocket() {
  const baseURL = api.defaults.baseURL || window.location.origin;

  socket.value = io(baseURL, {
    path: '/ai/socket',
    transports: ['websocket'],
    auth: {
      access_token: api.defaults.headers.common['Authorization']?.replace('Bearer ', ''),
    },
  });

  socket.value.on('connect', () => {
    console.log('AI WebSocket connected');
  });

  socket.value.on('ai:response', handleStreamingResponse);
  socket.value.on('ai:complete', handleResponseComplete);
  socket.value.on('ai:error', handleResponseError);
  socket.value.on('ai:typing', () => {
    isTyping.value = true;
  });
}

// Message Handling
async function sendMessage(content?: string) {
  const messageContent = content || inputMessage.value.trim();

  if (!messageContent || isProcessing.value) return;

  isProcessing.value = true;
  inputMessage.value = '';

  // Add user message
  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content: messageContent,
    timestamp: new Date(),
    context: [...activeContext.value],
  };

  messages.value.push(userMessage);
  scrollToBottom();

  try {
    // Prepare context
    const context = await prepareContext();

    // Send via WebSocket for streaming
    if (socket.value?.connected) {
      socket.value.emit('ai:message', {
        message: messageContent,
        context,
        history: messages.value.slice(-10), // Last 10 messages
        config: {
          model: props.model,
          maxTokens: props.maxTokens,
          temperature: props.temperature,
          systemPrompt: props.systemPrompt,
        },
      });

      isTyping.value = true;
      streamingResponse.value = '';
    } else {
      // Fallback to REST API
      const response = await api.post('/ai/chat', {
        message: messageContent,
        context,
        history: messages.value.slice(-10),
        config: {
          model: props.model,
          maxTokens: props.maxTokens,
          temperature: props.temperature,
        },
      });

      handleResponseComplete(response.data);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    handleResponseError({ error: 'Failed to send message' });
  }
}

function handleStreamingResponse(data: { chunk: string; tokens?: number }) {
  isTyping.value = false;
  streamingResponse.value += data.chunk;
  scrollToBottom();
}

function handleResponseComplete(data: any) {
  isTyping.value = false;

  const assistantMessage: Message = {
    id: generateId(),
    role: 'assistant',
    content: streamingResponse.value || data.content,
    timestamp: new Date(),
    tokens: data.tokens,
    suggestions: data.suggestions,
  };

  messages.value.push(assistantMessage);
  streamingResponse.value = '';
  isProcessing.value = false;
  scrollToBottom();

  // Store conversation
  storeConversation();
}

function handleResponseError(data: { error: string }) {
  isTyping.value = false;
  isProcessing.value = false;
  streamingResponse.value = '';

  messages.value.push({
    id: generateId(),
    role: 'system',
    content: `Error: ${data.error}`,
    timestamp: new Date(),
  });
}

// Context Management
async function prepareContext(): Promise<any> {
  const context: any = {
    timestamp: new Date().toISOString(),
    user: api.defaults.headers.common['User-Agent'],
  };

  for (const ctx of activeContext.value) {
    switch (ctx.value) {
      case 'collection':
        if (props.collection) {
          const itemsStore = useItemsStore();
          const items = await itemsStore.getItems(props.collection, {
            limit: 5,
            fields: ['*'],
          });
          context.collection = {
            name: props.collection,
            items,
          };
        }
        break;

      case 'schema':
        if (props.collection) {
          const collectionsStore = useCollectionsStore();
          const collection = collectionsStore.getCollection(props.collection);
          context.schema = collection;
        }
        break;

      case 'profile':
        context.user = await fetchUserProfile();
        break;
    }
  }

  return context;
}

function addContext(option: any) {
  if (!activeContext.value.find(c => c.value === option.value)) {
    activeContext.value.push(option);
  }
}

function removeContext(index: number) {
  activeContext.value.splice(index, 1);
}

// Voice Input
function startVoiceInput() {
  if (!speechRecognitionSupported.value) return;

  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  speechRecognition.value = new SpeechRecognition();
  speechRecognition.value.continuous = false;
  speechRecognition.value.interimResults = true;

  speechRecognition.value.onstart = () => {
    isRecording.value = true;
  };

  speechRecognition.value.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0])
      .map((result: any) => result.transcript)
      .join('');

    inputMessage.value = transcript;
  };

  speechRecognition.value.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    isRecording.value = false;
  };

  speechRecognition.value.onend = () => {
    isRecording.value = false;
  };

  speechRecognition.value.start();
}

// Utility Functions
function renderMarkdown(content: string): string {
  const rendered = marked(content, {
    breaks: true,
    gfm: true,
    highlight: (code, lang) => {
      // Add syntax highlighting if available
      return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
    },
  });

  return DOMPurify.sanitize(rendered);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(timestamp);
}

function handleEnter(event: KeyboardEvent) {
  if (!event.shiftKey) {
    sendMessage();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function clearChat() {
  messages.value = [];
  activeContext.value = [];
  streamingResponse.value = '';
}

async function exportChat() {
  const conversation = messages.value.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
  }));

  const blob = new Blob([JSON.stringify(conversation, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function storeConversation() {
  try {
    await api.post('/ai/conversations', {
      messages: messages.value,
      context: activeContext.value,
      metadata: {
        model: props.model,
        collection: props.collection,
      },
    });
  } catch (error) {
    console.error('Failed to store conversation:', error);
  }
}

async function fetchUserProfile() {
  try {
    const response = await api.get('/users/me');
    return response.data.data;
  } catch (error) {
    return null;
  }
}

// Load previous conversation
async function loadConversation() {
  try {
    const response = await api.get('/ai/conversations/latest');
    if (response.data.data) {
      messages.value = response.data.data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      scrollToBottom();
    }
  } catch (error) {
    console.error('Failed to load conversation:', error);
  }
}

// Lifecycle
onMounted(() => {
  initializeWebSocket();
  loadConversation();
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
  if (speechRecognition.value) {
    speechRecognition.value.stop();
  }
});
</script>

<style scoped>
.ai-chat-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--theme--background);
  border-radius: var(--theme--border-radius);
  border: 1px solid var(--theme--border-color-subdued);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-m);
  border-bottom: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background-accent);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-s);
  font-weight: 600;
  color: var(--theme--foreground);
}

.chat-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-m);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
}

.message {
  display: flex;
  gap: var(--spacing-m);
  animation: messageSlide 0.3s ease-out;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--theme--primary-background);
  color: var(--theme--primary);
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: var(--theme--background-accent);
  color: var(--theme--foreground);
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.message.user .message-content {
  align-items: flex-end;
}

.message-text {
  padding: var(--spacing-m);
  background: var(--theme--background-accent);
  border-radius: var(--theme--border-radius);
  color: var(--theme--foreground);
  line-height: 1.5;
}

.message.user .message-text {
  background: var(--theme--primary);
  color: white;
}

/* Markdown styling */
.message-text :deep(p) {
  margin: 0 0 var(--spacing-s) 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(pre) {
  background: var(--theme--background);
  padding: var(--spacing-s);
  border-radius: var(--theme--border-radius);
  overflow-x: auto;
  margin: var(--spacing-s) 0;
}

.message-text :deep(code) {
  background: var(--theme--background);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: var(--spacing-s) 0;
  padding-left: var(--spacing-l);
}

.message-metadata {
  display: flex;
  gap: var(--spacing-m);
  font-size: 0.75rem;
  color: var(--theme--foreground-subdued);
}

.message-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-s);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-m);
  background: var(--theme--background-accent);
  border-radius: var(--theme--border-radius);
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--theme--foreground-subdued);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.streaming-message {
  display: flex;
  gap: var(--spacing-m);
}

.chat-input {
  display: flex;
  gap: var(--spacing-s);
  padding: var(--spacing-m);
  border-top: 1px solid var(--theme--border-color-subdued);
  background: var(--theme--background-accent);
}

.input-container {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-xs);
  background: var(--theme--background);
  border-radius: var(--theme--border-radius);
  padding: var(--spacing-s);
}

.input-container :deep(.v-textarea) {
  flex: 1;
  background: transparent;
  border: none;
}

.input-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.context-display {
  padding: var(--spacing-s) var(--spacing-m);
  background: var(--theme--background-subdued);
  border-top: 1px solid var(--theme--border-color-subdued);
}

.context-header {
  font-size: 0.875rem;
  color: var(--theme--foreground-subdued);
  margin-bottom: var(--spacing-xs);
}

.context-items {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }

  .chat-messages {
    padding: var(--spacing-s);
  }

  .message-text {
    padding: var(--spacing-s);
  }
}

/* Message fade transition */
.message-fade-enter-active,
.message-fade-leave-active {
  transition: all 0.3s ease;
}

.message-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.message-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
```

## Process: Implementing AI Service Layer

### Step 1: Create AI Service

```typescript
// src/services/ai.service.ts
import { BaseService } from '@directus/api/services';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { encoding_for_model } from 'tiktoken';

interface AIConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface EmbeddingOptions {
  text: string;
  model?: string;
  dimensions?: number;
}

export class AIService extends BaseService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private pinecone: Pinecone | null = null;
  private tokenEncoder: any;

  constructor(options: any) {
    super(options);
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.tokenEncoder = encoding_for_model('gpt-4');
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Initialize Pinecone for vector search
    if (process.env.PINECONE_API_KEY) {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
      });
    }
  }

  // Chat Completion
  async chat(options: {
    messages: any[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    systemPrompt?: string;
  }): Promise<any> {
    const model = options.model || 'gpt-4-turbo-preview';
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens || 2000;

    // Add system prompt if provided
    const messages = options.systemPrompt
      ? [{ role: 'system', content: options.systemPrompt }, ...options.messages]
      : options.messages;

    // Token counting and optimization
    const totalTokens = this.countTokens(messages);
    if (totalTokens > 8000) {
      // Truncate or summarize older messages
      messages.splice(1, messages.length - 10);
    }

    if (model.startsWith('claude')) {
      return this.anthropicChat(messages, model, temperature, maxTokens, options.stream);
    } else {
      return this.openaiChat(messages, model, temperature, maxTokens, options.stream);
    }
  }

  private async openaiChat(
    messages: any[],
    model: string,
    temperature: number,
    maxTokens: number,
    stream?: boolean
  ): Promise<any> {
    if (!this.openai) throw new Error('OpenAI not configured');

    if (stream) {
      const stream = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      return stream;
    } else {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' }, // For structured output
      });

      return {
        content: completion.choices[0].message.content,
        usage: completion.usage,
        model: completion.model,
      };
    }
  }

  private async anthropicChat(
    messages: any[],
    model: string,
    temperature: number,
    maxTokens: number,
    stream?: boolean
  ): Promise<any> {
    if (!this.anthropic) throw new Error('Anthropic not configured');

    // Convert messages to Claude format
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await this.anthropic.messages.create({
      model: model.replace('claude-', ''),
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: conversationMessages,
      stream,
    });

    if (stream) {
      return response;
    } else {
      return {
        content: response.content[0].text,
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
        },
        model: response.model,
      };
    }
  }

  // Content Generation
  async generateContent(options: {
    type: 'article' | 'description' | 'summary' | 'translation';
    input: string;
    targetLanguage?: string;
    tone?: 'formal' | 'casual' | 'technical' | 'creative';
    length?: 'short' | 'medium' | 'long';
  }): Promise<string> {
    const prompts = {
      article: `Write a comprehensive article about: ${options.input}
        Tone: ${options.tone || 'formal'}
        Length: ${options.length || 'medium'}
        Include: Introduction, main points, and conclusion`,

      description: `Write a compelling product/service description for: ${options.input}
        Tone: ${options.tone || 'casual'}
        Focus on benefits and unique features`,

      summary: `Summarize the following content concisely: ${options.input}
        Length: ${options.length || 'short'}
        Keep key points and important information`,

      translation: `Translate the following to ${options.targetLanguage}: ${options.input}
        Maintain tone and context accurately`,
    };

    const response = await this.chat({
      messages: [{ role: 'user', content: prompts[options.type] }],
      temperature: options.type === 'translation' ? 0.3 : 0.7,
    });

    return response.content;
  }

  // Embeddings and Vector Search
  async createEmbedding(options: EmbeddingOptions): Promise<number[]> {
    if (!this.openai) throw new Error('OpenAI not configured');

    const response = await this.openai.embeddings.create({
      model: options.model || 'text-embedding-3-small',
      input: options.text,
      dimensions: options.dimensions || 1536,
    });

    return response.data[0].embedding;
  }

  async vectorSearch(options: {
    query: string;
    collection: string;
    topK?: number;
    filter?: any;
  }): Promise<any[]> {
    if (!this.pinecone) throw new Error('Pinecone not configured');

    // Get query embedding
    const queryEmbedding = await this.createEmbedding({ text: options.query });

    // Search in Pinecone
    const index = this.pinecone.index(options.collection);
    const results = await index.query({
      vector: queryEmbedding,
      topK: options.topK || 10,
      filter: options.filter,
      includeMetadata: true,
      includeValues: false,
    });

    return results.matches || [];
  }

  // RAG (Retrieval Augmented Generation)
  async ragQuery(options: {
    query: string;
    collection: string;
    systemContext?: string;
    topK?: number;
  }): Promise<any> {
    // 1. Retrieve relevant documents
    const relevantDocs = await this.vectorSearch({
      query: options.query,
      collection: options.collection,
      topK: options.topK || 5,
    });

    // 2. Build context from retrieved documents
    const context = relevantDocs
      .map(doc => doc.metadata?.content || '')
      .join('\n\n---\n\n');

    // 3. Generate response with context
    const systemPrompt = `${options.systemContext || 'You are a helpful assistant.'}

    Use the following context to answer questions. If the answer cannot be found in the context, say so.

    Context:
    ${context}`;

    const response = await this.chat({
      messages: [{ role: 'user', content: options.query }],
      systemPrompt,
      temperature: 0.3, // Lower temperature for factual responses
    });

    return {
      answer: response.content,
      sources: relevantDocs.map(doc => ({
        id: doc.id,
        score: doc.score,
        metadata: doc.metadata,
      })),
      usage: response.usage,
    };
  }

  // Content Moderation
  async moderateContent(content: string): Promise<{
    safe: boolean;
    categories: any;
    flaggedTerms: string[];
  }> {
    if (!this.openai) throw new Error('OpenAI not configured');

    const moderation = await this.openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);

    return {
      safe: !result.flagged,
      categories: result.category_scores,
      flaggedTerms: flaggedCategories,
    };
  }

  // Smart Suggestions
  async generateSuggestions(options: {
    context: string;
    type: 'autocomplete' | 'next_actions' | 'related_content';
    count?: number;
  }): Promise<string[]> {
    const prompts = {
      autocomplete: `Based on this context, suggest ${options.count || 5} possible completions:
        Context: ${options.context}
        Return as JSON array of strings`,

      next_actions: `Based on this context, suggest ${options.count || 5} logical next actions:
        Context: ${options.context}
        Return as JSON array of action strings`,

      related_content: `Based on this context, suggest ${options.count || 5} related topics:
        Context: ${options.context}
        Return as JSON array of topic strings`,
    };

    const response = await this.chat({
      messages: [{ role: 'user', content: prompts[options.type] }],
      temperature: 0.8,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  // Function Calling for Structured Actions
  async functionCall(options: {
    query: string;
    functions: any[];
    context?: any;
  }): Promise<any> {
    if (!this.openai) throw new Error('OpenAI not configured');

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that helps users interact with the Directus system.',
        },
        {
          role: 'user',
          content: options.query,
        },
      ],
      functions: options.functions,
      function_call: 'auto',
    });

    const message = completion.choices[0].message;

    if (message.function_call) {
      return {
        function: message.function_call.name,
        arguments: JSON.parse(message.function_call.arguments),
      };
    }

    return {
      message: message.content,
    };
  }

  // Token Management
  private countTokens(messages: any[]): number {
    if (!this.tokenEncoder) return 0;

    let totalTokens = 0;
    for (const message of messages) {
      const content = typeof message === 'string' ? message : message.content;
      totalTokens += this.tokenEncoder.encode(content).length;
    }

    return totalTokens;
  }

  // Conversation Memory Management
  async storeConversation(conversation: {
    id: string;
    messages: any[];
    metadata: any;
  }): Promise<void> {
    await this.knex('ai_conversations').insert({
      id: conversation.id,
      messages: JSON.stringify(conversation.messages),
      metadata: JSON.stringify(conversation.metadata),
      created_at: new Date(),
      user_id: this.accountability?.user,
    });

    // Store embeddings for semantic search
    const summary = await this.generateContent({
      type: 'summary',
      input: conversation.messages.map(m => m.content).join('\n'),
      length: 'short',
    });

    const embedding = await this.createEmbedding({ text: summary });

    if (this.pinecone) {
      const index = this.pinecone.index('conversations');
      await index.upsert([
        {
          id: conversation.id,
          values: embedding,
          metadata: {
            summary,
            user_id: this.accountability?.user,
            created_at: new Date().toISOString(),
          },
        },
      ]);
    }
  }

  async searchConversations(query: string, limit: number = 5): Promise<any[]> {
    const results = await this.vectorSearch({
      query,
      collection: 'conversations',
      topK: limit,
      filter: {
        user_id: this.accountability?.user,
      },
    });

    // Fetch full conversations
    const conversationIds = results.map(r => r.id);
    const conversations = await this.knex('ai_conversations')
      .whereIn('id', conversationIds)
      .select();

    return conversations.map(conv => ({
      ...conv,
      messages: JSON.parse(conv.messages),
      metadata: JSON.parse(conv.metadata),
    }));
  }
}
```

## Process: Implementing Real-time AI Features

### Step 1: WebSocket Handler

```typescript
// src/websocket/ai-websocket.ts
import { Server as SocketServer } from 'socket.io';
import { AIService } from '../services/ai.service';
import { Readable } from 'stream';

export function setupAIWebSocket(io: SocketServer, aiService: AIService) {
  const aiNamespace = io.of('/ai');

  aiNamespace.on('connection', (socket) => {
    console.log('AI client connected:', socket.id);

    // Handle chat messages with streaming
    socket.on('ai:message', async (data) => {
      try {
        socket.emit('ai:typing');

        const stream = await aiService.chat({
          messages: data.history || [],
          model: data.config?.model || 'gpt-4-turbo-preview',
          temperature: data.config?.temperature || 0.7,
          maxTokens: data.config?.maxTokens || 2000,
          systemPrompt: data.config?.systemPrompt,
          stream: true,
        });

        let fullResponse = '';
        let tokenCount = 0;

        // Handle streaming response
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            tokenCount++;
            socket.emit('ai:response', {
              chunk: content,
              tokens: tokenCount,
            });
          }
        }

        // Generate suggestions based on response
        const suggestions = await aiService.generateSuggestions({
          context: fullResponse,
          type: 'next_actions',
          count: 3,
        });

        socket.emit('ai:complete', {
          content: fullResponse,
          tokens: tokenCount,
          suggestions,
        });
      } catch (error) {
        socket.emit('ai:error', {
          error: error.message || 'An error occurred',
        });
      }
    });

    // Handle image generation
    socket.on('ai:generate-image', async (data) => {
      try {
        const imageUrl = await aiService.generateImage({
          prompt: data.prompt,
          size: data.size || '1024x1024',
          style: data.style || 'vivid',
        });

        socket.emit('ai:image', { url: imageUrl });
      } catch (error) {
        socket.emit('ai:error', { error: error.message });
      }
    });

    // Handle voice transcription
    socket.on('ai:transcribe', async (data) => {
      try {
        const transcription = await aiService.transcribeAudio({
          audio: data.audio,
          language: data.language,
        });

        socket.emit('ai:transcription', { text: transcription });
      } catch (error) {
        socket.emit('ai:error', { error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('AI client disconnected:', socket.id);
    });
  });
}
```

## AI-Powered Flows

### Custom AI Operations for Flows

```typescript
// src/operations/ai-operation.ts
import { defineOperationApi } from '@directus/extensions-sdk';

export default defineOperationApi({
  id: 'ai-content-processor',
  handler: async (options, context) => {
    const { services } = context;
    const { AIService, ItemsService } = services;

    const aiService = new AIService({ knex: context.database });
    const itemsService = new ItemsService(options.collection, {
      schema: await context.getSchema(),
    });

    const results = [];

    // Fetch items to process
    const items = await itemsService.readByQuery({
      filter: options.filter || {},
      limit: options.batchSize || 10,
    });

    for (const item of items) {
      try {
        let processedContent;

        switch (options.operation) {
          case 'summarize':
            processedContent = await aiService.generateContent({
              type: 'summary',
              input: item[options.sourceField],
              length: options.summaryLength || 'short',
            });
            break;

          case 'translate':
            processedContent = await aiService.generateContent({
              type: 'translation',
              input: item[options.sourceField],
              targetLanguage: options.targetLanguage,
            });
            break;

          case 'moderate':
            const moderation = await aiService.moderateContent(
              item[options.sourceField]
            );
            processedContent = moderation.safe ? 'approved' : 'flagged';
            break;

          case 'enrich':
            processedContent = await aiService.ragQuery({
              query: `Enrich this content: ${item[options.sourceField]}`,
              collection: 'knowledge_base',
            });
            break;

          case 'extract':
            processedContent = await aiService.functionCall({
              query: `Extract ${options.extractType} from: ${item[options.sourceField]}`,
              functions: [
                {
                  name: 'extract_data',
                  parameters: {
                    type: 'object',
                    properties: options.extractSchema,
                  },
                },
              ],
            });
            break;
        }

        // Update item with processed content
        await itemsService.updateOne(item.id, {
          [options.targetField]: processedContent,
          ai_processed_at: new Date(),
        });

        results.push({
          id: item.id,
          status: 'success',
          processed: processedContent,
        });
      } catch (error) {
        results.push({
          id: item.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  },
});
```

## Natural Language Query Interface

### NLQ Implementation

```typescript
// src/services/nlq.service.ts
export class NaturalLanguageQueryService {
  constructor(
    private aiService: AIService,
    private database: any
  ) {}

  async processQuery(naturalQuery: string, collection: string): Promise<any> {
    // Convert natural language to SQL/filter
    const structuredQuery = await this.convertToStructuredQuery(
      naturalQuery,
      collection
    );

    // Execute query
    const results = await this.executeQuery(structuredQuery, collection);

    // Format response in natural language
    const nlResponse = await this.formatResponse(
      naturalQuery,
      results,
      collection
    );

    return {
      query: structuredQuery,
      results,
      response: nlResponse,
    };
  }

  private async convertToStructuredQuery(nlQuery: string, collection: string) {
    const schema = await this.getCollectionSchema(collection);

    const response = await this.aiService.functionCall({
      query: nlQuery,
      functions: [
        {
          name: 'create_query',
          description: 'Convert natural language to database query',
          parameters: {
            type: 'object',
            properties: {
              filter: {
                type: 'object',
                description: 'Directus filter object',
              },
              sort: {
                type: 'array',
                items: { type: 'string' },
              },
              limit: {
                type: 'number',
              },
              fields: {
                type: 'array',
                items: { type: 'string' },
              },
              aggregate: {
                type: 'object',
              },
            },
          },
        },
      ],
      context: { schema },
    });

    return response.arguments;
  }

  private async executeQuery(query: any, collection: string) {
    // Build Knex query based on structured query
    let knexQuery = this.database(collection);

    if (query.filter) {
      knexQuery = this.applyFilters(knexQuery, query.filter);
    }

    if (query.sort) {
      query.sort.forEach((sortField: string) => {
        const direction = sortField.startsWith('-') ? 'desc' : 'asc';
        const field = sortField.replace(/^-/, '');
        knexQuery = knexQuery.orderBy(field, direction);
      });
    }

    if (query.limit) {
      knexQuery = knexQuery.limit(query.limit);
    }

    if (query.fields && query.fields.length > 0) {
      knexQuery = knexQuery.select(query.fields);
    }

    return await knexQuery;
  }

  private applyFilters(query: any, filters: any): any {
    Object.entries(filters).forEach(([field, condition]: [string, any]) => {
      if (typeof condition === 'object') {
        Object.entries(condition).forEach(([op, value]) => {
          switch (op) {
            case '_eq':
              query = query.where(field, '=', value);
              break;
            case '_neq':
              query = query.where(field, '!=', value);
              break;
            case '_lt':
              query = query.where(field, '<', value);
              break;
            case '_lte':
              query = query.where(field, '<=', value);
              break;
            case '_gt':
              query = query.where(field, '>', value);
              break;
            case '_gte':
              query = query.where(field, '>=', value);
              break;
            case '_contains':
              query = query.where(field, 'like', `%${value}%`);
              break;
            case '_in':
              query = query.whereIn(field, value);
              break;
            case '_nin':
              query = query.whereNotIn(field, value);
              break;
          }
        });
      } else {
        query = query.where(field, '=', condition);
      }
    });

    return query;
  }

  private async formatResponse(
    query: string,
    results: any[],
    collection: string
  ): Promise<string> {
    const response = await this.aiService.chat({
      messages: [
        {
          role: 'user',
          content: `Original query: "${query}"
            Collection: ${collection}
            Results: ${JSON.stringify(results.slice(0, 10))}

            Please provide a natural language response summarizing these results.`,
        },
      ],
      temperature: 0.7,
    });

    return response.content;
  }

  private async getCollectionSchema(collection: string) {
    // Fetch and return collection schema
    const fields = await this.database('directus_fields')
      .where('collection', collection)
      .select('field', 'type', 'schema');

    return fields;
  }
}
```

## AI Content Moderation Hook

```typescript
// src/hooks/ai-moderation.ts
import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ filter, action }, context) => {
  const { services, logger } = context;

  filter('items.create', async (payload, meta) => {
    // Check if content moderation is enabled for this collection
    const moderatedCollections = ['comments', 'posts', 'reviews'];

    if (moderatedCollections.includes(meta.collection)) {
      const aiService = new services.AIService({ knex: context.database });

      // Combine all text fields for moderation
      const contentToModerate = Object.values(payload)
        .filter(value => typeof value === 'string')
        .join(' ');

      const moderation = await aiService.moderateContent(contentToModerate);

      if (!moderation.safe) {
        // Flag content for review
        payload.status = 'pending_review';
        payload.moderation_flags = moderation.flaggedTerms;
        payload.moderation_scores = moderation.categories;

        // Log for audit
        logger.warn('Content flagged for moderation:', {
          collection: meta.collection,
          flags: moderation.flaggedTerms,
        });
      } else {
        payload.status = 'approved';
      }
    }

    return payload;
  });

  action('items.create', async ({ payload, key, collection }) => {
    // Generate AI suggestions for new content
    if (collection === 'articles' && payload.status === 'draft') {
      const aiService = new services.AIService({ knex: context.database });

      // Generate title suggestions if not provided
      if (!payload.title && payload.content) {
        const suggestions = await aiService.generateContent({
          type: 'title',
          input: payload.content.substring(0, 500),
        });

        // Store suggestions for user
        await context.database('content_suggestions').insert({
          item_id: key,
          collection,
          type: 'title',
          suggestions: JSON.stringify(suggestions),
        });
      }

      // Generate tags
      const tags = await aiService.functionCall({
        query: `Extract relevant tags from: ${payload.content}`,
        functions: [
          {
            name: 'extract_tags',
            parameters: {
              type: 'object',
              properties: {
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 10,
                },
              },
            },
          },
        ],
      });

      if (tags.arguments?.tags) {
        await context.database('article_tags').insert(
          tags.arguments.tags.map((tag: string) => ({
            article_id: key,
            tag,
          }))
        );
      }
    }
  });
});
```

## Testing AI Features

```typescript
// test/ai-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../src/services/ai.service';

describe('AI Service', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService({
      knex: vi.fn(),
      accountability: { user: 'test-user' },
    });
  });

  describe('Chat Completion', () => {
    it('should generate chat response', async () => {
      const response = await aiService.chat({
        messages: [
          { role: 'user', content: 'What is Directus?' },
        ],
        model: 'gpt-4',
        temperature: 0.7,
      });

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('usage');
      expect(response.content).toBeTruthy();
    });

    it('should handle streaming responses', async () => {
      const stream = await aiService.chat({
        messages: [
          { role: 'user', content: 'Tell me a story' },
        ],
        stream: true,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk.choices[0]?.delta?.content || '';
      }

      expect(fullContent.length).toBeGreaterThan(0);
    });
  });

  describe('Content Generation', () => {
    it('should generate article content', async () => {
      const content = await aiService.generateContent({
        type: 'article',
        input: 'Benefits of using Directus',
        tone: 'technical',
        length: 'medium',
      });

      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(100);
    });

    it('should translate content', async () => {
      const translation = await aiService.generateContent({
        type: 'translation',
        input: 'Hello world',
        targetLanguage: 'Spanish',
      });

      expect(translation).toContain('Hola');
    });
  });

  describe('Content Moderation', () => {
    it('should flag inappropriate content', async () => {
      const moderation = await aiService.moderateContent(
        'This is a test of inappropriate content [insert bad words]'
      );

      expect(moderation).toHaveProperty('safe');
      expect(moderation).toHaveProperty('categories');
      expect(moderation).toHaveProperty('flaggedTerms');
    });

    it('should pass safe content', async () => {
      const moderation = await aiService.moderateContent(
        'This is a perfectly safe and appropriate message.'
      );

      expect(moderation.safe).toBe(true);
      expect(moderation.flaggedTerms).toHaveLength(0);
    });
  });

  describe('Vector Search', () => {
    it('should create embeddings', async () => {
      const embedding = await aiService.createEmbedding({
        text: 'Test content for embedding',
      });

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });

    it('should perform vector search', async () => {
      const results = await aiService.vectorSearch({
        query: 'Find similar documents',
        collection: 'documents',
        topK: 5,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('RAG Queries', () => {
    it('should answer questions with context', async () => {
      const response = await aiService.ragQuery({
        query: 'What is the pricing?',
        collection: 'knowledge_base',
      });

      expect(response).toHaveProperty('answer');
      expect(response).toHaveProperty('sources');
      expect(response).toHaveProperty('usage');
    });
  });
});
```

## Performance Optimization

### Caching AI Responses

```typescript
// src/cache/ai-cache.ts
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

export class AICacheService {
  private cache: LRUCache<string, any>;
  private embedCache: LRUCache<string, number[]>;

  constructor() {
    // Response cache
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 60, // 1 hour
      updateAgeOnGet: true,
    });

    // Embedding cache (longer TTL)
    this.embedCache = new LRUCache({
      max: 5000,
      ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
  }

  getCacheKey(input: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(input));
    return hash.digest('hex');
  }

  async getCachedResponse(key: string): Promise<any | null> {
    return this.cache.get(key);
  }

  async setCachedResponse(key: string, response: any): Promise<void> {
    this.cache.set(key, response);
  }

  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const key = this.getCacheKey(text);
    return this.embedCache.get(key);
  }

  async setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
    const key = this.getCacheKey(text);
    this.embedCache.set(key, embedding);
  }

  // Batch processing optimization
  async batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);

      // Rate limiting
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}
```

## Success Metrics

- ✅ Chat interface responds in < 500ms (first token)
- ✅ AI responses are contextually relevant 95%+ of the time
- ✅ Content moderation catches inappropriate content with 98%+ accuracy
- ✅ Vector search returns relevant results in < 200ms
- ✅ RAG system provides accurate answers with source citations
- ✅ Natural language queries convert correctly 90%+ of the time
- ✅ WebSocket connections remain stable for extended sessions
- ✅ Token usage is optimized with proper truncation
- ✅ Embeddings are cached effectively reducing API calls by 70%
- ✅ Error handling prevents AI failures from breaking workflows

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Pinecone Vector Database](https://docs.pinecone.io)
- [LangChain JS](https://js.langchain.com)
- [Socket.io Documentation](https://socket.io/docs)
- [Directus WebSockets](https://docs.directus.io/guides/real-time/websockets)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq)
- [TikToken for Token Counting](https://github.com/openai/tiktoken)

## Version History

- **1.0.0** - Initial release with comprehensive AI integration patterns