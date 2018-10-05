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
 * Interface for classes which can be invoked.
 *
 * The invocation will be taken from a mock object and passed to an object
 * of this class.
 *
 * @since Interface available since Release 1.0.0
 */
interface PHPUnit_Framework_MockObject_Invokable extends PHPUnit_Framework_MockObject_Verifiable
{
    /**
     * Invokes the invocation object $invocation so that it can be checked for
     * expectations or matched against stubs.
     *
     * @param PHPUnit_Framework_MockObject_Invocation $invocation The invocation object passed from mock object
     *
     * @return object
     */
    public function invoke(PHPUnit_Framework_MockObject_Invocation $invocation);

    /**
     * Checks if the invocation matches.
     *
     * @param PHPUnit_Framework_MockObject_Invocation $invocation The invocation object passed from mock object
     *
     * @return bool
     */
    public function matches(PHPUnit_Framework_MockObject_Invocation $invocation);
}
