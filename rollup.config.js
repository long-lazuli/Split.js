
import buble from 'rollup-plugin-buble'
import uglify from 'rollup-plugin-uglify'
import sourceMaps from 'rollup-plugin-sourcemaps'

const pkg = require('./package.json')

const common = {
    entry: 'src/split.js',
    format: 'umd',
    moduleName: 'Split',
    banner: `/*! Split.js - v${pkg.version} */\n`,
}

export default [Object.assign({}, common, {
    dest: 'split.js',
    plugins: [
        buble(),
        sourceMaps(),
    ],
    sourceMap: true,
}), Object.assign({}, common, {
    dest: 'split.min.js',
    plugins: [
        buble(),
        uglify({
            output: {
                comments: /^!/,
            },
        }),
    ],
})]
