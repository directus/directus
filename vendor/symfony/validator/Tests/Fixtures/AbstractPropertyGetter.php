<?php

namespace Symfony\Component\Validator\Tests\Fixtures;

abstract class AbstractPropertyGetter implements PropertyGetterInterface
{
    private $property;

    public function getProperty()
    {
        return $this->property;
    }
}
