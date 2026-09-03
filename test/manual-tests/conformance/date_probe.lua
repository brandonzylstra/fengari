local specs = {"a","A","b","B","c","C","d","D","e","F","h","H","I","j","k","l","m","M","n","p","r","R","S","t","T","u","U","w","W","x","X","y","Y","z","Z","%"}
local times = {0, 1000000000, 1104537600, 1041379200, 1483228800}
for _, t in ipairs(times) do
  for _, s in ipairs(specs) do
    local ok, res = pcall(os.date, "%"..s, t)
    local ok2, res2 = pcall(os.date, "!%"..s, t)
    print(string.format("%d\t%s\t%q\t%q", t, s, ok and res or "ERR", ok2 and res2 or "ERR"))
  end
end
local d = os.date("!*t", 1000000000)
print("UTCTABLE", d.year, d.month, d.day, d.hour, d.min, d.sec, d.wday, d.yday, tostring(d.isdst))
local d2 = os.date("*t", 1000000000)
print("LOCTABLE", d2.year, d2.month, d2.day, d2.hour, d2.min, d2.sec, d2.wday, d2.yday, tostring(d2.isdst))
