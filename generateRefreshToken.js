import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import open from 'open';
import destroyer from 'server-destroy';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Use your Google OAuth credentials from .env
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// The scopes required for Google Ads API
const SCOPES = [
  'https://www.googleapis.com/auth/adwords'
];

/**
 * Create a new OAuth2 client with the given credentials
 */
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

/**
 * Open the browser for authentication and get the authorization code
 */
async function getAuthorizationCode() {
  return new Promise((resolve, reject) => {
    // Generate the url that will be used for the authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force to always get refresh_token
    });

    // Create a simple server to receive the authorization code
    const server = http.createServer(async (req, res) => {
      try {
        // Check if this is the callback from Google
        if (req.url.indexOf('/oauth2callback') > -1) {
          // Get the authorization code from the callback URL
          const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
          const code = qs.get('code');
          
          // Close the HTTP server
          server.destroy();
          
          // Respond to the user
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(`
            <html>
              <body>
                <h1>Authentication successful!</h1>
                <p>You can close this window and return to the application.</p>
              </body>
            </html>
          `);
          
          // Resolve the promise with the authorization code
          resolve(code);
        }
      } catch (e) {
        reject(e);
      }
    }).listen(3000, () => {
      // Open the authorization URL in the browser
      open(authorizeUrl, {wait: false}).then(cp => cp.unref());
    });
    
    destroyer(server);
  });
}

/**
 * Exchange authorization code for tokens
 */
async function getTokens(code) {
  const {tokens} = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Waiting for authentication...');
    
    // Get the authorization code
    const code = await getAuthorizationCode();
    console.log('Authorization code received:', code);
    
    // Exchange the code for tokens
    const tokens = await getTokens(code);
    
    console.log('\n=== YOUR REFRESH TOKEN ===');
    console.log(tokens.refresh_token);
    console.log('=========================\n');
    
    console.log('Store this refresh token in your environment variables as GOOGLE_ADS_REFRESH_TOKEN');
    console.log('Access token (expires after 1 hour):', tokens.access_token);
    console.log('Token type:', tokens.token_type);
    console.log('Expires at:', new Date(tokens.expiry_date).toLocaleString());
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();