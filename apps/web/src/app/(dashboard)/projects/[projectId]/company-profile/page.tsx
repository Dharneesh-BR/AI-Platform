import { CompanyProfileReview } from '../../../../../features/company-profile/components/company-profile-review';

interface CompanyProfileReviewPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function CompanyProfileReviewPage({ params }: CompanyProfileReviewPageProps) {
  const { projectId } = await params;

  return <CompanyProfileReview projectId={projectId} />;
}