<?php

namespace Directus\Hash;

use Directus\Hash\Exception\HasherNotFoundException;
use Directus\Hash\Hasher\BCryptHasher;
use Directus\Hash\Hasher\CoreHasher;
use Directus\Hash\Hasher\HasherInterface;
use Directus\Hash\Hasher\MD5Hasher;
use Directus\Hash\Hasher\Sha1Hasher;
use Directus\Hash\Hasher\Sha224Hasher;
use Directus\Hash\Hasher\Sha256Hasher;
use Directus\Hash\Hasher\Sha384Hasher;
use Directus\Hash\Hasher\Sha512Hasher;
use Directus\Util\ArrayUtils;

class HashManager
{
    /**
     * @var HasherInterface[]
     */
    protected $hashers = [];

    public function __construct(array $hashers = [])
    {
        $this->registerDefaultHashers();

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
     * Verifies whether a given string match a hash in the given algorithm
     *
     * @param string $string
     * @param string $hash
     * @param array $options
     *
     * @return string
     */
    public function verify($string, $hash, array $options = [])
    {
        $hasher = ArrayUtils::pull($options, 'hasher', 'core');

        return $this->get($hasher)->verify($string, $hash, $options);
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

    public function registerDefaultHashers()
    {
        $hashers = [
            CoreHasher::class,
            BCryptHasher::class,
            MD5Hasher::class,
            Sha1Hasher::class,
            Sha224Hasher::class,
            Sha256Hasher::class,
            Sha384Hasher::class,
            Sha512Hasher::class
        ];

        foreach ($hashers as $hasher) {
            $this->register(new $hasher());
        }
    }

    /**
     * @param $name
     *
     * @return HasherInterface
     *
     * @throws HasherNotFoundException
     */
    public function get($name)
    {
        $hasher = ArrayUtils::get($this->hashers, $name);

        if (!$hasher) {
            throw new HasherNotFoundException($name);
        }

        return $hasher;
    }
}
