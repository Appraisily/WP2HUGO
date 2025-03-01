/**
 * Mock data utility for testing without external API dependencies
 */

const keywordResearchMock = {
  "keyword": "what is value art",
  "volume": 720,
  "difficulty": 45,
  "cpc": 1.25,
  "competition": 0.3,
  "intent": "informational",
  "trend": [50, 60, 70, 80, 90, 100, 95, 85, 75, 65, 55, 45]
};

const serpDataMock = {
  "keyword": "what is value art",
  "organic_results": [
    {
      "position": 1,
      "title": "What is the value of art? | The Art Story",
      "url": "https://www.theartstory.org/definition/value-in-art/",
      "description": "Value in art is essentially how light or dark a color is. Explore the meaning, definition and purpose of value in art through different examples."
    },
    {
      "position": 2,
      "title": "The Importance of Value in Art - Art is Fun",
      "url": "https://www.art-is-fun.com/value-in-art",
      "description": "Value in art is the relative lightness or darkness of a color. It is an essential element in drawing and painting, in color theory, and in design."
    },
    {
      "position": 3,
      "title": "Understanding Value in Art - The Spruce Crafts",
      "url": "https://www.thesprucecrafts.com/what-is-value-in-art-1123377",
      "description": "Value is one of the seven elements of art. Value deals with the lightness or darkness of a color."
    }
  ],
  "related_searches": [
    "what is value in art definition",
    "types of value in art",
    "value in art examples",
    "importance of value in art",
    "how to use value in art"
  ]
};

const relatedKeywordsMock = {
  "keyword": "what is value art",
  "related_keywords": [
    {
      "keyword": "value in art definition",
      "volume": 480,
      "difficulty": 30
    },
    {
      "keyword": "types of value in art",
      "volume": 390,
      "difficulty": 25
    },
    {
      "keyword": "value in art examples",
      "volume": 320,
      "difficulty": 20
    },
    {
      "keyword": "importance of value in art",
      "volume": 290,
      "difficulty": 35
    }
  ]
};

const perplexityMock = {
  "keyword": "what is value art",
  "timestamp": "2023-01-15T12:34:56.789Z",
  "response": {
    "id": "mock-response-id",
    "choices": [
      {
        "message": {
          "content": "# Comprehensive Information About \"Value in Art\"\n\n## What \"Value in Art\" Means and Its Significance\n\nValue in art refers to the relative lightness or darkness of a color or tone in a work of art. It is one of the fundamental elements of art, alongside line, shape, form, space, color, and texture. Value creates visual contrast and helps define form, create depth, establish mood, and direct the viewer's attention.\n\nThe significance of value in art cannot be overstated. It helps artists:\n- Create the illusion of three-dimensional form on a two-dimensional surface\n- Establish a focal point and visual hierarchy\n- Convey atmosphere, mood, and emotional tone\n- Define light sources and shadows\n- Create dramatic effects through high contrast (chiaroscuro)\n\n## Key Aspects of Value in Art\n\n1. **Value Scale**: A gradient showing the range from lightest (white) to darkest (black) with various shades of gray in between. Artists typically use a 9-step or 11-step value scale as a reference.\n\n2. **High-key and Low-key**: High-key compositions use predominantly light values, creating bright, airy feelings. Low-key compositions use mostly dark values, creating mysterious, dramatic, or somber moods.\n\n3. **Contrast**: The juxtaposition of light and dark values. High contrast creates drama and visual interest, while low contrast can create subtlety and unity.\n\n4. **Value Patterns**: The arrangement of lights and darks across a composition, which helps guide the viewer's eye.\n\n5. **Local Value**: The inherent value of an object's color independent of lighting conditions.\n\n6. **Value in Color**: Even colors have inherent value (e.g., yellow is naturally lighter than purple).\n\n## Common Questions About Value in Art\n\n1. **How is value different from color?** Value refers only to lightness or darkness, while color involves hue and saturation as well.\n\n2. **Why do artists sometimes create value studies or drawings before painting?** Value studies help artists plan the composition's visual structure without the distraction of color.\n\n3. **Can a successful artwork be created using only one value?** While possible, it's challenging, as value contrast is key to creating visual interest and form.\n\n4. **How do digital artists work with value?** Digital programs often include value tools like grayscale modes and brightness/contrast adjustments.\n\n5. **Does value work the same way in different mediums?** The principle is the same, but techniques for creating value vary across drawing, painting, photography, and other media.\n\n## Expert Insights on Value in Art\n\nMany master artists emphasize the importance of value:\n\n- Johannes Itten, Bauhaus instructor, taught that understanding value relationships was essential before working with color.\n\n- Richard Schmid, contemporary realist painter, advises students to \"get the values right, and the color will take care of itself.\"\n\n- James Gurney, illustrator and author, suggests squinting at a scene to better perceive value relationships by reducing color information.\n\n- Many artists recommend the \"notan\" approach from Japanese art, which focuses on the arrangement of light and dark patterns.\n\n## Current Trends in the Use of Value\n\n1. **Tonal Painting**: A resurgence in approaches that begin with value structure before adding color.\n\n2. **Atmospheric Perspective in Digital Landscapes**: Using subtle value changes to create depth in digital art.\n\n3. **Value-Focused Photography**: Black and white photography remains popular, with photographers deliberately manipulating value to create emotional impact.\n\n4. **Value in UI/UX Design**: Designers are paying more attention to value contrast for both aesthetic and accessibility reasons.\n\n## Statistics Related to Value in Art\n\n- Studies suggest that the human eye can distinguish between approximately 30 different values from white to black.\n\n- In painting analysis of old masters, researchers found that most successful compositions used no more than 7-9 distinct values.\n\n- Eye-tracking studies show that viewers' eyes are naturally drawn to areas of high value contrast in a composition.\n\n## Best Practices for Working with Value\n\n1. **Begin with value planning** before adding color to establish a strong compositional foundation.\n\n2. **Limit your value range** to create harmony (many masterpieces use only 5-7 distinct values).\n\n3. **Practice seeing in values** by squinting at subjects to reduce color information.\n\n4. **Use value to create focal points** by placing the highest contrast at the center of interest.\n\n5. **Study value in black and white photographs** or convert color images to grayscale to better understand value relationships.\n\n6. **Create thumbnail value sketches** before beginning larger works to plan the distribution of lights and darks.\n\n7. **Be intentional with value patterns** to lead the viewer's eye through the composition.\n\n8. **Practice regular value studies** to train your eye to perceive subtle value differences."
        }
      }
    ]
  }
};

const googleAiMock = {
  "keyword": "what is value art",
  "timestamp": "2023-01-15T13:45:12.789Z",
  "response": {
    "candidates": [
      {
        "content": {
          "parts": [
            {
              "text": "# Blog Post Structure: What is Value in Art?\n\n## SEO Title\nValue in Art: Definition, Examples, and Importance in Visual Creation\n\n## Meta Description\nDiscover what value in art means, how it creates depth and emotion, and why it's essential for artists. Learn about different types of value with practical examples.\n\n## Introduction\nValue in art is often overlooked by casual observers but remains one of the most fundamental elements that artists use to create powerful visual experiences. This article explores the concept of value—the relative lightness or darkness of colors and tones—and why understanding it transforms both the creation and appreciation of art.\n\nThe introduction should emphasize that while color often gets most attention, value does the heavy lifting in creating mood, dimension, and focus in artwork. Mention that this knowledge benefits both artists wanting to improve their work and art enthusiasts seeking deeper appreciation.\n\n## H2: What is Value in Art? Definition and Fundamentals\n- **H3: The Technical Definition**\n  - Clear explanation that value refers to the lightness or darkness of a color or tone\n  - Distinction between value and other elements of art\n  - Brief mention of the value scale from white to black\n\n- **H3: Why Value Matters More Than Color**\n  - Explanation of how value creates structure in compositions\n  - Note how the brain processes value differences before color\n  - Examples of how powerful black and white art can be\n\n## H2: Types of Value in Art\n- **H3: High-Key Values**\n  - Definition and emotional effects of predominantly light values\n  - Famous examples of high-key artworks\n  - When and why artists choose high-key palettes\n\n- **H3: Low-Key Values**\n  - Definition and emotional effects of predominantly dark values\n  - Examples of dramatic low-key paintings\n  - How low-key values create mood and atmosphere\n\n- **H3: Value Contrast**\n  - Explanation of high contrast vs. low contrast approaches\n  - How contrast directs the viewer's eye\n  - Cultural and historical uses of extreme contrast (like chiaroscuro)\n\n## H2: How Artists Use Value to Create Dimension\n- **H3: Creating the Illusion of Form**\n  - Explanation of how value changes make flat surfaces appear three-dimensional\n  - Step-by-step breakdown of how shadows and highlights work\n  - Tips for beginners practicing value rendering\n\n- **H3: Value and Atmospheric Perspective**\n  - How value changes create the illusion of distance\n  - Examples from landscape painting\n  - Scientific basis for why distant objects appear lighter/lower contrast\n\n## H2: Value in Different Art Mediums\n- **H3: Value in Drawing Media**\n  - Techniques for creating value with pencil, charcoal, and ink\n  - Tips for achieving smooth gradients\n  - Examples of master drawings with excellent value work\n\n- **H3: Value in Painting**\n  - How different painting mediums handle value (oil, acrylic, watercolor)\n  - Color and value relationships\n  - Techniques like glazing and scumbling that affect value\n\n- **H3: Value in Digital Art**\n  - Digital tools specifically for managing value\n  - Advantages digital artists have in controlling value\n  - Common pitfalls in digital value management\n\n## H2: Practical Exercises to Improve Your Understanding of Value\n- **H3: Value Scales and Studies**\n  - Step-by-step instructions for creating a value scale\n  - Simple exercises for training your eyes to see value\n  - How to do a value study before a finished piece\n\n- **H3: The Squint Test**\n  - Explanation of how squinting helps artists see value more clearly\n  - When and how to use this technique\n  - What to look for when squinting at artwork or subjects\n\n- **H3: Value Thumbnails**\n  - How to plan compositions using simple value shapes\n  - Examples of thumbnail value studies next to finished works\n  - Quick exercise readers can try immediately\n\n## H2: Famous Artists Who Mastered Value\n- **H3: Rembrandt and Chiaroscuro**\n  - Analysis of Rembrandt's approach to dramatic lighting\n  - Specific paintings that demonstrate his mastery\n  - Techniques he used that readers can learn from\n\n- **H3: Modern Masters of Value**\n  - Examples from contemporary artists with strong value skills\n  - Diverse approaches to using value across different styles\n  - What we can learn from each artist's approach\n\n## Conclusion\nSummarize the importance of value as perhaps the most critical element in creating successful artwork. Emphasize that improving one's understanding and control of value will immediately enhance artistic results more than almost any other skill. Encourage readers to see the world through \"value eyes\" by practicing the exercises provided, and remind them that masters throughout art history have considered value the foundation of visual art.\n\n**Call to Action**: Invite readers to try a simple value study of an object in their home using just a pencil, then share their results on social media with a specific hashtag. Alternatively, suggest they revisit a favorite artwork and analyze how the artist used value to create impact.\n\n## Formatting Elements to Enhance the Content\n\n**Table: Value Scale Reference**\nCreate a visual table showing the standard 9-step value scale from white to black, with names for each value level (e.g., high light, mid-tone, dark shadow) and potential uses in compositions.\n\n**Comparison Gallery**\nA side-by-side comparison of color artworks and their grayscale versions to demonstrate how value structure works independently of color.\n\n**Before/After Examples**\nExamples of artworks with poor value structure versus the same compositions with improved value relationships.\n\n**Interactive Element Suggestion**\nIf possible, include a slider that converts color images to grayscale so readers can instantly see the value structure of famous paintings."
            }
          ]
        }
      }
    ]
  }
};

module.exports = {
  keywordResearchMock,
  serpDataMock,
  relatedKeywordsMock,
  perplexityMock,
  googleAiMock
}; 