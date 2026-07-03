"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "jodit/es2021/jodit.min.css";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

interface AdminRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function AdminRichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 420,
}: AdminRichTextEditorProps) {
  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: placeholder ?? "Start typing…",
      height: minHeight,
      toolbarAdaptive: false,
      toolbarSticky: false,
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_as_html" as const,
      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "align",
        "outdent",
        "indent",
        "|",
        "ul",
        "ol",
        "|",
        "link",
        "image",
        "table",
        "|",
        "hr",
        "eraser",
        "|",
        "undo",
        "redo",
        "|",
        "source",
        "fullsize",
      ],
      uploader: {
        insertImageAsBase64URI: true,
      },
      style: {
        font: '14px/1.6 var(--font-inter), system-ui, sans-serif',
        color: "#18181b",
      },
      iframe: false,
    }),
    [placeholder, minHeight]
  );

  return (
    <div className="admin-rich-text-editor">
      <JoditEditor
        value={value}
        config={config}
        onBlur={(content) => onChange(content)}
        onChange={(content) => onChange(content)}
      />
    </div>
  );
}
