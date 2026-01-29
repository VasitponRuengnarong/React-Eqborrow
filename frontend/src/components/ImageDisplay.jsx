import React, { useMemo } from "react";

/**
 * ImageDisplay Component
 * รองรับ data ที่เป็น:
 * 1. URL String (http://..., /uploads/...)
 * 2. Base64 String (ทั้งที่มีและไม่มี prefix)
 * 3. Buffer Object ({ type: 'Buffer', data: [...] })
 */
const ImageDisplay = ({ data, alt = "Image", className, style }) => {
  const imageSrc = useMemo(() => {
    if (!data) return null;

    // กรณี data เป็น String
    if (typeof data === "string") {
      // ถ้าเป็น URL หรือ Data URI ที่สมบูรณ์อยู่แล้ว
      if (
        data.startsWith("http") ||
        data.startsWith("/") ||
        data.startsWith("data:")
      ) {
        return data;
      }
      // ถ้าเป็น Base64 string เพียวๆ ให้เติม prefix (สมมติว่าเป็น jpeg/png)
      return `data:image/jpeg;base64,${data}`;
    }

    // กรณี data เป็น Buffer (เช่น มาจากฐานข้อมูลโดยตรง)
    if (data.type === "Buffer" && Array.isArray(data.data)) {
      const base64String = btoa(
        new Uint8Array(data.data).reduce(
          (acc, byte) => acc + String.fromCharCode(byte),
          "",
        ),
      );
      return `data:image/jpeg;base64,${base64String}`;
    }

    return null;
  }, [data]);

  if (!imageSrc) {
    return (
      <div
        className={className}
        style={{
          ...style,
          backgroundColor: "#eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100px",
        }}
      >
        No Image Data
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        e.target.style.display = "none"; // ซ่อนรูปถ้าโหลดไม่ได้
      }}
    />
  );
};

export default ImageDisplay;
