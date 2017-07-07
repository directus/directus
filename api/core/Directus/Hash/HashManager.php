<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Hash;
use Directus\Hash\Exception\MissingHasherException;
use Directus\Hash\Hasher\HasherInterface;
use Directus\Util\ArrayUtils;

/**
 * Hash Manager
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class HashManager
{
    /**
     * @var HasherInterface[]
     */
    protected $hashers = [];

    public function __construct(array $hashers = [])
    {
        foreach ($hashers as $hasher) {
            $this->register($hasher);
        }
    }

    /**
     * Hash a given string into the given algorithm
     *
     * @param string $string
     * @param array $options
     *
     * @return string
     */
    public function hash($string, array $options = [])
    {
        $hasher = ArrayUtils::pull($options, 'hasher', 'core');

        return $this->get($hasher)->hash($string, $options);
    }

    /**
     * Register a hasher
     *
     * @param HasherInterface $hasher
     */
    public function register(HasherInterface $hasher)
    {
        $this->hashers[$hasher->getName()] = $hasher;
    }

    /**
     * @param $name
     *
     * @return HasherInterface
     *
     * @throws MissingHasherException
     */
    public function get($name)
    {
        $hasher = ArrayUtils::get($this->hashers, $name);

        if (!$hasher) {
            throw new MissingHasherException($name);
        }

        return $hasher;
    }
}
