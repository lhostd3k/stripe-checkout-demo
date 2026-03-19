// server.js
// ─────────────────────────────────────────────────────────────────────────────
// Stripe Checkout — Node.js + Express backend
// University assignment demo: $1.00 test payment
//
// HOW IT WORKS:
//   1. Frontend calls POST /create-checkout-session
//   2. This server creates a Stripe Checkout Session (hosted by Stripe)
//   3. It returns the Stripe-hosted URL to the frontend
//   4. Frontend redirects the browser to that URL
//   5. After payment, Stripe redirects back to /success.html or /cancel.html
// ─────────────────────────────────────────────────────────────────────────────

// Load environment variables from .env file (only in local development)
require('dotenv').config();

const express = require('express');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// Serve all static HTML/CSS/JS files from the /public folder
app.use(express.static(path.join(__dirname, 'public')));

// ── Route: Create Checkout Session ───────────────────────────────────────────

app.post('/create-checkout-session', async (req, res) => {

  // Guard: make sure the secret key is actually set
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY environment variable is not set!');
    return res.status(500).json({
      error: 'Server configuration error: missing Stripe secret key.'
    });
  }

  // Guard: make sure the public URL is set (needed for redirect URLs)
  if (!process.env.YOUR_DOMAIN) {
    console.error('ERROR: YOUR_DOMAIN environment variable is not set!');
    return res.status(500).json({
      error: 'Server configuration error: missing YOUR_DOMAIN.'
    });
  }

  try {
    // Create a Stripe Checkout Session
    // This is a temporary session object that Stripe uses to present
    // its hosted payment page. It expires after ~24 hours.
    const session = await stripe.checkout.sessions.create({

      // Payment method types accepted
      payment_method_types: ['card'],

      // What the customer is buying
      line_items: [
        {
          price_data: {
            currency: 'usd',

            product_data: {
              name: '$1 Test Item',
              description: 'University assignment demo product — test mode only',
            },

            // Stripe uses the SMALLEST currency unit (cents for USD)
            // $1.00 = 100 cents
            unit_amount: 100,
          },
          quantity: 1,
        },
      ],

      // 'payment' mode = one-time charge (not subscription)
      mode: 'payment',

      // Where to send the user AFTER a successful payment
      success_url: `${process.env.YOUR_DOMAIN}/success.html`,

      // Where to send the user if they click "back" or close the page
      cancel_url: `${process.env.YOUR_DOMAIN}/cancel.html`,
    });

    // Send the Stripe checkout URL back to the frontend
    res.json({ url: session.url });

  } catch (error) {
    // Log the full error on the server for debugging
    console.error('Stripe error:', error.message);

    // Send a clean error message back to the frontend
    res.status(500).json({ error: error.message });
  }
});

// ── Health check route (useful for Render.com) ───────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running.' });
});

// ── Start the server ──────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`   Open http://localhost:${PORT} in your browser.`);
});
