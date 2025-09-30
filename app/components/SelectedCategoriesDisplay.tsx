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
  if (selectedCategories.length === 0) {
    return <Text style={{ color: "#7A46A8" }}>全部</Text>;
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
          <Icon source={categoryIcons[cat]} size={16} color="#7A46A8" />
          <Text style={{ marginLeft: 2, color: "#7A46A8" }}>
            {cat}
            {idx < displayCategories.length - 1 || hasMore ? " |" : ""}
          </Text>
        </View>
      ))}
      {hasMore && <Text style={{ color: "#7A46A8" }}>...</Text>}
    </View>
  );
};

export default SelectedCategoriesDisplay;
