export type LicenseBannerState = {
	showExpiringSoonWarning: boolean;
	showExpirationGraceWarning: boolean;
	showInvalidWarning: boolean;
	showLockedWarning: boolean;
	daysUntilExpiry: number | null;
	daysUntilLock: number | null;
	errorCode: string | null;
	errorMessage: string | null;
};

export type LicenseUsageRow = {
	key: string;
	icon: string;
	label: string;
	value:
		| {
				type: 'text';
				text: string;
		  }
		| {
				type: 'chip';
				text: string;
				tone: 'neutral' | 'primary';
		  };
};

export type AddonRow = {
	id: string;
	name: string;
	description: string | null;
	pricingSummary: string | null;
	icon: string;
	action: 'purchase' | 'manage' | 'upgrade';
	disabled: boolean;
	activeQuantity: number;
	scheduledQuantity: number;
	pendingDowngrade: boolean;
	minQuantity: number;
	maxQuantity: number | null;
};
