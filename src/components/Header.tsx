import "./Header.css";

type Props = {
  className?: string;
  title?: string;
};
export default function Header({ className, title }: Props) {
  return (
    <header data-tauri-drag-region className={`lotion:header ${className}`}>
      {title != null && <span className="lotion:header:title">{title}</span>}
    </header>
  );
}
