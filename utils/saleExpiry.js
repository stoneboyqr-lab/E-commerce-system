import cron from "node-cron";
import Product from "../models/Product.js";

// Runs every hour — checks for expired sales and turns them off
const startSaleExpiryJob = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();

      const expiredProducts = await Product.updateMany(
        {
          onSale: true,
          saleEnds: { $lte: now },
        },
        {
          onSale: false,
          salePrice: null,
          saleEnds: null,
        }
      );

      if (expiredProducts.modifiedCount > 0) {
        console.log(`✔ ${expiredProducts.modifiedCount} sale(s) expired and turned off`);
      }
    } catch (err) {
      console.error("Sale expiry job error:", err);
    }
  });

  console.log("✔ Sale expiry cron job started");
};

export default startSaleExpiryJob;