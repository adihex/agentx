/**
 * Cloud Run Job Execution Tool
 *
 * This tool triggers the guitar-processor job on GCP.
 * It's designed to be stringified and injected into an AgenticThreadPool worker.
 */
export const triggerCloudRun = `async (args) => {
  const { execSync } = require('child_process');
  const { fileName, project, region, jobName } = args;
  
  if (!fileName) {
    return { success: false, error: 'Missing fileName' };
  }
  
  const gcpProject = project || 'guitar-extractor';
  const gcpRegion = region || 'us-central1';
  const gcpJob = jobName || 'guitar-processor';
  
  try {
    console.log("[Tool:triggerCloudRun] Triggering job " + gcpJob + " for " + fileName + "...");
    
    // Execute the job with the specified input file name
    // We override the INPUT_FILE_NAME env var for this execution
    const cmd = "gcloud run jobs execute " + gcpJob + " " +
      "--region " + gcpRegion + " " +
      "--project " + gcpProject + " " +
      "--update-env-vars INPUT_FILE_NAME=" + fileName + " " +
      "--wait";
    
    const output = execSync(cmd).toString();
    console.log('[Tool:triggerCloudRun] Output:', output);
    
    return {
      success: true,
      message: 'Job completed successfully',
      fileName
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}`;
