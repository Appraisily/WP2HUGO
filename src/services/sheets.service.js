const { google } = require('googleapis');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');

class SheetsService {
  constructor() {
    this.isConnected = false;
    this.sheetsId = null;
    this.sheets = null;
    this.auth = null;
  }

  async initialize() {
    try {
      let credentials;
      try {
        credentials = JSON.parse(await getSecret(secretNames.serviceAccountJson));
      } catch (error) {
        console.warn('[SHEETS] Service account credentials not available:', error.message);
        console.warn('[SHEETS] Sheets integration will be disabled');
        return false;
      }

      try {
        this.sheetsId = await getSecret(secretNames.sheetsId);
      } catch (error) {
        console.warn('[SHEETS] Sheets ID not available:', error.message);
        console.warn('[SHEETS] Sheets integration will be disabled');
        return false;
      }

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
        ranges: ['SEO!A1:B1'],  // Updated to use SEO sheet
        fields: 'sheets.properties.title'
      });

      this.isConnected = true;
      console.log('[SHEETS] Successfully initialized');
      return true;
    } catch (error) {
      console.error('[SHEETS] Initialization failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  async getHugoRows() {
    if (!this.isConnected) {
      console.warn('[SHEETS] Warning: Google Sheets connection not initialized. Returning mock data.');
      return this._getMockHugoRows();
    }
    
    try {
      // Get all rows from the Hugo sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'Hugo!A2:D', // Start from row 2 to skip headers
      });

      const rows = response.data.values || [];
      
      // Convert rows to objects with column headers
      return rows.map(row => ({
        'Keyword': row[0]?.trim() || '',
        'Date': row[1]?.trim() || '',
        'Status': row[2]?.trim() || '',
        'Post ID': row[3]?.trim() || ''
      }));

    } catch (error) {
      console.error('[SHEETS] Error getting Hugo rows:', error);
      console.warn('[SHEETS] Falling back to mock data due to error');
      return this._getMockHugoRows();
    }
  }

  async getAllRows() {
    if (!this.isConnected) {
      console.warn('[SHEETS] Warning: Google Sheets connection not initialized. Returning mock data.');
      return this._getMockAllRows();
    }
    
    try {
      console.log('[SHEETS] Fetching up to 20 rows for batch processing');
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'SEO!A2:D21', // Get rows 2-21 (up to 20 rows)
      });

      const rows = response.data.values || [];
      console.log(`[SHEETS] Retrieved ${rows.length} rows data`);
      
      // Convert rows to objects with column headers
      const processedRows = rows.map(row => ({
        'KWs': row[0]?.trim() || '',
        'SEO TItle': row[1]?.trim() || '',
        'Post ID': row[2]?.trim() || '',
        '2025-01-28T10:25:40.252Z': row[3]?.trim() || ''
      }));

      console.log(`[SHEETS] Processed ${processedRows.length} rows for processing`);
      return processedRows;

    } catch (error) {
      console.error('[SHEETS] Error getting rows:', error);
      console.warn('[SHEETS] Falling back to mock data due to error');
      return this._getMockAllRows();
    }
  }

  // Mock data to return when Sheets is not connected
  _getMockAllRows() {
    console.log('[SHEETS] Providing mock row data (1 test row)');
    return [
      {
        'KWs': 'antique electric hurricane lamps',
        'SEO TItle': 'Antique Electric Hurricane Lamps: Value, History & Collecting Guide',
        'Post ID': '',
        '2025-01-28T10:25:40.252Z': ''
      }
    ];
  }

  // Mock data for Hugo rows
  _getMockHugoRows() {
    console.log('[SHEETS] Providing mock Hugo row data');
    return [
      {
        'Keyword': 'antique electric hurricane lamps',
        'Date': new Date().toISOString(),
        'Status': 'Pending',
        'Post ID': ''
      }
    ];
  }

  async getNextUnprocessedPost() {
    if (!this.isConnected) {
      console.warn('[SHEETS] Warning: Google Sheets connection not initialized. Returning mock data.');
      return {
        keyword: 'antique electric hurricane lamps',
        wordpressId: 'mock-123',
        rowNumber: 2 
      };
    }
    
    try {
      // Get all rows from the SEO sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'SEO!A:D', // Columns: Keywords, Processed Date, Status, WordPress ID
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) { // Only headers or empty
        console.log('[SHEETS] No keywords found in sheet');
        return null;
      }

      // Skip header row and find first unprocessed row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const wordpressId = row[3]?.trim(); // Column D (index 3) is WordPress ID
        if (wordpressId) {
          console.log('[SHEETS] Found unprocessed keyword in row:', i + 1);
          return {
            keyword: row[0]?.trim() || '',
            wordpressId: wordpressId,
            rowNumber: i + 1 // Actual spreadsheet row number (1-based)
          };
        }
      }

      console.log('[SHEETS] No WordPress posts found to process');
      return null;
    } catch (error) {
      console.error('[SHEETS] Error getting WordPress posts:', error);
      console.warn('[SHEETS] Falling back to mock data due to error');
      return {
        keyword: 'antique electric hurricane lamps',
        wordpressId: 'mock-123',
        rowNumber: 2
      };
    }
  }

  async markPostAsProcessed(post, status = 'success', error = null) {
    if (!this.isConnected) {
      console.warn('[SHEETS] Warning: Google Sheets connection not initialized. Update skipped.');
      return;
    }
    
    try {
      const rowNumber = post.rowNumber;
      if (!rowNumber) {
        throw new Error('Row number not provided for keyword update');
      }

      // Prepare values for processed date (B), status (C), and WordPress ID (D) columns
      const processedDate = new Date().toISOString();
      const statusMessage = status === 'success' 
        ? 'Success'
        : `Error: ${error?.message || error || 'Unknown error'}`;
      const wordpressId = post.wordpressId || '';

      // Update all columns in a single request
      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.sheetsId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `SEO!B${rowNumber}:D${rowNumber}`,
              values: [[processedDate, statusMessage, wordpressId]]
            }
          ]
        }
      });
      
      console.log(`[SHEETS] Updated row ${rowNumber} with status: ${status}, WordPress ID: ${wordpressId}`);
    } catch (error) {
      console.error(`[SHEETS] Error marking row as processed:`, error);
      console.warn('[SHEETS] Row update skipped due to error');
    }
  }

  async findKeywordRow(keyword) {
    if (!this.isConnected) {
      console.warn('[SHEETS] Warning: Google Sheets connection not initialized. Returning mock data.');
      return {
        keyword: keyword,
        rowNumber: 2
      };
    }
    
    try {
      // Get all rows from the SEO sheet
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsId,
        range: 'SEO!A:C', // Columns: Keywords, Processed Date, Status
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) { // Only headers or empty
        console.log('[SHEETS] No keywords found in sheet');
        return null;
      }

      // Find the row with matching keyword
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0]?.trim().toLowerCase() === keyword.toLowerCase()) {
          console.log('[SHEETS] Found keyword in row:', i + 1);
          return {
            keyword: row[0]?.trim() || '',
            rowNumber: i + 1 // Actual spreadsheet row number (1-based)
          };
        }
      }

      console.log('[SHEETS] Keyword not found in sheet');
      return null;
    } catch (error) {
      console.error('[SHEETS] Error finding keyword row:', error);
      console.warn('[SHEETS] Falling back to mock data due to error');
      return {
        keyword: keyword,
        rowNumber: 2
      };
    }
  }
}

module.exports = new SheetsService();