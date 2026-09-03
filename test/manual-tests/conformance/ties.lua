-- values whose decimal expansion ends exactly on a 5, where C rounds to even
-- and JS rounds away from zero
local out = {}
for n = 1, 400 do
  for p = 0, 6 do
    local v = (n * 2 - 1) / 2.0 ^ (p + 1)      -- odd / power of two: exact ties
    for _, s in ipairs({"%.0f","%.1f","%.2f","%.3f","%.0e","%.1e","%.2e","%.1g","%.2g","%.3g","%.14g"}) do
      out[#out+1] = string.format("%s %.17g [%s] [%s]", s, v, string.format(s, v), string.format(s, -v))
    end
  end
end
for _, v in ipairs({0.5,1.5,2.5,3.5,4.5,0.05,0.15,0.25,0.35,1.25,1.75,2.675,1e15+0.5,0.0625,1048576.5}) do
  for _, s in ipairs({"%.0f","%.1f","%.2f","%.0e","%.1e","%.2g","%.15g","%.16g","%.17g","%g"}) do
    out[#out+1] = string.format("%s %.17g [%s]", s, v, string.format(s, v))
  end
end
print(table.concat(out, "\n"))
