<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Descriptor;

use Symfony\Component\Console\Application;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputDefinition;
use Symfony\Component\Console\Input\InputOption;

/**
 * XML descriptor.
 *
 * @author Jean-François Simon <contact@jfsimon.fr>
 *
 * @internal
 */
class XmlDescriptor extends Descriptor
{
    /**
     * @return \DOMDocument
     */
    public function getInputDefinitionDocument(InputDefinition $definition)
    {
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $dom->appendChild($definitionXML = $dom->createElement('definition'));

        $definitionXML->appendChild($argumentsXML = $dom->createElement('arguments'));
        foreach ($definition->getArguments() as $argument) {
            $this->appendDocument($argumentsXML, $this->getInputArgumentDocument($argument));
        }

        $definitionXML->appendChild($optionsXML = $dom->createElement('options'));
        foreach ($definition->getOptions() as $option) {
            $this->appendDocument($optionsXML, $this->getInputOptionDocument($option));
        }

        return $dom;
    }

    /**
     * @return \DOMDocument
     */
    public function getCommandDocument(Command $command)
    {
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $dom->appendChild($commandXML = $dom->createElement('command'));

        $command->getSynopsis();
        $command->mergeApplicationDefinition(false);

        $commandXML->setAttribute('id', $command->getName());
        $commandXML->setAttribute('name', $command->getName());
        $commandXML->setAttribute('hidden', $command->isHidden() ? 1 : 0);

        $commandXML->appendChild($usagesXML = $dom->createElement('usages'));

        foreach (array_merge([$command->getSynopsis()], $command->getAliases(), $command->getUsages()) as $usage) {
            $usagesXML->appendChild($dom->createElement('usage', $usage));
        }

        $commandXML->appendChild($descriptionXML = $dom->createElement('description'));
        $descriptionXML->appendChild($dom->createTextNode(str_replace("\n", "\n ", $command->getDescription())));

        $commandXML->appendChild($helpXML = $dom->createElement('help'));
        $helpXML->appendChild($dom->createTextNode(str_replace("\n", "\n ", $command->getProcessedHelp())));

        $definitionXML = $this->getInputDefinitionDocument($command->getNativeDefinition());
        $this->appendDocument($commandXML, $definitionXML->getElementsByTagName('definition')->item(0));

        return $dom;
    }

    /**
     * @param string|null $namespace
     *
     * @return \DOMDocument
     */
    public function getApplicationDocument(Application $application, $namespace = null)
    {
        $dom = new \DOMDocument('1.0', 'UTF-8');
        $dom->appendChild($rootXml = $dom->createElement('symfony'));

        if ('UNKNOWN' !== $application->getName()) {
            $rootXml->setAttribute('name', $application->getName());
            if ('UNKNOWN' !== $application->getVersion()) {
                $rootXml->setAttribute('version', $application->getVersion());
            }
        }

        $rootXml->appendChild($commandsXML = $dom->createElement('commands'));

        $description = new ApplicationDescription($application, $namespace, true);

        if ($namespace) {
            $commandsXML->setAttribute('namespace', $namespace);
        }

        foreach ($description->getCommands() as $command) {
            $this->appendDocument($commandsXML, $this->getCommandDocument($command));
        }

        if (!$namespace) {
            $rootXml->appendChild($namespacesXML = $dom->createElement('namespaces'));

            foreach ($description->getNamespaces() as $namespaceDescription) {
                $namespacesXML->appendChild($namespaceArrayXML = $dom->createElement('namespace'));
                $namespaceArrayXML->setAttribute('id', $namespaceDescription['id']);

                foreach ($namespaceDescription['commands'] as $name) {
                    $namespaceArrayXML->appendChild($commandXML = $dom->createElement('command'));
                    $commandXML->appendChild($dom->createTextNode($name));
                }
            }
        }

        return $dom;
    }

    /**
     * {@inheritdoc}
     */
    protected function describeInputArgument(InputArgument $argument, array $options = [])
    {
        $this->writeDocument($this->getInputArgumentDocument($argument));
    }

    /**
     * {@inheritdoc}
     */
    protected function describeInputOption(InputOption $option, array $options = [])
    {
        $this->writeDocument($this->getInputOptionDocument($option));
    }

    /**
     * {@inheritdoc}
     */
    protected function describeInputDefinition(InputDefinition $definition, array $options = [])
    {
        $this->writeDocument($this->getInputDefinitionDocument($definition));
    }

    /**
     * {@inheritdoc}
     */
    protected function describeCommand(Command $command, array $options = [])
    {
        $this->writeDocument($this->getCommandDocument($command));
    }

    /**
     * {@inheritdoc}
     */
    protected function describeApplication(Application $application, array $options = [])
    {
        $this->writeDocument($this->getApplicationDocument($application, isset($options['namespace']) ? $options['namespace'] : null));
    }

    /**
     * Appends document children to parent node.
     */
    private function appendDocument(\DOMNode $parentNode, \DOMNode $importedParent)
    {
        foreach ($importedParent->childNodes as $childNode) {
            $parentNode->appendChild($parentNode->ownerDocument->importNode($childNode, true));
        }
    }

    /**
     * Writes DOM document.
     */
    private function writeDocument(\DOMDocument $dom)
    {
        $dom->formatOutput = true;
        $this->write($dom->saveXML());
    }

    private function getInputArgumentDocument(InputArgument $argument): \DOMDocument
    {
        $dom = new \DOMDocument('1.0', 'UTF-8');

        $dom->appendChild($objectXML = $dom->createElement('argument'));
        $objectXML->setAttribute('name', $argument->getName());
        $objectXML->setAttribute('is_required', $argument->isRequired() ? 1 : 0);
        $objectXML->setAttribute('is_array', $argument->isArray() ? 1 : 0);
        $objectXML->appendChild($descriptionXML = $dom->createElement('description'));
        $descriptionXML->appendChild($dom->createTextNode($argument->getDescription()));

        $objectXML->appendChild($defaultsXML = $dom->createElement('defaults'));
        $defaults = \is_array($argument->getDefault()) ? $argument->getDefault() : (\is_bool($argument->getDefault()) ? [var_export($argument->getDefault(), true)] : ($argument->getDefault() ? [$argument->getDefault()] : []));
        foreach ($defaults as $default) {
            $defaultsXML->appendChild($defaultXML = $dom->createElement('default'));
            $defaultXML->appendChild($dom->createTextNode($default));
        }

        return $dom;
    }

    private function getInputOptionDocument(InputOption $option): \DOMDocument
    {
        $dom = new \DOMDocument('1.0', 'UTF-8');

        $dom->appendChild($objectXML = $dom->createElement('option'));
        $objectXML->setAttribute('name', '--'.$option->getName());
        $pos = strpos($option->getShortcut(), '|');
        if (false !== $pos) {
            $objectXML->setAttribute('shortcut', '-'.substr($option->getShortcut(), 0, $pos));
            $objectXML->setAttribute('shortcuts', '-'.str_replace('|', '|-', $option->getShortcut()));
        } else {
            $objectXML->setAttribute('shortcut', $option->getShortcut() ? '-'.$option->getShortcut() : '');
        }
        $objectXML->setAttribute('accept_value', $option->acceptValue() ? 1 : 0);
        $objectXML->setAttribute('is_value_required', $option->isValueRequired() ? 1 : 0);
        $objectXML->setAttribute('is_multiple', $option->isArray() ? 1 : 0);
        $objectXML->appendChild($descriptionXML = $dom->createElement('description'));
        $descriptionXML->appendChild($dom->createTextNode($option->getDescription()));

        if ($option->acceptValue()) {
            $defaults = \is_array($option->getDefault()) ? $option->getDefault() : (\is_bool($option->getDefault()) ? [var_export($option->getDefault(), true)] : ($option->getDefault() ? [$option->getDefault()] : []));
            $objectXML->appendChild($defaultsXML = $dom->createElement('defaults'));

            if (!empty($defaults)) {
                foreach ($defaults as $default) {
                    $defaultsXML->appendChild($defaultXML = $dom->createElement('default'));
                    $defaultXML->appendChild($dom->createTextNode($default));
                }
            }
        }

        return $dom;
    }
}
