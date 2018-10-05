<?php

namespace Directus\Authentication\Sso;

use Directus\Exception\RuntimeException;
use Directus\Util\ArrayUtils;

class Social
{
    /**
     * Register providers
     *
     * @var array
     */
    protected $providers = [];

    public function __construct(array $providers = [])
    {
        foreach ($providers as $key => $provider) {
            $this->register($key, $provider);
        }
    }

    /**
     * Register a provider
     *
     * @param string $key
     * @param SocialProviderInterface $provider
     *
     * @return $this
     */
    public function register($key, $provider)
    {
        if (!$key || !is_string($key)) {
            throw new \RuntimeException('Social Login name must be a string');
        }

        if (ArrayUtils::has($this->providers, $key)) {
            throw new \RuntimeException(sprintf('Social Login "%s" already exists', $key));
        }

        if (!($provider instanceof SocialProviderInterface)) {
            throw new RuntimeException(
                sprintf(
                    'Single Sign On provider must be a instance of %s, instead %s was given',
                    SocialProviderInterface::class, gettype($provider)
                )
            );
        }

        $this->providers[$key] = $provider;

        return $this;
    }

    /**
     * Gets a provider by its key
     *
     * @param $key
     *
     * @throws \Exception
     *
     * @return mixed|null
     */
    public function get($key)
    {
        if (!array_key_exists($key, $this->providers)) {
            throw new \Exception(sprintf('auth provider "%s" does not exist.', $key));
        }

        return $this->providers[$key];
    }

    /**
     * Get all registered providers
     *
     * @return SocialProviderInterface[]
     */
    public function getAll()
    {
        return $this->providers;
    }
}
