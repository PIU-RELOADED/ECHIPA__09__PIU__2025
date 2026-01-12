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

document.addEventListener("DOMContentLoaded", () => {
    loadFilterOptions();
    applyFilters(); 
});