import { APP_BUILDER_CONFIG } from '../../modules/minis/config';
import {
	createQuickJSSandbox,
	type ErrorEntry,
	type LogEntry,
	type SandboxConfig,
	type SandboxResult,
} from '../../services/minis/quickjs-sandbox';
import { createSafeSDK } from '../../services/minis/safe-sdk';

export type { ErrorEntry, LogEntry, SandboxConfig, SandboxResult };

/**
 * Creates a secure sandbox environment for executing mini-app script using QuickJS/WASM.
 */
export async function createSandbox(
	script: string | null,
	options?: {
		config?: Record<string, any>;
		dashboard?: {
			getVariable(name: string): any;
			setVariable(name: string, value: any): void;
		};
		additionalConfig?: SandboxConfig;
	},
): Promise<SandboxResult> {
	const safeSdk = createSafeSDK({
		config: options?.config,
		dashboard: options?.dashboard,
	});

	const mergedConfig = { ...APP_BUILDER_CONFIG.sandbox, ...options?.additionalConfig };
	return createQuickJSSandbox(script, safeSdk, mergedConfig);
}

/**
 * Injects scoped CSS for a mini-app.
 * CSS is automatically scoped to the mini-app container to prevent style leakage.
 *
 * @param appId - The unique identifier for the mini-app
 * @param css - The CSS string to inject
 * @returns A cleanup function that removes the injected styles
 */
export function injectScopedCss(appId: string, css: string | null): () => void {
	if (!css || !css.trim()) {
		return () => {};
	}

	const styleId = `mini-app-style-${appId}`;

	// Remove existing style if present
	const existing = document.getElementById(styleId);

	if (existing) {
		existing.remove();
	}

	// Create and inject new style element
	const styleEl = document.createElement('style');
	styleEl.id = styleId;
	styleEl.setAttribute('data-mini-app', appId);

	// Scope CSS by wrapping with a container selector
	const scopedCss = css
		.split('}')
		.map((rule) => {
			const trimmed = rule.trim();

			if (!trimmed) return '';

			// Don't modify @-rules
			if (trimmed.startsWith('@')) return rule + '}';

			// Add scoping prefix to selectors
			const parts = trimmed.split('{');

			if (parts.length !== 2) return rule + '}';

			const selectors = parts[0]!
				.split(',')
				.map((s) => `.mini-app-container[data-app-id="${appId}"] ${s.trim()}`)
				.join(', ');

			return `${selectors} { ${parts[1]} }`;
		})
		.join('\n');

	styleEl.textContent = scopedCss;
	document.head.appendChild(styleEl);

	// Return cleanup function
	return () => {
		const el = document.getElementById(styleId);

		if (el) {
			el.remove();
		}
	};
}
