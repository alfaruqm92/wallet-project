import { useCallback, useEffect, useState } from "react";
import client, { extractErrorMessage } from "../api/client";
import Field from "./Field";

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

export default function QuickRecipients({ refreshKey, onSelect }) {
  const [recent, setRecent] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIdentifier, setNewIdentifier] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [recentRes, contactsRes] = await Promise.all([
        client.get("/transfers/recent"),
        client.get("/contacts"),
      ]);
      setRecent(recentRes.data.data ?? []);
      setContacts(contactsRes.data.data ?? []);
    } catch {
      // Diamkan saja - bagian ini bersifat pelengkap, tidak mengganggu transfer utama.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (addLoading) return;
    setAddError("");
    setAddLoading(true);
    try {
      await client.post("/contacts", {
        identifier: newIdentifier,
        nickname: newNickname || undefined,
      });
      setNewIdentifier("");
      setNewNickname("");
      setShowAddForm(false);
      load();
    } catch (err) {
      setAddError(extractErrorMessage(err, "Gagal menyimpan kontak."));
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteContact = async (id) => {
    setDeletingId(id);
    try {
      await client.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // Kalau gagal hapus, biarkan tetap tampil - user bisa coba lagi.
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return null;

  const savedIdentifiers = new Set(contacts.map((c) => c.identifier));
  const recentNotSaved = recent.filter((r) => !savedIdentifiers.has(r.identifier));

  if (!recentNotSaved.length && !contacts.length && !showAddForm) {
    return (
      <div className="quick-recipients">
        <button className="chip chip-add" onClick={() => setShowAddForm(true)}>
          <span className="chip-avatar chip-avatar-add">+</span>
          Tambah kontak
        </button>
      </div>
    );
  }

  return (
    <div className="quick-recipients">
      {contacts.length > 0 && (
        <>
          <p className="quick-recipients-label">Kontak tersimpan</p>
          <div className="chip-row">
            {contacts.map((c) => (
              <div className="chip" key={`contact-${c.id}`}>
                <button className="chip-main" onClick={() => onSelect(c.identifier)}>
                  <span className="chip-avatar">{initials(c.nickname || c.username)}</span>
                  {c.nickname || c.username}
                </button>
                <button
                  className="chip-remove"
                  onClick={() => handleDeleteContact(c.id)}
                  disabled={deletingId === c.id}
                  aria-label={`Hapus ${c.nickname || c.username}`}
                >
                  ✕
                </button>
              </div>
            ))}
            <button className="chip chip-add" onClick={() => setShowAddForm(true)}>
              <span className="chip-avatar chip-avatar-add">+</span>
              Tambah
            </button>
          </div>
        </>
      )}

      {contacts.length === 0 && (
        <div className="chip-row">
          <button className="chip chip-add" onClick={() => setShowAddForm(true)}>
            <span className="chip-avatar chip-avatar-add">+</span>
            Tambah kontak
          </button>
        </div>
      )}

      {recentNotSaved.length > 0 && (
        <>
          <p className="quick-recipients-label">Transfer terakhir</p>
          <div className="chip-row">
            {recentNotSaved.map((r) => (
              <button className="chip chip-main" key={`recent-${r.id}`} onClick={() => onSelect(r.identifier)}>
                <span className="chip-avatar chip-avatar-recent">{initials(r.username)}</span>
                {r.username}
              </button>
            ))}
          </div>
        </>
      )}

      {showAddForm && (
        <form className="add-contact-form" onSubmit={handleAddContact}>
          {addError && <div className="banner-error">{addError}</div>}
          <Field
            id="contact-identifier"
            label="Email / no. HP"
            type="text"
            placeholder="teman@mail.com"
            value={newIdentifier}
            onChange={(e) => setNewIdentifier(e.target.value)}
            disabled={addLoading}
            autoFocus
          />
          <Field
            id="contact-nickname"
            label="Nama panggilan (opsional)"
            type="text"
            placeholder="cth. Budi"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            disabled={addLoading}
          />
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddForm(false)}
              disabled={addLoading}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={addLoading || !newIdentifier}>
              {addLoading && <span className="spinner" />}
              {addLoading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
