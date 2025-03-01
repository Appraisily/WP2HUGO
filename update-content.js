/**
 * Content Update Script
 * 
 * This script automatically refreshes and updates content
 * based on monitoring report recommendations.
 * 
 * Usage:
 *   node update-content.js                      # Interactive mode (select content to update)
 *   node update-content.js --keyword "keyword"  # Update content for specific keyword
 *   node update-content.js --all                # Update all content needing critical updates
 *   node update-content.js --auto               # Fully automated update of critical content
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const inquirer = require('inquirer');
const contentMonitorService = require('./src/services/content-monitor.service');
const markdownGeneratorService = require('./src/services/markdown-generator.service');
const fileUtils = require('./src/utils/files');

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const keywordFlag = args.findIndex(arg => arg === '--keyword');
    const keyword = keywordFlag !== -1 ? args[keywordFlag + 1] : null;
    const updateAll = args.includes('--all');
    const autoMode = args.includes('--auto');
    
    console.log('\n==== Content Update Tool ====\n');
    
    // Initialize services
    await contentMonitorService.initialize();
    await markdownGeneratorService.initialize();
    
    if (keyword) {
      // Update content for specific keyword
      await updateContentForKeyword(keyword, autoMode);
    } else if (updateAll) {
      // Update all content needing critical updates
      await updateAllCriticalContent(autoMode);
    } else {
      // Interactive mode
      await interactiveUpdate(autoMode);
    }
    
    console.log('\n==== Content Update Complete ====\n');
  } catch (error) {
    console.error('Error updating content:', error);
    process.exit(1);
  }
}

/**
 * Interactive content update mode
 * @param {boolean} autoMode - Whether to use automatic update mode
 */
async function interactiveUpdate(autoMode) {
  console.log('Generating content update report...');
  const report = await contentMonitorService.generateUpdateReport();
  
  // Combine all content needing updates
  const allContentToUpdate = [
    ...report.criticalUpdates.map(item => ({ ...item, level: 'critical' })),
    ...report.recommendedUpdates.map(item => ({ ...item, level: 'recommended' })),
    ...report.suggestedUpdates.map(item => ({ ...item, level: 'suggested' }))
  ];
  
  if (allContentToUpdate.length === 0) {
    console.log('No content needs updating at this time.');
    return;
  }
  
  console.log(`Found ${allContentToUpdate.length} content items that need updating:`);
  console.log(`- ${report.criticalUpdates.length} critical updates`);
  console.log(`- ${report.recommendedUpdates.length} recommended updates`);
  console.log(`- ${report.suggestedUpdates.length} suggested updates`);
  
  if (autoMode) {
    console.log('\nAuto mode enabled - updating all critical content items...');
    for (const item of report.criticalUpdates) {
      await updateContentItem(item, true);
    }
    return;
  }
  
  // Prompt user to select content to update
  const { selectedItems } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedItems',
      message: 'Select content items to update:',
      choices: allContentToUpdate.map(item => ({
        name: `[${item.level.toUpperCase()}] ${item.title} (${item.ageInDays} days old)`,
        value: item.fileName,
        checked: item.level === 'critical' // Pre-select critical updates
      })),
      pageSize: 20
    }
  ]);
  
  if (selectedItems.length === 0) {
    console.log('No content selected for update.');
    return;
  }
  
  // Update selected content
  console.log(`\nUpdating ${selectedItems.length} content items...`);
  
  for (const fileName of selectedItems) {
    const contentItem = allContentToUpdate.find(item => item.fileName === fileName);
    if (contentItem) {
      await updateContentItem(contentItem, false);
    }
  }
}

/**
 * Update content for a specific keyword
 * @param {string} keyword - Keyword to update content for
 * @param {boolean} autoMode - Whether to use automatic update mode
 */
async function updateContentForKeyword(keyword, autoMode) {
  console.log(`Searching for content related to keyword: "${keyword}"...`);
  
  // Get all content metadata
  await contentMonitorService.initialize();
  const contentItem = contentMonitorService.contentMetadata.find(
    item => item.keyword.toLowerCase() === keyword.toLowerCase()
  );
  
  if (!contentItem) {
    console.error(`No content found for keyword: "${keyword}"`);
    return;
  }
  
  console.log(`Found content: ${contentItem.title} (${contentItem.ageInDays} days old)`);
  
  // Generate update suggestions
  console.log('Generating update suggestions...');
  const suggestions = await contentMonitorService.generateUpdateSuggestions(contentItem);
  
  // Add suggestions to content item
  const contentToUpdate = {
    ...contentItem,
    suggestions
  };
  
  // Update the content
  await updateContentItem(contentToUpdate, autoMode);
}

/**
 * Update all content needing critical updates
 * @param {boolean} autoMode - Whether to use automatic update mode
 */
async function updateAllCriticalContent(autoMode) {
  console.log('Finding all content needing critical updates...');
  
  const report = await contentMonitorService.generateUpdateReport();
  
  if (report.criticalUpdates.length === 0) {
    console.log('No content needs critical updates at this time.');
    return;
  }
  
  console.log(`Found ${report.criticalUpdates.length} content items needing critical updates.`);
  
  // Confirm with user if not in auto mode
  if (!autoMode) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Update all ${report.criticalUpdates.length} content items?`,
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log('Update canceled.');
      return;
    }
  }
  
  // Update all critical content
  for (const contentItem of report.criticalUpdates) {
    await updateContentItem(contentItem, autoMode);
  }
}

/**
 * Update a single content item
 * @param {object} contentItem - Content item to update
 * @param {boolean} autoMode - Whether to use automatic update mode
 */
async function updateContentItem(contentItem, autoMode) {
  try {
    console.log(`\nUpdating: ${contentItem.title}`);
    
    // Read the original content
    const content = await fs.readFile(contentItem.filePath, 'utf8');
    const frontmatter = fileUtils.extractFrontmatter(content);
    const contentBody = content.replace(/^---[\s\S]*?---/, '').trim();
    
    // Show update suggestions
    console.log('Update suggestions:');
    contentItem.suggestions.forEach((suggestion, i) => {
      console.log(`${i + 1}. ${suggestion}`);
    });
    
    let updatedContent;
    let updateMethod;
    
    if (autoMode) {
      // Use AI to automatically update the content
      console.log('\nAutomatically updating content using AI...');
      updatedContent = await generateUpdatedContent(contentItem, contentBody);
      updateMethod = 'auto';
    } else {
      // Let user choose update method
      const { method } = await inquirer.prompt([
        {
          type: 'list',
          name: 'method',
          message: 'How would you like to update this content?',
          choices: [
            { name: 'Have AI automatically update the content', value: 'auto' },
            { name: 'Generate new content based on the original keyword', value: 'regenerate' },
            { name: 'Skip this content', value: 'skip' }
          ]
        }
      ]);
      
      updateMethod = method;
      
      if (method === 'skip') {
        console.log('Skipping this content.');
        return;
      } else if (method === 'auto') {
        console.log('\nGenerating updated content using AI...');
        updatedContent = await generateUpdatedContent(contentItem, contentBody);
      } else if (method === 'regenerate') {
        console.log('\nRegenerating content from scratch...');
        updatedContent = await regenerateContent(contentItem.keyword);
      }
    }
    
    // If we have updated content, save it
    if (updatedContent) {
      // Update frontmatter
      const now = new Date();
      frontmatter.lastUpdated = now.toISOString().split('T')[0]; // YYYY-MM-DD
      frontmatter.updatedBy = 'content-update-tool';
      
      // Save updated content
      await fileUtils.saveMarkdownFile(contentItem.filePath, frontmatter, updatedContent);
      
      console.log(`Content successfully updated (${updateMethod} method).`);
    }
  } catch (error) {
    console.error(`Error updating content ${contentItem.title}:`, error);
  }
}

/**
 * Generate updated content based on original content and suggestions
 * @param {object} contentItem - Content item metadata
 * @param {string} originalContent - Original content body
 * @returns {Promise<string>} - Updated content
 */
async function generateUpdatedContent(contentItem, originalContent) {
  try {
    // Prepare prompt for content update
    const updatePrompt = `
You are a content updating assistant. Please refresh and improve the following content
about "${contentItem.keyword}" which is ${contentItem.ageInDays} days old.

Update suggestions:
${contentItem.suggestions.map(s => `- ${s}`).join('\n')}

Original content:
${originalContent}

Please provide an updated version that:
1. Incorporates all the update suggestions
2. Refreshes any outdated information, statistics or references
3. Improves the overall quality, readability and SEO value
4. Maintains the same general structure and tone as the original
5. Is comprehensive, informative, and valuable to the reader

Return ONLY the updated content without any prefixes, explanations, or frontmatter.
`;

    // Generate updated content using AI
    const response = await markdownGeneratorService.generateMarkdown(updatePrompt);
    
    return response.trim();
  } catch (error) {
    console.error('Error generating updated content:', error);
    throw error;
  }
}

/**
 * Regenerate content from scratch based on keyword
 * @param {string} keyword - Keyword to generate content for
 * @returns {Promise<string>} - New content
 */
async function regenerateContent(keyword) {
  try {
    // Generate fresh content based on keyword
    console.log(`Regenerating content for keyword: "${keyword}"`);
    
    const content = await markdownGeneratorService.generateKeywordContent(keyword);
    
    return content.trim();
  } catch (error) {
    console.error('Error regenerating content:', error);
    throw error;
  }
}

// Run the main function
main(); 