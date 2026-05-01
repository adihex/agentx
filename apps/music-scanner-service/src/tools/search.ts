/**
 * Music Search Tool
 *
 * This tool uses yt-dlp to find the best match for a song query.
 * It's designed to be stringified and injected into an AgenticThreadPool worker.
 */
export const searchMusic = `async (args) => {
  const { execSync } = require('child_process');
  const query = args.query;
  
  try {
    console.log('[Tool:searchMusic] Searching for:', query);
    // Search for the top 3 results and return their titles and IDs
    const cmd = "yt-dlp \\"ytsearch3:" + query + "\\" --get-title --get-id --get-duration --no-playlist";
    const output = execSync(cmd).toString().trim();
    
    const lines = output.split('\\n');
    const results = [];
    for (let i = 0; i < lines.length; i += 3) {
      if (lines[i] && lines[i+1]) {
        results.push({
          title: lines[i],
          id: lines[i+1],
          duration: lines[i+2]
        });
      }
    }
    
    return {
      success: true,
      results,
      bestMatch: results[0]
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}`;
