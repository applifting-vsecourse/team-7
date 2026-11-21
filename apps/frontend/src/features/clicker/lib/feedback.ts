let audio: AudioContext | undefined;

/** A short percussive click, synthesized locally so it also works offline. */
export function clickerFeedback(success: boolean) {
  navigator.vibrate?.(success ? 30 : [20, 40, 20]);
  if (!success) return;
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => undefined);
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(1800, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400,
      audio.currentTime + 1.125,
    );
    gain.gain.setValueAtTime(0.15, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.035);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.04);
  } catch {
    // Audio is optional on browsers that don't support Web Audio.
  }
}
