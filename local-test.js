/**
 * Local test script that bypasses Google Cloud Storage
 */

// Load environment variables
require('dotenv').config();

// Import fs-extra for file operations
const fs = require('fs-extra');
const path = require('path');

// The keyword to test with
const testKeyword = 'art appraisal of antique lamps';
const slug = testKeyword.toLowerCase().replace(/\s+/g, '-');
const outputDir = path.join(process.cwd(), 'output');

// Mock content structure
const mockStructure = {
  title: `Complete Guide to Art Appraisal of Antique Lamps`,
  slug: slug,
  keyword: testKeyword,
  meta: {
    description: "Learn how to get accurate art appraisals for antique lamps, including valuation methods, finding qualified appraisers, and understanding what affects lamp values.",
    keywords: [testKeyword, "antique lamp valuation", "vintage lamp appraisal", "art lamp pricing"]
  },
  sections: [
    {
      heading: "Introduction to Art Appraisal of Antique Lamps",
      content: "Antique lamps represent a fascinating intersection of decorative art, lighting technology, and historical craftsmanship. Whether you've inherited a family heirloom or discovered a potential treasure at an estate sale, understanding the value of these artistic illuminators requires specialized knowledge. This comprehensive guide explores the art appraisal process for antique lamps, offering insights into valuation criteria, authentication methods, and how to obtain reliable professional assessments."
    },
    {
      heading: "Why Antique Lamp Appraisals Matter",
      content: "Professional art appraisals for antique lamps serve multiple purposes beyond simple curiosity about monetary value. Insurance companies require documented appraisals to properly cover valuable pieces. Collectors need accurate valuations for estate planning and tax purposes. Sellers benefit from understanding fair market value before listing items for sale. Additionally, proper appraisals can reveal historical significance that extends beyond monetary considerations, potentially identifying pieces worthy of museum consideration or special conservation efforts."
    },
    {
      heading: "Types of Antique Lamps and Their Value Characteristics",
      subheadings: [
        {
          heading: "Art Nouveau and Tiffany-Style Lamps",
          content: "Art Nouveau lamps, particularly those created by Tiffany Studios between 1890-1930, represent some of the most valuable antique lighting fixtures. Authentic Tiffany lamps featuring hand-cut leaded glass shades in floral or geometric patterns can command prices from $10,000 to over $1 million depending on design, condition, and provenance. Look for the Tiffany Studios New York signature on the bronze base, though be aware that many reproductions exist."
        },
        {
          heading: "Art Deco Period Lamps",
          content: "Art Deco lamps from the 1920s-1940s feature streamlined forms, geometric patterns, and materials like chrome, bakelite, and frosted glass. Notable makers include Edgar Brandt, Demetre Chiparus, and Frankart. Depending on the designer, materials, and condition, these pieces can range from several hundred to tens of thousands of dollars."
        },
        {
          heading: "Victorian Era Oil and Early Electric Lamps",
          content: "Victorian lamps (circa 1850-1910) include ornate oil lamps later converted to electricity, featuring materials like brass, bronze, painted glass, and porcelain. These pieces typically value between $200-$5,000 depending on craftsmanship, material quality, and maker. Converted lamps generally have lower values than those maintaining their original mechanisms."
        }
      ]
    },
    {
      heading: "Key Factors in Antique Lamp Valuation",
      subheadings: [
        {
          heading: "Designer and Manufacturer",
          content: "Lamps created by renowned designers or prestigious manufacturers typically command premium prices. Research signatures, maker's marks, and production techniques specific to different manufacturers to help authenticate your piece."
        },
        {
          heading: "Age and Historical Significance",
          content: "Generally, older lamps with historical importance have higher value, particularly if they represent significant developments in lighting technology or design movements. Documentation of provenance can substantially increase value."
        },
        {
          heading: "Condition and Originality",
          content: "Mint condition lamps with all original components (uncracked shades, original wiring, unchanged finishes) command the highest prices. Restoration work, while sometimes necessary, can diminish value if not performed by skilled professionals using period-appropriate techniques and materials."
        },
        {
          heading: "Materials and Craftsmanship",
          content: "Higher-quality materials (bronze versus pot metal, hand-painted versus transfer decoration, leaded glass versus molded) and superior craftsmanship significantly impact value. The complexity of design and technical difficulty in production are key valuation factors."
        },
        {
          heading: "Rarity and Demand",
          content: "Limited production runs, unusual designs, or pieces representing transitional periods in a designer's work often have higher values. Market trends can significantly impact prices, with certain styles fluctuating in popularity among collectors."
        }
      ]
    },
    {
      heading: "The Appraisal Process for Antique Lamps",
      subheadings: [
        {
          heading: "Finding a Qualified Appraiser",
          content: "Seek appraisers certified by respected organizations like the International Society of Appraisers (ISA) or the American Society of Appraisers (ASA) with specific expertise in decorative arts or antique lighting. Auction houses like Sotheby's, Christie's, and Bonham's often offer appraisal services, as do specialized antique lighting dealers."
        },
        {
          heading: "Types of Appraisals",
          content: "Different appraisal types serve different purposes: Insurance appraisals determine replacement value (typically highest), fair market value appraisals for sales or tax purposes, and liquidation value for quick sales (typically lowest). Be clear about your needs when commissioning an appraisal."
        },
        {
          heading: "What to Expect During an Appraisal",
          content: "Professional appraisers will examine your lamp in person, documenting dimensions, materials, condition, maker's marks, and unique features. They'll research comparable sales, consult reference materials, and possibly use specialized equipment to authenticate materials. The process culminates in a written report detailing their findings and valuation."
        },
        {
          heading: "Appraisal Costs",
          content: "Professional appraisals typically cost between $200-$400 per hour depending on the appraiser's expertise and location. Most antique lamp appraisals require 1-3 hours of work. Avoid appraisers who base their fee on a percentage of the item's value, as this represents a conflict of interest."
        }
      ]
    },
    {
      heading: "Common Challenges in Antique Lamp Appraisal",
      content: "Antique lamp appraisal presents unique challenges: distinguishing quality reproductions from originals, assessing converted lamps (oil to electric), valuing partially original pieces, and determining appropriate restoration approaches. Photography limits online appraisals, as subtle details in glass colors, metalwork quality, and patina require in-person examination."
    },
    {
      heading: "Preparation Tips for Getting Your Antique Lamp Appraised",
      content: "Before seeking an appraisal, gather any documentation of provenance (original receipts, family records, previous appraisals). Photograph your lamp from multiple angles, including any signatures or maker's marks. Avoid cleaning or polishing the lamp, as patina can be valuable and improper cleaning may cause damage. If possible, research your lamp's style and period to ask informed questions during the appraisal."
    },
    {
      heading: "Frequently Asked Questions About Art Appraisal of Antique Lamps",
      faqs: [
        {
          question: "How can I tell if my Tiffany lamp is authentic?",
          answer: "Authentic Tiffany lamps typically feature bronze bases with a patina that can't be perfectly replicated, signed 'Tiffany Studios New York' with a model number. The leaded glass shades use high-quality, varied glass with distinctive color variations, and show hand-craftsmanship in their assembly. The solder lines should be neat but show slight irregularities consistent with handwork. Professional authentication is recommended, as high-quality reproductions can be deceptive."
        },
        {
          question: "Does rewiring an antique lamp decrease its value?",
          answer: "Proper, safety-necessary rewiring generally doesn't significantly decrease an antique lamp's value if performed by a qualified professional using period-appropriate methods that preserve original components. However, poor quality modifications or those that damage original parts can substantially reduce value. For museum-quality pieces, collectors may prefer original wiring (though it shouldn't be used) with professional rewiring done separately."
        },
        {
          question: "Should I clean my antique lamp before appraisal?",
          answer: "No, avoid cleaning antique lamps before appraisal. The natural patina on metal components can be valuable, and improper cleaning might damage finishes or remove original surface treatments. Appraisers prefer examining items in their found condition to better assess age and authenticity. If cleaning is advisable, the appraiser can recommend appropriate methods and products."
        },
        {
          question: "Can I get a reliable appraisal from an antique shop?",
          answer: "Antique dealers may provide ballpark estimates but typically aren't certified appraisers. While knowledgeable dealers can offer valuable insights, they face a conflict of interest if they might later purchase the item. For legal, insurance, or estate purposes, seek independent certified appraisers with decorative arts specialization who provide written, research-backed valuations."
        }
      ]
    },
    {
      heading: "Conclusion: Making Informed Decisions About Your Antique Lamp",
      content: "Professional art appraisal of antique lamps provides essential information whether you're insuring, selling, donating, or simply appreciating a piece. Understanding both the monetary and historical value of your lamp enables informed decisions about preservation, restoration, display, and potential sale. While online research provides valuable context, nothing replaces the expertise of a qualified appraiser who can recognize subtle details that influence authenticity and value. By understanding the appraisal process and preparing appropriately, you ensure the most accurate assessment of your antique lighting treasure."
    }
  ]
};

// Mock markdown content based on the structure
const generateMarkdown = (structure) => {
  let markdown = `---
title: "${structure.title}"
date: "${new Date().toISOString()}"
draft: false
slug: "${structure.slug}"
description: "${structure.meta.description}"
keywords: [${structure.meta.keywords.map(k => `"${k}"`).join(', ')}]
---

# ${structure.title}

`;

  // Add sections
  structure.sections.forEach(section => {
    markdown += `## ${section.heading}\n\n`;
    
    if (section.content) {
      markdown += `${section.content}\n\n`;
    }
    
    // Add subheadings if they exist
    if (section.subheadings) {
      section.subheadings.forEach(sub => {
        markdown += `### ${sub.heading}\n\n${sub.content}\n\n`;
      });
    }
    
    // Add FAQs if they exist
    if (section.faqs) {
      section.faqs.forEach(faq => {
        markdown += `**${faq.question}**\n\n${faq.answer}\n\n`;
      });
    }
  });
  
  return markdown;
};

/**
 * Main test function
 */
async function runTest() {
  console.log(`Starting local test for keyword: "${testKeyword}"`);
  
  try {
    // Ensure output directory exists
    await fs.ensureDir(outputDir);
    console.log(`Output directory created at: ${outputDir}`);
    
    // Create directory for this keyword
    const keywordDir = path.join(outputDir, slug);
    await fs.ensureDir(keywordDir);
    console.log(`Created directory for keyword at: ${keywordDir}`);
    
    // Save structure JSON
    const structurePath = path.join(keywordDir, 'structure.json');
    await fs.writeJson(structurePath, mockStructure, { spaces: 2 });
    console.log(`Saved structure JSON to: ${structurePath}`);
    
    // Generate and save markdown
    const markdown = generateMarkdown(mockStructure);
    const markdownPath = path.join(keywordDir, 'markdown-content.md');
    await fs.writeFile(markdownPath, markdown, 'utf8');
    console.log(`Saved markdown content to: ${markdownPath}`);
    
    // Show preview
    console.log('\nMarkdown content preview:');
    console.log(markdown.substring(0, 500) + '...');
    
    console.log(`\nAll files saved successfully to: ${keywordDir}`);
    console.log(`To view the full markdown content, check: ${markdownPath}`);
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
runTest();