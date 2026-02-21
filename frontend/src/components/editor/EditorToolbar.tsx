import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Highlighter,
  Clock,
  Film,
  Undo,
  Redo,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor;
  onInsertTimestamp: () => void;
  onInsertBroll: () => void;
}

export function EditorToolbar({ editor, onInsertTimestamp, onInsertBroll }: EditorToolbarProps) {
  const addLink = () => {
    const url = prompt("Enter URL:");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const ToolBtn = ({
    onClick,
    is_active = false,
    title,
    children,
  }: {
    onClick: () => void;
    is_active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg border-2 transition-all duration-100 ${
        is_active
          ? "bg-primary text-white border-primary"
          : "border-transparent hover:border-border hover:bg-surface"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-1 flex-wrap p-2 border-3 border-border rounded-neo bg-surface">
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} is_active={editor.isActive("bold")} title="Bold">
        <Bold size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} is_active={editor.isActive("italic")} title="Italic">
        <Italic size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} is_active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough size={16} />
      </ToolBtn>

      <div className="w-px h-6 bg-border/30 mx-1" />

      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} is_active={editor.isActive("heading", { level: 1 })} title="Heading 1">
        <Heading1 size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} is_active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} is_active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <Heading3 size={16} />
      </ToolBtn>

      <div className="w-px h-6 bg-border/30 mx-1" />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} is_active={editor.isActive("bulletList")} title="Bullet List">
        <List size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} is_active={editor.isActive("orderedList")} title="Numbered List">
        <ListOrdered size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} is_active={editor.isActive("blockquote")} title="Quote">
        <Quote size={16} />
      </ToolBtn>

      <div className="w-px h-6 bg-border/30 mx-1" />

      <ToolBtn onClick={addLink} is_active={editor.isActive("link")} title="Add Link">
        <Link2 size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} is_active={editor.isActive("highlight")} title="Highlight">
        <Highlighter size={16} />
      </ToolBtn>

      <div className="w-px h-6 bg-border/30 mx-1" />

      <ToolBtn onClick={onInsertTimestamp} title="Insert Timestamp">
        <Clock size={16} />
      </ToolBtn>
      <ToolBtn onClick={onInsertBroll} title="Insert B-Roll Marker">
        <Film size={16} />
      </ToolBtn>

      <div className="w-px h-6 bg-border/30 mx-1" />

      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        <Undo size={16} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        <Redo size={16} />
      </ToolBtn>
    </div>
  );
}
