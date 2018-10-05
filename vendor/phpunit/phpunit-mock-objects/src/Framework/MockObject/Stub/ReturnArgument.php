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
 * Stubs a method by returning an argument that was passed to the mocked method.
 *
 * @since Class available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_Stub_ReturnArgument extends PHPUnit_Framework_MockObject_Stub_Return
{
    protected $argumentIndex;

    public function __construct($argumentIndex)
    {
        $this->argumentIndex = $argumentIndex;
    }

    public function invoke(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        if (isset($invocation->parameters[$this->argumentIndex])) {
            return $invocation->parameters[$this->argumentIndex];
        } else {
            return;
        }
    }

    public function toString()
    {
        return sprintf('return argument #%d', $this->argumentIndex);
    }
}
