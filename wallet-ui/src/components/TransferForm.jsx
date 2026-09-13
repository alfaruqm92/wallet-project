import { useEffect, useState } from "react";
import client, { extractErrorMessage } from "../api/client";
import Field from "./Field";

export default function TransferForm({ prefill, onSuccess, onContactSaved }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRecipient, setLastRecipient] = useState(null);
  const [savingContact, setSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  // Kalau user klik salah satu kontak/transfer terakhir, isi otomatis field ini.
  useEffect(() => {
    if (prefill?.identifier) {
      setRecipient(prefill.identifier);
      setSuccess("");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.ts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // cegah user spam klik submit berkali-kali
    setError("");
    setSuccess("");
    setContactSaved(false);
    setLoading(true);
    try {
      const { data } = await client.post("/transfer", {
        recipient,
        amount: Number(amount),
      });
      setSuccess(`Berhasil transfer ke ${data.data.recipient}.`);
      setLastRecipient(recipient);
      setRecipient("");
      setAmount("");
      onSuccess(data.data.balance);
    } catch (err) {
      setError(extractErrorMessage(err, "Transfer gagal."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    if (!lastRecipient || savingContact) return;
    setSavingContact(true);
    try {
      await client.post("/contacts", { identifier: lastRecipient });
      setContactSaved(true);
      onContactSaved?.();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan kontak."));
    } finally {
      setSavingContact(false);
    }
  };

  return (
    <div className="transfer-card">
      {error && <div className="banner-error">{error}</div>}
      {success && (
        <div className="banner-success">
          {success}{" "}
          {!contactSaved && (
            <button className="inline-link" onClick={handleSaveContact} disabled={savingContact}>
              {savingContact ? "Menyimpan..." : "Simpan sebagai kontak"}
            </button>
          )}
          {contactSaved && <span> Kontak tersimpan.</span>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="transfer-row">
          <Field
            id="transfer-recipient"
            label="Kirim ke (email / no. HP)"
            type="text"
            placeholder="teman@mail.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={loading}
          />
          <Field
            id="transfer-amount"
            label="Nominal (Rp)"
            type="text"
            inputMode="numeric"
            placeholder="50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !recipient || !amount}>
            {loading && <span className="spinner" />}
            {loading ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </form>
    </div>
  );
}
