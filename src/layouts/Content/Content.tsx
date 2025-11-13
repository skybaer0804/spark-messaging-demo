import type { ComponentChildren } from 'preact';
import './Content.scss';

interface ContentProps {
    children: ComponentChildren;
}

export function Content({ children }: ContentProps) {
    return <main className="content">{children}</main>;
}
