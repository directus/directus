import { z } from "zod";
import { ExtensionManifest } from "@directus/constants";

const Person = z.union([
	z.object({
		name: z.string(),
		email: z.string().email(),
		url: z.string().url().optional()
	}),
	// example: Barney Rubble <b@rubble.com> (http://barnyrubble.tumblr.com/)
	z.string().regex(/^[^<]+ <[^>]+> (?:\([^)]+\))?$/).transform((value, ctx) => {
		const matches = /^([^<]+) <([^>]+)> (?:\(([^)]+)\))?$/.exec(value)!

		if (z.string().email().safeParse(matches[2]).success === false) {
			ctx.addIssue({
				code: z.ZodIssueCode.invalid_string,
				validation: 'email',
				message: 'Invalid email'
			})

			return z.NEVER
		}

		if (z.string().url().safeParse(matches[3]).success === false) {
			ctx.addIssue({
				code: z.ZodIssueCode.invalid_string,
				validation: 'url',
				message: 'Invalid url'
			})

			return z.NEVER
		}

		return {
			name: matches[1],
			email: matches[2],
			url: matches[3]
		}
	})
])

export const MarketExtensionManifest = ExtensionManifest.extend({
	author: Person.optional(),
	maintainers: z.array(Person).optional(),
	repository: z.union([z.string(), z.object({
		type: z.literal('git'),
		url: z.string()
	}).transform((value => value.url))]).optional(),
	license: z.string().optional(),
	dist: z.object({
		unpackedSize: z.number().optional()
	}).optional(),
	keywords: z.array(z.string()).optional(),
});
