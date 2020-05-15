<?php

declare(strict_types=1);

namespace GraphQL\Utils;

use ArrayAccess;
use GraphQL\Type\Definition\EnumValueDefinition;
use InvalidArgumentException;
use SplObjectStorage;
use function array_key_exists;
use function array_search;
use function array_splice;
use function is_array;
use function is_float;
use function is_int;
use function is_object;
use function is_string;

/**
 * Similar to PHP array, but allows any type of data to act as key (including arrays, objects, scalars)
 *
 * Note: unfortunately when storing array as key - access and modification is O(N)
 * (yet this should be really rare case and should be avoided when possible)
 */
class MixedStore implements ArrayAccess
{
    /** @var EnumValueDefinition[] */
    private $standardStore;

    /** @var mixed[] */
    private $floatStore;

    /** @var SplObjectStorage */
    private $objectStore;

    /** @var callable[] */
    private $arrayKeys;

    /** @var EnumValueDefinition[] */
    private $arrayValues;

    /** @var callable[] */
    private $lastArrayKey;

    /** @var mixed */
    private $lastArrayValue;

    /** @var mixed */
    private $nullValue;

    /** @var bool */
    private $nullValueIsSet;

    /** @var mixed */
    private $trueValue;

    /** @var bool */
    private $trueValueIsSet;

    /** @var mixed */
    private $falseValue;

    /** @var bool */
    private $falseValueIsSet;

    public function __construct()
    {
        $this->standardStore   = [];
        $this->floatStore      = [];
        $this->objectStore     = new SplObjectStorage();
        $this->arrayKeys       = [];
        $this->arrayValues     = [];
        $this->nullValueIsSet  = false;
        $this->trueValueIsSet  = false;
        $this->falseValueIsSet = false;
    }

    /**
     * Whether a offset exists
     *
     * @link http://php.net/manual/en/arrayaccess.offsetexists.php
     *
     * @param mixed $offset <p>
     * An offset to check for.
     * </p>
     *
     * @return bool true on success or false on failure.
     * </p>
     * <p>
     * The return value will be casted to boolean if non-boolean was returned.
     */
    public function offsetExists($offset)
    {
        if ($offset === false) {
            return $this->falseValueIsSet;
        }
        if ($offset === true) {
            return $this->trueValueIsSet;
        }
        if (is_int($offset) || is_string($offset)) {
            return array_key_exists($offset, $this->standardStore);
        }
        if (is_float($offset)) {
            return array_key_exists((string) $offset, $this->floatStore);
        }
        if (is_object($offset)) {
            return $this->objectStore->offsetExists($offset);
        }
        if (is_array($offset)) {
            foreach ($this->arrayKeys as $index => $entry) {
                if ($entry === $offset) {
                    $this->lastArrayKey   = $offset;
                    $this->lastArrayValue = $this->arrayValues[$index];

                    return true;
                }
            }
        }
        if ($offset === null) {
            return $this->nullValueIsSet;
        }

        return false;
    }

    /**
     * Offset to retrieve
     *
     * @link http://php.net/manual/en/arrayaccess.offsetget.php
     *
     * @param mixed $offset <p>
     * The offset to retrieve.
     * </p>
     *
     * @return mixed Can return all value types.
     */
    public function offsetGet($offset)
    {
        if ($offset === true) {
            return $this->trueValue;
        }
        if ($offset === false) {
            return $this->falseValue;
        }
        if (is_int($offset) || is_string($offset)) {
            return $this->standardStore[$offset];
        }
        if (is_float($offset)) {
            return $this->floatStore[(string) $offset];
        }
        if (is_object($offset)) {
            return $this->objectStore->offsetGet($offset);
        }
        if (is_array($offset)) {
            // offsetGet is often called directly after offsetExists, so optimize to avoid second loop:
            if ($this->lastArrayKey === $offset) {
                return $this->lastArrayValue;
            }
            foreach ($this->arrayKeys as $index => $entry) {
                if ($entry === $offset) {
                    return $this->arrayValues[$index];
                }
            }
        }
        if ($offset === null) {
            return $this->nullValue;
        }

        return null;
    }

    /**
     * Offset to set
     *
     * @link http://php.net/manual/en/arrayaccess.offsetset.php
     *
     * @param mixed $offset <p>
     * The offset to assign the value to.
     * </p>
     * @param mixed $value  <p>
     *  The value to set.
     *  </p>
     *
     * @return void
     */
    public function offsetSet($offset, $value)
    {
        if ($offset === false) {
            $this->falseValue      = $value;
            $this->falseValueIsSet = true;
        } elseif ($offset === true) {
            $this->trueValue      = $value;
            $this->trueValueIsSet = true;
        } elseif (is_int($offset) || is_string($offset)) {
            $this->standardStore[$offset] = $value;
        } elseif (is_float($offset)) {
            $this->floatStore[(string) $offset] = $value;
        } elseif (is_object($offset)) {
            $this->objectStore[$offset] = $value;
        } elseif (is_array($offset)) {
            $this->arrayKeys[]   = $offset;
            $this->arrayValues[] = $value;
        } elseif ($offset === null) {
            $this->nullValue      = $value;
            $this->nullValueIsSet = true;
        } else {
            throw new InvalidArgumentException('Unexpected offset type: ' . Utils::printSafe($offset));
        }
    }

    /**
     * Offset to unset
     *
     * @link http://php.net/manual/en/arrayaccess.offsetunset.php
     *
     * @param mixed $offset <p>
     * The offset to unset.
     * </p>
     *
     * @return void
     */
    public function offsetUnset($offset)
    {
        if ($offset === true) {
            $this->trueValue      = null;
            $this->trueValueIsSet = false;
        } elseif ($offset === false) {
            $this->falseValue      = null;
            $this->falseValueIsSet = false;
        } elseif (is_int($offset) || is_string($offset)) {
            unset($this->standardStore[$offset]);
        } elseif (is_float($offset)) {
            unset($this->floatStore[(string) $offset]);
        } elseif (is_object($offset)) {
            $this->objectStore->offsetUnset($offset);
        } elseif (is_array($offset)) {
            $index = array_search($offset, $this->arrayKeys, true);

            if ($index !== false) {
                array_splice($this->arrayKeys, $index, 1);
                array_splice($this->arrayValues, $index, 1);
            }
        } elseif ($offset === null) {
            $this->nullValue      = null;
            $this->nullValueIsSet = false;
        }
    }
}
