"use client";

import dynamic from "next/dynamic";
import { NdaFormData } from "@/types/nda";
import NdaPdfDocument from "./NdaPdfDocument";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex items-center justify-center rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
        Preparing download...
      </span>
    ),
  }
);

export default function DownloadNdaButton({ data }: { data: NdaFormData }) {
  const fileName = `mutual-nda-${data.partyAName.trim() || "party-a"}-${
    data.partyBName.trim() || "party-b"
  }.pdf`
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <PDFDownloadLink
      document={<NdaPdfDocument data={data} />}
      fileName={fileName}
      className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
    >
      {({ loading }) => (loading ? "Preparing PDF..." : "Download NDA as PDF")}
    </PDFDownloadLink>
  );
}
