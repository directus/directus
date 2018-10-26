<?php

namespace DeepCopy\f004;

use BadMethodCallException;

class UnclonableItem
{
    private function __clone()
    {
        throw new BadMethodCallException('Unsupported call.');
    }
}
