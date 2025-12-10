import { useAppTheme } from "@/src/constants/theme";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  RefreshControl,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Divider,
  FAB,
  List,
  Modal,
  Portal,
  Text,
} from "react-native-paper";
import {
  categoryIcons,
  Transaction,
  TxCategory,
  useTxStore,
} from "../src/store/transactionStore";
import AnimatedChip from "./components/AnimatedChip";
import BillAddModal from "./components/BillAddModal";
import SelectedCategoriesDisplay from "./components/SelectedCategoriesDisplay";
import YearMonthPicker from "./components/YearMonthPicker";

const PAGE_SIZE = 7; // 每页加载多少天

type DaySection = { date: string; items: Transaction[] };

type BillItemProps = {
  item: Transaction;
};

export default function BillsDetailsPage() {
  const router = useRouter();
  const items = useTxStore((s) => s.items);
  const load = useTxStore((s) => s.load);
  const add = useTxStore((s) => s.add);
  const theme = useAppTheme();
  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.background },
    appbarTitle: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      color: t.colors.text,
    },
    header: { padding: 12, backgroundColor: t.colors.headerBg },
    filterRow: { flexDirection: "row", marginBottom: 8 },
    summaryRow: { flexDirection: "row", alignItems: "center" },
    filterBtnLabel: {
      fontSize: 14,
      borderRadius: 1,
      fontWeight: "bold",
    },
    card: {
      marginHorizontal: 8,
      marginTop: 10,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: t.colors.surface,
    },
    empty: { padding: 24, alignItems: "center" },
    modal: {
      backgroundColor: t.colors.modalBg,
      margin: 20,
      padding: 20,
      borderRadius: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
      color: t.colors.text,
    },
    bottomSheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: t.colors.modalBg,
      padding: 20,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    chipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      margin: 4,
      backgroundColor: t.colors.chipBg,
    },
    chipSelected: {
      backgroundColor: t.colors.chipSelectedBg, // 选中背景7A46A8
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    fab: {
      position: "absolute",
      right: 16,
      bottom: 100,
      backgroundColor: t.colors.primary,
    },
  }));

  const [refreshing, setRefreshing] = useState(false);
  const [pageCount, setPageCount] = useState(1);

  // 当前年月
  const [currentYM, setCurrentYM] = useState(dayjs().format("YYYY-MM"));
  const [openYMPicker, setOpenYMPicker] = useState(false);

  // 筛选 Modal
  const [selectedCategories, setSelectedCategories] = useState<TxCategory[]>(
    []
  );
  const [modalVisible, setModalVisible] = useState(false);
  // 添加账单 Modal
  const [showAddModal, setShowAddModal] = useState(false);

  // 筛选本月账单 + 分类
  const monthBills = useMemo(() => {
    return items.filter(
      (t) =>
        t.date.startsWith(currentYM) &&
        (selectedCategories.length === 0 ||
          selectedCategories.includes(t.category as TxCategory))
    );
  }, [items, currentYM, selectedCategories]);

  // 月度汇总
  const monthlySummary = useMemo(() => {
    return monthBills.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [monthBills]);

  // 按天分组
  const allSections = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    monthBills.forEach((t) => {
      const day = dayjs(t.date).format("YYYY-MM-DD");
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(t);
    });
    return Array.from(map.entries())
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());
  }, [monthBills]);

  // 分页显示
  const pagedSections = useMemo(() => {
    return allSections.slice(0, pageCount * PAGE_SIZE);
  }, [allSections, pageCount]);

  const hasMore = pagedSections.length < allSections.length;

  const renderDayCard = useCallback(
    ({ item }: ListRenderItemInfo<DaySection>) => {
      const { date, items: bills } = item;
      const dayExpense = bills
        .filter((t) => t.type === "expense")
        .reduce((a, t) => a + t.amount, 0);
      const dayIncome = bills
        .filter((t) => t.type === "income")
        .reduce((a, t) => a + t.amount, 0);

      return (
        <Card style={styles.card}>
          <Card.Title
            title={`${dayjs(date).format("M月D日")} ${dayjs(date).format(
              "dddd"
            )}`}
            subtitle={`支出: ¥${dayExpense.toFixed(
              2
            )}  收入: ¥${dayIncome.toFixed(2)}  共 ${bills.length} 条`}
          />
          <Divider />

          <FlatList
            data={bills}
            keyExtractor={(t) => String(t.id)}
            renderItem={({ item: t }: BillItemProps) => {
              const amountText =
                (t.type === "income" ? "+" : "-") + t.amount.toFixed(2);
              const amountColor = t.type === "income" ? "#4CAF50" : "#F44336";
              const timeStr = dayjs(t.date).format("HH:mm");

              return (
                <List.Item
                  title={`${t.category} ¥${t.amount.toFixed(2)}`}
                  description={`${timeStr}  ${t.note ?? ""}`}
                  onPress={() =>
                    router.push({
                      pathname: "/bills/[date]",
                      params: { date: t.date, id: t.id },
                    })
                  }
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={categoryIcons[t.category]}
                      color={t.type === "income" ? "#4CAF50" : "#F44336"}
                    />
                  )}
                  right={() => (
                    <Text style={{ color: amountColor, fontWeight: "bold" }}>
                      {amountText}
                    </Text>
                  )}
                />
              );
            }}
            scrollEnabled={false} // 内部FlatList禁止滚动
          />
        </Card>
      );
    },
    [router]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      console.warn("refresh failed", e);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const loadMore = useCallback(() => {
    if (hasMore) setPageCount((p) => p + 1);
  }, [hasMore]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content
          titleStyle={styles.appbarTitle}
          title="账单明细"
        />
      </Appbar.Header>

      {/* 筛选 + 月汇总 */}
      <View style={styles.header}>
        <View style={styles.filterRow}>
          <Button
            mode="text"
            icon={
              selectedCategories.length === 0 ? "view-list" : undefined // 多选时在文字里渲染图标
            }
            onPress={() => setModalVisible(true)}
            textColor={theme.colors.secondary}
            buttonColor={theme.colors.chipSelectedBg}>
            <SelectedCategoriesDisplay
              selectedCategories={selectedCategories}
              categoryIcons={categoryIcons}
            />
          </Button>
        </View>
        <View style={styles.summaryRow}>
          <View style={{ alignItems: "center" }}>
            <Button
              mode="text"
              compact
              textColor="#FFFEE8"
              onPress={() => setOpenYMPicker(true)}>
              {dayjs(currentYM).format("YYYY年MM月")}
            </Button>
            <View
              style={{
                width: "80%", // 线条宽度
                height: 2,
                borderRadius: 1,
                backgroundColor: "#FFFEE8",
                marginTop: -1, // 向上靠近文字
              }}
            />
          </View>

          <Text style={{ marginLeft: "auto", color: "#FDF9CF" }}>
            总支出: ¥{monthlySummary.expense.toFixed(2)}
          </Text>
          <Text style={{ marginLeft: 12, color: "#FDF9CF" }}>
            总收入: ¥{monthlySummary.income.toFixed(2)}
          </Text>
        </View>
      </View>

      <Divider />

      <FlatList
        data={pagedSections}
        renderItem={renderDayCard}
        keyExtractor={(s) => s.date}
        contentContainerStyle={{ paddingBottom: 200 }}
        initialNumToRender={PAGE_SIZE}
        windowSize={5}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text
              variant="titleMedium"
              style={{ color: "#888" }}>
              暂无账单
            </Text>
          </View>
        }
      />

      {/* 筛选 Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.bottomSheet}>
          <Text style={styles.modalTitle}>选择分类</Text>
          <View style={styles.chipContainer}>
            {/* 全部选项 */}
            <AnimatedChip
              icon="view-list"
              selected={selectedCategories.length === 0}
              selectedColor="#7A46A8"
              IconColor="#7A46A8"
              style={[
                styles.chip,
                selectedCategories.length === 0 && styles.chipSelected,
              ]}
              onPress={() => {
                setSelectedCategories([]); // 空数组代表全部
                setModalVisible(false);
              }}>
              全部
            </AnimatedChip>

            {/* 分类选项 */}
            {(Object.keys(categoryIcons) as TxCategory[]).map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <AnimatedChip
                  key={cat}
                  icon={categoryIcons[cat]}
                  selected={isSelected}
                  selectedColor="#7A46A8"
                  IconColor="#7A46A8"
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => {
                    let newSelected = [...selectedCategories];
                    if (isSelected) {
                      newSelected = newSelected.filter((c) => c !== cat);
                    } else {
                      newSelected.push(cat);
                    }
                    setSelectedCategories(newSelected);
                  }}>
                  {cat}
                </AnimatedChip>
              );
            })}
          </View>
        </Modal>
      </Portal>
      <YearMonthPicker
        visible={openYMPicker}
        initialYM={currentYM}
        onClose={() => setOpenYMPicker(false)}
        onConfirm={(ym) => setCurrentYM(ym)}
      />
      <FAB
        style={styles.fab}
        icon="pencil"
        onPress={() => setShowAddModal(true)}
      />
      <BillAddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => {
          console.log("提交数据:", data);
          add({
            type: data.type,
            category: data.category,
            amount: Number(data.amount),
            note: data.remark,
            date: data.date,
          }).catch((e) => console.error("添加账单失败", e));
          setShowAddModal(false);
        }}
      />
    </View>
  );
}
