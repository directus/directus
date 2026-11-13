import type { OutputField } from './output-schema';

export interface StartingPoint {
	key: string;
	icon: string;
	prompt: string;
	output: 'text' | 'object';
	files?: string[];
	fields?: OutputField[];
}

/**
 * One-time fills for an empty prompt. Nothing here runs later. Markers like `[your content]` show where flow data goes,
 * because we can't know which fields a flow has. The editor warns while one is left (see `@/ai/prompt-markers`).
 */
export const STARTING_POINTS: StartingPoint[] = [
	{
		key: 'describe_image',
		icon: 'image_search',
		prompt:
			'Look at the attached image. Write alt text for someone who cannot see it, and pick the point a crop should keep in frame.',
		output: 'object',
		// On a file upload trigger, the key is the uploaded file
		files: ['{{ $trigger.key }}'],
		fields: [
			{ name: 'alt', type: 'string', description: 'Alt text, under 125 characters' },
			// Models see a resized image, so pixels would be guesses. Multiply by the file's width and height to save them.
			{
				name: 'focal_point_x',
				type: 'number',
				description: 'Focal point across the width, from 0 (left) to 1 (right)',
			},
			{ name: 'focal_point_y', type: 'number', description: 'Focal point down the height, from 0 (top) to 1 (bottom)' },
		],
	},
	{
		key: 'summarize',
		icon: 'short_text',
		prompt: 'Summarize this in 2 or 3 sentences. Reply with only the summary:\n\n[your content]',
		output: 'text',
	},
	{
		key: 'translate',
		icon: 'translate',
		prompt:
			'Translate this into [language]. Keep the formatting and any HTML or Markdown as-is. Reply with only the translation:\n\n[your content]',
		output: 'text',
	},
	{
		key: 'improve',
		icon: 'spellcheck',
		prompt:
			'Fix grammar and spelling, and make this clearer. Keep the meaning, the tone, and any HTML or Markdown as-is. Reply with only the revised text:\n\n[your content]',
		output: 'text',
	},
	{
		key: 'seo_description',
		icon: 'travel_explore',
		prompt:
			'Write a meta description for this content. Plain text, under 155 characters, in the same language as the content. Use only facts from the content. Reply with only the description:\n\n[your content]',
		output: 'text',
	},
	{
		key: 'categorize',
		icon: 'category',
		prompt: 'Pick the category that fits this content best:\n\n[your content]',
		output: 'object',
		fields: [
			{
				name: 'category',
				type: 'string',
				description: 'The best fitting category',
				choices: ['news', 'guide', 'opinion', 'announcement'],
			},
		],
	},
	{
		key: 'moderate',
		icon: 'gpp_maybe',
		prompt:
			'Check this submission for spam, abuse, or personal details that should not be published:\n\n[your content]',
		output: 'object',
		fields: [
			{ name: 'flagged', type: 'boolean', description: 'True if this should not be published' },
			{ name: 'reason', type: 'string', required: false, description: 'Why it was flagged, in one sentence' },
		],
	},
];
