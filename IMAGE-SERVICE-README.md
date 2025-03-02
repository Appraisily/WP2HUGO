# Image Generation Service

## Cloud Run Endpoint

The image generation service is hosted on Google Cloud Run at the following address:

```
https://image-generation-service-856401495068.us-central1.run.app
```

## API Endpoints

### Generate Image

**Endpoint:** `https://image-generation-service-856401495068.us-central1.run.app/api/generate`

**Method:** POST

**Request Format:**

```json
{
  "appraiser": {
    "id": "unique-id",
    "name": "keyword",
    "specialty": "description",
    "experience": "SEO content"
  },
  "customPrompt": "Detailed prompt for image generation"
}
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://example.com/generated-image.jpg",
    "cached": false,
    "prompt": "The prompt used for generation",
    "source": "image-generation-service"
  }
}
```

## Usage in WP2HUGO

The image generation service is integrated with the WP2HUGO workflow to automatically generate featured images for blog posts. The integration occurs in the following files:

1. `src/services/image-generation.service.js` - Main service that communicates with the Cloud Run endpoint
2. `src/services/markdown-generator.service.js` - Includes the generated image in the markdown output
3. `generate-markdown.js` - Orchestrates the image generation process

## Environment Configuration

Add the following to your `.env` file to configure the image generation service:

```
# Image Generation Service
IMAGE_GEN_SERVICE_URL=https://image-generation-service-856401495068.us-central1.run.app
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_API_KEY=your_imagekit_private_key
```

## Testing

To test the image generation functionality, run:

```
npm run test:image
```

This will generate a test image and save the result to `output/test-image-result.json`. 