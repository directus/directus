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

use Symfony\Component\Config\Util\XmlUtils;
use Symfony\Component\Validator\Exception\MappingException;
use Symfony\Component\Validator\Mapping\ClassMetadata;

/**
 * Loads validation metadata from an XML file.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class XmlFileLoader extends FileLoader
{
    /**
     * The XML nodes of the mapping file.
     *
     * @var \SimpleXMLElement[]|null
     */
    protected $classes;

    /**
     * {@inheritdoc}
     */
    public function loadClassMetadata(ClassMetadata $metadata)
    {
        if (null === $this->classes) {
            $this->loadClassesFromXml();
        }

        if (isset($this->classes[$metadata->getClassName()])) {
            $classDescription = $this->classes[$metadata->getClassName()];

            $this->loadClassMetadataFromXml($metadata, $classDescription);

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
            $this->loadClassesFromXml();
        }

        return array_keys($this->classes);
    }

    /**
     * Parses a collection of "constraint" XML nodes.
     *
     * @param \SimpleXMLElement $nodes The XML nodes
     *
     * @return array The Constraint instances
     */
    protected function parseConstraints(\SimpleXMLElement $nodes)
    {
        $constraints = array();

        foreach ($nodes as $node) {
            if (\count($node) > 0) {
                if (\count($node->value) > 0) {
                    $options = $this->parseValues($node->value);
                } elseif (\count($node->constraint) > 0) {
                    $options = $this->parseConstraints($node->constraint);
                } elseif (\count($node->option) > 0) {
                    $options = $this->parseOptions($node->option);
                } else {
                    $options = array();
                }
            } elseif (\strlen((string) $node) > 0) {
                $options = XmlUtils::phpize(trim($node));
            } else {
                $options = null;
            }

            $constraints[] = $this->newConstraint((string) $node['name'], $options);
        }

        return $constraints;
    }

    /**
     * Parses a collection of "value" XML nodes.
     *
     * @param \SimpleXMLElement $nodes The XML nodes
     *
     * @return array The values
     */
    protected function parseValues(\SimpleXMLElement $nodes)
    {
        $values = array();

        foreach ($nodes as $node) {
            if (\count($node) > 0) {
                if (\count($node->value) > 0) {
                    $value = $this->parseValues($node->value);
                } elseif (\count($node->constraint) > 0) {
                    $value = $this->parseConstraints($node->constraint);
                } else {
                    $value = array();
                }
            } else {
                $value = trim($node);
            }

            if (isset($node['key'])) {
                $values[(string) $node['key']] = $value;
            } else {
                $values[] = $value;
            }
        }

        return $values;
    }

    /**
     * Parses a collection of "option" XML nodes.
     *
     * @param \SimpleXMLElement $nodes The XML nodes
     *
     * @return array The options
     */
    protected function parseOptions(\SimpleXMLElement $nodes)
    {
        $options = array();

        foreach ($nodes as $node) {
            if (\count($node) > 0) {
                if (\count($node->value) > 0) {
                    $value = $this->parseValues($node->value);
                } elseif (\count($node->constraint) > 0) {
                    $value = $this->parseConstraints($node->constraint);
                } else {
                    $value = array();
                }
            } else {
                $value = XmlUtils::phpize($node);
                if (\is_string($value)) {
                    $value = trim($value);
                }
            }

            $options[(string) $node['name']] = $value;
        }

        return $options;
    }

    /**
     * Loads the XML class descriptions from the given file.
     *
     * @param string $path The path of the XML file
     *
     * @return \SimpleXMLElement The class descriptions
     *
     * @throws MappingException If the file could not be loaded
     */
    protected function parseFile($path)
    {
        try {
            $dom = XmlUtils::loadFile($path, __DIR__.'/schema/dic/constraint-mapping/constraint-mapping-1.0.xsd');
        } catch (\Exception $e) {
            throw new MappingException($e->getMessage(), $e->getCode(), $e);
        }

        return simplexml_import_dom($dom);
    }

    private function loadClassesFromXml()
    {
        // This method may throw an exception. Do not modify the class'
        // state before it completes
        $xml = $this->parseFile($this->file);

        $this->classes = array();

        foreach ($xml->namespace as $namespace) {
            $this->addNamespaceAlias((string) $namespace['prefix'], trim((string) $namespace));
        }

        foreach ($xml->class as $class) {
            $this->classes[(string) $class['name']] = $class;
        }
    }

    private function loadClassMetadataFromXml(ClassMetadata $metadata, \SimpleXMLElement $classDescription)
    {
        if (\count($classDescription->{'group-sequence-provider'}) > 0) {
            $metadata->setGroupSequenceProvider(true);
        }

        foreach ($classDescription->{'group-sequence'} as $groupSequence) {
            if (\count($groupSequence->value) > 0) {
                $metadata->setGroupSequence($this->parseValues($groupSequence[0]->value));
            }
        }

        foreach ($this->parseConstraints($classDescription->constraint) as $constraint) {
            $metadata->addConstraint($constraint);
        }

        foreach ($classDescription->property as $property) {
            foreach ($this->parseConstraints($property->constraint) as $constraint) {
                $metadata->addPropertyConstraint((string) $property['name'], $constraint);
            }
        }

        foreach ($classDescription->getter as $getter) {
            foreach ($this->parseConstraints($getter->constraint) as $constraint) {
                $metadata->addGetterConstraint((string) $getter['property'], $constraint);
            }
        }
    }
}
