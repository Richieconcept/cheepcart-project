// utils/shipmentStatusMapper.js

export const mapToAppStatus = (code) => {
  if (code === 0) return "pending";
  if (code === 1 || code === 24) return "picked";
  if (code >= 2 && code <= 16) return "in_transit";
  if (code === 9) return "out_for_delivery";
  if (code === 20) return "delivered";
  if (code === 18 || code === 19) return "issue";
  if (code === 21 || code === 99) return "delayed";

  return "unknown";
};