import { useAppTheme } from "@/src/constants/theme";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  RadioButton,
  Text,
  TextInput,
} from "react-native-paper";
import { SwipeListView } from "react-native-swipe-list-view";
import {
  Transaction,
  TxCategory,
  categoryIcons,
  useTxStore,
} from "../../src/store/transactionStore";

type BillItemProps = {
  item: Transaction;
  theme: ReturnType<typeof useAppTheme>;
};

type HiddenItemProps = {
  item: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  theme: ReturnType<typeof useAppTheme>;
};

const BillItem = React.memo(({ item, theme }: BillItemProps) => {
  const amountText =
    (item.type === "income" ? "+" : "-") + item.amount.toFixed(2);
  const amountColor =
    item.type === "income" ? theme.colors.income : theme.colors.expense;
  const timeStr = dayjs(item.date).format("HH:mm");
  return (
    <List.Item
      style={[styles.billItem, { backgroundColor: theme.colors.surface }]}
      title={`${item.category}`}
      description={`${timeStr}  ${item.note ?? ""}`}
      left={(props) => (
        <List.Icon
          {...props}
          icon={categoryIcons[item.category]}
          color={amountColor}
        />
      )}
      right={() => (
        <Text style={{ color: amountColor, fontWeight: "bold" }}>
          {amountText}
        </Text>
      )}
    />
  );
});

const HiddenItem = React.memo(
  ({ item, onEdit, onDelete, theme }: HiddenItemProps) => (
    <View style={styles.hiddenRow}>
      <IconButton
        icon="pencil"
        iconColor="white"
        size={24}
        style={[styles.editButton, { backgroundColor: theme.colors.income }]}
        onPress={() => onEdit(item)}
      />
      <IconButton
        icon="delete"
        iconColor="white"
        size={24}
        style={{ backgroundColor: theme.colors.expense }}
        onPress={() => onDelete(item.id)}
      />
    </View>
  )
);

export default function BillsOfDatePage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const items = useTxStore((s) => s.items);
  const bills = useMemo(
    () =>
      items.filter(
        (t) =>
          dayjs(t.date).format("YYYY-MM-DD") ===
          dayjs(date).format("YYYY-MM-DD")
      ),
    [items, date]
  );

  const remove = useTxStore((s) => s.remove);
  const update = useTxStore((s) => s.update);

  // 编辑 Modal 状态
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState<TxCategory>("其他");
  const [editAmount, setEditAmount] = useState<string>("0");
  const [editNote, setEditNote] = useState<string>("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openEdit = (item: Transaction) => {
    setEditing(item);
    setEditType(item.type);
    setEditCategory(item.category);
    setEditAmount(item.amount.toString());
    setEditNote(item.note || "");
  };

  const saveEdit = async () => {
    if (editing) {
      await update(editing.id, {
        type: editType,
        category: editCategory,
        amount: Number(editAmount),
        note: editNote,
      });
    }
    setEditing(null);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 顶部导航 */}
      <Appbar.Header style={{ backgroundColor: theme.colors.headerBg }}>
        <Appbar.BackAction
          color={theme.colors.headerText}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/home"); // 兜底返回首页
          }}
        />
        <Appbar.Content
          titleStyle={{ color: theme.colors.headerText }}
          title={dayjs(date).format("YYYY年MM月DD日")}
        />
      </Appbar.Header>

      {/* 内容 */}
      {bills.length === 0 ? (
        <View style={styles.empty}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.emptyText }}>
            暂无账单
          </Text>
        </View>
      ) : (
        <SwipeListView
          data={bills}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BillItem item={item} theme={theme} />}
          renderHiddenItem={({ item }) => (
            <HiddenItem
              item={item}
              theme={theme}
              onEdit={openEdit}
              onDelete={setConfirmDeleteId}
            />
          )}
          rightOpenValue={-125}
          disableRightSwipe
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      {/* 编辑账单 Modal */}
      <Portal>
        <Dialog
          visible={!!editing}
          onDismiss={() => setEditing(null)}
          style={{
            borderRadius: 12,
            backgroundColor: theme.colors.modalBg,
          }}>
          <Dialog.Title style={{ color: theme.colors.primary, fontWeight: 700 }}>
            编辑账单
          </Dialog.Title>
          <Dialog.ScrollArea>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <ScrollView style={{ maxHeight: 400 }}>
                <Dialog.Content>
                  <Text
                    variant="titleMedium"
                    style={[styles.dialogTitle, { color: theme.colors.text }]}>
                    收入 / 支出
                  </Text>
                  <Divider />
                  <RadioButton.Group
                    onValueChange={(v) =>
                      setEditType(v as "income" | "expense")
                    }
                    value={editType}>
                    <RadioButton.Item
                      label="支出"
                      value="expense"
                      labelStyle={{ color: theme.colors.text }}
                    />
                    <RadioButton.Item
                      label="收入"
                      value="income"
                      labelStyle={{ color: theme.colors.text }}
                    />
                  </RadioButton.Group>

                  <Text
                    variant="titleMedium"
                    style={styles.dialogTitle}>
                    金额及备注
                  </Text>
                  <Divider />
                  <TextInput
                    label="金额"
                    keyboardType="numeric"
                    value={editAmount}
                    onChangeText={setEditAmount}
                    textColor={theme.colors.text}
                    style={{ backgroundColor: theme.colors.surface }}
                  />
                  <TextInput
                    label="备注"
                    value={editNote}
                    onChangeText={setEditNote}
                    style={{
                      marginTop: 10,
                      backgroundColor: theme.colors.surface,
                    }}
                    textColor={theme.colors.text}
                  />

                  <Text
                    variant="titleMedium"
                    style={[styles.dialogTitle, { color: theme.colors.text }]}>
                    分类
                  </Text>
                  <Divider />
                  <RadioButton.Group
                    onValueChange={(v) => setEditCategory(v as TxCategory)}
                    value={editCategory}>
                    {Object.keys(categoryIcons).map((cat) => (
                      <RadioButton.Item
                        key={cat}
                        label={cat}
                        value={cat}
                        labelStyle={{ fontSize: 16, color: theme.colors.text }}
                      />
                    ))}
                  </RadioButton.Group>
                </Dialog.Content>
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEditing(null)}>取消</Button>
            <Button onPress={saveEdit}>保存</Button>
          </Dialog.Actions>
        </Dialog>

        {/* 删除确认 Modal */}
        <Dialog
          visible={!!confirmDeleteId}
          onDismiss={() => setConfirmDeleteId(null)}
          style={{ backgroundColor: theme.colors.modalBg }}>
          <Dialog.Title style={{ color: theme.colors.text }}>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.text }}>确定要删除这条账单吗？</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteId(null)}>取消</Button>
            <Button
              onPress={async () => {
                if (confirmDeleteId) {
                  await remove(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              }}
              textColor={theme.colors.expense}>
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dialogTitle: { marginTop: 10, fontWeight: 700 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  billItem: {
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  hiddenRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingRight: 10,
  },
  editButton: { marginRight: 10 },
});
