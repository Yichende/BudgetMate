import * as SQLite from "expo-sqlite";
import type { Transaction } from "../store/transactionStore";

export class SQLiteHelper {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync("transactions.db");
    this.init();
  }

  /** 初始化表结构 */
  private init() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);
  }

  /** 获取全部交易记录 */
  getAll(): Transaction[] {
    return this.db.getAllSync<Transaction>("SELECT * FROM transactions") || [];
  }

  /** 批量替换所有数据（事务操作） */
  replaceAll(transactions: Transaction[]) {
    this.db.execSync("BEGIN TRANSACTION");
    try {
      this.db.execSync("DELETE FROM transactions");
      for (const t of transactions) {
        this.insert(t);
      }
      this.db.execSync("COMMIT");
    } catch (e) {
      this.db.execSync("ROLLBACK");
      throw e;
    }
  }

  /** 插入单条记录 */
  insert(tx: Transaction) {
    this.db.runSync(
      "INSERT INTO transactions (id, type, category, amount, note, date, synced) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        tx.id,
        tx.type,
        tx.category,
        tx.amount,
        tx.note ?? null,
        tx.date,
        tx.synced ? 1 : 0,
      ]
    );
  }

  /** 更新记录 */
  update(tx: Transaction) {
    this.db.runSync(
      "UPDATE transactions SET type=?, category=?, amount=?, note=?, date=?, synced=? WHERE id=?",
      [
        tx.type,
        tx.category,
        tx.amount,
        tx.note ?? null,
        tx.date,
        tx.synced ? 1 : 0,
        tx.id,
      ]
    );
  }

  /** 删除记录 */
  delete(id: string) {
    this.db.runSync("DELETE FROM transactions WHERE id=?", [id]);
  }

  /** 更新同步状态 */
  markSynced(id: string) {
    this.db.runSync("UPDATE transactions SET synced=1 WHERE id=?", [id]);
  }

  /** 清空数据表 */
  clear() {
    this.db.execSync("DELETE FROM transactions");
  }
}

const dbHelper = new SQLiteHelper();
export default dbHelper;
