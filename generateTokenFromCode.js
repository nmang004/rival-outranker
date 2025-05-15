import { google } from 'googleapis';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Use your Google OAuth credentials from .env
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// The authorization code received from the OAuth flow
const AUTH_CODE = "4/0AUJR-x7DBda0j4y_Vvm0tGlXRpFgEbfHY2z4DBOBfs2ZM_oPKfMmxETUyGYto5wCd-e-Sg";

async function getRefreshToken() {
  try {
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(AUTH_CODE);
    
    console.log('\n=== YOUR REFRESH TOKEN ===');
    console.log(tokens.refresh_token);
    console.log('=========================\n');
    
    console.log('Add this refresh token to your environment variables as GOOGLE_ADS_REFRESH_TOKEN');
    console.log('\nFull token information:');
    console.log('Access token (expires after 1 hour):', tokens.access_token);
    console.log('Token type:', tokens.token_type);
    console.log('Expires at:', new Date(tokens.expiry_date).toLocaleString());
    
  } catch (error) {
    console.error('Error getting tokens:', error.message);
    if (error.response && error.response.data) {
      console.error('Error details:', error.response.data);
    }
  }
}

// Run the function
getRefreshToken();