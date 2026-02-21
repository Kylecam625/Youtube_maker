import { Editor } from "@tiptap/react";
import { Button } from "@/components/common";

interface SectionInserterProps {
  editor: Editor;
}

const SECTIONS = [
  { label: "Hook", content: "<h2>Hook</h2><p>Start with something that grabs attention in the first 5 seconds...</p>" },
  { label: "Intro", content: "<h2>Intro</h2><p>Welcome viewers and introduce the topic...</p>" },
  { label: "Body", content: "<h2>Main Content</h2><p>Dive into the details...</p>" },
  { label: "CTA", content: "<h2>Call to Action</h2><p>Like, subscribe, and comment...</p>" },
  { label: "Outro", content: "<h2>Outro</h2><p>Thank viewers and tease next video...</p>" },
  { label: "Sponsor", content: '<div class="sponsor-segment"><strong>Sponsor Segment</strong><p>This video is sponsored by...</p></div>' },
];

export function SectionInserter({ editor }: SectionInserterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {SECTIONS.map((section) => (
        <Button
          key={section.label}
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().insertContent(section.content).run()}
        >
          + {section.label}
        </Button>
      ))}
    </div>
  );
}
