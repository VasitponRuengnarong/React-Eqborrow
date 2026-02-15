import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './NotificationDropdown.css';
import { CheckCircle, AlertTriangle, AlertCircle, Info, CheckCheck, BellOff } from 'lucide-react';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, markAsRead, markAllAsRead } = useNotification();
    const navigate = useNavigate();

    const getIcon = (type) => {
        switch (type) {
            case 'Success': return <CheckCircle size={20} />;
            case 'Warning': return <AlertTriangle size={20} />;
            case 'Error': return <AlertCircle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const handleItemClick = (n) => {
        if (!n.IsRead) {
            markAsRead(n.NotificationID);
        }

        // Handle explicit redirect for "มีการคืนอุปกรณ์" or use ActionUrl
        if (n.Title === "มีการคืนอุปกรณ์") {
            navigate('/approvals', { state: { filter: 'Approved' } });
            if (onClose) onClose();
        } else if (n.ActionUrl) {
            navigate(n.ActionUrl);
            if (onClose) onClose();
        }
    };

    return (
        <div className="notification-dropdown">
            <div className="notif-header">
                <h3>Notifications</h3>
                {notifications.some(n => !n.IsRead) && (
                    <button className="mark-all-btn" onClick={markAllAsRead}>
                        <CheckCheck size={16} /> Mark all read
                    </button>
                )}
            </div>
            <div className="notif-list">
                {notifications.length === 0 ? (
                    <div className="no-notif">
                        <BellOff size={40} className="no-notif-icon" />
                        <p>No new notifications</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div 
                            key={n.NotificationID} 
                            className={`notif-item ${n.IsRead ? 'read' : 'unread'}`}
                            onClick={() => handleItemClick(n)}
                        >
                            <div className={`notif-icon-wrapper ${n.Type ? n.Type.toLowerCase() : 'info'}`}>
                                {getIcon(n.Type)}
                            </div>
                            <div className="notif-content">
                                <h4 className="notif-title">{n.Title}</h4>
                                <p className="notif-message">{n.Message}</p>
                                <span className="notif-time">{new Date(n.CreatedAt).toLocaleString('th-TH')}</span>
                            </div>
                            {!n.IsRead && <span className="unread-dot"></span>}
                        </div>
                    ))
                )}
            </div>
            <div className="notif-footer">
                <span onClick={() => { navigate('/notifications'); if(onClose) onClose(); }}>
                    ดูการแจ้งเตือนทั้งหมด
                </span>
            </div>
        </div>
    );
};

export default NotificationDropdown;
