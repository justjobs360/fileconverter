const formatCategories = [
  { category: "Documents", formats: ["PDF", "DOCX", "TXT", "RTF"] },
  { category: "Images", formats: ["JPG", "PNG", "WebP", "GIF", "SVG"] },
  { category: "Video", formats: ["MP4", "MOV", "AVI", "WebM"] },
  { category: "Audio", formats: ["MP3", "WAV", "AAC", "FLAC"] },
  { category: "Archives", formats: ["ZIP", "RAR", "7Z", "TAR"] },
];

const SupportedFormats = () => {
  return (
    <section id="formats" className="py-12 border-t border-border">
      <div className="container-wide">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-6">Supported formats</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {formatCategories.map((category) => (
            <div key={category.category}>
              <p className="text-sm font-medium text-foreground mb-2">
                {category.category}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {category.formats.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportedFormats;
