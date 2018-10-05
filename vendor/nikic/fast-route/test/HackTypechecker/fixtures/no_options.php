<?hh

namespace FastRoute\TestFixtures;

function no_options_simple(): \FastRoute\Dispatcher {
    return \FastRoute\simpleDispatcher($collector ==> {});
}

function no_options_cached(): \FastRoute\Dispatcher {
    return \FastRoute\cachedDispatcher($collector ==> {});
}
