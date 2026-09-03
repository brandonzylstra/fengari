local seed = 7
local function rnd() seed = (seed * 75 + 74) % 65537; return seed end
local convs = {"d","i","o","u","x","X"}
local flagsets = {"","-","+"," ","#","0","-+","+#","0#"," #","-0","+0","-#","#0-"}
local out = {}
for n = 1, 20000 do
  local v = rnd() * (1 + rnd() % 30000) % 2147483647     -- non-negative: 64-bit
  if rnd() % 5 == 0 then v = rnd() % 10 end              -- negatives need item 1
  local spec = "%" .. flagsets[rnd() % #flagsets + 1]
  if rnd() % 3 == 0 then spec = spec .. string.format("%d", rnd() % 25) end
  if rnd() % 2 == 0 then spec = spec .. "." .. string.format("%d", rnd() % 20) end
  spec = spec .. convs[rnd() % #convs + 1]
  out[#out+1] = string.format("%s %d [%s]", spec, v, string.format(spec, v))
end
print(table.concat(out, "\n"))
