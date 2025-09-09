import { Circle, Text as SkiaText, useFont } from "@shopify/react-native-skia";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Appbar, Button, Card, Text } from "react-native-paper";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  FadeInUp,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue
} from "react-native-reanimated";
import {
  BarGroup,
  CartesianChart,
  Line,
  useChartPressState,
} from "victory-native";
import inter from "../assets/fonts/Inter-Regular.ttf";
import { useTxStore } from "../src/store/transactionStore";
import { cnCurrency } from "../src/utils/format";

// 配置日历中文
LocaleConfig.locales["zh"] = {
  monthNames: [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ],
  monthNamesShort: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  dayNames: [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ],
  dayNamesShort: ["日", "一", "二", "三", "四", "五", "六"],
  today: "今天",
};
LocaleConfig.defaultLocale = "zh";

export default function Home() {
  const screenWidth = Dimensions.get("window").width;

  const [selected, setSelected] = useState(dayjs().format("YYYY-MM-DD"));
  const [showType, setShowType] = useState<"income" | "expense">("expense");
  const [loading, setLoading] = useState(true);

  // 直接从 store 获取数据和方法
  const items = useTxStore((s) => s.items) || [];
  const load = useTxStore((s) => s.load);
  const summaryOfMonth = useTxStore((s) => s.summaryOfMonth);
  const monthlySummarySeries = useTxStore((s) => s.monthlySummarySeries);
  const clearLocal = useTxStore((s) => s.clearLocal);

  const ym = dayjs(selected).format("YYYY-MM");

  // 使用 useMemo 计算派生数据
  const { income, expense } = useMemo(() => summaryOfMonth(ym), [items, ym]);
  const monthlySeries = useMemo(() => monthlySummarySeries(), [items]);

  // 图表元素
  const font = useFont(inter, 12);
  const { state } = useChartPressState({ x: "", y: { y: 0 } });

  // 按压
  const [pressing, setPressing] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // 每日趋势数据
  const dailySeries = useMemo(() => {
    const today = dayjs();
    const dates = Array.from({ length: 30 }, (_, i) =>
      today.subtract(29 - i, "day")
    );

    const dataPoints = dates.map((d) => {
      const dayStr = d.format("YYYY-MM-DD");
      const dayItems = items.filter(
        (t) => t.date === dayStr && t.type === showType
      );
      return { x: dayStr, y: dayItems.reduce((sum, t) => sum + t.amount, 0) };
    });

    // 底部只显示6个标签
    const labelIndices = [0, 5, 10, 15, 20, 29];
    const labels = labelIndices.map((i) => {
      const date = dates[i];
      return date.format("M.D");
    });

    return { dataPoints, labels };
  }, [items, showType]);

  // ===== 日历高亮 =====
  const marked = useMemo(() => {
    const mark: Record<string, any> = {
      [selected]: { selected: true, selectedColor: "#F5D76E" },
    };
    items.forEach((t) => {
      if (t.date.startsWith(ym)) {
        mark[t.date] = mark[t.date] || { marked: true, dotColor: "#F5D76E" };
        mark[t.date].marked = true;
      }
    });
    return mark;
  }, [items, selected, ym]);

  useAnimatedReaction(
    () => ({
      idx: state.matchedIndex.value,
      active: state.isActive.value,
    }),
    (curr, prev) => {
      if (!prev || curr.active !== prev.active) {
        runOnJS(setPressing)(curr.active);
      }
      if (!prev || curr.idx !== prev.idx) {
        runOnJS(setHoverIndex)(curr.idx >= 0 ? curr.idx : null);
      }
    }
  );

  const ToolTip = ({
    x,
    y,
    value,
    date,
  }: {
    x: SharedValue<number>;
    y: SharedValue<number>;
    value: number;
    date: string;
  }) => {
    if (!font) return null;
    const textX = useDerivedValue(() => x.value + 8, [x]);
    const textY = useDerivedValue(() => y.value - 8, [y]);
    return (
      <>
        <Circle
          cx={x}
          cy={y}
          r={4}
          color="#FF6B6B"
        />
        <SkiaText
          x={textX}
          y={textY}
          text={`${dayjs(date).format("M.D")}  ${cnCurrency(value)}`}
          font={font}
          color="#333"
        />
      </>
    );
  };

  // 加载数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await load();
      setLoading(false);
    };
    
    initData();
  }, []);

  useEffect(() => {
    setPressing(false);
    setHoverIndex(null);
  }, [showType, items]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.centerBox}>
        <Text>暂无数据</Text>
        <Button onPress={() => load()}>重新加载</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollBox}>
        {/* 日历 */}
        <Animated.View entering={FadeInUp.duration(400)}>
          <Calendar
            current={selected}
            onDayPress={(d) => {
              setSelected(d.dateString);
              router.push(`/bills/${d.dateString}`);
            }}
            onMonthChange={(m) =>
              setSelected(dayjs(m.dateString).date(1).format("YYYY-MM-DD"))
            }
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

        {/* 月汇总 */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium">本月汇总({ym})</Text>
            <Text>收入：{cnCurrency(income)}</Text>
            <Text>支出：{cnCurrency(expense)}</Text>
          </Card.Content>
        </Card>

        {/* 切换按钮 */}
        <View style={styles.toggle}>
          <Button
            mode={showType === "expense" ? "contained" : "outlined"}
            onPress={() => setShowType("expense")}
            style={styles.toggleBtn}>
            支出
          </Button>
          <Button
            mode={showType === "income" ? "contained" : "outlined"}
            onPress={() => setShowType("income")}
            style={styles.toggleBtn}>
            收入
          </Button>
          <Button onPress={() => console.log(monthlySeries.data)}>测试</Button>
        </View>

        {/* 每日折线图 */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium">
              每日{showType === "expense" ? "支出" : "收入"}趋势
            </Text>
            {dailySeries.dataPoints.some((point) => point.y > 0) ? (
              <>
                <View style={{ height: 220, width: screenWidth - 40 }}>
                  <CartesianChart
                    data={dailySeries.dataPoints}
                    xKey="x"
                    yKeys={["y"]}
                    domainPadding={{ left: 30, right: 30, top: 20 }}
                    chartPressState={state}
                    axisOptions={{
                      font,
                      tickCount: { y: 10, x: 6 }, // 控制Y轴10个刻度，X轴刻度数量将通过tickValues单独指定
                      lineColor: "#d4d4d8",
                      labelColor: "#86909c",
                      formatXLabel: (value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}.${date.getDate()}`;
                      },
                    }}>
                    {({ points }) => (
                      <>
                        <Line
                          points={points.y}
                          color="#FF6B6B"
                          strokeWidth={1}
                          animate={{ type: "spring" }}
                        />
                        {pressing &&
                          hoverIndex !== null &&
                          dailySeries.dataPoints[hoverIndex] && (
                            <ToolTip
                              x={state.x.position}
                              y={state.y.y.position}
                              value={dailySeries.dataPoints[hoverIndex].y}
                              date={dailySeries.dataPoints[hoverIndex].x}
                            />
                          )}
                      </>
                    )}
                  </CartesianChart>
                </View>
              </>
            ) : (
              <Text style={styles.empty}>暂无数据</Text>
            )}
          </Card.Content>
        </Card>

        {/* 月度汇总柱状图 */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium">近6个月收支对比</Text>
            {monthlySeries.data && monthlySeries.data.length > 0 ? (
              <View style={{ height: 240, width: screenWidth - 40 }}>
                <CartesianChart
                  data={monthlySeries.data}
                  xKey="month"
                  yKeys={["income", "expense"]}
                  domainPadding={{ left: 30, right: 30, top: 20 }}
                  axisOptions={{
                    font,
                    tickCount: { y: 10, x: 6 }, // 控制刻度数量
                    labelColor: "#86909c",
                  }}>
                  {({ points, chartBounds }) => (
                    <BarGroup
                      chartBounds={chartBounds}
                      betweenGroupPadding={0.3}
                      withinGroupPadding={0.1}>
                      <BarGroup.Bar
                        points={points.income}
                        color="#6BCB77"
                      />
                      <BarGroup.Bar
                        points={points.expense}
                        color="#FF6B6B"
                      />
                    </BarGroup>
                  )}
                </CartesianChart>
              </View>
            ) : (
              <Text style={styles.empty}>暂无数据</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* 底部导航 */}
      <Appbar style={styles.bottom}>
        <Appbar.Action
          icon="chart-bar"
          onPress={() => {}}
        />
        <Appbar.Action
          icon="file-document"
          onPress={() => router.push("/bills-details")}
        />
        <Appbar.Action
          icon="cog"
          onPress={() => router.push("/settings")}
        />
      </Appbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFBEA", marginTop: 30 },
  summaryCard: { margin: 10 },
  toggle: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  toggleBtn: { marginHorizontal: 5 },
  chartCard: { margin: 10 },
  empty: { textAlign: "center", color: "#888", marginVertical: 20 },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F5D76E",
  },
  scrollBox: { marginBottom: 70 },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
