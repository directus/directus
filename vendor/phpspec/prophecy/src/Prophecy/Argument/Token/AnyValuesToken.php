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
 * Any values token.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class AnyValuesToken implements TokenInterface
{
    /**
     * Always scores 2 for any argument.
     *
     * @param $argument
     *
     * @return int
     */
    public function scoreArgument($argument)
    {
        return 2;
    }

    /**
     * Returns true to stop wildcard from processing other tokens.
     *
     * @return bool
     */
    public function isLast()
    {
        return true;
    }

    /**
     * Returns string representation for token.
     *
     * @return string
     */
    public function __toString()
    {
        return '* [, ...]';
    }
}
