<?php

declare(strict_types=1);

namespace GraphQL\Error;

use function trigger_error;
use const E_USER_WARNING;

/**
 * Encapsulates warnings produced by the library.
 *
 * Warnings can be suppressed (individually or all) if required.
 * Also it is possible to override warning handler (which is **trigger_error()** by default)
 */
final class Warning
{
    const WARNING_ASSIGN             = 2;
    const WARNING_CONFIG             = 4;
    const WARNING_FULL_SCHEMA_SCAN   = 8;
    const WARNING_CONFIG_DEPRECATION = 16;
    const WARNING_NOT_A_TYPE         = 32;
    const ALL                        = 63;

    /** @var int */
    private static $enableWarnings = self::ALL;

    /** @var mixed[] */
    private static $warned = [];

    /** @var callable|null */
    private static $warningHandler;

    /**
     * Sets warning handler which can intercept all system warnings.
     * When not set, trigger_error() is used to notify about warnings.
     *
     * @api
     */
    public static function setWarningHandler(?callable $warningHandler = null)
    {
        self::$warningHandler = $warningHandler;
    }

    /**
     * Suppress warning by id (has no effect when custom warning handler is set)
     *
     * Usage example:
     * Warning::suppress(Warning::WARNING_NOT_A_TYPE)
     *
     * When passing true - suppresses all warnings.
     *
     * @param bool|int $suppress
     *
     * @api
     */
    public static function suppress($suppress = true)
    {
        if ($suppress === true) {
            self::$enableWarnings = 0;
        } elseif ($suppress === false) {
            self::$enableWarnings = self::ALL;
        } else {
            self::$enableWarnings &= ~$suppress;
        }
    }

    /**
     * Re-enable previously suppressed warning by id
     *
     * Usage example:
     * Warning::suppress(Warning::WARNING_NOT_A_TYPE)
     *
     * When passing true - re-enables all warnings.
     *
     * @param bool|int $enable
     *
     * @api
     */
    public static function enable($enable = true)
    {
        if ($enable === true) {
            self::$enableWarnings = self::ALL;
        } elseif ($enable === false) {
            self::$enableWarnings = 0;
        } else {
            self::$enableWarnings |= $enable;
        }
    }

    public static function warnOnce($errorMessage, $warningId, $messageLevel = null)
    {
        if (self::$warningHandler) {
            $fn = self::$warningHandler;
            $fn($errorMessage, $warningId);
        } elseif ((self::$enableWarnings & $warningId) > 0 && ! isset(self::$warned[$warningId])) {
            self::$warned[$warningId] = true;
            trigger_error($errorMessage, $messageLevel ?: E_USER_WARNING);
        }
    }

    public static function warn($errorMessage, $warningId, $messageLevel = null)
    {
        if (self::$warningHandler) {
            $fn = self::$warningHandler;
            $fn($errorMessage, $warningId);
        } elseif ((self::$enableWarnings & $warningId) > 0) {
            trigger_error($errorMessage, $messageLevel ?: E_USER_WARNING);
        }
    }
}
