<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Mapping\Loader;

use Symfony\Component\Validator\Mapping\ClassMetadata;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Parser as YamlParser;
use Symfony\Component\Yaml\Yaml;

/**
 * Loads validation metadata from a YAML file.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class YamlFileLoader extends FileLoader
{
    /**
     * An array of YAML class descriptions.
     *
     * @var array
     */
    protected $classes = null;

    /**
     * Caches the used YAML parser.
     *
     * @var YamlParser
     */
    private $yamlParser;

    /**
     * {@inheritdoc}
     */
    public function loadClassMetadata(ClassMetadata $metadata)
    {
        if (null === $this->classes) {
            $this->loadClassesFromYaml();
        }

        if (isset($this->classes[$metadata->getClassName()])) {
            $classDescription = $this->classes[$metadata->getClassName()];

            $this->loadClassMetadataFromYaml($metadata, $classDescription);

            return true;
        }

        return false;
    }

    /**
     * Return the names of the classes mapped in this file.
     *
     * @return string[] The classes names
     */
    public function getMappedClasses()
    {
        if (null === $this->classes) {
            $this->loadClassesFromYaml();
        }

        return array_keys($this->classes);
    }

    /**
     * Parses a collection of YAML nodes.
     *
     * @param array $nodes The YAML nodes
     *
     * @return array An array of values or Constraint instances
     */
    protected function parseNodes(array $nodes)
    {
        $values = array();

        foreach ($nodes as $name => $childNodes) {
            if (is_numeric($name) && \is_array($childNodes) && 1 === \count($childNodes)) {
                $options = current($childNodes);

                if (\is_array($options)) {
                    $options = $this->parseNodes($options);
                }

                $values[] = $this->newConstraint(key($childNodes), $options);
            } else {
                if (\is_array($childNodes)) {
                    $childNodes = $this->parseNodes($childNodes);
                }

                $values[$name] = $childNodes;
            }
        }

        return $values;
    }

    /**
     * Loads the YAML class descriptions from the given file.
     *
     * @param string $path The path of the YAML file
     *
     * @return array The class descriptions
     *
     * @throws \InvalidArgumentException If the file could not be loaded or did
     *                                   not contain a YAML array
     */
    private function parseFile($path)
    {
        $prevErrorHandler = set_error_handler(function ($level, $message, $script, $line) use ($path, &$prevErrorHandler) {
            $message = E_USER_DEPRECATED === $level ? preg_replace('/ on line \d+/', ' in "'.$path.'"$0', $message) : $message;

            return $prevErrorHandler ? $prevErrorHandler($level, $message, $script, $line) : false;
        });

        try {
            $classes = $this->yamlParser->parseFile($path, Yaml::PARSE_CONSTANT);
        } catch (ParseException $e) {
            throw new \InvalidArgumentException(sprintf('The file "%s" does not contain valid YAML.', $path), 0, $e);
        } finally {
            restore_error_handler();
        }

        // empty file
        if (null === $classes) {
            return array();
        }

        // not an array
        if (!\is_array($classes)) {
            throw new \InvalidArgumentException(sprintf('The file "%s" must contain a YAML array.', $this->file));
        }

        return $classes;
    }

    private function loadClassesFromYaml()
    {
        if (null === $this->yamlParser) {
            $this->yamlParser = new YamlParser();
        }

        $this->classes = $this->parseFile($this->file);

        if (isset($this->classes['namespaces'])) {
            foreach ($this->classes['namespaces'] as $alias => $namespace) {
                $this->addNamespaceAlias($alias, $namespace);
            }

            unset($this->classes['namespaces']);
        }
    }

    private function loadClassMetadataFromYaml(ClassMetadata $metadata, array $classDescription)
    {
        if (isset($classDescription['group_sequence_provider'])) {
            $metadata->setGroupSequenceProvider(
                (bool) $classDescription['group_sequence_provider']
            );
        }

        if (isset($classDescription['group_sequence'])) {
            $metadata->setGroupSequence($classDescription['group_sequence']);
        }

        if (isset($classDescription['constraints']) && \is_array($classDescription['constraints'])) {
            foreach ($this->parseNodes($classDescription['constraints']) as $constraint) {
                $metadata->addConstraint($constraint);
            }
        }

        if (isset($classDescription['properties']) && \is_array($classDescription['properties'])) {
            foreach ($classDescription['properties'] as $property => $constraints) {
                if (null !== $constraints) {
                    foreach ($this->parseNodes($constraints) as $constraint) {
                        $metadata->addPropertyConstraint($property, $constraint);
                    }
                }
            }
        }

        if (isset($classDescription['getters']) && \is_array($classDescription['getters'])) {
            foreach ($classDescription['getters'] as $getter => $constraints) {
                if (null !== $constraints) {
                    foreach ($this->parseNodes($constraints) as $constraint) {
                        $metadata->addGetterConstraint($getter, $constraint);
                    }
                }
            }
        }
    }
}
