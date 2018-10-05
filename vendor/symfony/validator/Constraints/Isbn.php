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
 * @author The Whole Life To Learn <thewholelifetolearn@gmail.com>
 * @author Manuel Reinhard <manu@sprain.ch>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class Isbn extends Constraint
{
    const TOO_SHORT_ERROR = '949acbb0-8ef5-43ed-a0e9-032dfd08ae45';
    const TOO_LONG_ERROR = '3171387d-f80a-47b3-bd6e-60598545316a';
    const INVALID_CHARACTERS_ERROR = '23d21cea-da99-453d-98b1-a7d916fbb339';
    const CHECKSUM_FAILED_ERROR = '2881c032-660f-46b6-8153-d352d9706640';
    const TYPE_NOT_RECOGNIZED_ERROR = 'fa54a457-f042-441f-89c4-066ee5bdd3e1';

    protected static $errorNames = array(
        self::TOO_SHORT_ERROR => 'TOO_SHORT_ERROR',
        self::TOO_LONG_ERROR => 'TOO_LONG_ERROR',
        self::INVALID_CHARACTERS_ERROR => 'INVALID_CHARACTERS_ERROR',
        self::CHECKSUM_FAILED_ERROR => 'CHECKSUM_FAILED_ERROR',
        self::TYPE_NOT_RECOGNIZED_ERROR => 'TYPE_NOT_RECOGNIZED_ERROR',
    );

    public $isbn10Message = 'This value is not a valid ISBN-10.';
    public $isbn13Message = 'This value is not a valid ISBN-13.';
    public $bothIsbnMessage = 'This value is neither a valid ISBN-10 nor a valid ISBN-13.';
    public $type;
    public $message;

    /**
     * {@inheritdoc}
     */
    public function getDefaultOption()
    {
        return 'type';
    }
}
