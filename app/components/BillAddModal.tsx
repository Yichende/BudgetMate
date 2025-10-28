import { useAppTheme } from "@/src/constants/theme";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { TxCategory, categoryIcons } from "@/src/store/transactionStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useState } from "react";
import {
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
} from "react-native-paper";

type BillAddModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: "expense" | "income";
    date: string;
    amount: string;
    category: TxCategory;
    remark: string;
  }) => void;
};

export default function BillAddModal({
  visible,
  onClose,
  onSubmit,
}: BillAddModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles((theme) => ({
    modalWrapper: {
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.colors.modalBg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 16,
      minHeight: "80%",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    typeBtn: {
      marginRight: 8,
    },
    amountInput: {
      fontSize: 16,
      fontWeight: "bold",
      marginVertical: 16,
      borderBottomWidth: 1,
      borderColor: theme.colors.outline,
      color: theme.colors.text,
    },
    categoryItem: {
      alignItems: "center",
      justifyContent: "center",
    },
    remarkInput: {
      borderColor: theme.colors.outline,
      borderRadius: 8,
      marginVertical: 8,
    },
    noteBtn: {
      alignSelf: "flex-start",
    },
    // 键盘
    keyboardContainer: {
      marginHorizontal: -16, // 抵消父容器的padding
      marginBottom: -16, // 抵消父容器的底部padding
      backgroundColor: theme.colors.surface, // 键盘背景色
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      overflow: "hidden",
    },
    keyboard: {
      flexDirection: "row",
      height: 240, // 固定高度，4行 × 60
      width: "100%",
      marginTop: "auto",
      paddingHorizontal: 16,
    },
    numPad: {
      flex: 3, // 占3/4宽
      flexDirection: "column",
      // margin: -5,
    },
    numRow: {
      flex: 1, // 每行平均分配高度
      flexDirection: "row",
    },
    actionPad: {
      flex: 1, // 占1/4宽度
      flexDirection: "column",
      marginLeft: 8,
      // margin: -5,
    },
    actionKey: {
      justifyContent: "center",
      margin: 5,
      alignItems: "center",
      borderWidth: 0.5,
      borderColor: theme.colors.outline,
      borderRadius: 10,
    },
    backKey: {
      flex: 1, // 返回按钮高度占1份
      backgroundColor: theme.colors.surface,
    },
    okKey: {
      flex: 3, // 确定按钮高度占3份
      backgroundColor: theme.colors.primary,
    },
    key: {
      flex: 1, // 每列平均分配宽度
      margin: 5,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 0.5,
      borderColor: theme.colors.outline,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
    },
    zeroKey: {
      flex: 2, // 数字0占两份宽度
    },
    keyText: {
      fontSize: 24,
      fontWeight: "600",
      color: theme.colors.text,
    },
  }));
  const [type, setType] = useState<"expense" | "income">("expense");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TxCategory>();
  const [remark, setRemark] = useState("");
  const [showRemarkInput, setShowRemarkInput] = useState(false);

  // 分类选择大小适应
  const screenWidth = Dimensions.get("window").width;
  // 每行展示的列数
  const numColumns = 5;
  // 预留出 FlatList 的 padding/margin，总共算 32px
  const horizontalPadding = 32;
  // item 宽度 = (屏幕宽度 - 总间距) / 列数
  const itemWidth = (screenWidth - horizontalPadding) / numColumns;

  const handleKeyPress = (val: string) => {
    if (val === "back") {
      setAmount((prev) => prev.slice(0, -1));
    } else if (val === "ok") {
      if (!amount || !selectedCategory) return;
      const isToday = dayjs(date).isSame(dayjs(), "day");
      const finalDate = isToday
        ? dayjs().format("YYYY-MM-DD HH:mm:ss")
        : dayjs(date).endOf("day").format("YYYY-MM-DD HH:mm:ss");
      onSubmit({
        type,
        date: finalDate,
        amount,
        category: selectedCategory,
        remark,
      });
      resetForm();
    } else {
      setAmount((prev) => prev + val);
    }
  };

  const resetForm = () => {
    setAmount("");
    setRemark("");
    setSelectedCategory(undefined);
    setType("expense");
    setDate(new Date());
    setShowRemarkInput(false);
  };

  // 点击外部区域时关闭输入框并隐藏键盘
  const handleDismiss = () => {
    if (showRemarkInput) {
      Keyboard.dismiss();
      setShowRemarkInput(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContent}
        style={styles.modalWrapper}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={-30}
          style={{ flex: 1 }}>
          <TouchableWithoutFeedback
            onPress={handleDismiss}
            accessible={false}>
            <View style={{ flex: 1 }}>
              {/* 右上角关闭按钮 */}
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
              />

              {/* 顶部操作栏 */}
              <View style={styles.row}>
                <Button
                  mode={type === "expense" ? "contained" : "outlined"}
                  style={styles.typeBtn}
                  onPress={() => setType("expense")}>
                  支出
                </Button>
                <Button
                  mode={type === "income" ? "contained" : "outlined"}
                  style={styles.typeBtn}
                  onPress={() => setType("income")}>
                  收入
                </Button>
                <Button
                  icon="calendar"
                  mode="contained"
                  onPress={() => setShowDatePicker(true)}
                  style={{ marginLeft: "auto" }}>
                  {dayjs(date).format("YYYY-MM-DD")}
                </Button>
              </View>

              {/* 金额输入 */}
              <TextInput
                style={styles.amountInput}
                mode="outlined"
                value={amount}
                editable={false}
                label="金额"
              />

              {/* 分类选择 */}
              <View style={{ flex: 1 }}>
                <FlatList
                  data={Object.keys(categoryIcons) as TxCategory[]}
                  numColumns={numColumns}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableRipple
                      onPress={() => setSelectedCategory(item)}
                      style={[
                        styles.categoryItem,
                        { width: itemWidth, paddingVertical: 10 },
                      ]}>
                      <View style={{ alignItems: "center" }}>
                        <IconButton
                          icon={categoryIcons[item]}
                          mode="contained"
                          size={16}
                          iconColor={
                            selectedCategory === item ? "#fff" : "#666"
                          }
                          containerColor={
                            selectedCategory === item ? "#F5D76E" : "#E0E0E0"
                          }
                        />
                        <Text
                          style={{
                            color:
                              selectedCategory === item ? "#F5D76E" : "#E0E0E0",
                          }}>
                          {item}
                        </Text>
                      </View>
                    </TouchableRipple>
                  )}
                />
              </View>

              {/* 备注 */}
              {showRemarkInput ? (
                <TextInput
                  mode="outlined"
                  style={styles.remarkInput}
                  value={remark}
                  maxLength={30}
                  onChangeText={setRemark}
                  placeholder="输入备注（最多30字）"
                  label={"备注"}
                />
              ) : (
                <Button
                  icon="note-text"
                  mode="text"
                  onPress={() => setShowRemarkInput(true)}
                  style={styles.noteBtn}>
                  添加备注
                </Button>
              )}
              <Divider />
              {/* 数字键盘 */}
              <View style={styles.keyboardContainer}>
                <View style={styles.keyboard}>
                  <View style={styles.numPad}>
                    {/* 第一行 */}
                    <View style={styles.numRow}>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("1")}>
                        <Text style={styles.keyText}>1</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("2")}>
                        <Text style={styles.keyText}>2</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("3")}>
                        <Text style={styles.keyText}>3</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 第二行 */}
                    <View style={styles.numRow}>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("4")}>
                        <Text style={styles.keyText}>4</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("5")}>
                        <Text style={styles.keyText}>5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("6")}>
                        <Text style={styles.keyText}>6</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 第三行 */}
                    <View style={styles.numRow}>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("7")}>
                        <Text style={styles.keyText}>7</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("8")}>
                        <Text style={styles.keyText}>8</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress("9")}>
                        <Text style={styles.keyText}>9</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 第四行 - 数字0占两份 */}
                    <View style={styles.numRow}>
                      <TouchableOpacity
                        style={[styles.key, styles.zeroKey]}
                        onPress={() => handleKeyPress("0")}>
                        <Text style={styles.keyText}>0</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.key}
                        onPress={() => handleKeyPress(".")}>
                        <Text style={styles.keyText}>.</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.actionPad}>
                    {/* 返回按钮 - 高度占1份 */}
                    <TouchableOpacity
                      style={[styles.actionKey, styles.backKey]}
                      onPress={() => handleKeyPress("back")}>
                      <IconButton
                        icon="backspace"
                        size={28}
                      />
                    </TouchableOpacity>

                    {/* 确定按钮 - 高度占3份 */}
                    <TouchableOpacity
                      style={[styles.actionKey, styles.okKey]}
                      onPress={() => handleKeyPress("ok")}>
                      <Text style={[styles.keyText, { color: "#fff" }]}>
                        确定
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}
