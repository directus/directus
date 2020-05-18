<?php

namespace Symfony\Component\Validator\Tests\Fixtures;

/**
 * This class has two paths to PropertyGetterInterface:
 *   PropertyGetterInterface <- AbstractPropertyGetter <- PropertyGetter
 *   PropertyGetterInterface <- ChildGetterInterface <- PropertyGetter
 */
class PropertyGetter extends AbstractPropertyGetter implements ChildGetterInterface
{
}
