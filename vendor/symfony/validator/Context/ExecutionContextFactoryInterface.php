<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Context;

use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Creates instances of {@link ExecutionContextInterface}.
 *
 * You can use a custom factory if you want to customize the execution context
 * that is passed through the validation run.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
interface ExecutionContextFactoryInterface
{
    /**
     * Creates a new execution context.
     *
     * @param ValidatorInterface $validator The validator
     * @param mixed              $root      The root value of the validated
     *                                      object graph
     *
     * @return ExecutionContextInterface The new execution context
     */
    public function createContext(ValidatorInterface $validator, $root);
}
