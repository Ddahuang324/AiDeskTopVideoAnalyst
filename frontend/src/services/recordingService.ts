import { analyzeWorkflow } from './llmService';

class RecordingService {
  private mediaStream: MediaStream | null = null;
  private frameCaptureInterval: number | null = null;
  private capturedFrames: string[] = [];

  async start(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // @ts-ignore
          cursor: 'always'
        },
        audio: false
      });

      const videoTrack = this.mediaStream.getVideoTracks()[0];
      // @ts-ignore
      const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });

      const reader = trackProcessor.readable.getReader();

      this.frameCaptureInterval = window.setInterval(async () => {
        const result = await reader.read();
        if (result.done) {
          if (this.frameCaptureInterval) clearInterval(this.frameCaptureInterval);
          return;
        }

        const frame = result.value;
        const bitmap = await createImageBitmap(frame);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(bitmap, 0, 0);
          const base64Frame = canvas.toDataURL('image/jpeg').split(',')[1];
          this.capturedFrames.push(base64Frame);
          console.log(`Captured frame #${this.capturedFrames.length}`);
        }
        frame.close();
      }, 5000); // Capture a frame every 5 seconds

      console.log('Recording and frame capture started.');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  async stop(prompt: string): Promise<any> {
    if (this.frameCaptureInterval) {
      clearInterval(this.frameCaptureInterval);
      this.frameCaptureInterval = null;
    }

    this.mediaStream?.getTracks().forEach((track) => track.stop());
    console.log('Recording stopped.');

    if (this.capturedFrames.length === 0) {
      console.log('No frames were captured.');
      return { summary: '没有捕获到帧，无法生成摘要。' };
    }

    console.log(`Analyzing ${this.capturedFrames.length} captured frames...`);
    const analysisResult = await analyzeWorkflow(this.capturedFrames, prompt);

    // Reset frames after analysis
    this.capturedFrames = [];

    return analysisResult;
  }
}

export const recordingService = new RecordingService();

