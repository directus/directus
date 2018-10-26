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
 * Logical NOT token.
 *
 * @author Boris Mikhaylov <kaguxmail@gmail.com>
 */
class LogicalNotToken implements TokenInterface
{
    /** @var \Prophecy\Argument\Token\TokenInterface  */
    private $token;

    /**
     * @param mixed $value exact value or token
     */
    public function __construct($value)
    {
        $this->token = $value instanceof TokenInterface? $value : new ExactValueToken($value);
    }

    /**
     * Scores 4 when preset token does not match the argument.
     *
     * @param $argument
     *
     * @return bool|int
     */
    public function scoreArgument($argument)
    {
        return false === $this->token->scoreArgument($argument) ? 4 : false;
    }

    /**
     * Returns true if preset token is last.
     *
     * @return bool|int
     */
    public function isLast()
    {
        return $this->token->isLast();
    }

    /**
     * Returns originating token.
     *
     * @return TokenInterface
     */
    public function getOriginatingToken()
    {
        return $this->token;
    }

    /**
     * Returns string representation for token.
     *
     * @return string
     */
    public function __toString()
    {
        return sprintf('not(%s)', $this->token);
    }
}
