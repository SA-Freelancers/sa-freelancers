import Link from "next/link";

type EmptyStateProps = {
  emoji?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  buttonText?: string;
  buttonLink?: string;
};

export default function EmptyState({
  emoji = "✨",
  title = "Nothing found yet",
  description = "Once there is content available, it will appear here.",
  actionLabel,
  onAction,
  buttonText,
  buttonLink,
}: EmptyStateProps) {
  const finalButtonText = actionLabel || buttonText;

  return (
    <div className="dark-card empty-state">
      <div className="empty-state-icon">{emoji}</div>

      <h2>{title}</h2>

      <p>{description}</p>

      {finalButtonText && onAction && (
        <button onClick={onAction} className="empty-state-button">
          {finalButtonText}
        </button>
      )}

      {finalButtonText && buttonLink && !onAction && (
        <Link href={buttonLink} className="empty-state-button">
          {finalButtonText}
        </Link>
      )}
    </div>
  );
}