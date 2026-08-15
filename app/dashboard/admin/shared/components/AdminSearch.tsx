"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function AdminSearch({
  value,
  onChange,
  placeholder = "Search...",
}: Props) {
  return (
    <input
      className="profile-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      style={{
        minWidth: 320,
      }}
    />
  );
}