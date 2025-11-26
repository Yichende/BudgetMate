import { useAppTheme } from "@/src/constants/theme";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Circle, Text as SkiaText, useFont } from "@shopify/react-native-skia";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, RefreshControl, ScrollView, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Button, Card, Text } from "react-native-paper";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  FadeInUp,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Area,
  BarGroup,
  CartesianChart,
  CartesianChartRef,
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
  // 获取当前主题
  const theme = useAppTheme();
  const styles = useThemedStyles((theme) => ({
    container: { flex: 1, backgroundColor: theme.colors.background },
    summaryCard: { margin: 10 },
    toggle: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
    toggleBtn: { marginHorizontal: 5 },
    chartCard: { margin: 10 },
    empty: { textAlign: "center", color: theme.colors.emptyText, marginVertical: 20 },
    scrollBox: { marginBottom: 70 },
    centerBox: { flex: 1, justifyContent: "center", alignItems: "center", color: theme.colors.text, backgroundColor: theme.colors.background },
  
    // 6月总计柱状图
    centeredTooltip: {
      position: "absolute",
      top: 8,
      alignSelf: "center",
      zIndex: 100,
      backgroundColor: theme.colors.surface,
      padding: 6,
      borderRadius: 5,
      borderColor: theme.colors.outline,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      maxWidth: 180, // 设置最大宽度
    },
    tooltipContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    tooltipTitle: {
      fontSize: 13,
      marginRight: 6,
      color: theme.colors.text,
    },
    amountsContainer: {
      flexDirection: "column",
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    tooltipText: {
      fontSize: 12,
      color: theme.colors.text,
    },
    incomeText: {
      color: theme.colors.income,
    },
    expenseText: {
      color: theme.colors.expense,
    },
    amountText: {
      color: theme.colors.text,
      minWidth: 60, // 确保金额有足够空间显示
    },
  }));

  const screenWidth = Dimensions.get("window").width;

  const [selected, setSelected] = useState(dayjs().format("YYYY-MM-DD"));
  const [showType, setShowType] = useState<"income" | "expense">("expense");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const initDoneRef = useRef(false);

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
  const { state: LineState } = useChartPressState({ x: "", y: { y: 0 } });
  const { state: BarState } = useChartPressState({
    x: "",
    y: { income: 0, expense: 0 },
  });

  // 按压
  const [pressing, setPressing] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chartRef = useRef<CartesianChartRef<any>>(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [showBarTooltip, setShowBarTooltip] = useState(false);

  // 每日趋势数据
  const dailySeries = useMemo(() => {
    const today = dayjs();
    const dates = Array.from({ length: 30 }, (_, i) =>
      today.subtract(29 - i, "day")
    );

    const dataPoints = dates.map((d) => {
      const dayStr = d.format("YYYY-MM-DD");
      const dayItems = items.filter(
        (t) =>
          dayjs(t.date).format("YYYY-MM-DD") === dayStr && t.type === showType
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
      [selected]: { selected: true, selectedColor: theme.colors.primary },
    };
    items.forEach((t) => {
      const d = dayjs(t.date).format("YYYY-MM-DD");
      if (d.startsWith(ym)) {
        mark[d] = mark[d] || { marked: true, dotColor: theme.colors.primary };
        mark[d].marked = true;
      }
    });
    return mark;
  }, [items, selected, ym, theme]);

  useAnimatedReaction(
    () => ({
      idx: LineState.matchedIndex.value,
      active: LineState.isActive.value,
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

  // 下拉刷新
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

  const handleBarPress = (index: number) => {
    setSelectedBarIndex(index);
    setShowBarTooltip(true);

    // 自动隐藏提示
    setTimeout(() => {
      setShowBarTooltip(false);
    }, 5000);
  };

  const handleChartContainerPress = (event: any) => {
    if (!chartRef.current || !monthlySeries.data.length) return;

    // 获取点击位置相对于图表的坐标
    const { locationX, locationY } = event.nativeEvent;

    // 使用 ref 模拟触摸事件
    chartRef.current?.actions.handleTouch(BarState, locationX, locationY);

    // 检查是否有匹配的柱子
    if (BarState.matchedIndex.value >= 0) {
      handleBarPress(BarState.matchedIndex.value);
    } else {
      // 点击空白处隐藏提示
      setShowBarTooltip(false);
    }
  };

  const LineToolTip = ({
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
    const textX = useDerivedValue(() => {
      const padding = 100; // 预留宽度，避免超出
      const maxX = screenWidth - padding;
      return Math.min(x.value + 8, maxX);
    }, [x]);
    const textY = useDerivedValue(() => y.value - 8, [y]);
    return (
      <>
        <Circle
          cx={x}
          cy={y}
          r={4}
          color={theme.colors.primary}
        />
        <SkiaText
          x={textX}
          y={textY}
          text={`${dayjs(date).format("M.D")}  ${cnCurrency(value)}`}
          font={font}
          color={theme.colors.text}
        />
      </>
    );
  };

  // 加载数据
  useEffect(() => {
    const initData = async () => {
      const hasLocalItems = items && items.length > 0;

      if (!initDoneRef.current && !hasLocalItems) {
        setLoading(true);
      }

      try {  
        // 尝试加载网络数据
        if (!initDoneRef.current) {
          await load();
        } else {
          load().catch((e) => console.warn("backgroud load failed", e));
        }
      } catch (err) {
        console.error("初始化数据失败:", err);
      } finally {
        if (!initDoneRef.current) {
          setLoading(false);
          initDoneRef.current = true;
        }
      }
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

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView style={styles.scrollBox}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }>
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
              calendarBackground: theme.colors.background,
              todayTextColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.text,
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </Animated.View>

        {/* 月汇总 */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.text }}>本月汇总({ym})</Text>
            <Text style={{ color: theme.colors.income }}>收入：{cnCurrency(income)}</Text>
            <Text style={{ color: theme.colors.expense }}>支出：{cnCurrency(expense)}</Text>
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
          {/* <Button onPress={() => console.log(monthlySeries.data)}>测试</Button> */}
        </View>

        {/* 每日折线图 */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.text }}>
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
                    chartPressState={LineState}
                    axisOptions={{
                      font,
                      tickCount: { y: 10, x: 6 }, // 控制Y轴10个刻度，X轴刻度数量将通过tickValues单独指定
                      lineColor: theme.colors.outline,
                      labelColor: theme.colors.emptyText,
                      formatXLabel: (value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}.${date.getDate()}`;
                      },
                    }}>
                    {({ points, chartBounds }) => (
                      <>
                        <Line
                          points={points.y}
                          color={
                            showType === "expense"
                              ? theme.colors.expense
                              : theme.colors.income
                          }
                          strokeWidth={2}
                          animate={{ type: "spring" }}
                          curveType="linear"
                        />
                        <Area
                          points={points.y}
                          color={`${showType === "expense" ? theme.colors.expense : theme.colors.income}33`}
                          y0={chartBounds.bottom}
                          animate={{ type: "spring" }}
                          curveType="linear"
                        />
                        {pressing &&
                          hoverIndex !== null &&
                          dailySeries.dataPoints[hoverIndex] && (
                            <LineToolTip
                              x={LineState.x.position}
                              y={LineState.y.y.position}
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
            <Text variant="titleMedium" style={{ color: theme.colors.text }}>近6个月收支对比</Text>
            {monthlySeries.data && monthlySeries.data.length > 0 ? (
              <View
                style={{ height: 240, width: screenWidth - 40 }}
                onTouchStart={handleChartContainerPress}>
                {/* 中央上方的数据展示 */}
                {showBarTooltip && selectedBarIndex !== null && (
                  <View style={styles.centeredTooltip}>
                    <View style={styles.tooltipContent}>
                      <Text style={[styles.tooltipText, styles.tooltipTitle]}>
                        {monthlySeries.data[selectedBarIndex].month}
                      </Text>
                      <View style={styles.amountsContainer}>
                        <View style={styles.amountRow}>
                          <Text style={[styles.tooltipText, styles.incomeText]}>
                            收:{" "}
                          </Text>
                          <Text style={[styles.tooltipText, styles.amountText]}>
                            {cnCurrency(
                              monthlySeries.data[selectedBarIndex].income
                            )}
                          </Text>
                        </View>
                        <View style={styles.amountRow}>
                          <Text
                            style={[styles.tooltipText, styles.expenseText]}>
                            支:{" "}
                          </Text>
                          <Text style={[styles.tooltipText, styles.amountText]}>
                            {cnCurrency(
                              monthlySeries.data[selectedBarIndex].expense
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                <CartesianChart
                  ref={chartRef}
                  data={monthlySeries.data}
                  xKey="month"
                  yKeys={["income", "expense"]}
                  domainPadding={{ left: 30, right: 30, top: 20 }}
                  chartPressState={BarState}
                  axisOptions={{
                    font,
                    tickCount: { y: 10, x: 6 },
                    labelColor: theme.colors.emptyText,
                  }}>
                  {({ points, chartBounds }) => (
                    <>
                      <BarGroup
                        chartBounds={chartBounds}
                        betweenGroupPadding={0.3}
                        withinGroupPadding={0.1}>
                        <BarGroup.Bar
                          points={points.income}
                          color={theme.colors.income}
                        />
                        <BarGroup.Bar
                          points={points.expense}
                          color={theme.colors.expense}
                        />
                      </BarGroup>
                    </>
                  )}
                </CartesianChart>
              </View>
            ) : (
              <Text style={styles.empty}>暂无数据</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
