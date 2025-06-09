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
  // Generate the url that will be used for the authorization
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to always get refresh_token
  });

  // In Replit, we can't open a browser directly, so we'll display the URL for the user
  console.log('\n\n================================================');
  console.log('Please open this URL in your browser:');
  console.log(authorizeUrl);
  console.log('================================================\n\n');
  
  // Prompt for the authorization code
  console.log('After authorizing, you will be redirected to a page that may show an error.');
  console.log('Look at the URL in your browser and copy the "code" parameter (between "code=" and "&")');
  
  // Simple function to prompt for input in Node.js
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('\nEnter the authorization code: ', (code) => {
      rl.close();
      resolve(code);
    });
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