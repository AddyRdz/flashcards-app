const decks = [
  {
    id: createDeckId(),
    name: 'Spanish Basics',
    cards: [{ id: createCardId(), front: '¿Cómo estás?', back: 'How are you?' }],
  },
  {
    id: createDeckId(),
    name: 'JavaScript',
    cards: [{ id: createCardId(), front: 'const', back: 'Declares a block-scoped variable' }],
  },
];

let selectedDeckId = decks[0]?.id ?? null;
let activeModalMode = null;
let activeDeckId = null;
let activeCardId = null;
let lastFocusedElement = null;
let currentCardIndex = 0;
let isStudyCardFlipped = false;

const deckList = document.getElementById('deck-list');
const cardList = document.getElementById('card-list');
const modal = document.getElementById('deck-modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const deckForm = document.getElementById('deck-form');
const cardForm = document.getElementById('card-form');
const deckNameInput = document.getElementById('deck-name-input');
const cardFrontInput = document.getElementById('card-front-input');
const cardBackInput = document.getElementById('card-back-input');
const newDeckButton = document.getElementById('new-deck-btn');
const addDeckButton = document.getElementById('add-deck-btn');
const newCardHeaderButton = document.getElementById('new-card-header-btn');
const newCardButton = document.getElementById('new-card-btn');
const prevCardButton = document.getElementById('prev-card-btn');
const flipCardButton = document.getElementById('flip-card-btn');
const nextCardButton = document.getElementById('next-card-btn');
const studyCardButton = document.getElementById('study-card');
const studyCardFront = document.getElementById('study-card-front');
const studyCardBack = document.getElementById('study-card-back');
const deckStatus = document.getElementById('deck-status');
const deckTitle = document.getElementById('deck-title');
const deckSummary = document.getElementById('deck-summary');

function createDeckId() {
  return `deck-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createCardId() {
  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getSelectedDeck() {
  return decks.find((deck) => deck.id === selectedDeckId) ?? null;
}

function clampCurrentCardIndex(deck) {
  if (!deck || !deck.cards.length) {
    currentCardIndex = 0;
    return;
  }

  if (currentCardIndex >= deck.cards.length) {
    currentCardIndex = deck.cards.length - 1;
  }
}

function renderDecks() {
  if (!deckList) return;

  if (!decks.length) {
    deckList.innerHTML = '<li class="empty-state">No decks yet.</li>';
    return;
  }

  deckList.innerHTML = decks
    .map((deck) => {
      const selectedClass = deck.id === selectedDeckId ? 'selected' : '';
      return `
        <li class="deck-item-row ${selectedClass}">
          <button class="deck-select" type="button" data-action="select" data-id="${deck.id}">
            <span>${escapeHtml(deck.name)}</span>
          </button>
          <div class="deck-action-group">
            <button class="icon-button" type="button" data-action="rename" data-id="${deck.id}" aria-label="Rename ${escapeHtml(deck.name)}">Rename</button>
            <button class="icon-button danger" type="button" data-action="delete" data-id="${deck.id}" aria-label="Delete ${escapeHtml(deck.name)}">Delete</button>
          </div>
        </li>
      `;
    })
    .join('');
}

function renderCards() {
  if (!cardList) return;

  const deck = getSelectedDeck();

  if (!deck || !deck.cards.length) {
    cardList.innerHTML = '<li class="empty-state">No cards yet.</li>';
    return;
  }

  cardList.innerHTML = deck.cards
    .map((card, index) => {
      const currentClass = index === currentCardIndex ? 'current' : '';
      return `
        <li class="card-list-item ${currentClass}">
          <div class="card-list-content">
            <strong>${escapeHtml(card.front)}</strong>
            <span>${escapeHtml(card.back)}</span>
          </div>
          <div class="card-list-actions">
            <button class="icon-button" type="button" data-action="edit-card" data-id="${card.id}">Edit</button>
            <button class="icon-button danger" type="button" data-action="delete-card" data-id="${card.id}">Delete</button>
          </div>
        </li>
      `;
    })
    .join('');
}

function updateStudyCardView() {
  const deck = getSelectedDeck();

  if (!deck || !deck.cards.length) {
    deckStatus.textContent = 'No cards yet';
    deckTitle.textContent = deck?.name ?? 'No deck selected';
    deckSummary.textContent = 'Create a card to start studying.';
    if (studyCardFront) studyCardFront.textContent = 'Create or choose a deck to begin studying.';
    if (studyCardBack) studyCardBack.textContent = '';
    if (studyCardButton) studyCardButton.classList.remove('is-flipped');
    return;
  }

  clampCurrentCardIndex(deck);
  const card = deck.cards[currentCardIndex];

  if (!card) {
    return;
  }

  deckStatus.textContent = `Card ${currentCardIndex + 1} of ${deck.cards.length}`;
  deckTitle.textContent = deck.name;
  deckSummary.textContent = isStudyCardFlipped ? `Back: ${card.back}` : `Front: ${card.front}`;

  if (studyCardFront) studyCardFront.textContent = card.front;
  if (studyCardBack) studyCardBack.textContent = card.back;
  if (studyCardButton) {
    studyCardButton.classList.toggle('is-flipped', isStudyCardFlipped);
  }
}

function updateDeckPreview() {
  const deck = getSelectedDeck();

  if (!deck) {
    deckStatus.textContent = 'No deck selected';
    deckTitle.textContent = 'Create a deck';
    deckSummary.textContent = 'Use the new deck button to begin building your study set.';
    if (studyCardFront) studyCardFront.textContent = 'Create or choose a deck to begin studying.';
    if (studyCardBack) studyCardBack.textContent = '';
    if (studyCardButton) studyCardButton.classList.remove('is-flipped');
    return;
  }

  renderCards();
  updateStudyCardView();
}

function setModalMode(mode, options = {}) {
  activeModalMode = mode;
  activeDeckId = options.deckId ?? selectedDeckId;
  activeCardId = options.cardId ?? null;
  lastFocusedElement = document.activeElement;

  if (deckForm) {
    deckForm.classList.toggle('hidden', mode !== 'deck');
  }
  if (cardForm) {
    cardForm.classList.toggle('hidden', mode !== 'card');
  }

  if (mode === 'deck') {
    const deck = decks.find((item) => item.id === activeDeckId) ?? null;
    modalTitle.textContent = options.cardId ? 'Rename deck' : 'Create deck';
    modalDescription.textContent = options.cardId ? 'Update the selected deck name.' : 'Add a new deck to your study collection.';
    if (deckNameInput) {
      deckNameInput.value = deck?.name ?? '';
    }
  }

  if (mode === 'card') {
    const deck = decks.find((item) => item.id === activeDeckId) ?? null;
    const card = deck?.cards.find((item) => item.id === activeCardId) ?? null;
    modalTitle.textContent = activeCardId ? 'Edit card' : 'New card';
    modalDescription.textContent = activeCardId ? 'Update this card.' : 'Add a new card to the current deck.';
    if (cardFrontInput) {
      cardFrontInput.value = card?.front ?? '';
    }
    if (cardBackInput) {
      cardBackInput.value = card?.back ?? '';
    }
  }

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');

  window.requestAnimationFrame(() => {
    if (mode === 'deck' && deckNameInput) {
      deckNameInput.focus();
      deckNameInput.select();
    }
    if (mode === 'card' && cardFrontInput) {
      cardFrontInput.focus();
      cardFrontInput.select();
    }
  });
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
  activeModalMode = null;
  activeDeckId = null;
  activeCardId = null;
}

function selectDeck(deckId) {
  selectedDeckId = deckId;
  currentCardIndex = 0;
  isStudyCardFlipped = false;
  renderDecks();
  updateDeckPreview();
}

function handleDeckListClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const deckId = button.dataset.id;

  if (action === 'select') {
    selectDeck(deckId);
    return;
  }

  if (action === 'rename') {
    setModalMode('deck', { deckId });
    return;
  }

  if (action === 'delete') {
    const index = decks.findIndex((deck) => deck.id === deckId);
    if (index === -1) return;

    decks.splice(index, 1);

    if (selectedDeckId === deckId) {
      selectedDeckId = decks[0]?.id ?? null;
      currentCardIndex = 0;
      isStudyCardFlipped = false;
    }

    renderDecks();
    updateDeckPreview();
  }
}

function handleCardListClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const cardId = button.dataset.id;
  const deck = getSelectedDeck();

  if (!deck) return;

  if (action === 'edit-card') {
    setModalMode('card', { deckId: deck.id, cardId });
    return;
  }

  if (action === 'delete-card') {
    const index = deck.cards.findIndex((card) => card.id === cardId);
    if (index === -1) return;

    deck.cards.splice(index, 1);
    if (currentCardIndex >= deck.cards.length) {
      currentCardIndex = Math.max(0, deck.cards.length - 1);
    }
    isStudyCardFlipped = false;
    renderCards();
    updateStudyCardView();
  }
}

function handleModalKeydown(event) {
  if (!modal || modal.classList.contains('hidden')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key !== 'Tab') return;

  const focusableElements = Array.from(
    modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter((element) => !element.hasAttribute('disabled'));

  if (!focusableElements.length) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    if (document.activeElement === firstElement || !modal.contains(document.activeElement)) {
      event.preventDefault();
      lastElement.focus();
    }
  } else if (document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function openCardComposer() {
  if (!decks.length) {
    setModalMode('deck');
    return;
  }

  if (!selectedDeckId) {
    selectDeck(decks[0].id);
  }

  setModalMode('card', { deckId: selectedDeckId });
}

function handleModalSubmit(event) {
  event.preventDefault();

  if (activeModalMode === 'deck') {
    const trimmedName = deckNameInput.value.trim();

    if (!trimmedName) {
      deckNameInput.focus();
      return;
    }

    if (activeDeckId) {
      const deck = decks.find((item) => item.id === activeDeckId);
      if (deck) {
        deck.name = trimmedName;
      }
    } else {
      const newDeck = {
        id: createDeckId(),
        name: trimmedName,
        cards: [],
      };
      decks.unshift(newDeck);
      selectedDeckId = newDeck.id;
      currentCardIndex = 0;
      isStudyCardFlipped = false;
    }
  }

  if (activeModalMode === 'card') {
    const front = cardFrontInput.value.trim();
    const back = cardBackInput.value.trim();

    if (!front || !back) {
      if (!front) {
        cardFrontInput.focus();
      } else {
        cardBackInput.focus();
      }
      return;
    }

    const deck = decks.find((item) => item.id === activeDeckId) ?? getSelectedDeck();
    if (!deck) return;

    if (activeCardId) {
      const card = deck.cards.find((item) => item.id === activeCardId);
      if (card) {
        card.front = front;
        card.back = back;
      }
    } else {
      deck.cards.push({ id: createCardId(), front, back });
      currentCardIndex = deck.cards.length - 1;
      isStudyCardFlipped = false;
    }
  }

  renderDecks();
  updateDeckPreview();
  closeModal();
}

function showPreviousCard() {
  const deck = getSelectedDeck();
  if (!deck || !deck.cards.length) return;

  currentCardIndex = (currentCardIndex - 1 + deck.cards.length) % deck.cards.length;
  isStudyCardFlipped = false;
  updateStudyCardView();
  renderCards();
}

function showNextCard() {
  const deck = getSelectedDeck();
  if (!deck || !deck.cards.length) return;

  currentCardIndex = (currentCardIndex + 1) % deck.cards.length;
  isStudyCardFlipped = false;
  updateStudyCardView();
  renderCards();
}

function toggleStudyCard() {
  const deck = getSelectedDeck();
  if (!deck || !deck.cards.length) return;

  isStudyCardFlipped = !isStudyCardFlipped;
  updateStudyCardView();
}

if (deckList) {
  deckList.addEventListener('click', handleDeckListClick);
}

if (cardList) {
  cardList.addEventListener('click', handleCardListClick);
}

if (newDeckButton) {
  newDeckButton.addEventListener('click', () => setModalMode('deck'));
}

if (addDeckButton) {
  addDeckButton.addEventListener('click', () => setModalMode('deck'));
}

if (newCardHeaderButton) {
  newCardHeaderButton.addEventListener('click', openCardComposer);
}

if (newCardButton) {
  newCardButton.addEventListener('click', openCardComposer);
}

if (prevCardButton) {
  prevCardButton.addEventListener('click', showPreviousCard);
}

if (flipCardButton) {
  flipCardButton.addEventListener('click', toggleStudyCard);
}

if (nextCardButton) {
  nextCardButton.addEventListener('click', showNextCard);
}

if (studyCardButton) {
  studyCardButton.addEventListener('click', toggleStudyCard);
}

if (deckForm) {
  deckForm.addEventListener('submit', handleModalSubmit);
}

if (cardForm) {
  cardForm.addEventListener('submit', handleModalSubmit);
}

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.matches('[data-close-modal]')) {
      closeModal();
    }
  });
  document.addEventListener('keydown', handleModalKeydown);
}

renderDecks();
updateDeckPreview();
