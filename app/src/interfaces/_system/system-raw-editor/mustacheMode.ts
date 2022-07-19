export const mustacheMode = {
	start: [{ regex: /\{\{/, push: 'mustache', token: 'tag' }],
	mustache: [
		{ regex: /\}\}/, pop: true, token: 'tag' },

		// Double and single quotes
		{ regex: /"(?:[^\\"]|\\.)*"?/, token: 'string' },
		{ regex: /'(?:[^\\']|\\.)*'?/, token: 'string' },

		// Flows variables keywords
		{ regex: />|[$/]([A-Za-z0-9_-]\w*)/, token: 'keyword' },

		// Numeral
		{ regex: /\d+/i, token: 'number' },

		// Paths
		{ regex: /(?:\.\.\/)*(?:[A-Za-z_][\w.]*)+/, token: 'variable-2' },
	],
};
