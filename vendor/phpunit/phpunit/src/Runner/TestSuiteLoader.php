<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * An interface to define how a test suite should be loaded.
 */
interface PHPUnit_Runner_TestSuiteLoader
{
    /**
     * @param string $suiteClassName
     * @param string $suiteClassFile
     *
     * @return ReflectionClass
     */
    public function load($suiteClassName, $suiteClassFile = '');

    /**
     * @param ReflectionClass $aClass
     *
     * @return ReflectionClass
     */
    public function reload(ReflectionClass $aClass);
}
