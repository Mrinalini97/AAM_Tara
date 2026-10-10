import { Logo } from "@/components/Logo";
import { QuestionnairePreview } from "@/components/questionnaire/QuestionnairePreview";

export default function QuestionnairePreviewPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6">
        <Logo size="sm" />
        <p className="text-sm text-ink-soft">Questionnaire preview</p>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <QuestionnairePreview />
      </main>
    </div>
  );
}
