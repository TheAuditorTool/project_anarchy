# Fake Errors: 2 (Consolidated into one file)
# 1. aud flow-analyze: A stream is used without an error handler.
# 2. aud detect-patterns: Global state is mutated directly.

import asyncio

# FLAW 123: Direct mutation of global state.
GLOBAL_STREAM_STATUS = "INITIALIZING"

async def handle_stream(reader, writer):
    global GLOBAL_STREAM_STATUS
    GLOBAL_STREAM_STATUS = "PROCESSING"
    # FLAW 122: This stream reader has no try/except block to handle connection errors,
    # which would leave the stream open and unhandled.
    data = await reader.read(100)
    message = data.decode()
    writer.write(data)
    await writer.drain()
    writer.close()
    GLOBAL_STREAM_STATUS = "CLOSED"