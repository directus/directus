import { HASH_COMMENT_MODE, QUOTE_STRING_MODE, NUMBER_MODE } from 'highlight.js';

export default (): LanguageDetail & ModeDetails => ({
	aliases: ['gql'],
	keywords: {
		keyword:
			'query mutation subscription|10 type input schema directive interface union scalar fragment|10 enum on ...',
		literal: 'true false null',
	},
	contains: [
		HASH_COMMENT_MODE,
		QUOTE_STRING_MODE,
		NUMBER_MODE,
		{
			className: 'type',
			begin: '[^\\w][A-Z][a-z]',
			end: '\\W',
			excludeEnd: !0,
		},
		{
			className: 'literal',
			begin: '[^\\w][A-Z][A-Z]',
			end: '\\W',
			excludeEnd: !0,
		},
		{
			className: 'variable',
			begin: '\\$',
			end: '\\W',
			excludeEnd: !0,
		},
		{
			className: 'keyword',
			begin: '[.]{2}',
			end: '\\.',
		},
		{
			className: 'meta',
			begin: '@',
			end: '\\W',
			excludeEnd: !0,
		},
	],
	illegal: /([;<']|BEGIN)/,
});
