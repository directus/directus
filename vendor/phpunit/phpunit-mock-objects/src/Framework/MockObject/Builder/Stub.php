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
 * Builder interface for stubs which are actions replacing an invocation.
 *
 * @since Interface available since Release 1.0.0
 */
interface PHPUnit_Framework_MockObject_Builder_Stub extends PHPUnit_Framework_MockObject_Builder_Identity
{
    /**
     * Stubs the matching method with the stub object $stub. Any invocations of
     * the matched method will now be handled by the stub instead.
     *
     * @param PHPUnit_Framework_MockObject_Stub $stub
     *
     * @return PHPUnit_Framework_MockObject_Builder_Identity
     */
    public function will(PHPUnit_Framework_MockObject_Stub $stub);
}
