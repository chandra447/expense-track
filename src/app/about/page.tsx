export default function About() {
    return (
        <div className="w-full max-w-6xl mx-auto rounded-2xl border-secondary border p-6 m-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    About Expense Tracker
                </h1>
                <p className="text-muted-foreground">
                    Learn more about this expense tracking application
                </p>
            </div>
            
            <div className="space-y-6">
                <section>
                    <h2 className="text-xl font-semibold mb-3">Features</h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>Track your daily expenses with detailed information</li>
                        <li>Organize expenses with custom tags</li>
                        <li>View comprehensive expense summaries</li>
                        <li>Modern and responsive user interface</li>
                    </ul>
                </section>
                
                <section>
                    <h2 className="text-xl font-semibold mb-3">Technology Stack</h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>Next.js 14 with App Router</li>
                        <li>TypeScript for type safety</li>
                        <li>Hono.js for API routes</li>
                        <li>Drizzle ORM for database management</li>
                        <li>TanStack Query for data fetching</li>
                        <li>Tailwind CSS for styling</li>
                        <li>shadcn/ui for UI components</li>
                    </ul>
                </section>
            </div>
        </div>
    );
} 