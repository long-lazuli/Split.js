export interface GutterOptions {
    isVertical: boolean
}
interface Gutter {
    el: Element
    size: number
    options: GutterOptions
}

class Gutter {
    constructor(el: Element, options: GutterOptions) {
        this.el = el
        this.options = options
        this.refreshSize()
    }

    refreshSize() {
        const o = this.options
        const bounds = this.el.getBoundingClientRect()

        if (o.isVertical) {
            this.size = bounds['height']
        }
        if (o.isVertical) {
            this.size = bounds['width']
        }
    }
}

export default Gutter

export const defaultGutterStyleFn = (g: Gutter): {} => {
    return {
        [g.options.isVertical ? 'height' : 'width']: `${g.size}px`
    }
}
