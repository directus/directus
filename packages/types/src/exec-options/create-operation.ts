import type { z } from "zod";
import { EXEC_CREATE_OPERATION } from "@directus/constants";

export type EXEC_CREATE_OPERATION = z.infer<typeof EXEC_CREATE_OPERATION>;
