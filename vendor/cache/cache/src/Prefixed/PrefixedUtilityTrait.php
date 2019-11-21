<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Prefixed;

/**
 * Utility to reduce code suplication between the Prefixed* decoratrs.
 *
 * @author ndobromirov
 */
trait PrefixedUtilityTrait
{
    /**
     * @type string Prefix to use for key namespaceing.
     */
    private $prefix;

    /**
     * Add namespace prefix on the key.
     *
     * @param array $keys Reference to the key. It is mutated.
     */
    private function prefixValue(&$key)
    {
        $key = $this->prefix.$key;
    }

    /**
     * Adds a namespace prefix on a list of keys.
     *
     * @param array $keys Reference to the list of keys. The list is mutated.
     */
    private function prefixValues(array &$keys)
    {
        foreach ($keys as &$key) {
            $this->prefixValue($key);
        }
    }
}
