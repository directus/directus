import { ErrorCode } from './codes.js';
import type { ContainsNullValuesErrorExtensions } from './errors/contains-null-values.js';
import type { HitRateLimitErrorExtensions } from './errors/hit-rate-limit.js';
import type { IllegalAssetTransformationErrorExtensions } from './errors/illegal-asset-transformation.js';
import type { InvalidForeignKeyErrorExtensions } from './errors/invalid-foreign-key.js';
import type { InvalidPayloadErrorExtensions } from './errors/invalid-payload.js';
import type { InvalidProviderConfigErrorExtensions } from './errors/invalid-provider-config.js';
import type { InvalidQueryErrorExtensions } from './errors/invalid-query.js';
import type { MethodNotAllowedErrorExtensions } from './errors/method-not-allowed.js';
import type { NotNullViolationErrorExtensions } from './errors/not-null-violation.js';
import type { RangeNotSatisfiableErrorExtensions } from './errors/range-not-satisfiable.js';
import type { RecordNotUniqueErrorExtensions } from './errors/record-not-unique.js';
import type { RouteNotFoundErrorExtensions } from './errors/route-not-found.js';
import type { ServiceUnavailableErrorExtensions } from './errors/service-unavailable.js';
import type { UnprocessableContentErrorExtensions } from './errors/unprocessable-content.js';
import type { UnsupportedMediaTypeErrorExtensions } from './errors/unsupported-media-type.js';
import type { ValueOutOfRangeErrorExtensions } from './errors/value-out-of-range.js';
import type { ValueTooLongErrorExtensions } from './errors/value-too-long.js';

type Map = {
	[ErrorCode.ContainsNullValues]: ContainsNullValuesErrorExtensions;
	[ErrorCode.ContentTooLarge]: never;
	[ErrorCode.Forbidden]: never;
	[ErrorCode.IllegalAssetTransformation]: IllegalAssetTransformationErrorExtensions;
	[ErrorCode.InvalidCredentials]: never;
	[ErrorCode.InvalidForeignKey]: InvalidForeignKeyErrorExtensions;
	[ErrorCode.InvalidIp]: never;
	[ErrorCode.InvalidOtp]: never;
	[ErrorCode.InvalidPayload]: InvalidPayloadErrorExtensions;
	[ErrorCode.InvalidProvider]: never;
	[ErrorCode.InvalidProviderConfig]: InvalidProviderConfigErrorExtensions;
	[ErrorCode.InvalidQuery]: InvalidQueryErrorExtensions;
	[ErrorCode.InvalidToken]: never;
	[ErrorCode.LimitExceeded]: never;
	[ErrorCode.MethodNotAllowed]: MethodNotAllowedErrorExtensions;
	[ErrorCode.NotNullViolation]: NotNullViolationErrorExtensions;
	[ErrorCode.OutOfDate]: never;
	[ErrorCode.RangeNotSatisfiable]: RangeNotSatisfiableErrorExtensions;
	[ErrorCode.RecordNotUnique]: RecordNotUniqueErrorExtensions;
	[ErrorCode.RequestsExceeded]: HitRateLimitErrorExtensions;
	[ErrorCode.RouteNotFound]: RouteNotFoundErrorExtensions;
	[ErrorCode.ServiceUnavailable]: ServiceUnavailableErrorExtensions;
	[ErrorCode.TokenExpired]: never;
	[ErrorCode.UnexpectedResponse]: never;
	[ErrorCode.UnprocessableContent]: UnprocessableContentErrorExtensions;
	[ErrorCode.UnsupportedMediaType]: UnsupportedMediaTypeErrorExtensions;
	[ErrorCode.UserSuspended]: never;
	[ErrorCode.ValueOutOfRange]: ValueOutOfRangeErrorExtensions;
	[ErrorCode.ValueTooLong]: ValueTooLongErrorExtensions;
};

/** Verify all error codes are covered in the map. */
type Extends<T, U extends T> = U;

/** Map error codes to error extensions. */
export type ExtensionsMap = Extends<Record<(typeof ErrorCode)[keyof typeof ErrorCode], any>, Map>;
