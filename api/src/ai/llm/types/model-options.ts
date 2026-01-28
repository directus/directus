export interface ProviderOptions {
	provider: 'openai' | 'anthropic';
	model: string;
	apiKeys: {
		openai: string | null;
		anthropic: string | null;
	};
}
