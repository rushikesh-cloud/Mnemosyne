type MaterialIconProps = {
  children: string;
  className?: string;
  fill?: boolean;
  size?: number;
};

export function MaterialIcon({ children, className = "", fill = false, size }: MaterialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${fill ? "fill" : ""} ${className}`}
      style={size ? { fontSize: size } : undefined}
    >
      {children}
    </span>
  );
}
