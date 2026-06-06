export function CalendarLegend({ items }) {
  return (
    <div className="calendar-legend" aria-label="Legenda kalendarza">
      {items.map((item) => (
        <span key={item.label}>
          <i className={`legend-swatch ${item.type}`} aria-hidden="true"></i>
          {item.label}
        </span>
      ))}
    </div>
  );
}
