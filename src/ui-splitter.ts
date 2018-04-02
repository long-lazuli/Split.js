import { isString } from './lib/utils'

import Pane, { defaultPaneStyleFn } from './lib/Pane'
import Gutter, { defaultGutterStyleFn } from './lib/Gutter'

interface Pair {
    a: Pane
    b: Pane
}

export type splitDirection = 'horizontal' | 'vertical'

export interface UISplitterOptions {
    /**
     * An array of initial sizes of the elements, specified as percentage values.
     *
     * Example: Setting the initial sizes to 25% and 75%.
     * ```JS
     * Split(['#one', '#two'], {
     *     sizes: [25, 75]
     * })
     * ```
     */
    sizes?: number[]

    /**
     * An array of minimum sizes of the elements, specified as pixel values.
     *
     * Example: Setting the minimum sizes to 100px and 300px, respectively.
     * ```JS
     * Split(['#one', '#two'], {
     *     minSize: [100, 300]
     * })
     * ```
     *
     * If a number is passed instead of an array, all elements are set to the same minimum size:
     * ```JS
     * Split(['#one', '#two'], {
     *     minSize: 100
     * })
     * ```
     *
     * @Default 100
     */
    minSize?: number[] | number

    /**
     * Gutter size in pixels.
     *
     * Example: Setting the gutter size to 20px.
     * ```JS
     * Split(['#one', '#two'], {
     *     gutterSize: 20
     * })
     * ```
     *
     * @Default 10
     */
    gutterSize?: number

    /**
     * Snap to minimum size at this offset in pixels.
     *
     * Example: Set to 0 to disable to snap effect.
     * ```JS
     * Split(['#one', '#two'], {
     *     snapOffset: 0
     * })
     * ```
     *
     * @Default 30
     */
    snapOffset?: number

    /**
     * Allow pushing panes while dragging.
     *
     * Example: Set to true to allow pushing panes.
     * ```JS
     * Split(['#one', '#two'], {
     *     pushablePanes: true
     * })
     * ```
     *
     * @Default false
     */
    pushablePanes?: boolean

    /**
     * Direction to split in. Can be 'vertical' or 'horizontal'.
     * Determines which CSS properties are applied (ie. width/height) to each element and gutter.
     *
     * Example: split vertically:
     * ```JS
     * Split(['#one', '#two'], {
     *     direction: 'vertical'
     * })
     * ```
     *
     * @Default 'horizontal'
     */
    direction?: splitDirection

    /**
     * Cursor to display while dragging.
     *
     * Cursor to show on the gutter (also applied to the two adjacent elements when dragging to prevent flickering). Defaults to 'col-resize', so should be switched to 'row-resize' when using direction: 'vertical':
     * ```JS
     * Split(['#one', '#two'], {
     *    direction: 'vertical',
     *    cursor: 'row-resize'
     * })
     * ```
     *
     * @Default 'col-resize'
     */
    cursor?: 'col-resize' | 'row-resize'

    /**
     * Optional function called to create each gutter element.
     *
     * The returned element is then inserted into the DOM, and it's width or height are set.
     * This option can be used to clone an existing DOM element, or to create a new element with custom styles.
     *
     * @Default A function creating a div with class="gutter gutter-horizontal" or class="gutter gutter-vertical", depending on the direction :
     * ```JS
     * (index, direction) => {
     *     const gutter = document.createElement('div')
     *     gutter.className = `gutter gutter-${direction}`
     *     return gutter
     * }
     * ```
     */
    gutter?: (index: number, direction: splitDirection) => Element

    /**
     * Optional function called setting the CSS style of the elements.
     *
     * `pane.size` is the target percentage value of the element.
     * `pane.isVertical` helps determine what to do with style.
     * `gutterSize` is the target pixel value of its gutter(s).
     *
     * It should return an object with CSS properties to apply to the element. For horizontal splits, the return object looks like this:
     * ```JS
     * {
     *     'width': 'calc(50% - 5px)'
     * }
     * ```
     * A vertical split style would look like this:
     * ```JS
     * {
     *     'height': 'calc(50% - 5px)'
     * }
     * ```
     * Use this function if you're using a different layout like flexbox or grid (see Flexbox). A flexbox style for a horizontal split would look like this:
     * ```JS
     * {
     *     'flex-basis': 'calc(50% - 5px)'
     * }
     * ```
     * > `paneStyle` is called continously while dragging, so don't do anything besides return the style object.
     */
    paneStyle?: (pane: Pane, gutterSize: number) => {}
    // (dimension, elementSize, gutterSize) => Object

    /**
     * Called to set the style of the gutter.
     * Optional function called when setting the CSS style of the gutters.
     *
     * `gutter.size` is a pixel value representing the width of the gutter.
     * `gutter.isVertical` helps determine what to do with style.
     *
     * It should return a similar object as elementStyle, an object with CSS properties to apply to the gutter.
     * Since gutters have fixed widths, it will generally look like this:
     * ```JS
     * {
     *     'width': '10px'
     * }
     * ```
     *
     * > `gutterStyle` is called continously while dragging, so don't do anything besides return the style object.
     */
    gutterStyle?: (gutter: Gutter) => {}

    /**
     * Callbacks that can be added on drag (fired continously), drag start and drag end.
     * If doing more than basic operations in onDrag, add a debounce function to rate limit the callback.
     */
    onDrag?: () => void
    onDragStart?: () => void
    onDragEnd?: () => void
}

export const defaultOptions: UISplitterOptions = {
    direction: 'horizontal',
    gutterSize: 10,
    minSize: 100,
    snapOffset: 30,
    pushablePanes: false,
    cursor: 'col-resize',
    paneStyle: defaultPaneStyleFn,
    gutterStyle: defaultGutterStyleFn
}

export default class UISplitter {
    options: any

    private panes: Array<Pane>

    constructor(ids: Array<string | Element>, options: Partial<UISplitterOptions> = {}) {
        this.options = {
            ...defaultOptions,
            ...options
        }

        this.options.cursor =
            options.cursor ||
            (this.options.direction === 'horizontal' ? 'col-resize' : 'row-resize')

        this.options.reverseDirection = false

        this.panes = this.createPanes(ids)
    }

    createPanes(ids: Array<string | Element>) {
        return ids.map(i => {
            let el: Element | string | null = i
            if (isString(el)) {
                el = document.querySelector(el as string)
                if (!el) throw new Error(`${i} is not a valid element`)
            }

            return new Pane(el as Element, {
                isVertical: this.options.direction === 'vertical',
                isReverse: this.options.reversedDirection
            })
        })
    }
}
