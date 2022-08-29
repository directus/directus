export interface PropInfo {
    type: any,
    default?: string | boolean | number | Function,
    required?: boolean
}

export function typeToString(type: any) {
    switch(type) {
        case String:
            return 'string'
        case Number:
            return 'integer'
        case Boolean:
            return 'boolean'
        case Array:
            return 'json'
        case Object:
            return 'json'
        default:
            return 'string'
    }
}

export function getDefaultValue(prop: PropInfo) {
    if (prop.default) {
        return typeof prop.default === 'function' ? prop.default() : prop.default
    }

    switch(prop.type) {
        case String:
            return ''
        case Number:
            return 0
        case Boolean:
            return false
        case Array:
            return []
        case Object:
            return {}
        default:
            return null
    }
}