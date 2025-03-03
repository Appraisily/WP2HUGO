const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

/**
 * Get a secret from Google Cloud Secret Manager or environment variable
 * 
 * @param {string} name - Secret name
 * @param {boolean} [fallbackToEnv=true] - Whether to fallback to environment variable if secret not found
 * @returns {Promise<string>} - Secret value
 */
async function getSecret(name) {
  // Try to get from environment first (in local development or direct env var setting)
  const envName = name.replace(/-/g, '_').toUpperCase();
  if (process.env[envName]) {
    console.log(`[SECRETS] Using ${envName} from environment variables`);
    return process.env[envName];
  }

  // If no environment variable, try Secret Manager
  try {
    const projectId = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) {
      throw new Error('PROJECT_ID or GOOGLE_CLOUD_PROJECT environment variable is not set');
    }

    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${name}/versions/latest`,
    });
    return version.payload.data.toString();
  } catch (error) {
    console.error(`[SECRETS] Error accessing secret ${name}: ${error.message}`);
    
    // If environment variable with same name exists, use that as fallback
    if (process.env[envName]) {
      console.warn(`[SECRETS] Falling back to ${envName} environment variable`);
      return process.env[envName];
    }
    
    // Otherwise, propagate the error
    throw error;
  }
}

module.exports = {
  getSecret
};