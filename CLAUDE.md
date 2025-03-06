# WP2HUGO - Project Development Guide

## Build Commands
- `npm start` - Start the main server
- `npm run dev` - Start the server in development mode
- `npm run image-service` - Start the image generation service
- `npm run start:all` - Start both main server and image service concurrently
- `npm test` - Run basic tests
- `npm run test:full` - Run comprehensive process test
- `npm run markdown` - Generate markdown from keywords
- `npm run export:hugo` - Export content to Hugo format

## Code Style Guidelines
- **Formatting**: Use 2-space indentation and semicolons
- **Imports**: Group imports by external modules, then local services/utilities
- **Error Handling**: 
  - Always use try/catch blocks for async operations
  - Log errors with appropriate service tags: `console.error('[SERVICE_NAME] Error message:', error)`
  - Return structured error responses with details when available
- **Naming Conventions**:
  - Services: camelCase with Service suffix (e.g., `hugoService`)
  - Files: kebab-case for utilities and services (e.g., `content-analyzer.service.js`)
  - Variables: camelCase
- **Module Exports**: Use `module.exports` pattern for service classes/objects
- **Architecture**: Follow service-oriented architecture with clear separation of concerns

## Storage and Configuration
- Use `contentStorage` for file operations, not native fs
- Configuration should be imported from config module, not hard-coded
- API credentials should be obtained through secrets.js, not directly from env vars