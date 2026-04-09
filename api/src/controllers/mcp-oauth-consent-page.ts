/**
 * Server-rendered OAuth consent page using Liquid templates and Directus theme tokens.
 *
 * Renders outside the Vue SPA to avoid loading the full app bundle for a single form.
 * Templates use Liquid with auto-escaping enabled (`outputEscape: 'escape'`).
 * Only `styles` and `themeAttr` use the `| raw` filter (CSS and HTML attribute, respectively).
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flatten } from 'flat';
import { Liquid } from 'liquidjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Liquid engine scoped to our templates directory
// ---------------------------------------------------------------------------

const liquid = new Liquid({
	root: join(__dirname, 'templates'),
	extname: '.liquid',
	outputEscape: 'escape',
});

// ---------------------------------------------------------------------------
// Directus logo (inlined to avoid runtime filesystem dependency on app source)
// ---------------------------------------------------------------------------

const logoSvg = `<svg width="64" height="39" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" fill-rule="evenodd" clip-rule="evenodd" d="M51.18 24.61c-.3-.07-.55-.15-.77-.25-.16-.07-.3-.16-.42-.26a.31.31 0 0 1-.1-.27c.11-1.24-.02-2.33.1-3.56.5-5 3.64-3.41 6.46-4.23 1.62-.45 3.24-1.35 3.83-3.1.1-.3.01-.61-.19-.84a36.2 36.2 0 0 0-6.12-5.54A36.73 36.73 0 0 0 27.94.36a.46.46 0 0 0-.33.7 13.7 13.7 0 0 0 4.31 4.24c.31.19.19.6-.17.52a8.2 8.2 0 0 1-2.92-1.26.35.35 0 0 0-.33-.04l-1.64.67a.45.45 0 0 0-.12.75A13.7 13.7 0 0 0 42.8 7.3c.3-.19.8.2.7.55a27 27 0 0 0-.54 2.37c-1.26 6.37-4.9 5.87-9.4 4.27-9-3.26-14.12-.48-18.66-5.98-.31-.38-.87-.51-1.24-.19a4.25 4.25 0 0 0 .43 6.8c.14.1.33.05.44-.08.28-.35.5-.59.8-.74.3-.16.46.29.2.52-.97.85-1.25 1.87-1.88 3.87-.99 3.13-.57 6.34-5.2 7.18-2.45.12-2.4 1.78-3.29 4.25-1.03 2.98-2.39 4.3-4.9 6.9-.34.36-.36.93.01 1.25 1 .85 2.04.9 3.09.46 2.6-1.08 4.6-4.44 6.48-6.61 2.1-2.42 7.15-1.39 10.97-3.76 2.05-1.25 3.29-2.86 2.9-5.27-.07-.38.37-.62.53-.26.31.68.51 1.4.6 2.16.02.2.2.34.39.33 4.12-.23 9.46 4.3 14.44 5.53.3.08.52-.27.35-.53a9.17 9.17 0 0 1-1.3-3.02c-.1-.39.47-.5.66-.14a9.2 9.2 0 0 0 7.4 4.71c1.2.1 2.54-.05 3.93-.47 1.66-.5 3.19-1.14 5.02-.79 1.36.25 2.63.94 3.42 2.1 1.1 1.62 3.45 2.04 4.7.35a.81.81 0 0 0 .08-.8c-2.76-6.43-9.75-6.88-12.75-7.65Z"/></svg>`;

const logoDataUri = `data:image/svg+xml,${encodeURIComponent(logoSvg)}`;

// ---------------------------------------------------------------------------
// Theme CSS variables (inlined from @directus/themes to avoid Vue dependency)
// ---------------------------------------------------------------------------

const baseRules = {
	borderRadius: '0.3125rem',
	borderWidth: '2px',
	primary: 'var(--project-color)',
	primaryBackground: 'color-mix(in srgb, var(--theme--background), var(--theme--primary) 10%)',
	primarySubdued: 'color-mix(in srgb, var(--theme--background), var(--theme--primary) 50%)',
	danger: '#e35169',
	fonts: {
		display: { fontFamily: '"Inter", system-ui', fontWeight: '700' },
		sans: { fontFamily: '"Inter", system-ui', fontWeight: '500' },
		monospace: { fontFamily: '"Fira Mono", monospace', fontWeight: '500' },
	},
	form: {
		field: {
			input: {
				background: 'var(--theme--background)',
				foreground: 'var(--theme--foreground)',
				foregroundSubdued: 'var(--theme--foreground-subdued)',
				borderColor: 'var(--theme--border-color)',
				borderColorHover: 'var(--theme--border-color-accent)',
				padding: '0.875rem',
			},
		},
	},
	public: {
		background: 'var(--theme--background)',
		foreground: 'var(--theme--foreground)',
		foregroundAccent: 'var(--theme--foreground-accent)',
	},
};

const lightRules: Record<string, unknown> = {
	...baseRules,
	foreground: '#4f5464',
	foregroundAccent: '#172940',
	foregroundSubdued: '#a2b5cd',
	background: '#fff',
	backgroundNormal: '#f0f4f9',
	backgroundAccent: '#e4eaf1',
	backgroundSubdued: '#f7fafc',
	borderColor: '#e4eaf1',
	borderColorAccent: '#d3dae4',
	borderColorSubdued: '#f0f4f9',
	primaryAccent: 'color-mix(in srgb, var(--theme--primary), #2e3c43 25%)',
};

const darkRules: Record<string, unknown> = {
	...baseRules,
	foreground: '#c9d1d9',
	foregroundAccent: '#f0f6fc',
	foregroundSubdued: '#666672',
	background: '#0d1117',
	backgroundNormal: '#21262e',
	backgroundAccent: '#30363d',
	backgroundSubdued: '#161b22',
	borderColor: '#21262e',
	borderColorAccent: '#30363d',
	borderColorSubdued: '#21262d',
	primaryAccent: 'color-mix(in srgb, var(--theme--primary), #16151a 25%)',
};

// Same logic as @directus/themes rulesToCssVars
function camelToKebab(str: string): string {
	return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function rulesToCssVars(rules: Record<string, unknown>): Record<string, string | number> {
	const flattened = flatten<Record<string, unknown>, Record<string, string | number>>(rules, { delimiter: '--' });
	const result: Record<string, string | number> = {};

	for (const [key, value] of Object.entries(flattened)) {
		result[`--theme--${camelToKebab(key)}`] = value;
	}

	return result;
}

function varsToCss(vars: Record<string, string | number>): string {
	return Object.entries(vars)
		.map(([key, value]) => `${key}: ${value};`)
		.join('\n  ');
}

const lightCss = varsToCss(rulesToCssVars(lightRules));
const darkCss = varsToCss(rulesToCssVars(darkRules));

/**
 * Generate theme CSS with light/dark mode support.
 * Inlines Directus theme tokens as CSS custom properties (same logic as @directus/themes
 * `rulesToCssVars`). Uses `--project-color` as the primary color seed.
 *
 * @param projectColor - Hex color, already validated by `validateProjectColor`
 */
function buildStyles(projectColor: string): string {
	return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --project-color: ${projectColor};
  ${lightCss}
}

[data-theme="dark"] {
  ${darkCss}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    ${darkCss}
  }
}

body {
  font-family: var(--theme--fonts--sans--font-family);
  font-weight: var(--theme--fonts--sans--font-weight);
  background: var(--theme--background-subdued);
  color: var(--theme--public--foreground-accent);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  -webkit-font-smoothing: antialiased;
}

.card {
  background: var(--theme--public--background);
  color: var(--theme--public--foreground);
  border-radius: calc(var(--theme--border-radius) * 3);
  padding: 1.5rem;
  max-width: 576px;
  width: 100%;
  box-shadow: 0 0 40px 0 rgb(38 50 56 / 0.1);
}

@media (min-width: 480px) {
  .card { padding: 2.5rem 2.5rem 2rem; }
}

.logo-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  inline-size: 3.125rem;
  block-size: 3.125rem;
  border-radius: calc(var(--theme--border-radius) - 0.125rem);
  background: var(--theme--primary);
  overflow: hidden;
}

.logo img {
  object-fit: contain;
  object-position: center center;
  block-size: 2.25rem;
  inline-size: 2.25rem;
}


h1 {
  font-family: var(--theme--fonts--display--font-family);
  font-weight: var(--theme--fonts--display--font-weight);
  font-size: 1.25rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

h1 strong { font-weight: 700; }

.details {
  border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  overflow: hidden;
  margin-bottom: 1.25rem;
}

.details-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--theme--foreground-subdued);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.625rem var(--theme--form--field--input--padding);
  border-bottom: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
  background: var(--theme--background-subdued);
}

.detail-row {
  display: flex;
  align-items: baseline;
  padding: 0.5rem var(--theme--form--field--input--padding);
  font-size: 0.875rem;
  border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.detail-row:last-child { border-bottom: none; }

.detail-key {
  color: var(--theme--foreground-subdued);
  min-width: 7rem;
  flex-shrink: 0;
}

@media (max-width: 479px) {
  .detail-row { flex-direction: column; gap: 0.125rem; }
  .detail-key { min-width: 0; }
}

.detail-value {
  color: var(--theme--foreground-accent);
  word-break: break-all;
  font-family: var(--theme--fonts--monospace--font-family);
  font-size: 0.8125rem;
}

.detail-value.name {
  font-family: var(--theme--fonts--sans--font-family);
  font-size: 0.875rem;
  font-weight: 600;
}

.note {
  margin-bottom: 1.5rem;
  line-height: 1.6;
  color: var(--theme--foreground-subdued);
  font-size: 0.875rem;
}

.note strong { color: var(--theme--foreground); }

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
}

button {
  padding: 0.5rem 1.25rem;
  border: var(--theme--border-width) solid transparent;
  border-radius: var(--theme--border-radius);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}

button:hover { opacity: 0.85; }
button:active { opacity: 0.7; }

.btn-approve { background: var(--theme--primary); color: #fff; }
.btn-cancel { background: var(--theme--background); color: var(--theme--foreground); border-color: var(--theme--border-color-accent); }`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Theme and branding options from directus_settings + user appearance preference. */
export interface PageOpts {
	projectName: string;
	projectColor: string;
	logoUrl: string | null;
	appearance: string;
}

/** Data specific to the consent form: client info, signed params JWT, and the form action URL. */
export interface ConsentPageData {
	clientName: string;
	redirectUri: string;
	scope: string;
	signedParams: string;
	decisionUrl: string;
}

const DEFAULT_PROJECT_COLOR = '#6644ff';

function validateProjectColor(color: string): string {
	return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : DEFAULT_PROJECT_COLOR;
}

/**
 * Build shared template variables from page options.
 *
 * Template variables:
 * - `styles` (string, `| raw`): generated CSS with theme variables
 * - `themeAttr` (string, `| raw`): `data-theme="dark|light"` or empty for auto
 * - `logoUrl` / `logoDataUri`: custom project logo URL or default Directus logo as data URI
 * - `projectName`: escaped by Liquid auto-escape, safe for text content
 */
function buildTemplateData(opts: PageOpts) {
	const customLogo = !!opts.logoUrl;

	let themeAttr = '';

	if (opts.appearance === 'dark') themeAttr = ' data-theme="dark"';
	else if (opts.appearance === 'light') themeAttr = ' data-theme="light"';

	const validColor = validateProjectColor(opts.projectColor);

	return {
		projectName: opts.projectName,
		styles: buildStyles(validColor),
		themeAttr,
		logoClass: 'logo',
		logoUrl: customLogo ? opts.logoUrl : null,
		logoDataUri: !customLogo ? logoDataUri : null,
		logoAlt: customLogo ? opts.projectName : 'Directus',
	};
}

/** Render the OAuth consent approval/deny page. */
export async function renderConsentPage(data: ConsentPageData, opts: PageOpts): Promise<string> {
	return liquid.renderFile('oauth-consent', {
		...buildTemplateData(opts),
		...data,
	});
}

/** Render the OAuth error page (pre-redirect errors that can't be sent to the client). */
export async function renderErrorPage(description: string, opts: PageOpts): Promise<string> {
	return liquid.renderFile('oauth-error', {
		...buildTemplateData(opts),
		description,
	});
}
