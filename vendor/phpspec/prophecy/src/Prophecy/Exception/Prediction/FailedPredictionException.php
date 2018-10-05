<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Exception\Prediction;

use RuntimeException;

/**
 * Basic failed prediction exception.
 * Use it for custom prediction failures.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class FailedPredictionException extends RuntimeException implements PredictionException
{
}
