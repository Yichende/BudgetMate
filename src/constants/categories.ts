export const CATEGORIES = ['饮食', '交通', '娱乐', '购物', '居住', '医疗', '学习', '其他'] as const;
export type Category = typeof CATEGORIES[number];
