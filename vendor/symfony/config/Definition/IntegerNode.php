<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Definition;

use Symfony\Component\Config\Definition\Exception\InvalidTypeException;

/**
 * This node represents an integer value in the config tree.
 *
 * @author Jeanmonod David <david.jeanmonod@gmail.com>
 */
class IntegerNode extends NumericNode
{
    /**
     * {@inheritdoc}
     */
    protected function validateType($value)
    {
        if (!\is_int($value)) {
            $ex = new InvalidTypeException(sprintf('Invalid type for path "%s". Expected int, but got %s.', $this->getPath(), \gettype($value)));
            if ($hint = $this->getInfo()) {
                $ex->addHint($hint);
            }
            $ex->setPath($this->getPath());

            throw $ex;
        }
    }

    /**
     * {@inheritdoc}
     */
    protected function getValidPlaceholderTypes(): array
    {
        return array('int');
    }
}
