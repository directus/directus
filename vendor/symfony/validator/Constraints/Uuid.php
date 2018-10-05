<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Constraints;

use Symfony\Component\Validator\Constraint;

/**
 * @Annotation
 *
 * @author Colin O'Dell <colinodell@gmail.com>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class Uuid extends Constraint
{
    const TOO_SHORT_ERROR = 'aa314679-dac9-4f54-bf97-b2049df8f2a3';
    const TOO_LONG_ERROR = '494897dd-36f8-4d31-8923-71a8d5f3000d';
    const INVALID_CHARACTERS_ERROR = '51120b12-a2bc-41bf-aa53-cd73daf330d0';
    const INVALID_HYPHEN_PLACEMENT_ERROR = '98469c83-0309-4f5d-bf95-a496dcaa869c';
    const INVALID_VERSION_ERROR = '21ba13b4-b185-4882-ac6f-d147355987eb';
    const INVALID_VARIANT_ERROR = '164ef693-2b9d-46de-ad7f-836201f0c2db';

    protected static $errorNames = array(
        self::TOO_SHORT_ERROR => 'TOO_SHORT_ERROR',
        self::TOO_LONG_ERROR => 'TOO_LONG_ERROR',
        self::INVALID_CHARACTERS_ERROR => 'INVALID_CHARACTERS_ERROR',
        self::INVALID_HYPHEN_PLACEMENT_ERROR => 'INVALID_HYPHEN_PLACEMENT_ERROR',
        self::INVALID_VERSION_ERROR => 'INVALID_VERSION_ERROR',
        self::INVALID_VARIANT_ERROR => 'INVALID_VARIANT_ERROR',
    );

    // Possible versions defined by RFC 4122
    const V1_MAC = 1;
    const V2_DCE = 2;
    const V3_MD5 = 3;
    const V4_RANDOM = 4;
    const V5_SHA1 = 5;

    /**
     * Message to display when validation fails.
     *
     * @var string
     */
    public $message = 'This is not a valid UUID.';

    /**
     * Strict mode only allows UUIDs that meet the formal definition and formatting per RFC 4122.
     *
     * Set this to `false` to allow legacy formats with different dash positioning or wrapping characters
     *
     * @var bool
     */
    public $strict = true;

    /**
     * Array of allowed versions (see version constants above).
     *
     * All UUID versions are allowed by default
     *
     * @var int[]
     */
    public $versions = array(
        self::V1_MAC,
        self::V2_DCE,
        self::V3_MD5,
        self::V4_RANDOM,
        self::V5_SHA1,
    );
}
