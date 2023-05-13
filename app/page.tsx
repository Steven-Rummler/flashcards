'use client';

import { Dispatch, use, useCallback, useEffect, useReducer, useState } from 'react';

import { Settings } from 'react-feather'
import { openDB } from 'idb';
import styles from './page.module.css'

type card = {
  front: string,
  back: string,
}

function reducer(state: card[], action: { type: string, payload: card }) {
  const actionCard = action.payload;
  if (action.type === 'add') {
    return [...state, action.payload];
  } else if (action.type === 'remove') {
    return state.filter(card => cardMatchBoth(card, actionCard));
  } else if (action.type === 'edit') {
    const matches = state.filter(card => cardMatchOne(card, actionCard));
    if (matches.length > 1) return [...state, action.payload];
    else if (matches.length === 1) return state.map(card => cardMatchOne(card, actionCard) ? actionCard : card);
  }
  return state;
}

function cardMatchBoth(a: card, b: card) {
  return a.front === b.front && a.back === b.back;
}

function cardMatchOne(a: card, b: card) {
  const or = a.front === b.front || a.back === b.back;
  const and = a.front === b.front && a.back === b.back;
  const xor = or && !and;
  return !xor;
}

const dummyCard = { front: 'Front', back: 'Back' };

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [cards, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setIndex(previousIndex => {
      if (cards.length === 0) return 0;
      return (previousIndex + 1) % cards.length;
    });
  }, 2000);

    return () => clearInterval(slideInterval);
  }, [cards]);


  const currentCard = cards[index] || dummyCard;

  return (
    <main className={styles.screen}>
        <div className={styles.cardHolder}>
          <div className={`${styles.cardArea} ${flipped ? styles.flipped : ''}`} onClick={() => setFlipped(toggle => !toggle)}>
          <div className={styles.card}>
            {currentCard.front}
            </div>
          <div className={`${styles.card} ${styles.flipped}`}>
            {currentCard.back}
            </div>
          </div>
        <Settings className={styles.editToggle} onClick={() => setShowSettings(toggle => !toggle)}/>
          </div>
        { showSettings && <SettingsSection {...{cards, dispatch}} />}
    </main>
  )
}


function SettingsSection(props: { cards: card[], dispatch: Dispatch<{  type: string;  payload: card;}> }) {
const [newFront, setNewFront] = useState('');
const [newBack, setNewBack] = useState('');

  return <div className={styles.editSection}>
{props.cards.map((card, index) => <div key={index}>{card.front} {card.back}</div>)}
<div>
  <input type="text" placeholder="Front" value={newFront} onChange={e => setNewFront(e.target.value)}/>
  <input type="text" placeholder="Back" value={newBack}onChange={e => setNewBack(e.target.value)}/>
</div>
<button onClick={() => {
  setNewFront('');
  setNewBack('');
  props.dispatch({ type: 'add', payload: { front: newFront, back: newBack } })
}}>
  Add Card
  </button>
  </div>
}

async function idbTesting() {
  const db = await openDB('testDB', 1, {upgrade(db) {
    db.createObjectStore('testStore', { autoIncrement: true });
  }});
  console.log(db);
  console.log(await db.getAllKeys('testStore'));
  // const getResult = await db.get('testStore', 'testKey');
  // console.log(getResult);
    const addResult = await db.add('testStore', 'testValue');
    console.log(addResult);  
}
