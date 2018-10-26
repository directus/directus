<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation;

use Symfony\Component\Config\ConfigCacheFactory;
use Symfony\Component\Config\ConfigCacheFactoryInterface;
use Symfony\Component\Config\ConfigCacheInterface;
use Symfony\Component\Translation\Exception\InvalidArgumentException;
use Symfony\Component\Translation\Exception\LogicException;
use Symfony\Component\Translation\Exception\NotFoundResourceException;
use Symfony\Component\Translation\Exception\RuntimeException;
use Symfony\Component\Translation\Formatter\ChoiceMessageFormatterInterface;
use Symfony\Component\Translation\Formatter\MessageFormatter;
use Symfony\Component\Translation\Formatter\MessageFormatterInterface;
use Symfony\Component\Translation\Loader\LoaderInterface;

/**
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Translator implements TranslatorInterface, TranslatorBagInterface
{
    /**
     * @var MessageCatalogueInterface[]
     */
    protected $catalogues = array();

    /**
     * @var string
     */
    private $locale;

    /**
     * @var array
     */
    private $fallbackLocales = array();

    /**
     * @var LoaderInterface[]
     */
    private $loaders = array();

    /**
     * @var array
     */
    private $resources = array();

    /**
     * @var MessageFormatterInterface
     */
    private $formatter;

    /**
     * @var string
     */
    private $cacheDir;

    /**
     * @var bool
     */
    private $debug;

    /**
     * @var ConfigCacheFactoryInterface|null
     */
    private $configCacheFactory;

    /**
     * @throws InvalidArgumentException If a locale contains invalid characters
     */
    public function __construct(?string $locale, MessageFormatterInterface $formatter = null, string $cacheDir = null, bool $debug = false)
    {
        $this->setLocale($locale);

        if (null === $formatter) {
            $formatter = new MessageFormatter();
        }

        $this->formatter = $formatter;
        $this->cacheDir = $cacheDir;
        $this->debug = $debug;
    }

    public function setConfigCacheFactory(ConfigCacheFactoryInterface $configCacheFactory)
    {
        $this->configCacheFactory = $configCacheFactory;
    }

    /**
     * Adds a Loader.
     *
     * @param string          $format The name of the loader (@see addResource())
     * @param LoaderInterface $loader A LoaderInterface instance
     */
    public function addLoader($format, LoaderInterface $loader)
    {
        $this->loaders[$format] = $loader;
    }

    /**
     * Adds a Resource.
     *
     * @param string $format   The name of the loader (@see addLoader())
     * @param mixed  $resource The resource name
     * @param string $locale   The locale
     * @param string $domain   The domain
     *
     * @throws InvalidArgumentException If the locale contains invalid characters
     */
    public function addResource($format, $resource, $locale, $domain = null)
    {
        if (null === $domain) {
            $domain = 'messages';
        }

        $this->assertValidLocale($locale);

        $this->resources[$locale][] = array($format, $resource, $domain);

        if (\in_array($locale, $this->fallbackLocales)) {
            $this->catalogues = array();
        } else {
            unset($this->catalogues[$locale]);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function setLocale($locale)
    {
        $this->assertValidLocale($locale);
        $this->locale = $locale;
    }

    /**
     * {@inheritdoc}
     */
    public function getLocale()
    {
        return $this->locale;
    }

    /**
     * Sets the fallback locales.
     *
     * @param array $locales The fallback locales
     *
     * @throws InvalidArgumentException If a locale contains invalid characters
     */
    public function setFallbackLocales(array $locales)
    {
        // needed as the fallback locales are linked to the already loaded catalogues
        $this->catalogues = array();

        foreach ($locales as $locale) {
            $this->assertValidLocale($locale);
        }

        $this->fallbackLocales = $locales;
    }

    /**
     * Gets the fallback locales.
     *
     * @return array $locales The fallback locales
     */
    public function getFallbackLocales()
    {
        return $this->fallbackLocales;
    }

    /**
     * {@inheritdoc}
     */
    public function trans($id, array $parameters = array(), $domain = null, $locale = null)
    {
        if (null === $domain) {
            $domain = 'messages';
        }

        return $this->formatter->format($this->getCatalogue($locale)->get((string) $id, $domain), $locale, $parameters);
    }

    /**
     * {@inheritdoc}
     */
    public function transChoice($id, $number, array $parameters = array(), $domain = null, $locale = null)
    {
        if (!$this->formatter instanceof ChoiceMessageFormatterInterface) {
            throw new LogicException(sprintf('The formatter "%s" does not support plural translations.', \get_class($this->formatter)));
        }

        if (null === $domain) {
            $domain = 'messages';
        }

        $id = (string) $id;
        $catalogue = $this->getCatalogue($locale);
        $locale = $catalogue->getLocale();
        while (!$catalogue->defines($id, $domain)) {
            if ($cat = $catalogue->getFallbackCatalogue()) {
                $catalogue = $cat;
                $locale = $catalogue->getLocale();
            } else {
                break;
            }
        }

        return $this->formatter->choiceFormat($catalogue->get($id, $domain), $number, $locale, $parameters);
    }

    /**
     * {@inheritdoc}
     */
    public function getCatalogue($locale = null)
    {
        if (null === $locale) {
            $locale = $this->getLocale();
        } else {
            $this->assertValidLocale($locale);
        }

        if (!isset($this->catalogues[$locale])) {
            $this->loadCatalogue($locale);
        }

        return $this->catalogues[$locale];
    }

    /**
     * Gets the loaders.
     *
     * @return array LoaderInterface[]
     */
    protected function getLoaders()
    {
        return $this->loaders;
    }

    /**
     * @param string $locale
     */
    protected function loadCatalogue($locale)
    {
        if (null === $this->cacheDir) {
            $this->initializeCatalogue($locale);
        } else {
            $this->initializeCacheCatalogue($locale);
        }
    }

    /**
     * @param string $locale
     */
    protected function initializeCatalogue($locale)
    {
        $this->assertValidLocale($locale);

        try {
            $this->doLoadCatalogue($locale);
        } catch (NotFoundResourceException $e) {
            if (!$this->computeFallbackLocales($locale)) {
                throw $e;
            }
        }
        $this->loadFallbackCatalogues($locale);
    }

    private function initializeCacheCatalogue(string $locale): void
    {
        if (isset($this->catalogues[$locale])) {
            /* Catalogue already initialized. */
            return;
        }

        $this->assertValidLocale($locale);
        $cache = $this->getConfigCacheFactory()->cache($this->getCatalogueCachePath($locale),
            function (ConfigCacheInterface $cache) use ($locale) {
                $this->dumpCatalogue($locale, $cache);
            }
        );

        if (isset($this->catalogues[$locale])) {
            /* Catalogue has been initialized as it was written out to cache. */
            return;
        }

        /* Read catalogue from cache. */
        $this->catalogues[$locale] = include $cache->getPath();
    }

    private function dumpCatalogue($locale, ConfigCacheInterface $cache): void
    {
        $this->initializeCatalogue($locale);
        $fallbackContent = $this->getFallbackContent($this->catalogues[$locale]);

        $content = sprintf(<<<EOF
<?php

use Symfony\Component\Translation\MessageCatalogue;

\$catalogue = new MessageCatalogue('%s', %s);

%s
return \$catalogue;

EOF
            ,
            $locale,
            var_export($this->catalogues[$locale]->all(), true),
            $fallbackContent
        );

        $cache->write($content, $this->catalogues[$locale]->getResources());
    }

    private function getFallbackContent(MessageCatalogue $catalogue): string
    {
        $fallbackContent = '';
        $current = '';
        $replacementPattern = '/[^a-z0-9_]/i';
        $fallbackCatalogue = $catalogue->getFallbackCatalogue();
        while ($fallbackCatalogue) {
            $fallback = $fallbackCatalogue->getLocale();
            $fallbackSuffix = ucfirst(preg_replace($replacementPattern, '_', $fallback));
            $currentSuffix = ucfirst(preg_replace($replacementPattern, '_', $current));

            $fallbackContent .= sprintf(<<<'EOF'
$catalogue%s = new MessageCatalogue('%s', %s);
$catalogue%s->addFallbackCatalogue($catalogue%s);

EOF
                ,
                $fallbackSuffix,
                $fallback,
                var_export($fallbackCatalogue->all(), true),
                $currentSuffix,
                $fallbackSuffix
            );
            $current = $fallbackCatalogue->getLocale();
            $fallbackCatalogue = $fallbackCatalogue->getFallbackCatalogue();
        }

        return $fallbackContent;
    }

    private function getCatalogueCachePath($locale)
    {
        return $this->cacheDir.'/catalogue.'.$locale.'.'.strtr(substr(base64_encode(hash('sha256', serialize($this->fallbackLocales), true)), 0, 7), '/', '_').'.php';
    }

    private function doLoadCatalogue($locale): void
    {
        $this->catalogues[$locale] = new MessageCatalogue($locale);

        if (isset($this->resources[$locale])) {
            foreach ($this->resources[$locale] as $resource) {
                if (!isset($this->loaders[$resource[0]])) {
                    throw new RuntimeException(sprintf('The "%s" translation loader is not registered.', $resource[0]));
                }
                $this->catalogues[$locale]->addCatalogue($this->loaders[$resource[0]]->load($resource[1], $locale, $resource[2]));
            }
        }
    }

    private function loadFallbackCatalogues($locale): void
    {
        $current = $this->catalogues[$locale];

        foreach ($this->computeFallbackLocales($locale) as $fallback) {
            if (!isset($this->catalogues[$fallback])) {
                $this->initializeCatalogue($fallback);
            }

            $fallbackCatalogue = new MessageCatalogue($fallback, $this->catalogues[$fallback]->all());
            foreach ($this->catalogues[$fallback]->getResources() as $resource) {
                $fallbackCatalogue->addResource($resource);
            }
            $current->addFallbackCatalogue($fallbackCatalogue);
            $current = $fallbackCatalogue;
        }
    }

    protected function computeFallbackLocales($locale)
    {
        $locales = array();
        foreach ($this->fallbackLocales as $fallback) {
            if ($fallback === $locale) {
                continue;
            }

            $locales[] = $fallback;
        }

        if (false !== strrchr($locale, '_')) {
            array_unshift($locales, substr($locale, 0, -\strlen(strrchr($locale, '_'))));
        }

        return array_unique($locales);
    }

    /**
     * Asserts that the locale is valid, throws an Exception if not.
     *
     * @param string $locale Locale to tests
     *
     * @throws InvalidArgumentException If the locale contains invalid characters
     */
    protected function assertValidLocale($locale)
    {
        if (1 !== preg_match('/^[a-z0-9@_\\.\\-]*$/i', $locale)) {
            throw new InvalidArgumentException(sprintf('Invalid "%s" locale.', $locale));
        }
    }

    /**
     * Provides the ConfigCache factory implementation, falling back to a
     * default implementation if necessary.
     */
    private function getConfigCacheFactory(): ConfigCacheFactoryInterface
    {
        if (!$this->configCacheFactory) {
            $this->configCacheFactory = new ConfigCacheFactory($this->debug);
        }

        return $this->configCacheFactory;
    }
}
