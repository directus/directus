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

use ReflectionClass;

/**
 * A blacklist for global state elements that should not be snapshotted.
 */
class Blacklist
{
    /**
     * @var array
     */
    private $globalVariables = array();

    /**
     * @var array
     */
    private $classes = array();

    /**
     * @var array
     */
    private $classNamePrefixes = array();

    /**
     * @var array
     */
    private $parentClasses = array();

    /**
     * @var array
     */
    private $interfaces = array();

    /**
     * @var array
     */
    private $staticAttributes = array();

    /**
     * @param string $variableName
     */
    public function addGlobalVariable($variableName)
    {
        $this->globalVariables[$variableName] = true;
    }

    /**
     * @param string $className
     */
    public function addClass($className)
    {
        $this->classes[] = $className;
    }

    /**
     * @param string $className
     */
    public function addSubclassesOf($className)
    {
        $this->parentClasses[] = $className;
    }

    /**
     * @param string $interfaceName
     */
    public function addImplementorsOf($interfaceName)
    {
        $this->interfaces[] = $interfaceName;
    }

    /**
     * @param string $classNamePrefix
     */
    public function addClassNamePrefix($classNamePrefix)
    {
        $this->classNamePrefixes[] = $classNamePrefix;
    }

    /**
     * @param string $className
     * @param string $attributeName
     */
    public function addStaticAttribute($className, $attributeName)
    {
        if (!isset($this->staticAttributes[$className])) {
            $this->staticAttributes[$className] = array();
        }

        $this->staticAttributes[$className][$attributeName] = true;
    }

    /**
     * @param  string $variableName
     * @return bool
     */
    public function isGlobalVariableBlacklisted($variableName)
    {
        return isset($this->globalVariables[$variableName]);
    }

    /**
     * @param  string $className
     * @param  string $attributeName
     * @return bool
     */
    public function isStaticAttributeBlacklisted($className, $attributeName)
    {
        if (in_array($className, $this->classes)) {
            return true;
        }

        foreach ($this->classNamePrefixes as $prefix) {
            if (strpos($className, $prefix) === 0) {
                return true;
            }
        }

        $class = new ReflectionClass($className);

        foreach ($this->parentClasses as $type) {
            if ($class->isSubclassOf($type)) {
                return true;
            }
        }

        foreach ($this->interfaces as $type) {
            if ($class->implementsInterface($type)) {
                return true;
            }
        }

        if (isset($this->staticAttributes[$className][$attributeName])) {
            return true;
        }

        return false;
    }
}
