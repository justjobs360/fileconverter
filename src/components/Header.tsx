const Header = () => {
  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container-wide py-4 flex items-center justify-between">
        <a href="/" className="group">
          <span className="text-xl font-bold text-foreground">
            convert<span className="text-primary">.io</span>
          </span>
        </a>
        
        <nav className="flex items-center gap-8">
          <a 
            href="#formats" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Formats
          </a>
          <a 
            href="#privacy" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How it works
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
