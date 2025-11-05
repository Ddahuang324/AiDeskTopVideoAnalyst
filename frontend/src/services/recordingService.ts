
import { uploadVideoChunk } from './apiService';

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private static readonly TIMESLICE = 15000; // 15 seconds
  private pendingUploads: Set<Promise<void>> = new Set();
  private stopPromise: Promise<void> | null = null;
  private resolveStop: (() => void) | null = null;
  private rejectStop: ((reason?: unknown) => void) | null = null;

  async start() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.log('[recordingService] Recording is already in progress.');
      return;
    }

    try {
      console.log('[recordingService] Starting screen recording...');
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: 'always',
        } as any,
        audio: false,
      });

      const mimeType = this.getPreferredMimeType();
      console.log('[recordingService] Using MIME type:', mimeType);
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for better quality
      });

      this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
      this.mediaRecorder.onstop = this.handleStop.bind(this);

      this.recordedChunks = [];
      this.pendingUploads.clear();
      this.stopPromise = new Promise<void>((resolve, reject) => {
        this.resolveStop = resolve;
        this.rejectStop = reject;
      });
      this.mediaRecorder.start(RecordingService.TIMESLICE);
      console.log('Screen recording started.');
    } catch (error) {
      console.error('Error starting screen recording:', error);
      await this.stop(); // Clean up on error
    }
  }

  private handleDataAvailable(event: BlobEvent) {
    if (event.data.size > 0) {
      console.log(`[recordingService] Got chunk data: ${Math.round(event.data.size / 1024)} KB`);
      this.recordedChunks.push(event.data);
      // Immediately upload the chunk and track completion
      const uploadTask = (async () => {
        try {
          const result = await uploadVideoChunk(event.data);
          console.log('[recordingService] Chunk uploaded successfully:', result);
        } catch (error) {
          console.error('[recordingService] Failed to upload chunk immediately:', error);
          throw error;
        }
      })();

      this.pendingUploads.add(uploadTask);
      uploadTask.finally(() => {
        this.pendingUploads.delete(uploadTask);
      });
    }
  }

  private getPreferredMimeType(): string {
    const types = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm'; // Fallback
  }

  private async handleStop() {
    console.log('[recordingService] Recording stopped.');

    try {
      // Wait a bit to ensure the last chunk is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.waitForPendingUploads();
      console.log('[recordingService] All chunks uploaded successfully.');
      this.cleanupStream();
      this.resolveStop?.();
    } catch (error) {
      console.error('[recordingService] Error during stop:', error);
      this.cleanupStream();
      this.rejectStop?.(error);
    } finally {
      this.resetStopPromise();
    }
  }

  async stop(): Promise<void> {
    console.log('[recordingService] Stopping recording...');
    
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      // Request final data before stopping
      this.mediaRecorder.requestData();
      this.mediaRecorder.stop();
    }

    if (this.stopPromise) {
      await this.stopPromise;
    }
    
    console.log('[recordingService] Stop complete.');
  }

  getRecordedChunks(): Blob[] {
    return this.recordedChunks;
  }

  private async waitForPendingUploads(): Promise<void> {
    console.log(`[recordingService] Waiting for ${this.pendingUploads.size} pending uploads...`);
    let firstError: unknown = null;

    while (this.pendingUploads.size > 0) {
      const uploads = Array.from(this.pendingUploads);
      const results = await Promise.allSettled(uploads);
      const failedUpload = results.find(result => result.status === 'rejected');

      if (!firstError && failedUpload && failedUpload.status === 'rejected') {
        firstError = failedUpload.reason;
      }
    }

    console.log('[recordingService] All pending uploads completed.');

    if (firstError) {
      throw firstError;
    }
  }

  private cleanupStream() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.mediaRecorder = null;
  }

  private resetStopPromise() {
    this.stopPromise = null;
    this.resolveStop = null;
    this.rejectStop = null;
    this.pendingUploads.clear();
  }
}

const recordingService = new RecordingService();
export default recordingService;
