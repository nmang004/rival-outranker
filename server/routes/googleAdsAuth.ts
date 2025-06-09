import { Router, Request, Response } from 'express';
import { isGoogleAdsApiReady, getRequiredSecrets } from '../services/external/google-ads.service';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const googleAdsAuthRouter = Router();

// Check Google Ads API auth status
googleAdsAuthRouter.get('/status', (req: Request, res: Response) => {
  try {
    const isReady = isGoogleAdsApiReady();
    const missingSecrets = getRequiredSecrets().filter(
      secret => !process.env[secret]
    );
    
    res.json({
      isReady,
      missingSecrets: missingSecrets.length > 0 ? missingSecrets : undefined,
      message: isReady 
        ? 'Google Ads API is configured correctly' 
        : `Google Ads API is missing required credentials: ${missingSecrets.join(', ')}`
    });
  } catch (error) {
    console.error('Error checking Google Ads API status:', error);
    res.status(500).json({ message: 'Failed to check Google Ads API status' });
  }
});

// Update Google Ads API credentials
googleAdsAuthRouter.post('/credentials', (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret, developerToken, refreshToken, customerId } = req.body;
    
    if (!clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
      return res.status(400).json({ message: 'All Google Ads API credentials are required' });
    }
    
    // Update environment variables (in memory)
    process.env.GOOGLE_ADS_CLIENT_ID = clientId;
    process.env.GOOGLE_ADS_CLIENT_SECRET = clientSecret;
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN = developerToken;
    process.env.GOOGLE_ADS_REFRESH_TOKEN = refreshToken;
    process.env.GOOGLE_ADS_CUSTOMER_ID = customerId;
    
    // Also try to update the .env file for persistence (if allowed in the environment)
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      let envContent = '';
      
      // Read existing .env file if it exists
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Update the values for each credential
      const credentials = {
        GOOGLE_ADS_CLIENT_ID: clientId,
        GOOGLE_ADS_CLIENT_SECRET: clientSecret,
        GOOGLE_ADS_DEVELOPER_TOKEN: developerToken,
        GOOGLE_ADS_REFRESH_TOKEN: refreshToken,
        GOOGLE_ADS_CUSTOMER_ID: customerId
      };
      
      // Update each credential in the env file
      Object.entries(credentials).forEach(([key, value]) => {
        // If the key exists in the file, replace it
        if (envContent.includes(`${key}=`)) {
          const regex = new RegExp(`${key}=.*`, 'g');
          envContent = envContent.replace(regex, `${key}="${value}"`);
        } else {
          // Otherwise, add it to the end
          envContent += `\n${key}="${value}"`;
        }
      });
      
      // Write the updated content back to the .env file
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('Updated Google Ads API credentials in .env file');
    } catch (fileError) {
      console.warn('Could not update .env file, but credentials are set for this session:', fileError);
    }
    
    res.json({ 
      success: true, 
      message: 'Google Ads API credentials have been updated'
    });
  } catch (error) {
    console.error('Error updating Google Ads API credentials:', error);
    res.status(500).json({ message: 'Failed to update Google Ads API credentials' });
  }
});

export { googleAdsAuthRouter };