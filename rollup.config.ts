import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

const pkg = require('./package.json')

const libraryName = 'ui-splitter'

export default [{
    input: `src/${libraryName}.ts`,
    output: [
        {
            file: pkg['module'],
            format: 'es',
            sourcemap: true
        },
        {
            file: pkg['main'],
            name: camelCase(libraryName),
            format: 'umd',
            sourcemap: true
        },
        {
            file: pkg['minified:main'],
            name: camelCase(libraryName),
            format: 'umd',
            plugins: [
                uglify({ output: { comments: /^!/, }, }, minify)
            ],
            sourcemap: true
        },
    ],
    watch: {
        include: 'src/**',
    },
    plugins: [
        json(),
        typescript({ useTsconfigDeclarationDir: true }),
        commonjs(),
        resolve(),
        sourceMaps()
    ],
}, {
    input: `spec/${libraryName}.test.ts`,
    output: [
        {
            file: pkg['test:es5'],
            name: camelCase(libraryName),
            format: 'cjs'
        },
    ],
    external: ['UISplitter', 'UISplitterOptions', 'defaultOptions'],
    watch: {
        include: 'spec/ui-splitter.test.ts'
    },
    plugins: [
        typescript({
            "useTsconfigDeclarationDir": false,
            "tsconfig": "tsconfig.test.json"
        }),
    ],
}]
