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
 * An author.
 *
 */
class Author
{
    // the order of properties is important for testing the cycle!
    public $books = array();

    private $name = '';

    public function __construct($name)
    {
        $this->name = $name;
    }
}
