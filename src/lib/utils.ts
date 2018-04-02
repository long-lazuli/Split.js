export const isString = (v: string | Element) => typeof v === 'string' || v instanceof String

export const isIE8 = (global as any)['attachEvent'] && !(global as any)['addEventListener']

export const cssCalc = `${['', '-webkit-', '-moz-', '-o-']
    .filter(prefix => {
        const el = document.createElement('div')
        el.style.cssText = `width:${prefix}calc(9px)`

        return !!el.style.length
    })
    .shift()}calc`
