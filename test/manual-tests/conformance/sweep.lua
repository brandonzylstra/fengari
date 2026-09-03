-- A differential probe: everything here is deterministic and free of time,
-- randomness and file paths, so the only reason two Luas disagree is a bug.
local function show(v)
  local t = type(v)
  if t == "number" then return tostring(v) .. "/" .. tostring(math.type(v)) end
  if t == "string" then return string.format("%q", v) end
  if t == "table" then
    local parts = {}
    for i = 1, #v do parts[#parts+1] = show(v[i]) end
    return "{" .. table.concat(parts, ",") .. "}"
  end
  return tostring(v)
end

local n = 0
local function try(label, f, ...)
  n = n + 1
  local packed = table.pack(pcall(f, ...))
  local parts = {}
  for i = 2, packed.n do parts[#parts+1] = show(packed[i]) end
  print(string.format("%04d %-28s %s %s", n, label, tostring(packed[1]), table.concat(parts, " | ")))
end

-- string library ------------------------------------------------------------
try("rep0", string.rep, "ab", 0)
try("rep-1", string.rep, "ab", -1)
try("repsep", string.rep, "ab", 3, "-")
try("sub", string.sub, "hello", -3, -1)
try("sub2", string.sub, "hello", 0)
try("sub3", string.sub, "hello", 2, 100)
try("byte", string.byte, "\xff")
try("char", string.char, 255)
try("upper", string.upper, "\xe9abc")
try("len", string.len, "\0\1\2")
try("reverse", string.reverse, "\0ab")
for _, p in ipairs({"%a+", "%d+", "%s", "%w+", "[%a%d]+", "^h", "o$", "l+", "(l)(l)",
                    "%bxy", "%f[%w]%w+", ".-", "()", "(.)%1"}) do
  try("find " .. p, string.find, "hello world 123", p)
  try("match " .. p, string.match, "hello world 123", p)
end
try("gsub", string.gsub, "hello world", "o", "0")
try("gsub n", string.gsub, "hello world", "o", "0", 1)
try("gsub fn", string.gsub, "abc", "%a", function(c) return c:upper() end)
try("gsub tbl", string.gsub, "abc", "%a", {a = "1", b = false})
try("gsub %%", string.gsub, "abc", "b", "%%")
try("gsub anchor", string.gsub, "aaa", "^a", "X")
try("gmatch", function() local t = {} for w in ("a,b,,c"):gmatch("[^,]*") do t[#t+1] = w end return t end)
try("format s", string.format, "%s|%5s|%-5s|%.2s", "ab", "ab", "ab", "abcd")
try("format q int", string.format, "%q", 1)
try("format q str", string.format, "%q", "a\0b\"c\n")
try("format d", string.format, "%d|%5d|%-5d|%05d|%+d", 42, 42, 42, 42, 42)
try("format x", string.format, "%x|%X|%#x|%o", 255, 255, 255, 8)
try("format c", string.format, "%c", 65)
try("format bad", string.format, "%y", 1)
try("format d float", string.format, "%d", 3.0)
try("format d frac", string.format, "%d", 3.5)
try("byte range", string.byte, "abc", 1, -1)

-- pack/unpack ---------------------------------------------------------------
try("packsize", string.packsize, "i4i8d")
try("pack i4", function() return (string.pack("i4", 7)):byte(1, -1) end)
try("pack >i4", function() return (string.pack(">i4", 7)):byte(1, -1) end)
try("unpack i4", string.unpack, "i4", string.pack("i4", -2))
try("pack s1", function() return (string.pack("s1", "hi")):byte(1, -1) end)
try("pack overflow", string.pack, "i1", 300)

-- table library -------------------------------------------------------------
try("concat", table.concat, {1, 2, 3}, "-")
try("concat range", table.concat, {1, 2, 3, 4}, "-", 2, 3)
try("concat bad", table.concat, {1, {}, 3})
try("insert", function() local t = {1,2,3} table.insert(t, 2, 9) return t end)
try("insert bad", function() local t = {1,2,3} table.insert(t, 9, 9) return t end)
try("remove", function() local t = {1,2,3} local v = table.remove(t) return t, v end)
try("remove pos", function() local t = {1,2,3} local v = table.remove(t, 1) return t, v end)
try("remove empty", function() local t = {} return table.remove(t) end)
try("unpack", table.unpack, {1, 2, 3})
try("unpack range", table.unpack, {1, 2, 3}, 2, 3)
try("move", function() return table.move({1,2,3,4,5}, 2, 4, 1) end)
try("sort", function() local t = {3,1,2} table.sort(t) return t end)
try("sort cmp", function() local t = {3,1,2} table.sort(t, function(a,b) return a > b end) return t end)
try("sort invalid", function() local t = {1,2,3} table.sort(t, function() return true end) return t end)
try("pack", function() local t = table.pack(1, nil, 3) return t.n end)

-- math ----------------------------------------------------------------------
try("floor", math.floor, 3.7)
try("floor neg", math.floor, -3.7)
try("ceil", math.ceil, 3.2)
try("fmod", math.fmod, 7, 3)
try("fmod neg", math.fmod, -7, 3)
try("modf", math.modf, 3.7)
try("modf neg", math.modf, -3.7)
try("modf inf", math.modf, math.huge)
try("tointeger", math.tointeger, 3.0)
try("tointeger frac", math.tointeger, 3.5)
try("tointeger str", math.tointeger, "3")
try("abs", math.abs, -3)
try("max", math.max, 1, 2.5, 2)
try("min", math.min, 1, 2.5, 2)
try("sqrt", math.sqrt, 2)
try("ult", math.ult, 1, 2)
try("type", math.type, 1)
try("intdiv", function() return 7 // 2, -7 // 2, 7 % 2, -7 % 2, 7 % -2 end)
try("floatdiv", function() return 7.0 // 2, -7.0 // 2.0, 7.5 % 2 end)
try("divzero", function() return 1 // 0 end)
try("modzero", function() return 1 % 0 end)
try("fdivzero", function() return 1.0 / 0, 1.0 // 0.0, 1.0 % 0.0 end)

-- integer / float semantics -------------------------------------------------
try("cmp", function() return 1 == 1.0, 1 < 1.5, "10" == 10 end)
try("concat num", function() return 1 .. "", 1.0 .. "", -0.0 .. "" end)
try("tonumber base", tonumber, "ff", 16)
try("tonumber base2", tonumber, "z", 36)
try("tonumber bad base", tonumber, "8", 8)
try("tonumber hex", tonumber, "0x10")
try("tonumber hexfloat", tonumber, "0x1p4")
try("tonumber spaces", tonumber, "  10  ")
try("tonumber empty", tonumber, "")
try("tonumber inf", tonumber, "inf")
try("bitops", function() return 5 & 3, 5 | 3, 5 ~ 3, ~5, 1 << 4, 256 >> 4 end)
try("shiftbig", function() return 1 << 64, 1 << 100, -1 >> 1 end)
try("floatkey", function() local t = {} t[1.0] = "a" return t[1] end)
try("nankey", function() local t = {} t[0/0] = "a" return t[0/0] end)

-- base library --------------------------------------------------------------
try("select", select, 2, "a", "b", "c")
try("select #", select, "#", "a", "b")
try("select neg", select, -1, "a", "b")
try("rawequal", rawequal, {}, {})
try("rawlen", rawlen, {1,2,3})
try("next", next, {})
try("ipairs stop", function() local t = {1,2,nil,4} local c = 0 for _ in ipairs(t) do c = c + 1 end return c end)
try("tostring nil", tostring, nil)
try("type", type, print)
try("assert msg", assert, false, "boom")
try("error tbl", function() error({code = 1}) end)
try("error level", function() error("msg", 0) end)
try("pcall nest", function() return pcall(pcall, error, "x") end)
try("xpcall", xpcall, function() error("e", 0) end, function(m) return "handled:" .. m end)
try("setmeta", function()
  local t = setmetatable({}, {__index = function() return 7 end, __len = function() return 9 end})
  return t.anything, #t
end)
try("meta arith", function()
  local mt = {__add = function(a, b) return "added" end}
  return setmetatable({}, mt) + 1
end)
try("meta concat", function()
  local mt = {__concat = function() return "cat" end}
  return setmetatable({}, mt) .. "x"
end)
try("meta eq", function()
  local mt = {__eq = function() return true end}
  return setmetatable({}, mt) == setmetatable({}, mt)
end)
try("meta tostring", function()
  return tostring(setmetatable({}, {__tostring = function() return "TS" end}))
end)
try("meta name", function()
  return tostring(setmetatable({}, {__name = "MyType"})):match("^MyType")
end)
try("rawget", function() return rawget(setmetatable({}, {__index = function() return 1 end}), "k") end)

-- goto / closures / varargs -------------------------------------------------
try("closure", function() local fs = {} for i = 1, 3 do fs[i] = function() return i end end return fs[1](), fs[3]() end)
try("varargs", function(...) return select("#", ...), ... end, 1, nil, 3)
try("tailcall depth", function() local function f(n) if n == 0 then return "done" end return f(n - 1) end return f(100000) end)

-- coroutines ----------------------------------------------------------------
try("coro", function()
  local co = coroutine.create(function(a) local b = coroutine.yield(a + 1) return b * 2 end)
  local _, x = coroutine.resume(co, 1)
  local _, y = coroutine.resume(co, 10)
  return x, y, coroutine.status(co)
end)
try("coro err", function()
  local co = coroutine.create(function() error("inside") end)
  return select(2, coroutine.resume(co)):match("inside") ~= nil
end)
try("coro wrap err", function() return coroutine.wrap(function() error("w", 0) end)() end)
try("coro isyieldable", coroutine.isyieldable)

-- load / chunks -------------------------------------------------------------
try("load", function() return load("return 1 + 1")() end)
try("load syntax", function() return load("return +") end)
try("load name", function() local f, e = load("x x", "=chunkname") return e end)
try("load env", function()
  local f = load("return x", nil, nil, {x = 42})
  return f()
end)
try("loadstring num", function() return load("return 0x10, 1e2, .5, 3., 0x.8p1")() end)

-- errors --------------------------------------------------------------------
try("err arith", function() return {} + 1 end)
try("err concat", function() return {} .. "" end)
try("err index", function() local t = nil return t.x end)
try("err call", function() local t = 5 return t() end)
try("err compare", function() return {} < {} end)
try("err compare2", function() return 1 < "x" end)
try("err len", function() return #5 end)
try("err forloop", function() for i = 1, "x" do end end)
try("err upval", function() local x = nil return x.y end)

-- utf8 ----------------------------------------------------------------------
try("utf8 char", utf8.char, 72, 228, 8364)
try("utf8 len", utf8.len, "h\u{e4}\u{20ac}")
try("utf8 codepoint", utf8.codepoint, "\u{20ac}")
try("utf8 offset", utf8.offset, "h\u{e4}\u{20ac}", 3)
try("utf8 bad", utf8.len, "\xff")
try("utf8 charpattern", function() local t = {} for c in ("a\u{e4}"):gmatch(utf8.charpattern) do t[#t+1] = c end return t end)

print("TOTAL", n)
