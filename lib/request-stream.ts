export class RequestBodyLimitError extends Error {
  constructor() {
    super("request body limit exceeded");
    this.name = "RequestBodyLimitError";
  }
}

export function createLimitedBodyStream(source: ReadableStream<Uint8Array> | null, limit: number) {
  if (!source) return { body: null, exceeded: () => false };

  const reader = source.getReader();
  let total = 0;
  let overLimit = false;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      reader.releaseLock();
    }
  };

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          release();
          controller.close();
          return;
        }

        total += value.byteLength;
        if (total > limit) {
          overLimit = true;
          await reader.cancel("request body limit exceeded").catch(() => undefined);
          release();
          controller.error(new RequestBodyLimitError());
          return;
        }

        controller.enqueue(value);
      } catch (error) {
        release();
        controller.error(error);
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } finally {
        release();
      }
    },
  });

  return { body, exceeded: () => overLimit };
}
