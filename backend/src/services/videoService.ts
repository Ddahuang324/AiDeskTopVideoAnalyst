import ffmpeg from 'fluent-ffmpeg';
import type { FfprobeData } from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

const fsPromises = fs.promises;

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const OUTPUT_DIR = path.join(__dirname, '../../temp'); // A temporary directory for stitched videos

/**
 * Validates that a video file can be read by ffmpeg
 * @param {string} filePath The path to the video file to validate
 * @returns {Promise<boolean>} True if the file is valid
 */
const validateVideoFile = async (filePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: FfprobeData) => {
      if (err) {
        console.error(`Invalid video file ${filePath}:`, err.message);
        resolve(false);
      } else if (!metadata.format || !metadata.format.duration) {
        console.error(`Video file ${filePath} has no duration information`);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

/**
 * Stitches all video files from the uploads directory into a single video file.
 * @returns {Promise<string>} A promise that resolves with the path to the stitched video file.
 */
export const stitchVideos = async (): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const allFiles = fs
      .readdirSync(UPLOADS_DIR)
      .filter(file => file.endsWith('.webm') || file.endsWith('.mp4'))
      .map(file => {
        const fullPath = path.join(UPLOADS_DIR, file);
        const stats = fs.statSync(fullPath);
        return { file, fullPath, createdAt: stats.birthtimeMs || stats.mtimeMs, size: stats.size };
      })
      .sort((a, b) => a.createdAt - b.createdAt);

    if (allFiles.length === 0) {
      return reject(new Error('No video chunks found to stitch.'));
    }

    console.log(`Found ${allFiles.length} video chunks to process`);

    // Validate all files first and filter out invalid ones
    const validationResults = await Promise.all(
      allFiles.map(async (fileInfo) => ({
        ...fileInfo,
        isValid: await validateVideoFile(fileInfo.fullPath)
      }))
    );

    const validFiles = validationResults.filter(f => f.isValid && f.size > 0);

    if (validFiles.length === 0) {
      return reject(new Error('No valid video chunks found. All files are corrupted or empty.'));
    }

    console.log(`${validFiles.length} valid chunks found out of ${allFiles.length}`);

    // Ensure temp output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const outputPath = path.join(OUTPUT_DIR, `stitched-${Date.now()}.mp4`);

    // If only one valid file, just copy it with re-encoding to ensure compatibility
    if (validFiles.length === 1) {
      ffmpeg(validFiles[0].fullPath)
        .outputOptions([
          '-c:v libx264',       // Use H.264 codec
          '-preset fast',       // Encoding speed
          '-crf 23',           // Quality (lower is better, 23 is default)
          '-c:a aac',          // Audio codec
          '-b:a 128k',         // Audio bitrate
        ])
        .on('error', (err: Error) => {
          console.error('Error processing single video:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Finished processing single video.');
          resolve(outputPath);
        })
        .save(outputPath);
    } else {
      // Multiple files - concatenate them
      const command = ffmpeg();

      // Add each file as an input
      validFiles.forEach(fileInfo => {
        command.input(fileInfo.fullPath);
      });

      command
        .outputOptions([
          '-c:v libx264',       // Use H.264 codec for compatibility
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
        ])
        .on('error', (err: Error) => {
          console.error('Error stitching videos:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Finished stitching videos.');
          resolve(outputPath);
        })
        .mergeToFile(outputPath, OUTPUT_DIR);
    }
  });
};

/**
 * Retrieves the duration of a video file in seconds using ffprobe metadata.
 * @param {string} filePath The path to the video file.
 * @returns {Promise<number>} The duration in seconds.
 */
export const getVideoDuration = async (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: FfprobeData) => {
      if (err) {
        console.error('Error retrieving video duration:', err);
        return reject(err);
      }

      const duration = metadata.format?.duration;
      if (typeof duration !== 'number') {
        return reject(new Error('Unable to determine video duration.'));
      }

      resolve(duration);
    });
  });
};

const removeDirectoryContents = async (directory: string) => {
  try {
    await fsPromises.access(directory);
  } catch {
    return; // Directory does not exist; nothing to clean.
  }

  const entries = await fsPromises.readdir(directory);
  await Promise.all(
    entries.map(async entry => {
      const entryPath = path.join(directory, entry);
      await fsPromises.rm(entryPath, { recursive: true, force: true });
    }),
  );
};

/**
 * Cleans up transient files created during the analysis process.
 * Removes uploaded chunks and any stitched artifacts.
 * @returns {Promise<void>}
 */
export const cleanupAnalysisArtifacts = async (): Promise<void> => {
  try {
    await removeDirectoryContents(UPLOADS_DIR);
    await removeDirectoryContents(OUTPUT_DIR);
  } catch (error) {
    console.error('Error while cleaning analysis artifacts:', error);
    throw error;
  }
};
