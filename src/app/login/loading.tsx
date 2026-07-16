import { Spinner } from "@/components/loader";

export default function Loading() {
  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
      <Spinner size="lg" className="text-brand-600" />
    </div>
  );
}
