import { LanguageSupport } from '@codemirror/language';
import { StreamLanguage } from '@codemirror/language';
import type { StreamParser } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { yaml } from '@codemirror/lang-yaml';
import { camelCase } from 'lodash';

export const modeMap: Record<
	string,
	{
		name: string;
		import: () => Promise<{ default?: StreamParser<unknown>; [key: string]: any }>;
	}
> = {
	apl: { name: 'APL', import: () => import('@codemirror/legacy-modes/mode/apl') },
	asciiarmor: { name: 'ASCII Armor', import: () => import('@codemirror/legacy-modes/mode/asciiarmor') },
	'asn.1': { name: 'ASN.1', import: () => import('@codemirror/legacy-modes/mode/asn1') },
	asterisk: { name: 'Asterisk', import: () => import('@codemirror/legacy-modes/mode/asterisk') },
	brainfuck: { name: 'Brainfuck', import: () => import('@codemirror/legacy-modes/mode/brainfuck') },
	clike: { name: 'C-like', import: () => import('@codemirror/legacy-modes/mode/clike') },
	clojure: { name: 'Clojure', import: () => import('@codemirror/legacy-modes/mode/clojure') },
	cmake: { name: 'CMake', import: () => import('@codemirror/legacy-modes/mode/cmake') },
	cobol: { name: 'COBOL', import: () => import('@codemirror/legacy-modes/mode/cobol') },
	coffeescript: { name: 'CoffeeScript', import: () => import('@codemirror/legacy-modes/mode/coffeescript') },
	commonlisp: { name: 'Common Lisp', import: () => import('@codemirror/legacy-modes/mode/commonlisp') },
	crystal: { name: 'Crystal', import: () => import('@codemirror/legacy-modes/mode/crystal') },
	css: { name: 'CSS', import: () => import('@codemirror/legacy-modes/mode/css') },
	cypher: { name: 'Cypher', import: () => import('@codemirror/legacy-modes/mode/cypher') },
	d: { name: 'D', import: () => import('@codemirror/legacy-modes/mode/d') },
	diff: { name: 'Diff', import: () => import('@codemirror/legacy-modes/mode/diff') },
	dockerfile: { name: 'Dockerfile', import: () => import('@codemirror/legacy-modes/mode/dockerfile') },
	dtd: { name: 'DTD', import: () => import('@codemirror/legacy-modes/mode/dtd') },
	dylan: { name: 'Dylan', import: () => import('@codemirror/legacy-modes/mode/dylan') },
	ebnf: { name: 'EBNF', import: () => import('@codemirror/legacy-modes/mode/ebnf') },
	ecl: { name: 'ECL', import: () => import('@codemirror/legacy-modes/mode/ecl') },
	eiffel: { name: 'Eiffel', import: () => import('@codemirror/legacy-modes/mode/eiffel') },
	elm: { name: 'Elm', import: () => import('@codemirror/legacy-modes/mode/elm') },
	erlang: { name: 'Erlang', import: () => import('@codemirror/legacy-modes/mode/erlang') },
	factor: { name: 'Factor', import: () => import('@codemirror/legacy-modes/mode/factor') },
	fcl: { name: 'FCL', import: () => import('@codemirror/legacy-modes/mode/fcl') },
	forth: { name: 'Forth', import: () => import('@codemirror/legacy-modes/mode/forth') },
	fortran: { name: 'Fortran', import: () => import('@codemirror/legacy-modes/mode/fortran') },
	gas: { name: 'GAS', import: () => import('@codemirror/legacy-modes/mode/gas') },
	gfm: { name: 'GitHub Flavored Markdown', import: () => Promise.resolve({}) },
	gherkin: { name: 'Gherkin', import: () => import('@codemirror/legacy-modes/mode/gherkin') },
	go: { name: 'Go', import: () => import('@codemirror/legacy-modes/mode/go') },
	groovy: { name: 'Groovy', import: () => import('@codemirror/legacy-modes/mode/groovy') },
	haskell: { name: 'Haskell', import: () => import('@codemirror/legacy-modes/mode/haskell') },
	haxe: { name: 'Haxe', import: () => import('@codemirror/legacy-modes/mode/haxe') },
	http: { name: 'HTTP', import: () => import('@codemirror/legacy-modes/mode/http') },
	idl: { name: 'IDL', import: () => import('@codemirror/legacy-modes/mode/idl') },
	javascript: { name: 'JavaScript / TypeScript / JSX', import: () => Promise.resolve({}) },
	jinja2: { name: 'Jinja2', import: () => import('@codemirror/legacy-modes/mode/jinja2') },
	julia: { name: 'Julia', import: () => import('@codemirror/legacy-modes/mode/julia') },
	livescript: { name: 'LiveScript', import: () => import('@codemirror/legacy-modes/mode/livescript') },
	lua: { name: 'Lua', import: () => import('@codemirror/legacy-modes/mode/lua') },
	mathematica: { name: 'Mathematica', import: () => import('@codemirror/legacy-modes/mode/mathematica') },
	markdown: { name: 'Markdown', import: () => Promise.resolve({}) },
	mbox: { name: 'Mbox', import: () => import('@codemirror/legacy-modes/mode/mbox') },
	mirc: { name: 'mIRC', import: () => import('@codemirror/legacy-modes/mode/mirc') },
	mllike: { name: 'ML-like', import: () => import('@codemirror/legacy-modes/mode/mllike') },
	modelica: { name: 'Modelica', import: () => import('@codemirror/legacy-modes/mode/modelica') },
	mscgen: { name: 'MscGen', import: () => import('@codemirror/legacy-modes/mode/mscgen') },
	mumps: { name: 'MUMPS', import: () => import('@codemirror/legacy-modes/mode/mumps') },
	nginx: { name: 'Nginx', import: () => import('@codemirror/legacy-modes/mode/nginx') },
	nsis: { name: 'NSIS', import: () => import('@codemirror/legacy-modes/mode/nsis') },
	ntriples: { name: 'N-Triples', import: () => import('@codemirror/legacy-modes/mode/ntriples') },
	octave: { name: 'Octave', import: () => import('@codemirror/legacy-modes/mode/octave') },
	oz: { name: 'Oz', import: () => import('@codemirror/legacy-modes/mode/oz') },
	pascal: { name: 'Pascal', import: () => import('@codemirror/legacy-modes/mode/pascal') },
	pegjs: { name: 'PEG.js', import: () => import('@codemirror/legacy-modes/mode/pegjs') },
	perl: { name: 'Perl', import: () => import('@codemirror/legacy-modes/mode/perl') },
	php: { name: 'PHP', import: () => Promise.resolve({}) },
	pig: { name: 'Pig', import: () => import('@codemirror/legacy-modes/mode/pig') },
	powershell: { name: 'PowerShell', import: () => import('@codemirror/legacy-modes/mode/powershell') },
	properties: { name: 'Properties', import: () => import('@codemirror/legacy-modes/mode/properties') },
	protobuf: { name: 'Protocol Buffers', import: () => import('@codemirror/legacy-modes/mode/protobuf') },
	pug: { name: 'Pug', import: () => import('@codemirror/legacy-modes/mode/pug') },
	puppet: { name: 'Puppet', import: () => import('@codemirror/legacy-modes/mode/puppet') },
	python: { name: 'Python', import: () => import('@codemirror/legacy-modes/mode/python') },
	q: { name: 'Q', import: () => import('@codemirror/legacy-modes/mode/q') },
	r: { name: 'R', import: () => import('@codemirror/legacy-modes/mode/r') },
	rpm: { name: 'RPM', import: () => import('@codemirror/legacy-modes/mode/rpm') },
	ruby: { name: 'Ruby', import: () => import('@codemirror/legacy-modes/mode/ruby') },
	rust: { name: 'Rust', import: () => import('@codemirror/legacy-modes/mode/rust') },
	sas: { name: 'SAS', import: () => import('@codemirror/legacy-modes/mode/sas') },
	sass: { name: 'Sass', import: () => import('@codemirror/legacy-modes/mode/sass') },
	scheme: { name: 'Scheme', import: () => import('@codemirror/legacy-modes/mode/scheme') },
	shell: { name: 'Shell', import: () => import('@codemirror/legacy-modes/mode/shell') },
	sieve: { name: 'Sieve', import: () => import('@codemirror/legacy-modes/mode/sieve') },
	smalltalk: { name: 'Smalltalk', import: () => import('@codemirror/legacy-modes/mode/smalltalk') },
	solr: { name: 'Solr', import: () => import('@codemirror/legacy-modes/mode/solr') },
	sparql: { name: 'SPARQL', import: () => import('@codemirror/legacy-modes/mode/sparql') },
	spreadsheet: { name: 'Spreadsheet', import: () => import('@codemirror/legacy-modes/mode/spreadsheet') },
	sql: { name: 'SQL', import: () => import('@codemirror/legacy-modes/mode/sql') },
	stex: { name: 'sTeX', import: () => import('@codemirror/legacy-modes/mode/stex') },
	stylus: { name: 'Stylus', import: () => import('@codemirror/legacy-modes/mode/stylus') },
	swift: { name: 'Swift', import: () => import('@codemirror/legacy-modes/mode/swift') },
	tcl: { name: 'Tcl', import: () => import('@codemirror/legacy-modes/mode/tcl') },
	textile: { name: 'Textile', import: () => import('@codemirror/legacy-modes/mode/textile') },
	tiddlywiki: { name: 'TiddlyWiki', import: () => import('@codemirror/legacy-modes/mode/tiddlywiki') },
	tiki: { name: 'Tiki', import: () => import('@codemirror/legacy-modes/mode/tiki') },
	toml: { name: 'TOML', import: () => import('@codemirror/legacy-modes/mode/toml') },
	troff: { name: 'Troff', import: () => import('@codemirror/legacy-modes/mode/troff') },
	ttcn: { name: 'TTCN', import: () => import('@codemirror/legacy-modes/mode/ttcn') },
	'ttcn-cfg': { name: 'TTCN-CFG', import: () => import('@codemirror/legacy-modes/mode/ttcn-cfg') },
	turtle: { name: 'Turtle', import: () => import('@codemirror/legacy-modes/mode/turtle') },
	vb: { name: 'Visual Basic', import: () => import('@codemirror/legacy-modes/mode/vb') },
	vbscript: { name: 'VBScript', import: () => import('@codemirror/legacy-modes/mode/vbscript') },
	velocity: { name: 'Velocity', import: () => import('@codemirror/legacy-modes/mode/velocity') },
	verilog: { name: 'Verilog', import: () => import('@codemirror/legacy-modes/mode/verilog') },
	vhdl: { name: 'VHDL', import: () => import('@codemirror/legacy-modes/mode/vhdl') },
	wast: { name: 'WebAssembly Text', import: () => import('@codemirror/legacy-modes/mode/wast') },
	webidl: { name: 'Web IDL', import: () => import('@codemirror/legacy-modes/mode/webidl') },
	xml: { name: 'XML', import: () => import('@codemirror/legacy-modes/mode/xml') },
	xquery: { name: 'XQuery', import: () => import('@codemirror/legacy-modes/mode/xquery') },
	yacas: { name: 'Yacas', import: () => import('@codemirror/legacy-modes/mode/yacas') },
	yaml: { name: 'YAML', import: () => Promise.resolve({}) },
	'yaml-frontmatter': { name: 'YAML Frontmatter', import: () => Promise.resolve({}) },
	z80: { name: 'Z80', import: () => import('@codemirror/legacy-modes/mode/z80') },
};

function tryGetParser(value: any): any | null {
	if (typeof value === 'object' && value && typeof value.token === 'function') {
		return value;
	}

	if (typeof value === 'function') {
		try {
			const result = value({});

			if (result && typeof result === 'object' && typeof result.token === 'function') {
				return result;
			}
		} catch {
			// Function may not accept empty object, try without args
		}

		try {
			const result = value();

			if (result && typeof result === 'object' && typeof result.token === 'function') {
				return result;
			}
		} catch {
			// Function may require args
		}
	}

	return null;
}

function findParserInModule(modeModule: any, normalizedMode: string): { parser: any; source: string } | null {
	const camelCaseMode = camelCase(normalizedMode);

	const candidates = [
		normalizedMode,
		camelCaseMode,
		normalizedMode.replace(/\./g, ''),
		camelCaseMode.replace(/\./g, ''),
	];

	for (const candidate of candidates) {
		const parser = tryGetParser(modeModule[candidate]);

		if (parser) {
			return { parser, source: candidate };
		}
	}

	for (const key of Object.keys(modeModule).filter((key) => key !== 'default')) {
		const parser = tryGetParser(modeModule[key]);

		if (parser) {
			return { parser, source: key };
		}
	}

	return null;
}

export default async function importCodemirrorMode(mode: string): Promise<LanguageSupport | null> {
	const normalizedMode = mode.toLowerCase();

	if (normalizedMode === 'plaintext') {
		return null;
	}

	switch (normalizedMode) {
		case 'javascript':
		case 'typescript':
		case 'ts':
		case 'jsx':
		case 'tsx':
			return javascript({ jsx: true, typescript: true });
		case 'markdown':
			return markdown();
		case 'gfm':
			return markdown();
		case 'php':
			return php();
		case 'yaml':
			return yaml();
		case 'yaml-frontmatter':
			return yaml();

		default: {
			const modeEntry = modeMap[normalizedMode];

			if (!modeEntry) {
				return null;
			}

			try {
				const modeModule = await modeEntry.import();

				const parserResult = findParserInModule(modeModule, normalizedMode);

				if (!parserResult) {
					return null;
				}

				return new LanguageSupport(StreamLanguage.define(parserResult.parser as StreamParser<unknown>));
			} catch {
				return null;
			}
		}
	}
}
