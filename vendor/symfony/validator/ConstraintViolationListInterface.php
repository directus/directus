<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator;

/**
 * A list of constraint violations.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
interface ConstraintViolationListInterface extends \Traversable, \Countable, \ArrayAccess
{
    /**
     * Adds a constraint violation to this list.
     */
    public function add(ConstraintViolationInterface $violation);

    /**
     * Merges an existing violation list into this list.
     */
    public function addAll(self $otherList);

    /**
     * Returns the violation at a given offset.
     *
     * @param int $offset The offset of the violation
     *
     * @return ConstraintViolationInterface The violation
     *
     * @throws \OutOfBoundsException if the offset does not exist
     */
    public function get($offset);

    /**
     * Returns whether the given offset exists.
     *
     * @param int $offset The violation offset
     *
     * @return bool Whether the offset exists
     */
    public function has($offset);

    /**
     * Sets a violation at a given offset.
     *
     * @param int                          $offset    The violation offset
     * @param ConstraintViolationInterface $violation The violation
     */
    public function set($offset, ConstraintViolationInterface $violation);

    /**
     * Removes a violation at a given offset.
     *
     * @param int $offset The offset to remove
     */
    public function remove($offset);
}
