import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t border-border py-6 mt-12 bg-muted/20">
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">


            <span>Developed by</span>
            <a
              href="https://sillylittletools.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              sillylittletools.com
            </a>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
