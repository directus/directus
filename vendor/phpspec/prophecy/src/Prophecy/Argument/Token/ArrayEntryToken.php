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

use Prophecy\Exception\InvalidArgumentException;

/**
 * Array entry token.
 *
 * @author Boris Mikhaylov <kaguxmail@gmail.com>
 */
class ArrayEntryToken implements TokenInterface
{
    /** @var \Prophecy\Argument\Token\TokenInterface */
    private $key;
    /** @var \Prophecy\Argument\Token\TokenInterface */
    private $value;

    /**
     * @param mixed $key   exact value or token
     * @param mixed $value exact value or token
     */
    public function __construct($key, $value)
    {
        $this->key = $this->wrapIntoExactValueToken($key);
        $this->value = $this->wrapIntoExactValueToken($value);
    }

    /**
     * Scores half of combined scores from key and value tokens for same entry. Capped at 8.
     * If argument implements \ArrayAccess without \Traversable, then key token is restricted to ExactValueToken.
     *
     * @param array|\ArrayAccess|\Traversable $argument
     *
     * @throws \Prophecy\Exception\InvalidArgumentException
     * @return bool|int
     */
    public function scoreArgument($argument)
    {
        if ($argument instanceof \Traversable) {
            $argument = iterator_to_array($argument);
        }

        if ($argument instanceof \ArrayAccess) {
            $argument = $this->convertArrayAccessToEntry($argument);
        }

        if (!is_array($argument) || empty($argument)) {
            return false;
        }

        $keyScores = array_map(array($this->key,'scoreArgument'), array_keys($argument));
        $valueScores = array_map(array($this->value,'scoreArgument'), $argument);
        $scoreEntry = function ($value, $key) {
            return $value && $key ? min(8, ($key + $value) / 2) : false;
        };

        return max(array_map($scoreEntry, $valueScores, $keyScores));
    }

    /**
     * Returns false.
     *
     * @return boolean
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
        return sprintf('[..., %s => %s, ...]', $this->key, $this->value);
    }

    /**
     * Returns key
     *
     * @return TokenInterface
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * Returns value
     *
     * @return TokenInterface
     */
    public function getValue()
    {
        return $this->value;
    }

    /**
     * Wraps non token $value into ExactValueToken
     *
     * @param $value
     * @return TokenInterface
     */
    private function wrapIntoExactValueToken($value)
    {
        return $value instanceof TokenInterface ? $value : new ExactValueToken($value);
    }

    /**
     * Converts instance of \ArrayAccess to key => value array entry
     *
     * @param \ArrayAccess $object
     *
     * @return array|null
     * @throws \Prophecy\Exception\InvalidArgumentException
     */
    private function convertArrayAccessToEntry(\ArrayAccess $object)
    {
        if (!$this->key instanceof ExactValueToken) {
            throw new InvalidArgumentException(sprintf(
                'You can only use exact value tokens to match key of ArrayAccess object'.PHP_EOL.
                'But you used `%s`.',
                $this->key
            ));
        }

        $key = $this->key->getValue();

        return $object->offsetExists($key) ? array($key => $object[$key]) : array();
    }
}
