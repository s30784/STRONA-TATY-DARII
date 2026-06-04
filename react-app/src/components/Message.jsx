export function Message({ message }) {
  if (!message?.text) return null;
  return <div className={`msg ${message.type || 'info'}`}>{message.text}</div>;
}
