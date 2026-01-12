// Get event ID from URL query parameter
function getEventIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Get event from localStorage by ID
function getEventById(eventId) {
    const events = localStorage.getItem('events');
    if (!events) return null;
    
    try {
        const eventsList = JSON.parse(events);
        return eventsList.find(event => event.id === eventId);
    } catch (error) {
        console.error('Error parsing events:', error);
        return null;
    }
}

// Get all participants for an event
function getParticipants(eventId) {
    const participants = localStorage.getItem(`participants_${eventId}`);
    if (!participants) return [];
    
    try {
        return JSON.parse(participants);
    } catch (error) {
        console.error('Error parsing participants:', error);
        return [];
    }
}

// Get organizer of the event
function getEventOrganizer(event) {
    // Presupunem că organizatorul este utilizatorul curent la crearea evenimentului
    // Putem stoca aceasta informație in localStorage
    const organizerId = localStorage.getItem(`organizer_${event.id}`);
    if (!organizerId) {
        return 'Organizator necunoscut';
    }
    return organizerId;
}

// Check if current user is organizer
function isCurrentUserOrganizer(event) {
    const currentUserEmail = localStorage.getItem('userEmail');
    const organizerEmail = localStorage.getItem(`organizer_${event.id}`);
    return currentUserEmail === organizerEmail;
}

// Check if current user is already a participant
function isUserParticipant(eventId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    const participants = getParticipants(eventId);
    return participants.some(p => p.email === currentUserEmail);
}

// Add current user as participant
function addParticipant(eventId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) {
        showError('Trebuie să fii autentificat pentru a te înscrie.');
        return false;
    }

    // Check if already participating
    if (isUserParticipant(eventId)) {
        showError('Ești deja înscris la acest eveniment!');
        return false;
    }

    // Get event to check available spots
    const event = getEventById(eventId);
    if (!event) {
        showError('Evenimentul nu a fost găsit.');
        return false;
    }

    const participants = getParticipants(eventId);
    
    // Check max participants
    if (participants.length >= event.maxParticipants) {
        showError('Nu mai sunt locuri disponibile pentru acest eveniment!');
        return false;
    }

    // Add participant
    const newParticipant = {
        email: currentUserEmail,
        joinedAt: new Date().toISOString(),
        name: currentUserEmail.split('@')[0]
    };

    participants.push(newParticipant);
    localStorage.setItem(`participants_${eventId}`, JSON.stringify(participants));

    return true;
}

// Remove current user from participants
function removeParticipant(eventId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    const participants = getParticipants(eventId);
    
    const updatedParticipants = participants.filter(p => p.email !== currentUserEmail);
    localStorage.setItem(`participants_${eventId}`, JSON.stringify(updatedParticipants));

    return true;
}

// Calculate available spots
function getAvailableSpots(event) {
    const participants = getParticipants(event.id);
    return Math.max(0, event.maxParticipants - participants.length);
}

// Render event details
function renderEventDetails() {
    const eventId = getEventIdFromURL();
    
    if (!eventId) {
        showError('ID-ul evenimentului nu a fost găsit.');
        return;
    }

    const event = getEventById(eventId);
    if (!event) {
        showError('Evenimentul nu a fost găsit.');
        return;
    }

    const participants = getParticipants(eventId);
    const availableSpots = getAvailableSpots(event);
    const isOrganizer = isCurrentUserOrganizer(event);
    const isParticipant = isUserParticipant(eventId);
    const currentUserEmail = localStorage.getItem('userEmail');

    const container = document.getElementById('eventDetailContainer');
    
    container.innerHTML = `
        <div class="event-detail-card">
            <div class="event-header">
                <h1>${event.sportType}</h1>
                <span class="badge-large">${event.performanceLevel}</span>
            </div>

            <div class="event-info-grid">
                <div class="info-section">
                    <h3>📍 Locație</h3>
                    <p>${event.location}</p>
                </div>

                <div class="info-section">
                    <h3>📅 Data Desfășurării</h3>
                    <p>${formatDate(event.date)}</p>
                </div>

                <div class="info-section">
                    <h3>🕒 Ora</h3>
                    <p>${event.time}</p>
                </div>

                <div class="info-section">
                    <h3>👥 Participanți</h3>
                    <p>${participants.length} / ${event.maxParticipants} persoane</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(participants.length / event.maxParticipants) * 100}%"></div>
                    </div>
                    <p class="available-spots">
                        ${availableSpots} locuri disponibile
                    </p>
                </div>

                <div class="info-section">
                    <h3>🎯 Nivel Minim</h3>
                    <p>${event.performanceLevel}</p>
                </div>

                <div class="info-section">
                    <h3>🛠️ Dotări Necesare</h3>
                    <p>${event.equipment}</p>
                </div>
            </div>

            <div class="description-section">
                <h3>📝 Descriere</h3>
                <p>${event.description}</p>
            </div>

            <div class="organizer-section">
                <h3>👨‍💼 Organizator</h3>
                <div class="organizer-info">
                    <p><strong>${getEventOrganizer(event)}</strong></p>
                    ${isOrganizer ? '<span class="organizer-badge">TU ești organizatorul</span>' : ''}
                </div>
            </div>

            <div class="action-section">
                ${!isOrganizer ? `
                    <button id="participateBtn" class="btn ${isParticipant ? 'btn-danger' : 'btn-primary'}">
                        ${isParticipant ? '❌ Retrage-te din Eveniment' : availableSpots > 0 ? '✅ Înscrie-te la Eveniment' : '❌ Nu mai sunt locuri'}
                    </button>
                ` : `
                    <p class="organizer-info-text">Tu organizezi acest eveniment</p>
                `}
            </div>

            <div class="participants-section">
                <h3>👥 Lista Participanților (${participants.length})</h3>
                ${participants.length > 0 ? `
                    <ul class="participants-list">
                        ${participants.map(p => `
                            <li class="participant-item">
                                <div class="participant-info">
                                    <p><strong>${p.name}</strong></p>
                                    <p class="participant-email">${p.email}</p>
                                </div>
                                <p class="join-date">${formatDateTime(p.joinedAt)}</p>
                            </li>
                        `).join('')}
                    </ul>
                ` : `
                    <p class="empty-message">Niciun participant încă. Fii primul!</p>
                `}
            </div>
        </div>
    `;

    // Add event listener to participate button
    const participateBtn = document.getElementById('participateBtn');
    if (participateBtn) {
        participateBtn.addEventListener('click', handleParticipateClick);
    }
}

// Handle participate button click
function handleParticipateClick() {
    const eventId = getEventIdFromURL();
    const isParticipant = isUserParticipant(eventId);

    if (isParticipant) {
        // Remove participant
        if (confirm('Ești sigur că vrei să te retragi din acest eveniment?')) {
            removeParticipant(eventId);
            showSuccess('Ai fost retras din eveniment!');
            setTimeout(() => {
                renderEventDetails();
            }, 1000);
        }
    } else {
        // Add participant
        if (addParticipant(eventId)) {
            showSuccess('Înscrierea ta la eveniment a fost confirmată!');
            setTimeout(() => {
                renderEventDetails();
            }, 1000);
        }
    }
}

// Format date to readable format
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ro-RO', options);
}

// Format date and time
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

// Show error message
function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 5000);
    }
}

// Show success message
function showSuccess(message) {
    const container = document.getElementById('eventDetailContainer');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    renderEventDetails();
});
