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
 * Metadata for the CardSchemeValidator.
 *
 * @Annotation
 * @Target({"PROPERTY", "METHOD", "ANNOTATION"})
 *
 * @author Tim Nagel <t.nagel@infinite.net.au>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class CardScheme extends Constraint
{
    const NOT_NUMERIC_ERROR = 'a2ad9231-e827-485f-8a1e-ef4d9a6d5c2e';
    const INVALID_FORMAT_ERROR = 'a8faedbf-1c2f-4695-8d22-55783be8efed';

    protected static $errorNames = array(
        self::NOT_NUMERIC_ERROR => 'NOT_NUMERIC_ERROR',
        self::INVALID_FORMAT_ERROR => 'INVALID_FORMAT_ERROR',
    );

    public $message = 'Unsupported card type or invalid card number.';
    public $schemes;

    public function getDefaultOption()
    {
        return 'schemes';
    }

    public function getRequiredOptions()
    {
        return array('schemes');
    }
}
