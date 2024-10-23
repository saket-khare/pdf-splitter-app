"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFPagePreview } from "@/components/PDFPagePreview";

export default function PDFSplitter() {
    const [file, setFile] = useState<File | null>(null);
    const [ranges, setRanges] = useState<
        { start: string; end: string; name: string }[]
    >([{ start: "", end: "", name: "" }]);
    const [loading, setLoading] = useState(false);
    const [pageCount, setPageCount] = useState(0);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setFile(file);

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setPageCount(pdfDoc.getPageCount());
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

    const handleRangeChange = (
        index: number,
        field: "start" | "end" | "name",
        value: string
    ) => {
        const newRanges = [...ranges];
        newRanges[index][field] = value;
        setRanges(newRanges);
    };

    const addRange = () => {
        setRanges([...ranges, { start: "", end: "", name: "" }]);
    };

    const removeRange = (index: number) => {
        const newRanges = ranges.filter((_, i) => i !== index);
        setRanges(newRanges);
    };

    const splitPDF = async () => {
        if (!file) return;

        setLoading(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            for (const range of ranges) {
                const start = parseInt(range.start);
                const end = parseInt(range.end);

                if (
                    isNaN(start) ||
                    isNaN(end) ||
                    start > end ||
                    start < 1 ||
                    end > pdfDoc.getPageCount()
                ) {
                    alert(`Invalid range: ${range.start}-${range.end}`);
                    continue;
                }

                const newPdf = await PDFDocument.create();
                const copiedPages = await newPdf.copyPages(
                    pdfDoc,
                    Array.from(
                        { length: end - start + 1 },
                        (_, i) => start + i - 1
                    )
                );
                copiedPages.forEach((page) => newPdf.addPage(page));

                const pdfBytes = await newPdf.save();
                const blob = new Blob([pdfBytes], { type: "application/pdf" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${
                    range.name || `split_${range.start}-${range.end}`
                }.pdf`;
                link.click();
            }
        } catch (error) {
            console.error("Error splitting PDF:", error);
            alert(
                "An error occurred while splitting the PDF. Please try again."
            );
        }

        setLoading(false);
    };

    console.log(ranges[0].name);

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-2xl font-bold mb-4">PDF Splitter</h1>
            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 text-center cursor-pointer"
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p>Drop the PDF file here ...</p>
                ) : (
                    <p>
                        Drag and drop a PDF file here, or click to select a file
                    </p>
                )}
            </div>
            {file && <p className="mb-4">Selected file: {file.name}</p>}
            <div className="space-y-4">
                {ranges.map((range, index) => (
                    <div key={index} className="flex space-x-2">
                        <div>
                            <Label htmlFor={`start-${index}`}>Start</Label>
                            <Input
                                id={`start-${index}`}
                                type="number"
                                value={range.start}
                                onChange={(e) =>
                                    handleRangeChange(
                                        index,
                                        "start",
                                        e.target.value
                                    )
                                }
                                min="1"
                                max={pageCount.toString()}
                            />
                        </div>
                        <div>
                            <Label htmlFor={`end-${index}`}>End</Label>
                            <Input
                                id={`end-${index}`}
                                type="number"
                                value={range.end}
                                onChange={(e) =>
                                    handleRangeChange(
                                        index,
                                        "end",
                                        e.target.value
                                    )
                                }
                                min="1"
                                max={pageCount.toString()}
                            />
                        </div>
                        <div>
                            <Label htmlFor={`name-${index}`}>Name</Label>
                            <Input
                                id={`name-${index}`}
                                type="text"
                                value={range.name}
                                onChange={(e) =>
                                    handleRangeChange(
                                        index,
                                        "name",
                                        e.target.value
                                    )
                                }
                                placeholder="Split name"
                            />
                        </div>
                        <Button
                            onClick={() => removeRange(index)}
                            variant="destructive"
                            className="mt-6"
                        >
                            Remove
                        </Button>
                    </div>
                ))}
            </div>
            <div className="mt-4 space-x-2">
                <Button onClick={addRange}>Add Range</Button>
                <Button onClick={splitPDF} disabled={!file || loading}>
                    {loading ? "Splitting..." : "Split PDF"}
                </Button>
            </div>

            {file && pageCount > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-2">Page Preview</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                            (page) => {
                                const isSelected = ranges.some(
                                    (range) =>
                                        page >= parseInt(range.start) &&
                                        page <= parseInt(range.end)
                                );
                                return (
                                    <div key={page} className="relative">
                                        <PDFPagePreview
                                            file={file}
                                            pageNumber={page}
                                            width={150}
                                        />
                                        <div
                                            className={`absolute inset-0 flex items-center justify-center text-sm border-2 ${
                                                isSelected
                                                    ? "border-primary bg-primary/20"
                                                    : "border-transparent"
                                            }`}
                                        >
                                            {page}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
