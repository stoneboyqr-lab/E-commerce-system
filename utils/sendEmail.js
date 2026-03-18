import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Send order confirmation email
export const sendOrderConfirmationEmail = async (to, order) => {
  const itemsList = order.items
    .map((item) => `<li>${item.product.title} x${item.quantity} — ₦${item.priceAtPurchase.toLocaleString()}</li>`)
    .join("");

  const mailOptions = {
    from: `"Lvst Store" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Order Confirmed — ${order.orderId}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your order <strong>${order.orderId}</strong> has been confirmed.</p>
      <h3>Order Summary:</h3>
      <ul>${itemsList}</ul>
      <p><strong>Total: ₦${order.totalAfterDiscount.toLocaleString()}</strong></p>
      <p>We'll notify you when your order ships.</p>
      <br/>
      <p>Thank you for shopping with us.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Send general email
export const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Lvst Store" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};