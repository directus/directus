<?php
/*
 * This file is part of the PHPUnit_MockObject package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Builder interface for unique identifiers.
 *
 * Defines the interface for recording unique identifiers. The identifiers
 * can be used to define the invocation order of expectations. The expectation
 * is recorded using id() and then defined in order using
 * PHPUnit_Framework_MockObject_Builder_Match::after().
 *
 * @since Interface available since Release 1.0.0
 */
interface PHPUnit_Framework_MockObject_Builder_Identity
{
    /**
     * Sets the identification of the expectation to $id.
     *
     * @note The identifier is unique per mock object.
     *
     * @param string $id Unique identification of expectation.
     */
    public function id($id);
}
