'use client';

import { CheckCircle, PlusCircle, RefreshCcw, Rewind, Save, Settings, XCircle } from 'react-feather'
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
  if (action.type === 'add') return [...state, action.payload];
  else if (action.type === 'remove') return state.filter(card => card.id !== actionCard.id);
  else if (action.type === 'edit') return state.map(card => card.id === actionCard.id ? actionCard : card);
  return state;
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
    setTodoPile(cards.map(card => ({ id: card.id, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ id }) => id));
    setDonePile([]);
    setRedoPile([]);
  }, [cards])

  useEffect(reset, [reset]);

  const currentCard = cards.find(card => card.id === todoPile[index]) ?? dummyCard;

  return (
    <main className={styles.screen}>
      <div className={styles.cardHolder}>
        <div title='Correct'>
          <CheckCircle onClick={() => {
            if (currentCard === dummyCard) return;
            setDonePile(pile => [...pile, todoPile[index]]);
            setTodoPile(pile => pile.filter(id => id !== todoPile[index]));
          }} />
        </div>
        <div className={`${styles.cardArea} ${flipped ? styles.flipped : ''}`} onClick={() => setFlipped(toggle => !toggle)}>
          <div className={styles.card}>
            {currentCard.front}
          </div>
          <div className={`${styles.card} ${styles.flipped}`}>
            {currentCard.back}
          </div>
        </div>
        <div title='Incorrect'>
          <XCircle onClick={() => {
            if (currentCard === dummyCard) return;
            setRedoPile(pile => [...pile, todoPile[index]]);
            setTodoPile(pile => pile.filter(id => id !== todoPile[index]));
          }} />
        </div>
        <div title='Edit Cards'>
          <Settings className={styles.editToggle} onClick={() => setShowSettings(toggle => !toggle)} />
        </div>
        <div title='Reset and Shuffle Cards'>
          <RefreshCcw className={styles.reset} onClick={reset} />
        </div>
        <div title='Retry Incorrect Cards'>
          <Rewind className={styles.retry} onClick={() => {
            setTodoPile(pile => [...pile, ...redoPile]);
            setRedoPile([]);
          }} />
        </div>
        <div className={styles.todoCount}>Not Tested: {todoPile.length}</div>
        <div className={styles.doneCount}>Correct: {donePile.length}</div>
        <div className={styles.redoCount}>Incorrect: {redoPile.length}</div>
      </div>
      {showSettings && <EditSection {...{ cards, dispatch }} />}
    </main>
  )
}


function EditSection(props: { cards: card[], dispatch: Dispatch<{ type: string; payload: card; }> }) {
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  return <div className={styles.editSection}>
    {props.cards.map((card, index) => <CardRow key={card.id} {...{ card, dispatch: props.dispatch }} />)}
    <input type="text" placeholder="Front" value={newFront} onChange={e => setNewFront(e.target.value)} />
    <input type="text" placeholder="Back" value={newBack} onChange={e => setNewBack(e.target.value)} />
    <div title='Add Card'>
      <PlusCircle stroke={newFront === '' || newBack === '' ? 'grey' : 'black'}
        onClick={() => {
          if (newFront === '' || newBack === '') return;
          setNewFront('');
          setNewBack('');
          const maxId = props.cards.reduce((max, card) => Math.max(max, card.id), 0);
          props.dispatch({ type: 'add', payload: { id: maxId + 1, front: newFront, back: newBack } })
        }} />
    </div>
  </div>
}

function CardRow(props: { card: card, dispatch: Dispatch<{ type: string; payload: card; }> }) {
  const [editing, setEditing] = useState(false);
  const [newFront, setNewFront] = useState(props.card.front);
  const [newBack, setNewBack] = useState(props.card.back);

  if (editing) return <>
    <input type="text" placeholder="Front" value={newFront} onChange={e => setNewFront(e.target.value)} />
    <input type="text" placeholder="Back" value={newBack} onChange={e => setNewBack(e.target.value)} />
    <div title='Save Changes' onClick={() => {
      setEditing(false);
      props.dispatch({ type: 'edit', payload: { id: props.card.id, front: newFront, back: newBack } })
    }}>
      <Save />
    </div>
  </>;

  return <>
    <div className={styles.sideText} onClick={() => setEditing(true)}>
      {props.card.front}
    </div>
    <div className={styles.sideText} onClick={() => setEditing(true)}>
      {props.card.back}
    </div>
    <div title='Delete Card' onClick={() => props.dispatch({ type: 'remove', payload: props.card })}>
      <XCircle />
    </div>
  </>;
}

// Minimum Viable Product
// save on page reload
// multiline text input

// Extras
// card collections/groups

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
