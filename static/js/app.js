// State Management
let state = {
    notes: [],
    filters: {
        search: '',
        type: 'all',
        sort: 'newest'
    },
    selectedNote: null
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    cacheStatus: document.getElementById('cache-status'),
    statusDot: document.querySelector('.status-dot'),
    searchInput: document.getElementById('search-input'),
    sortSelect: document.getElementById('sort-select'),
    filterChipsContainer: document.getElementById('filter-chips-container'),
    cardsGrid: document.getElementById('cards-grid'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    emptyState: document.getElementById('empty-state'),
    
    // Modal
    tweetModal: document.getElementById('tweet-modal'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCount: document.getElementById('char-count'),
    progressCircle: document.querySelector('.progress-ring__circle'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelTweetBtn: document.getElementById('cancel-tweet-btn'),
    postTweetBtn: document.getElementById('post-tweet-btn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleaseNotes();
});

// Event Listeners
function setupEventListeners() {
    // Refresh buttons
    elements.refreshBtn.addEventListener('click', () => fetchReleaseNotes(true));
    elements.retryBtn.addEventListener('click', () => fetchReleaseNotes(true));

    // Search input
    elements.searchInput.addEventListener('input', debounce((e) => {
        state.filters.search = e.target.value.toLowerCase().trim();
        render();
    }, 250));

    // Sort selection
    elements.sortSelect.addEventListener('change', (e) => {
        state.filters.sort = e.target.value;
        render();
    });

    // Filter Chips
    elements.filterChipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        
        // Update active chip UI
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Update filter state
        state.filters.type = chip.dataset.type;
        render();
    });

    // Tweet Modal actions
    elements.closeModalBtn.addEventListener('click', closeTweetModal);
    elements.cancelTweetBtn.addEventListener('click', closeTweetModal);
    elements.tweetTextarea.addEventListener('input', updateCharCount);
    elements.postTweetBtn.addEventListener('click', handleTweetSubmit);

    // Close modal on click outside
    elements.tweetModal.addEventListener('click', (e) => {
        if (e.target === elements.tweetModal) {
            closeTweetModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.tweetModal.classList.contains('hidden')) {
            closeTweetModal();
        }
    });
}

// Fetch Data from Server
async function fetchReleaseNotes(forceRefresh = false) {
    showLoading();
    
    try {
        const url = `/api/release-notes${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            state.notes = result.data;
            updateStatusText(result.cached_at);
            updateFilterCounts();
            render();
        } else {
            throw new Error(result.error || 'Unknown server error');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        showError(error.message);
    }
}

// Render release notes
function render() {
    let filtered = [...state.notes];

    // 1. Filter by category
    if (state.filters.type !== 'all') {
        filtered = filtered.filter(item => item.type === state.filters.type);
    }

    // 2. Filter by search query
    if (state.filters.search) {
        const query = state.filters.search;
        filtered = filtered.filter(item => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.html;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            
            return item.date.toLowerCase().includes(query) ||
                   item.type.toLowerCase().includes(query) ||
                   textContent.toLowerCase().includes(query);
        });
    }

    // 3. Sort
    filtered.sort((a, b) => {
        const dateA = new Date(a.updated);
        const dateB = new Date(b.updated);
        return state.filters.sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Render logic
    hideLoading();
    
    if (filtered.length === 0) {
        elements.cardsGrid.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
    } else {
        elements.emptyState.classList.add('hidden');
        elements.cardsGrid.innerHTML = '';
        
        filtered.forEach(item => {
            elements.cardsGrid.appendChild(createCard(item));
        });
        elements.cardsGrid.classList.remove('hidden');
    }
}

// Helper to create card element
function createCard(item) {
    const card = document.createElement('article');
    card.className = 'release-card';
    card.setAttribute('data-type', item.type);
    
    // Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    
    const badgeGroup = document.createElement('div');
    badgeGroup.className = 'badge-date-group';
    
    const badge = document.createElement('span');
    badge.className = 'type-badge';
    badge.setAttribute('data-type', item.type);
    badge.textContent = item.type;
    
    const date = document.createElement('span');
    date.className = 'card-date';
    date.textContent = item.date;
    
    badgeGroup.appendChild(badge);
    badgeGroup.appendChild(date);
    
    const sourceLink = document.createElement('a');
    sourceLink.className = 'source-link';
    sourceLink.href = item.link;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.title = 'View Official Documentation';
    sourceLink.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
    `;
    
    cardHeader.appendChild(badgeGroup);
    cardHeader.appendChild(sourceLink);
    
    // Content HTML
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    cardContent.innerHTML = item.html;
    
    // Actions Footer
    const cardActions = document.createElement('div');
    cardActions.className = 'card-actions';
    
    const tweetBtn = document.createElement('button');
    tweetBtn.className = 'btn btn-card-tweet';
    tweetBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px; height:14px; margin-right:4px;">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span>Tweet Update</span>
    `;
    tweetBtn.addEventListener('click', () => openTweetModal(item));
    
    cardActions.appendChild(tweetBtn);
    
    card.appendChild(cardHeader);
    card.appendChild(cardContent);
    card.appendChild(cardActions);
    
    return card;
}

// UI States
function showLoading() {
    elements.loadingState.classList.remove('hidden');
    elements.cardsGrid.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    
    elements.refreshBtn.classList.add('spinning');
    elements.refreshBtn.disabled = true;
    elements.statusDot.className = 'status-dot loading';
    elements.cacheStatus.textContent = 'Updating feed...';
}

function hideLoading() {
    elements.loadingState.classList.add('hidden');
    elements.refreshBtn.classList.remove('spinning');
    elements.refreshBtn.disabled = false;
}

function showError(msg) {
    hideLoading();
    elements.errorMessage.textContent = msg || 'Could not load release notes.';
    elements.errorState.classList.remove('hidden');
    elements.cardsGrid.classList.add('hidden');
    elements.statusDot.className = 'status-dot';
    elements.statusDot.style.backgroundColor = 'var(--type-breaking)';
    elements.statusDot.style.boxShadow = '0 0 8px var(--type-breaking)';
    elements.cacheStatus.textContent = 'Failed to connect';
}

function updateStatusText(cachedAt) {
    elements.statusDot.className = 'status-dot';
    elements.statusDot.style.backgroundColor = 'var(--type-feature)';
    elements.statusDot.style.boxShadow = '0 0 8px var(--type-feature)';
    
    if (!cachedAt) {
        elements.cacheStatus.textContent = 'Connected';
        return;
    }
    
    const date = new Date(cachedAt);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.cacheStatus.textContent = `Feed updated at ${timeString}`;
}

// Counts for filter chips
function updateFilterCounts() {
    const counts = {
        all: state.notes.length,
        Feature: 0,
        Breaking: 0,
        Announcement: 0,
        Change: 0,
        Issue: 0
    };
    
    state.notes.forEach(note => {
        if (counts[note.type] !== undefined) {
            counts[note.type]++;
        }
    });
    
    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-feature').textContent = counts.Feature;
    document.getElementById('count-breaking').textContent = counts.Breaking;
    document.getElementById('count-announcement').textContent = counts.Announcement;
    document.getElementById('count-change').textContent = counts.Change;
    document.getElementById('count-issue').textContent = counts.Issue;
}

// Tweet Modal logic
function openTweetModal(item) {
    state.selectedNote = item;
    
    // Strip HTML to get plain text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = item.html;
    
    // Clean text: strip HTML, strip excessive whitespace/newlines
    let plainText = (tempDiv.textContent || tempDiv.innerText || '').trim();
    plainText = plainText.replace(/\s+/g, ' '); // collapse double spaces/newlines
    
    // Format Tweet: "BigQuery [Type] ([Date]): [Content] Read more: [Link]"
    const prefix = `BigQuery ${item.type} (${item.date}): `;
    const suffix = `\n\nRead more: ${item.link}`;
    
    // Maximum characters allowed for the text body
    const totalMax = 280;
    const reservedChars = prefix.length + suffix.length;
    const maxBody = totalMax - reservedChars - 3; // reserve 3 chars for '...'
    
    let tweetContent = plainText;
    if (tweetContent.length > maxBody) {
        tweetContent = tweetContent.substring(0, maxBody).trim() + '...';
    }
    
    const initialText = `${prefix}${tweetContent}${suffix}`;
    elements.tweetTextarea.value = initialText;
    
    // Show Modal
    elements.tweetModal.classList.remove('hidden');
    elements.tweetTextarea.focus();
    
    // Set caret position at the beginning of the editable content
    // of the body text (after prefix, before the suffix/ellipsis)
    const caretPos = prefix.length + tweetContent.length;
    elements.tweetTextarea.setSelectionRange(caretPos, caretPos);
    
    updateCharCount();
}

function closeTweetModal() {
    elements.tweetModal.classList.add('hidden');
    state.selectedNote = null;
}

function updateCharCount() {
    const textLength = elements.tweetTextarea.value.length;
    elements.charCount.textContent = textLength;
    
    // Calculate progress circle stroke
    const circleRadius = 8;
    const circumference = 2 * Math.PI * circleRadius;
    const progress = Math.min(textLength, 280) / 280;
    const strokeOffset = circumference - (progress * circumference);
    
    elements.progressCircle.style.strokeDashoffset = strokeOffset;
    
    // Text Length Warning Colors
    const counterWrapper = document.querySelector('.char-counter');
    if (textLength >= 280) {
        counterWrapper.className = 'char-counter danger';
        elements.progressCircle.style.stroke = 'var(--type-breaking)';
    } else if (textLength >= 260) {
        counterWrapper.className = 'char-counter warning';
        elements.progressCircle.style.stroke = 'var(--type-issue)';
    } else {
        counterWrapper.className = 'char-counter';
        elements.progressCircle.style.stroke = '#1d9bf0';
    }
    
    // Disable post button if length is greater than 280 or empty
    elements.postTweetBtn.disabled = textLength > 280 || textLength === 0;
}

function handleTweetSubmit() {
    const tweetText = elements.tweetTextarea.value;
    if (tweetText.length > 280 || tweetText.length === 0) return;
    
    // Open Twitter Web Intent
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    closeTweetModal();
}

// Utility: Debounce inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
