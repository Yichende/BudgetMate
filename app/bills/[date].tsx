import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Appbar, IconButton, List, Text } from "react-native-paper";
import { SwipeListView } from "react-native-swipe-list-view";
import { useTxStore } from "../../src/store/transactionStore";

export default function BillsOfDatePage() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const items = useTxStore((s) => s.items);
  const bills = useMemo(
    () => items.filter((t) => t.date === date),
    [items, date]
  );
  const remove = useTxStore((s) => s.remove);
  const load = useTxStore((s) => s.load);

  useEffect(() => {
    (async() => {
      await load();
    })();
  }, [load]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={dayjs(date).format("YYYY年MM月DD日")} />
      </Appbar.Header>

      {bills.length === 0 ? (
        <View style={styles.empty}>
          <Text
            variant="titleMedium"
            style={{ color: "#888" }}>
            暂无账单
          </Text>
        </View>
      ) : (
        <SwipeListView
          data={bills}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={`${item.category}  ¥${item.amount}`}
              description={item.note || ""}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={item.type === "income" ? "arrow-down" : "arrow-up"}
                  color={item.type === "income" ? "#4CAF50" : "#F44336"}
                />
              )}
            />
          )}
          renderHiddenItem={({ item }) => (
            <View style={styles.hidden}>
              <IconButton
                icon="delete"
                iconColor="white"
                size={24}
                onPress={() => remove(item.id)}
              />
            </View>
          )}
          rightOpenValue={-70}
          disableRightSwipe
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8E1" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hidden: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 15,
    backgroundColor: "#F44336",
  },
});
