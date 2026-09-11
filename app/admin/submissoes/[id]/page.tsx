import { SubmissionReview } from "@/components/submission-review";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main id="conteudo" className="site-shell section"><SubmissionReview id={id} /></main>;
}
