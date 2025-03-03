# Image Generation Service

## Overview

The Image Generation Service is a standalone API that generates high-quality images for your content. This service is now hosted externally and can be accessed via HTTP requests, removing the need for local setup and configuration.

## Service URL

The Image Generation Service is available at:

```
https://image-generation-service-856401495068.us-central1.run.app
```

## API Endpoints

### Generate Image

**Endpoint:** `/api/generate`

**Method:** POST

**Request Body:**

```json
{
  "prompt": "Your detailed image prompt here",
  "keyword": "The keyword the image is related to"
}
```

**Response:**

```json
{
  "success": true,
  "imageUrl": "https://path-to-generated-image.jpg",
  "processingTime": "2.5 seconds"
}
```

## Integration Examples

### Using with Node.js

```javascript
const axios = require('axios');

async function generateImage(keyword, customPrompt = null) {
  try {
    // Create a default prompt if none is provided
    const prompt = customPrompt || `Create a professional, high-quality image representing "${keyword}".
The image should be suitable for a blog or website header, with crisp details
and vibrant colors. Include relevant visual elements that communicate the
concept clearly. The style should be modern and visually appealing.`;

    console.log(`[INFO] Generated prompt for image: "${prompt}"`);
    
    const serviceUrl = 'https://image-generation-service-856401495068.us-central1.run.app/api/generate';
    console.log(`[INFO] Calling image generation service at ${serviceUrl}`);
    
    const startTime = Date.now();
    const response = await axios.post(serviceUrl, {
      prompt,
      keyword
    });
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (response.data && response.data.imageUrl) {
      console.log(`[SUCCESS] Image generation completed in ${processingTime} seconds`);
      console.log(`Image URL: ${response.data.imageUrl}`);
      return response.data;
    } else {
      throw new Error('No image URL in response');
    }
  } catch (error) {
    console.error(`[ERROR] Failed to generate image: ${error.message}`);
    throw error;
  }
}
```

### Using with cURL

```bash
curl -X POST \
  https://image-generation-service-856401495068.us-central1.run.app/api/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Create a professional, high-quality image representing \"digital marketing strategies\".",
    "keyword": "digital marketing strategies"
  }'
```

## Best Practices

1. **Be Specific**: The more detailed your prompt, the better the generated image will match your expectations.

2. **Include Style Guidelines**: Specify the style (modern, vintage, minimalist, etc.) for more consistent results.

3. **Describe Visual Elements**: Mention specific visual elements you want to appear in the image.

4. **Specify Purpose**: Indicate the intended use (blog header, featured image, etc.) to get appropriately formatted images.

5. **Cache Results**: To optimize performance and reduce API calls, consider caching generated images by keyword.

## Error Handling

The service may return errors in the following format:

```json
{
  "success": false,
  "error": "Error message details"
}
```

Common error scenarios include:
- Invalid request format
- Service overload
- Generation timeout

Implement appropriate error handling in your integration to manage these scenarios.

## Support

For issues or questions regarding the Image Generation Service, please contact the service administrator.

---

**Note:** This service replaces the previous local image generation module. All code that previously used the local module should now be updated to call this remote API endpoint instead. 