import type { ImageJobRow } from '@/types';
import { getToolById } from '@/lib/tools/registry';

export function JobHistoryTable({ jobs, locale }: { jobs: ImageJobRow[]; locale: 'en' | 'ro' }) {
  if (jobs.length === 0) {
    return <p className="text-sm text-text-tertiary">No jobs yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-text-tertiary border-b border-border-default">
          <th className="py-2 font-medium">Tool</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium">Date</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => {
          const tool = getToolById(job.tool_id);
          return (
            <tr key={job.id} className="border-b border-border-default last:border-0">
              <td className="py-3 text-text-primary">{tool ? tool.name[locale] : job.tool_id}</td>
              <td className="py-3">
                <span
                  className={
                    job.status === 'done'
                      ? 'text-success'
                      : job.status === 'failed'
                        ? 'text-danger'
                        : 'text-warning'
                  }
                >
                  {job.status}
                </span>
              </td>
              <td className="py-3 text-text-tertiary">{new Date(job.created_at).toLocaleString()}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
