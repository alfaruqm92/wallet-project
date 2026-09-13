import { useState } from "react";
import client, { extractErrorMessage } from "../api/client";
import Field from "./Field";

export default function TopupModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // cegah double submit kalau tombol di-klik berkali-kali
    setError("");
    setLoading(true);
    try {
      const { data } = await client.post("/topup", { amount: Number(amount) });
      onSuccess(data.data.balance);
    } catch (err) {
      setError(extractErrorMessage(err, "Top up gagal."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Top up saldo</h3>
          <button className="modal-close" onClick={onClose} aria-label="Tutup" disabled={loading}>
            ✕
          </button>
        </div>

        {error && <div className="banner-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field
            id="topup-amount"
            label="Nominal (Rp)"
            type="text"
            inputMode="numeric"
            placeholder="cth. 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            disabled={loading}
          />
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !amount}>
              {loading && <span className="spinner" />}
              {loading ? "Memproses..." : "Top up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
