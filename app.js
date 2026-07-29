const decks = [
  {
    id: createDeckId(),
    name: 'Spanish Basics',
    cards: [{ front: '¿Cómo estás?', back: 'How are you?' }],
  },
  {
    id: createDeckId(),
    name: 'JavaScript',
    cards: [{ front: 'const', back: 'Declares a block-scoped variable' }],
  },
];

let selectedDeckId = decks[0]?.id ?? null;
let activeModalMode = null;
let activeDeckId = null;
let lastFocusedElement = null;

const deckList = document.getElementById('deck-list');
const modal = document.getElementById('deck-modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const deckForm = document.getElementById('deck-form');
const deckNameInput = document.getElementById('deck-name-input');
const newDeckButton = document.getElementById('new-deck-btn');
const addDeckButton = document.getElementById('add-deck-btn');
const deckStatus = document.getElementById('deck-status');
const deckTitle = document.getElementById('deck-title');
const deckSummary = document.getElementById('deck-summary');

function createDeckId() {
  return `deck-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function updateDeckPreview() {
  const deck = getSelectedDeck();

  if (!deck) {
    deckStatus.textContent = 'No deck selected';
    deckTitle.textContent = 'Create a deck';
    deckSummary.textContent = 'Use the new deck button to begin building your study set.';
    return;
  }

  deckStatus.textContent = `${deck.cards.length} card${deck.cards.length === 1 ? '' : 's'}`;
  deckTitle.textContent = deck.name;
  deckSummary.textContent = deck.cards[0]
    ? `${deck.cards[0].front} → ${deck.cards[0].back}`
    : 'Add cards soon to start studying.';
}

function openModal(mode, deckId = null) {
  activeModalMode = mode;
  activeDeckId = deckId;
  lastFocusedElement = document.activeElement;

  const deck = decks.find((item) => item.id === deckId) ?? null;
  modalTitle.textContent = mode === 'edit' ? 'Rename deck' : 'Create deck';
  modalDescription.textContent = mode === 'edit'
    ? 'Update the selected deck name.'
    : 'Add a new deck to your study collection.';
  deckNameInput.value = deck?.name ?? '';

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  window.requestAnimationFrame(() => {
    deckNameInput.focus();
    deckNameInput.select();
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
}

function handleDeckListClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const deckId = button.dataset.id;

  if (action === 'select') {
    selectedDeckId = deckId;
    renderDecks();
    updateDeckPreview();
    return;
  }

  if (action === 'rename') {
    openModal('edit', deckId);
    return;
  }

  if (action === 'delete') {
    const index = decks.findIndex((deck) => deck.id === deckId);
    if (index === -1) return;

    decks.splice(index, 1);

    if (selectedDeckId === deckId) {
      selectedDeckId = decks[0]?.id ?? null;
    }

    renderDecks();
    updateDeckPreview();
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

function handleModalSubmit(event) {
  event.preventDefault();
  const trimmedName = deckNameInput.value.trim();

  if (!trimmedName) {
    deckNameInput.focus();
    return;
  }

  if (activeModalMode === 'edit' && activeDeckId) {
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
  }

  renderDecks();
  updateDeckPreview();
  closeModal();
}

if (deckList) {
  deckList.addEventListener('click', handleDeckListClick);
}

if (newDeckButton) {
  newDeckButton.addEventListener('click', () => openModal('create'));
}

if (addDeckButton) {
  addDeckButton.addEventListener('click', () => openModal('create'));
}

if (deckForm) {
  deckForm.addEventListener('submit', handleModalSubmit);
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
