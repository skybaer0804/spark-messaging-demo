import './Footer.scss';

interface FooterProps {
    children?: preact.ComponentChildren;
}

export function Footer({ children }: FooterProps) {
    return <footer className="footer">{children || <p className="footer__text">© 2024 Spark Messaging Demo</p>}</footer>;
}
