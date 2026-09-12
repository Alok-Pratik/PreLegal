"use client";

import { useState } from "react";
import { NdaFormData, emptyNdaFormData } from "@/types/nda";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import DownloadNdaButton from "@/components/DownloadNdaButton";

export default function Home() {
  const [data, setData] = useState<NdaFormData>(emptyNdaFormData);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:px-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Mutual NDA Creator
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Fill in the details below to generate a Mutual Non-Disclosure Agreement.
            The document preview updates as you type, and you can download the
            completed NDA as a PDF at any time.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section className="flex flex-col gap-4">
            <NdaForm data={data} onChange={setData} />
            <DownloadNdaButton data={data} />
          </section>

          <section>
            <NdaPreview data={data} />
          </section>
        </div>
      </main>
    </div>
  );
}
