export interface ScreenShareSession {
  stream: MediaStream | null;
  videoTrack: MediaStreamTrack | null;
  isActive: boolean;
  startTime: number | null;
  dimensions: { width: number; height: number };
}

export class ScreenShareManager {
  private stream: MediaStream | null = null;
  private onEndedCallback: (() => void) | null = null;

  async startSharing(onEnded?: () => void): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error(
        'Screen sharing (getDisplayMedia) is not supported by your browser or OS. Please use modern Chrome, Edge, or Safari on desktop.'
      );
    }

    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window', // or 'monitor', 'browser'
        },
        audio: false,
      });

      this.onEndedCallback = onEnded || null;

      const track = this.stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          this.stopSharing();
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        };
      }

      return this.stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        throw new Error('Screen sharing permission was denied or cancelled.');
      }
      throw new Error(`Failed to start screen share: ${err.message || 'Unknown error'}`);
    }
  }

  stopSharing(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  isSharingActive(): boolean {
    return !!(this.stream && this.stream.active && this.stream.getVideoTracks().some(t => t.readyState === 'live'));
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Captures the current visible frame from a video element playing the stream.
   * Returns a base64 JPEG data URL suitable for Gemini multimodal input.
   */
  captureFrame(videoElement: HTMLVideoElement): string {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      throw new Error('Video stream is not currently playing or has no valid dimensions.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create 2D canvas context for frame capture.');

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }
}

export const screenShareManager = new ScreenShareManager();
