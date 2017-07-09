<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Hash\Hasher;

/**
 * Hash using password_hash
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class CoreHasher implements HasherInterface
{
    /**
     * @inheritdoc
     */
    public function getName()
    {
        return 'core';
    }

    /**
     * @inheritdoc
     */
    public function hash($string, array $options = [])
    {
        return password_hash($string, PASSWORD_DEFAULT, $options);
    }
}
