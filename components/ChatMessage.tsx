

import React, { useMemo } from 'react';
import { LogoIcon } from './icons';
import { MermaidRenderer } from './MermaidRenderer';
import { DiagramData, DiagramNode, QuizData, EducationalMode } from '../services/geminiService';
import { QuizDisplay } from './QuizDisplay';

interface ChatMessageProps {
  message: {
    role: 'user' | 'model';
    content: string | DiagramData | QuizData;
    mode?: EducationalMode;
  };
  onTextSelect: (selectedText: string, contextText: string, position: { top: number; left: number }) => void;
  onNodeClick: (node: DiagramNode) => void;
}

const parseSimpleMarkdown = (markdown: string) => {
  const jsxElements: React.ReactNode[] = [];
  const lines = markdown.split('\n');

  let listType: 'ul' | 'ol' | null = null;
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      const listKey = `${listType}-${jsxElements.length}`;
      if (listType === 'ul') {
        jsxElements.push(<ul key={listKey} className="list-disc space-y-2 pl-6">{currentList}</ul>);
      } else if (listType === 'ol') {
        jsxElements.push(<ol key={listKey} className="list-decimal space-y-2 pl-6">{currentList}</ol>);
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith('# ')) {
      flushList();
      jsxElements.push(<h1 key={index} className="font-display text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>);
    } else if (line.startsWith('> ')) {
        flushList();
        jsxElements.push(<blockquote key={index} className="pl-4 italic border-l-4 border-slate-300 text-slate-600 my-3">{line.substring(2)}</blockquote>);
    } else if (line.startsWith('* ')) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      currentList.push(<li key={index}>{line.substring(2)}</li>);
    } else if (line.match(/^\d+\. /)) {
        if (listType !== 'ol') flushList();
        listType = 'ol';
        currentList.push(<li key={index}>{line.replace(/^\d+\. /, '')}</li>);
    } else if (line.trim() !== '') {
      flushList();
      jsxElements.push(<p key={index} className="my-2 leading-relaxed">{line}</p>);
    } else {
      flushList();
    }
  });
  flushList();
  
  return jsxElements;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onTextSelect, onNodeClick }) => {
  const contentIsString = typeof message.content === 'string';
  const contentIsDiagram = typeof message.content === 'object' && message.content !== null && 'diagram' in message.content;
  const contentIsQuiz = typeof message.content === 'object' && message.content !== null && 'questions' in message.content;

  const contentElements = useMemo(() => (typeof message.content === 'string' ? parseSimpleMarkdown(message.content) : null), [message.content]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 1 && typeof message.content === 'string') {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      onTextSelect(
        selection.toString().trim(),
        message.content,
        {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX + rect.width / 2,
        }
      );
    }
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end ml-6 sm:ml-10">
        <div className="bg-slate-800 text-white rounded-2xl rounded-br-lg max-w-lg p-4 shadow-sm font-semibold">
          {typeof message.content === 'string' ? message.content : '[Request]'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 sm:gap-3.5 mr-6 sm:mr-10">
      <div className="flex-shrink-0 h-9 w-9 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm mt-1">
        <LogoIcon className="h-6 w-6 text-blue-500" />
      </div>
      <div className="flex flex-col items-start gap-2 w-full">
         <div className="bg-sky-100/40 backdrop-blur-md text-slate-800 rounded-2xl rounded-bl-lg max-w-2xl p-4 border border-transparent prose prose-slate max-w-none w-full">
            {contentIsString && <div onMouseUp={handleMouseUp}>{contentElements}</div>}
            {contentIsDiagram && <MermaidRenderer diagramData={message.content as DiagramData} onNodeClick={onNodeClick} />}
            {contentIsQuiz && <QuizDisplay quizData={message.content as QuizData} />}
        </div>
      </div>
    </div>
  );
};