"use strict";

const lua     = require('../src/lua.js');
const lauxlib = require('../src/lauxlib.js');
const lualib  = require('../src/lualib.js');
const {to_luastring} = require("../src/fengaricore.js");

test('os.time', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return os.time()
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_isinteger(L, -1)).toBe(true);
});


test('os.time (with format)', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return os.time({
            day = 8,
            month = 2,
            year = 2015
        })
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tointeger(L, -1))
        .toBe(new Date(2015, 1, 8, 12, 0, 0, 0).getTime() / 1000);
});


test('os.difftime', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local t1 = os.time()
        local t2 = os.time()
        return os.difftime(t2, t1)
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_isnumber(L, -1)).toBe(true);
});


test('os.date', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return os.date('%Y-%m-%d', os.time({
            day = 8,
            month = 2,
            year = 2015
        }))
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe("2015-02-08");
});


test('os.date normalisation', () => { // noah:permit[normalisation] upstream test name, renaming it would break rebasing this fork
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return os.date('%Y-%m-%d', os.time({
            day = 0,
            month = 0,
            year = 2014
        }))
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_tojsstring(L, -1)).toBe("2013-11-30");
});


test('os.date with a leading ! formats in UTC', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        assert(os.date("!%Y-%m-%d %H:%M:%S", 1000000000) == "2001-09-09 01:46:40")
        assert(os.date("!%c", 1000000000) == "Sun Sep  9 01:46:40 2001")
        assert(os.date("!%D %T", 1000000000) == "09/09/01 01:46:40")
        assert(os.date("!%I %p %r", 1000000000) == "01 AM 01:46:40 AM")
        assert(os.date("!") == "", "the ! is not part of the format")
        assert(os.date("!%%") == "%")
        assert(os.date("!%Z") == "UTC")
        assert(os.date("!%z") == "+0000")
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.date("!*t") reads UTC fields', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local t = os.date("!*t", 1000000000)
        assert(t.year == 2001, "correct year")
        assert(t.month == 9, "correct month")
        assert(t.day == 9, "correct day")
        assert(t.hour == 1, "correct hour")
        assert(t.min == 46, "correct min")
        assert(t.sec == 40, "correct sec")
        assert(t.wday == 1, "correct wday")
        assert(t.yday == 252, "correct yday")
        assert(t.isdst == false, "UTC never has daylight saving")
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.date day of year counts 1 January as 1', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        assert(os.date("!%j", 0) == "001")
        assert(os.date("!%j", 1000000000) == "252")
        assert(os.date("!%j", 1104537599) == "366", "2004 was a leap year")
        assert(os.date("!*t", 0).yday == 1)
        assert(os.date("!*t", 1104537599).yday == 366)
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.date week numbers', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        assert(os.date("!%U %W", 0) == "00 00")
        assert(os.date("!%U %W", 1000000000) == "36 36")
        assert(os.date("!%U %W", 1483228800) == "01 00", "1 Jan 2017 was a Sunday")
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.date whitespace specifiers', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        assert(os.date("!%t") == "\\t")
        assert(os.date("!%n") == "\\n")
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.date reports an invalid specifier without the !', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local ok, err = pcall(os.date, "!abc%Qdef")
        assert(not ok)
        assert(err:find("invalid conversion specifier '%Qdef'", 1, true), err)
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.date local fields agree with the local format', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    /* whatever zone the host is in, the broken-down table and the formatted
       string have to describe the same moment */
    let luaCode = `
        for _, when in ipairs({0, 1000000000, 1104537600, 1483228800}) do
            local t = os.date("*t", when)
            assert(os.date("%Y-%m-%d %H:%M:%S", when) ==
                   string.format("%04d-%02d-%02d %02d:%02d:%02d",
                                 t.year, t.month, t.day, t.hour, t.min, t.sec), when)
            assert(os.date("%j", when) == string.format("%03d", t.yday), when)
            assert(os.date("%w", when) == tostring(t.wday - 1), when)
            assert(type(t.isdst) == "boolean", when)
        end
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.time normalisation of table', () => { // noah:permit[normalisation] upstream test name, renaming it would break rebasing this fork
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        local t = {
            day = 20,
            month = 2,
            year = 2018
        }
        os.time(t)
        assert(t.day == 20, "unmodified day")
        assert(t.month == 2, "unmodified month")
        assert(t.year == 2018, "unmodified year")
        assert(t.wday == 3, "correct wday")
        assert(t.yday == 51, "correct yday")
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.setlocale', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        assert("C" == os.setlocale())
        assert("C" == os.setlocale(""))
        assert("C" == os.setlocale("C"))
        assert("C" == os.setlocale("POSIX"))
        assert(nil == os.setlocale("any_other_locale"))
    `;
    lualib.luaL_openlibs(L);
    expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
    lua.lua_call(L, 0, 0);
});


test('os.getenv', () => {
    let L = lauxlib.luaL_newstate();
    if (!L) throw Error("failed to create lua state");

    let luaCode = `
        return os.getenv('PATH')
    `;
    {
        lualib.luaL_openlibs(L);
        expect(lauxlib.luaL_loadstring(L, to_luastring(luaCode))).toBe(lua.LUA_OK);
        lua.lua_call(L, 0, -1);
    }

    expect(lua.lua_isstring(L, -1)).toBe(true);
});
