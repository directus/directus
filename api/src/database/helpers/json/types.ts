import { DatabaseHelper } from "../types.js";

export abstract class JsonHelper extends DatabaseHelper {
    async supported(): Promise<boolean> {
        return false;
    }
}