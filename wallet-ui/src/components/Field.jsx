export default function Field({ label, error, ...inputProps }) {
  return (
    <div className="field">
      <label htmlFor={inputProps.id}>{label}</label>
      <input {...inputProps} />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
