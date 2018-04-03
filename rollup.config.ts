import resolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble';
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

    // UMD
    input: `src/${libraryName}.ts`,
    output: [
        {
            file: pkg['module'],
            format: 'es',
            sourcemap: true
        }
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
    ]

}, {

    // es5
    input: `src/${libraryName}.ts`,
    output: [
        {
            file: pkg['main'],
            name: camelCase(libraryName),
            format: 'es',
            sourcemap: true
        }
    ],
    watch: {
        include: 'src/**',
    },
    plugins: [
        json(),
        typescript({ useTsconfigDeclarationDir: true }),
        commonjs(),
        resolve(),
        buble(),
        sourceMaps()
    ]

}, {

    // minified
    input: `src/${libraryName}.ts`,
    output: [
        {
            file: pkg['minified:main'],
            name: camelCase(libraryName),
            format: 'es',
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
        buble(),
        uglify({}, minify),
        sourceMaps()
    ]

}, {

    // Compile test for jasmine SpecRunner
    input: `spec/${libraryName}.test.ts`,
    output: [
        {
            name: camelCase(libraryName),
            format: 'umd',
            file: pkg['test:es5']
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
        commonjs(),
        resolve(),
        buble()
    ]

}]
