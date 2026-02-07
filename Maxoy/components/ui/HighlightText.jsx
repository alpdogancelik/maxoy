import React from "react";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const HighlightText = ({ text = "", query = "" }) => {
  if (!query) return text;
  const safeQuery = escapeRegExp(query.trim());
  if (!safeQuery) return text;
  const regex = new RegExp(`(${safeQuery})`, "ig");
  const parts = String(text).split(regex);
  const lower = query.trim().toLowerCase();
  return parts.map((part, index) =>
    part.toLowerCase() === lower ? <mark key={index}>{part}</mark> : <span key={index}>{part}</span>
  );
};

export default HighlightText;
