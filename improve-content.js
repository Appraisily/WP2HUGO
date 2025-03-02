#!/usr/bin/env node

require('dotenv').config();
const workflowService = require('./src/services/workflow.service');
const path = require('path');
const fs = require('fs').promises;

// Parse command line arguments
const args = process.argv.slice(2);
let targetKeyword = null;
let improveAll = false;
let minScore = 85; // Default minimum SEO score

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--keyword' && i + 1 < args.length) {
    targetKeyword = args[i + 1];
    i++; // Skip the next argument as it's the keyword
  } else if (args[i] === '--all') {
    improveAll = true;
  } else if (args[i] === '--min-score' && i + 1 < args.length) {
    minScore = parseInt(args[i + 1]);
    i++; // Skip the next argument as it's the score
  } else if (args[i].startsWith('--min-score=')) {
    minScore = parseInt(args[i].split('=')[1]);
  }
}

async function main() {
  try {
    console.log('Starting content improvement process...');
    
    await workflowService.initialize();
    
    if (improveAll) {
      // Improve all content
      console.log(`Improving all content with SEO score below ${minScore}...`);
      const results = await workflowService.batchImproveAllContent(minScore);
      
      console.log('\nImprovement Results:');
      console.log('====================');
      
      if (results.length === 0) {
        console.log('No content needed improvement (all content is above the minimum SEO score).');
      } else {
        for (const result of results) {
          console.log(`"${result.keyword}": Score improved from ${result.oldScore} to ${result.newScore}`);
        }
        
        console.log(`\nSuccessfully improved ${results.length} piece(s) of content.`);
      }
    } else if (targetKeyword) {
      // Improve specific keyword
      console.log(`Improving content for keyword: "${targetKeyword}"`);
      const result = await workflowService.improveExistingContent(targetKeyword);
      
      if (result.improvementsMade) {
        const oldScore = result.previousSeoAssessment?.overallScore || 0;
        const newScore = result.seoAssessment?.overallScore || 0;
        
        console.log('\nImprovement Results:');
        console.log('====================');
        console.log(`SEO Score: ${oldScore} → ${newScore} (${newScore - oldScore > 0 ? '+' : ''}${newScore - oldScore} points)`);
        
        if (result.seoRecommendations?.prioritizedActions) {
          console.log('\nRemaining Recommendations:');
          const mediumPriority = result.seoRecommendations.prioritizedActions.filter(a => a.priority === 'Medium');
          
          if (mediumPriority.length > 0) {
            console.log('Medium Priority:');
            mediumPriority.forEach(action => {
              console.log(`- ${action.issue}`);
            });
          } else {
            console.log('No medium priority issues remaining.');
          }
        }
      } else {
        console.log(`Content for "${targetKeyword}" is already optimized (score: ${result.seoScore || result.seoAssessment?.overallScore || 'unknown'})`);
      }
    } else {
      console.log('Please specify a keyword with --keyword "your keyword" or use --all to improve all content.');
      console.log('Additional options:');
      console.log('  --min-score=N    Only improve content with SEO score below N (default: 85)');
      process.exit(1);
    }
    
    console.log('\nContent improvement process completed successfully!');
  } catch (error) {
    console.error('Error improving content:', error);
    process.exit(1);
  }
}

main(); 