import type { ExtensionManager } from "./extensions.js";
import { Worker, isMainThread, parentPort } from 'node:worker_threads'

export class WorkerManager {
    private extensionManager: ExtensionManager;

    constructor(extensionManager: ExtensionManager) {
        this.extensionManager = extensionManager;
    }

    public function name(params: type) {

    }
}

export class ExtensionWorker {

}