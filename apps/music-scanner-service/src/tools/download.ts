/**
 * Music Download and GCS Upload Tool
 *
 * This tool downloads a YouTube video as MP3 and uploads it to GCS.
 * It's designed to be stringified and injected into an AgenticThreadPool worker.
 */
export const downloadAndUpload = `async (args) => {
  const { execSync } = require('child_process');
  const { id, bucket } = args;
  
  if (!id || !bucket) {
    return { success: false, error: 'Missing video ID or bucket name' };
  }
  
  try {
    console.log("[Tool:downloadAndUpload] Downloading " + id + " to gs://" + bucket + "...");
    
    // 1. Download as mp3 using yt-dlp
    // We use /tmp inside the worker isolate for temporary storage
    const localPath = "/tmp/" + id + ".mp3";
    const downloadCmd = "yt-dlp -x --audio-format mp3 -o "" + localPath + "" "https://www.youtube.com/watch?v=" + id + """;
    execSync(downloadCmd);
    
    // 2. Upload to GCS using gcloud storage cp
    const gcsPath = "gs://" + bucket + "/" + id + ".mp3";
    const uploadCmd = "gcloud storage cp "" + localPath + "" "" + gcsPath + """;
    execSync(uploadCmd);
    
    // 3. Cleanup
    execSync("rm "" + localPath + """);
    
    return {
      success: true,
      gcsPath,
      fileName: id + ".mp3"
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}`;
