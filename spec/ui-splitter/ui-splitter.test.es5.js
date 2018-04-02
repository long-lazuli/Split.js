'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};

var isString = function (v) { return typeof v === 'string' || v instanceof String; };
var isIE8 = global['attachEvent'] && !global['addEventListener'];
var cssCalc = ['', '-webkit-', '-moz-', '-o-']
    .filter(function (prefix) {
    var el = document.createElement('div');
    el.style.cssText = "width:" + prefix + "calc(9px)";
    return !!el.style.length;
})
    .shift() + "calc";

var Pane = /** @class */ (function () {
    function Pane(el, options) {
        this.el = el;
        this.options = options;
        this.refreshSize();
    }
    Pane.prototype.refreshSize = function () {
        var o = this.options;
        var bounds = this.el.getBoundingClientRect();
        if (o.isVertical) {
            this.size = bounds['height'];
            this.start = bounds[o.isReverse ? 'bottom' : 'top'];
            this.end = bounds[o.isReverse ? 'right' : 'left'];
        }
        if (o.isVertical) {
            this.size = bounds['width'];
            this.start = bounds[o.isReverse ? 'right' : 'left'];
            this.end = bounds[o.isReverse ? 'bottom' : 'top'];
        }
    };
    return Pane;
}());
var defaultPaneStyleFn = function (p, gs) {
    var style = {};
    var dim = p.options.isVertical ? 'height' : 'width';
    if (!isIE8) {
        style[dim] = cssCalc + "(" + p.size + "% - " + gs + "px)";
    }
    else {
        style[dim] = p.size + "%";
    }
    return style;
};

var defaultGutterStyleFn = function (g) {
    return _a = {}, _a[g.options.isVertical ? 'height' : 'width'] = g.size + "px", _a;
    var _a;
};

var defaultOptions = {
    direction: 'horizontal',
    gutterSize: 10,
    minSize: 100,
    snapOffset: 30,
    pushablePanes: false,
    cursor: 'col-resize',
    paneStyle: defaultPaneStyleFn,
    gutterStyle: defaultGutterStyleFn
};
var UISplitter = /** @class */ (function () {
    function UISplitter(ids, options) {
        if (options === void 0) { options = {}; }
        this.options = __assign({}, defaultOptions, options);
        this.options.cursor =
            options.cursor ||
                (this.options.direction === 'horizontal' ? 'col-resize' : 'row-resize');
        this.options.reverseDirection = false;
        this.panes = this.createPanes(ids);
    }
    UISplitter.prototype.createPanes = function (ids) {
        var _this = this;
        return ids.map(function (i) {
            var el = i;
            if (isString(el)) {
                el = document.querySelector(el);
                if (!el)
                    throw new Error(i + " is not a valid element");
            }
            return new Pane(el, {
                isVertical: _this.options.direction === 'vertical',
                isReverse: _this.options.reversedDirection
            });
        });
    };
    return UISplitter;
}());

describe('UISplitter', function () {
    var a;
    var b;
    beforeEach(function () {
        a = document.createElement('div');
        a.id = 'a';
        document.body.appendChild(a);
        b = document.createElement('div');
        b.id = 'b';
        document.body.appendChild(b);
    });
    it('is instantiable passing DOM elements', function () {
        if (a && b)
            expect(new UISplitter([a, b])).toBeInstanceOf(UISplitter);
    });
    it('is instantiable passing elements by id', function () {
        expect(new UISplitter(['#a', '#b'])).toBeInstanceOf(UISplitter);
    });
    it('has default options if no options are passed to construtor', function () {
        var newSplit = new UISplitter(['#a', '#b']);
        Object.keys(defaultOptions).forEach(function (optKey) {
            return expect(defaultOptions[optKey]).toBe(newSplit.options[optKey]);
        });
    });
    it('has custom options if some are passed to construtor', function () {
        var customOptions = {
            cursor: 'row-resize',
            minSize: 103
        };
        var newSplit = new UISplitter(['#a', '#b'], customOptions);
        Object.keys(customOptions).forEach(function (optKey) {
            return expect(customOptions[optKey]).toBe(newSplit.options[optKey]);
        });
    });
    it('has not the same cursor following direction', function () {
        var horizontalSplit = new UISplitter(['#a', '#b'], {
            direction: 'horizontal'
        });
        var verticalSplit = new UISplitter(['#a', '#b'], {
            direction: 'vertical'
        });
        expect(horizontalSplit.options.cursor).toBe('col-resize');
        expect(verticalSplit.options.cursor).toBe('row-resize');
    });
    it('throws an exception when a passed elements is not found.', function () {
        expect(function () {
            var wrongSplit = new UISplitter(['#a', '#b', '#null']);
        }).toThrow();
    });
    afterEach(function () {
        if (a)
            a.remove();
        a = null;
        if (b)
            b.remove();
        b = null;
    });
});
