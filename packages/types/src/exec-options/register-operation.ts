import type { z } from "zod";
import { EXEC_REGISTER_OPERATION } from "@directus/constants";

export type EXEC_REGISTER_OPERATION = z.infer<typeof EXEC_REGISTER_OPERATION>;
