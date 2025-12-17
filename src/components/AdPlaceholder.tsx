import GoogleAdSense from "./GoogleAdSense";

interface AdPlaceholderProps {
  size: "banner" | "sidebar" | "rectangle";
  className?: string;
  slot?: string;
}

const sizeClasses = {
  banner: "w-full h-20",
  sidebar: "w-full h-60",
  rectangle: "w-full h-44",
};

const AdPlaceholder = ({ size, className = "", slot }: AdPlaceholderProps) => {
  const showAds = !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && !!slot;

  if (showAds) {
    return (
      <div className={`ad-container ${className}`}>
        <GoogleAdSense slot={slot!} format="auto" />
      </div>
    );
  }

  return (
    <div
      className={`ad-placeholder flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
        Ad
      </p>
    </div>
  );
};

export default AdPlaceholder;
