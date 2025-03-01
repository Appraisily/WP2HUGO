# Image Generation Service Setup Guide

This guide will help you set up and use the image generation service integrated with the WP2HUGO project.

## Overview

The image generation service creates high-quality featured images for your blog posts based on the keyword and content structure. It uses AI to generate relevant images that enhance your SEO content.

## Prerequisites

- Node.js 18+ installed
- Git with submodule support
- API keys (optional but recommended):
  - ImageKit account and API keys (for image hosting)
  - OpenAI API key (for enhanced prompt generation)

## Installation

1. **Clone the repository with submodules**

   If you're starting fresh:
   ```
   git clone https://github.com/yourusername/WP2HUGO.git
   cd WP2HUGO
   git submodule update --init --recursive
   ```

   If you already have the repository:
   ```
   git submodule add https://github.com/Appraisily/image-generation-service
   git submodule update --init --recursive
   ```

2. **Install dependencies**

   ```
   npm install
   cd image-generation-service
   npm install
   cd ..
   ```

3. **Configure environment variables**

   Add the following to your `.env` file:
   ```
   # ImageKit Configuration (optional)
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_API_KEY=your_imagekit_private_key
   
   # OpenAI Configuration (optional)
   OPEN_AI_API_SEO=your_openai_api_key
   
   # Image Generation Service Configuration
   IMAGE_GEN_PORT=3001
   ```

## Usage

### Starting the Image Generation Service

Start the image generation service in a separate terminal:

```
npm run image-service
```

This will start the service on port 3001 (or the port specified in your `.env` file).

### Running with the Main Process

You can start both the image service and the main process with a single command:

```
npm run start:all
```

### Testing the Image Generation

To test just the image generation functionality:

```
npm run test:image
```

This will generate a test image and save the result to `output/test-image-result.json`.

## How It Works

1. The workflow service processes a keyword and generates a content structure
2. The image generation service creates a prompt based on the keyword and content
3. The service generates an image using AI (or falls back to placeholder images)
4. The image URL is included in the final content structure

## Troubleshooting

### Image Service Not Starting

- Check that you've initialized the submodule correctly
- Ensure all dependencies are installed
- Verify the port (3001 by default) is not in use

### No Images Being Generated

- In development/test mode, placeholder images are used by default
- For production, ensure your API keys are correctly set in the `.env` file
- Check the logs for any error messages

### API Key Issues

- ImageKit and OpenAI keys are optional but recommended for production use
- Without these keys, the service will fall back to using placeholder images

## Advanced Configuration

### Using a Different Port

Change the `IMAGE_GEN_PORT` in your `.env` file:

```
IMAGE_GEN_PORT=3002
```

### Customizing Image Generation

You can modify the prompt generation in `src/services/image-generation.service.js` to customize how image prompts are created.

## Integration with Hugo

When generating Hugo content, include the image URL in your templates:

```html
{{ if .Params.image }}
<img src="{{ .Params.image }}" alt="{{ .Title }}" class="featured-image">
{{ end }}
``` 