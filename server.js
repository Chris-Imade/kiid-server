const express = require("express");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Newsletter subscription endpoint
app.post("/api/subscribe", async (req, res) => {
  const { email, agreement } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  if (!agreement) {
    return res
      .status(400)
      .json({ success: false, message: "You must agree to the terms" });
  }

  try {
    // Send confirmation email to subscriber
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Newsletter Subscription Confirmation",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Newsletter Subscription Confirmation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #4a90e2;
              color: #ffffff;
              padding: 20px;
              text-align: center;
              border-top-left-radius: 5px;
              border-top-right-radius: 5px;
            }
            .content {
              padding: 20px;
            }
            .footer {
              text-align: center;
              padding: 15px;
              font-size: 12px;
              color: #666666;
              border-top: 1px solid #eeeeee;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #4a90e2;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Newsletter Subscription Confirmed</h1>
            </div>
            <div class="content">
              <h2>Thank you for subscribing!</h2>
              <p>Hello,</p>
              <p>You have successfully subscribed to our newsletter. We're excited to keep you updated with our latest news, offers, and updates.</p>
              <p>You'll receive your first newsletter soon. In the meantime, feel free to visit our website for more information.</p>
              <a href="#" class="button">Visit Our Website</a>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>This email was sent to ${email}</p>
              <p>If you did not sign up for this newsletter, you can <a href="#">unsubscribe here</a>.</p>
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Send notification to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Newsletter Subscription",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Newsletter Subscription</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #4a90e2;
              color: #ffffff;
              padding: 20px;
              text-align: center;
              border-top-left-radius: 5px;
              border-top-right-radius: 5px;
            }
            .content {
              padding: 20px;
            }
            .footer {
              text-align: center;
              padding: 15px;
              font-size: 12px;
              color: #666666;
              border-top: 1px solid #eeeeee;
            }
            .info-box {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Newsletter Subscriber</h1>
            </div>
            <div class="content">
              <p>A new user has subscribed to your newsletter.</p>
              <div class="info-box">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>You can manage your subscribers from your admin dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return res
      .status(200)
      .json({ success: true, message: "Subscription successful" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process subscription" });
  }
});

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Validate inputs
  if (!name || !email || !subject || !message) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    // Send contact form submission to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #4a90e2;
              color: #ffffff;
              padding: 20px;
              text-align: center;
              border-top-left-radius: 5px;
              border-top-right-radius: 5px;
            }
            .content {
              padding: 20px;
            }
            .footer {
              text-align: center;
              padding: 15px;
              font-size: 12px;
              color: #666666;
              border-top: 1px solid #eeeeee;
            }
            .message-box {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
              margin: 15px 0;
              white-space: pre-wrap;
            }
            .info-item {
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Form Submission</h1>
            </div>
            <div class="content">
              <p>You have received a new message from your website contact form.</p>
              
              <div class="info-item"><strong>Name:</strong> ${name}</div>
              <div class="info-item"><strong>Email:</strong> ${email}</div>
              <div class="info-item"><strong>Subject:</strong> ${subject}</div>
              <div class="info-item"><strong>Date:</strong> ${new Date().toLocaleString()}</div>
              
              <p><strong>Message:</strong></p>
              <div class="message-box">${message}</div>
              
              <p>Please respond to this inquiry as soon as possible.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Send confirmation to the person who submitted the form
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "We received your message",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Message Received</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 5px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #4a90e2;
              color: #ffffff;
              padding: 20px;
              text-align: center;
              border-top-left-radius: 5px;
              border-top-right-radius: 5px;
            }
            .content {
              padding: 20px;
            }
            .footer {
              text-align: center;
              padding: 15px;
              font-size: 12px;
              color: #666666;
              border-top: 1px solid #eeeeee;
            }
            .message-summary {
              background-color: #f5f5f5;
              padding: 15px;
              border-radius: 4px;
              margin: 15px 0;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #4a90e2;
              color: #ffffff;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Message Has Been Received</h1>
            </div>
            <div class="content">
              <h2>Thank you for contacting us!</h2>
              <p>Hello ${name},</p>
              <p>We have received your message and appreciate you taking the time to write to us. Our team will review your inquiry and get back to you as soon as possible.</p>
              
              <div class="message-summary">
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Sent on:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>If you have any additional information to provide, please feel free to reply to this email.</p>
              <a href="#" class="button">Visit Our Website</a>
              <p>Thank you for your patience and understanding.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly.</p>
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send message" });
  }
});

// Serve static files (if needed)
// app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
