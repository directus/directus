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

use SebastianBergmann\CodeCoverage\InvalidArgumentException;

/**
 * Represents a directory in the code coverage information tree.
 */
class Directory extends AbstractNode implements \IteratorAggregate
{
    /**
     * @var AbstractNode[]
     */
    private $children = [];

    /**
     * @var Directory[]
     */
    private $directories = [];

    /**
     * @var File[]
     */
    private $files = [];

    /**
     * @var array
     */
    private $classes;

    /**
     * @var array
     */
    private $traits;

    /**
     * @var array
     */
    private $functions;

    /**
     * @var array
     */
    private $linesOfCode = null;

    /**
     * @var int
     */
    private $numFiles = -1;

    /**
     * @var int
     */
    private $numExecutableLines = -1;

    /**
     * @var int
     */
    private $numExecutedLines = -1;

    /**
     * @var int
     */
    private $numClasses = -1;

    /**
     * @var int
     */
    private $numTestedClasses = -1;

    /**
     * @var int
     */
    private $numTraits = -1;

    /**
     * @var int
     */
    private $numTestedTraits = -1;

    /**
     * @var int
     */
    private $numMethods = -1;

    /**
     * @var int
     */
    private $numTestedMethods = -1;

    /**
     * @var int
     */
    private $numFunctions = -1;

    /**
     * @var int
     */
    private $numTestedFunctions = -1;

    /**
     * Returns the number of files in/under this node.
     *
     * @return int
     */
    public function count()
    {
        if ($this->numFiles == -1) {
            $this->numFiles = 0;

            foreach ($this->children as $child) {
                $this->numFiles += count($child);
            }
        }

        return $this->numFiles;
    }

    /**
     * Returns an iterator for this node.
     *
     * @return \RecursiveIteratorIterator
     */
    public function getIterator()
    {
        return new \RecursiveIteratorIterator(
            new Iterator($this),
            \RecursiveIteratorIterator::SELF_FIRST
        );
    }

    /**
     * Adds a new directory.
     *
     * @param string $name
     *
     * @return Directory
     */
    public function addDirectory($name)
    {
        $directory = new self($name, $this);

        $this->children[]    = $directory;
        $this->directories[] = &$this->children[count($this->children) - 1];

        return $directory;
    }

    /**
     * Adds a new file.
     *
     * @param string $name
     * @param array  $coverageData
     * @param array  $testData
     * @param bool   $cacheTokens
     *
     * @return File
     *
     * @throws InvalidArgumentException
     */
    public function addFile($name, array $coverageData, array $testData, $cacheTokens)
    {
        $file = new File(
            $name,
            $this,
            $coverageData,
            $testData,
            $cacheTokens
        );

        $this->children[] = $file;
        $this->files[]    = &$this->children[count($this->children) - 1];

        $this->numExecutableLines = -1;
        $this->numExecutedLines   = -1;

        return $file;
    }

    /**
     * Returns the directories in this directory.
     *
     * @return array
     */
    public function getDirectories()
    {
        return $this->directories;
    }

    /**
     * Returns the files in this directory.
     *
     * @return array
     */
    public function getFiles()
    {
        return $this->files;
    }

    /**
     * Returns the child nodes of this node.
     *
     * @return array
     */
    public function getChildNodes()
    {
        return $this->children;
    }

    /**
     * Returns the classes of this node.
     *
     * @return array
     */
    public function getClasses()
    {
        if ($this->classes === null) {
            $this->classes = [];

            foreach ($this->children as $child) {
                $this->classes = array_merge(
                    $this->classes,
                    $child->getClasses()
                );
            }
        }

        return $this->classes;
    }

    /**
     * Returns the traits of this node.
     *
     * @return array
     */
    public function getTraits()
    {
        if ($this->traits === null) {
            $this->traits = [];

            foreach ($this->children as $child) {
                $this->traits = array_merge(
                    $this->traits,
                    $child->getTraits()
                );
            }
        }

        return $this->traits;
    }

    /**
     * Returns the functions of this node.
     *
     * @return array
     */
    public function getFunctions()
    {
        if ($this->functions === null) {
            $this->functions = [];

            foreach ($this->children as $child) {
                $this->functions = array_merge(
                    $this->functions,
                    $child->getFunctions()
                );
            }
        }

        return $this->functions;
    }

    /**
     * Returns the LOC/CLOC/NCLOC of this node.
     *
     * @return array
     */
    public function getLinesOfCode()
    {
        if ($this->linesOfCode === null) {
            $this->linesOfCode = ['loc' => 0, 'cloc' => 0, 'ncloc' => 0];

            foreach ($this->children as $child) {
                $linesOfCode = $child->getLinesOfCode();

                $this->linesOfCode['loc']   += $linesOfCode['loc'];
                $this->linesOfCode['cloc']  += $linesOfCode['cloc'];
                $this->linesOfCode['ncloc'] += $linesOfCode['ncloc'];
            }
        }

        return $this->linesOfCode;
    }

    /**
     * Returns the number of executable lines.
     *
     * @return int
     */
    public function getNumExecutableLines()
    {
        if ($this->numExecutableLines == -1) {
            $this->numExecutableLines = 0;

            foreach ($this->children as $child) {
                $this->numExecutableLines += $child->getNumExecutableLines();
            }
        }

        return $this->numExecutableLines;
    }

    /**
     * Returns the number of executed lines.
     *
     * @return int
     */
    public function getNumExecutedLines()
    {
        if ($this->numExecutedLines == -1) {
            $this->numExecutedLines = 0;

            foreach ($this->children as $child) {
                $this->numExecutedLines += $child->getNumExecutedLines();
            }
        }

        return $this->numExecutedLines;
    }

    /**
     * Returns the number of classes.
     *
     * @return int
     */
    public function getNumClasses()
    {
        if ($this->numClasses == -1) {
            $this->numClasses = 0;

            foreach ($this->children as $child) {
                $this->numClasses += $child->getNumClasses();
            }
        }

        return $this->numClasses;
    }

    /**
     * Returns the number of tested classes.
     *
     * @return int
     */
    public function getNumTestedClasses()
    {
        if ($this->numTestedClasses == -1) {
            $this->numTestedClasses = 0;

            foreach ($this->children as $child) {
                $this->numTestedClasses += $child->getNumTestedClasses();
            }
        }

        return $this->numTestedClasses;
    }

    /**
     * Returns the number of traits.
     *
     * @return int
     */
    public function getNumTraits()
    {
        if ($this->numTraits == -1) {
            $this->numTraits = 0;

            foreach ($this->children as $child) {
                $this->numTraits += $child->getNumTraits();
            }
        }

        return $this->numTraits;
    }

    /**
     * Returns the number of tested traits.
     *
     * @return int
     */
    public function getNumTestedTraits()
    {
        if ($this->numTestedTraits == -1) {
            $this->numTestedTraits = 0;

            foreach ($this->children as $child) {
                $this->numTestedTraits += $child->getNumTestedTraits();
            }
        }

        return $this->numTestedTraits;
    }

    /**
     * Returns the number of methods.
     *
     * @return int
     */
    public function getNumMethods()
    {
        if ($this->numMethods == -1) {
            $this->numMethods = 0;

            foreach ($this->children as $child) {
                $this->numMethods += $child->getNumMethods();
            }
        }

        return $this->numMethods;
    }

    /**
     * Returns the number of tested methods.
     *
     * @return int
     */
    public function getNumTestedMethods()
    {
        if ($this->numTestedMethods == -1) {
            $this->numTestedMethods = 0;

            foreach ($this->children as $child) {
                $this->numTestedMethods += $child->getNumTestedMethods();
            }
        }

        return $this->numTestedMethods;
    }

    /**
     * Returns the number of functions.
     *
     * @return int
     */
    public function getNumFunctions()
    {
        if ($this->numFunctions == -1) {
            $this->numFunctions = 0;

            foreach ($this->children as $child) {
                $this->numFunctions += $child->getNumFunctions();
            }
        }

        return $this->numFunctions;
    }

    /**
     * Returns the number of tested functions.
     *
     * @return int
     */
    public function getNumTestedFunctions()
    {
        if ($this->numTestedFunctions == -1) {
            $this->numTestedFunctions = 0;

            foreach ($this->children as $child) {
                $this->numTestedFunctions += $child->getNumTestedFunctions();
            }
        }

        return $this->numTestedFunctions;
    }
}
