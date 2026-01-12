const eventsContainer = document.getElementById("eventsContainer");
const noResults = document.getElementById("noResults");

const searchName = document.getElementById("searchName");
const filterSport = document.getElementById("filterSport");
const filterLevel = document.getElementById("filterLevel");
const filterDate = document.getElementById("filterDate");
const sortEvents = document.getElementById("sortEvents");

async function loadFilterOptions() {
    try {
        const response = await fetch("../data/event-options.json");
        const data = await response.json();
        
        data.sports.forEach(sport => {
            const opt = new Option(sport, sport);
            filterSport.add(opt);
        });

        data.performanceLevels.forEach(level => {
            const opt = new Option(level, level);
            filterLevel.add(opt);
        });
    } catch (error) {
        console.error("Eroare la încărcarea opțiunilor:", error);
    }
}

function getAllEvents() {
    const raw = localStorage.getItem("events");
    return raw ? JSON.parse(raw) : [];
}

function renderEvents(eventsToDisplay) {
    eventsContainer.innerHTML = "";
    
    if (eventsToDisplay.length === 0) {
        if (noResults) {
            noResults.style.display = "block";
        }
        return;
    }

    if (noResults) {
        noResults.style.display = "none";
    }
    eventsToDisplay.forEach(event => {
        const card = document.createElement("div");
        card.className = "event-card";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <span class="badge">${event.performanceLevel}</span>
            <h3>${event.sportType}</h3>
            <div class="event-details">
                <p>📍 <strong>Locație:</strong> ${event.location}</p>
                <p>📅 <strong>Data:</strong> ${event.date}</p>
                <p>🕒 <strong>Ora:</strong> ${event.time}</p>
                <p>👥 <strong>Participanți:</strong> max. ${event.maxParticipants}</p>
            </div>
            <p style="margin-top:10px; font-style:italic; font-size:0.85rem;">
                ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}
            </p>
            <p style="margin-top:15px; color: var(--primary-color); font-weight: 600;">
                Clic pentru detalii →
            </p>
        `;
        card.addEventListener('click', () => {
            window.location.href = `event-detail.html?id=${event.id}`;
        });
        eventsContainer.appendChild(card);
    });
}

function applyFilters() {
    let events = getAllEvents();

    const nameVal = searchName.value.toLowerCase();
    if (nameVal) {
        events = events.filter(e => e.sportType.toLowerCase().includes(nameVal));
    }

    const sportVal = filterSport.value;
    if (sportVal) {
        events = events.filter(e => e.sportType === sportVal);
    }

    const levelVal = filterLevel.value;
    if (levelVal) {
        events = events.filter(e => e.performanceLevel === levelVal);
    }

    const dateVal = filterDate.value;
    if (dateVal) {
        events = events.filter(e => e.date === dateVal);
    }

    const sortVal = sortEvents.value;
    events.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return sortVal === "dateAsc" ? dateA - dateB : dateB - dateA;
    });

    renderEvents(events);
}

[searchName, filterSport, filterLevel, filterDate, sortEvents].forEach(elem => {
    elem.addEventListener("input", applyFilters);
});

function getCurrentUserEmail() {
    return localStorage.getItem("userEmail") || "";
}

function getEventOrganizer(eventId) {
    return localStorage.getItem(`organizer_${eventId}`) || "";
}

function getParticipants(eventId) {
    const raw = localStorage.getItem(`participants_${eventId}`);
    return raw ? JSON.parse(raw) : [];
}

function isEventPast(event) {
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    return eventDateTime < new Date();
}

function getOrganizedEvents() {
    const currentUserEmail = getCurrentUserEmail();
    const allEvents = getAllEvents();
    return allEvents.filter(event => getEventOrganizer(event.id) === currentUserEmail);
}

function getParticipatingEvents() {
    const currentUserEmail = getCurrentUserEmail();
    const allEvents = getAllEvents();
    return allEvents.filter(event => {
        const participants = getParticipants(event.id);
        return participants.some(p => p.email === currentUserEmail);
    });
}

function getHistoryEvents() {
    const currentUserEmail = getCurrentUserEmail();
    const allEvents = getAllEvents();
    return allEvents.filter(event => {
        if (!isEventPast(event)) return false;
        const isOrganizer = getEventOrganizer(event.id) === currentUserEmail;
        const participants = getParticipants(event.id);
        const isParticipant = participants.some(p => p.email === currentUserEmail);
        return isOrganizer || isParticipant;
    });
}

function getInterestedUsers(eventId) {
    const raw = localStorage.getItem(`interested_${eventId}`);
    return raw ? JSON.parse(raw) : [];
}

function isUserInterested(eventId) {
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) return false;
    
    const interestedUsers = getInterestedUsers(eventId);
    return interestedUsers.some(u => u.email === currentUserEmail);
}

function getInterestedCount(eventId) {
    return getInterestedUsers(eventId).length;
}

function toggleInterest(eventId) {
    const currentUserEmail = getCurrentUserEmail();
    if (!currentUserEmail) {
        showNotification('Trebuie să fii autentificat pentru a marca interesul.', 'error');
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

    localStorage.setItem(`interested_${eventId}`, JSON.stringify(interestedUsers));
    return true;
}

function renderEventCard(event, container, showCancelButton = false) {
    const card = document.createElement("div");
    card.className = "event-card";
    card.style.cursor = "pointer";
    
    const participants = getParticipants(event.id);
    const isPast = isEventPast(event);
    const pastBadge = isPast ? '<span class="badge" style="background: #6c757d; color: white; margin-left: 5px;">Trecut</span>' : '';
    const interestedCount = getInterestedCount(event.id);
    const userInterested = isUserInterested(event.id);
    
    card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <span class="badge">${event.performanceLevel}</span>
            ${pastBadge}
        </div>
        <h3>${event.sportType}</h3>
        <div class="event-details">
            <p>📍 <strong>Locație:</strong> ${event.location}</p>
            <p>📅 <strong>Data:</strong> ${event.date}</p>
            <p>🕒 <strong>Ora:</strong> ${event.time}</p>
            <p>👥 <strong>Participanți:</strong> ${participants.length} / ${event.maxParticipants}</p>
            ${interestedCount > 0 ? `<p>❤️ <strong>Interesați:</strong> ${interestedCount}</p>` : ''}
        </div>
        <p style="margin-top:10px; font-style:italic; font-size:0.85rem;">
            ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}
        </p>
        <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">
            ${!isPast ? `
                <button class="interest-btn btn ${userInterested ? 'btn-primary' : 'btn-secondary'}" 
                        onclick="event.stopPropagation(); handleInterestClick('${event.id}')" 
                        style="padding: 6px 12px; font-size: 0.9rem;">
                    ${userInterested ? '❤️ Interesat' : '🤍 Interes'}
                </button>
            ` : ''}
        </div>
        ${showCancelButton && !isPast ? `
            <button class="btn btn-danger cancel-btn" onclick="event.stopPropagation(); cancelEvent('${event.id}')">
                ❌ Anulează Eveniment
            </button>
        ` : ''}
        <p style="margin-top:15px; color: var(--primary-color); font-weight: 600;">
            Clic pentru detalii →
        </p>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('cancel-btn') && 
            !e.target.closest('.cancel-btn') &&
            !e.target.classList.contains('interest-btn') &&
            !e.target.closest('.interest-btn')) {
            window.location.href = `event-detail.html?id=${event.id}`;
        }
    });
    
    container.appendChild(card);
}

function handleInterestClick(eventId) {
    if (toggleInterest(eventId)) {
        const wasInterested = isUserInterested(eventId);
        showNotification(wasInterested ? 'Ai marcat interesul!' : 'Ai eliminat interesul.', 'success');
        
        renderOrganizedEvents();
        renderParticipatingEvents();
        renderHistoryEvents();
        applyFilters();
    }
}

function renderOrganizedEvents() {
    const container = document.getElementById("organizedEventsContainer");
    const noEvents = document.getElementById("noOrganizedEvents");
    if (!container) return;
    
    container.innerHTML = "";
    const events = getOrganizedEvents();
    
    if (events.length === 0) {
        if (noEvents) noEvents.style.display = "block";
        return;
    }
    
    if (noEvents) noEvents.style.display = "none";
    
    events.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });
    
    events.forEach(event => renderEventCard(event, container, true));
}

function renderParticipatingEvents() {
    const container = document.getElementById("participatingEventsContainer");
    const noEvents = document.getElementById("noParticipatingEvents");
    if (!container) return;
    
    container.innerHTML = "";
    const events = getParticipatingEvents();
    
    if (events.length === 0) {
        if (noEvents) noEvents.style.display = "block";
        return;
    }
    
    if (noEvents) noEvents.style.display = "none";
    
    events.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });
    
    events.forEach(event => renderEventCard(event, container, false));
}

function renderHistoryEvents() {
    const container = document.getElementById("historyEventsContainer");
    const noEvents = document.getElementById("noHistoryEvents");
    if (!container) return;
    
    container.innerHTML = "";
    const events = getHistoryEvents();
    
    if (events.length === 0) {
        if (noEvents) noEvents.style.display = "block";
        return;
    }
    
    if (noEvents) noEvents.style.display = "none";
    
    events.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB - dateA;
    });
    
    events.forEach(event => renderEventCard(event, container, false));
}

function cancelEvent(eventId) {
    if (!confirm("Ești sigur că vrei să anulezi acest eveniment? Această acțiune nu poate fi anulată.")) {
        return;
    }
    
    const event = getAllEvents().find(e => e.id === eventId);
    if (!event) return;
    
    const participants = getParticipants(eventId);
    participants.forEach(participant => {
        if (typeof addNotification === 'function') {
            addNotification(
                `Evenimentul "${event.sportType}" a fost anulat`,
                'error',
                'dashboard.html'
            );
        }
    });
    
    const events = getAllEvents();
    const updatedEvents = events.filter(e => e.id !== eventId);
    localStorage.setItem("events", JSON.stringify(updatedEvents));
    
    localStorage.removeItem(`organizer_${eventId}`);
    
    showNotification("Evenimentul a fost anulat cu succes!", "success");
    
    renderOrganizedEvents();
    applyFilters();
}

function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetTab = button.getAttribute("data-tab");
            
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            
            button.classList.add("active");
            const targetContent = document.getElementById(`tab-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add("active");
            }
            
            if (targetTab === "organized") {
                renderOrganizedEvents();
            } else if (targetTab === "participating") {
                renderParticipatingEvents();
            } else if (targetTab === "history") {
                renderHistoryEvents();
            }
        });
    });
    
    document.querySelectorAll(".tab-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute("href").replace("#tab-", "");
            const targetButton = document.querySelector(`[data-tab="${targetTab}"]`);
            if (targetButton) {
                targetButton.click();
            }
        });
    });
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    
    const bgColor = type === "success" ? "var(--success-color)" : 
                     type === "error" ? "var(--danger-color)" : 
                     "var(--primary-color)";
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${bgColor};
        color: white;
        border-radius: 8px;
        box-shadow: var(--shadow);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function initializeSampleEvents() {
    const existingEvents = getAllEvents();
    
    const hasSampleEvents = existingEvents.some(e => e.id && e.id.startsWith('evt_sample_'));
    
    if (existingEvents.length === 0 || !hasSampleEvents) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(dayAfter.getDate() + 3);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const formatDate = (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        };
        
        const sampleEvents = [
            {
                id: "evt_sample_1",
                sportType: "Fotbal",
                date: formatDate(tomorrow),
                time: "18:00",
                location: "Parcul Central",
                maxParticipants: 22,
                performanceLevel: "Intermediar",
                equipment: "Mingi de fotbal, veste colorate, conuri pentru teren",
                description: "Meci de fotbal recreativ în Parcul Central. Căutăm jucători pentru un meci prietenos. Vom juca pe terenul de iarbă sintetică. Toți sunt bineveniți!",
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: "evt_sample_2",
                sportType: "Baschet",
                date: formatDate(dayAfter),
                time: "19:30",
                location: "Cluj Arena",
                maxParticipants: 10,
                performanceLevel: "Avansat",
                equipment: "Mingi de baschet, veste",
                description: "Sesiune de baschet pentru jucători avansați. Vom face antrenament și meciuri 3v3. Ne vedem la Cluj Arena!",
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: "evt_sample_3",
                sportType: "Alergare",
                date: formatDate(tomorrow),
                time: "07:00",
                location: "Faget",
                maxParticipants: 15,
                performanceLevel: "Incepator",
                equipment: "Haine sport, apă",
                description: "Alergare matinală în pădurea Făget. Distanță: 5-8 km, ritm moderat. Perfect pentru începători!",
                createdAt: new Date(Date.now() - 259200000).toISOString()
            },
            {
                id: "evt_sample_4",
                sportType: "Tenis",
                date: formatDate(nextWeek),
                time: "16:00",
                location: "Parcul Rozelor",
                maxParticipants: 4,
                performanceLevel: "Intermediar",
                equipment: "Rațe de tenis, mingi",
                description: "Joc de tenis dublu în Parcul Rozelor. Căutăm parteneri pentru un meci relaxant. Terenul este rezervat.",
                createdAt: new Date(Date.now() - 345600000).toISOString()
            },
            {
                id: "evt_sample_5",
                sportType: "Volei",
                date: formatDate(dayAfter),
                time: "20:00",
                location: "BT Arena",
                maxParticipants: 12,
                performanceLevel: "Intermediar",
                equipment: "Mingi de volei, fileu",
                description: "Meci de volei în sală. Vom juca 6v6. Terenul este în interior, perfect pentru seara. Vino cu entuziasm!",
                createdAt: new Date(Date.now() - 432000000).toISOString()
            },
            {
                id: "evt_sample_6",
                sportType: "Ciclism",
                date: formatDate(nextWeek),
                time: "09:00",
                location: "Lacul Chios",
                maxParticipants: 20,
                performanceLevel: "Incepator",
                equipment: "Bicicletă, cască, apă",
                description: "Tură de ciclism în jurul Lacului Chios. Distanță: ~15 km, ritm lejer. Ideal pentru începători. Oprește pentru pauză și socializare!",
                createdAt: new Date(Date.now() - 518400000).toISOString()
            }
        ];
        
        localStorage.setItem("events", JSON.stringify(sampleEvents));
        
        sampleEvents.forEach((event, index) => {
            localStorage.setItem(`organizer_${event.id}`, `organizator${index + 1}@sportzone.ro`);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializeSampleEvents();
    loadFilterOptions();
    applyFilters();
    initTabs();
    renderOrganizedEvents();
    renderParticipatingEvents();
    renderHistoryEvents();
});