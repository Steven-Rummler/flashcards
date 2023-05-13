'use client';

import { CheckCircle, PlusCircle, RotateCcw, Settings, XCircle } from 'react-feather'
import { Dispatch, Fragment, useCallback, useEffect, useReducer, useState } from 'react';

import { openDB } from 'idb';
import styles from './page.module.css'

type card = {
  id: number,
  front: string,
  back: string,
}

function reducer(state: card[], action: { type: string, payload: card }) {
  const actionCard = action.payload;
  if (action.type === 'add') {
    return [...state, action.payload];
  } else if (action.type === 'remove') {
    return state.filter(card => !cardMatchBoth(card, actionCard));
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

const dummyCard = { front: 'Empty', back: 'Empty' };

export default function Home() {
  const [showSettings, setShowSettings] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);
  const [cards, dispatch] = useReducer(reducer, []);

  const [todoPile, setTodoPile] = useState<number[]>([]);
  const [donePile, setDonePile] = useState<number[]>([]);
  const [redoPile, setRedoPile] = useState<number[]>([]);

  const reset = useCallback(() => {
    setTodoPile(cards.map(card => card.id));
    setDonePile([]);
    setRedoPile([]);
  }, [cards])

  useEffect(reset, [reset]);

  const currentCard = cards.find(card => card.id === todoPile[index]) ?? dummyCard;

  return (
    <main className={styles.screen}>
      <div className={styles.cardHolder}>
        <CheckCircle onClick={() => {
          if (currentCard === dummyCard) return;
          setDonePile(pile => [...pile, todoPile[index]]);
          setTodoPile(pile => pile.filter(id => id !== todoPile[index]));
        }}/>
        <div className={`${styles.cardArea} ${flipped ? styles.flipped : ''}`} onClick={() => setFlipped(toggle => !toggle)}>
          <div className={styles.card}>
            {currentCard.front}
          </div>
          <div className={`${styles.card} ${styles.flipped}`}>
            {currentCard.back}
          </div>
        </div>
        <XCircle onClick={() => {
          if (currentCard === dummyCard) return;
          setRedoPile(pile => [...pile, todoPile[index]]);
          setTodoPile(pile => pile.filter(id => id !== todoPile[index]));
        }}/>
        <Settings className={styles.editToggle} onClick={() => setShowSettings(toggle => !toggle)} />
        <RotateCcw className={styles.reset} onClick={reset} />
      </div>
      {showSettings && <EditSection {...{ cards, dispatch }} />}
    </main>
  )
}


function EditSection(props: { cards: card[], dispatch: Dispatch<{ type: string; payload: card; }> }) {
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  return <div className={styles.editSection}>
    {props.cards.map((card, index) => <Fragment key={index}>
      <div>{card.front}</div>
      <div>{card.back}</div>
      <XCircle onClick={() => props.dispatch({ type: 'remove', payload: card })}/>
      </Fragment>)}
      <input type="text" placeholder="Front" value={newFront} onChange={e => setNewFront(e.target.value)} />
      <input type="text" placeholder="Back" value={newBack} onChange={e => setNewBack(e.target.value)} />
      <PlusCircle stroke={newFront === '' || newBack === '' ? 'grey' : 'black'}
      onClick={() => {
        if (newFront === '' || newBack === '') return;
      setNewFront('');
      setNewBack('');
      const maxId = props.cards.reduce((max, card) => Math.max(max, card.id), 0);
      props.dispatch({ type: 'add', payload: { id: maxId + 1, front: newFront, back: newBack } })
    }} />
  </div>
}

// Minimum Viable Product
// go through cards manually
// edit cards
// save on page reload
// multiline text input
// card order up and down
// randomize card order

// Extras
// card collections/groups
// wrong pile for second run
// end of cards, reset run

async function idbTesting() {
  const db = await openDB('testDB', 1, {
    upgrade(db) {
      db.createObjectStore('testStore', { autoIncrement: true });
    }
  });
  console.log(db);
  console.log(await db.getAllKeys('testStore'));
  // const getResult = await db.get('testStore', 'testKey');
  // console.log(getResult);
  const addResult = await db.add('testStore', 'testValue');
  console.log(addResult);
}
