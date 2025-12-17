
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            <Header />
            <main className="flex-1 py-16 sm:py-24">
                <div className="container-tight">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">Privacy Policy</h1>
                        <p className="text-sm text-muted-foreground mb-12 uppercase tracking-widest font-medium">
                            Last Updated: {new Date().toLocaleDateString()}
                        </p>

                        <div className="space-y-12">
                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">1. Data Storage</h2>
                                <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
                                    <p>We do <strong className="text-foreground">not</strong> store your files.</p>
                                    <ul className="list-disc pl-6 space-y-2">
                                        <li>Files processed client-side (Audio/Video) never leave your device.</li>
                                        <li>Files processed server-side (Images/PDF) are held in temporary memory only for the duration of the conversion and are permanently deleted immediately after the response is sent.</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">2. Data Collection</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    We do not collect personal information. We utilize standard server logs for debugging and rate-limiting purposes (IP addresses), which are rotated regularly.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">3. Third-Party Services</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    We use Google AdSense to monetize this free service. Google may use cookies to serve ads based on your prior visits to our website or other websites.
                                    You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ads Settings</a>.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
