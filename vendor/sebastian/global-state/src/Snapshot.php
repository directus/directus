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
use Serializable;

/**
 * A snapshot of global state.
 */
class Snapshot
{
    /**
     * @var Blacklist
     */
    private $blacklist;

    /**
     * @var array
     */
    private $globalVariables = array();

    /**
     * @var array
     */
    private $superGlobalArrays = array();

    /**
     * @var array
     */
    private $superGlobalVariables = array();

    /**
     * @var array
     */
    private $staticAttributes = array();

    /**
     * @var array
     */
    private $iniSettings = array();

    /**
     * @var array
     */
    private $includedFiles = array();

    /**
     * @var array
     */
    private $constants = array();

    /**
     * @var array
     */
    private $functions = array();

    /**
     * @var array
     */
    private $interfaces = array();

    /**
     * @var array
     */
    private $classes = array();

    /**
     * @var array
     */
    private $traits = array();

    /**
     * Creates a snapshot of the current global state.
     *
     * @param Blacklist $blacklist
     * @param bool      $includeGlobalVariables
     * @param bool      $includeStaticAttributes
     * @param bool      $includeConstants
     * @param bool      $includeFunctions
     * @param bool      $includeClasses
     * @param bool      $includeInterfaces
     * @param bool      $includeTraits
     * @param bool      $includeIniSettings
     * @param bool      $includeIncludedFiles
     */
    public function __construct(Blacklist $blacklist = null, $includeGlobalVariables = true, $includeStaticAttributes = true, $includeConstants = true, $includeFunctions = true, $includeClasses = true, $includeInterfaces = true, $includeTraits = true, $includeIniSettings = true, $includeIncludedFiles = true)
    {
        if ($blacklist === null) {
            $blacklist = new Blacklist;
        }

        $this->blacklist = $blacklist;

        if ($includeConstants) {
            $this->snapshotConstants();
        }

        if ($includeFunctions) {
            $this->snapshotFunctions();
        }

        if ($includeClasses || $includeStaticAttributes) {
            $this->snapshotClasses();
        }

        if ($includeInterfaces) {
            $this->snapshotInterfaces();
        }

        if ($includeGlobalVariables) {
            $this->setupSuperGlobalArrays();
            $this->snapshotGlobals();
        }

        if ($includeStaticAttributes) {
            $this->snapshotStaticAttributes();
        }

        if ($includeIniSettings) {
            $this->iniSettings = ini_get_all(null, false);
        }

        if ($includeIncludedFiles) {
            $this->includedFiles = get_included_files();
        }

        if (function_exists('get_declared_traits')) {
            $this->traits = get_declared_traits();
        }
    }

    /**
     * @return Blacklist
     */
    public function blacklist()
    {
        return $this->blacklist;
    }

    /**
     * @return array
     */
    public function globalVariables()
    {
        return $this->globalVariables;
    }

    /**
     * @return array
     */
    public function superGlobalVariables()
    {
        return $this->superGlobalVariables;
    }

    /**
     * Returns a list of all super-global variable arrays.
     *
     * @return array
     */
    public function superGlobalArrays()
    {
        return $this->superGlobalArrays;
    }

    /**
     * @return array
     */
    public function staticAttributes()
    {
        return $this->staticAttributes;
    }

    /**
     * @return array
     */
    public function iniSettings()
    {
        return $this->iniSettings;
    }

    /**
     * @return array
     */
    public function includedFiles()
    {
        return $this->includedFiles;
    }

    /**
     * @return array
     */
    public function constants()
    {
        return $this->constants;
    }

    /**
     * @return array
     */
    public function functions()
    {
        return $this->functions;
    }

    /**
     * @return array
     */
    public function interfaces()
    {
        return $this->interfaces;
    }

    /**
     * @return array
     */
    public function classes()
    {
        return $this->classes;
    }

    /**
     * @return array
     */
    public function traits()
    {
        return $this->traits;
    }

    /**
     * Creates a snapshot user-defined constants.
     */
    private function snapshotConstants()
    {
        $constants = get_defined_constants(true);

        if (isset($constants['user'])) {
            $this->constants = $constants['user'];
        }
    }

    /**
     * Creates a snapshot user-defined functions.
     */
    private function snapshotFunctions()
    {
        $functions = get_defined_functions();

        $this->functions = $functions['user'];
    }

    /**
     * Creates a snapshot user-defined classes.
     */
    private function snapshotClasses()
    {
        foreach (array_reverse(get_declared_classes()) as $className) {
            $class = new ReflectionClass($className);

            if (!$class->isUserDefined()) {
                break;
            }

            $this->classes[] = $className;
        }

        $this->classes = array_reverse($this->classes);
    }

    /**
     * Creates a snapshot user-defined interfaces.
     */
    private function snapshotInterfaces()
    {
        foreach (array_reverse(get_declared_interfaces()) as $interfaceName) {
            $class = new ReflectionClass($interfaceName);

            if (!$class->isUserDefined()) {
                break;
            }

            $this->interfaces[] = $interfaceName;
        }

        $this->interfaces = array_reverse($this->interfaces);
    }

    /**
     * Creates a snapshot of all global and super-global variables.
     */
    private function snapshotGlobals()
    {
        $superGlobalArrays = $this->superGlobalArrays();

        foreach ($superGlobalArrays as $superGlobalArray) {
            $this->snapshotSuperGlobalArray($superGlobalArray);
        }

        foreach (array_keys($GLOBALS) as $key) {
            if ($key != 'GLOBALS' &&
                !in_array($key, $superGlobalArrays) &&
                $this->canBeSerialized($GLOBALS[$key]) &&
                !$this->blacklist->isGlobalVariableBlacklisted($key)) {
                $this->globalVariables[$key] = unserialize(serialize($GLOBALS[$key]));
            }
        }
    }

    /**
     * Creates a snapshot a super-global variable array.
     *
     * @param $superGlobalArray
     */
    private function snapshotSuperGlobalArray($superGlobalArray)
    {
        $this->superGlobalVariables[$superGlobalArray] = array();

        if (isset($GLOBALS[$superGlobalArray]) && is_array($GLOBALS[$superGlobalArray])) {
            foreach ($GLOBALS[$superGlobalArray] as $key => $value) {
                $this->superGlobalVariables[$superGlobalArray][$key] = unserialize(serialize($value));
            }
        }
    }

    /**
     * Creates a snapshot of all static attributes in user-defined classes.
     */
    private function snapshotStaticAttributes()
    {
        foreach ($this->classes as $className) {
            $class    = new ReflectionClass($className);
            $snapshot = array();

            foreach ($class->getProperties() as $attribute) {
                if ($attribute->isStatic()) {
                    $name = $attribute->getName();

                    if ($this->blacklist->isStaticAttributeBlacklisted($className, $name)) {
                        continue;
                    }

                    $attribute->setAccessible(true);
                    $value = $attribute->getValue();

                    if ($this->canBeSerialized($value)) {
                        $snapshot[$name] = unserialize(serialize($value));
                    }
                }
            }

            if (!empty($snapshot)) {
                $this->staticAttributes[$className] = $snapshot;
            }
        }
    }

    /**
     * Returns a list of all super-global variable arrays.
     *
     * @return array
     */
    private function setupSuperGlobalArrays()
    {
        $this->superGlobalArrays = array(
            '_ENV',
            '_POST',
            '_GET',
            '_COOKIE',
            '_SERVER',
            '_FILES',
            '_REQUEST'
        );

        if (ini_get('register_long_arrays') == '1') {
            $this->superGlobalArrays = array_merge(
                $this->superGlobalArrays,
                array(
                    'HTTP_ENV_VARS',
                    'HTTP_POST_VARS',
                    'HTTP_GET_VARS',
                    'HTTP_COOKIE_VARS',
                    'HTTP_SERVER_VARS',
                    'HTTP_POST_FILES'
                )
            );
        }
    }

    /**
     * @param  mixed $variable
     * @return bool
     * @todo   Implement this properly
     */
    private function canBeSerialized($variable)
    {
        if (!is_object($variable)) {
            return !is_resource($variable);
        }

        if ($variable instanceof \stdClass) {
            return true;
        }

        $class = new ReflectionClass($variable);

        do {
            if ($class->isInternal()) {
                return $variable instanceof Serializable;
            }
        } while ($class = $class->getParentClass());

        return true;
    }
}
