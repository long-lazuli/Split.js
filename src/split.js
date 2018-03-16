// The programming goals of Split.js are to deliver readable, understandable and
// maintainable code, while at the same time manually optimizing for tiny minified file size,
// browser compatibility without additional requirements, graceful fallback (IE8 is supported)
// and very few assumptions about the user's page layout.
const global = window
const document = global.document

// Save a couple long function names that are used frequently.
// This optimization saves around 400 bytes.
const addEventListener = 'addEventListener'
const removeEventListener = 'removeEventListener'
const getBoundingClientRect = 'getBoundingClientRect'
const HORIZONTAL = 'horizontal'
const NOOP = () => false

// Figure out if we're in IE8 or not. IE8 will still render correctly,
// but will be static instead of draggable.
const isIE8 = global.attachEvent && !global[addEventListener]

// Helper function determines which prefixes of CSS calc we need.
// We only need to do this once on startup, when this anonymous function is called.
//
// Tests -webkit, -moz and -o prefixes. Modified from StackOverflow:
// http://stackoverflow.com/questions/16625140/js-feature-detection-to-detect-the-usage-of-webkit-calc-over-calc/16625167#16625167
const calc = `${['', '-webkit-', '-moz-', '-o-'].filter(prefix => {
    const el = document.createElement('div')
    el.style.cssText = `width:${prefix}calc(9px)`

    return (!!el.style.length)
}).shift()}calc`

// Helper function checks if its argument is a string-like type
const isString = v => (typeof v === 'string' || v instanceof String)

// Helper function allows elements and string selectors to be used
// interchangeably. In either case an element is returned. This allows us to
// do `Split([elem1, elem2])` as well as `Split(['#id1', '#id2'])`.
const elementOrSelector = el => {
    if (isString(el)) {
        return document.querySelector(el)
    }

    return el
}

// Helper function gets a property from the properties object, with a default fallback
const getOption = (options, propName, def) => {
    const value = options[propName]
    if (value !== undefined) {
        return value
    }
    return def
}

// Default options
const defaultGutterFn = (i, gutterDirection) => {
    const gut = document.createElement('div')
    gut.className = `gutter gutter-${gutterDirection}`
    return gut
}

const defaultElementStyleFn = (dim, size, gutSize) => {
    const style = {}

    if (!isString(size)) {
        if (!isIE8) {
            style[dim] = `${calc}(${size}% - ${gutSize}px)`
        } else {
            style[dim] = `${size}%`
        }
    } else {
        style[dim] = size
    }

    return style
}

const defaultGutterStyleFn = (dim, gutSize) => ({ [dim]: `${gutSize}px` })

// The main function to initialize a split. Split.js thinks about each pair
// of elements as an independant pair. Dragging the gutter between two elements
// only changes the dimensions of elements in that pair. This is key to understanding
// how the following functions operate, since each function is bound to a pair.
//
// A pair object is shaped like this:
//
// {
//     a: DOM element,
//     b: DOM element,
//     aMin: Number,
//     bMin: Number,
//     dragging: Boolean,
//     parent: DOM element,
//     isFirst: Boolean,
//     isLast: Boolean,
//     direction: 'horizontal' | 'vertical'
// }
//
// The basic sequence:
//
// 1. Set defaults to something sane. `options` doesn't have to be passed at all.
// 2. Initialize a bunch of strings based on the direction we're splitting.
//    A lot of the behavior in the rest of the library is paramatized down to
//    rely on CSS strings and classes.
// 3. Define the dragging helper functions, and a few helpers to go with them.
// 4. Loop through the elements while pairing them off. Every pair gets an
//    `pair` object, a gutter, and special isFirst/isLast properties.
// 5. Actually size the pair elements, insert gutters and attach event listeners.
const Split = (ids, options = {}) => {
    let dimension
    let clientAxis
    let position
    let elements
    const pairs = []


    // All DOM elements in the split should have a common parent. We can grab
    // the first elements parent and hope users read the docs because the
    // behavior will be whacky otherwise.
    const parent = elementOrSelector(ids[0]).parentNode
    const parentFlexDirection = global.getComputedStyle(parent).flexDirection

    // Set default options.sizes to equal percentages of the parent element.
    const sizes = getOption(options, 'sizes') || ids.map(() => 100 / ids.length)

    // Standardize minSize to an array if it isn't already. This allows minSize
    // to be passed as a number.
    const minSize = getOption(options, 'minSize', 100)
    const minSizes = Array.isArray(minSize) ? minSize : ids.map(() => minSize)
    const gutterSize = getOption(options, 'gutterSize', 10)
    const snapOffset = getOption(options, 'snapOffset', 30)
    const pushablePanes = getOption(options, 'pushablePanes', false)
    const direction = getOption(options, 'direction', HORIZONTAL)
    const cursor = getOption(options, 'cursor', direction === HORIZONTAL ? 'ew-resize' : 'ns-resize')
    const gutter = getOption(options, 'gutter', defaultGutterFn)
    const elementStyle = getOption(options, 'elementStyle', defaultElementStyleFn)
    const gutterStyle = getOption(options, 'gutterStyle', defaultGutterStyleFn)

    // 2. Initialize a bunch of strings based on the direction we're splitting.
    // A lot of the behavior in the rest of the library is paramatized down to
    // rely on CSS strings and classes.
    if (direction === HORIZONTAL) {
        dimension = 'width'
        clientAxis = 'clientX'
        position = 'left'
    } else if (direction === 'vertical') {
        dimension = 'height'
        clientAxis = 'clientY'
        position = 'top'
    }

    // 3. Define the dragging helper functions, and a few helpers to go with them.
    // Each helper is bound to a pair object that contains its metadata. This
    // also makes it easy to store references to listeners that that will be
    // added and removed.
    //
    // Even though there are no other functions contained in them, aliasing
    // this to self saves 50 bytes or so since it's used so frequently.
    //
    // The pair object saves metadata like dragging state, position and
    // event listener references.

    function setElementSize (el, size, gutSize) {
        // Split.js allows setting sizes via numbers (ideally), or if you must,
        // by string, like '300px'. This is less than ideal, because it breaks
        // the fluid layout that `calc(% - px)` provides. You're on your own if you do that,
        // make sure you calculate the gutter size by hand.
        const style = elementStyle(dimension, size, gutSize)

        // eslint-disable-next-line no-param-reassign
        Object.keys(style).forEach(prop => {
            el.style[prop] = style[prop]
        })
    }

    function setGutterSize (gutterElement, gutSize) {
        const style = gutterStyle(dimension, gutSize)

        // eslint-disable-next-line no-param-reassign
        Object.keys(style).forEach(prop => {
            gutterElement.style[prop] = style[prop]
        })
    }

    // Actually adjust the size of elements `a` and `b` to `offset` while dragging.
    // calc is used to allow calc(percentage + gutterpx) on the whole split instance,
    // which allows the viewport to be resized without additional logic.
    // Element a's size is the same as offset. b's size is total size - a size.
    // Both sizes are calculated from the initial parent percentage,
    // then the gutter size is subtracted.
    function adjust (offset) {
        const a = elements[this.a]
        const b = elements[this.b]
        const percentage = a.size + b.size

        a.size = (offset / this.size) * percentage
        b.size = (percentage - ((offset / this.size) * percentage))

        setElementSize(a.element, a.size, this.aGutterSize)
        setElementSize(b.element, b.size, this.bGutterSize)
    }

    // Cache some important sizes when drag starts, so we don't have to do that
    // continously:
    //
    // `size`: The total size of the pair. First + second + first gutter + second gutter.
    // `start`: The leading side of the first element.
    //
    // ------------------------------------------------
    // |      aGutterSize -> |||                      |
    // |                     |||                      |
    // |                     |||                      |
    // |                     ||| <- bGutterSize       |
    // ------------------------------------------------
    // | <- start                             size -> |
    function calculateSizes () {
        // Figure out the parent size minus padding.
        const a = elements[this.a].element
        const b = elements[this.b].element

        const aBounds = a[getBoundingClientRect]()
        const bBounds = b[getBoundingClientRect]()

        this.size = aBounds[dimension] + bBounds[dimension] + this.aGutterSize + this.bGutterSize
        this.start = aBounds[position]
    }

    // drag, where all the magic happens. The logic is really quite simple:
    //
    // 1. Ignore if the pair is not dragging.
    // 2. Get the offset of the event.
    // 3. Snap offset to min if within snappable range (within min + snapOffset).
    // 4. Actually adjust each element in the pair to offset.
    //
    // ---------------------------------------------------------------------
    // |    | <- a.minSize               ||              b.minSize -> |    |
    // |    |  | <- this.snapOffset      ||     this.snapOffset -> |  |    |
    // |    |  |                         ||                        |  |    |
    // |    |  |                         ||                        |  |    |
    // ---------------------------------------------------------------------
    // | <- this.start                                        this.size -> |
    function drag (e) {
        const pair = Object.assign({}, pairs[this.pairIndex])

        if (!pair.dragging) return

        const a = elements[pair.a]
        const b = elements[pair.b]

        let eventOffset
        // Get the offset of the event from the first side of the
        // pair `this.start`. Supports touch events, but not multitouch, so only the first
        // finger `touches[0]` is counted.
        if ('touches' in e) {
            eventOffset = e.touches[0][clientAxis] - pair.start
        } else {
            eventOffset = e[clientAxis] - pair.start
        }

        let pairOffset = eventOffset

        if (pushablePanes && pairs.length > 1) {
            let pushedPair

            if (!pair.isFirst && eventOffset < 0) {
                pushedPair = pairs[this.pairIndex - 1]
                console.log(pairOffset)

                pairOffset += pair.start - pushedPair.start
                pair.a = pushedPair.a
                pair.aGutterSize = pushedPair.aGutterSize
            }

            if (!pair.isLast && eventOffset > pair.size) {
                pushedPair = pairs[this.pairIndex + 1]

                pair.b = pushedPair.b
                pair.bGutterSize = pushedPair.bGutterSize
            }

            if (pushedPair !== undefined) {
                calculateSizes.call(pair)
            }
        }

        // If within snapOffset of min or max, set offset to min or max.
        // snapOffset buffers a.minSize and b.minSize, so logic is opposite for both.
        // Include the appropriate gutter sizes to prevent overflows.
        if (pairOffset <= a.minSize + snapOffset + pair.aGutterSize) {
            pairOffset = a.minSize + pair.aGutterSize
        } else if (pairOffset >= pair.size - (b.minSize + snapOffset + pair.bGutterSize)) {
            pairOffset = pair.size - (b.minSize + pair.bGutterSize)
        }

        console.log(pairOffset)
        // Actually adjust the dragged pair size.
        adjust.call(pair, pairOffset)

        // Call the drag callback continously. Don't do anything too intensive
        // in this callback.
        getOption(options, 'onDrag', NOOP)()
    }

    // stopDragging is very similar to startDragging in reverse.
    function stopDragging () {
        const pair = pairs[this.pairIndex]
        const a = elements[pair.a].element
        const b = elements[pair.b].element

        if (pair.dragging) {
            getOption(options, 'onDragEnd', NOOP)()
        }

        pair.dragging = false

        // Remove the stored event listeners. This is why we store them.
        global[removeEventListener]('mouseup', pair.stop)
        global[removeEventListener]('touchend', pair.stop)
        global[removeEventListener]('touchcancel', pair.stop)
        global[removeEventListener]('mousemove', pair.move)
        global[removeEventListener]('touchmove', pair.move)

        // Clear bound function references
        pair.stop = null
        pair.move = null

        a[removeEventListener]('selectstart', NOOP)
        a[removeEventListener]('dragstart', NOOP)
        b[removeEventListener]('selectstart', NOOP)
        b[removeEventListener]('dragstart', NOOP)

        a.style.userSelect = ''
        a.style.webkitUserSelect = ''
        a.style.MozUserSelect = ''
        a.style.pointerEvents = ''

        b.style.userSelect = ''
        b.style.webkitUserSelect = ''
        b.style.MozUserSelect = ''
        b.style.pointerEvents = ''

        pair.gutter.style.cursor = ''
        pair.parent.style.cursor = ''
        document.body.style.cursor = ''
    }

    // startDragging calls `calculateSizes` to store the inital size in the pair object.
    // It also adds event listeners for mouse/touch events,
    // and prevents selection while dragging so avoid the selecting text.
    function startDragging (e) {
        // Alias frequently used variables to save space. 200 bytes.
        const pair = pairs[this.pairIndex]
        const a = elements[pair.a].element
        const b = elements[pair.b].element

        // Call the onDragStart callback.
        if (!pair.dragging) {
            getOption(options, 'onDragStart', NOOP)()
        }

        // Don't actually drag the element. We emulate that in the drag function.
        e.preventDefault()

        // Set the dragging property of the pair object.
        pair.dragging = true

        // Create two event listeners bound to the same pair object and store
        // them in the pair object.
        pair.move = drag.bind(this)
        pair.stop = stopDragging.bind(this)

        // All the binding. `window` gets the stop events in case we drag out of the elements.
        global[addEventListener]('mouseup', pair.stop)
        global[addEventListener]('touchend', pair.stop)
        global[addEventListener]('touchcancel', pair.stop)
        global[addEventListener]('mousemove', pair.move)
        global[addEventListener]('touchmove', pair.move)

        // Disable selection. Disable!
        a[addEventListener]('selectstart', NOOP)
        a[addEventListener]('dragstart', NOOP)
        b[addEventListener]('selectstart', NOOP)
        b[addEventListener]('dragstart', NOOP)

        a.style.userSelect = 'none'
        a.style.webkitUserSelect = 'none'
        a.style.MozUserSelect = 'none'
        a.style.pointerEvents = 'none'

        b.style.userSelect = 'none'
        b.style.webkitUserSelect = 'none'
        b.style.MozUserSelect = 'none'
        b.style.pointerEvents = 'none'

        // Set the cursor at multiple levels
        pair.gutter.style.cursor = cursor
        pair.parent.style.cursor = cursor
        document.body.style.cursor = cursor

        calculateSizes.call(pair)
    }

    // 5. Create pair and element objects. Each pair has an index reference to
    // elements `a` and `b` of the pair (first and second elements).
    // Loop through the elements while pairing them off. Every pair gets a
    // `pair` object, a gutter, and isFirst/isLast properties.
    //
    // Basic logic:
    //
    // - Starting with the second element `i > 0`, create `pair` objects with
    //   `a = i - 1` and `b = i`
    // - Set gutter sizes based on the _pair_ being first/last. The first and last
    //   pair have gutterSize / 2, since they only have one half gutter, and not two.
    // - Create gutter elements and add event listeners.
    // - Set the size of the elements, minus the gutter sizes.
    //
    // -----------------------------------------------------------------------
    // |     i=0     |         i=1         |        i=2       |      i=3     |
    // |             |       isFirst       |                  |     isLast   |
    // |           pair 0                pair 1             pair 2           |
    // |             |                     |                  |              |
    // -----------------------------------------------------------------------
    elements = ids.map((id, i) => {
        // Create the element object.
        const element = {
            element: elementOrSelector(id),
            size: sizes[i],
            minSize: minSizes[i],
        }

        let pair
        const pairIndex = pairs.length

        if (i > 0) {
            // Create the pair object with its metadata.
            pair = {
                a: i - 1,
                b: i,
                dragging: false,
                isFirst: (i === 1),
                isLast: (i === ids.length - 1),
                direction,
                parent,
            }

            // For first and last pairs, first and last gutter width is half.
            pair.aGutterSize = gutterSize
            pair.bGutterSize = gutterSize

            if (pair.isFirst) {
                pair.aGutterSize = gutterSize / 2
            }

            if (pair.isLast) {
                pair.bGutterSize = gutterSize / 2
            }

            // if the parent has a reverse flex-direction, switch the pair elements.
            if (parentFlexDirection === 'row-reverse' || parentFlexDirection === 'column-reverse') {
                const temp = pair.a
                pair.a = pair.b
                pair.b = temp
            }
        }

        // Determine the size of the current element. IE8 is supported by
        // staticly assigning sizes without draggable gutters. Assigns a string
        // to `size`.
        //
        // IE9 and above
        if (!isIE8) {
            // Create gutter elements for each pair.
            if (i > 0) {
                const gutterElement = gutter(i, direction)
                setGutterSize(gutterElement, gutterSize)

                gutterElement[addEventListener]('mousedown', startDragging.bind({ pairIndex }))
                gutterElement[addEventListener]('touchstart', startDragging.bind({ pairIndex }))

                parent.insertBefore(gutterElement, element.element)

                pair.gutter = gutterElement
            }
        }

        // Set the element size to our determined size.
        // Half-size gutters for first and last elements.
        if (i === 0 || i === ids.length - 1) {
            setElementSize(element.element, element.size, gutterSize / 2)
        } else {
            setElementSize(element.element, element.size, gutterSize)
        }

        const computedSize = element.element[getBoundingClientRect]()[dimension]

        if (computedSize < element.minSize) {
            element.minSize = computedSize
        }

        // After the first iteration, and we have a pair object, append it to the
        // list of pairs.
        if (i > 0) {
            pairs.push(pair)
        }

        return element
    })

    function setSizes (newSizes) {
        newSizes.forEach((newSize, i) => {
            if (i > 0) {
                const pair = pairs[i - 1]
                const a = elements[pair.a]
                const b = elements[pair.b]

                a.size = newSizes[i - 1]
                b.size = newSize

                setElementSize(a.element, a.size, pair.aGutterSize)
                setElementSize(b.element, b.size, pair.bGutterSize)
            }
        })
    }

    function destroy () {
        pairs.forEach(pair => {
            pair.parent.removeChild(pair.gutter)
            elements[pair.a].element.style[dimension] = ''
            elements[pair.b].element.style[dimension] = ''
        })
    }

    if (isIE8) {
        return {
            setSizes,
            destroy,
        }
    }

    return {
        setSizes,
        getSizes () {
            return elements.map(element => element.size)
        },
        collapse (i) {
            if (i === pairs.length) {
                const pair = pairs[i - 1]

                calculateSizes.call(pair)

                if (!isIE8) {
                    adjust.call(pair, pair.size - pair.bGutterSize)
                }
            } else {
                const pair = pairs[i]

                calculateSizes.call(pair)

                if (!isIE8) {
                    adjust.call(pair, pair.aGutterSize)
                }
            }
        },
        destroy,
        parent,
        pairs,
    }
}

export default Split
