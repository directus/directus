<?php
/*
 * This file is part of code-unit-reverse-lookup.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeUnitReverseLookup;

use PHPUnit\Framework\TestCase;

/**
 * @covers SebastianBergmann\CodeUnitReverseLookup\Wizard
 */
class WizardTest extends TestCase
{
    /**
     * @var Wizard
     */
    private $wizard;

    protected function setUp()
    {
        $this->wizard = new Wizard;
    }

    public function testMethodCanBeLookedUp()
    {
        $this->assertEquals(
            __METHOD__,
            $this->wizard->lookup(__FILE__, __LINE__)
        );
    }

    public function testReturnsFilenameAndLineNumberAsStringWhenNotInCodeUnit()
    {
        $this->assertEquals(
            'file.php:1',
            $this->wizard->lookup('file.php', 1)
        );
    }
}
