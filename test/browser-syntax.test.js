/*
** fengari-web bundles src/ through webpack 4, whose parser is acorn 6, and
** through @babel/preset-env with targets old enough that it rewrites '**' to
** Math.pow.  Neither of those runs here: jest hands the sources straight to
** node, which accepts every version of the language.  So a file can pass this
** whole suite and still stop the browser build dead --- a BigInt literal
** (10n) does exactly that, with "Identifier directly after number", and no
** bundle is written at all.
**
** acorn 6 understands up to ES2019, so parsing at that level is the same
** ceiling the browser build has.  It arrives with eslint rather than being
** asked for directly, so a missing copy skips rather than fails.
*/

const fs = require('fs');
const path = require('path');

let acorn = null;
try {
    acorn = require('acorn');
} catch (e) { /* not installed: nothing to check against */ }

const source_directory = path.join(__dirname, '..', 'src');
const sources = fs.readdirSync(source_directory).filter(name => name.endsWith('.js'));

/* ES2019, the newest acorn 6 --- and so webpack 4 --- can parse */
const BROWSER_ECMA_VERSION = 2019;

(acorn ? describe : describe.skip)('the browser bundle can parse src/', () => {
    test.each(sources)('%s', (name) => {
        const source = fs.readFileSync(path.join(source_directory, name), 'utf8');
        expect(() => acorn.parse(source, {
            ecmaVersion: BROWSER_ECMA_VERSION,
            sourceType: 'script'
        })).not.toThrow();
    });
});

/*
** '**' is ES2016, so acorn accepts it, but babel rewrites it to Math.pow for
** targets that predate the operator and Math.pow throws on a BigInt.  The
** conversions in luaconf.js multiply in a loop for that reason.
*/
describe('no exponentiation operator reaches the browser build', () => {
    test.each(sources)('%s', (name) => {
        const source = fs.readFileSync(path.join(source_directory, name), 'utf8');
        const lines = source.split('\n');
        const offenders = [];
        for (let i = 0; i < lines.length; i++)
            if (/[^*]\*\*[^*]/.test(lines[i]) && !/^\s*\*|\/\*/.test(lines[i]))
                offenders.push((i + 1) + ': ' + lines[i].trim());
        expect(offenders).toEqual([]);
    });
});
