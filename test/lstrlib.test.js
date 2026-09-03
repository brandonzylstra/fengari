"use strict";

const lua = require('../src/lua.js');
const lauxlib = require('../src/lauxlib.js');
const lualib = require('../src/lualib.js');
const {to_luastring} = require("../src/fengaricore.js");

test('string.len', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local a = "world"
        return string.len("hello"), a:len()
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tointeger(L, -2)).toBe(5);
    expect(lua.lua_tointeger(L, -1)).toBe(5);
});


test('string.char', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.char(104, 101, 108, 108, 111)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe("hello");
});


test('string.upper, string.lower', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.upper("hello"), string.lower("HELLO")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -2)).toBe("HELLO");
    expect(lua.lua_tojsstring(L, -1)).toBe("hello");
});


test('string.rep', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.rep("hello", 3, ", ")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe("hello, hello, hello");
});


test('string.reverse', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.reverse("olleh")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe("hello");
});


test('string.byte', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.byte("hello", 2, 4)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tointeger(L, -3)).toBe(101);
    expect(lua.lua_tointeger(L, -2)).toBe(108);
    expect(lua.lua_tointeger(L, -1)).toBe(108);
});


test('string.format', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.format("%%%d %010d", 10, 23)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe("%10 0000000023");
});


test('string.format', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.format("%07X", 0xFFFFFFF)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe("FFFFFFF");
});


test('string.format', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.format("%q", 'a string with "quotes" and \\n new line')
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe('"a string with \\"quotes\\" and \\\n new line"',
        "Correct element(s) on the stack"
    );
});


test('string.format of floats follows C, not JavaScript', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    /* every expectation here was taken from a real lua, not from memory */
    let luaCode = `
        local function eq(got, want)
            assert(got == want, "got " .. got .. ", wanted " .. want)
        end
        -- an exponent always has at least two digits, and %g picks the
        -- exponent form outside 10^-4 .. 10^precision
        eq(string.format("%e", 123456.0), "1.234560e+05")
        eq(string.format("%E", 0.5), "5.000000E-01")
        eq(string.format("%g", 100000.0), "100000")
        eq(string.format("%g", 1000000.0), "1e+06")
        eq(string.format("%g", 0.0001), "0.0001")
        eq(string.format("%g", 0.00001), "1e-05")
        eq(string.format("%.14g", 1e14), "1e+14")
        eq(string.format("%.14g", 1e13), "10000000000000")
        eq(string.format("%.17g", 0.1), "0.10000000000000001")
        eq(string.format("%g", 0.1 + 0.2), "0.3")
        eq(string.format("%.17g", 0.1 + 0.2), "0.30000000000000004")
        -- halfway cases round to even, where JavaScript rounds away from zero
        eq(string.format("%.0f", 0.5), "0")
        eq(string.format("%.0f", 1.5), "2")
        eq(string.format("%.0f", 2.5), "2")
        eq(string.format("%.0f", 3.5), "4")
        eq(string.format("%.1f", 0.25), "0.2")
        eq(string.format("%.1f", 0.75), "0.8")
        -- infinities and NaN spell out the C way, and NaN takes no sign
        eq(string.format("%f", math.huge), "inf")
        eq(string.format("%+g", math.huge), "+inf")
        eq(string.format("%g", -math.huge), "-inf")
        eq(string.format("%+f", 0/0), "nan")
        eq(string.format("%E", math.huge), "INF")
        eq(string.format("%08.1f", math.huge), "     inf")
        -- zero keeps its sign, and '#' keeps the point
        eq(string.format("%g", -0.0), "-0")
        eq(string.format("%.0f", -0.0), "-0")
        eq(string.format("%#.0f", 1.0), "1.")
        eq(string.format("%#g", 123456.0), "123456.")
        eq(string.format("%#.1g", 123456.0), "1.e+05")
        -- width, padding and sign flags
        eq(string.format("%12.4f", 0.5), "      0.5000")
        eq(string.format("%-12.4f", 0.5), "0.5000      ")
        eq(string.format("%012.4f", -0.5), "-000000.5000")
        eq(string.format("% .3f", 0.5), " 0.500")
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('string.format of integers follows C, including the # flag', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local function eq(got, want)
            assert(got == want, "got " .. got .. ", wanted " .. want)
        end
        -- '#' spells out the base; sprintf-js had no such flag and threw
        eq(string.format("%#x", 255), "0xff")
        eq(string.format("%#X", 255), "0XFF")
        eq(string.format("%#o", 255), "0377")
        eq(string.format("%#x", 0), "0", "no prefix on zero")
        eq(string.format("%#o", 0), "0")
        eq(string.format("%-#10x", 255), "0xff      ")
        -- a precision on an integer is a minimum number of digits, and it
        -- turns off zero padding
        eq(string.format("%.5d", 42), "00042")
        eq(string.format("%.5d", -42), "-00042")
        eq(string.format("%8.5x", 255), "   000ff")
        eq(string.format("%08.5x", 255), "   000ff")
        eq(string.format("%.0d", 0), "", "zero with precision zero prints nothing")
        eq(string.format("%.0d", 1), "1")
        -- the other conversions and flags
        eq(string.format("%o", 8), "10")
        eq(string.format("%u", 255), "255")
        eq(string.format("%05d", -255), "-0255")
        eq(string.format("%+d", 255), "+255")
        eq(string.format("% d", 255), " 255")
        eq(string.format("%-5d", 42), "42   ")
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('tostring of a float matches LUA_NUMBER_FMT', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        assert(tostring(math.huge) == "inf")
        assert(tostring(-math.huge) == "-inf")
        assert(tostring(0/0) == "nan")
        assert(tostring(-0.0) == "-0.0")
        assert(tostring(1.0) == "1.0")
        assert(tostring(100.0) == "100.0")
        assert(tostring(0.5) == "0.5")
        assert(tostring(1e14) == "1e+14")
        assert(tostring(1e13) == "10000000000000.0")
        assert(tostring(1/3) == "0.33333333333333")
        assert(tostring(1e-5) == "1e-05")
        assert("" .. math.huge == "inf")
        assert("" .. 1.5 == "1.5")
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('string.sub', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.sub("123456789",2,4),  -- "234"
            string.sub("123456789",7),       -- "789"
            string.sub("123456789",7,6),     --  ""
            string.sub("123456789",7,7),     -- "7"
            string.sub("123456789",0,0),     --  ""
            string.sub("123456789",-10,10),  -- "123456789"
            string.sub("123456789",1,9),     -- "123456789"
            string.sub("123456789",-10,-20), --  ""
            string.sub("123456789",-1),      -- "9"
            string.sub("123456789",-4),      -- "6789"
            string.sub("123456789",-6, -4)   -- "456"
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -11)).toBe("234");
    expect(lua.lua_tojsstring(L, -10)).toBe("789");
    expect(lua.lua_tojsstring(L, -9)).toBe("");
    expect(lua.lua_tojsstring(L, -8)).toBe("7");
    expect(lua.lua_tojsstring(L, -7)).toBe("");
    expect(lua.lua_tojsstring(L, -6)).toBe("123456789");
    expect(lua.lua_tojsstring(L, -5)).toBe("123456789");
    expect(lua.lua_tojsstring(L, -4)).toBe("");
    expect(lua.lua_tojsstring(L, -3)).toBe("9");
    expect(lua.lua_tojsstring(L, -2)).toBe("6789");
    expect(lua.lua_tojsstring(L, -1)).toBe("456");
});


test('string.dump', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local todump = function()
            local s = "hello"
            local i = 12
            local f = 12.5
            local b = true

            return s .. i .. f
        end

        return string.dump(todump)
    `;
    {
        lualib.luaL_openlibs(L);
        lauxlib.luaL_loadstring(L, to_luastring(luaCode.trim()));
        lua.lua_call(L, 0, -1);
        let str = lua.lua_tostring(L, -1);
        lua.lua_load(L, function(L, s) {
            let r = s.str;
            s.str = null;
            return r;
        }, {str: str}, to_luastring("test"), to_luastring("binary"));
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe("hello1212.5");
});


test('string.pack/unpack/packsize', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local s1, n, s2 = "hello", 2, "you"
        local packed = string.pack("c5jc3", s1, n, s2)
        local us1, un, us2 = string.unpack("c5jc3", packed)
        return string.packsize("c5jc3"), s1 == us1 and n == un and s2 == us2
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tointeger(L, -2)).toBe(12);
    expect(lua.lua_toboolean(L, -1)).toBe(true);
});


test('string.find without pattern', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.find("hello to you", " to ")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tointeger(L, -2)).toBe(6);
    expect(lua.lua_tointeger(L, -1)).toBe(9);
});


test('string.find with special pattern (issue #185)', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.find("-", "-")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_gettop(L)).toBe(2);
    expect(lua.lua_tointeger(L, -2)).toBe(1);
    expect(lua.lua_tointeger(L, -1)).toBe(1);
});


test('string.match', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.match("foo: 123 bar: 456", "(%a+):%s*(%d+)")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -2)).toBe("foo");
    expect(lua.lua_tojsstring(L, -1)).toBe("123");
});


test('string.find', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.find("foo: 123 bar: 456", "(%a+):%s*(%d+)")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tointeger(L, -4)).toBe(1);
    expect(lua.lua_tointeger(L, -3)).toBe(8);
    expect(lua.lua_tojsstring(L, -2)).toBe("foo");
    expect(lua.lua_tojsstring(L, -1)).toBe("123");
});


test('string.gmatch', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local s = "hello world from Lua"
        local t = {}

        for w in string.gmatch(s, "%a+") do
            table.insert(t, w)
        end

        return table.unpack(t)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -4)).toBe("hello");
    expect(lua.lua_tojsstring(L, -3)).toBe("world");
    expect(lua.lua_tojsstring(L, -2)).toBe("from");
    expect(lua.lua_tojsstring(L, -1)).toBe("Lua");
});


test('string.gsub', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.gsub("hello world", "(%w+)", "%1 %1")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -2)).toBe("hello hello world world");
    expect(lua.lua_tointeger(L, -1)).toBe(2);
});


test('string.gsub (number)', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.gsub("hello world", "%w+", "%0 %0", 1)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -2)).toBe("hello hello world");
    expect(lua.lua_tointeger(L, -1)).toBe(1);
});


test('string.gsub (pattern)', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.gsub("hello world from Lua", "(%w+)%s*(%w+)", "%2 %1")
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -2)).toBe("world hello Lua from");
    expect(lua.lua_tointeger(L, -1)).toBe(2);
});


test('string.gsub (function)', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return string.gsub("4+5 = $return 4+5$", "%$(.-)%$", function (s)
            return load(s)()
        end)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -2)).toBe("4+5 = 9");
    expect(lua.lua_tointeger(L, -1)).toBe(1);
});



test('string.gsub (table)', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local t = {name="lua", version="5.3"}
        return string.gsub("$name-$version.tar.gz", "%$(%w+)", t)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -2)).toBe("lua-5.3.tar.gz");
    expect(lua.lua_tointeger(L, -1)).toBe(2);
});
