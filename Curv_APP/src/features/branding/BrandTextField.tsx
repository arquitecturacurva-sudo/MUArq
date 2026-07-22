type BrandTextFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel";
  multiline?: boolean;
  fullWidth?: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
};

export const BrandTextField = ({
  id,
  label,
  value,
  placeholder,
  type = "text",
  multiline = false,
  fullWidth = false,
  maxLength = 300,
  onChange,
}: BrandTextFieldProps) => (
  <label className="brand-form-field" data-span={fullWidth ? "full" : undefined} htmlFor={id}>
    <span>{label}</span>
    {multiline ? (
      <textarea
        id={id}
        className="brand-textarea"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    ) : (
      <input
        id={id}
        className="brand-text-input"
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    )}
  </label>
);
