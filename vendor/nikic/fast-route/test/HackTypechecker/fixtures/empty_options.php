<?hh

namespace FastRoute\TestFixtures;

function empty_options_simple(): \FastRoute\Dispatcher {
    return \FastRoute\simpleDispatcher($collector ==> {}, shape());
}

function empty_options_cached(): \FastRoute\Dispatcher {
    return \FastRoute\cachedDispatcher($collector ==> {}, shape());
}
