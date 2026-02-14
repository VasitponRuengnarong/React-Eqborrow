import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutGrid } from 'lucide-react';
import './CategoryChartCard.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57'];

const CategoryChartCard = ({ products }) => {
    // คำนวณจำนวนสินค้าตามหมวดหมู่
    const categoryCounts = products.reduce((acc, product) => {
        const category = product.CategoryName || "อื่นๆ";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    // แปลงข้อมูลสำหรับ Recharts และเรียงลำดับจากมากไปน้อย
    const data = Object.keys(categoryCounts).map((category, index) => ({
        name: category,
        value: categoryCounts[category],
        fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);

    return (
        <div className="category-card-container">
            <div className="category-header">
                <LayoutGrid className="category-icon" size={24} />
                <h2>Category Distribution</h2>
            </div>
            <div className="category-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={100} 
                            tick={{ fontSize: 12, fill: '#666' }} 
                            interval={0}
                        />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                        />
                        <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} animationDuration={1000}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CategoryChartCard;
