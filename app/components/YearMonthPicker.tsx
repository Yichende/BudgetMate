import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Modal, Portal, Text, useTheme } from "react-native-paper";

type YearMonthPickerProps = {
  visible: boolean;
  initialYM?: string; // "YYYY-MM"
  onClose: () => void;
  onConfirm: (ym: string) => void; // YYYY-MM
};

const currentYear = new Date().getFullYear();
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5; // 必须是奇数，保证中间一行高亮
const screenHeight = Dimensions.get("window").height;

export default function YearMonthPicker({
  visible,
  initialYM,
  onClose,
  onConfirm,
}: YearMonthPickerProps) {
  const theme = useTheme();

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const yearListRef = useRef<FlatList<number>>(null);
  const monthListRef = useRef<FlatList<number>>(null);

  const years = Array.from({ length: 30 }, (_, i) => currentYear - i); // 最近30年
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const centerIndex = Math.floor(VISIBLE_ITEMS / 2);

  useEffect(() => {
    if (initialYM) {
      const [y, m] = initialYM.split("-").map(Number);
      setYear(y);
      setMonth(m);

      // 使用setTimeout确保在组件渲染完成后执行滚动
      setTimeout(() => {
        const yearIndex = years.indexOf(y);
        if (yearIndex >= 0) {
          yearListRef.current?.scrollToIndex({
            index: yearIndex,
            animated: false,
          });
        }
        
        monthListRef.current?.scrollToIndex({
          index: m - 1,
          animated: false,
        });
      }, 100);
    }
  }, [initialYM, visible]); // 添加visible依赖，确保每次打开时都重新初始化

  const onYearScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const y = years[index];
    if (y) setYear(y);
  };

  const onMonthScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const m = months[index];
    if (m) setMonth(m);
  };

  const confirmSelection = () => {
    const formattedMonth = month.toString().padStart(2, "0");
    onConfirm(`${year}-${formattedMonth}`);
    onClose();
  };

  const renderItem = (item: number, selected: boolean, isMonth = false) => (
    <View
      style={[
        styles.item,
        selected && { transform: [{ scale: 1.2 }] },
      ]}
    >
      <Text
        style={[
          styles.itemText,
          selected && { color: theme.colors.primary, fontWeight: "bold" },
        ]}
      >
        {isMonth ? `${item}月` : item}
      </Text>
    </View>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modal}
      >
        {/* 点击背景关闭 */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* 底部弹出 */}
        <View
          style={[styles.container, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={styles.title}>选择年月</Text>

          <View style={styles.pickerContainer}>
            {/* 年份滚轮 */}
            <View style={styles.pickerColumn}>
              <FlatList
                ref={yearListRef}
                data={years}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
                onMomentumScrollEnd={onYearScrollEnd}
                contentContainerStyle={{
                  paddingVertical: ITEM_HEIGHT * centerIndex,
                }}
                renderItem={({ item }) => renderItem(item, item === year, false)}
              />
            </View>

            {/* 月份滚轮 */}
            <View style={styles.pickerColumn}>
              <FlatList
                ref={monthListRef}
                data={months}
                keyExtractor={(item) => item.toString()}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
                onMomentumScrollEnd={onMonthScrollEnd}
                contentContainerStyle={{
                  paddingVertical: ITEM_HEIGHT * centerIndex,
                }}
                renderItem={({ item }) => renderItem(item, item === month, true)}
              />
            </View>
            
            {/* 选中高亮条 - 垂直居中 */}
            <View
              pointerEvents="none"
              style={styles.highlight}
            />
          </View>

          <Button
            mode="contained"
            style={styles.confirmBtn}
            onPress={confirmSelection}
          >
            确定
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: screenHeight * 0.6,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: "relative", // 为高亮线提供相对定位上下文
  },
  pickerColumn: {
    flex: 1,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    marginHorizontal: 10,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  itemText: {
    fontSize: 18,
    color: "#666",
  },
  highlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * 2, // 高亮线位于中间位置 (5个可见项，中间是第3个，索引为2)
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#7A46A8",
    backgroundColor: "rgba(122, 70, 168, 0.1)",
  },
  confirmBtn: {
    marginTop: 20,
    alignSelf: "center",
    width: "50%",
  },
});