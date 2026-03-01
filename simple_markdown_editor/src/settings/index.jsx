import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Settings from './Settings';
import '../renderer/styles/variables.css';
import '../renderer/styles/app.css';
import '../renderer/styles/components.css';

// Standalone settings window entry (for when settings is opened as a separate window)
function SettingsApp() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings);
  }, []);

  if (!settings) return null;

  return (
    <Settings
      settings={settings}
      onClose={() => window.electronAPI.closeWindow()}
    />
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<SettingsApp />);
