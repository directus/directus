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
 * Invocation matcher which checks if a method has been invoked zero or more
 * times. This matcher will always match.
 *
 * @since Class available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_Matcher_AnyInvokedCount extends PHPUnit_Framework_MockObject_Matcher_InvokedRecorder
{
    /**
     * @return string
     */
    public function toString()
    {
        return 'invoked zero or more times';
    }

    /**
     */
    public function verify()
    {
    }
}
