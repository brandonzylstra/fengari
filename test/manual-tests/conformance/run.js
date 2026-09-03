#!/usr/bin/env node
"use strict";

/*
** Run a Lua file through this checkout of fengari, printing whatever the
** script prints, so that its output can be diffed against a real lua binary.
** See README.md in this directory.
*/

const fs      = require('fs');
const lua     = require('../../../src/lua.js');
const lauxlib = require('../../../src/lauxlib.js');
const lualib  = require('../../../src/lualib.js');
const {to_luastring, to_jsstring} = require("../../../src/fengaricore.js");

const path = process.argv[2];
if (!path) {
    process.stderr.write("usage: run.js <script.lua>\n");
    process.exit(2);
}

const L = lauxlib.luaL_newstate();
lualib.luaL_openlibs(L);

/* the '@' marks the name as a file name, which is what a real lua would do,
   so that error messages carry the same chunk name in both */
if (lauxlib.luaL_loadbuffer(L, fs.readFileSync(path), null, to_luastring("@" + path)) !== lua.LUA_OK) {
    process.stderr.write("compile error: " + to_jsstring(lua.lua_tostring(L, -1)) + "\n");
    process.exit(1);
}
if (lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0) !== lua.LUA_OK) {
    process.stderr.write("runtime error: " + to_jsstring(lauxlib.luaL_tolstring(L, -1)) + "\n");
    process.exit(1);
}
