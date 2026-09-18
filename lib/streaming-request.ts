type StreamingRequestInit = RequestInit & { duplex: "half" };

export function createStreamingRequest(input: RequestInfo | URL, init: RequestInit) {
  return new Request(input, { ...init, duplex: "half" } as StreamingRequestInit);
}
