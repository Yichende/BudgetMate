// app/bills-details.tsx
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, ListRenderItemInfo, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Card, Chip, Divider, List, Text } from "react-native-paper";
import { Transaction, useTxStore } from "../src/store/transactionStore";

const PAGE_SIZE = 7; // 每页加载多少天

type DaySection = { date: string; items: Transaction[] };

export default function BillsDetailsPage() {
  const router = useRouter();
  const items = useTxStore((s) => s.items);
  const load = useTxStore((s) => s.load);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [pageCount, setPageCount] = useState(1);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const currentYM = dayjs().format("YYYY-MM");

  // 筛选本月账单 + 类型
  const monthBills = useMemo(() => {
    return items.filter(
      (t) =>
        t.date.startsWith(currentYM) &&
        (filter === "all" ? true : t.type === filter)
    );
  }, [items, currentYM, filter]);

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

  const toggleExpand = useCallback((date: string) => {
    setExpandedDays((prev) => {
      const copy = new Set(prev);
      if (copy.has(date)) copy.delete(date);
      else copy.add(date);
      return copy;
    });
  }, []);

  const renderDayCard = useCallback(
    ({ item }: ListRenderItemInfo<DaySection>) => {
      const { date, items: bills } = item;
      const dayExpense = bills.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
      const dayIncome = bills.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
      const expanded = expandedDays.has(date);

      return (
        <Card style={styles.card}>
          <TouchableOpacity onPress={() => toggleExpand(date)}>
            <Card.Title
              title={`${dayjs(date).format("M月D日")} ${dayjs(date).format("dddd")}`}
              subtitle={`支出: ¥${dayExpense.toFixed(2)}  收入: ¥${dayIncome.toFixed(2)}  共 ${bills.length} 条`}
            />
          </TouchableOpacity>
          <Divider />
          {expanded && (
            <FlatList
              data={bills}
              keyExtractor={(t) => String(t.id)}
              renderItem={({ item: t }) => (
                <List.Item
                  title={`${t.category} ¥${t.amount.toFixed(2)}`}
                  description={t.note ?? ""}
                  onPress={() => router.push(`/bills/${t.date}?id=${t.id}`)}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="dots-horizontal"
                      color={t.type === "income" ? "#4CAF50" : "#F44336"}
                    />
                  )}
                />
              )}
              scrollEnabled={false} // 内部FlatList禁止滚动
            />
          )}
        </Card>
      );
    },
    [expandedDays, toggleExpand, router]
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
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="账单明细" />
      </Appbar.Header>

      {/* 筛选 + 月汇总 */}
      <View style={styles.header}>
        <View style={styles.filterRow}>
          <Chip selected={filter === "all"} onPress={() => setFilter("all")}>
            全部
          </Chip>
        </View>
        <View style={styles.summaryRow}>
          <Text variant="titleMedium">{dayjs(currentYM).format("YYYY年MM月")}</Text>
          <Text style={{ marginLeft: "auto", color: "#F44336" }}>支出: ¥{monthlySummary.expense.toFixed(2)}</Text>
          <Text style={{ marginLeft: 12, color: "#4CAF50" }}>收入: ¥{monthlySummary.income.toFixed(2)}</Text>
        </View>
      </View>

      <Divider />

      <FlatList
        data={pagedSections}
        renderItem={renderDayCard}
        keyExtractor={(s) => s.date}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={PAGE_SIZE}
        windowSize={5}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium" style={{ color: "#888" }}>
              暂无账单
            </Text>
          </View>
        }
      />

      {/* 页脚加载更多提示 */}
      <View style={styles.footer}>
        {hasMore ? (
          <TouchableOpacity onPress={loadMore} style={styles.loadMore}>
            <Text>加载更多天数</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: "#888" }}>已加载全部可用日期</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { padding: 12, backgroundColor: "#FFF8E1" },
  filterRow: { flexDirection: "row", marginBottom: 8 },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  card: { marginHorizontal: 8, marginTop: 10, borderRadius: 12, overflow: "hidden" },
  empty: { padding: 24, alignItems: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 60, alignItems: "center" },
  loadMore: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#eee", borderRadius: 20 },
});
