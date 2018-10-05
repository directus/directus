<?php
/*
 * This file is part of the Environment package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Environment;

use PHPUnit_Framework_TestCase;

class RuntimeTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var \SebastianBergmann\Environment\Runtime
     */
    private $env;

    protected function setUp()
    {
        $this->env = new Runtime;
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::canCollectCodeCoverage
     *
     * @uses   \SebastianBergmann\Environment\Runtime::hasXdebug
     * @uses   \SebastianBergmann\Environment\Runtime::isHHVM
     * @uses   \SebastianBergmann\Environment\Runtime::isPHP
     */
    public function testAbilityToCollectCodeCoverageCanBeAssessed()
    {
        $this->assertInternalType('boolean', $this->env->canCollectCodeCoverage());
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::getBinary
     *
     * @uses   \SebastianBergmann\Environment\Runtime::isHHVM
     */
    public function testBinaryCanBeRetrieved()
    {
        $this->assertInternalType('string', $this->env->getBinary());
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::isHHVM
     */
    public function testCanBeDetected()
    {
        $this->assertInternalType('boolean', $this->env->isHHVM());
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::isPHP
     *
     * @uses   \SebastianBergmann\Environment\Runtime::isHHVM
     */
    public function testCanBeDetected2()
    {
        $this->assertInternalType('boolean', $this->env->isPHP());
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::hasXdebug
     *
     * @uses   \SebastianBergmann\Environment\Runtime::isHHVM
     * @uses   \SebastianBergmann\Environment\Runtime::isPHP
     */
    public function testXdebugCanBeDetected()
    {
        $this->assertInternalType('boolean', $this->env->hasXdebug());
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::getNameWithVersion
     *
     * @uses   \SebastianBergmann\Environment\Runtime::getName
     * @uses   \SebastianBergmann\Environment\Runtime::getVersion
     * @uses   \SebastianBergmann\Environment\Runtime::isHHVM
     * @uses   \SebastianBergmann\Environment\Runtime::isPHP
     */
    public function testNameAndVersionCanBeRetrieved()
    {
        $this->assertInternalType('string', $this->env->getNameWithVersion());
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::getName
     *
     * @uses   \SebastianBergmann\Environment\Runtime::isHHVM
     */
    public function testNameCanBeRetrieved()
    {
        $this->assertInternalType('string', $this->env->getName());
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::getVersion
     *
     * @uses   \SebastianBergmann\Environment\Runtime::isHHVM
     */
    public function testVersionCanBeRetrieved()
    {
        $this->assertInternalType('string', $this->env->getVersion());
    }

    /**
     * @covers \SebastianBergmann\Environment\Runtime::getVendorUrl
     *
     * @uses   \SebastianBergmann\Environment\Runtime::isHHVM
     */
    public function testVendorUrlCanBeRetrieved()
    {
        $this->assertInternalType('string', $this->env->getVendorUrl());
    }
}
