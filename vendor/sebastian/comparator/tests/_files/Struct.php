<?php
/*
 * This file is part of the Comparator package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Comparator;

/**
 * A struct.
 *
 */
class Struct
{
    public $var;

    public function __construct($var)
    {
        $this->var = $var;
    }
}
