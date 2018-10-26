<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Loader;

use Symfony\Component\Config\Resource\FileResource;
use Symfony\Component\Config\Util\XmlUtils;
use Symfony\Component\Translation\Exception\InvalidArgumentException;
use Symfony\Component\Translation\Exception\InvalidResourceException;
use Symfony\Component\Translation\Exception\NotFoundResourceException;
use Symfony\Component\Translation\MessageCatalogue;

/**
 * XliffFileLoader loads translations from XLIFF files.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class XliffFileLoader implements LoaderInterface
{
    /**
     * {@inheritdoc}
     */
    public function load($resource, $locale, $domain = 'messages')
    {
        if (!stream_is_local($resource)) {
            throw new InvalidResourceException(sprintf('This is not a local file "%s".', $resource));
        }

        if (!file_exists($resource)) {
            throw new NotFoundResourceException(sprintf('File "%s" not found.', $resource));
        }

        $catalogue = new MessageCatalogue($locale);
        $this->extract($resource, $catalogue, $domain);

        if (class_exists('Symfony\Component\Config\Resource\FileResource')) {
            $catalogue->addResource(new FileResource($resource));
        }

        return $catalogue;
    }

    private function extract($resource, MessageCatalogue $catalogue, $domain)
    {
        try {
            $dom = XmlUtils::loadFile($resource);
        } catch (\InvalidArgumentException $e) {
            throw new InvalidResourceException(sprintf('Unable to load "%s": %s', $resource, $e->getMessage()), $e->getCode(), $e);
        }

        $xliffVersion = $this->getVersionNumber($dom);
        $this->validateSchema($xliffVersion, $dom, $this->getSchema($xliffVersion));

        if ('1.2' === $xliffVersion) {
            $this->extractXliff1($dom, $catalogue, $domain);
        }

        if ('2.0' === $xliffVersion) {
            $this->extractXliff2($dom, $catalogue, $domain);
        }
    }

    /**
     * Extract messages and metadata from DOMDocument into a MessageCatalogue.
     *
     * @param \DOMDocument     $dom       Source to extract messages and metadata
     * @param MessageCatalogue $catalogue Catalogue where we'll collect messages and metadata
     * @param string           $domain    The domain
     */
    private function extractXliff1(\DOMDocument $dom, MessageCatalogue $catalogue, string $domain)
    {
        $xml = simplexml_import_dom($dom);
        $encoding = strtoupper($dom->encoding);

        $xml->registerXPathNamespace('xliff', 'urn:oasis:names:tc:xliff:document:1.2');
        foreach ($xml->xpath('//xliff:trans-unit') as $translation) {
            $attributes = $translation->attributes();

            if (!(isset($attributes['resname']) || isset($translation->source))) {
                continue;
            }

            $source = isset($attributes['resname']) && $attributes['resname'] ? $attributes['resname'] : $translation->source;
            // If the xlf file has another encoding specified, try to convert it because
            // simple_xml will always return utf-8 encoded values
            $target = $this->utf8ToCharset((string) (isset($translation->target) ? $translation->target : $source), $encoding);

            $catalogue->set((string) $source, $target, $domain);

            $metadata = array();
            if ($notes = $this->parseNotesMetadata($translation->note, $encoding)) {
                $metadata['notes'] = $notes;
            }

            if (isset($translation->target) && $translation->target->attributes()) {
                $metadata['target-attributes'] = array();
                foreach ($translation->target->attributes() as $key => $value) {
                    $metadata['target-attributes'][$key] = (string) $value;
                }
            }

            if (isset($attributes['id'])) {
                $metadata['id'] = (string) $attributes['id'];
            }

            $catalogue->setMetadata((string) $source, $metadata, $domain);
        }
    }

    private function extractXliff2(\DOMDocument $dom, MessageCatalogue $catalogue, string $domain)
    {
        $xml = simplexml_import_dom($dom);
        $encoding = strtoupper($dom->encoding);

        $xml->registerXPathNamespace('xliff', 'urn:oasis:names:tc:xliff:document:2.0');

        foreach ($xml->xpath('//xliff:unit') as $unit) {
            foreach ($unit->segment as $segment) {
                $source = $segment->source;

                // If the xlf file has another encoding specified, try to convert it because
                // simple_xml will always return utf-8 encoded values
                $target = $this->utf8ToCharset((string) (isset($segment->target) ? $segment->target : $source), $encoding);

                $catalogue->set((string) $source, $target, $domain);

                $metadata = array();
                if (isset($segment->target) && $segment->target->attributes()) {
                    $metadata['target-attributes'] = array();
                    foreach ($segment->target->attributes() as $key => $value) {
                        $metadata['target-attributes'][$key] = (string) $value;
                    }
                }

                if (isset($unit->notes)) {
                    $metadata['notes'] = array();
                    foreach ($unit->notes->note as $noteNode) {
                        $note = array();
                        foreach ($noteNode->attributes() as $key => $value) {
                            $note[$key] = (string) $value;
                        }
                        $note['content'] = (string) $noteNode;
                        $metadata['notes'][] = $note;
                    }
                }

                $catalogue->setMetadata((string) $source, $metadata, $domain);
            }
        }
    }

    /**
     * Convert a UTF8 string to the specified encoding.
     */
    private function utf8ToCharset(string $content, string $encoding = null): string
    {
        if ('UTF-8' !== $encoding && !empty($encoding)) {
            return mb_convert_encoding($content, $encoding, 'UTF-8');
        }

        return $content;
    }

    /**
     * Validates and parses the given file into a DOMDocument.
     *
     * @throws InvalidResourceException
     */
    private function validateSchema(string $file, \DOMDocument $dom, string $schema)
    {
        $internalErrors = libxml_use_internal_errors(true);

        $disableEntities = libxml_disable_entity_loader(false);

        if (!@$dom->schemaValidateSource($schema)) {
            libxml_disable_entity_loader($disableEntities);

            throw new InvalidResourceException(sprintf('Invalid resource provided: "%s"; Errors: %s', $file, implode("\n", $this->getXmlErrors($internalErrors))));
        }

        libxml_disable_entity_loader($disableEntities);

        $dom->normalizeDocument();

        libxml_clear_errors();
        libxml_use_internal_errors($internalErrors);
    }

    private function getSchema($xliffVersion)
    {
        if ('1.2' === $xliffVersion) {
            $schemaSource = file_get_contents(__DIR__.'/schema/dic/xliff-core/xliff-core-1.2-strict.xsd');
            $xmlUri = 'http://www.w3.org/2001/xml.xsd';
        } elseif ('2.0' === $xliffVersion) {
            $schemaSource = file_get_contents(__DIR__.'/schema/dic/xliff-core/xliff-core-2.0.xsd');
            $xmlUri = 'informativeCopiesOf3rdPartySchemas/w3c/xml.xsd';
        } else {
            throw new InvalidArgumentException(sprintf('No support implemented for loading XLIFF version "%s".', $xliffVersion));
        }

        return $this->fixXmlLocation($schemaSource, $xmlUri);
    }

    /**
     * Internally changes the URI of a dependent xsd to be loaded locally.
     */
    private function fixXmlLocation(string $schemaSource, string $xmlUri): string
    {
        $newPath = str_replace('\\', '/', __DIR__).'/schema/dic/xliff-core/xml.xsd';
        $parts = explode('/', $newPath);
        $locationstart = 'file:///';
        if (0 === stripos($newPath, 'phar://')) {
            $tmpfile = tempnam(sys_get_temp_dir(), 'symfony');
            if ($tmpfile) {
                copy($newPath, $tmpfile);
                $parts = explode('/', str_replace('\\', '/', $tmpfile));
            } else {
                array_shift($parts);
                $locationstart = 'phar:///';
            }
        }

        $drive = '\\' === \DIRECTORY_SEPARATOR ? array_shift($parts).'/' : '';
        $newPath = $locationstart.$drive.implode('/', array_map('rawurlencode', $parts));

        return str_replace($xmlUri, $newPath, $schemaSource);
    }

    /**
     * Returns the XML errors of the internal XML parser.
     */
    private function getXmlErrors(bool $internalErrors): array
    {
        $errors = array();
        foreach (libxml_get_errors() as $error) {
            $errors[] = sprintf('[%s %s] %s (in %s - line %d, column %d)',
                LIBXML_ERR_WARNING == $error->level ? 'WARNING' : 'ERROR',
                $error->code,
                trim($error->message),
                $error->file ?: 'n/a',
                $error->line,
                $error->column
            );
        }

        libxml_clear_errors();
        libxml_use_internal_errors($internalErrors);

        return $errors;
    }

    /**
     * Gets xliff file version based on the root "version" attribute.
     * Defaults to 1.2 for backwards compatibility.
     *
     * @throws InvalidArgumentException
     */
    private function getVersionNumber(\DOMDocument $dom): string
    {
        /** @var \DOMNode $xliff */
        foreach ($dom->getElementsByTagName('xliff') as $xliff) {
            $version = $xliff->attributes->getNamedItem('version');
            if ($version) {
                return $version->nodeValue;
            }

            $namespace = $xliff->attributes->getNamedItem('xmlns');
            if ($namespace) {
                if (0 !== substr_compare('urn:oasis:names:tc:xliff:document:', $namespace->nodeValue, 0, 34)) {
                    throw new InvalidArgumentException(sprintf('Not a valid XLIFF namespace "%s"', $namespace));
                }

                return substr($namespace, 34);
            }
        }

        // Falls back to v1.2
        return '1.2';
    }

    private function parseNotesMetadata(\SimpleXMLElement $noteElement = null, string $encoding = null): array
    {
        $notes = array();

        if (null === $noteElement) {
            return $notes;
        }

        /** @var \SimpleXMLElement $xmlNote */
        foreach ($noteElement as $xmlNote) {
            $noteAttributes = $xmlNote->attributes();
            $note = array('content' => $this->utf8ToCharset((string) $xmlNote, $encoding));
            if (isset($noteAttributes['priority'])) {
                $note['priority'] = (int) $noteAttributes['priority'];
            }

            if (isset($noteAttributes['from'])) {
                $note['from'] = (string) $noteAttributes['from'];
            }

            $notes[] = $note;
        }

        return $notes;
    }
}
