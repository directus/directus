import type { WebSocket } from 'ws';
import { z } from 'zod';
import type { Accountability } from '../accountability.js';

export const zodStringOrNumber = z.union([z.string(), z.number()]);

export const WebSocketMessage = z
	.object({
		type: z.string(),
		uid: zodStringOrNumber.optional(),
	})
	.passthrough();
export type WebSocketMessage = z.infer<typeof WebSocketMessage>;

export type AuthenticationState = {
	accountability: Accountability | null;
	expires_at: number | null;
	refresh_token?: string;
};

export type WebSocketClient = WebSocket &
	AuthenticationState & { uid: string | number; auth_timer: NodeJS.Timeout | null };
