<?php
/*
 * This file is part of the GlobalState package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\GlobalState;

use ReflectionProperty;

/**
 * Restorer of snapshots of global state.
 */
class Restorer
{
    /**
     * Deletes function definitions that are not defined in a snapshot.
     *
     * @param  Snapshot         $snapshot
     * @throws RuntimeException when the uopz_delete() function is not available
     * @see    https://github.com/krakjoe/uopz
     */
    public function restoreFunctions(Snapshot $snapshot)
    {
        if (!function_exists('uopz_delete')) {
            throw new RuntimeException('The uopz_delete() function is required for this operation');
        }

        $functions = get_defined_functions();

        foreach (array_diff($functions['user'], $snapshot->functions()) as $function) {
            uopz_delete($function);
        }
    }

    /**
     * Restores all global and super-global variables from a snapshot.
     *
     * @param Snapshot $snapshot
     */
    public function restoreGlobalVariables(Snapshot $snapshot)
    {
        $superGlobalArrays = $snapshot->superGlobalArrays();

        foreach ($superGlobalArrays as $superGlobalArray) {
            $this->restoreSuperGlobalArray($snapshot, $superGlobalArray);
        }

        $globalVariables = $snapshot->globalVariables();

        foreach (array_keys($GLOBALS) as $key) {
            if ($key != 'GLOBALS' &&
                !in_array($key, $superGlobalArrays) &&
                !$snapshot->blacklist()->isGlobalVariableBlacklisted($key)) {
                if (isset($globalVariables[$key])) {
                    $GLOBALS[$key] = $globalVariables[$key];
                } else {
                    unset($GLOBALS[$key]);
                }
            }
        }
    }

    /**
     * Restores all static attributes in user-defined classes from this snapshot.
     *
     * @param Snapshot $snapshot
     */
    public function restoreStaticAttributes(Snapshot $snapshot)
    {
        $current    = new Snapshot($snapshot->blacklist(), false, false, false, false, true, false, false, false, false);
        $newClasses = array_diff($current->classes(), $snapshot->classes());
        unset($current);

        foreach ($snapshot->staticAttributes() as $className => $staticAttributes) {
            foreach ($staticAttributes as $name => $value) {
                $reflector = new ReflectionProperty($className, $name);
                $reflector->setAccessible(true);
                $reflector->setValue($value);
            }
        }

        foreach ($newClasses as $className) {
            $class    = new \ReflectionClass($className);
            $defaults = $class->getDefaultProperties();

            foreach ($class->getProperties() as $attribute) {
                if (!$attribute->isStatic()) {
                    continue;
                }

                $name = $attribute->getName();

                if ($snapshot->blacklist()->isStaticAttributeBlacklisted($className, $name)) {
                    continue;
                }

                if (!isset($defaults[$name])) {
                    continue;
                }

                $attribute->setAccessible(true);
                $attribute->setValue($defaults[$name]);
            }
        }
    }

    /**
     * Restores a super-global variable array from this snapshot.
     *
     * @param Snapshot $snapshot
     * @param $superGlobalArray
     */
    private function restoreSuperGlobalArray(Snapshot $snapshot, $superGlobalArray)
    {
        $superGlobalVariables = $snapshot->superGlobalVariables();

        if (isset($GLOBALS[$superGlobalArray]) &&
            is_array($GLOBALS[$superGlobalArray]) &&
            isset($superGlobalVariables[$superGlobalArray])) {
            $keys = array_keys(
                array_merge(
                    $GLOBALS[$superGlobalArray],
                    $superGlobalVariables[$superGlobalArray]
                )
            );

            foreach ($keys as $key) {
                if (isset($superGlobalVariables[$superGlobalArray][$key])) {
                    $GLOBALS[$superGlobalArray][$key] = $superGlobalVariables[$superGlobalArray][$key];
                } else {
                    unset($GLOBALS[$superGlobalArray][$key]);
                }
            }
        }
    }
}
