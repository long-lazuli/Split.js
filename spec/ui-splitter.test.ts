import UISplitter, { defaultOptions, UISplitterOptions } from "../src/ui-splitter"

import {isIE8} from "../src/lib/utils"

let a: Element | null
let b: Element | null

const createElements = function() {
    a = document.createElement('div')
    a.id = 'a'
    document.body.appendChild(a)

    b = document.createElement('div')
    b.id = 'b'
    document.body.appendChild(b)
}

const removeElements = function() {
    if (a) a.remove()
    a = null

    if (b) b.remove()
    b = null
}

describe('UISplitter - Dummy', () => {

    beforeEach( createElements )
    afterEach( removeElements )

    // it('is instantiable passing DOM elements', () => {
    //     if (a && b) expect(new UISplitter([a, b])).toBeInstanceOf(UISplitter)
    // })
    //
    // it('is instantiable passing elements by id', () => {
    //     expect(new UISplitter(['#a', '#b'])).toBeInstanceOf(UISplitter)
    // })

    it('has default options if no options are passed to construtor', () => {
        const newSplit = new UISplitter(['#a', '#b'])
        Object.keys(defaultOptions).forEach(optKey =>
            expect((defaultOptions as any)[optKey]).toBe(newSplit.options[optKey])
        )
    })
    it('throws an exception when a passed elements is not found.', () => {
        expect(() => {
            const wrongSplit = new UISplitter(['#a', '#b', '#null'])
        }).toThrow()
    })

})

if( !isIE8 ){

    describe('UISplitter', () => {

        beforeEach( createElements )
        afterEach( removeElements )

        it('has custom options if some are passed to construtor', () => {
            const customOptions: Partial<UISplitterOptions> = {
                cursor: 'row-resize',
                minSize: 103
            }
            const newSplit = new UISplitter(['#a', '#b'], customOptions)
            Object.keys(customOptions).forEach(optKey =>
                expect((customOptions as any)[optKey]).toBe(newSplit.options[optKey])
            )
        })

        it('has not the same cursor following direction', () => {
            const horizontalSplit = new UISplitter(['#a', '#b'], {
                direction: 'horizontal'
            })
            const verticalSplit = new UISplitter(['#a', '#b'], {
                direction: 'vertical'
            })
            expect(horizontalSplit.options.cursor).toBe('col-resize')
            expect(verticalSplit.options.cursor).toBe('row-resize')
        })

    })

} else {

    describe('UISplitter - IE8 behavior', () => {

        beforeEach( createElements )
        afterEach( removeElements )

        it('has custom options if some are passed to construtor', () => {
            const customOptions: Partial<UISplitterOptions> = {
                cursor: 'row-resize',
                minSize: 103
            }
            const newSplit = new UISplitter(['#a', '#b'], customOptions)
            Object.keys(customOptions).forEach(optKey =>
                expect((customOptions as any)[optKey]).toBe(newSplit.options[optKey])
            )
        })

        it('has not the same cursor following direction', () => {
            const horizontalSplit = new UISplitter(['#a', '#b'], {
                direction: 'horizontal'
            })
            const verticalSplit = new UISplitter(['#a', '#b'], {
                direction: 'vertical'
            })
            expect(horizontalSplit.options.cursor).toBe('col-resize')
            expect(verticalSplit.options.cursor).toBe('row-resize')
        })

    })

}
