import "react-native-paper";
declare module "react-native-paper" {
  // 向 MD3Colors 扩展自定义字段
  interface MD3Colors {
    text?: string;
    income?: string;
    expense?: string;
    chipBg?: string;
    chipSelectedBg?: string;
    headerBg?: string;
    headerText?: string;
    emptyText?: string;
  }
}