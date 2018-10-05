<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Argument\Token;

/**
 * String contains token.
 *
 * @author Peter Mitchell <pete@peterjmit.com>
 */
class StringContainsToken implements TokenInterface
{
    private $value;

    /**
     * Initializes token.
     *
     * @param string $value
     */
    public function __construct($value)
    {
        $this->value = $value;
    }

    public function scoreArgument($argument)
    {
        return is_string($argument) && strpos($argument, $this->value) !== false ? 6 : false;
    }

    /**
     * Returns preset value against which token checks arguments.
     *
     * @return mixed
     */
    public function getValue()
    {
        return $this->value;
    }

    /**
     * Returns false.
     *
     * @return bool
     */
    public function isLast()
    {
        return false;
    }

    /**
     * Returns string representation for token.
     *
     * @return string
     */
    public function __toString()
    {
        return sprintf('contains("%s")', $this->value);
    }
}
