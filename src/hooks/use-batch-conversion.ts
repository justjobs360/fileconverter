import { useState } from 'react';

// Future Hook: Batch Conversion
// This hook will handle converting multiple files in queue.
export function useBatchConversion() {
    const [queue, setQueue] = useState<File[]>([]);

    // TODO: Implement queue logic
    // const addToQueue = (files: File[]) => ...
    // const processQueue = async () => ...

    return {
        queue,
        // addToQueue,
        // processQueue
    };
}
