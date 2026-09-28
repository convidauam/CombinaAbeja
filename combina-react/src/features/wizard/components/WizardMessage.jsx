import { useEffect, useState } from 'react';

const AUTO_DISMISS_MS = 4000;

export function WizardMessage({ text, type = 'error', id }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id]);

  if (!visible) return null;

  const className =
    type === 'success'
      ? 'success-message'
      : type === 'warning'
      ? 'warning-message'
      : 'error-message';

  return <div className={className}>{text}</div>;
}