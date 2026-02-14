import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package } from 'lucide-react';
import { apiFetch } from './api';
import './EquipmentLoop.css';

const EquipmentLoop = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await apiFetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        // Filter out items without images if possible, or use a placeholder
        setEquipment(data);
      }
    } catch (error) {
      console.error('Error fetching equipment for loop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = (item) => {
    navigate('/borrow', { state: { preSelectedId: item.DVID } });
  };

  if (loading || equipment.length === 0) return null;

  // Double the equipment list for a seamless loop
  const loopItems = [...equipment, ...equipment];

  return (
    <div className="equipment-loop-container">
      <div className="loop-header">
        <h2 className="loop-title">
          <Package size={20} className="text-orange-500" />
          อุปกรณ์แนะนำ
        </h2>
      </div>
      
      <div className="loop-wrapper">
        <div className="loop-track" ref={scrollRef}>
          {loopItems.map((item, index) => (
            <div 
              key={`${item.DVID}-${index}`} 
              className="equipment-card-mini"
              onClick={() => handleBorrow(item)}
            >
              <div className="card-image">
                <img src={item.Image || '/images/logo.png'} alt={item.DeviceName} />
                <div className="card-overlay">
                  <div className="borrow-badge">
                    <ShoppingCart size={14} /> ยืมเลย
                  </div>
                </div>
              </div>
              <div className="card-info">
                <span className="category-tag">{item.CategoryName}</span>
                <h4>{item.DeviceName}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EquipmentLoop;
