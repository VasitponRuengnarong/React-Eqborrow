import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const getUserId = () => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                return JSON.parse(user).EMPID || JSON.parse(user).id;
            } catch (e) {
                console.error("Error parsing user from local storage", e);
                return null;
            }
        }
        return null;
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        return token ? { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : null;
    };

    const fetchNotifications = useCallback(async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await fetch(`/api/notifications/${userId}`, {
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.IsRead).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }, []);

    const markAsRead = async (id) => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            // Optimistic update
            setNotifications(prev => prev.map(n => 
                n.NotificationID === id ? { ...n, IsRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: headers
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
            setUnreadCount(0);

            await fetch(`/api/notifications/user/${userId}/read-all`, {
                method: 'PUT',
                headers: headers
            });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const clearAllNotifications = async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            // Optimistic update
            setNotifications([]);
            setUnreadCount(0);

            await fetch(`/api/notifications/user/${userId}`, {
                method: 'DELETE',
                headers: headers
            });
        } catch (error) {
            console.error("Error clearing notifications:", error);
            fetchNotifications(); // Revert on error
        }
    };

    // Poll for notifications every 10 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
