export const mapDeliveryToOrderStatus = (deliveryStatus) => {
  switch (deliveryStatus) {
    case "pending":
      return "processing";

    case "in_transit":
      return "shipped";

    case "delivered":
      return "delivered";

    case "failed":
      return "cancelled";

    default:
      return "processing";
  }
};