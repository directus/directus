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
 * Extension to PHPUnit_Framework_AssertionFailedError to mark a test as risky
 * when it does not have a @covers annotation but is expected to have one.
 */
class PHPUnit_Framework_MissingCoversAnnotationException extends PHPUnit_Framework_RiskyTestError
{
}
