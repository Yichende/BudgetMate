import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Card, FAB, Text } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTxStore } from "../src/store/transactionStore";
import { cnCurrency } from "../src/utils/format";

// 中文
LocaleConfig.locales["zh"] = {
  monthNames: ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
  monthNamesShort: ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
  dayNames: ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
  dayNamesShort: ["日","一","二","三","四","五","六"],
  today: "今天",
};
LocaleConfig.defaultLocale = "zh";

export default function Home() {
  const [selected, setSelected] = useState(dayjs().format("YYYY-MM-DD"));
  const items = useTxStore((s) => s.items);
  const ym = dayjs(selected).format("YYYY-MM");
  const summaryFn = useTxStore((s) => s.summaryOfMonth);
  const { income, expense } = useMemo(() => summaryFn(ym), [summaryFn, ym]);

  const marked = useMemo(() => {
    const mark: Record<string, any> = {
      [selected]: { selected: true, selectedColor: "#F5D76E" },
    };
    // 给有账单的日期打点
    items.forEach((t) => {
      if (t.date.startsWith(ym)) {
        mark[t.date] = mark[t.date] || { marked: true, dotColor: "#F5D76E" };
        mark[t.date].marked = true;
      }
    });
    return mark;
  }, [items, selected, ym]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(400)}>
        <Calendar
          current={selected}
          onDayPress={(d) => {
            setSelected(d.dateString);
            router.push(`/bills/${d.dateString}`);
          }}
          onMonthChange={(m) => setSelected(dayjs(m.dateString).date(1).format("YYYY-MM-DD"))}
          markedDates={marked}
          theme={{
            todayTextColor: "#F5D76E",
            arrowColor: "#F5D76E",
            monthTextColor: "#333",
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </Animated.View>

      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleMedium">本月汇总（{ym}）</Text>
          <Text>收入：{cnCurrency(income)}</Text>
          <Text>支出：{cnCurrency(expense)}</Text>
        </Card.Content>
      </Card>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push({ pathname: "/add-bill", params: { date: selected } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFBEA", padding: 10, marginTop: 30 },
  summaryCard: { marginTop: 16 },
  fab: { position: "absolute", right: 16, bottom: 24, backgroundColor: "#F5D76E" },
});
