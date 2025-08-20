export const cnCurrency = (n: number | string) => {
  const v = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(v)) return "¥0";
  return `¥${v.toLocaleString("zh-CN")}`;
};
