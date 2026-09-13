import { useCallback, useEffect, useRef, useState } from "react";
import client, { extractErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TopupModal from "../components/TopupModal";
import TransferForm from "../components/TransferForm";
import TransactionsTable from "../components/TransactionsTable";
import QuickRecipients from "../components/QuickRecipients";
import { formatRupiah } from "../utils/format";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(null);
  const [balanceError, setBalanceError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txError, setTxError] = useState("");
  const [showTopup, setShowTopup] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [contactsVersion, setContactsVersion] = useState(0);
  const transferRef = useRef(null);

  const loadBalance = useCallback(async () => {
    try {
      const { data } = await client.get("/wallet");
      setBalance(data.data.balance);
      setBalanceError("");
    } catch (err) {
      setBalanceError(extractErrorMessage(err, "Gagal memuat saldo."));
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const { data } = await client.get("/transactions");
      setTransactions(data.data.data ?? []);
      setTxError("");
    } catch (err) {
      setTxError(extractErrorMessage(err, "Gagal memuat riwayat transaksi."));
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
    loadTransactions();
  }, [loadBalance, loadTransactions]);

  const handleMutationSuccess = (newBalance) => {
    setBalance(newBalance);
    loadTransactions();
  };

  const scrollToTransfer = () => {
    transferRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectRecipient = (identifier) => {
    setPrefill({ identifier, ts: Date.now() });
    scrollToTransfer();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">i</div>
            iPay
          </div>
          <div className="topbar-user">
            <span>{user?.username}</span>
            <button className="logout-link" onClick={logout}>
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        <div className="hero-card">
          <p className="hero-label">Saldo saat ini</p>
          {balanceError ? (
            <div className="banner-error" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              {balanceError}
            </div>
          ) : (
            <p className="hero-balance">
              <span className="currency">Rp</span>
              {balance === null ? "····" : formatRupiah(balance)}
            </p>
          )}
          <div className="hero-actions">
            <button className="hero-btn-solid" onClick={scrollToTransfer}>
              Kirim
            </button>
            <button className="hero-btn-ghost" onClick={() => setShowTopup(true)}>
              Top up
            </button>
          </div>
        </div>

        <div ref={transferRef}>
          <div className="section-heading">
            <h2>Transfer saldo</h2>
          </div>
          <QuickRecipients refreshKey={contactsVersion} onSelect={handleSelectRecipient} />
          <TransferForm
            prefill={prefill}
            onSuccess={handleMutationSuccess}
            onContactSaved={() => setContactsVersion((v) => v + 1)}
          />
        </div>

        <div className="section-heading">
          <h2>Transaksi</h2>
          <span className="hint">{transactions.length} terakhir</span>
        </div>
        <TransactionsTable transactions={transactions} loading={txLoading} error={txError} />
      </main>

      {showTopup && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={(newBalance) => {
            handleMutationSuccess(newBalance);
            setShowTopup(false);
          }}
        />
      )}
    </div>
  );
}
