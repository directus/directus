// Global type declarations for browser APIs used in the SDK.
// These provide fallback typings when the consumer's tsconfig does not include "DOM" in "lib",
// which is common in ESM / Node.js environments.

declare var RequestCredentials: 'omit' | 'same-origin' | 'include';

interface CloseEventInit extends EventInit {
	wasClean?: boolean;
	code?: number;
	reason?: string;
}

declare var CloseEvent: {
	prototype: CloseEvent;
	new (type: string, eventInitDict?: CloseEventInit): CloseEvent;
	readonly NONE: number;
	readonly NORMAL_CLOSURE: number;
	readonly GOING_AWAY: number;
	readonly PROTOCOL_ERROR: number;
	readonly UNSUPPORTED_DATA: number;
	readonly NO_STATUS_RECEIVED: number;
	readonly ABNORMAL_CLOSURE: number;
	readonly INVALID_FRAME_ERROR: number;
	readonly POLICY_VIOLATION: number;
	readonly MESSAGING_ERROR: number;
	readonly SECURITY_ERROR: number;
	readonly TIMEOUT_ERROR: number;
	readonly CLOSED: number;
};
