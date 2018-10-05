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
 * Extension to PHPUnit_Framework_AssertionFailedError to mark the special
 * case of a test that does not execute the code it wants to cover.
 */
class PHPUnit_Framework_CoveredCodeNotExecutedException extends PHPUnit_Framework_RiskyTestError
{
}
