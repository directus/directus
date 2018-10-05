<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Definition;

/**
 * This class is the entry point for config normalization/merging/finalization.
 *
 * @author Johannes M. Schmitt <schmittjoh@gmail.com>
 *
 * @final since version 4.1
 */
class Processor
{
    /**
     * Processes an array of configurations.
     *
     * @param NodeInterface $configTree The node tree describing the configuration
     * @param array         $configs    An array of configuration items to process
     *
     * @return array The processed configuration
     */
    public function process(NodeInterface $configTree, array $configs)
    {
        $currentConfig = array();
        foreach ($configs as $config) {
            $config = $configTree->normalize($config);
            $currentConfig = $configTree->merge($currentConfig, $config);
        }

        return $configTree->finalize($currentConfig);
    }

    /**
     * Processes an array of configurations.
     *
     * @param ConfigurationInterface $configuration The configuration class
     * @param array                  $configs       An array of configuration items to process
     *
     * @return array The processed configuration
     */
    public function processConfiguration(ConfigurationInterface $configuration, array $configs)
    {
        return $this->process($configuration->getConfigTreeBuilder()->buildTree(), $configs);
    }

    /**
     * Normalizes a configuration entry.
     *
     * This method returns a normalize configuration array for a given key
     * to remove the differences due to the original format (YAML and XML mainly).
     *
     * Here is an example.
     *
     * The configuration in XML:
     *
     * <twig:extension>twig.extension.foo</twig:extension>
     * <twig:extension>twig.extension.bar</twig:extension>
     *
     * And the same configuration in YAML:
     *
     * extensions: ['twig.extension.foo', 'twig.extension.bar']
     *
     * @param array  $config A config array
     * @param string $key    The key to normalize
     * @param string $plural The plural form of the key if it is irregular
     *
     * @return array
     */
    public static function normalizeConfig($config, $key, $plural = null)
    {
        if (null === $plural) {
            $plural = $key.'s';
        }

        if (isset($config[$plural])) {
            return $config[$plural];
        }

        if (isset($config[$key])) {
            if (\is_string($config[$key]) || !\is_int(key($config[$key]))) {
                // only one
                return  array($config[$key]);
            }

            return  $config[$key];
        }

        return array();
    }
}
