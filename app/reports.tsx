import dayjs from "dayjs";
import React, { useMemo } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { Text } from "react-native-paper";
import { useTxStore } from '../src/store/transactionStore';


export default function ReportsPage() {
  const screenWidth = Dimensions.get("window").width;
  const ym = dayjs().format("YYYY-MM");
  const typeBreakdownFn = useTxStore((s) => s.typeBreakdownOfMonth);
  const dailySeriesFn = useTxStore((s) => s.dailyExpenseSeriesOfMonth);
  const typeBreakdown = useMemo(() => typeBreakdownFn(ym), [typeBreakdownFn, ym]);
  const dailySeries = useMemo(() => dailySeriesFn(ym), [dailySeriesFn, ym]);


  // 饼图数据
  const pieData = Object.entries(typeBreakdown)
    .filter(([_, value]) => value > 0)
    .map(([category, amount], i) => ({
      name: category,
      amount,
      color: chartColors[i % chartColors.length],
      legendFontColor: "#333",
      legendFontSize: 14,
    }));

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        报表分析 - {ym}
      </Text>

      {/* 饼图 */}
      {pieData.length > 0 ? (
        <PieChart
          data={pieData.map((d) => ({
            name: d.name,
            population: d.amount,
            color: d.color,
            legendFontColor: d.legendFontColor,
            legendFontSize: d.legendFontSize,
          }))}
          width={screenWidth - 20}
          height={220}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="10"
        />
      ) : (
        <Text style={styles.empty}>暂无支出数据</Text>
      )}

      {/* 柱状图 */}
      <Text variant="titleMedium" style={styles.subtitle}>
        每日支出趋势
      </Text>
      <BarChart
        data={{
          labels: dailySeries.labels,
          datasets: [{ data: dailySeries.data }],
        }}
        width={screenWidth - 20}
        height={220}
        yAxisLabel="¥"
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: "#FFFBEA",
          backgroundGradientFrom: "#FFFBEA",
          backgroundGradientTo: "#FFF3C4",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
        }}
        fromZero
        showValuesOnTopOfBars
      />
    </ScrollView>
  );
}

const chartColors = ["#FFD93D", "#FF6B6B", "#6BCB77", "#4D96FF", "#FF9F1C"];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFBEA", padding: 10 },
  title: { marginBottom: 10 },
  subtitle: { marginTop: 20, marginBottom: 5 },
  empty: { textAlign: "center", color: "#888", marginVertical: 20 },
});
