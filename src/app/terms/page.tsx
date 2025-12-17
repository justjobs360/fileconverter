
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            <Header />
            <main className="flex-1 py-16 sm:py-24">
                <div className="container-tight">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-12">Terms of Service</h1>

                        <div className="space-y-12">
                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">2. Use License</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Permission is granted to temporarily download one copy of the materials (information or software) on this website for personal, non-commercial transitory viewing only.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">3. Disclaimer</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    The materials on this website are provided "as is". We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-foreground mb-4">4. Limitations</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    In no event shall we be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this site.
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
