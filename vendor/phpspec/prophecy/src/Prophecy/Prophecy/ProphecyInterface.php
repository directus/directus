<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Prophecy;

/**
 * Core Prophecy interface.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
interface ProphecyInterface
{
    /**
     * Reveals prophecy object (double) .
     *
     * @return object
     */
    public function reveal();
}
