const MODEL_SOURCE =
  "https://raw.githubusercontent.com/KyyKelvin/inovart/main/public/models/dark-metal/shared.bin";

export async function GET() {
  try {
    const response = await fetch(
      MODEL_SOURCE,
    );

    if (!response.ok) {
      throw new Error(`Unable to load the model binary: ${response.status}`);
    }

    const body = new Uint8Array(await response.arrayBuffer());

    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(body.byteLength),
        "Content-Type": "application/octet-stream",
      },
    });
  } catch {
    return Response.json(
      { error: "Unable to assemble the 3D model binary." },
      { status: 502 },
    );
  }
}
