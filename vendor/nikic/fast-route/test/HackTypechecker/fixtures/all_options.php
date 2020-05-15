<?hh

namespace FastRoute\TestFixtures;

function all_options_simple(): \FastRoute\Dispatcher {
    return \FastRoute\simpleDispatcher(
      $collector ==> {},
      shape(
        'routeParser' => \FastRoute\RouteParser\Std::class,
        'dataGenerator' => \FastRoute\DataGenerator\GroupCountBased::class,
        'dispatcher' => \FastRoute\Dispatcher\GroupCountBased::class,
        'routeCollector' => \FastRoute\RouteCollector::class,
      ),
    );
}

function all_options_cached(): \FastRoute\Dispatcher {
    return \FastRoute\cachedDispatcher(
      $collector ==> {},
      shape(
        'routeParser' => \FastRoute\RouteParser\Std::class,
        'dataGenerator' => \FastRoute\DataGenerator\GroupCountBased::class,
        'dispatcher' => \FastRoute\Dispatcher\GroupCountBased::class,
        'routeCollector' => \FastRoute\RouteCollector::class,
        'cacheFile' => '/dev/null',
        'cacheDisabled' => false,
      ),
    );
}
