<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Doubler\ClassPatch;

use Prophecy\Doubler\Generator\Node\ClassNode;
use Prophecy\Doubler\Generator\Node\MethodNode;

/**
 * SplFileInfo patch.
 * Makes SplFileInfo and derivative classes usable with Prophecy.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class SplFileInfoPatch implements ClassPatchInterface
{
    /**
     * Supports everything that extends SplFileInfo.
     *
     * @param ClassNode $node
     *
     * @return bool
     */
    public function supports(ClassNode $node)
    {
        if (null === $node->getParentClass()) {
            return false;
        }
        return 'SplFileInfo' === $node->getParentClass()
            || is_subclass_of($node->getParentClass(), 'SplFileInfo')
        ;
    }

    /**
     * Updated constructor code to call parent one with dummy file argument.
     *
     * @param ClassNode $node
     */
    public function apply(ClassNode $node)
    {
        if ($node->hasMethod('__construct')) {
            $constructor = $node->getMethod('__construct');
        } else {
            $constructor = new MethodNode('__construct');
            $node->addMethod($constructor);
        }

        if ($this->nodeIsDirectoryIterator($node)) {
            $constructor->setCode('return parent::__construct("' . __DIR__ . '");');

            return;
        }

        if ($this->nodeIsSplFileObject($node)) {
            $filePath = str_replace('\\','\\\\',__FILE__);
            $constructor->setCode('return parent::__construct("' . $filePath .'");');

            return;
        }

        if ($this->nodeIsSymfonySplFileInfo($node)) {
            $filePath = str_replace('\\','\\\\',__FILE__);
            $constructor->setCode('return parent::__construct("' . $filePath .'", "", "");');

            return;
        }

        $constructor->useParentCode();
    }

    /**
     * Returns patch priority, which determines when patch will be applied.
     *
     * @return int Priority number (higher - earlier)
     */
    public function getPriority()
    {
        return 50;
    }

    /**
     * @param ClassNode $node
     * @return boolean
     */
    private function nodeIsDirectoryIterator(ClassNode $node)
    {
        $parent = $node->getParentClass();

        return 'DirectoryIterator' === $parent
            || is_subclass_of($parent, 'DirectoryIterator');
    }

    /**
     * @param ClassNode $node
     * @return boolean
     */
    private function nodeIsSplFileObject(ClassNode $node)
    {
        $parent = $node->getParentClass();

        return 'SplFileObject' === $parent
            || is_subclass_of($parent, 'SplFileObject');
    }

    /**
     * @param ClassNode $node
     * @return boolean
     */
    private function nodeIsSymfonySplFileInfo(ClassNode $node)
    {
        $parent = $node->getParentClass();

        return 'Symfony\\Component\\Finder\\SplFileInfo' === $parent;
    }
}
