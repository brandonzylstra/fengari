"use strict";

const conf = (process.env.FENGARICONF ? JSON.parse(process.env.FENGARICONF) : {});

const {
    LUA_VERSION_MAJOR,
    LUA_VERSION_MINOR,
    to_luastring
} = require('./defs.js');

/*
** LUA_PATH_SEP is the character that separates templates in a path.
** LUA_PATH_MARK is the string that marks the substitution points in a
** template.
** LUA_EXEC_DIR in a Windows path is replaced by the executable's
** directory.
*/
const LUA_PATH_SEP  = ";";
module.exports.LUA_PATH_SEP = LUA_PATH_SEP;

const LUA_PATH_MARK = "?";
module.exports.LUA_PATH_MARK = LUA_PATH_MARK;

const LUA_EXEC_DIR  = "!";
module.exports.LUA_EXEC_DIR = LUA_EXEC_DIR;

/*
@@ LUA_PATH_DEFAULT is the default path that Lua uses to look for
** Lua libraries.
@@ LUA_JSPATH_DEFAULT is the default path that Lua uses to look for
** JS libraries.
** CHANGE them if your machine has a non-conventional directory
** hierarchy or if you want to install your libraries in
** non-conventional directories.
*/
const LUA_VDIR = LUA_VERSION_MAJOR + "." + LUA_VERSION_MINOR;
module.exports.LUA_VDIR = LUA_VDIR;

if (typeof process === "undefined") {
    const LUA_DIRSEP = "/";
    module.exports.LUA_DIRSEP = LUA_DIRSEP;

    const LUA_LDIR = "./lua/" + LUA_VDIR + "/";
    module.exports.LUA_LDIR = LUA_LDIR;

    const LUA_JSDIR = LUA_LDIR;
    module.exports.LUA_JSDIR = LUA_JSDIR;

    const LUA_PATH_DEFAULT = to_luastring(
        LUA_LDIR + "?.lua;" + LUA_LDIR + "?/init.lua;" +
        /* LUA_JSDIR excluded as it is equal to LUA_LDIR */
        "./?.lua;./?/init.lua"
    );
    module.exports.LUA_PATH_DEFAULT = LUA_PATH_DEFAULT;

    const LUA_JSPATH_DEFAULT = to_luastring(
        LUA_JSDIR + "?.js;" + LUA_JSDIR + "loadall.js;./?.js"
    );
    module.exports.LUA_JSPATH_DEFAULT = LUA_JSPATH_DEFAULT;
} else if (require('os').platform() === 'win32') {
    const LUA_DIRSEP = "\\";
    module.exports.LUA_DIRSEP = LUA_DIRSEP;

    /*
    ** In Windows, any exclamation mark ('!') in the path is replaced by the
    ** path of the directory of the executable file of the current process.
    */
    const LUA_LDIR = "!\\lua\\";
    module.exports.LUA_LDIR = LUA_LDIR;

    const LUA_JSDIR = "!\\";
    module.exports.LUA_JSDIR = LUA_JSDIR;

    const LUA_SHRDIR = "!\\..\\share\\lua\\" + LUA_VDIR + "\\";
    module.exports.LUA_SHRDIR = LUA_SHRDIR;

    const LUA_PATH_DEFAULT = to_luastring(
        LUA_LDIR + "?.lua;" + LUA_LDIR + "?\\init.lua;" +
        LUA_JSDIR + "?.lua;" + LUA_JSDIR + "?\\init.lua;" +
        LUA_SHRDIR + "?.lua;" + LUA_SHRDIR + "?\\init.lua;" +
        ".\\?.lua;.\\?\\init.lua"
    );
    module.exports.LUA_PATH_DEFAULT = LUA_PATH_DEFAULT;

    const LUA_JSPATH_DEFAULT = to_luastring(
        LUA_JSDIR + "?.js;" +
        LUA_JSDIR + "..\\share\\lua\\" + LUA_VDIR + "\\?.js;" +
        LUA_JSDIR + "loadall.js;.\\?.js"
    );
    module.exports.LUA_JSPATH_DEFAULT = LUA_JSPATH_DEFAULT;
} else {
    const LUA_DIRSEP = "/";
    module.exports.LUA_DIRSEP = LUA_DIRSEP;

    const LUA_ROOT = "/usr/local/";
    module.exports.LUA_ROOT = LUA_ROOT;
    const LUA_ROOT2 = "/usr/";

    const LUA_LDIR = LUA_ROOT + "share/lua/" + LUA_VDIR + "/";
    const LUA_LDIR2 = LUA_ROOT2 + "share/lua/" + LUA_VDIR + "/";
    module.exports.LUA_LDIR = LUA_LDIR;

    const LUA_JSDIR = LUA_LDIR;
    module.exports.LUA_JSDIR = LUA_JSDIR;
    const LUA_JSDIR2 = LUA_LDIR2;

    const LUA_PATH_DEFAULT = to_luastring(
        LUA_LDIR + "?.lua;" + LUA_LDIR + "?/init.lua;" +
        LUA_LDIR2 + "?.lua;" + LUA_LDIR2 + "?/init.lua;" +
        /* LUA_JSDIR(2) excluded as it is equal to LUA_LDIR(2) */
        "./?.lua;./?/init.lua"
    );
    module.exports.LUA_PATH_DEFAULT = LUA_PATH_DEFAULT;

    const LUA_JSPATH_DEFAULT = to_luastring(
        LUA_JSDIR + "?.js;" + LUA_JSDIR + "loadall.js;" +
        LUA_JSDIR2 + "?.js;" + LUA_JSDIR2 + "loadall.js;" +
        "./?.js"
    );
    module.exports.LUA_JSPATH_DEFAULT = LUA_JSPATH_DEFAULT;
}

/*
@@ LUA_COMPAT_FLOATSTRING makes Lua format integral floats without a
@@ a float mark ('.0').
** This macro is not on by default even in compatibility mode,
** because this is not really an incompatibility.
*/
const LUA_COMPAT_FLOATSTRING = conf.LUA_COMPAT_FLOATSTRING || false;

const LUA_MAXINTEGER = 2147483647;
const LUA_MININTEGER = -2147483648;

/*
@@ LUAI_MAXSTACK limits the size of the Lua stack.
** CHANGE it if you need a different limit. This limit is arbitrary;
** its only purpose is to stop Lua from consuming unlimited stack
** space (and to reserve some numbers for pseudo-indices).
*/
const LUAI_MAXSTACK = conf.LUAI_MAXSTACK || 1000000;

/*
@@ LUA_IDSIZE gives the maximum size for the description of the source
@@ of a function in debug information.
** CHANGE it if you want a different size.
*/
const LUA_IDSIZE = conf.LUA_IDSIZE || (60-1); /* fengari uses 1 less than lua as we don't embed the null byte */

const lua_integer2str = function(n) {
    return String(n); /* should match behaviour of LUA_INTEGER_FMT */ // noah:permit[behaviour] upstream comment, rewording it would break rebasing this fork
};

/*
** C's printf conversions for floats, which JS has no equivalent of:
** 'toPrecision' and friends round the same way but lay the result out by
** JavaScript's rules, so they disagree with C about when to use an exponent,
** how many digits that exponent has, and where the trailing zeros go.
**
** Every finite double is exactly m * 2^e for integers m and e, and for a
** negative e that is m * 5^-e / 10^-e, so a double always has a terminating
** decimal expansion. Holding that expansion as a BigInt of digits plus a
** count of how many of them are fractional lets every conversion round off
** the exact value, half to even, exactly as C does.
*/
/*
** A BigInt literal (10n) is ES2020 syntax, and the toolchains a browser build
** goes through cannot all parse it -- fengari-web's webpack 4 and babel stop
** with "Identifier directly after number" and emit no bundle at all. The
** BigInt function is an ordinary call that every one of them passes through,
** so the constants below stand in for the literals. '**' is avoided on a
** BigInt for the same reason: babel rewrites it to Math.pow for targets that
** predate the operator, and Math.pow cannot take a BigInt.
*/
const BIG_0  = BigInt(0);
const BIG_1  = BigInt(1);
const BIG_2  = BigInt(2);
const BIG_5  = BigInt(5);
const BIG_10 = BigInt(10);
const BIG_32 = BigInt(32);
const BIG_52 = BigInt(52);

const pow10cache = [BIG_1];
const pow10 = function(n) {
    for (let i = pow10cache.length; i <= n; i++)
        pow10cache[i] = pow10cache[i - 1] * BIG_10;
    return pow10cache[n];
};

const pow5cache = [BIG_1];
const pow5 = function(n) {
    for (let i = pow5cache.length; i <= n; i++)
        pow5cache[i] = pow5cache[i - 1] * BIG_5;
    return pow5cache[n];
};

const bits = new DataView(new ArrayBuffer(8));

/* number of low zero bits of a non-zero 32 bit word */
const ctz32 = function(n) {
    return 31 - Math.clz32(n & -n);
};

/* the exponent e for which x is exactly (some odd integer) * 2^e */
const odd_exponent = function(x) {  /* x must be finite, non-zero and positive */
    bits.setFloat64(0, x);
    let hi = bits.getUint32(0);
    let lo = bits.getUint32(4);
    let biased = (hi >>> 20) & 0x7FF;
    let top = (hi & 0xFFFFF) | (biased === 0 ? 0 : 0x100000);
    return (biased === 0 ? -1074 : biased - 1075)
         + (lo !== 0 ? ctz32(lo) : 32 + ctz32(top));
};

/* the same mantissa and exponent, this time with the mantissa itself */
const float2parts = function(x) {  /* x must be finite, non-zero and positive */
    bits.setFloat64(0, x);
    let hi = bits.getUint32(0);
    let biased = (hi >>> 20) & 0x7FF;
    let m = (BigInt(hi & 0xFFFFF) << BIG_32) | BigInt(bits.getUint32(4));
    let e = biased - 1075;
    if (biased === 0)  /* denormal */
        e = -1074;
    else
        m |= BIG_1 << BIG_52;
    let shift = BigInt(odd_exponent(x) - e);
    return { m: m >> shift, e: e + Number(shift) };
};

const float2decimal = function(x) {  /* x must be finite, non-zero and positive */
    let p = float2parts(x);
    if (p.e >= 0)
        return { digits: p.m << BigInt(p.e), scale: 0 };
    return { digits: p.m * pow5(-p.e), scale: -p.e };
};

/*
** Does rounding x at 'place' digits after the decimal point fall exactly
** halfway? With x as an odd m times 2^e, x * 10^place is
** m * 2^(e+place) * 5^place, whose fractional part is one half only when
** e + place + 1 is zero -- and, for a negative place, only when 5^-place
** divides m as well. JS rounds such a tie away from zero and C rounds it to
** even, so this is the one case the built-in conversions cannot be trusted
** with; everywhere else they are correctly rounded and far quicker than
** expanding the whole exact decimal.
*/
const halfway = function(x, place) {
    if (odd_exponent(x) + place + 1 !== 0) return false;
    if (place >= 0) return true;
    return float2parts(x).m % pow5(-place) === BIG_0;
};

/* round digits/10^scale to 'want' fractional digits, half to even */
const round_decimal = function(digits, scale, want) {
    if (want >= scale)
        return digits * pow10(want - scale);
    let div = pow10(scale - want);
    let q = digits / div;
    let rest = digits % div;
    let half = div / BIG_2;
    if (rest > half || (rest === half && (q & BIG_1) === BIG_1))
        q += BIG_1;
    return q;
};

const significant_exact = function(x, sig) {
    let d = float2decimal(x);
    let want = d.scale - d.digits.toString().length + sig;
    let r = round_decimal(d.digits, d.scale, want).toString();
    if (r.length > sig) {  /* rounding carried into a new digit: 999 -> 1000 */
        r = r.slice(0, sig);
        want--;
    }
    return { digits: r, exp: sig - 1 - want };
};

/* x rounded to 'sig' significant digits, as those digits and the exponent X
   for which the value reads d1.d2...dsig times ten to the X */
const significant = function(x, sig) {
    if (x === 0)
        return { digits: "0".repeat(sig), exp: 0 };
    if (sig > 100)  /* beyond what toExponential will do */
        return significant_exact(x, sig);
    let s = x.toExponential(sig - 1);
    let at = s.indexOf("e");
    let exp = parseInt(s.slice(at + 1), 10);
    /* rounding may have carried the exponent up, so the value's own exponent
       is 'exp' or one less; a tie needs 'sig - 1 - X' to be '-e - 1', so a
       tie is only in reach for these two */
    if (halfway(x, sig - 1 - exp) || halfway(x, sig - exp))
        return significant_exact(x, sig);
    return { digits: s.slice(0, at).replace(".", ""), exp: exp };
};

const exponent_part = function(exp, upper) {
    let e = exp < 0 ? -exp : exp;
    let digits = String(e);
    return (upper ? "E" : "e")
        + (exp < 0 ? "-" : "+")
        + (digits.length < 2 ? "0" + digits : digits);
};

const strip_trailing_zeros = function(s) {  /* what '%g' does without '#' */
    if (s.indexOf(".") < 0) return s;
    s = s.replace(/0+$/, "");
    return s.charAt(s.length - 1) === "." ? s.slice(0, -1) : s;
};

/* '#' keeps the decimal point that a precision of zero would otherwise leave off */
const format_f = function(x, prec, alt) {
    let r;
    if (x === 0)
        r = prec === 0 ? "0" : "0." + "0".repeat(prec);
    else if (x < 1e21 && prec <= 100 && !halfway(x, prec))
        r = x.toFixed(prec);  /* correctly rounded, and no tie to worry about */
    else {
        let d = float2decimal(x);
        let digits = round_decimal(d.digits, d.scale, prec).toString();
        if (prec === 0)
            r = digits;
        else {
            if (digits.length <= prec) digits = "0".repeat(prec - digits.length + 1) + digits;
            r = digits.slice(0, digits.length - prec) + "." + digits.slice(digits.length - prec);
        }
    }
    return (alt && prec === 0) ? r + "." : r;
};

const format_e = function(x, prec, upper, alt) {
    let r = significant(x, prec + 1);
    return r.digits.charAt(0)
        + (prec > 0 ? "." + r.digits.slice(1) : (alt ? "." : ""))
        + exponent_part(r.exp, upper);
};

const format_g = function(x, prec, upper, alt) {
    if (prec === 0) prec = 1;
    let r = significant(x, prec);
    if (r.exp < -4 || r.exp >= prec) {  /* too big or too small: use '%e' */
        let mantissa = r.digits.charAt(0) + (prec > 1 ? "." + r.digits.slice(1) : "");
        if (alt)
            mantissa = mantissa.indexOf(".") < 0 ? mantissa + "." : mantissa;
        else
            mantissa = strip_trailing_zeros(mantissa);
        return mantissa + exponent_part(r.exp, upper);
    }
    let s = format_f(x, prec - 1 - r.exp, alt);
    return alt ? s : strip_trailing_zeros(s);
};

/*
** The body of a C float conversion for a non-negative x: no sign, no width
** and no padding, all of which belong to the caller.
*/
const lua_float2str = function(conv, prec, alt, x) {
    switch (conv) {
        case "e": return format_e(x, prec, false, alt);
        case "E": return format_e(x, prec, true, alt);
        case "f": case "F": return format_f(x, prec, alt);
        case "g": return format_g(x, prec, false, alt);
        case "G": return format_g(x, prec, true, alt);
    }
};

/*
@@ LUA_NUMBER_PREC is the number of significant digits 'tostring' shows for a
** float. Lua 5.3 and 5.4 use 14; Lua 5.5 uses 17. It is the whole of
** LUA_NUMBER_FMT below, kept apart so that the two cannot drift.
*/
const LUA_NUMBER_PREC = 14;

const lua_number2str = function(n) {
    /* matches LUA_NUMBER_FMT */
    if (n !== n) return "nan";
    if (n === Infinity) return "inf";
    if (n === -Infinity) return "-inf";
    let s = format_g(n < 0 ? -n : n, LUA_NUMBER_PREC, false, false);
    return (n < 0 || Object.is(n, -0)) ? "-" + s : s;
};

const lua_numbertointeger = function(n) {
    return n >= LUA_MININTEGER && n < -LUA_MININTEGER ? n : false;
};

const LUA_INTEGER_FRMLEN = "";
const LUA_NUMBER_FRMLEN = "";

const LUA_INTEGER_FMT = `%${LUA_INTEGER_FRMLEN}d`;
const LUA_NUMBER_FMT  = `%.${LUA_NUMBER_PREC}g`;

const lua_getlocaledecpoint = function() {
    /* we hard-code the decimal point to '.' as a user cannot change the
       locale in most JS environments, and in that you can, a multi-byte
       locale is common.
    */
    return 46 /* '.'.charCodeAt(0) */;
};

/*
@@ LUAL_BUFFERSIZE is the buffer size used by the lauxlib buffer system.
*/
const LUAL_BUFFERSIZE = conf.LUAL_BUFFERSIZE || 8192;

// See: http://croquetweak.blogspot.fr/2014/08/deconstructing-floats-frexp-and-ldexp.html
const frexp = function(value) {
    if (value === 0) return [value, 0];
    var data = new DataView(new ArrayBuffer(8));
    data.setFloat64(0, value);
    var bits = (data.getUint32(0) >>> 20) & 0x7FF;
    if (bits === 0) { // denormal
        data.setFloat64(0, value * Math.pow(2, 64));  // exp + 64
        bits = ((data.getUint32(0) >>> 20) & 0x7FF) - 64;
    }
    var exponent = bits - 1022;
    var mantissa = ldexp(value, -exponent);
    return [mantissa, exponent];
};

const ldexp = function(mantissa, exponent) {
    var steps = Math.min(3, Math.ceil(Math.abs(exponent) / 1023));
    var result = mantissa;
    for (var i = 0; i < steps; i++)
        result *= Math.pow(2, Math.floor((exponent + i) / steps));
    return result;
};

module.exports.LUAI_MAXSTACK          = LUAI_MAXSTACK;
module.exports.LUA_COMPAT_FLOATSTRING = LUA_COMPAT_FLOATSTRING;
module.exports.LUA_IDSIZE             = LUA_IDSIZE;
module.exports.LUA_INTEGER_FMT        = LUA_INTEGER_FMT;
module.exports.LUA_INTEGER_FRMLEN     = LUA_INTEGER_FRMLEN;
module.exports.LUA_MAXINTEGER         = LUA_MAXINTEGER;
module.exports.LUA_MININTEGER         = LUA_MININTEGER;
module.exports.LUA_NUMBER_FMT         = LUA_NUMBER_FMT;
module.exports.LUA_NUMBER_FRMLEN      = LUA_NUMBER_FRMLEN;
module.exports.LUAL_BUFFERSIZE        = LUAL_BUFFERSIZE;
module.exports.frexp                  = frexp;
module.exports.ldexp                  = ldexp;
module.exports.lua_getlocaledecpoint  = lua_getlocaledecpoint;
module.exports.lua_float2str          = lua_float2str;
module.exports.lua_integer2str        = lua_integer2str;
module.exports.lua_number2str         = lua_number2str;
module.exports.lua_numbertointeger    = lua_numbertointeger;
