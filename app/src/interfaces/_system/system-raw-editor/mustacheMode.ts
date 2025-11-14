import { LanguageSupport, StreamLanguage } from '@codemirror/language';

interface MustacheState {
	inMustache: boolean;
}

// Define the mustache language using StreamLanguage for simple modes
const mustacheStreamLanguage = StreamLanguage.define<MustacheState>({
	token(stream, state) {
		// Check for mustache start
		if (stream.match('{{')) {
			state.inMustache = true;
			return 'bracket';
		}

		// Inside mustache
		if (state.inMustache) {
			// Check for mustache end
			if (stream.match('}}')) {
				state.inMustache = false;
				return 'bracket';
			}

			// Double and single quotes
			if (stream.match(/"(?:[^\\"]|\\.)*"?/)) {
				return 'string';
			}

			if (stream.match(/'(?:[^\\']|\\.)*'?/)) {
				return 'string';
			}

			// Flow variables keywords
			if (stream.match(/>|[$/]([A-Za-z0-9_-]\w*)/)) {
				return 'keyword';
			}

			// Numerals
			if (stream.match(/\d+/)) {
				return 'number';
			}

			// Paths (variable names)
			if (stream.match(/(?:\.\.\/)*(?:[A-Za-z_][\w.]*)+/)) {
				return 'variableName';
			}

			// Any other character inside mustache
			stream.next();
			return null;
		}

		// Outside mustache - consume until we find a mustache
		while (stream.next() && !stream.match('{{', false)) {
			// Intentionally empty - consuming characters until mustache start
		}

		return null;
	},

	startState() {
		return { inMustache: false };
	},
});

export function mustacheLanguage() {
	return new LanguageSupport(mustacheStreamLanguage);
}
