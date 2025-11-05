import { Request, Response } from 'express';
import { stitchVideos, getVideoDuration, cleanupAnalysisArtifacts } from '../services/videoService';
import { uploadVideo, transcribeVideo, generateActivityCards } from '../services/geminiService';

export const uploadChunk = (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded.' });
  }

  console.log(`Received chunk: ${req.file.filename}`);
  res.status(200).send({ message: 'Chunk uploaded successfully', filename: req.file.filename });
};

export const triggerAnalysis = async (req: Request, res: Response) => {
  console.log('Triggering analysis...');

  try {
    const stitchedVideoPath = await stitchVideos();
    const videoDuration = await getVideoDuration(stitchedVideoPath);
    const fileUri = await uploadVideo(stitchedVideoPath);
    const observations = await transcribeVideo(fileUri, videoDuration);
    const activityCards = await generateActivityCards(observations);

    res.status(200).json({ observations, activityCards });
  } catch (error) {
    console.error('Analysis pipeline failed:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error during analysis.';
    res.status(500).json({ message: 'Analysis failed', error: message });
  } finally {
    try {
      await cleanupAnalysisArtifacts();
    } catch (cleanupError) {
      console.error('Failed to clean analysis artifacts:', cleanupError);
    }
  }
};
