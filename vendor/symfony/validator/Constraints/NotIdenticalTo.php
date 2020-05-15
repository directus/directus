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

/**
 * @Annotation
 * @Target({"PROPERTY", "METHOD", "ANNOTATION"})
 *
 * @author Daniel Holmes <daniel@danielholmes.org>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class NotIdenticalTo extends AbstractComparison
{
    const IS_IDENTICAL_ERROR = '4aaac518-0dda-4129-a6d9-e216b9b454a0';

    protected static $errorNames = [
        self::IS_IDENTICAL_ERROR => 'IS_IDENTICAL_ERROR',
    ];

    public $message = 'This value should not be identical to {{ compared_value_type }} {{ compared_value }}.';
}
