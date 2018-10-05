<?php

namespace Prophecy\Doubler\ClassPatch;

use Prophecy\Doubler\Generator\Node\ClassNode;
use Prophecy\Exception\Doubler\ClassCreatorException;

class ThrowablePatch implements ClassPatchInterface
{
    /**
     * Checks if patch supports specific class node.
     *
     * @param ClassNode $node
     * @return bool
     */
    public function supports(ClassNode $node)
    {
        return $this->implementsAThrowableInterface($node) && $this->doesNotExtendAThrowableClass($node);
    }

    /**
     * @param ClassNode $node
     * @return bool
     */
    private function implementsAThrowableInterface(ClassNode $node)
    {
        foreach ($node->getInterfaces() as $type) {
            if (is_a($type, 'Throwable', true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param ClassNode $node
     * @return bool
     */
    private function doesNotExtendAThrowableClass(ClassNode $node)
    {
        return !is_a($node->getParentClass(), 'Throwable', true);
    }

    /**
     * Applies patch to the specific class node.
     *
     * @param ClassNode $node
     *
     * @return void
     */
    public function apply(ClassNode $node)
    {
        $this->checkItCanBeDoubled($node);
        $this->setParentClassToException($node);
    }

    private function checkItCanBeDoubled(ClassNode $node)
    {
        $className = $node->getParentClass();
        if ($className !== 'stdClass') {
            throw new ClassCreatorException(
                sprintf(
                    'Cannot double concrete class %s as well as implement Traversable',
                    $className
                ),
                $node
            );
        }
    }

    private function setParentClassToException(ClassNode $node)
    {
        $node->setParentClass('Exception');

        $node->removeMethod('getMessage');
        $node->removeMethod('getCode');
        $node->removeMethod('getFile');
        $node->removeMethod('getLine');
        $node->removeMethod('getTrace');
        $node->removeMethod('getPrevious');
        $node->removeMethod('getNext');
        $node->removeMethod('getTraceAsString');
    }

    /**
     * Returns patch priority, which determines when patch will be applied.
     *
     * @return int Priority number (higher - earlier)
     */
    public function getPriority()
    {
        return 100;
    }
}
