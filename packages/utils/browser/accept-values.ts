import Bowser from 'bowser'

// This code should not have been written, but there is no other way to get the default accept values for the browser 😣🤮
// Values where taken from https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation/List_of_default_Accept_values

export type ACCEPT_CONTEXT = 'default' | 'image' | 'video' | 'audio'
export const BROWSER_TYPES = ['Chrome', 'Firefox', 'Safari', 'Microsoft Edge', 'Opera']

const ACCEPT_VALUES: Record<ACCEPT_CONTEXT, Record<typeof BROWSER_TYPES[number], string | undefined>> = {
    default: {
        Firefox: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        Safari: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        Chrome: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Microsoft Edge': 'text/html, application/xhtml+xml, image/jxr, */*',
        Opera: 'text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg, image/gif, image/x-xbitmap, */*;q=0.1'
    },
    image: {
        Firefox: 'image/avif,image/webp,*/*',
        Safari: 'image/webp,image/png,image/svg+xml,image/*;q=0.8,video/*;q=0.8,*/*;q=0.5',
        Chrome: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Microsoft Edge': undefined,
        Opera: undefined,
    },
    video: {
        Firefox: 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
        Safari: undefined,
        Chrome: undefined,
        'Microsoft Edge': undefined,
        Opera: undefined,
    },
    audio: {
        Firefox: 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5',
        Safari: undefined,
        Chrome: undefined,
        'Microsoft Edge': undefined,
        Opera: undefined,
    }
}


export function getAcceptValues(context?: ACCEPT_CONTEXT) {
    const browser = Bowser.getParser(window.navigator.userAgent)

    const name = browser.getBrowserName()

    if (!BROWSER_TYPES.includes(name)) return undefined

    return ACCEPT_VALUES[context || 'default'][name];
}