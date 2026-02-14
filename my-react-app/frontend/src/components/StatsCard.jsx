import React from "react";

const StatsCard = ({ icon: Icon, color, title, value, link }) => {
  const cardClasses = `card interactive${link ? "" : " non-interactive"}`;
  // color prop can be a CSS class or hex code, handling simply here
  const iconStyle = { color: color || "#333" };

  const handleClick = () => {
    if (link) {
      window.location.href = link;
    }
  };

  return (
    <div className={cardClasses} onClick={handleClick}>
      <div className="card-icon-wrapper" style={iconStyle}>
        {Icon && <Icon size={32} />}
      </div>
      <div className="card-info">
        <h3>{title}</h3>
        <p id={`stat${title.replace(/\s/g, "")}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
