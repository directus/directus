import { getDerivedLicenseStatus } from './license-status.js';
import type { DerivedLicenseStatus, LicenseGraceType, LicensePayloadStatus, LicenseTerminalStatus } from './types.js';

export type TerminalMode = 'hard' | 'recovered' | null;

type RuntimeState = {
	terminalMode: TerminalMode;
	status: DerivedLicenseStatus;
	locked: boolean;
	graceType: LicenseGraceType;
	canSchedule: boolean;
	canUsePayloadEntitlements: boolean;
};

export function getTerminalMode(options: {
	terminal?: LicenseTerminalStatus | undefined;
	durableStatus?: string | null | undefined;
}): TerminalMode {
	if (options.terminal !== 'canceled' && options.terminal !== 'expired') {
		return null;
	}

	return options.durableStatus === 'deactivated' ? 'recovered' : 'hard';
}

export function getRuntimeState(options: {
	terminal?: LicenseTerminalStatus | undefined;
	durableStatus?: string | null | undefined;
	payloadStatus?: LicensePayloadStatus | null | undefined;
	tokenExpiresAt?: number | null | undefined;
	gracePeriod?: number | null | undefined;
	graceOn?: string | Date | null | undefined;
	hasValidPayload?: boolean | undefined;
	isFallbackCompliant?: boolean | undefined;
}): RuntimeState {
	const terminalMode = getTerminalMode(options);

	if (terminalMode === 'hard' && options.terminal === 'canceled') {
		return {
			terminalMode,
			status: 'canceled',
			locked: true,
			graceType: null,
			canSchedule: false,
			canUsePayloadEntitlements: false,
		};
	}

	if (terminalMode === 'hard' && options.terminal === 'expired') {
		return {
			terminalMode,
			status: 'locked',
			locked: true,
			graceType: null,
			canSchedule: false,
			canUsePayloadEntitlements: false,
		};
	}

	if (options.hasValidPayload === undefined) {
		return {
			terminalMode,
			status: 'inactive',
			locked: false,
			graceType: null,
			canSchedule: terminalMode === null,
			canUsePayloadEntitlements: terminalMode === null,
		};
	}

	const state = getDerivedLicenseStatus({
		durableStatus: options.durableStatus,
		payloadStatus: options.payloadStatus,
		tokenExpiresAt: options.tokenExpiresAt,
		gracePeriod: options.gracePeriod,
		graceOn: options.graceOn,
		hasValidPayload: terminalMode === 'recovered' ? false : options.hasValidPayload,
		isFallbackCompliant: options.isFallbackCompliant,
	});

	return {
		terminalMode,
		...state,
		canSchedule: terminalMode === null,
		canUsePayloadEntitlements: terminalMode === null,
	};
}
