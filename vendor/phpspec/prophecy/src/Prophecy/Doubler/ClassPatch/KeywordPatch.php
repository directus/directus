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

/**
 * Remove method functionality from the double which will clash with php keywords.
 *
 * @author Milan Magudia <milan@magudia.com>
 */
class KeywordPatch implements ClassPatchInterface
{
    /**
     * Support any class
     *
     * @param ClassNode $node
     *
     * @return boolean
     */
    public function supports(ClassNode $node)
    {
        return true;
    }

    /**
     * Remove methods that clash with php keywords
     *
     * @param ClassNode $node
     */
    public function apply(ClassNode $node)
    {
        $methodNames = array_keys($node->getMethods());
        $methodsToRemove = array_intersect($methodNames, $this->getKeywords());
        foreach ($methodsToRemove as $methodName) {
            $node->removeMethod($methodName);
        }
    }

    /**
     * Returns patch priority, which determines when patch will be applied.
     *
     * @return int Priority number (higher - earlier)
     */
    public function getPriority()
    {
        return 49;
    }

    /**
     * Returns array of php keywords.
     *
     * @return array
     */
    private function getKeywords()
    {
        if (\PHP_VERSION_ID >= 70000) {
            return array('__halt_compiler');
        }

        return array(
            '__halt_compiler',
            'abstract',
            'and',
            'array',
            'as',
            'break',
            'callable',
            'case',
            'catch',
            'class',
            'clone',
            'const',
            'continue',
            'declare',
            'default',
            'die',
            'do',
            'echo',
            'else',
            'elseif',
            'empty',
            'enddeclare',
            'endfor',
            'endforeach',
            'endif',
            'endswitch',
            'endwhile',
            'eval',
            'exit',
            'extends',
            'final',
            'finally',
            'for',
            'foreach',
            'function',
            'global',
            'goto',
            'if',
            'implements',
            'include',
            'include_once',
            'instanceof',
            'insteadof',
            'interface',
            'isset',
            'list',
            'namespace',
            'new',
            'or',
            'print',
            'private',
            'protected',
            'public',
            'require',
            'require_once',
            'return',
            'static',
            'switch',
            'throw',
            'trait',
            'try',
            'unset',
            'use',
            'var',
            'while',
            'xor',
            'yield',
        );
    }
}
