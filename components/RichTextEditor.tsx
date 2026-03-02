"use client";

import React, { useState } from "react";

import RichTextEditor from "reactjs-tiptap-editor";
import { Heading } from "reactjs-tiptap-editor/heading";
import { Blockquote } from "reactjs-tiptap-editor/blockquote";
import { BaseKit } from "reactjs-tiptap-editor";
import { Bold } from "reactjs-tiptap-editor/bold";
import { BulletList } from "reactjs-tiptap-editor/bulletlist";
import { FontSize } from "reactjs-tiptap-editor/fontsize";
import { Highlight } from "reactjs-tiptap-editor/highlight";
import { HorizontalRule } from "reactjs-tiptap-editor/horizontalrule";
import { Indent } from "reactjs-tiptap-editor/indent";
import { Italic } from "reactjs-tiptap-editor/italic";
import { ColumnActionButton } from "reactjs-tiptap-editor/multicolumn";
import { Selection } from "reactjs-tiptap-editor/selection";
import { SlashCommand } from "reactjs-tiptap-editor/slashcommand";
import { Table } from "reactjs-tiptap-editor/table";
import { TaskList } from "reactjs-tiptap-editor/tasklist";
import { Emoji } from "reactjs-tiptap-editor/emoji";

import "katex/dist/katex.min.css";

import "reactjs-tiptap-editor/style.css";

const extensions = [
  BaseKit.configure({
    placeholder: {
      showOnlyCurrent: true,
    },

    // Character count
    characterCount: {
      limit: 50_000,
    },
  }),
  Heading,
  Blockquote,
  Bold,
  BulletList,
  FontSize,
  Highlight,
  HorizontalRule,
  Indent,
  Italic,
  ColumnActionButton,
  Selection,
  SlashCommand,
  Table,
  TaskList,
  Emoji,
];

export default function RenderRichTextEditor() {
  const [content, setContent] = useState("");

  const onValueChange = (value: string) => {
    setContent(value);
  };

  return (
    <main className="">
      <div className="max-w-[1024px] mx-auto">
        <RichTextEditor
          output="html"
          content={content}
          onChangeContent={onValueChange}
          extensions={extensions}

          //   disabled={disable}
        />
      </div>
    </main>
  );
}
