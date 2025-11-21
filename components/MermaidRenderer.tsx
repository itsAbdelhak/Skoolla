import React, { useEffect, useState, useRef } from 'react';
import type { DiagramNode } from '../services/geminiService';

declare global {
    interface Window {
        mermaid: any;
    }
}

function sanitizeMermaidForRendering(input: string): string {
    if (!input) return '';
    const sanitizeLabelContent = (labelContent: string): string => {
        if (!labelContent) return '';
        const asciiOnly = labelContent.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return asciiOnly.replace(/[()"]/g, '');
    };
    return input.replace(/\[(.*?)\]/g, (match, content) => `[${sanitizeLabelContent(content)}]`).trim();
}


export const MermaidRenderer: React.FC<{
  diagramData?: { diagram: string; nodes: DiagramNode[] };
  onNodeClick: (node: DiagramNode) => void;
}> = ({
  diagramData,
  onNodeClick
}) => {
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(`mermaid-svg-${Math.random().toString(36).substring(2, 9)}`);
  
  useEffect(() => {
    if (!diagramData?.diagram) {
        setSvg('');
        setError(null);
        return;
    };
    
    const cleanDiagram = sanitizeMermaidForRendering(diagramData.diagram);
    const isValid = /^graph\s+(TD|LR|TB|BT|RL)/.test(cleanDiagram);

    if (!isValid) {
      setError('Invalid Mermaid syntax from AI.');
      return;
    }

    try {
      const renderCallback = (svgCode: string) => setSvg(svgCode);
      window.mermaid.render(renderIdRef.current, cleanDiagram, renderCallback);
      setError(null);

    } catch (err: any) {
      console.error('Mermaid render failed:', err);
      setError('Could not render diagram from the provided code.');
      setSvg('');
    }
  }, [diagramData]);
  
  useEffect(() => {
    if (!svg || !containerRef.current || !diagramData || !diagramData.nodes) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = svg;
    const svgElement = tempDiv.querySelector('svg');
    if (!svgElement) return;
    
    // Style the SVG directly for better presentation
    svgElement.style.maxWidth = '100%';
    svgElement.style.height = 'auto';

    diagramData.nodes.forEach((node) => {
      const nodeElement = svgElement.querySelector(`[id$="--${node.id}"]`);
      if (nodeElement) {
        (nodeElement as HTMLElement).style.cursor = 'pointer';
        const interactiveNode = nodeElement.cloneNode(true) as HTMLElement;
        interactiveNode.addEventListener('click', () => onNodeClick(node));
        nodeElement.parentNode?.replaceChild(interactiveNode, nodeElement);
      } else {
        console.warn(`Mermaid node with ID "${node.id}" not found in SVG.`);
      }
    });

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(svgElement);

  }, [svg, diagramData, onNodeClick]);

  if (!diagramData) {
    return (
        <div className="p-4 my-2 text-sm text-slate-500 border border-white/20 rounded-2xl bg-white/20">
            <p className="font-semibold">Preparing diagram...</p>
        </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 my-2 text-sm text-red-500 border border-red-300 rounded-2xl bg-red-50">
        <p className="font-semibold">{error}</p>
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer font-medium text-slate-600 hover:text-slate-800">
            Show raw diagram code
          </summary>
          <pre className="mt-1 text-slate-800 bg-white p-2 rounded-md overflow-auto font-mono">
              {diagramData.diagram}
          </pre>
        </details>
      </div>
    );
  }

  return <div ref={containerRef} className="mermaid-container p-4 my-2 bg-sky-100/40 backdrop-blur-md rounded-2xl border border-transparent flex justify-center items-center overflow-auto w-full" />;
}