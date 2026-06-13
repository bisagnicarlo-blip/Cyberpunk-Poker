// ==========================================
// 1. THE GAME STATE 
// ==========================================
const GameState = {
  deck: [],
  playerHand: [],
  heldCards: [false, false, false, false, false],
  balance: 10000,
  currentBet: 0,
  phase: 'IDLE',
  lastWin: null,
  winningIndices: []
};

// ==========================================
// 2. DOMAIN LOGIC
// ==========================================
function createDeck() {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const suit of suits) {
    for (let i = 0; i < ranks.length; i++) {
      deck.push({ suit: suit, rank: ranks[i], value: i + 2 });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function dealCards(deck, numCards) {
  return deck.splice(-numCards).reverse(); 
}

function evaluateHand(hand) {
  const sortedHand = [...hand].map((card, index) => ({ ...card, originalIndex: index }))
                              .sort((a, b) => b.value - a.value);
  
  const isFlush = sortedHand.every(card => card.suit === sortedHand[0].suit);
  let isStraight = true;
  for (let i = 0; i < sortedHand.length - 1; i++) {
    if (sortedHand[i].value - 1 !== sortedHand[i + 1].value) {
      isStraight = false; break;
    }
  }
  if (!isStraight && sortedHand[0].value === 14 && sortedHand[1].value === 5 && sortedHand[2].value === 4 && sortedHand[3].value === 3 && sortedHand[4].value === 2) {
    isStraight = true;
  }

  const valueCounts = {};
  sortedHand.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });

  let name = "High Card";
  let indices = [];

  if (isFlush && isStraight) {
    name = (sortedHand[0].value === 14 && sortedHand[1].value === 13) ? "Royal Flush" : "Straight Flush";
    indices = [0, 1, 2, 3, 4];
  } else if (Object.values(valueCounts).includes(4)) {
    name = "Four of a Kind";
    const val = Object.keys(valueCounts).find(k => valueCounts[k] === 4);
    indices = sortedHand.filter(c => c.value == val).map(c => c.originalIndex);
  } else if (Object.values(valueCounts).includes(3) && Object.values(valueCounts).includes(2)) {
    name = "Full House";
    indices = [0, 1, 2, 3, 4];
  } else if (isFlush) {
    name = "Flush"; indices = [0, 1, 2, 3, 4];
  } else if (isStraight) {
    name = "Straight"; indices = [0, 1, 2, 3, 4];
  } else if (Object.values(valueCounts).includes(3)) {
    name = "Three of a Kind";
    const val = Object.keys(valueCounts).find(k => k == sortedHand.find(c => valueCounts[c.value] === 3).value);
    indices = sortedHand.filter(c => c.value == val).map(c => c.originalIndex);
  } else if (Object.values(valueCounts).filter(v => v === 2).length === 2) {
    name = "Two Pair";
    indices = sortedHand.filter(c => valueCounts[c.value] === 2).map(c => c.originalIndex);
  } else {
    const pairVal = Object.keys(valueCounts).find(k => valueCounts[k] === 2);
    if (pairVal && parseInt(pairVal) >= 11) {
      name = "Jacks or Better";
      indices = sortedHand.filter(c => c.value == pairVal).map(c => c.originalIndex);
    }
  }
  return { name, indices };
}

function placeBet(amount) {
  if (amount <= 0) return;
  if (GameState.phase !== 'IDLE' && GameState.phase !== 'BETTING') return;
  if (amount > GameState.balance) { alert("Insufficient funds!"); return; }
  GameState.balance -= amount;
  GameState.currentBet += amount;
  GameState.phase = 'BETTING';
}

function dealRound() {
  if (GameState.phase !== 'BETTING') return;
  GameState.deck = createDeck();
  shuffle(GameState.deck);
  GameState.playerHand = dealCards(GameState.deck, 5);
  GameState.heldCards = [false, false, false, false, false]; 
  GameState.lastWin = null;
  GameState.winningIndices = [];
  GameState.phase = 'DEALT';
}

function toggleHold(index) {
  if (GameState.phase !== 'DEALT') return; 
  GameState.heldCards[index] = !GameState.heldCards[index];
}

function drawAndEvaluateRound() {
  if (GameState.phase !== 'DEALT') return;
  GameState.phase = 'EVALUATING';
  for (let i = 0; i < 5; i++) {
    if (GameState.heldCards[i] === false) GameState.playerHand[i] = dealCards(GameState.deck, 1)[0]; 
  }
  const result = evaluateHand(GameState.playerHand);
  const payouts = { "Royal Flush": 250, "Straight Flush": 50, "Four of a Kind": 25, "Full House": 9, "Flush": 6, "Straight": 4, "Three of a Kind": 3, "Two Pair": 3, "Jacks or Better": 2, "High Card": 0 };
  const multiplier = payouts[result.name] || 0; 
  GameState.balance += GameState.currentBet * multiplier;
  GameState.lastWin = multiplier > 0 ? result.name : null;
  GameState.winningIndices = multiplier > 0 ? result.indices : [];
  GameState.currentBet = 0;
  GameState.phase = 'IDLE';
}

function resetGame() {
    Object.assign(GameState, { balance: 15000, currentBet: 0, playerHand: [], heldCards: [false, false, false, false, false], lastWin: null, winningIndices: [], phase: 'IDLE' });
}
