export var RETRY_MODES;
(function (RETRY_MODES) {
    RETRY_MODES["STANDARD"] = "standard";
    RETRY_MODES["ADAPTIVE"] = "adaptive";
})(RETRY_MODES || (RETRY_MODES = {}));
export var DEFAULT_MAX_ATTEMPTS = 3;
export var DEFAULT_RETRY_MODE = RETRY_MODES.STANDARD;
