local vals = {
  0.0, -0.0, 1.0, -1.0, 0.5, 100.0, 1e15, 1e16, 1e14, 123456789012345.0,
  1/3, 2/3, 1e100, 1e-100, 1e308, 1e-308, 5e-324,
  math.pi, math.huge, -math.huge, 0/0, -(0/0),
  1e15+0.5, 2^53, 2^53+2.0, -2^53, 1234567890.12345,
  0.1, 0.2, 0.1+0.2, 1e-5, 1e-4, 123.456, 1e20, 1e21, 3.0e5, 1e6, 1e7,
  1e13, 1e13+0.5, 99999999999999.0, 999999999999999.0,
}
for i = 1, #vals do
  local v = vals[i]
  print(i, tostring(v), string.format("%g|%.14g|%s|%a", v, v, v, v))
end
print("concat", "" .. 1.5, "" .. math.huge, "" .. (0/0))
print("fmt", string.format("%d", 3), string.format("%5.2f", math.pi))
print("tonumber", tonumber("  0x10  "), tonumber("1e2"), tonumber("0x1p4"), tonumber("inf"), tonumber("nan"))
