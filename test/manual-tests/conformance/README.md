Differential conformance probes
===============================

These scripts run through a real `lua` and through this checkout of fengari,
and the two outputs are diffed. Anything that differs is either a fengari bug,
a deliberate fengari extension, or drift between Lua versions — the point is
that there is nothing else it can be, so the diff is the whole answer.

Nothing here is run by `npm test`. They are slow, they need a `lua` binary,
and a handful of the differences they report are expected rather than wrong.


Getting the reference binary
----------------------------

fengari implements **Lua 5.3**, so a 5.3 binary is the reference. The `lua` on
a modern machine is likely 5.4 or 5.5, which will report differences that are
version changes rather than bugs. Building 5.3 takes a few seconds:

```sh
curl -O https://www.lua.org/ftp/lua-5.3.6.tar.gz
tar xzf lua-5.3.6.tar.gz
cd lua-5.3.6 && make macosx     # or: make linux
```


Running them
------------

```sh
./compare.sh /path/to/lua-5.3.6/src/lua
```

or one at a time:

```sh
/path/to/lua-5.3.6/src/lua sweep.lua > a.txt
node run.js sweep.lua > b.txt
diff a.txt b.txt
```


What each one covers
--------------------

| file             | what it checks                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `sweep.lua`      | 161 checks over the string, table, math, base, coroutine and utf8 libraries, plus error messages |
| `sweep2.lua`     | 327 checks over numeral parsing, pattern corner cases, metamethods and the numeric `for`         |
| `date_probe.lua` | every `os.date` specifier, local and UTC, over five timestamps                                   |
| `num_probe.lua`  | `tostring`, `%g`, `%.14g` and `%a` over awkward floats                                           |
| `fmt_probe.lua`  | 39 floats by 33 `string.format` specifiers                                                       |
| `fuzz.lua`       | 20000 pseudo-random float/specifier pairs                                                        |
| `ifuzz.lua`      | 20000 pseudo-random integer/specifier pairs                                                      |
| `ties.lua`       | 30950 values that land exactly halfway, where C rounds to even and JS rounds away from zero      |
| `coerce.lua`     | implicit string-to-number coercion in arithmetic and bitwise operators                           |

The generators use a small linear congruential sequence rather than
`math.random`, so the same pairs come out of every Lua and the diff stays
meaningful.


Differences that are expected
-----------------------------

Against **lua 5.3.6**, as of the float and `os.date` fixes:

- `date_probe.lua`, 15 lines. `%k` and `%l` are fengari extensions that a real
  Lua rejects as invalid specifiers, and `!%z` answers `+0000` here where
  macOS's libc answers the local standard offset.
- `sweep.lua`, 1 line, and `sweep2.lua`, 7 lines. Six of those are 32 bit
  integers: `LUA_MAXINTEGER` is `2147483647` in `src/luaconf.js`, so
  `0xFFFFFFFF` wraps to `-1`, `9007199254740993` becomes a float, and
  `-1 >> 1` is `2147483647` rather than `9223372036854775807`. The seventh is
  `collectgarbage("count")`, which fengari raises "lua_gc not implemented" for.
- `fuzz.lua`, about 1000 lines of 20000, and only in the `%a` column that
  echoes the input: `Math.pow` and the platform's `pow` disagree by one unit
  in the last place, so the two Luas are not formatting the same double. The
  formatted result never differs where the input does not.

Against a **5.4 or 5.5** binary, add the language changes listed in section 8.1
of those manuals — `"1" + "2"` is an integer there and a float in 5.3, bitwise
operators no longer coerce strings, and `tostring` shows 17 significant digits
rather than 14.
