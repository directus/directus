<?php
/*
 * This file is part of the PHPUnit_MockObject package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Interface for builders which can register builders with a given identification.
 *
 * This interface relates to PHPUnit_Framework_MockObject_Builder_Identity.
 *
 * @since Interface available since Release 1.0.0
 */
interface PHPUnit_Framework_MockObject_Builder_Namespace
{
    /**
     * Looks up the match builder with identification $id and returns it.
     *
     * @param string $id The identification of the match builder
     *
     * @return PHPUnit_Framework_MockObject_Builder_Match
     */
    public function lookupId($id);

    /**
     * Registers the match builder $builder with the identification $id. The
     * builder can later be looked up using lookupId() to figure out if it
     * has been invoked.
     *
     * @param string                                     $id      The identification of the match builder
     * @param PHPUnit_Framework_MockObject_Builder_Match $builder The builder which is being registered
     */
    public function registerId($id, PHPUnit_Framework_MockObject_Builder_Match $builder);
}
