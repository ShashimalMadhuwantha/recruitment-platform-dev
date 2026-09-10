import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const AdminOverviewPage: React.FC = () => {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Super Admin Governance</h1>
          <p className="text-xs text-text-secondary mt-1">Platform-wide metrics, tenant management, and system configuration</p>
        </div>
        <Button variant="secondary" size="sm">System Configuration</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-text-secondary">Registered Companies</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">12</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Active Vacancies</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">48</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">Total Candidates</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">320</p>
        </Card>
        <Card>
          <p className="text-xs text-text-secondary">ATS Scans Executed</p>
          <p className="text-2xl font-bold text-brand-900 mt-1">1,450</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
