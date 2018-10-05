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
 * Controllable doubles interface.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
interface ProphecySubjectInterface
{
    /**
     * Sets subject prophecy.
     *
     * @param ProphecyInterface $prophecy
     */
    public function setProphecy(ProphecyInterface $prophecy);

    /**
     * Returns subject prophecy.
     *
     * @return ProphecyInterface
     */
    public function getProphecy();
}
