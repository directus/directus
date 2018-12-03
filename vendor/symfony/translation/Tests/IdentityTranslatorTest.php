<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests;

use Symfony\Component\Translation\IdentityTranslator;
use Symfony\Contracts\Tests\Translation\TranslatorTest;

class IdentityTranslatorTest extends TranslatorTest
{
    public function getTranslator()
    {
        return new IdentityTranslator();
    }
}
