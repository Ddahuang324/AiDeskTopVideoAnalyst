"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupAnalysisArtifacts = exports.getVideoDuration = exports.stitchVideos = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fsPromises = fs_1.default.promises;
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads');
const OUTPUT_DIR = path_1.default.join(__dirname, '../../temp'); // A temporary directory for stitched videos
/**
 * Validates that a video file can be read by ffmpeg
 * @param {string} filePath The path to the video file to validate
 * @returns {Promise<boolean>} True if the file is valid
 */
const validateVideoFile = async (filePath) => {
    return new Promise((resolve) => {
        fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error(`Invalid video file ${filePath}:`, err.message);
                resolve(false);
            }
            else if (!metadata.format || !metadata.format.duration) {
                console.error(`Video file ${filePath} has no duration information`);
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
};
/**
 * Stitches all video files from the uploads directory into a single video file.
 * @returns {Promise<string>} A promise that resolves with the path to the stitched video file.
 */
const stitchVideos = async () => {
    return new Promise(async (resolve, reject) => {
        const allFiles = fs_1.default
            .readdirSync(UPLOADS_DIR)
            .filter(file => file.endsWith('.webm') || file.endsWith('.mp4'))
            .map(file => {
            const fullPath = path_1.default.join(UPLOADS_DIR, file);
            const stats = fs_1.default.statSync(fullPath);
            return { file, fullPath, createdAt: stats.birthtimeMs || stats.mtimeMs, size: stats.size };
        })
            .sort((a, b) => a.createdAt - b.createdAt);
        if (allFiles.length === 0) {
            return reject(new Error('No video chunks found to stitch.'));
        }
        console.log(`Found ${allFiles.length} video chunks to process`);
        // Validate all files first and filter out invalid ones
        const validationResults = await Promise.all(allFiles.map(async (fileInfo) => ({
            ...fileInfo,
            isValid: await validateVideoFile(fileInfo.fullPath)
        })));
        const validFiles = validationResults.filter(f => f.isValid && f.size > 0);
        if (validFiles.length === 0) {
            return reject(new Error('No valid video chunks found. All files are corrupted or empty.'));
        }
        console.log(`${validFiles.length} valid chunks found out of ${allFiles.length}`);
        // Ensure temp output directory exists
        if (!fs_1.default.existsSync(OUTPUT_DIR)) {
            fs_1.default.mkdirSync(OUTPUT_DIR, { recursive: true });
        }
        const outputPath = path_1.default.join(OUTPUT_DIR, `stitched-${Date.now()}.mp4`);
        // If only one valid file, just copy it with re-encoding to ensure compatibility
        if (validFiles.length === 1) {
            (0, fluent_ffmpeg_1.default)(validFiles[0].fullPath)
                .outputOptions([
                '-c:v libx264', // Use H.264 codec
                '-preset fast', // Encoding speed
                '-crf 23', // Quality (lower is better, 23 is default)
                '-c:a aac', // Audio codec
                '-b:a 128k', // Audio bitrate
            ])
                .on('error', (err) => {
                console.error('Error processing single video:', err);
                reject(err);
            })
                .on('end', () => {
                console.log('Finished processing single video.');
                resolve(outputPath);
            })
                .save(outputPath);
        }
        else {
            // Multiple files - concatenate them
            const command = (0, fluent_ffmpeg_1.default)();
            // Add each file as an input
            validFiles.forEach(fileInfo => {
                command.input(fileInfo.fullPath);
            });
            command
                .outputOptions([
                '-c:v libx264', // Use H.264 codec for compatibility
                '-preset fast',
                '-crf 23',
                '-c:a aac',
                '-b:a 128k',
            ])
                .on('error', (err) => {
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
exports.stitchVideos = stitchVideos;
/**
 * Retrieves the duration of a video file in seconds using ffprobe metadata.
 * @param {string} filePath The path to the video file.
 * @returns {Promise<number>} The duration in seconds.
 */
const getVideoDuration = async (filePath) => {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
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
exports.getVideoDuration = getVideoDuration;
const removeDirectoryContents = async (directory) => {
    try {
        await fsPromises.access(directory);
    }
    catch {
        return; // Directory does not exist; nothing to clean.
    }
    const entries = await fsPromises.readdir(directory);
    await Promise.all(entries.map(async (entry) => {
        const entryPath = path_1.default.join(directory, entry);
        await fsPromises.rm(entryPath, { recursive: true, force: true });
    }));
};
/**
 * Cleans up transient files created during the analysis process.
 * Removes uploaded chunks and any stitched artifacts.
 * @returns {Promise<void>}
 */
const cleanupAnalysisArtifacts = async () => {
    try {
        await removeDirectoryContents(UPLOADS_DIR);
        await removeDirectoryContents(OUTPUT_DIR);
    }
    catch (error) {
        console.error('Error while cleaning analysis artifacts:', error);
        throw error;
    }
};
exports.cleanupAnalysisArtifacts = cleanupAnalysisArtifacts;
