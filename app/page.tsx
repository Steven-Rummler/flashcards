'use client';

import { CheckCircle, Edit, PlusCircle, RefreshCcw, Rewind, Save, Settings, XCircle } from 'react-feather'
import { Dispatch, useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { openDB } from 'idb';
import styles from './page.module.css'

type card = {
  id: number;
  front: string;
  back: string;
  stack: string;
}

type cardAction = {
  type: 'add' | 'remove' | 'edit';
  payload: card;
}

type stackAction = {
  type: 'rename';
  payload: { oldName: string, newName: string };
}

type action = cardAction | stackAction;

function reducer(state: card[], action: action) {
  if (action.type === 'add')
    return [...state, action.payload];
  else if (action.type === 'remove')
    return state.filter(card => card.id !== action.payload.id);
  else if (action.type === 'edit')
    return state.map(card => card.id === action.payload.id ? action.payload : card);
  else if (action.type === 'rename') {
    const { oldName, newName } = action.payload;
    return state.map(card => card.stack === oldName ? { ...card, stack: newName } : card);
  }
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

  useEffect(() => {
    pullFromBrowser().then(cards => {
      for (const card of cards) dispatch({ type: 'add', payload: card });
    });
  }, []);
  useEffect(() => { syncToBrowser(cards); }, [cards]);

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

function EditSection(props: { cards: card[], dispatch: Dispatch<action> }) {
  const stacks = useMemo(() => [...new Set(props.cards.map(card => card.stack))], [props.cards]);

  return <div className={styles.editSection}>
    {stacks.map(stack => <EditStack
      key={stack}
      stack={stack}
      cards={props.cards.filter(card => card.stack === stack)}
      dispatch={props.dispatch}
    />)}
    <EditStack
      stack={'New Stack'}
      cards={[]}
      dispatch={props.dispatch}
    />
  </div>;
}


function EditStack(props: { stack: string, cards: card[], dispatch: Dispatch<action> }) {
  const [editStack, setEditStack] = useState(false);
  const [newStack, setNewStack] = useState(props.stack === 'New Stack' ? '' : props.stack);

  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const stack = props.stack === 'New Stack' && newStack !== '' ? newStack : props.stack;

  return <>
    <div className={styles.stackName}>
      {editStack ?
        <textarea placeholder="Stack Name"
          rows={newStack.split('\n').length}
          value={newStack}
          onChange={e => setNewStack(e.target.value)} /> :
        <h2>{stack}</h2>}
      {editStack ?
        <Save
          stroke={newStack === '' ? 'grey' : 'black'}
          onClick={() => {
            if (props.cards.length > 0) props.dispatch({ type: 'rename', payload: { oldName: props.stack, newName: newStack } });
            setEditStack(false);
          }}
        /> :
        <Edit onClick={() => setEditStack(true)} />}
    </div>
    {props.cards.map(card => <CardRow key={card.id} {...{ card: { ...card, stack }, dispatch: props.dispatch }} />)}
    <textarea placeholder="Front"
      rows={newFront.split('\n').length}
      value={newFront}
      onChange={e => setNewFront(e.target.value)} />
    <textarea placeholder="Back"
      rows={newBack.split('\n').length}
      value={newBack}
      onChange={e => setNewBack(e.target.value)} />
    <div title='Add Card'>
      <PlusCircle
        stroke={newFront === '' || newBack === '' ? 'grey' : 'black'}
        onClick={() => {
          if (newFront === '' || newBack === '') return;
          setNewFront('');
          setNewBack('');
          const maxId = props.cards.reduce((max, card) => Math.max(max, card.id), 0);
          props.dispatch({ type: 'add', payload: { id: maxId + 1, front: newFront, back: newBack, stack } })
        }} />
    </div>
  </>
}

function CardRow(props: { card: card, dispatch: Dispatch<action> }) {
  const [editing, setEditing] = useState(false);
  const [newFront, setNewFront] = useState(props.card.front);
  const [newBack, setNewBack] = useState(props.card.back);

  if (editing) return <>
    <textarea placeholder="Front"
      rows={newFront.split('\n').length}
      value={newFront}
      onChange={e => setNewFront(e.target.value)} />
    <textarea placeholder="Back"
      rows={newBack.split('\n').length}
      value={newBack}
      onChange={e => setNewBack(e.target.value)} />
    <div title='Save Changes' onClick={() => {
      setEditing(false);
      props.dispatch({ type: 'edit', payload: { ...props.card, front: newFront, back: newBack } })
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

function getDB() {
  return openDB('db', 2, {
    async upgrade(db, oldVersion) {
      if (oldVersion < 1) db.createObjectStore('cards', { keyPath: 'id' });
      const transaction = db.transaction('cards', 'readwrite');
      let cursor = await transaction.objectStore('cards').openCursor();
      while (cursor) {
        cursor.update({ ...cursor.value, stack: 'Stack 1' });
        cursor = await cursor.continue();
      }
      await transaction.done;
    }
  });
}

async function pullFromBrowser() {
  const db = await getDB();
  return await db.getAll('cards');
}

async function syncToBrowser(cards: card[]) {
  const db = await getDB();
  const transaction = db.transaction('cards', 'readwrite');
  transaction.objectStore('cards').clear();
  for (const card of cards) {
    transaction.objectStore('cards').add(card);
  }
  await transaction.done;
}
