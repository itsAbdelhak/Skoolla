import React, { useMemo } from 'react';

const renderTextWithBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const parseMarkdown = (markdown: string) => {
  const jsxElements: React.ReactNode[] = [];
  const lines = markdown.split('\n');

  let currentList: React.ReactNode[] = [];
  let inTable = false;
  let tableHeader: React.ReactNode[] = [];
  let tableRows: React.ReactNode[][] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      jsxElements.push(<ul key={`ul-${jsxElements.length}`} className="list-disc list-outside space-y-2 my-4 pl-5 text-slate-700">{currentList}</ul>);
      currentList = [];
    }
  };
  
  const flushTable = () => {
    if (inTable) {
      jsxElements.push(
        <div key={`table-wrapper-${jsxElements.length}`} className="overflow-x-auto my-6 border border-slate-200 rounded-xl">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">{tableHeader.map((header, i) => <tr key={i}>{header}</tr>)}</thead>
            <tbody className="divide-y divide-slate-200">{tableRows.map((row, i) => <tr key={i} className="hover:bg-slate-50/50">{row}</tr>)}</tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  }

  lines.forEach((line, index) => {
    line = line.trim();

    if (line.startsWith('### ')) {
      flushList();
      flushTable();
      jsxElements.push(<h3 key={index} className="font-display text-2xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2">{line.substring(4)}</h3>);
      return;
    }

    if (line.startsWith('* [ ] ')) {
      if(inTable) flushTable();
      currentList.push(
        <li key={index} className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1 h-5 w-5 flex items-center justify-center border-2 border-slate-300 rounded-md bg-white"></div>
          <span>{renderTextWithBold(line.substring(6))}</span>
        </li>
      );
      return;
    }
    
    if (line.startsWith('* ')) {
      if(inTable) flushTable();
      currentList.push(
        <li key={index} className="flex items-start">
          <span className="text-primary mr-3 mt-1.5">&#8226;</span>
          <span>{renderTextWithBold(line.substring(2))}</span>
        </li>
      );
      return;
    }
    
    if (line.startsWith('|')) {
      flushList();
      if (!inTable) inTable = true;
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      
      if (tableHeader.length === 0) { // Header row
        tableHeader.push(
            cells.map((cell, i) => <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{cell}</th>)
        );
      } else if (!cells.every(c => c.includes('---'))) { // Data row
        tableRows.push(
            cells.map((cell, i) => <td key={i} className="px-4 py-3 text-slate-600">{renderTextWithBold(cell)}</td>)
        );
      }
      return;
    }

    if (line === '---') {
      flushList();
      flushTable();
      jsxElements.push(<hr key={index} className="my-8 border-slate-200" />);
      return;
    }
    
    if (line.trim() !== '') {
      flushList();
      flushTable();
      jsxElements.push(<p key={index} className="text-slate-700 leading-relaxed my-2">{renderTextWithBold(line)}</p>);
    }
  });

  flushList();
  flushTable();
  return jsxElements;
};

export const StudyPlanDisplay: React.FC<{ markdownContent: string }> = ({ markdownContent }) => {
  const planElements = useMemo(() => parseMarkdown(markdownContent), [markdownContent]);

  return (
    <div className="prose prose-slate max-w-none prose-headings:font-display prose-h3:text-slate-900 prose-strong:text-slate-900 prose-a:text-primary">
      {planElements}
    </div>
  );
};