import React, { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

interface PDFPagePreviewProps {
    file: File;
    pageNumber: number;
    width: number;
}

export function PDFPagePreview({
    file,
    pageNumber,
    width,
}: PDFPagePreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const renderPage = async () => {
            if (!canvasRef.current) return;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer })
                .promise;
            const page = await pdf.getPage(pageNumber);

            const scale = width / page.getViewport({ scale: 1.0 }).width;
            const scaledViewport = page.getViewport({ scale });

            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            const renderContext = {
                canvasContext: context!,
                viewport: scaledViewport,
            };
            await page.render(renderContext).promise;
        };

        renderPage();
    }, [file, pageNumber, width]);

    return <canvas ref={canvasRef} />;
}
