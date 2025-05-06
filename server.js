const express = require("express");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const os = require("os"); // Add os module for system information
const cors = require("cors"); // Add CORS module

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST"], // Allow these HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow these headers
  })
);

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

// Root endpoint with network check
app.get("/", (req, res) => {
  // Get server information
  const serverInfo = {
    status: "online",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    hostname: os.hostname(),
    platform: process.platform,
    nodeVersion: process.version,
    networkInterfaces: getNetworkInfo(),
    memoryUsage: {
      total: `${Math.round(os.totalmem() / (1024 * 1024))} MB`,
      free: `${Math.round(os.freemem() / (1024 * 1024))} MB`,
      usage: `${Math.round(
        ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      )}%`,
    },
    endpoints: [
      {
        path: "/",
        method: "GET",
        description: "Server status and network information",
      },
      {
        path: "/api/subscribe",
        method: "POST",
        description: "Newsletter subscription endpoint",
      },
      {
        path: "/api/contact",
        method: "POST",
        description: "Contact form submission endpoint",
      },
    ],
  };

  // Send HTML response
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Server Status</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f7f9fc;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        .status-badge {
          display: inline-block;
          background-color: #27ae60;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          margin-left: 10px;
        }
        .card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        .card h2 {
          margin-top: 0;
          color: #3498db;
        }
        pre {
          background-color: #f1f1f1;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          text-align: left;
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f1f5f9;
        }
        tr:hover {
          background-color: #f9f9f9;
        }
      </style>
    </head>
    <body>
      <h1>Server Status <span class="status-badge">Online</span></h1>
      
      <div class="card">
        <h2>Server Information</h2>
        <table>
          <tr>
            <td>Timestamp</td>
            <td>${serverInfo.timestamp}</td>
          </tr>
          <tr>
            <td>Uptime</td>
            <td>${serverInfo.uptime}</td>
          </tr>
          <tr>
            <td>Hostname</td>
            <td>${serverInfo.hostname}</td>
          </tr>
          <tr>
            <td>Platform</td>
            <td>${serverInfo.platform}</td>
          </tr>
          <tr>
            <td>Node.js Version</td>
            <td>${serverInfo.nodeVersion}</td>
          </tr>
        </table>
      </div>
      
      <div class="card">
        <h2>Memory Usage</h2>
        <table>
          <tr>
            <td>Total Memory</td>
            <td>${serverInfo.memoryUsage.total}</td>
          </tr>
          <tr>
            <td>Free Memory</td>
            <td>${serverInfo.memoryUsage.free}</td>
          </tr>
          <tr>
            <td>Usage</td>
            <td>${serverInfo.memoryUsage.usage}</td>
          </tr>
        </table>
      </div>
      
      <div class="card">
        <h2>Network Interfaces</h2>
        <pre>${JSON.stringify(serverInfo.networkInterfaces, null, 2)}</pre>
      </div>
      
      <div class="card">
        <h2>Available Endpoints</h2>
        <table>
          <tr>
            <th>Path</th>
            <th>Method</th>
            <th>Description</th>
          </tr>
          ${serverInfo.endpoints
            .map(
              (endpoint) => `
            <tr>
              <td>${endpoint.path}</td>
              <td>${endpoint.method}</td>
              <td>${endpoint.description}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>
    </body>
    </html>
  `);
});

// Helper function to get network interfaces information
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const networkInfo = {};

  for (const [name, netInterface] of Object.entries(interfaces)) {
    // Filter to only include IPv4 interfaces
    const ipv4Interfaces = netInterface.filter(
      (iface) => iface.family === "IPv4"
    );

    if (ipv4Interfaces.length > 0) {
      networkInfo[name] = ipv4Interfaces.map((iface) => ({
        address: iface.address,
        netmask: iface.netmask,
        internal: iface.internal,
      }));
    }
  }

  return networkInfo;
}

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
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
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
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
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
