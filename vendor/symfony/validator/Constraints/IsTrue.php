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
class IsTrue extends Constraint
{
    const NOT_TRUE_ERROR = '2beabf1c-54c0-4882-a928-05249b26e23b';

    protected static $errorNames = [
        self::NOT_TRUE_ERROR => 'NOT_TRUE_ERROR',
    ];

    public $message = 'This value should be true.';
}
