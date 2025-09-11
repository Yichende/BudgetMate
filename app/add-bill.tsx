import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { Button, SegmentedButtons, Text, TextInput } from "react-native-paper";
import Animated, { FadeInRight } from "react-native-reanimated";
import {
  Transaction,
  TxCategory,
  useTxStore,
} from "../src/store/transactionStore";

export default function AddBill() {
  const params = useLocalSearchParams<{ date?: string; billId?: string }>();
  const add = useTxStore((s) => s.add);
  const update = useTxStore((s) => s.update);
  const items = useTxStore((s) => s.items);

  const editing: Transaction | undefined = useMemo(
    () => items.find((t) => t.id === params.billId),
    [items, params.billId]
  );

  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [type, setType] = useState<"expense" | "income">(
    editing?.type ?? "expense"
  );
  const [category, setCategory] = useState<TxCategory>(
    editing?.category ?? "餐饮"
  );
  const [date, setDate] = useState<Date>(
    editing
      ? dayjs(editing.date).toDate()
      : params.date
      ? dayjs(String(params.date)).toDate()
      : new Date()
  );
  const [note, setNote] = useState(editing?.note ?? "");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {}, []);

  const onSave = async () => {
    const payload = {
      type,
      category,
      amount: Number(amount || 0),
      note,
      date: dayjs(date).format("YYYY-MM-DD"),
    };
    if (editing) await update(editing.id, payload);
    else await add(payload);
    router.back();
  };

  return (
    <Animated.View
      entering={FadeInRight.duration(400)}
      style={styles.container}>
      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as "expense" | "income")}
        style={{ marginBottom: 12 }}
        buttons={[
          { value: "expense", label: "支出" },
          { value: "income", label: "收入" },
        ]}
      />

      <TextInput
        label="金额（必填）"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
      />

      <Text
        variant="titleSmall"
        style={{ marginBottom: 6 }}>
        类型
      </Text>

      <Button
        mode="outlined"
        onPress={() => setShowPicker(true)}
        style={{ marginBottom: 12 }}>
        选择日期：{dayjs(date).format("YYYY-MM-DD")}
      </Button>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(e, d) => {
            setShowPicker(false);
            if (d) setDate(d);
          }}
        />
      )}

      <TextInput
        label="备注（可选）"
        value={note}
        onChangeText={setNote}
        mode="outlined"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={onSave}>
        保存
      </Button>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFBEA", padding: 16 },
  input: { marginBottom: 12 },
  segment: { marginBottom: 12 },
});
