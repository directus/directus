<?php
/*
 * This file is part of the PHPUnit_MockObject package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use SebastianBergmann\Exporter\Exporter;

/**
 * Stubs a method by returning a user-defined stack of values.
 *
 * @since Class available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_Stub_ConsecutiveCalls implements PHPUnit_Framework_MockObject_Stub
{
    protected $stack;
    protected $value;

    public function __construct($stack)
    {
        $this->stack = $stack;
    }

    public function invoke(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        $this->value = array_shift($this->stack);

        if ($this->value instanceof PHPUnit_Framework_MockObject_Stub) {
            $this->value = $this->value->invoke($invocation);
        }

        return $this->value;
    }

    public function toString()
    {
        $exporter = new Exporter;

        return sprintf(
            'return user-specified value %s',
            $exporter->export($this->value)
        );
    }
}
