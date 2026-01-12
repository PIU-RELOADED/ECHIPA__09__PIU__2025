function getNotifications() {
    const raw = localStorage.getItem('notifications');
    return raw ? JSON.parse(raw) : [];
}

function saveNotifications(notifications) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function addNotification(message, type = 'info', link = null) {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) return;

    const notifications = getNotifications();
    const newNotification = {
        id: `notif_${Date.now()}`,
        userId: currentUserEmail,
        message: message,
        type: type,
        link: link,
        read: false,
        createdAt: new Date().toISOString()
    };

    notifications.unshift(newNotification);
    
    if (notifications.length > 50) {
        notifications.splice(50);
    }
    
    saveNotifications(notifications);
    updateNotificationBadge();
}

function getUnreadCount() {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) return 0;

    const notifications = getNotifications();
    return notifications.filter(n => n.userId === currentUserEmail && !n.read).length;
}

function markAsRead(notificationId) {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveNotifications(notifications);
        updateNotificationBadge();
    }
}

function markAllAsRead() {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) return;

    const notifications = getNotifications();
    notifications.forEach(n => {
        if (n.userId === currentUserEmail && !n.read) {
            n.read = true;
        }
    });
    saveNotifications(notifications);
    updateNotificationBadge();
}

function getUserNotifications() {
    const currentUserEmail = localStorage.getItem('userEmail');
    if (!currentUserEmail) return [];

    const notifications = getNotifications();
    return notifications.filter(n => n.userId === currentUserEmail);
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const count = getUnreadCount();
    
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    const notifications = getUserNotifications();
    const unreadCount = getUnreadCount();

    if (notifications.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                <p>Nu ai notificări</p>
            </div>
        `;
        return;
    }

    const recentNotifications = notifications.slice(0, 10);

    dropdown.innerHTML = `
        <div style="max-height: 400px; overflow-y: auto;">
            ${unreadCount > 0 ? `
                <div style="padding: 10px; border-bottom: 1px solid var(--border-color); text-align: center;">
                    <button onclick="markAllNotificationsAsRead()" class="btn btn-secondary" style="padding: 5px 15px; font-size: 0.85rem;">
                        Marchează toate ca citite
                    </button>
                </div>
            ` : ''}
            ${recentNotifications.map(notif => `
                <div class="notification-item" 
                     onclick="handleNotificationClick('${notif.id}', '${notif.link || ''}')"
                     style="padding: 15px; border-bottom: 1px solid var(--border-color); cursor: pointer; background: ${notif.read ? 'transparent' : '#f0f7ff'}; transition: background 0.2s;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <p style="margin-bottom: 5px; font-weight: ${notif.read ? 'normal' : '600'};">
                                ${escapeHtml(notif.message)}
                            </p>
                            <p style="font-size: 0.8rem; color: var(--text-secondary);">
                                ${formatNotificationTime(notif.createdAt)}
                            </p>
                        </div>
                        ${!notif.read ? '<span style="width: 8px; height: 8px; background: var(--primary-color); border-radius: 50%; margin-left: 10px; margin-top: 5px;"></span>' : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        ${notifications.length > 10 ? `
            <div style="padding: 10px; text-align: center; border-top: 1px solid var(--border-color);">
                <p style="font-size: 0.85rem; color: var(--text-secondary);">
                    ${notifications.length - 10} notificări mai vechi
                </p>
            </div>
        ` : ''}
    `;
}

function handleNotificationClick(notificationId, link) {
    markAsRead(notificationId);
    if (link) {
        window.location.href = link;
    } else {
        renderNotificationDropdown();
    }
}

function formatNotificationTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Acum';
    if (diffMins < 60) return `Acum ${diffMins} min`;
    if (diffHours < 24) return `Acum ${diffHours} h`;
    if (diffDays < 7) return `Acum ${diffDays} zile`;
    
    return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            renderNotificationDropdown();
        }
    }
}

function markAllNotificationsAsRead() {
    markAllAsRead();
    renderNotificationDropdown();
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    const button = document.getElementById('notificationButton');
    
    if (dropdown && button && !dropdown.contains(e.target) && !button.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();
});
