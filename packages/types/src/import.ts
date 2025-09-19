import type { FilterOperator } from './filter.js';

/**
 * Import-specific validation error with row ranges and counts
 * Similar to ValidationError but optimized for import operations
 */
export interface ImportValidationError {
  /** Error code */
  code: string;
  /** Collection name */
  collection: string;
  /** Field name */
  field: string;
  /** Validation type */
  type: FilterOperator | string; // Allow both FilterOperator and string for flexibility
  /** Field group */
  group: string | null;
  /** Row ranges affected by this error (e.g., "2-4, 7") */
  rows: string;
  /** Number of rows affected by this error */
  count: number;
  /** Custom validation message or reason */
  reason: string;
}

/**
 * Extensions for InvalidPayloadError when used for import operations
 */
export interface ImportErrorExtensions {
  reason: string;
  /** Grouped validation errors with row ranges */
  rows: ImportValidationError[];
  /** Total number of individual errors */
  totalErrors: number;
}
