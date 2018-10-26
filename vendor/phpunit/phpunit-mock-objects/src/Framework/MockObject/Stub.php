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
 * An object that stubs the process of a normal method for a mock object.
 *
 * The stub object will replace the code for the stubbed method and return a
 * specific value instead of the original value.
 *
 * @since Interface available since Release 1.0.0
 */
interface PHPUnit_Framework_MockObject_Stub extends PHPUnit_Framework_SelfDescribing
{
    /**
     * Fakes the processing of the invocation $invocation by returning a
     * specific value.
     *
     * @param PHPUnit_Framework_MockObject_Invocation $invocation The invocation which was mocked and matched by the current method and argument matchers
     *
     * @return mixed
     */
    public function invoke(PHPUnit_Framework_MockObject_Invocation $invocation);
}
