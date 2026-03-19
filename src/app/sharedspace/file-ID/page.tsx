import Link from "next/link";
import { notFound } from "next/navigation";
import { sharedFiles } from "@/lib/sharedspace-data";

type FileDetailsPageProps = {
  params: {
    fileId: string;
  };
};

const typeTheme = {
  doc: { bg: "#F1F1F1", text: "#111111", icon: "📝" },
  pdf: { bg: "#F3F3F3", text: "#111111", icon: "📕" },
  zip: { bg: "#EFEFEF", text: "#111111", icon: "🗜️" },
  image: { bg: "#F5F5F5", text: "#111111", icon: "🖼️" },
  sheet: { bg: "#F0F0F0", text: "#111111", icon: "📊" },
  other: { bg: "#F4F4F4", text: "#111111", icon: "📁" },
};

export default function FileDetailsPage({ params }: FileDetailsPageProps) {
  const file = sharedFiles.find((item) => item.id === params.fileId);

  if (!file) {
    notFound();
  }

  const theme = typeTheme[file.type];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-12">
      <div className="mx-auto w-full max-w-md px-4 pt-5 sm:max-w-2xl sm:px-6 md:max-w-4xl lg:max-w-6xl lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/sharedspace"
            className="rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] shadow-[0_4px_14px_rgba(0,0,0,0.03)] sm:text-[14px]"
          >
            ← Back
          </Link>

          <button className="rounded-full border border-[#E5E5E5] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111] shadow-[0_4px_14px_rgba(0,0,0,0.03)] sm:text-[14px]">
            Share
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <div className="space-y-6">
            <div className="rounded-[26px] border border-[#E7E7E7] bg-white p-5 shadow-[0_6px_22px_rgba(0,0,0,0.04)] sm:rounded-[30px] sm:p-6">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-[20px] text-2xl sm:h-16 sm:w-16 sm:rounded-[22px] sm:text-3xl"
                style={{ backgroundColor: theme.bg }}
              >
                {theme.icon}
              </div>

              <h1 className="mt-5 text-[24px] font-bold leading-[1.1] tracking-[-0.04em] text-[#111111] sm:text-[28px]">
                {file.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold sm:text-[12px]"
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                >
                  {file.extension}
                </span>
                <span className="rounded-full bg-[#F3F3F3] px-3 py-1.5 text-[11px] font-semibold text-[#111111] sm:text-[12px]">
                  {file.size}
                </span>
                <span className="rounded-full bg-[#F3F3F3] px-3 py-1.5 text-[11px] font-semibold text-[#111111] sm:text-[12px]">
                  {file.folder}
                </span>
              </div>

              {file.description ? (
                <p className="mt-5 text-[14px] leading-7 text-[#666666] sm:text-[15px]">
                  {file.description}
                </p>
              ) : null}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:rounded-[22px]">
                  <p className="text-[11px] text-[#7B7B7B] sm:text-[12px]">Shared by</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#111111] sm:text-[15px]">
                    {file.sharedBy}
                  </p>
                </div>

                <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:rounded-[22px]">
                  <p className="text-[11px] text-[#7B7B7B] sm:text-[12px]">Shared at</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#111111] sm:text-[15px]">
                    {file.sharedAt}
                  </p>
                </div>

                <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:rounded-[22px]">
                  <p className="text-[11px] text-[#7B7B7B] sm:text-[12px]">Project</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#111111] sm:text-[15px]">
                    {file.project}
                  </p>
                </div>

                <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:rounded-[22px]">
                  <p className="text-[11px] text-[#7B7B7B] sm:text-[12px]">Availability</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#111111] sm:text-[15px]">
                    Shared with team
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className="rounded-full border border-[#DEDEDE] bg-white px-5 py-3.5 text-[14px] font-semibold text-[#111111] sm:flex-1 sm:py-4 sm:text-[15px]">
                  Preview
                </button>
                <button className="rounded-full bg-[#111111] px-5 py-3.5 text-[14px] font-semibold text-white sm:flex-1 sm:py-4 sm:text-[15px]">
                  Download
                </button>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#E7E7E7] bg-white p-5 shadow-[0_6px_22px_rgba(0,0,0,0.04)] sm:rounded-[30px] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111111] sm:text-[22px]">
                  Mock preview
                </h2>

                <span
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold sm:text-[12px]"
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                >
                  Opened
                </span>
              </div>

              <div className="mt-4 rounded-[22px] bg-[#F7F7F7] p-4 sm:rounded-[24px]">
                <p className="text-[16px] font-semibold text-[#111111] sm:text-[18px]">
                  {file.previewTitle || file.name}
                </p>
                <p className="mt-3 text-[13px] leading-7 text-[#666666] sm:text-[14px]">
                  {file.previewText ||
                    "This is a mock preview area for the selected file. Later you can replace this with PDF viewer, image preview, document renderer, or download logic connected to backend storage."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[26px] border border-[#E7E7E7] bg-white p-5 shadow-[0_6px_22px_rgba(0,0,0,0.04)] sm:rounded-[30px] sm:p-6">
              <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111111] sm:text-[22px]">
                Suggested next actions
              </h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:rounded-[22px]">
                  <p className="text-[14px] font-semibold text-[#111111] sm:text-[15px]">
                    Attach to task or milestone
                  </p>
                  <p className="mt-1 text-[12px] leading-6 text-[#666666] sm:text-[13px]">
                    Useful for linking documents to workspace execution.
                  </p>
                </div>

                <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:rounded-[22px]">
                  <p className="text-[14px] font-semibold text-[#111111] sm:text-[15px]">
                    Add comments or approval
                  </p>
                  <p className="mt-1 text-[12px] leading-6 text-[#666666] sm:text-[13px]">
                    Helpful for contract review, design review and doc feedback.
                  </p>
                </div>

                <div className="rounded-[20px] bg-[#F7F7F7] p-4 sm:rounded-[22px]">
                  <p className="text-[14px] font-semibold text-[#111111] sm:text-[15px]">
                    Track version history
                  </p>
                  <p className="mt-1 text-[12px] leading-6 text-[#666666] sm:text-[13px]">
                    Important for decks, product docs and legal files.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#E7E7E7] bg-white p-5 shadow-[0_6px_22px_rgba(0,0,0,0.04)] sm:rounded-[30px] sm:p-6">
              <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#111111] sm:text-[22px]">
                File summary
              </h2>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-[18px] bg-[#F7F7F7] px-4 py-3">
                  <span className="text-[13px] text-[#666666]">Type</span>
                  <span className="text-[13px] font-semibold text-[#111111]">
                    {file.extension}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[18px] bg-[#F7F7F7] px-4 py-3">
                  <span className="text-[13px] text-[#666666]">Folder</span>
                  <span className="text-[13px] font-semibold text-[#111111]">
                    {file.folder}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[18px] bg-[#F7F7F7] px-4 py-3">
                  <span className="text-[13px] text-[#666666]">Project</span>
                  <span className="text-[13px] font-semibold text-[#111111]">
                    {file.project}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[18px] bg-[#F7F7F7] px-4 py-3">
                  <span className="text-[13px] text-[#666666]">Status</span>
                  <span className="text-[13px] font-semibold text-[#111111]">
                    Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}