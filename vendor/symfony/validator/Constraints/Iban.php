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
 * @author Manuel Reinhard <manu@sprain.ch>
 * @author Michael Schummel
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class Iban extends Constraint
{
    const INVALID_COUNTRY_CODE_ERROR = 'de78ee2c-bd50-44e2-aec8-3d8228aeadb9';
    const INVALID_CHARACTERS_ERROR = '8d3d85e4-784f-4719-a5bc-d9e40d45a3a5';
    const CHECKSUM_FAILED_ERROR = 'b9401321-f9bf-4dcb-83c1-f31094440795';
    const INVALID_FORMAT_ERROR = 'c8d318f1-2ecc-41ba-b983-df70d225cf5a';
    const NOT_SUPPORTED_COUNTRY_CODE_ERROR = 'e2c259f3-4b46-48e6-b72e-891658158ec8';

    protected static $errorNames = array(
        self::INVALID_COUNTRY_CODE_ERROR => 'INVALID_COUNTRY_CODE_ERROR',
        self::INVALID_CHARACTERS_ERROR => 'INVALID_CHARACTERS_ERROR',
        self::CHECKSUM_FAILED_ERROR => 'CHECKSUM_FAILED_ERROR',
        self::INVALID_FORMAT_ERROR => 'INVALID_FORMAT_ERROR',
        self::NOT_SUPPORTED_COUNTRY_CODE_ERROR => 'NOT_SUPPORTED_COUNTRY_CODE_ERROR',
    );

    public $message = 'This is not a valid International Bank Account Number (IBAN).';
}
