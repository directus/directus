import { BaseService } from '@directus/api/services';
import OpenAI from 'openai';
import { encoding_for_model } from 'tiktoken';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class AIChatService extends BaseService {
  private openai: OpenAI;
  private tokenEncoder: any;
  private conversationCache: Map<string, ChatMessage[]> = new Map();

  constructor(options: any) {
    super(options);

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Initialize token encoder
    this.tokenEncoder = encoding_for_model('gpt-4');
  }

  /**
   * Process a chat conversation
   */
  async chat(options: ChatOptions): Promise<any> {
    const {
      messages,
      model = 'gpt-4-turbo-preview',
      temperature = 0.7,
      maxTokens = 2000,
      stream = false,
    } = options;

    // Count tokens to ensure we don't exceed limits
    const totalTokens = this.countTokens(messages);
    if (totalTokens > 8000) {
      // Summarize older messages if needed
      const optimizedMessages = await this.optimizeMessages(messages);
      return this.chat({ ...options, messages: optimizedMessages });
    }

    try {
      if (stream) {
        // Return streaming response
        return await this.streamChat(messages, model, temperature, maxTokens);
      } else {
        // Return complete response
        const completion = await this.openai.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        return {
          content: completion.choices[0].message.content,
          usage: completion.usage,
          model: completion.model,
        };
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Stream chat responses
   */
  private async streamChat(
    messages: ChatMessage[],
    model: string,
    temperature: number,
    maxTokens: number
  ) {
    const stream = await this.openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    return stream;
  }

  /**
   * Generate content based on type
   */
  async generateContent(type: string, input: string, options: any = {}): Promise<string> {
    const prompts: Record<string, string> = {
      title: `Generate a compelling title for this content:\n\n${input}\n\nTitle:`,

      summary: `Summarize the following content in ${options.length || '2-3'} sentences:\n\n${input}\n\nSummary:`,

      tags: `Extract relevant tags from this content (return as comma-separated list):\n\n${input}\n\nTags:`,

      seo_description: `Write an SEO-friendly meta description (max 160 chars) for:\n\n${input}\n\nDescription:`,

      expand: `Expand on this content with more detail and context:\n\n${input}\n\nExpanded content:`,
    };

    const prompt = prompts[type] || `Process this content:\n\n${input}`;

    const response = await this.chat({
      messages: [
        { role: 'system', content: 'You are a helpful content assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: type === 'tags' ? 0.3 : 0.7,
      maxTokens: options.maxTokens || 500,
    });

    return response.content;
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    emotions: string[];
  }> {
    const response = await this.chat({
      messages: [
        {
          role: 'system',
          content: 'Analyze the sentiment and emotions in the text. Return JSON format.',
        },
        {
          role: 'user',
          content: `Analyze sentiment for: "${text}"

          Return JSON:
          {
            "sentiment": "positive|negative|neutral",
            "score": 0.0-1.0,
            "emotions": ["emotion1", "emotion2"]
          }`,
        },
      ],
      temperature: 0.3,
      maxTokens: 200,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        sentiment: 'neutral',
        score: 0.5,
        emotions: [],
      };
    }
  }

  /**
   * Generate smart suggestions based on context
   */
  async generateSuggestions(
    context: string,
    type: 'next_actions' | 'related_topics' | 'questions'
  ): Promise<string[]> {
    const prompts: Record<string, string> = {
      next_actions: `Based on this context, suggest 5 logical next actions:\n\n${context}\n\nReturn as JSON array of strings.`,

      related_topics: `Suggest 5 related topics for:\n\n${context}\n\nReturn as JSON array of strings.`,

      questions: `Generate 5 relevant questions about:\n\n${context}\n\nReturn as JSON array of strings.`,
    };

    const response = await this.chat({
      messages: [
        { role: 'user', content: prompts[type] },
      ],
      temperature: 0.8,
      maxTokens: 300,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  /**
   * Store conversation for context
   */
  async storeConversation(conversationId: string, messages: ChatMessage[]): Promise<void> {
    // Store in cache
    this.conversationCache.set(conversationId, messages);

    // Store in database
    await this.knex('ai_conversations').insert({
      id: conversationId,
      messages: JSON.stringify(messages),
      user_id: this.accountability?.user,
      created_at: new Date(),
    }).onConflict('id').merge({
      messages: JSON.stringify(messages),
      updated_at: new Date(),
    });

    // Cleanup old cache entries
    if (this.conversationCache.size > 100) {
      const oldestKey = this.conversationCache.keys().next().value;
      this.conversationCache.delete(oldestKey);
    }
  }

  /**
   * Retrieve conversation context
   */
  async getConversation(conversationId: string): Promise<ChatMessage[] | null> {
    // Check cache first
    if (this.conversationCache.has(conversationId)) {
      return this.conversationCache.get(conversationId)!;
    }

    // Fetch from database
    const result = await this.knex('ai_conversations')
      .where('id', conversationId)
      .first();

    if (result) {
      const messages = JSON.parse(result.messages);
      this.conversationCache.set(conversationId, messages);
      return messages;
    }

    return null;
  }

  /**
   * Count tokens in messages
   */
  private countTokens(messages: ChatMessage[]): number {
    let totalTokens = 0;

    for (const message of messages) {
      const tokens = this.tokenEncoder.encode(message.content);
      totalTokens += tokens.length;
      // Add overhead for message structure
      totalTokens += 4;
    }

    return totalTokens;
  }

  /**
   * Optimize messages to fit within token limit
   */
  private async optimizeMessages(messages: ChatMessage[]): Promise<ChatMessage[]> {
    // Keep system message and last few messages
    const systemMessage = messages.find(m => m.role === 'system');
    const recentMessages = messages.slice(-5);

    // Summarize older messages
    const olderMessages = messages.slice(1, -5);
    if (olderMessages.length > 0) {
      const summary = await this.generateContent(
        'summary',
        olderMessages.map(m => `${m.role}: ${m.content}`).join('\n'),
        { length: '3-5' }
      );

      const optimized: ChatMessage[] = [];

      if (systemMessage) {
        optimized.push(systemMessage);
      }

      optimized.push({
        role: 'assistant',
        content: `Previous conversation summary: ${summary}`,
      });

      optimized.push(...recentMessages);

      return optimized;
    }

    return messages;
  }

  /**
   * Create embeddings for semantic search
   */
  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Find similar content using embeddings
   */
  async findSimilar(
    query: string,
    collection: string,
    limit: number = 5
  ): Promise<any[]> {
    // Get query embedding
    const queryEmbedding = await this.createEmbedding(query);

    // Search in database using vector similarity
    // This assumes you have a vector column in your database
    const results = await this.knex.raw(`
      SELECT *,
        1 - (embedding <=> ?::vector) as similarity
      FROM ${collection}
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ?::vector
      LIMIT ?
    `, [JSON.stringify(queryEmbedding), JSON.stringify(queryEmbedding), limit]);

    return results.rows;
  }

  /**
   * Moderate content for safety
   */
  async moderateContent(content: string): Promise<{
    safe: boolean;
    categories: any;
    flaggedTerms: string[];
  }> {
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
}

// Export for use in endpoints/hooks
export default AIChatService;