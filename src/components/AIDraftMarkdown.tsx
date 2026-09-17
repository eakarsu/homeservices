import React from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AIDraftMarkdown({text}: {text: string}) {
  return <div className="min-w-0 break-words text-sm leading-7 text-slate-700">
    <Markdown remarkPlugins={[remarkGfm]} skipHtml disallowedElements={['img']} components={{
      h1: ({children}) => <h3 className="mb-3 mt-7 text-xl font-bold tracking-tight text-slate-950 first:mt-0">{children}</h3>,
      h2: ({children}) => <h3 className="mb-3 mt-6 text-lg font-semibold text-slate-950 first:mt-0">{children}</h3>,
      h3: ({children}) => <h4 className="mb-2 mt-5 text-base font-semibold text-slate-900 first:mt-0">{children}</h4>,
      p: ({children}) => <p className="mb-4 whitespace-pre-line last:mb-0">{children}</p>,
      li: ({children}) => <li className="whitespace-pre-line">{children}</li>,
      ul: ({children}) => <ul className="my-4 list-disc space-y-2 pl-6 marker:text-indigo-500">{children}</ul>,
      ol: ({children}) => <ol className="my-4 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-indigo-600">{children}</ol>,
      strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
      blockquote: ({children}) => <blockquote className="my-4 rounded-r-xl border-l-4 border-indigo-300 bg-indigo-50/60 px-5 py-3 text-slate-600">{children}</blockquote>,
      table: ({children}) => <div className="my-5 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full border-collapse text-left text-sm">{children}</table></div>,
      thead: ({children}) => <thead className="bg-slate-50 text-slate-900">{children}</thead>,
      th: ({children,style}) => <th style={style} className="border-b border-slate-200 px-4 py-3 font-semibold">{children}</th>,
      td: ({children,style}) => <td style={style} className="border-b border-slate-100 px-4 py-3 align-top">{children}</td>,
      a: ({href,children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-700 underline decoration-indigo-200 underline-offset-4 hover:decoration-indigo-600">{children}</a>,
      pre: ({children}) => <pre className="my-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{children}</pre>,
      code: ({children}) => <code className="rounded px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
      hr: () => <hr className="my-6 border-slate-200" />,
    }}>{text}</Markdown>
  </div>
}
