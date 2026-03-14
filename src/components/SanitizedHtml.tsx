import DOMPurify from "isomorphic-dompurify";
import React from "react";

interface SanitizedHtmlProps {
    html: string;
    className?: string;
}

export function SanitizedHtml({ html, className }: SanitizedHtmlProps) {
    const safeHtml = DOMPurify.sanitize(html);
    return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}

