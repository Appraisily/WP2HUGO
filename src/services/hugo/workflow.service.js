const path = require('path');
const fs = require('fs-extra');
const { nanoid } = require('nanoid');
const moment = require('moment');
const contentStorage = require('../../utils/storage');
const config = require('../../config');
const slugify = require('../../utils/slugify');

class WorkflowService {
  constructor() {
    this.initialized = false;
    this.workflowsPath = config.paths.workflows || path.join(process.cwd(), 'workflows');
  }

  async initialize() {
    try {
      // Ensure workflows directory exists
      await fs.ensureDir(this.workflowsPath);
      this.initialized = true;
      console.log(`[WORKFLOW] Service initialized with workflows path: ${this.workflowsPath}`);
      return true;
    } catch (error) {
      console.error('[WORKFLOW] Failed to initialize workflow service:', error);
      throw error;
    }
  }

  async createWorkflow(data) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const { keyword, title, siteUrl, slug } = data;
      
      if (!keyword || !title) {
        throw new Error('Keyword and title are required to create a workflow');
      }
      
      // Generate a workflow ID and formatted data
      const workflowId = nanoid(10);
      const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
      const normalizedSlug = slug || slugify(title);
      
      const workflow = {
        id: workflowId,
        keyword,
        title,
        siteUrl: siteUrl || '',
        slug: normalizedSlug,
        status: 'pending',
        created: timestamp,
        updated: timestamp,
        steps: {
          research: { status: 'pending', startedAt: null, completedAt: null },
          outline: { status: 'pending', startedAt: null, completedAt: null },
          draft: { status: 'pending', startedAt: null, completedAt: null },
          review: { status: 'pending', startedAt: null, completedAt: null },
          publish: { status: 'pending', startedAt: null, completedAt: null }
        }
      };
      
      // Save workflow to local file system and GCS
      const localFilePath = path.join(this.workflowsPath, `${workflowId}.json`);
      await fs.writeJson(localFilePath, workflow, { spaces: 2 });
      
      // Store in GCS
      await contentStorage.storeContent(
        `workflows/${workflowId}.json`,
        workflow,
        {
          contentType: 'application/json',
          metadata: {
            keyword,
            title,
            slug: normalizedSlug
          }
        }
      );
      
      console.log(`[WORKFLOW] Created new workflow: ${workflowId} for keyword "${keyword}"`);
      
      return workflow;
    } catch (error) {
      console.error('[WORKFLOW] Error creating workflow:', error);
      throw error;
    }
  }

  async getWorkflow(workflowId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`[WORKFLOW] Retrieving workflow: ${workflowId}`);
      
      // First try to get it from GCS
      try {
        const gcsResult = await contentStorage.getContent(`workflows/${workflowId}.json`);
        if (gcsResult && gcsResult.data) {
          console.log(`[WORKFLOW] Retrieved workflow ${workflowId} from GCS`);
          return gcsResult.data;
        }
      } catch (gcsError) {
        console.log(`[WORKFLOW] Workflow ${workflowId} not found in GCS, trying local file system`);
      }
      
      // Fallback to local file system
      const localFilePath = path.join(this.workflowsPath, `${workflowId}.json`);
      if (await fs.pathExists(localFilePath)) {
        const workflow = await fs.readJson(localFilePath);
        return workflow;
      }
      
      throw new Error(`Workflow ${workflowId} not found`);
    } catch (error) {
      console.error(`[WORKFLOW] Error retrieving workflow ${workflowId}:`, error);
      throw error;
    }
  }

  async updateWorkflow(workflowId, updates) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get current workflow
      const workflow = await this.getWorkflow(workflowId);
      
      // Apply updates
      const updatedWorkflow = {
        ...workflow,
        ...updates,
        updated: moment().format('YYYY-MM-DD HH:mm:ss')
      };
      
      // Save workflow to local file system
      const localFilePath = path.join(this.workflowsPath, `${workflowId}.json`);
      await fs.writeJson(localFilePath, updatedWorkflow, { spaces: 2 });
      
      // Store in GCS
      await contentStorage.storeContent(
        `workflows/${workflowId}.json`,
        updatedWorkflow,
        {
          contentType: 'application/json',
          metadata: {
            keyword: updatedWorkflow.keyword,
            title: updatedWorkflow.title,
            slug: updatedWorkflow.slug
          }
        }
      );
      
      console.log(`[WORKFLOW] Updated workflow: ${workflowId}`);
      
      return updatedWorkflow;
    } catch (error) {
      console.error(`[WORKFLOW] Error updating workflow ${workflowId}:`, error);
      throw error;
    }
  }

  async updateWorkflowStep(workflowId, step, status, data = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Get current workflow
      const workflow = await this.getWorkflow(workflowId);
      
      // Ensure step exists
      if (!workflow.steps[step]) {
        throw new Error(`Step "${step}" does not exist in workflow ${workflowId}`);
      }
      
      // Update step status
      const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
      
      workflow.steps[step].status = status;
      
      if (status === 'in_progress' && !workflow.steps[step].startedAt) {
        workflow.steps[step].startedAt = timestamp;
      }
      
      if (status === 'completed' && !workflow.steps[step].completedAt) {
        workflow.steps[step].completedAt = timestamp;
      }
      
      // Add any additional data
      if (data) {
        workflow.steps[step].data = data;
      }
      
      // Update overall workflow status based on steps
      this.updateOverallStatus(workflow);
      
      // Save workflow
      const localFilePath = path.join(this.workflowsPath, `${workflowId}.json`);
      await fs.writeJson(localFilePath, workflow, { spaces: 2 });
      
      // Store in GCS
      await contentStorage.storeContent(
        `workflows/${workflowId}.json`,
        workflow,
        {
          contentType: 'application/json',
          metadata: {
            keyword: workflow.keyword,
            title: workflow.title,
            slug: workflow.slug
          }
        }
      );
      
      console.log(`[WORKFLOW] Updated step "${step}" to "${status}" for workflow: ${workflowId}`);
      
      return workflow;
    } catch (error) {
      console.error(`[WORKFLOW] Error updating step "${step}" for workflow ${workflowId}:`, error);
      throw error;
    }
  }

  updateOverallStatus(workflow) {
    // Calculate overall status based on step statuses
    const steps = Object.values(workflow.steps);
    
    // If any step is in_progress, workflow is in_progress
    if (steps.some(step => step.status === 'in_progress')) {
      workflow.status = 'in_progress';
      return;
    }
    
    // If all steps are completed, workflow is completed
    if (steps.every(step => step.status === 'completed')) {
      workflow.status = 'completed';
      return;
    }
    
    // If all steps are failed, workflow is failed
    if (steps.every(step => step.status === 'failed')) {
      workflow.status = 'failed';
      return;
    }
    
    // If mix of completed and pending, still in_progress
    if (steps.some(step => step.status === 'completed') && 
        steps.some(step => step.status === 'pending')) {
      workflow.status = 'in_progress';
      return;
    }
    
    // Default - no change to status
  }

  async getWorkflows() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log('[WORKFLOW] Retrieving all workflows');
      
      // First try to get list from GCS
      const workflowFiles = [];
      
      try {
        const gcsResult = await contentStorage.listContent('workflows/');
        if (gcsResult && gcsResult.length > 0) {
          console.log(`[WORKFLOW] Found ${gcsResult.length} workflows in GCS`);
          
          for (const file of gcsResult) {
            if (file.name.endsWith('.json')) {
              try {
                const content = await contentStorage.getContent(file.name);
                if (content && content.data) {
                  workflowFiles.push(content.data);
                }
              } catch (err) {
                console.error(`[WORKFLOW] Error retrieving workflow ${file.name} from GCS:`, err);
              }
            }
          }
        }
      } catch (gcsError) {
        console.log('[WORKFLOW] Unable to list workflows from GCS, falling back to local file system');
      }
      
      // If no workflows from GCS, try local file system
      if (workflowFiles.length === 0) {
        const files = await fs.readdir(this.workflowsPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(this.workflowsPath, file);
            try {
              const workflow = await fs.readJson(filePath);
              workflowFiles.push(workflow);
            } catch (readError) {
              console.error(`[WORKFLOW] Error reading workflow file ${filePath}:`, readError);
            }
          }
        }
      }
      
      // Sort by updated timestamp (newest first)
      workflowFiles.sort((a, b) => {
        const dateA = moment(a.updated, 'YYYY-MM-DD HH:mm:ss');
        const dateB = moment(b.updated, 'YYYY-MM-DD HH:mm:ss');
        return dateB.diff(dateA);
      });
      
      return workflowFiles;
    } catch (error) {
      console.error('[WORKFLOW] Error retrieving workflows:', error);
      throw error;
    }
  }

  async deleteWorkflow(workflowId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`[WORKFLOW] Deleting workflow: ${workflowId}`);
      
      // Delete from GCS
      try {
        await contentStorage.deleteContent(`workflows/${workflowId}.json`);
        console.log(`[WORKFLOW] Deleted workflow ${workflowId} from GCS`);
      } catch (gcsError) {
        console.error(`[WORKFLOW] Error deleting workflow ${workflowId} from GCS:`, gcsError);
      }
      
      // Delete from local file system
      const localFilePath = path.join(this.workflowsPath, `${workflowId}.json`);
      if (await fs.pathExists(localFilePath)) {
        await fs.remove(localFilePath);
        console.log(`[WORKFLOW] Deleted workflow ${workflowId} from local file system`);
      }
      
      return { success: true, message: `Workflow ${workflowId} deleted successfully` };
    } catch (error) {
      console.error(`[WORKFLOW] Error deleting workflow ${workflowId}:`, error);
      throw error;
    }
  }
}

module.exports = new WorkflowService();