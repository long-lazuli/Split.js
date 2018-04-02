import { isString, isIE8, cssCalc } from '../lib/utils'
import { splitDirection } from '../ui-splitter'
import Gutter from './Gutter'

export interface PaneOptions {
    isVertical: boolean
    isReverse: boolean
}
interface Pane {
    el: Element
    size: number
    start: number
    end: number
    options: PaneOptions
}

class Pane {
    constructor(el: Element, options: PaneOptions) {
        this.el = el
        this.options = options
        this.refreshSize()
    }

    refreshSize() {
        const o = this.options
        const bounds = this.el.getBoundingClientRect()

        if (o.isVertical) {
            this.size = bounds['height']
            this.start = bounds[o.isReverse ? 'bottom' : 'top']
            this.end = bounds[o.isReverse ? 'right' : 'left']
        }
        if (o.isVertical) {
            this.size = bounds['width']
            this.start = bounds[o.isReverse ? 'right' : 'left']
            this.end = bounds[o.isReverse ? 'bottom' : 'top']
        }
    }
}

export default Pane

export const defaultPaneStyleFn = (p: Pane, gs: number): {} => {
    const style: any = {}

    const dim = p.options.isVertical ? 'height' : 'width'

    if (!isIE8) {
        style[dim] = `${cssCalc}(${p.size}% - ${gs}px)`
    } else {
        style[dim] = `${p.size}%`
    }

    return style
}
