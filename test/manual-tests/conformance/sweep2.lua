-- second differential probe: parsing, patterns, metatables, error text
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
  print(string.format("%04d %-30s %s %s", n, label, tostring(packed[1]), table.concat(parts, " | ")))
end

-- numeral parsing -----------------------------------------------------------
for _, s in ipairs({"0", "0.0", ".5", "5.", "0x10", "0X10", "0x.8", "0x8.", "0x1p4",
                    "0x1P-4", "0x1p+4", "1e2", "1E2", "1e+2", "1e-2", "3e", "0x", "0xg",
                    "1..2", "..1", "1e2e3", "  7  ", "7a", "", " ", "-5", "- 5", "+5",
                    "0x7FFFFFFF", "0xFFFFFFFF", "0x100000000", "1e309", "1e-400",
                    "9007199254740993", "0.1", "inf", "nan", "0x0p0"}) do
  try("tonumber " .. string.format("%q", s), tonumber, s)
  try("load ret " .. string.format("%q", s), function() local f = load("return " .. s) return f and f() end)
end
for _, b in ipairs({2, 8, 10, 16, 36}) do
  try("tonumber base " .. b, tonumber, "10", b)
end
try("tonumber base 1", tonumber, "1", 1)
try("tonumber base 37", tonumber, "1", 37)
try("tonumber 2 args nil", tonumber, nil, 10)

-- pattern corner cases ------------------------------------------------------
local subjects = {"hello world", "aaa", "", "a.b.c", "[x]", "%", "a\0b", "AbC123"}
local patterns = {".", "%.", "a*", "a-", "a+", "^a*$", "[^a]", "[a-c]", "[%a]", "[]]",
                  "%%", "()a", "(a)(b)", "%s*", "%w+", "%p", "%c", "%x+", "()", "$",
                  "^", "a$", "[a%-c]", "%f[%a]%a+", "(.)(.)%2%1"}
for _, s in ipairs(subjects) do
  for _, p in ipairs(patterns) do
    try("find " .. string.format("%q %q", s, p), string.find, s, p)
  end
end
try("gsub empty pat", string.gsub, "abc", "", "-")
try("gsub bad capture", string.gsub, "abc", "(a", "x")
try("gsub %1 no capture", string.gsub, "abc", "a", "%1")
try("gsub %2 missing", string.gsub, "abc", "(a)", "%2")
try("gsub bad repl", string.gsub, "abc", "a", true)
try("find init big", string.find, "abc", "a", 10)
try("find init neg", string.find, "abc", "b", -2)
try("find plain", string.find, "a.c", ".", 1, true)
try("rep huge", function() return #string.rep("a", 1000) end)
try("malformed pattern", string.find, "abc", "%")
try("unbalanced", string.find, "abc", "[")
try("too many captures", function()
  return string.find(("x"):rep(40), ("(x)"):rep(40))
end)

-- metatables ----------------------------------------------------------------
try("__index chain", function()
  local a = setmetatable({}, {__index = {x = 1}})
  local b = setmetatable({}, {__index = a})
  return b.x
end)
try("__newindex", function()
  local log = {}
  local t = setmetatable({}, {__newindex = function(_, k, v) log[#log+1] = k end})
  t.a = 1
  return log, rawget(t, "a")
end)
try("__call", function()
  return setmetatable({}, {__call = function(self, a) return a * 2 end})(21)
end)
try("__lt", function()
  local mt = {__lt = function() return true end}
  return setmetatable({}, mt) < setmetatable({}, mt)
end)
try("__le via lt", function()
  local mt = {__lt = function() return false end}
  return setmetatable({}, mt) <= setmetatable({}, mt)
end)
try("__unm", function()
  return -setmetatable({}, {__unm = function() return "neg" end})
end)
try("__idiv __mod", function()
  local mt = {__idiv = function() return "idiv" end, __mod = function() return "mod" end}
  local t = setmetatable({}, mt)
  return t // 1, t % 1
end)
try("__band", function()
  return setmetatable({}, {__band = function() return "band" end}) & 1
end)
try("__close absent", function() return getmetatable("") ~= nil end)
try("string mt", function() return ("x").upper == string.upper end)
try("getmetatable __metatable", function()
  return getmetatable(setmetatable({}, {__metatable = "locked"}))
end)
try("setmetatable protected", function()
  return setmetatable(setmetatable({}, {__metatable = "locked"}), {})
end)
try("__pairs", function()
  local t = setmetatable({}, {__pairs = function() return function() return nil end, nil, nil end})
  local c = 0
  for _ in pairs(t) do c = c + 1 end
  return c
end)

-- numeric for ---------------------------------------------------------------
try("for float step", function() local t = {} for i = 1, 2, 0.5 do t[#t+1] = i end return t end)
try("for negative", function() local t = {} for i = 3, 1, -1 do t[#t+1] = i end return t end)
try("for zero step", function() for i = 1, 2, 0 do end end)
try("for string bounds", function() local t = {} for i = "1", "3" do t[#t+1] = i end return t end)
-- (a loop up to math.maxinteger wraps forever in 5.3; 5.4 fixed that)

-- misc base -----------------------------------------------------------------
try("tostring int float", function() return tostring(3), tostring(3.0), tostring(3.5) end)
try("os.time table", function() return type(os.time({year=2000, month=1, day=1, hour=12})) end)
try("os.clock type", function() return type(os.clock()) end)
try("os.getenv missing", os.getenv, "DEFINITELY_NOT_SET_XYZ")
try("os.difftime", os.difftime, 100, 40)
try("collectgarbage count", function() return type(collectgarbage("count")) end)
try("collectgarbage bad", collectgarbage, "nosuchopt")
try("rawset", function() local t = {} rawset(t, "k", 1) return t.k end)
try("next order stable", function()
  local t = {a = 1}
  local k1 = next(t)
  return k1
end)
try("# on holes", function() local t = {1, 2, 3} t[2] = nil return #t == 3 or #t == 1 end)
try("string coercion cmp", function() return "10" < "9" end)
try("concat prec", function() return "a" .. 1 .. 2 end)
try("deep recursion", function()
  local function f(n) if n == 0 then return 0 end return 1 + f(n - 1) end
  return f(190)
end)
try("stack overflow msg", function()
  local function f() return 1 + f() end
  local ok, e = pcall(f)
  return ok, type(e) == "string" and e:match("stack overflow") ~= nil
end)

print("TOTAL", n)
