-- small-modulus LCG so the generator itself never leaves 32-bit integer range
local seed = 7
local function rnd() seed = (seed * 75 + 74) % 65537; return seed end
local convs = {"e","E","f","g","G"}
local flagsets = {"","-","+"," ","#","0","-+","+#","0#"," #","-0","+0","-#","+ ","#0-"}
local out = {}
for n = 1, 20000 do
  local a, b, c = rnd() % 100000, 1 + rnd() % 997, (rnd() % 61) - 30
  local kind = rnd() % 6
  local v
  if kind == 0 then v = a / b
  elseif kind == 1 then v = (a / b) * 10.0 ^ c
  elseif kind == 2 then v = a + 0.5
  elseif kind == 3 then v = a / 2.0 ^ (rnd() % 12)
  elseif kind == 4 then v = a * 1.0
  else v = (a / b) / 10.0 ^ c end
  if rnd() % 2 == 0 then v = -v end
  local spec = "%" .. flagsets[rnd() % #flagsets + 1]
  if rnd() % 3 == 0 then spec = spec .. string.format("%d", rnd() % 25) end
  if rnd() % 2 == 0 then spec = spec .. "." .. string.format("%d", rnd() % 20) end
  spec = spec .. convs[rnd() % #convs + 1]
  out[#out+1] = string.format("%s\t%s\t[%s]", spec, string.format("%a", v), string.format(spec, v))
end
print(table.concat(out, "\n"))
