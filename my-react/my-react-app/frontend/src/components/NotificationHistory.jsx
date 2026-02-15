import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import './NotificationHistory.css';
import { CheckCircle, AlertTriangle, AlertCircle, Info, BellOff, Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const NotificationHistory = () => {
    const { notifications, markAsRead, clearAllNotifications } = useNotification();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const getIcon = (type) => {
        switch (type) {
            case 'Success': return <CheckCircle size={24} />;
            case 'Warning': return <AlertTriangle size={24} />;
            case 'Error': return <AlertCircle size={24} />;
            default: return <Info size={24} />;
        }
    };

    const handleItemClick = (n) => {
        if (!n.IsRead) {
            markAsRead(n.NotificationID);
        }

        // Handle explicit redirect for "มีการคืนอุปกรณ์" or use ActionUrl
        if (n.Title === "มีการคืนอุปกรณ์") {
            navigate('/approvals', { state: { filter: 'Approved' } });
        } else if (n.ActionUrl) {
            navigate(n.ActionUrl);
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentNotifications = notifications.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(notifications.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="notification-history-container">
            <div className="history-header">
                <h2>การแจ้งเตือน</h2>
                {notifications.length > 0 && (
                    <button className="clear-all-btn" onClick={clearAllNotifications} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={18} /> ลบทั้งหมด
                    </button>
                )}
            </div>

            <div className="history-list">
                {notifications.length === 0 ? (
                    <div className="no-history">
                        <BellOff size={60} strokeWidth={1} />
                        <p>ไม่มีประวัติการแจ้งเตือน</p>
                    </div>
                ) : (
                    currentNotifications.map(n => (
                        <div 
                            key={n.NotificationID} 
                            className={`history-item ${n.IsRead ? 'read' : 'unread'}`}
                            onClick={() => handleItemClick(n)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={`history-icon-wrapper ${n.Type ? n.Type.toLowerCase() : 'info'}`}>
                                {getIcon(n.Type)}
                            </div>
                            <div className="history-content">
                                <div className="history-main">
                                    <h4 className="notif-title">{n.Title}</h4>
                                    <p className="notif-message">{n.Message}</p>
                                </div>
                                <div className="history-meta">
                                    <span className="notif-time">
                                        <Clock size={14} /> {new Date(n.CreatedAt).toLocaleString('th-TH')}
                                    </span>
                                    {!n.IsRead && (
                                        <button 
                                            className="mark-read-text" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(n.NotificationID);
                                            }}
                                        >
                                            ทำเป็นอ่านแล้ว
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {notifications.length > itemsPerPage && (
                <div className="pagination-container">
                    <div className="pagination-info">
                        หน้า <strong>{currentPage}</strong> จาก <strong>{totalPages}</strong>
                    </div>
                    <div className="pagination-controls">
                        <button 
                            className="pagination-btn" 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            className="pagination-btn" 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationHistory;
