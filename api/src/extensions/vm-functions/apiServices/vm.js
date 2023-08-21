// @ts-nocheck

const ivm = $0
const databaseService = $1

class ItemsService {
	constructor(collection) {
		const service = databaseService.applySync(null, [
			'items',
			collection
		])
		return createProxy(service)
	}
}

class ActivityService {
	constructor() {
		const service = databaseService.applySync(null, [
			'activity',
		])
		return createProxy(service)
	}
}

class CollectionsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'collections',
		])
		return createProxy(service)
	}
}

class DashboardsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'dashboards',
		])
		return createProxy(service)
	}
}

class FieldsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'fields',
		])
		return createProxy(service)
	}
}

class FlowsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'flows',
		])
		return createProxy(service)
	}
}


class NotificationsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'notifications',
		])
		return createProxy(service)
	}
}

class OperationsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'operations',
		])
		return createProxy(service)
	}
}

class PanelsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'panels',
		])
		return createProxy(service)
	}
}

class PresetsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'presets',
		])
		return createProxy(service)
	}
}

class RelationsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'relations',
		])
		return createProxy(service)
	}
}

class RevisionsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'revisions',
		])
		return createProxy(service)
	}
}

class ServerService {
	constructor() {
		const service = databaseService.applySync(null, [
			'server',
		])
		return createProxy(service)
	}
}

class SettingsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'settings',
		])
		return createProxy(service)
	}
}

class SharesService {
	constructor() {
		const service = databaseService.applySync(null, [
			'shares',
		])
		return createProxy(service)
	}
}

class TranslationsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'translations',
		])
		return createProxy(service)
	}
}

class UtilsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'utils',
		])
		return createProxy(service)
	}
}

class WebhooksService {
	constructor() {
		const service = databaseService.applySync(null, [
			'webhooks',
		])
		return createProxy(service)
	}
}

class WebSocketService {
	constructor() {
		const service = databaseService.applySync(null, [
			'websocket',
		])

		return createProxy(service)
	}
}


function createProxy(service) {
	if (service instanceof Error) throw service

	return new Proxy({}, {
		get: (_, prop) => {
			return (...args) => {
				console.log('args', args, prop, service)
				return new Promise((resolve, reject) => {

					service.apply(null, [
						new ivm.Reference(resolve),
						new ivm.Reference(reject),
						prop,
						new ivm.ExternalCopy(args.map(arg => {
							if (typeof arg === 'function') {
								return new ivm.Reference(arg)
							} else {
								return arg
							}
						})).copyInto()
					])
				})
			}
		}
	})
}

globalThis.API.ItemsService = ItemsService
globalThis.API.ActivityService = ActivityService
globalThis.API.CollectionsService = CollectionsService
globalThis.API.DashboardsService = DashboardsService
globalThis.API.FieldsService = FieldsService
globalThis.API.FlowsService = FlowsService
globalThis.API.NotificationsService = NotificationsService
globalThis.API.OperationsService = OperationsService
globalThis.API.PanelsService = PanelsService
globalThis.API.PresetsService = PresetsService
globalThis.API.RelationsService = RelationsService
globalThis.API.RevisionsService = RevisionsService
globalThis.API.ServerService = ServerService
globalThis.API.SettingsService = SettingsService
globalThis.API.SharesService = SharesService
globalThis.API.TranslationsService = TranslationsService
globalThis.API.UtilsService = UtilsService
globalThis.API.WebhooksService = WebhooksService
globalThis.API.WebSocketService = WebSocketService
