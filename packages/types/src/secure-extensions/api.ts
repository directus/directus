import type { FetchSecure } from "./fetch.js"
import type { Logger } from "./logger.js"
import { ActivityServiceSecure, CollectionsServiceSecure, DashboardsServiceSecure, FieldsServiceSecure, FlowsServiceSecure, ItemsServiceSecure, NotificationsServiceSecure, OperationsServiceSecure, PanelsServiceSecure, PresetsServiceSecure, RelationsServiceSecure, RevisionsServiceSecure, ServerServiceSecure, SettingsServiceSecure, SharesServiceSecure, TranslationsServiceSecure, UtilsServiceSecure, WebSocketServiceSecure, WebhooksServiceSecure } from "./services.js"

export type ExtensionAPI = {
	fetch: FetchSecure
	logger: Logger
	ItemsService: typeof ItemsServiceSecure
	ActivityService: typeof ActivityServiceSecure
	CollectionsService: typeof CollectionsServiceSecure
	DashboardsService: typeof DashboardsServiceSecure
	FieldsService: typeof FieldsServiceSecure
	FlowsService: typeof FlowsServiceSecure
	NotificationsService: typeof NotificationsServiceSecure
	OperationsService: typeof OperationsServiceSecure
	PanelsService: typeof PanelsServiceSecure
	PresetsService: typeof PresetsServiceSecure
	RelationsService: typeof RelationsServiceSecure
	RevisionsService: typeof RevisionsServiceSecure
	ServerService: typeof ServerServiceSecure
	SettingsService: typeof SettingsServiceSecure
	SharesService: typeof SharesServiceSecure
	TranslationsService: typeof TranslationsServiceSecure
	UtilsService: typeof UtilsServiceSecure
	WebhooksService: typeof WebhooksServiceSecure
	WebSocketService: typeof WebSocketServiceSecure
}
