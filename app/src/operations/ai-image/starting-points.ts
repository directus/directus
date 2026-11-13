import { type AspectRatio, DEFAULT_ASPECT_RATIO } from '@directus/ai';

export interface ImageStartingPoint {
	key: string;
	icon: string;
	prompt: string;
	aspectRatio: AspectRatio;
	transparent?: boolean;
}

/**
 * One-time fills for an empty prompt. Nothing here runs later. Markers like `[topic]` show where flow data goes,
 * because we can't know which fields a flow has. The editor warns while one is left (see `@/ai/prompt-markers`).
 */
export const IMAGE_STARTING_POINTS: ImageStartingPoint[] = [
	{
		key: 'hero',
		icon: 'panorama',
		prompt:
			'Editorial hero illustration for an article about [topic]. Flat shapes, warm palette, no text in the image.',
		aspectRatio: '16:9',
	},
	{
		key: 'product',
		icon: 'photo_camera',
		prompt: 'Studio product photo of [product] on a plain light background, soft shadows, centered.',
		aspectRatio: DEFAULT_ASPECT_RATIO,
	},
	{
		key: 'social',
		icon: 'share',
		prompt:
			'Social media card image about [topic]. Bold composition, room for a headline on the left, no text in the image.',
		aspectRatio: '16:9',
	},
	{
		key: 'icon',
		icon: 'interests',
		prompt: 'Simple flat icon of [subject], single color, centered, no text.',
		aspectRatio: DEFAULT_ASPECT_RATIO,
		transparent: true,
	},
	{
		key: 'restyle',
		icon: 'palette',
		prompt: 'Redraw the reference image as [a style, like a watercolor painting]. Keep the subject and composition.',
		aspectRatio: DEFAULT_ASPECT_RATIO,
	},
];
