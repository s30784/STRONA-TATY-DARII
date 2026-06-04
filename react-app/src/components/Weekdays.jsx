export function Weekdays() {
  return (
    <div className="calendar-weekdays">
      {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => <div className="weekday" key={day}>{day}</div>)}
    </div>
  );
}
