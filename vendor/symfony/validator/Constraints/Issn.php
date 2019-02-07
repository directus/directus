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
 * @Target({"PROPERTY", "METHOD", "ANNOTATION"})
 *
 * @author Antonio J. García Lagar <aj@garcialagar.es>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class Issn extends Constraint
{
    const TOO_SHORT_ERROR = '6a20dd3d-f463-4460-8e7b-18a1b98abbfb';
    const TOO_LONG_ERROR = '37cef893-5871-464e-8b12-7fb79324833c';
    const MISSING_HYPHEN_ERROR = '2983286f-8134-4693-957a-1ec4ef887b15';
    const INVALID_CHARACTERS_ERROR = 'a663d266-37c2-4ece-a914-ae891940c588';
    const INVALID_CASE_ERROR = '7b6dd393-7523-4a6c-b84d-72b91bba5e1a';
    const CHECKSUM_FAILED_ERROR = 'b0f92dbc-667c-48de-b526-ad9586d43e85';

    protected static $errorNames = [
        self::TOO_SHORT_ERROR => 'TOO_SHORT_ERROR',
        self::TOO_LONG_ERROR => 'TOO_LONG_ERROR',
        self::MISSING_HYPHEN_ERROR => 'MISSING_HYPHEN_ERROR',
        self::INVALID_CHARACTERS_ERROR => 'INVALID_CHARACTERS_ERROR',
        self::INVALID_CASE_ERROR => 'INVALID_CASE_ERROR',
        self::CHECKSUM_FAILED_ERROR => 'CHECKSUM_FAILED_ERROR',
    ];

    public $message = 'This value is not a valid ISSN.';
    public $caseSensitive = false;
    public $requireHyphen = false;
}
