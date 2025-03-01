/**
 * Content Monitoring Report Generator
 * 
 * This script generates a comprehensive report on content freshness,
 * identifies content that needs updating, and provides update recommendations.
 * 
 * Usage:
 *   node generate-monitoring-report.js        # Generate standard report
 *   node generate-monitoring-report.js --all  # Include all content (even fresh content)
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const contentMonitorService = require('./src/services/content-monitor.service');

/**
 * Generate a formatted HTML report
 * @param {object} report - Content monitoring report
 * @returns {string} - Formatted HTML report
 */
async function generateHtmlReport(report) {
  // Generate timestamp
  const timestamp = new Date(report.generatedAt).toLocaleString();
  
  // Create HTML
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Monitoring Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background: #f4f4f4;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 5px;
    }
    h1 {
      margin-top: 0;
      color: #2c3e50;
    }
    h2 {
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-top: 30px;
      color: #2c3e50;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .summary-box {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 15px;
      width: 23%;
      text-align: center;
    }
    .summary-box h3 {
      margin-top: 0;
      font-size: 16px;
    }
    .summary-box p {
      font-size: 24px;
      font-weight: bold;
      margin: 5px 0;
    }
    .critical {
      background: #ffeaea;
      border-left: 4px solid #e74c3c;
    }
    .warning {
      background: #fff5e0;
      border-left: 4px solid #f39c12;
    }
    .notice {
      background: #e8f4fd;
      border-left: 4px solid #3498db;
    }
    .good {
      background: #e8f8e8;
      border-left: 4px solid #2ecc71;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f4f4f4;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f9f9f9;
    }
    .suggestions {
      margin-top: 5px;
      font-size: 14px;
      color: #555;
    }
    .age-stats {
      margin-bottom: 30px;
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <header>
    <h1>Content Monitoring Report</h1>
    <p>Generated: ${timestamp}</p>
    <p>Total content pieces: ${report.contentCount}</p>
  </header>

  <section class="summary">
    <div class="summary-box critical">
      <h3>Critical Updates</h3>
      <p>${report.updateSummary.critical}</p>
    </div>
    <div class="summary-box warning">
      <h3>Recommended Updates</h3>
      <p>${report.updateSummary.recommended}</p>
    </div>
    <div class="summary-box notice">
      <h3>Suggested Updates</h3>
      <p>${report.updateSummary.suggested}</p>
    </div>
    <div class="summary-box good">
      <h3>Up to Date</h3>
      <p>${report.updateSummary.upToDate}</p>
    </div>
  </section>

  <section class="age-stats">
    <h2>Content Age Statistics</h2>
    <p><strong>Average Age:</strong> ${report.ageStatistics.averageAge} days</p>
    <p><strong>Oldest Content:</strong> ${report.ageStatistics.oldest} days</p>
    <p><strong>Newest Content:</strong> ${report.ageStatistics.newest} days</p>
  </section>
  `;
  
  // Add critical updates section
  if (report.criticalUpdates.length > 0) {
    html += `
  <section>
    <h2>Critical Updates Needed</h2>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Last Updated</th>
          <th>Age (days)</th>
          <th>Update Suggestions</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    for (const item of report.criticalUpdates) {
      const lastUpdated = new Date(item.lastUpdated).toLocaleDateString();
      const suggestions = item.suggestions.slice(0, 3).map(s => `<li>${s}</li>`).join('');
      
      html += `
        <tr>
          <td><strong>${item.title}</strong></td>
          <td>${lastUpdated}</td>
          <td>${item.ageInDays}</td>
          <td class="suggestions">
            <ul>${suggestions}</ul>
          </td>
        </tr>
      `;
    }
    
    html += `
      </tbody>
    </table>
  </section>
    `;
  }
  
  // Add recommended updates section
  if (report.recommendedUpdates.length > 0) {
    html += `
  <section>
    <h2>Recommended Updates</h2>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Last Updated</th>
          <th>Age (days)</th>
          <th>Update Suggestions</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    for (const item of report.recommendedUpdates) {
      const lastUpdated = new Date(item.lastUpdated).toLocaleDateString();
      const suggestions = item.suggestions.slice(0, 2).map(s => `<li>${s}</li>`).join('');
      
      html += `
        <tr>
          <td><strong>${item.title}</strong></td>
          <td>${lastUpdated}</td>
          <td>${item.ageInDays}</td>
          <td class="suggestions">
            <ul>${suggestions}</ul>
          </td>
        </tr>
      `;
    }
    
    html += `
      </tbody>
    </table>
  </section>
    `;
  }
  
  // Add suggested updates section
  if (report.suggestedUpdates.length > 0) {
    html += `
  <section>
    <h2>Suggested Updates</h2>
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Last Updated</th>
          <th>Age (days)</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    for (const item of report.suggestedUpdates) {
      const lastUpdated = new Date(item.lastUpdated).toLocaleDateString();
      
      html += `
        <tr>
          <td><strong>${item.title}</strong></td>
          <td>${lastUpdated}</td>
          <td>${item.ageInDays}</td>
        </tr>
      `;
    }
    
    html += `
      </tbody>
    </table>
  </section>
    `;
  }
  
  // Close HTML
  html += `
</body>
</html>
  `;
  
  return html;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('\n==== Content Monitoring Report ====\n');
    
    // Initialize service
    await contentMonitorService.initialize();
    
    // Generate report
    console.log('Generating content monitoring report...');
    const report = await contentMonitorService.generateUpdateReport();
    
    // Save JSON report
    const reportPath = './output/update-report.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`JSON report saved to: ${reportPath}`);
    
    // Generate and save HTML report
    console.log('Generating HTML report...');
    const htmlReport = await generateHtmlReport(report);
    const htmlReportPath = './output/update-report.html';
    await fs.writeFile(htmlReportPath, htmlReport, 'utf8');
    console.log(`HTML report saved to: ${htmlReportPath}`);
    
    // Print summary
    console.log('\n==== Report Summary ====');
    console.log(`Total content: ${report.contentCount}`);
    console.log(`Content needing critical updates: ${report.updateSummary.critical}`);
    console.log(`Content needing recommended updates: ${report.updateSummary.recommended}`);
    console.log(`Content with suggested updates: ${report.updateSummary.suggested}`);
    console.log(`Up-to-date content: ${report.updateSummary.upToDate}`);
    
    console.log('\n==== Content Monitoring Report Complete ====\n');
  } catch (error) {
    console.error('Error generating monitoring report:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 