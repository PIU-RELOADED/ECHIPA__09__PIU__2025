function getEventIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

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

function getEventOrganizer(event) {
    const organizerId = localStorage.getItem(`organizer_${event.id}`);
    if (!organizerId) {
        return 'Organizator necunoscut';
    }
    return organizerId;
}

function isCurrentUserOrganizer(event) {
    const currentUserEmail = localStorage.getItem('userEmail');
    const organizerEmail = localStorage.getItem(`organizer_${event.id}`);
    return currentUserEmail === organizerEmail;
}

function isUserParticipant(eventId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    const participants = getParticipants(eventId);
    return participants.some(p => p.email === currentUserEmail);
}

function addParticipant(eventId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) {
        showError('Trebuie să fii autentificat pentru a te înscrie.');
        return false;
    }

    if (isUserParticipant(eventId)) {
        showError('Ești deja înscris la acest eveniment!');
        return false;
    }

    const event = getEventById(eventId);
    if (!event) {
        showError('Evenimentul nu a fost găsit.');
        return false;
    }

    const participants = getParticipants(eventId);
    
    if (participants.length >= event.maxParticipants) {
        showError('Nu mai sunt locuri disponibile pentru acest eveniment!');
        return false;
    }

    const newParticipant = {
        email: currentUserEmail,
        joinedAt: new Date().toISOString(),
        name: currentUserEmail.split('@')[0]
    };

    participants.push(newParticipant);
    localStorage.setItem(`participants_${eventId}`, JSON.stringify(participants));

    const organizerEmail = getEventOrganizer(event);
    if (organizerEmail && organizerEmail !== currentUserEmail && typeof addNotification === 'function') {
        addNotification(
            `${currentUserEmail.split('@')[0]} s-a înscris la evenimentul tău "${event.sportType}"`,
            'info',
            `event-detail.html?id=${eventId}`
        );
    }

    return true;
}

function removeParticipant(eventId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    const participants = getParticipants(eventId);
    
    const updatedParticipants = participants.filter(p => p.email !== currentUserEmail);
    localStorage.setItem(`participants_${eventId}`, JSON.stringify(updatedParticipants));

    return true;
}

function getAvailableSpots(event) {
    const participants = getParticipants(event.id);
    return Math.max(0, event.maxParticipants - participants.length);
}

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
                <div style="margin-top: 15px;">
                    <button id="interestBtn" class="btn ${isUserInterested(event.id) ? 'btn-primary' : 'btn-secondary'}" style="margin-right: 10px;">
                        ${isUserInterested(event.id) ? '❤️ Interesat' : '🤍 Marchează Interes'}
                    </button>
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">
                        ${getInterestedCount(event.id)} persoane interesate
                    </span>
                </div>
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

            <div class="comments-section">
                <h3>💬 Comentarii</h3>
                <div class="add-comment-form">
                    <textarea id="commentText" placeholder="Scrie un comentariu..." rows="3"></textarea>
                    <button id="submitCommentBtn" class="btn btn-primary">Postează Comentariu</button>
                </div>
                <div id="commentsList" class="comments-list">
                    ${renderComments(event.id)}
                </div>
            </div>
        </div>
    `;

    const participateBtn = document.getElementById('participateBtn');
    if (participateBtn) {
        participateBtn.addEventListener('click', handleParticipateClick);
    }

    const submitCommentBtn = document.getElementById('submitCommentBtn');
    if (submitCommentBtn) {
        submitCommentBtn.addEventListener('click', handleAddComment);
    }

    const interestBtn = document.getElementById('interestBtn');
    if (interestBtn) {
        interestBtn.addEventListener('click', handleInterestToggle);
    }

    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const commentId = this.getAttribute('data-comment-id');
            deleteComment(event.id, commentId);
        });
    });
}

function handleParticipateClick() {
    const eventId = getEventIdFromURL();
    const isParticipant = isUserParticipant(eventId);

    if (isParticipant) {
        if (confirm('Ești sigur că vrei să te retragi din acest eveniment?')) {
            removeParticipant(eventId);
            showSuccess('Ai fost retras din eveniment!');
            setTimeout(() => {
                renderEventDetails();
            }, 1000);
        }
    } else {
        if (addParticipant(eventId)) {
            showSuccess('Înscrierea ta la eveniment a fost confirmată!');
            setTimeout(() => {
                renderEventDetails();
            }, 1000);
        }
    }
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ro-RO', options);
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('ro-RO') + ' ' + date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

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

function getComments(eventId) {
    const raw = localStorage.getItem(`comments_${eventId}`);
    return raw ? JSON.parse(raw) : [];
}

function saveComments(eventId, comments) {
    localStorage.setItem(`comments_${eventId}`, JSON.stringify(comments));
}

function addComment(eventId, text) {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) {
        showError('Trebuie să fii autentificat pentru a comenta.');
        return false;
    }

    if (!text || text.trim().length < 3) {
        showError('Comentariul trebuie să aibă cel puțin 3 caractere.');
        return false;
    }

    const comments = getComments(eventId);
    const newComment = {
        id: `comment_${Date.now()}`,
        eventId: eventId,
        authorEmail: currentUserEmail,
        authorName: currentUserEmail.split('@')[0],
        text: text.trim(),
        createdAt: new Date().toISOString()
    };

    comments.push(newComment);
    saveComments(eventId, comments);

    const event = getEventById(eventId);
    if (event) {
        const organizerEmail = getEventOrganizer(event);
        if (organizerEmail && organizerEmail !== currentUserEmail && typeof addNotification === 'function') {
            addNotification(
                `${currentUserEmail.split('@')[0]} a comentat la evenimentul tău "${event.sportType}"`,
                'info',
                `event-detail.html?id=${eventId}`
            );
        }
    }

    return true;
}

function deleteComment(eventId, commentId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    const comments = getComments(eventId);
    const comment = comments.find(c => c.id === commentId);

    if (!comment) return false;

    if (comment.authorEmail !== currentUserEmail) {
        showError('Poți șterge doar propriile comentarii.');
        return false;
    }

    if (!confirm('Ești sigur că vrei să ștergi acest comentariu?')) {
        return false;
    }

    const updatedComments = comments.filter(c => c.id !== commentId);
    saveComments(eventId, updatedComments);
    return true;
}

function renderComments(eventId) {
    const comments = getComments(eventId);
    const currentUserEmail = localStorage.getItem('userEmail');

    if (comments.length === 0) {
        return '<p class="empty-message">Niciun comentariu încă. Fii primul care comentează!</p>';
    }

    const sortedComments = [...comments].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return `
        <div class="comments-container">
            ${sortedComments.map(comment => `
                <div class="comment-item">
                    <div>
                        <div>
                            <p>${escapeHtml(comment.authorName)}</p>
                            <p>${formatDateTime(comment.createdAt)}</p>
                        </div>
                        ${comment.authorEmail === currentUserEmail ? `
                            <button class="delete-comment-btn btn btn-danger" data-comment-id="${comment.id}">
                                Șterge
                            </button>
                        ` : ''}
                    </div>
                    <p>${escapeHtml(comment.text)}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function handleAddComment() {
    const eventId = getEventIdFromURL();
    const commentTextarea = document.getElementById('commentText');
    
    if (!commentTextarea) return;

    const text = commentTextarea.value.trim();
    
    if (addComment(eventId, text)) {
        showSuccess('Comentariul a fost adăugat!');
        commentTextarea.value = '';
        setTimeout(() => {
            renderEventDetails();
        }, 500);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getInterestedUsers(eventId) {
    const raw = localStorage.getItem(`interested_${eventId}`);
    return raw ? JSON.parse(raw) : [];
}

function saveInterestedUsers(eventId, users) {
    localStorage.setItem(`interested_${eventId}`, JSON.stringify(users));
}

function isUserInterested(eventId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) return false;
    
    const interestedUsers = getInterestedUsers(eventId);
    return interestedUsers.some(u => u.email === currentUserEmail);
}

function getInterestedCount(eventId) {
    return getInterestedUsers(eventId).length;
}

function toggleInterest(eventId) {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) {
        showError('Trebuie să fii autentificat pentru a marca interesul.');
        return false;
    }

    const interestedUsers = getInterestedUsers(eventId);
    const userIndex = interestedUsers.findIndex(u => u.email === currentUserEmail);

    if (userIndex > -1) {
        interestedUsers.splice(userIndex, 1);
    } else {
        interestedUsers.push({
            email: currentUserEmail,
            name: currentUserEmail.split('@')[0],
            interestedAt: new Date().toISOString()
        });
    }

    saveInterestedUsers(eventId, interestedUsers);
    return true;
}

function handleInterestToggle() {
    const eventId = getEventIdFromURL();
    if (toggleInterest(eventId)) {
        const wasInterested = isUserInterested(eventId);
        showSuccess(wasInterested ? 'Ai marcat interesul față de acest eveniment!' : 'Ai eliminat interesul față de acest eveniment.');
        setTimeout(() => {
            renderEventDetails();
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderEventDetails();
});
