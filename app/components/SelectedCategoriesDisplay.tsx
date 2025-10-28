import { useAppTheme } from "@/src/constants/theme";
import { TxCategory } from "@/src/store/transactionStore";
import React from "react";
import { Text, View } from "react-native";
import { Icon } from "react-native-paper";

interface Props {
  selectedCategories: TxCategory[]; // 空数组代表全部
  categoryIcons: Record<TxCategory, string>;
}

const SelectedCategoriesDisplay: React.FC<Props> = ({
  selectedCategories,
  categoryIcons,
}) => {
  const theme = useAppTheme();
  if (selectedCategories.length === 0) {
    return <Text style={{ color: theme.colors.secondary }}>全部</Text>;
  }

  const MAX_SHOW = 2;
  const displayCategories = selectedCategories.slice(0, MAX_SHOW);
  const hasMore = selectedCategories.length > MAX_SHOW;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
      {displayCategories.map((cat, idx) => (
        <View
          key={cat}
          style={{ flexDirection: "row", alignItems: "center", marginRight: 6 }}
        >
          <Icon source={categoryIcons[cat]} size={16} color={theme.colors.secondary} />
          <Text style={{ marginLeft: 2, color: theme.colors.secondary }}>
            {cat}
            {idx < displayCategories.length - 1 || hasMore ? " |" : ""}
          </Text>
        </View>
      ))}
      {hasMore && <Text style={{ color: theme.colors.secondary }}>...</Text>}
    </View>
  );
};

export default SelectedCategoriesDisplay;
