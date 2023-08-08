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

class AssetsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'assets',
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

class FilesService {
	constructor() {
		const service = databaseService.applySync(null, [
			'files',
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

class FolderService {
	constructor() {
		const service = databaseService.applySync(null, [
			'folder',
		])
		return createProxy(service)
	}
}

class ImportService {
	constructor() {
		const service = databaseService.applySync(null, [
			'import',
		])
		return createProxy(service)
	}
}

class ExportService {
	constructor() {
		const service = databaseService.applySync(null, [
			'export',
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

class PermissionsService {
	constructor() {
		const service = databaseService.applySync(null, [
			'permissions',
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

class RolesService {
	constructor() {
		const service = databaseService.applySync(null, [
			'roles',
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

class UsersService {
	constructor() {
		const service = databaseService.applySync(null, [
			'users',
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
	return new Proxy({}, {
		get: (_, prop) => {
			return (...args) => {
				console.log('args', args, prop, service)
				return new Promise((resolve, reject) => {

					service.apply(null, [
						new ivm.Reference(resolve),
						new ivm.Reference(reject),
						prop,
						new ivm.ExternalCopy(args).copyInto()
					])
				})
			}
		}
	})
}

globalThis.ItemsService = ItemsService
globalThis.ActivityService = ActivityService
globalThis.AssetsService = AssetsService
globalThis.CollectionsService = CollectionsService
globalThis.DashboardsService = DashboardsService
globalThis.FieldsService = FieldsService
globalThis.FilesService = FilesService
globalThis.FlowsService = FlowsService
globalThis.FolderService = FolderService
globalThis.ImportService = ImportService
globalThis.ExportService = ExportService
globalThis.NotificationsService = NotificationsService
globalThis.OperationsService = OperationsService
globalThis.PanelsService = PanelsService
globalThis.PermissionsService = PermissionsService
globalThis.PresetsService = PresetsService
globalThis.RelationsService = RelationsService
globalThis.RevisionsService = RevisionsService
globalThis.RolesService = RolesService
globalThis.ServerService = ServerService
globalThis.SettingsService = SettingsService
globalThis.SharesService = SharesService
globalThis.TranslationsService = TranslationsService
globalThis.UsersService = UsersService
globalThis.WebhooksService = WebhooksService
globalThis.WebSocketService = WebSocketService
