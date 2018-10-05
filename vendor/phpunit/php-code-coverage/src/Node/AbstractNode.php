<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage\Node;

use SebastianBergmann\CodeCoverage\Util;

/**
 * Base class for nodes in the code coverage information tree.
 */
abstract class AbstractNode implements \Countable
{
    /**
     * @var string
     */
    private $name;

    /**
     * @var string
     */
    private $path;

    /**
     * @var array
     */
    private $pathArray;

    /**
     * @var AbstractNode
     */
    private $parent;

    /**
     * @var string
     */
    private $id;

    /**
     * Constructor.
     *
     * @param string       $name
     * @param AbstractNode $parent
     */
    public function __construct($name, AbstractNode $parent = null)
    {
        if (substr($name, -1) == '/') {
            $name = substr($name, 0, -1);
        }

        $this->name   = $name;
        $this->parent = $parent;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return string
     */
    public function getId()
    {
        if ($this->id === null) {
            $parent = $this->getParent();

            if ($parent === null) {
                $this->id = 'index';
            } else {
                $parentId = $parent->getId();

                if ($parentId == 'index') {
                    $this->id = str_replace(':', '_', $this->name);
                } else {
                    $this->id = $parentId . '/' . $this->name;
                }
            }
        }

        return $this->id;
    }

    /**
     * @return string
     */
    public function getPath()
    {
        if ($this->path === null) {
            if ($this->parent === null || $this->parent->getPath() === null || $this->parent->getPath() === false) {
                $this->path = $this->name;
            } else {
                $this->path = $this->parent->getPath() . '/' . $this->name;
            }
        }

        return $this->path;
    }

    /**
     * @return array
     */
    public function getPathAsArray()
    {
        if ($this->pathArray === null) {
            if ($this->parent === null) {
                $this->pathArray = [];
            } else {
                $this->pathArray = $this->parent->getPathAsArray();
            }

            $this->pathArray[] = $this;
        }

        return $this->pathArray;
    }

    /**
     * @return AbstractNode
     */
    public function getParent()
    {
        return $this->parent;
    }

    /**
     * Returns the percentage of classes that has been tested.
     *
     * @param bool $asString
     *
     * @return int
     */
    public function getTestedClassesPercent($asString = true)
    {
        return Util::percent(
            $this->getNumTestedClasses(),
            $this->getNumClasses(),
            $asString
        );
    }

    /**
     * Returns the percentage of traits that has been tested.
     *
     * @param bool $asString
     *
     * @return int
     */
    public function getTestedTraitsPercent($asString = true)
    {
        return Util::percent(
            $this->getNumTestedTraits(),
            $this->getNumTraits(),
            $asString
        );
    }

    /**
     * Returns the percentage of traits that has been tested.
     *
     * @param bool $asString
     *
     * @return int
     */
    public function getTestedClassesAndTraitsPercent($asString = true)
    {
        return Util::percent(
            $this->getNumTestedClassesAndTraits(),
            $this->getNumClassesAndTraits(),
            $asString
        );
    }

    /**
     * Returns the percentage of methods that has been tested.
     *
     * @param bool $asString
     *
     * @return int
     */
    public function getTestedMethodsPercent($asString = true)
    {
        return Util::percent(
            $this->getNumTestedMethods(),
            $this->getNumMethods(),
            $asString
        );
    }

    /**
     * Returns the percentage of executed lines.
     *
     * @param bool $asString
     *
     * @return int
     */
    public function getLineExecutedPercent($asString = true)
    {
        return Util::percent(
            $this->getNumExecutedLines(),
            $this->getNumExecutableLines(),
            $asString
        );
    }

    /**
     * Returns the number of classes and traits.
     *
     * @return int
     */
    public function getNumClassesAndTraits()
    {
        return $this->getNumClasses() + $this->getNumTraits();
    }

    /**
     * Returns the number of tested classes and traits.
     *
     * @return int
     */
    public function getNumTestedClassesAndTraits()
    {
        return $this->getNumTestedClasses() + $this->getNumTestedTraits();
    }

    /**
     * Returns the classes and traits of this node.
     *
     * @return array
     */
    public function getClassesAndTraits()
    {
        return array_merge($this->getClasses(), $this->getTraits());
    }

    /**
     * Returns the classes of this node.
     *
     * @return array
     */
    abstract public function getClasses();

    /**
     * Returns the traits of this node.
     *
     * @return array
     */
    abstract public function getTraits();

    /**
     * Returns the functions of this node.
     *
     * @return array
     */
    abstract public function getFunctions();

    /**
     * Returns the LOC/CLOC/NCLOC of this node.
     *
     * @return array
     */
    abstract public function getLinesOfCode();

    /**
     * Returns the number of executable lines.
     *
     * @return int
     */
    abstract public function getNumExecutableLines();

    /**
     * Returns the number of executed lines.
     *
     * @return int
     */
    abstract public function getNumExecutedLines();

    /**
     * Returns the number of classes.
     *
     * @return int
     */
    abstract public function getNumClasses();

    /**
     * Returns the number of tested classes.
     *
     * @return int
     */
    abstract public function getNumTestedClasses();

    /**
     * Returns the number of traits.
     *
     * @return int
     */
    abstract public function getNumTraits();

    /**
     * Returns the number of tested traits.
     *
     * @return int
     */
    abstract public function getNumTestedTraits();

    /**
     * Returns the number of methods.
     *
     * @return int
     */
    abstract public function getNumMethods();

    /**
     * Returns the number of tested methods.
     *
     * @return int
     */
    abstract public function getNumTestedMethods();

    /**
     * Returns the number of functions.
     *
     * @return int
     */
    abstract public function getNumFunctions();

    /**
     * Returns the number of tested functions.
     *
     * @return int
     */
    abstract public function getNumTestedFunctions();
}
