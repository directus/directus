<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Constraints;

use Symfony\Component\Validator\Tests\Fixtures\Countable;

/**
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class CountValidatorCountableTest extends CountValidatorTest
{
    protected function createCollection(array $content)
    {
        return new Countable($content);
    }
}
