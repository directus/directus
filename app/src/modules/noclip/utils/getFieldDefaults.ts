import { DeepPartial, Field } from "@directus/shared/types"

type FieldWithDefault = Field & {
    default: any
}

export function getFieldDefaults(type: 'interface' | 'display', name: string): Record<string, DeepPartial<FieldWithDefault>> {

    if (type === 'interface') {
        switch (name) {
            case 'boolean':
                return {
                    value: def(true),
                    disabled: def(false)
                }
            case 'datetime':
                return {
                    type: def('dateTime'),
                    value: def('2022-08-26T17:09:00')
                }
            case 'input':
                return {
                    type: def('string', {
                        meta: {
                            interface: 'select-dropdown',
                            options: {
                                choices: [{ text: 'String', value: 'string' }, { text: 'Integer', value: 'integer' }]
                            }
                        }
                    }),
                    value: def('Hello')
                }
            case 'input-multiline':
                return {
                    value: def('This is a super cool message!')
                }
            case 'select-dropdown':
                return {
                    value: def('option-1'),
                    choices: def([
                        { text: 'Option 1', value: 'option-1' },
                        { text: 'Option 2', value: 'option-2' },
                        { text: 'Option 3', value: 'option-3' },
                    ])
                }
            case 'select-radio':
                return {
                    value: def('option-1'),
                    choices: def([
                        { text: 'Option 1', value: 'option-1' },
                        { text: 'Option 2', value: 'option-2' },
                        { text: 'Option 3', value: 'option-3' },
                    ])
                }
            case 'select-multiple-dropdown':
                return {
                    value: def(['option-1']),
                    choices: def([
                        { text: 'Option 1', value: 'option-1' },
                        { text: 'Option 2', value: 'option-2' },
                        { text: 'Option 3', value: 'option-3' },
                    ])
                }
            case 'select-multiple-checkbox-tree':
                return {
                    value: def(['option-1', 'option-2.2']),
                    choices: def([
                        { text: 'Option 1', value: 'option-1' },
                        {
                            text: 'Option 2', value: 'option-2', children: [
                                { text: 'Option 2.1', value: 'option-2.1' },
                                { text: 'Option 2.2', value: 'option-2.2' },
                                { text: 'Option 2.3', value: 'option-2.3' },
                            ]
                        },
                        { text: 'Option 3', value: 'option-3' },
                    ]),
                    valueCombining: def('all', {
                        meta: {
                            interface: 'select-dropdown',
                            options: {
                                choices: [{ text: 'All', value: 'all' }, { text: 'Branch', value: 'branch' }, { text: 'Leaf', value: 'leaf' }, { text: 'Indeterminate', value: 'indeterminate' }, { text: 'Exclusive', value: 'exclusive' }]
                            }
                        }
                    })
                }
            case 'select-multiple-checkbox':
                return {
                    value: def(['option-1']),
                    choices: def([
                        { text: 'Option 1', value: 'option-1' },
                        { text: 'Option 2', value: 'option-2' },
                        { text: 'Option 3', value: 'option-3' },
                    ])
                }
            case 'presentation-notice':
                return {
                    color: def('normal', {
                        meta: {
                            interface: 'select-dropdown',
                            options: {
                                choices: [{ text: 'Normal', value: 'normal' }, { text: 'Info', value: 'info' }, { text: 'Success', value: 'success' }, { text: 'Warning', value: 'warning' }, { text: 'Danger', value: 'danger' }]
                            }
                        }
                    })
                }
            case 'presentation-links':
                return {
                    links: def([
                        { label: 'Link 1', icon: 'add', url: 'https://www.directus.io' },
                        { label: 'Link 2', icon: 'delete', type: 'danger' },
                        { label: 'Link 3', icon: 'house', type: 'warning' },
                        { label: 'Link 4', icon: 'air', type: 'primary' },
                        { label: 'Link 5', icon: 'air', type: 'info' },
                    ])
                }
            case 'presentation-divider':
                return {
                    title: def('My Divider'),
                    icon: def('widgets')
                }
            case 'map':
                return {
                    fieldData: def({
                        "type": "geometry.Point",
                    }),
                    defaultView: def({
                        "center":{
                            "lng":11.090944084388639,
                            "lat":52.11929396730582
                        },
                        "zoom":5.152779254707871,
                        "bearing":0,
                        "pitch":0
                    }),
                    type: def('geometry.Point', {
                        meta: {
                            interface: 'select-dropdown',
                            options: {
                                choices: [{ text: 'Point', value: 'geometry.Point' }, { text: 'LineString', value: 'geometry.LineString' }, { text: 'Polygon', value: 'geometry.Polygon' }, { text: 'MultiPoint', value: 'geometry.MultiPoint' }, { text: 'MultiLineString', value: 'geometry.MultiLineString' }, { text: 'MultiPolygon', value: 'geometry.MultiPolygon' }, { text: 'GeometryCollection', value: 'geometry.GeometryCollection' }]
                            }
                        }
                    }),
                    geometryType: def('Point', {
                        meta: {
                            interface: 'select-dropdown',
                            options: {
                                choices: [{ text: 'Point', value: 'Point' }, { text: 'LineString', value: 'LineString' }, { text: 'Polygon', value: 'Polygon' }, { text: 'MultiPoint', value: 'MultiPoint' }, { text: 'MultiLineString', value: 'MultiLineString' }, { text: 'MultiPolygon', value: 'MultiPolygon' }, { text: 'GeometryCollection', value: 'GeometryCollection' }]
                            }
                        }
                    })
                }
        }
    } else if (type === 'display') {
        switch(name) {
            case 'boolean':
                return {
                    labelOn: def('Currently On'),
                    labelOff: def('Currently Off'),
                    value: def(true),
                }
            case 'collection':
                return {
                    value: def('directus_settings')
                }
            case 'color':
                return {
                    value: def('#6644ff')
                }
            case 'datetime':
                return {
                    value: def('2001-01-02T18:30:00'),
                    type: def('dateTime', {
                        meta: {
                            interface: 'select-dropdown',
                            options: {
                                choices: [{ text: 'Date', value: 'date' }, { text: 'Time', value: 'time' }, { text: 'DateTime', value: 'dateTime' }, { text: 'Timestamp', value: 'timestamp' }]
                            }
                        }
                    }),
                    format: def('yyyy-MMM-dd HH:mm', {
                        meta: {
                            interface: 'select-dropdown',
                            options: {
                                choices: [{text: 'Long', value: 'long'}, {text: 'Short', value: 'short'}],
                                allowOther: true
                            }
                        }
                    })
                }
            case 'file':
                return {
                    value: def({
                        id: '5fe34cf0-453d-4b72-bbde-e24c8ea76ec2',
                        type: 'image/jpeg',
                        title: 'image.jpg',
                    })
                }
            case 'filesize':
                return {
                    value: def(100000, {
                        type: 'integer',
                    })
                }
            case 'formatted-json-value':
                return {
                    value: def({
                        foo: 'bar',
                        baz: 'qux',
                        quux: {
                            corge: 'grault',
                            garply: 'waldo',
                        },
                    }, {
                        type: 'json',
                    }),
                    format: def('{{baz}} --- {{quux.corge}}')
                }
            case 'formatted-value':
                return {
                    type: def('string'),
                    value: def('hello-world'),
                    format: def(true)
                }
            case 'icon':
                return {
                    value: def('widgets'),
                    color: def('#6644ff')
                }
            case 'image':
                return {
                    value: def({
                        "id": "5fe34cf0-453d-4b72-bbde-e24c8ea76ec2",
                        "type": "image/jpeg",
                        "title": "image.jpg"
                    })
                }
            case 'labels':
                return {
                    value: def(['item-1', 'item-2', 'item-3'])
                }
            case 'mime-type':
                return {
                    value: def("image/jpeg")
                }
            case 'rating':
                return {
                    value: def(3.5, {
                        type: 'integer',
                    })
                }
        }
    }

    return {}
}

function def(defaultValue: any, other: DeepPartial<Field> = {}) {
    return {
        ...other,
        default: defaultValue
    }
}