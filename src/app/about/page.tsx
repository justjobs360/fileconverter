
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            <Header />
            <main className="flex-1 py-16 sm:py-24">
                <div className="container-tight">
                    <div className="max-w-2xl mx-auto space-y-12">
                        <div className="text-center">
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-6">
                                About <span className="text-primary">FileConverter</span>
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                We are building the web's most privacy-focused file conversion utility.
                            </p>
                        </div>

                        <div className="prose prose-zinc dark:prose-invert max-w-none">
                            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Our Mission</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                In a world where data privacy is constantly compromised, we believe simple tools shouldn't require efficient tradeoffs.
                                Our mission is to provide a fast, reliable, and completely private file converter that respects your data.
                            </p>

                            <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">How It Works</h2>
                            <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                                <li><strong className="text-foreground">Client-Side First:</strong> Where possible (like for Audio/Video), conversions happen directly in your browser using WebAssembly. Your files never leave your device.</li>
                                <li><strong className="text-foreground">Ephemeral Processing:</strong> For formats requiring server processing (like images), your files are processed in-memory and deleted immediately after conversion. We have zero long-term storage.</li>
                                <li><strong className="text-foreground">No Accounts Needed:</strong> We don't track who you are. Just convert and go.</li>
                            </ul>
                        </div>

                        <div className="pt-8 text-center border-t border-border">
                            <Button asChild size="lg" variant="hero" className="rounded-xl px-8">
                                <Link href="/">Start Converting Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
