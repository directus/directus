export var ALGORITHM_QUERY_PARAM = "X-Amz-Algorithm";
export var CREDENTIAL_QUERY_PARAM = "X-Amz-Credential";
export var AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
export var SIGNED_HEADERS_QUERY_PARAM = "X-Amz-SignedHeaders";
export var EXPIRES_QUERY_PARAM = "X-Amz-Expires";
export var SIGNATURE_QUERY_PARAM = "X-Amz-Signature";
export var TOKEN_QUERY_PARAM = "X-Amz-Security-Token";
export var REGION_SET_PARAM = "X-Amz-Region-Set";
export var AUTH_HEADER = "authorization";
export var AMZ_DATE_HEADER = AMZ_DATE_QUERY_PARAM.toLowerCase();
export var DATE_HEADER = "date";
export var GENERATED_HEADERS = [AUTH_HEADER, AMZ_DATE_HEADER, DATE_HEADER];
export var SIGNATURE_HEADER = SIGNATURE_QUERY_PARAM.toLowerCase();
export var SHA256_HEADER = "x-amz-content-sha256";
export var TOKEN_HEADER = TOKEN_QUERY_PARAM.toLowerCase();
export var HOST_HEADER = "host";
export var ALWAYS_UNSIGNABLE_HEADERS = {
    authorization: true,
    "cache-control": true,
    connection: true,
    expect: true,
    from: true,
    "keep-alive": true,
    "max-forwards": true,
    pragma: true,
    referer: true,
    te: true,
    trailer: true,
    "transfer-encoding": true,
    upgrade: true,
    "user-agent": true,
    "x-amzn-trace-id": true,
};
export var PROXY_HEADER_PATTERN = /^proxy-/;
export var SEC_HEADER_PATTERN = /^sec-/;
export var UNSIGNABLE_PATTERNS = [/^proxy-/i, /^sec-/i];
export var ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
export var ALGORITHM_IDENTIFIER_V4A = "AWS4-ECDSA-P256-SHA256";
export var EVENT_ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256-PAYLOAD";
export var UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
export var MAX_CACHE_SIZE = 50;
export var KEY_TYPE_IDENTIFIER = "aws4_request";
export var MAX_PRESIGNED_TTL = 60 * 60 * 24 * 7;
