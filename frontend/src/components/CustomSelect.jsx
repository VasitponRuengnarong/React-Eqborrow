import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import "./CustomSelect.css";

const CustomSelect = ({
  icon: Icon,
  placeholder,
  options,
  value,
  onSelect,
  displayValue,
  optionValueKey,
  optionLabelKey,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Logic สำหรับปิด Dropdown เมื่อคลิกนอก Component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectOption = (optionValue) => {
    onSelect(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="input-wrapper" ref={wrapperRef}>
      {Icon && <Icon className="input-icon" size={20} />}
      <div
        className={`form-select custom-select-trigger ${isOpen ? "active" : ""} ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!value ? "placeholder-text" : ""}>
          {displayValue || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`dropdown-arrow ${isOpen ? "rotate" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="chip-popup">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option[optionValueKey]}
                className={`chip-option ${Number(value) === option[optionValueKey] ? "active" : ""}`}
                onClick={() => handleSelectOption(option[optionValueKey])}
              >
                {option[optionLabelKey]}
              </div>
            ))
          ) : (
            <div className="no-options">ไม่มีข้อมูล</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
