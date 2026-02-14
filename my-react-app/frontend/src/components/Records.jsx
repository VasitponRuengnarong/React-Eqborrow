import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./Records.css";

const Records = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, low, out

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 0)
      return { label: "สินค้าหมด", color: "red", icon: <XCircle size={16} /> };
    if (quantity < 10)
      return {
        label: "สินค้าใกล้หมด",
        color: "orange",
        icon: <AlertTriangle size={16} />,
      };
    return { label: "ปกติ", color: "green", icon: <CheckCircle size={16} /> };
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.ProductName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.ProductCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "low")
      return matchesSearch && product.Quantity > 0 && product.Quantity < 10;
    if (filterStatus === "out") return matchesSearch && product.Quantity <= 0;
    return matchesSearch;
  });

  const totalStock = products.reduce((sum, p) => sum + p.Quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + p.Price * p.Quantity, 0);

  // Prepare data for Pie Chart (Top 5 products by quantity)
  const chartData = useMemo(() => {
    const sorted = [...products].sort((a, b) => b.Quantity - a.Quantity);
    const top5 = sorted
      .slice(0, 5)
      .map((p) => ({ name: p.ProductName, value: p.Quantity }));
    const others = sorted.slice(5).reduce((sum, p) => sum + p.Quantity, 0);

    if (others > 0) {
      top5.push({ name: "อื่นๆ", value: others });
    }
    return top5;
  }, [products]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF",
    "#E0E0E0",
  ];

  return (
    <div className="records-container">
      <div className="page-header">
        <h2>รายการคงเหลือ (Stock Records)</h2>
        <p>ตรวจสอบสถานะและจำนวนสินค้าคงเหลือในระบบ</p>
      </div>

      {/* Summary Cards */}
      <div className="records-summary">
        <div className="summary-card">
          <div className="summary-icon blue">
            <Package size={24} />
          </div>
          <div className="summary-info">
            <h4>จำนวนรายการสินค้า</h4>
            <p>{products.length} รายการ</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="summary-info">
            <h4>จำนวนชิ้นรวม</h4>
            <p>{totalStock.toLocaleString()} ชิ้น</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon orange">
            <AlertTriangle size={24} />
          </div>
          <div className="summary-info">
            <h4>มูลค่ารวม</h4>
            <p>{totalValue.toLocaleString()} บาท</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {products.length > 0 && (
        <div className="records-chart-section">
          <div className="chart-card">
            <h3>สัดส่วนสินค้าคงเหลือ (Top 5)</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name.length > 15 ? name.substring(0, 15) + "..." : name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ชิ้น`, "จำนวน"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="records-controls">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ รหัสสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="low">สินค้าใกล้หมด (&lt; 10)</option>
            <option value="out">สินค้าหมด (0)</option>
          </select>
          <button
            className="btn-export"
            onClick={() => alert("ฟังก์ชัน Export กำลังพัฒนา")}
          >
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="records-table">
          <thead>
            <tr>
              <th>รหัสสินค้า</th>
              <th>ชื่อสินค้า</th>
              <th>ราคา/หน่วย</th>
              <th>คงเหลือ</th>
              <th>มูลค่ารวม</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center">
                  กำลังโหลด...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  ไม่พบข้อมูลสินค้า
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const status = getStockStatus(product.Quantity);
                return (
                  <tr key={product.ProductID}>
                    <td>{product.ProductCode}</td>
                    <td>
                      <div className="product-name-cell">
                        {product.Image && (
                          <img
                            src={product.Image}
                            alt=""
                            className="mini-thumb"
                          />
                        )}
                        <span>{product.ProductName}</span>
                      </div>
                    </td>
                    <td>{Number(product.Price).toLocaleString()}</td>
                    <td className="font-bold">{product.Quantity}</td>
                    <td>
                      {(product.Price * product.Quantity).toLocaleString()}
                    </td>
                    <td>
                      <span className={`status-badge ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Records;
