const { google } = require('googleapis');
const { getSecret } = require('../../../utils/secrets');
const { secretNames } = require('../../../config');
const BaseResearchService = require('../base');

class SheetsService extends BaseResearchService {
  constructor() {
    super();
    this.isConnected = false;
    this.sheetsId = null;
    this.sheets = null;
    this.auth = null;
  }

  async initialize() {
    try {
      await super.initialize();
      const credentials = JSON.parse(await getSecret(secretNames.serviceAccountJson));
      this.sheetsId = await getSecret(secretNames.sheetsId);

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ 
        version: 'v4', 
        auth: this.auth 
      });

      // Verify access by trying to get sheet properties
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.sheetsId,
        ranges: ['SEO!A1:B1'],
        fields: 'sheets.properties.title'
      });

      this.isConnected = true;
      console.log('[SHEETS] Successfully initialized');
      return true;
    } catch (error) {
      console.error('[SHEETS] Initialization failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async getAllRows() {
    if (!this.isConnected) {
      throw new Error('Google Sheets connection not initialized');
    }
    
    try {
      console.log('[SHEETS] Fetching only row 2 for debugging');
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'SEO!A2:D2', // Only get row 2
      });

      const rows = response.data.values || [];
      console.log('[SHEETS] Row 2 data:', rows[0]);
      
      // Convert rows to objects with column headers
      const processedRows = rows.map(row => ({
        'KWs': row[0]?.trim() || '',
        'SEO TItle': row[1]?.trim() || '',
        'Post ID': row[2]?.trim() || '',
        '2025-01-28T10:25:40.252Z': row[3]?.trim() || ''
      }));

      console.log('[SHEETS] Processed row 2:', processedRows[0]);
      return processedRows;

    } catch (error) {
      console.error('[SHEETS] Error getting all rows:', error);
      throw error;
    }
  }
}

module.exports = new SheetsService();