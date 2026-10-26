import { SpeechToText } from "runonweb/stt";

let sttInstance: SpeechToText | null = null;
let currentModel: string = "";

self.addEventListener("message", async (e: MessageEvent) => {
  const { type, id, payload } = e.data || {};

  if (type === "load") {
    try {
      const { modelId, language } = payload || {};
      if (!sttInstance || currentModel !== modelId) {
        if (sttInstance) {
          sttInstance.dispose();
        }
        currentModel = modelId;
        sttInstance = new SpeechToText({
          model: modelId,
          language,
          device: "auto",
          onProgress: (info) => {
            self.postMessage({ type: "progress", id, payload: info });
          },
        });
      }
      await sttInstance.load();
      self.postMessage({ type: "load_success", id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: "error", id, payload: { message } });
    }
  } else if (type === "transcribe") {
    try {
      const { pcm, language, modelId } = payload || {};
      if (!sttInstance || currentModel !== modelId) {
        if (sttInstance) {
          sttInstance.dispose();
        }
        currentModel = modelId;
        sttInstance = new SpeechToText({
          model: modelId,
          language,
          device: "auto",
        });
        await sttInstance.load();
      }

      const startTime = performance.now();
      const result = await sttInstance.transcribe(pcm, {
        language,
        task: "transcribe",
      });
      const durationSeconds = (performance.now() - startTime) / 1000;

      self.postMessage({
        type: "transcribe_success",
        id,
        payload: { text: result.text, durationSeconds },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: "error", id, payload: { message } });
    }
  } else if (type === "dispose") {
    if (sttInstance) {
      sttInstance.dispose();
      sttInstance = null;
    }
    self.postMessage({ type: "disposed", id });
  }
});
