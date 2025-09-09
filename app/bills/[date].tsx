import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  useTxStore,
} from "../../src/store/transactionStore";

// 分类图标映射
const categoryIcons: Record<TxCategory, string> = {
  转账: "swap-horizontal",
  购物: "cart",
  娱乐: "gamepad-variant",
  交通: "bus",
  生活缴费: "flash",
  餐饮: "silverware-fork-knife",
  其他: "dots-horizontal",
};

type BillItemProps = {
  item: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
};

const BillItem = React.memo(({ item, onEdit, onDelete }: BillItemProps) => (
  <List.Item
    style={styles.billItem}
    title={`${item.category}  ¥${item.amount}`}
    description={item.note || ""}
    left={(props) => (
      <List.Icon
        {...props}
        icon={categoryIcons[item.category]}
        color={item.type === "income" ? "#4CAF50" : "#F44336"}
      />
    )}
  />
));

const HiddenItem = React.memo(({ item, onEdit, onDelete }: BillItemProps) => (
  <View style={styles.hiddenRow}>
    <IconButton
      icon="pencil"
      iconColor="white"
      size={24}
      style={styles.editButton}
      onPress={() => onEdit(item)}
    />
    <IconButton
      icon="delete"
      iconColor="white"
      size={24}
      style={styles.deleteButton}
      onPress={() => onDelete(item.id)}
    />
  </View>
));

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
  const update = useTxStore((s) => s.update);

  // 编辑 Modal 状态
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState<TxCategory>("其他");
  const [editAmount, setEditAmount] = useState<string>("0");
  const [editNote, setEditNote] = useState<string>("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

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
    <View style={styles.container}>
      {/* 顶部导航 */}
      <Appbar.Header>
        <Appbar.BackAction
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/"); // 兜底返回首页
          }}
        />
        <Appbar.Content title={dayjs(date).format("YYYY年MM月DD日")} />
      </Appbar.Header>

      {/* 内容 */}
      {bills.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="titleMedium" style={{ color: "#888" }}>
            暂无账单
          </Text>
        </View>
      ) : (
        <SwipeListView
          data={bills}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BillItem item={item} onEdit={openEdit} onDelete={setConfirmDeleteId} />
          )}
          renderHiddenItem={({ item }) => (
            <HiddenItem item={item} onEdit={openEdit} onDelete={setConfirmDeleteId} />
          )}
          rightOpenValue={-150}
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
          style={{ borderRadius: 12 }}
        >
          <Dialog.Title>编辑账单</Dialog.Title>
          <Dialog.ScrollArea>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <ScrollView style={{ maxHeight: 400 }}>
                <Dialog.Content>
                  <Text variant="titleMedium" style={styles.dialogTitle}>
                    收入 / 支出
                  </Text>
                  <Divider />
                  <RadioButton.Group
                    onValueChange={(v) => setEditType(v as "income" | "expense")}
                    value={editType}
                  >
                    <RadioButton.Item label="支出" value="expense" />
                    <RadioButton.Item label="收入" value="income" />
                  </RadioButton.Group>

                  <Text variant="titleMedium" style={{ marginBottom: 10 }}>
                    金额及备注
                  </Text>
                  <Divider />
                  <TextInput
                    label="金额"
                    keyboardType="numeric"
                    value={editAmount}
                    onChangeText={setEditAmount}
                    style={{ marginTop: 10 }}
                  />
                  <TextInput
                    label="备注"
                    value={editNote}
                    onChangeText={setEditNote}
                    style={{ marginTop: 10 }}
                  />

                  <Text variant="titleMedium" style={styles.dialogTitle}>
                    分类
                  </Text>
                  <Divider />
                  <RadioButton.Group
                    onValueChange={(v) => setEditCategory(v as TxCategory)}
                    value={editCategory}
                  >
                    {Object.keys(categoryIcons).map((cat) => (
                      <RadioButton.Item
                        key={cat}
                        label={cat}
                        value={cat}
                        labelStyle={{ fontSize: 16 }}
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
        >
          <Dialog.Title>确认删除</Dialog.Title>
          <Dialog.Content>
            <Text>确定要删除这条账单吗？</Text>
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
            >
              删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8E1" },
  dialogTitle: { marginTop: 10 },
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
  editButton: { backgroundColor: "#4CAF50", marginRight: 10 },
  deleteButton: { backgroundColor: "#F44336" },
});
