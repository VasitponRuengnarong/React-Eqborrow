import React from 'react';
import { RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';
import { PackageCheck } from 'lucide-react';
import './StatusChartCard.css';

const COLORS = {
    "ว่าง": '#22c55e',       // Available - Green   
    "ถูกยืม": '#3b82f6',   // Borrowed - Blue
    "ส่งซ่อม": '#f97316', // In Repair - Orange
    "ชำรุด": '#ef4444',   // Broken - Red
    "สูญหาย": '#64748b',
    
};

const StatusChartCard = ({ products }) => {
    // Calculate status counts
    const statusCounts = products.reduce((acc, product) => {
        const status = product.StatusNameDV || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    // Prepare data for RadialBarChart
    const data = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status],
        fill: COLORS[status] || '#9ca3af' // Default color if not found
    }));

    const total = products.length;

    // Custom Legend component
    const CustomLegend = () => (
        <ul className="status-legend-container">
            {data.map(item => (
                <li key={item.name} className="status-legend-item">
                    <span className="status-color-indicator" style={{ backgroundColor: item.fill }}></span>
                    <span className="status-legend-label">{item.name}</span>
                    <span className="status-legend-count">({item.value})</span>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="status-card-container">
            <div className="status-left-content">
                <h2 className="status-header">
                    <PackageCheck className="status-icon" />
                    Status Summary
                </h2>
                <div className="status-total-number">{total}</div>
                <div className="status-total-label">Total Assets</div>
                <CustomLegend />
            </div>
            <div className="status-right-content">
                <RadialBarChart width={300} height={300} innerRadius="20%" outerRadius="80%" data={data} startAngle={90} endAngle={-270}>
                    <RadialBar cornerRadius={90} dataKey="value"  />
                    <Tooltip />
                    <text x={150} y={150} textAnchor="middle" dominantBaseline="middle" className="total-center" style={{ fontSize: '0.9rem', fontWeight: 'bold', fill: '#333' }}>
                        Total: {total}
                    </text>
                </RadialBarChart>
            </div>
        </div>
    );
};

export default StatusChartCard;