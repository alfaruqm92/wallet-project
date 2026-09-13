import { formatRupiah, formatDate } from "../utils/format";

const ICONS = {
  topup: "＋",
  transfer_in: "↓",
  transfer_out: "↑",
};

const LABELS = {
  topup: "Top up",
  transfer_in: "Transfer masuk",
  transfer_out: "Transfer keluar",
};

function isIncoming(type) {
  return type === "topup" || type === "transfer_in";
}

export default function TransactionsTable({ transactions, loading, error }) {
  if (loading) {
    return (
      <div className="ledger">
        <div className="ledger-empty">Memuat riwayat transaksi...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ledger">
        <div className="ledger-empty">{error}</div>
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="ledger">
        <div className="ledger-empty">Belum ada transaksi. Mutasi akan muncul di sini.</div>
      </div>
    );
  }

  return (
    <div className="ledger">
      {transactions.map((tx) => {
        const incoming = isIncoming(tx.type);
        return (
          <div className="ledger-row" key={tx.id}>
            <div className="ledger-row-left">
              <div className={`ledger-icon ${incoming ? "in" : "out"}`}>{ICONS[tx.type]}</div>
              <div>
                <div className="ledger-desc">{tx.description || LABELS[tx.type]}</div>
                <div className="ledger-date">{formatDate(tx.created_at)}</div>
              </div>
            </div>
            <div className={`ledger-amount ${incoming ? "in" : "out"}`}>
              {incoming ? "+" : "-"}
              {formatRupiah(tx.amount)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
