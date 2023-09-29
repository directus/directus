import type { z } from "zod";
import { EXEC_CREATE_ENDPOINT } from "@directus/constants";

export type EXEC_CREATE_ENDPOINT = z.infer<typeof EXEC_CREATE_ENDPOINT>;
