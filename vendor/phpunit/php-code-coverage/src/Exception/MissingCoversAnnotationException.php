<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage;

/**
 * Exception that is raised when @covers must be used but is not.
 */
class MissingCoversAnnotationException extends RuntimeException
{
}
