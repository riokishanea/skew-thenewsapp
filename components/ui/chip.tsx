type ChipProps = {
  children: React.ReactNode;
  selected?: boolean;
};

export function Chip({ children, selected = false }: ChipProps) {
  return (
    <span className={`chip${selected ? " chip--selected" : ""}`}>
      {children}
      <span className="chip__plus" aria-hidden="true">+</span>
    </span>
  );
}
