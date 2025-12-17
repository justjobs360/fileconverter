const TrustSection = () => {
  return (
    <section id="privacy" className="py-20 border-t border-border">
      <div className="container-wide">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-5 leading-tight">
              Fast, Private,<br />No Nonsense.
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Upload your file, pick a format, download the result. 
              We process everything securely and delete it automatically. 
              No accounts, no tracking, no strings attached.
            </p>
          </div>
          
          <div className="space-y-0 border-t border-border md:border-t-0 md:border-l md:pl-16 pt-6 md:pt-0">
            {[
              { num: "01", title: "Encrypted transfer", desc: "Files sent over HTTPS" },
              { num: "02", title: "No storage", desc: "Processed in memory only" },
              { num: "03", title: "Auto-delete", desc: "Gone in 30 minutes max" },
              { num: "04", title: "No sign-up", desc: "Just upload and go" },
            ].map((item, i) => (
              <div key={item.num} className={`py-5 ${i !== 3 ? 'border-b border-border' : ''}`}>
                <div className="flex items-baseline gap-5">
                  <span className="text-xs text-primary font-bold tabular-nums">{item.num}</span>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
