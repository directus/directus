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
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class Blank extends Constraint
{
    const NOT_BLANK_ERROR = '183ad2de-533d-4796-a439-6d3c3852b549';

    protected static $errorNames = [
        self::NOT_BLANK_ERROR => 'NOT_BLANK_ERROR',
    ];

    public $message = 'This value should be blank.';
}
