<?php

namespace League\Flysystem;

/**
 * @internal
 */
trait ConfigAwareTrait
{
    /**
     * @var Config
     */
    protected $config;

    /**
     * Set the config.
     *
     * @param Config|array|null $config
     */
    protected function setConfig($config)
    {
        $this->config = $config ? Util::ensureConfig($config) : null;
    }

    /**
     * Get the Config.
     *
     * @return Config config object
     */
    public function getConfig()
    {
        if ($this->config === null) {
            return $this->config = new Config;
        }

        return $this->config;
    }

    /**
     * Convert a config array to a Config object with the correct fallback.
     *
     * @param array $config
     *
     * @return Config
     */
    protected function prepareConfig(array $config)
    {
        $config = new Config($config);
        $config->setFallback($this->getConfig());

        return $config;
    }
}
