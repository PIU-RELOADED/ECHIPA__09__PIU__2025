const form = document.getElementById("eventForm");
const errorSummary = document.getElementById("errorSummary");
const successMessage = document.getElementById("successMessage");
const createdEventsList = document.getElementById("createdEventsList");
const eventsEmpty = document.getElementById("eventsEmpty");

const selects = {
    sportType: document.getElementById("sportType"),
    eventLocation: document.getElementById("eventLocation"),
    performanceLevel: document.getElementById("performanceLevel")
};

const fallbackOptions = {
    sports: ["Fotbal", "Baschet", "Alergare", "Volei"],
    locations: ["Parcul Central", "Cluj Arena", "Faget"],
    performanceLevels: ["Incepator", "Intermediar", "Avansat"]
};

function setMinDate() {
    const dateInput = document.getElementById("eventDate");
    if (!dateInput) {
        return;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
}

function populateSelect(selectElement, items, placeholder) {
    if (!selectElement) {
        return;
    }
    selectElement.innerHTML = "";
    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = placeholder;
    selectElement.appendChild(placeholderOption);

    items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
}

async function loadOptions() {
    try {
        const response = await fetch("../data/event-options.json");
        if (!response.ok) {
            throw new Error("Options not available");
        }
        const data = await response.json();
        populateSelect(selects.sportType, data.sports, "Selecteaza sportul");
        populateSelect(selects.eventLocation, data.locations, "Selecteaza locatia");
        populateSelect(selects.performanceLevel, data.performanceLevels, "Selecteaza nivelul");
    } catch (error) {
        populateSelect(selects.sportType, fallbackOptions.sports, "Selecteaza sportul");
        populateSelect(selects.eventLocation, fallbackOptions.locations, "Selecteaza locatia");
        populateSelect(selects.performanceLevel, fallbackOptions.performanceLevels, "Selecteaza nivelul");
    }
}

function clearErrors() {
    errorSummary.textContent = "";
    errorSummary.style.display = "none";
    successMessage.style.display = "none";

    const errorFields = document.querySelectorAll(".field-error");
    errorFields.forEach((field) => {
        field.textContent = "";
    });
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`error-${fieldId}`);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function getEvents() {
    const raw = localStorage.getItem("events");
    if (!raw) {
        return [];
    }
    try {
        return JSON.parse(raw);
    } catch (error) {
        return [];
    }
}

function saveEvent(eventData) {
    const events = getEvents();
    events.unshift(eventData);
    localStorage.setItem("events", JSON.stringify(events));
}

function renderEvents() {
    if (!createdEventsList || !eventsEmpty) {
        return;
    }

    const events = getEvents();
    createdEventsList.innerHTML = "";

    if (events.length === 0) {
        eventsEmpty.style.display = "block";
        return;
    }

    eventsEmpty.style.display = "none";
    events.slice(0, 5).forEach((eventData) => {
        const item = document.createElement("li");
        item.className = "event-item";

        const label = document.createElement("div");
        label.innerHTML = `<strong>${eventData.sportType}</strong> - ${eventData.location}`;

        const meta = document.createElement("div");
        meta.className = "event-meta";
        meta.textContent = `${eventData.date} ${eventData.time} | Max ${eventData.maxParticipants}`;

        item.appendChild(label);
        item.appendChild(meta);
        createdEventsList.appendChild(item);
    });
}

function validateForm() {
    const errors = [];

    const sportType = selects.sportType.value.trim();
    const eventDate = document.getElementById("eventDate").value;
    const eventTime = document.getElementById("eventTime").value;
    const location = selects.eventLocation.value.trim();
    const maxParticipantsValue = document.getElementById("maxParticipants").value;
    const performanceLevel = selects.performanceLevel.value.trim();
    const equipment = document.getElementById("equipment").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!sportType) {
        errors.push("sportType");
        showFieldError("sportType", "Selecteaza un sport.");
    }

    if (!eventDate) {
        errors.push("eventDate");
        showFieldError("eventDate", "Selecteaza data.");
    }

    if (!eventTime) {
        errors.push("eventTime");
        showFieldError("eventTime", "Selecteaza ora.");
    }

    if (!location) {
        errors.push("eventLocation");
        showFieldError("eventLocation", "Selecteaza o locatie din Cluj-Napoca.");
    }

    const maxParticipants = Number(maxParticipantsValue);
    if (!maxParticipantsValue || Number.isNaN(maxParticipants)) {
        errors.push("maxParticipants");
        showFieldError("maxParticipants", "Introdu un numar valid.");
    } else if (maxParticipants < 2 || maxParticipants > 200) {
        errors.push("maxParticipants");
        showFieldError("maxParticipants", "Alege un numar intre 2 si 200.");
    }

    if (!performanceLevel) {
        errors.push("performanceLevel");
        showFieldError("performanceLevel", "Selecteaza nivelul minim.");
    }

    if (equipment.length < 3) {
        errors.push("equipment");
        showFieldError("equipment", "Completeaza dotarile necesare.");
    }

    if (description.length < 10) {
        errors.push("description");
        showFieldError("description", "Descrierea trebuie sa aiba cel putin 10 caractere.");
    }

    if (errors.length > 0) {
        errorSummary.textContent = "Te rugam sa completezi corect campurile obligatorii.";
        errorSummary.style.display = "block";
        return null;
    }

    return {
        id: `evt_${Date.now()}`,
        sportType,
        date: eventDate,
        time: eventTime,
        location,
        maxParticipants,
        performanceLevel,
        equipment,
        description,
        createdAt: new Date().toISOString()
    };
}

if (form) {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearErrors();

        const eventData = validateForm();
        if (!eventData) {
            return;
        }

        saveEvent(eventData);
        successMessage.textContent = "Evenimentul a fost salvat.";
        successMessage.style.display = "block";
        form.reset();
        setMinDate();
        renderEvents();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setMinDate();
    loadOptions();
    renderEvents();
});
