local function t(v) return tostring(v) .. "/" .. (math.type(v) or "-") end
local pairs_ = {
 {'"10"+5', "10"+5}, {'5+"10"', 5+"10"}, {'"10"+"5"', "10"+"5"},
 {'"10"-"5"', "10"-"5"}, {'"3"*"4"', "3"*"4"}, {'"10"/"5"', "10"/"5"},
 {'"7"//"2"', "7"//"2"}, {'"7"%"2"', "7"%"2"}, {'"2"^"3"', "2"^"3"},
 {'-"3"', -"3"}, {'"0x10"+0', "0x10"+0}, {'" 10 "+1', " 10 "+1},
 {'"1e2"+0', "1e2"+0}, {'"10."+0', "10."+0}, {'".5"+0', ".5"+0},
 {'"10"+1.0', "10"+1.0}, {'"1.0"+1', "1.0"+1}, {'"-7"//"2"', "-7"//"2"},
 {'"-7"%"2"', "-7"%"2"}, {'"0x7fffffff"+1', "0x7fffffff"+1},
 {'"10"//"0"', pcall(function() return "10"//"0" end)},
 {'"10"%"0"', pcall(function() return "10"%"0" end)},
}
for _, p in ipairs(pairs_) do print(p[1], t(p[2])) end
print("bitwise", pcall(function() return "10" | 0 end))
print("bitwise2", pcall(function() return "10" & 3 end))
print("shift", pcall(function() return "10" << 1 end))
print("concat", 10 .. "", 10.0 .. "", "10"+0 .. "")
print("compare", "10"+0 == 10, math.type("10"+0))
print("tonumber", math.type(tonumber("10")), math.type(tonumber("10.0")))
print("idx", ({[10]="ten"})["10"+0])
