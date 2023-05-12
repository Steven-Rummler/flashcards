'use client';

import { Settings } from 'react-feather'
import styles from './page.module.css'
import { useState } from 'react';

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [flipped, setFlipped] = useState(false);

  return (
    <main>
        <div className={styles.cardHolder}>
          <div className={`${styles.cardArea} ${flipped ? styles.flipped : ''}`} onClick={() => setFlipped(toggle => !toggle)}>
          <div className={styles.card}>
            Front
            </div>
          <div className={`${styles.card} ${styles.flipped}`}>
            Back
            </div>
          </div>
          </div>
        <Settings className={styles.settingsToggle} onClick={() => setShowSettings(toggle => !toggle)}/>
        { showSettings && <SettingsSection />}
    </main>
  )
}


function SettingsSection() {
  return <div className={styles.settingsSection}>Settings</div>
}

function Flashcard() {
  return <div className={styles.flashcard}>Flashcard</div>
}
